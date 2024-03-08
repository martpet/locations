import { Head } from "$fresh/runtime.ts";
import { Handlers, STATUS_CODE } from "$fresh/server.ts";
import { defineRoute } from "$fresh/src/server/defines.ts";
import { chunk } from "$std/collections/chunk.ts";
import { MINUTE } from "$std/datetime/constants.ts";
import { ulid } from "ulid";
import {
  deleteDraft,
  deleteLastDeclinedDraftByUserPlace,
  getDeclinedDraft,
  getDraft,
  getPlace,
  getUploadSession,
  kv,
  listPlaces,
  setDraft,
  setLog,
  setPlace,
} from "../../utils/db.ts";
import { SendEmailMsg } from "../../utils/email.ts";
import { siteEmail, siteTitle } from "../../utils/env.ts";
import { setFlash } from "../../utils/flash.ts";
import { ProcessPhotosMsg } from "../../utils/photos.ts";
import slugify from "../../utils/slugify.ts";
import {
  Address,
  LngLat,
  Log,
  Place,
  PlaceType,
  State,
  UploadSession,
} from "../../utils/types.ts";
import { isSiteOwner } from "../../utils/users.ts";
import PlacesTable from "./(_islands)/PlacesTable.tsx";

export type BasePutPlaceReqData = {
  title: string;
  description?: string;
  address: Address;
  lngLat: LngLat;
  photos: string[];
};

export interface CreatePlaceReqData extends BasePutPlaceReqData {
  editedPlaceId?: never;
  editedPlaceRev?: never;
  editedPlaceType?: never;
  publishedVersionstamp?: never;
  draftVersionstamp?: never;
  uploadSessionId: string;
}
export interface UpdatePlaceReqData extends BasePutPlaceReqData {
  editedPlaceId: string;
  editedPlaceRev: string;
  editedPlaceType: PlaceType;
  publishedVersionstamp: string | null;
  draftVersionstamp: string | null;
  uploadSessionId: string | null;
}

export type PutPlaceReqData = CreatePlaceReqData | UpdatePlaceReqData;

export type PutPlaceRespData = null | {
  id: string;
  isDraft: boolean;
};

export const handler: Handlers<undefined, State> = {
  async GET(_req, ctx) {
    const resp = await ctx.render();
    resp.headers.set("cache-control", `public, max-age=${MINUTE * 30 / 1000}`);
    return resp;
  },
  async PUT(req, ctx) {
    // Check user
    const user = ctx.state.user;
    if (!user) {
      return new Response(null, {
        status: STATUS_CODE.Unauthorized,
      });
    }
    // Check request data
    const reqData = await req.json();
    if (!isCreatePlaceReqData(reqData) && !isUpdatePlaceReqData(reqData)) {
      return new Response(null, {
        status: STATUS_CODE.BadRequest,
      });
    }
    // Get edited place
    let editedPlace: Place | null = null;
    if (reqData.editedPlaceId) {
      if (reqData.editedPlaceType === "draft") {
        const { value } = await getDraft(reqData.editedPlaceId, "strong");
        editedPlace = value;
      } else if (reqData.editedPlaceType === "published") {
        const { value } = await getPlace(reqData.editedPlaceId, "strong");
        editedPlace = value;
      } else if (reqData.editedPlaceType === "declined") {
        const { value } = await getDeclinedDraft(
          reqData.editedPlaceRev,
          "strong",
        );
        editedPlace = value;
      }
      // Handle missing edited place
      if (!editedPlace) {
        const msg = {
          draft: "предната ти редакция вече е обработена. Започни нова",
          published: "постът, който редактираш, вече не съществува",
          declined: "неустановена",
        }[reqData.editedPlaceType];
        const resp = new Response(
          JSON.stringify(null satisfies PutPlaceRespData),
        );
        setFlash(resp, `Грешка: ${msg}`, { type: "error" });
        return resp;
      }
    }
    // Get upload session
    let uploadSession: UploadSession | null = null;
    if (reqData.uploadSessionId) {
      uploadSession = await getUploadSession(
        reqData.uploadSessionId,
        user.id,
      );
      if (!uploadSession) {
        return new Response("bad upload session id", {
          status: STATUS_CODE.BadRequest,
        });
      }
    }
    // Check photos exist in editedPlace or in Upload session
    const photos = reqData.photos.filter((s3Key) =>
      uploadSession?.s3Keys.includes(s3Key) ||
      editedPlace?.photos.includes(s3Key)
    );
    // Clear custom address if non-custom selected
    if (reqData.address.custom && reqData.address.current !== "custom") {
      reqData.address.custom = "";
    }
    // Define place
    const publishDirectly = Boolean(user.isAdmin);
    const rev = ulid();
    const title = reqData.title;
    const place: Place = {
      id: editedPlace?.id || rev,
      slug: await slugify(title),
      firstRevUser: editedPlace?.firstRevUser || user.id,
      firstPubRev: editedPlace?.firstPubRev || (publishDirectly && rev) || null,
      lastPubRev: publishDirectly ? rev : (editedPlace?.lastPubRev || null),
      rev,
      revUser: user.id,
      title,
      description: reqData.description,
      lngLat: reqData.lngLat,
      photos,
      address: reqData.address,
    };
    // Save place to db
    let saveResult;
    const versionstamps = {
      published: reqData.publishedVersionstamp || null,
      draft: reqData.draftVersionstamp || null,
    };
    if (publishDirectly) {
      saveResult = await setPlace(place, versionstamps);
    } else {
      saveResult = await setDraft(place, versionstamps);
    }
    // Handle bad kv commit result (versionstamp mismatch when editing)
    if (!saveResult.ok) {
      const respData: PutPlaceRespData = {
        id: place.id,
        isDraft: !publishDirectly,
      };
      const resp = Response.json(respData);
      const msg = `Изпращането неуспешно. Опитай пак.`;
      setFlash(resp, msg, { type: "error" });
      return resp;
    }
    // Delete user's declined draft
    if (reqData.editedPlaceType === "declined") {
      await deleteLastDeclinedDraftByUserPlace(user.id, reqData.editedPlaceId);
    }
    // Delete users's draft if is publishing directly
    if (reqData.editedPlaceType === "draft" && publishDirectly) {
      await deleteDraft(user.id, reqData.editedPlaceId);
    }
    // Send new photos for processing
    if (uploadSession?.s3Keys.length) {
      const items = uploadSession.s3Keys.map((s3Key) => ({
        s3Key,
        userId: user.id,
        placeId: place.id,
      }));
      const MAX_BATCHES = 2;
      const batchSize = Math.ceil(items.length / MAX_BATCHES);
      const batches = chunk(items, batchSize);
      await Promise.all(batches.map((batch) => {
        const msg: ProcessPhotosMsg = {
          type: "process-photos",
          payload: batch,
        };
        return kv.enqueue(msg);
      }));
    }
    // Log event
    const logRecord: Partial<Log> = {
      id: ulid(),
      user: user.id,
      data: {
        placeId: place.id,
        revId: rev,
        publishDirectly,
        editedPlaceType: reqData.editedPlaceType,
        editedPlaceRev: reqData.editedPlaceRev,
      },
    };
    if (editedPlace) {
      if (publishDirectly) {
        logRecord.type = "place_updated";
      } else if (reqData.editedPlaceType === "draft") {
        logRecord.type = "draft_updated";
      } else {
        logRecord.type = "draft_created";
      }
    } else {
      logRecord.type = publishDirectly ? "place_created" : "draft_created";
    }
    await setLog(logRecord as Log);
    // Notify admin by email
    if (!isSiteOwner(user) && reqData.editedPlaceType !== "draft") {
      let url = `${ctx.url.origin}/${place.slug}`;
      if (!publishDirectly) url = `/places/${place.id}/draft`;
      const title = editedPlace?.title || place.title;
      const notification: SendEmailMsg = {
        type: "send-email",
        payload: {
          to: siteEmail(),
          subject: `${
            publishDirectly ? "Нов пост" : "Нова редакция"
          }: ${title}`,
          body: url,
        },
      };
      await kv.enqueue(notification);
    }
    // Send success response
    const msg = editedPlace
      ? `Промяната е ${publishDirectly ? "публикувана" : "изпратена"}`
      : `Постът е ${publishDirectly ? "публикуван" : "изпратен"}`;
    const respData: PutPlaceRespData = {
      id: place.id,
      isDraft: !publishDirectly,
    };
    const resp = Response.json(respData);
    setFlash(resp, msg);
    return resp;
  },
};

function isBasePutPlaceReqData(o: unknown): o is BasePutPlaceReqData {
  const obj = o as Partial<BasePutPlaceReqData>;
  return typeof obj === "object" && obj !== null &&
    typeof obj.title === "string" &&
    (typeof obj.description === "string" ||
      typeof obj.description === "undefined") &&
    (Array.isArray(obj.lngLat) &&
      obj.lngLat.length === 2 &&
      typeof obj.lngLat[0] === "number" &&
      typeof obj.lngLat[1] === "number") &&
    typeof obj.address?.esri === "string" &&
    typeof obj.address.here === "string" &&
    typeof obj.address.current === "string" &&
    (Array.isArray(obj.photos) &&
      (obj.photos.every((x) => typeof x === "string")));
}

function isCreatePlaceReqData(o: unknown): o is CreatePlaceReqData {
  const obj = o as Partial<CreatePlaceReqData>;
  return isBasePutPlaceReqData(o) &&
    typeof obj.editedPlaceId === "undefined" &&
    typeof obj.editedPlaceRev === "undefined" &&
    typeof obj.editedPlaceType === "undefined" &&
    typeof obj.publishedVersionstamp === "undefined" &&
    typeof obj.draftVersionstamp === "undefined" &&
    (typeof obj.uploadSessionId === "string" && obj.uploadSessionId !== "");
}

function isUpdatePlaceReqData(o: unknown): o is UpdatePlaceReqData {
  const obj = o as Partial<UpdatePlaceReqData>;
  return isBasePutPlaceReqData(o) &&
    typeof obj.editedPlaceId === "string" &&
    typeof obj.editedPlaceRev === "string" &&
    (obj.editedPlaceType === "published" ||
      obj.editedPlaceType === "draft" ||
      obj.editedPlaceType === "declined") &&
    (typeof obj.publishedVersionstamp === "string" ||
      obj.publishedVersionstamp === null) &&
    ((typeof obj.draftVersionstamp === "string" &&
      obj.draftVersionstamp !== "") ||
      obj.draftVersionstamp === null) &&
    ((typeof obj.uploadSessionId === "string" && obj.uploadSessionId !== "") ||
      obj.uploadSessionId === null);
}

export default defineRoute(async () => {
  const places = await listPlaces();

  return (
    <>
      <Head>
        <title>{siteTitle()} | списък</title>
      </Head>
      <PlacesTable places={places} />
    </>
  );
});

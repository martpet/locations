import { Head } from "$fresh/runtime.ts";
import { defineRoute, Handlers } from "$fresh/server.ts";
import { ulid } from "ulid";
import Button from "../../../../../components/Button.tsx";
import Highlight from "../../../../../components/Highlight.tsx";
import Input, { TextArea } from "../../../../../components/Input.tsx";
import Label from "../../../../../components/Label.tsx";
import { CAN_EMAIL_UNVERIFIED_IDENTITIES } from "../../../../../utils/consts.ts";
import {
  deleteDraft,
  getDraft,
  getPlace,
  getPlaceBySlug,
  getUser,
  kv,
  setAlert,
  setDeclinedDraft,
  setLog,
  setPlace,
} from "../../../../../utils/db.ts";
import { SendEmailMsg } from "../../../../../utils/email.ts";
import { siteTitle } from "../../../../../utils/env.ts";
import { setFlash } from "../../../../../utils/flash.ts";
import { State } from "../../../../../utils/types.ts";

interface BasePostReqData {
  draftVersionstamp: string;
  publishedVersionstamp?: string;
}

interface ApprovePostReqData extends BasePostReqData {
  result: "approve";
  reason?: never;
}

interface DeclinePostReqData extends BasePostReqData {
  result: "decline";
  reason: string;
}

export const handler: Handlers<undefined, State> = {
  async POST(req, ctx) {
    const user = ctx.state.user!;
    // Check request data
    const reqData = Object.fromEntries(await req.formData());
    if (!isApprovePostReqData(reqData) && !isDeclinePostReqData(reqData)) {
      return new Response("bad data", { status: 400 });
    }
    const isApproved = reqData.result === "approve";
    // Prepare response object
    const adminPlacesResp = new Response(null, {
      status: 303,
      headers: { location: `/admin/places` },
    });
    // Get current draft
    const { value: draft } = await getDraft(ctx.params.id);
    if (!draft) {
      setFlash(adminPlacesResp, "Черновата вече не съществува", {
        type: "error",
      });
      return adminPlacesResp;
    }
    // Save evaluation to db
    let ok;
    if (isApproved) {
      const approvedPlace = {
        ...draft,
        firstPubRev: draft.firstPubRev || draft.rev,
        lastPubRev: draft.rev,
      };
      const versionstamps = {
        published: reqData.publishedVersionstamp || null,
        draft: reqData.draftVersionstamp,
      };
      ({ ok } = await setPlace(approvedPlace, versionstamps));
    } else {
      ({ ok } = await setDeclinedDraft({
        ...draft,
        reasonDeclined: reqData.reason,
        dateDeclined: new Date(),
      }));
    }
    if (!ok) {
      setFlash(adminPlacesResp, "Ревизията не е актуална", { type: "error" });
      return adminPlacesResp;
    }
    const promises = [];
    // Delete current draft
    promises.push(deleteDraft(draft.revUser, draft.id));
    // Log event
    promises.push(setLog({
      id: ulid(),
      type: isApproved ? "draft_approved" : "draft_declined",
      user: user.id,
      data: {
        revId: draft.rev,
        placeId: draft.id,
        reason: reqData.reason,
      },
    }));
    // Notify draft user
    const draftUser = await getUser(draft.revUser);
    if (draftUser) {
      let draftUrl = `${ctx.url.origin}/places/${draft.id}`;
      if (!isApproved) draftUrl += "/declined";
      const reasonText = reqData.reason ? `. Причина: ${reqData.reason}` : "";
      const title = (isApproved ? "Одобрен" : "Отказан") +
        (draft.firstPubRev ? " a промяна" : " пост");

      promises.push(setAlert({
        id: ulid(),
        userId: draftUser?.id,
        title,
        body: `[${draft.title}](${draftUrl})` + reasonText,
      }));
      if (CAN_EMAIL_UNVERIFIED_IDENTITIES) {
        const notification: SendEmailMsg = {
          type: "send-email",
          payload: {
            to: draftUser.gUser.email,
            subject: title,
            body: draft.title + " — " + draftUrl + reasonText,
          },
        };
        promises.push(kv.enqueue(notification));
      }
    }
    await Promise.all(promises);
    // Send response
    const msg = draft.firstPubRev
      ? `Постът e ${isApproved ? `одобрен` : `отказан`}`
      : `Редакцията e ${isApproved ? `публикувана` : `отказана`}`;
    setFlash(adminPlacesResp, msg);
    return adminPlacesResp;
  },
};

function isBasePostReqData(o: unknown): o is BasePostReqData {
  const obj = o as Partial<ApprovePostReqData>;
  return typeof obj === "object" && obj !== null &&
    typeof obj.draftVersionstamp === "string" &&
    (typeof obj.publishedVersionstamp === "string" ||
      typeof obj.publishedVersionstamp === "undefined");
}

function isApprovePostReqData(o: unknown): o is ApprovePostReqData {
  const obj = o as Partial<ApprovePostReqData>;
  return isBasePostReqData(o) &&
    obj.result === "approve";
}

function isDeclinePostReqData(o: unknown): o is DeclinePostReqData {
  const obj = o as Partial<DeclinePostReqData>;
  return isBasePostReqData(o) &&
    obj.result === "decline" &&
    typeof obj.reason === "string";
}

export default defineRoute(async (_req, ctx) => {
  const [
    { value: draft, versionstamp: draftVersionstamp },
    { versionstamp: publishedVersionstamp },
  ] = await Promise.all([
    getDraft(ctx.params.id, "strong"),
    getPlace(ctx.params.id, "strong"),
  ]);
  if (!draft || !draftVersionstamp) {
    return ctx.renderNotFound();
  }
  const { value: placeBySlug } = await getPlaceBySlug(draft.slug);
  const isSlugUnique = !placeBySlug || placeBySlug.id === draft.id;
  return (
    <>
      <Head>
        <title>
          Админ | Оцени {draft.firstPubRev ? "редакция" : "пост"}: {draft.title}
          {" "}
          | {siteTitle()}
        </title>
      </Head>
      <header>
        <h1>
          <span class="block mb-1">
            Одобри или откажи {draft.firstPubRev ? "редакция" : "нов пост"}:
          </span>
          <a class="text-lg" href={`/places/${draft.id}/draft`}>
            {draft.title}
          </a>
        </h1>
      </header>
      <div class="max-w-md">
        {!isSlugUnique && (
          <p>
            <Highlight type="error">Има друг пост с такова заглавие.</Highlight>
          </p>
        )}
        {isSlugUnique && (
          <section>
            <h2>Одобри</h2>
            <form method="post">
              <input name="result" type="hidden" value="approve" />
              <input
                type="hidden"
                name="draftVersionstamp"
                value={draftVersionstamp}
              />
              {publishedVersionstamp && (
                <input
                  type="hidden"
                  name="publishedVersionstamp"
                  value={publishedVersionstamp}
                />
              )}
              <Button>Одобри</Button>
              <Input type="checkbox" class="ml-1" required />
            </form>
          </section>
        )}
        <section>
          <h2>Откажи</h2>
          <form method="post">
            <input type="hidden" name="result" value="decline" />
            <input
              type="hidden"
              name="draftVersionstamp"
              value={draftVersionstamp}
            />
            {publishedVersionstamp && (
              <input
                type="hidden"
                name="publishedVersionstamp"
                value={publishedVersionstamp}
              />
            )}
            <Label>
              Причина (видима за автора)
              <TextArea name="reason" cols={30} rows={3} required />
            </Label>
            <Button>Откажи</Button>
            <Input type="checkbox" class="ml-1" required />
          </form>
        </section>
      </div>
    </>
  );
});

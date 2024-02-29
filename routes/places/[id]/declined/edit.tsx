import { Head } from "$fresh/runtime.ts";
import { STATUS_CODE } from "$fresh/server.ts";
import { defineRoute } from "$fresh/src/server/defines.ts";
import AnotherUserDraftMsg from "../../(_components)/AnotherUserDraftMsg.tsx";
import AnotherUserRevMsg from "../../(_components)/AnotherUserRevMsg.tsx";
import EditPlaceHeading from "../../(_components)/EditPlaceHeading.tsx";
import PlaceForm from "../../(_islands)/PlaceForm.tsx";
import {
  getDraft,
  getLastDeclinedDraftByUserPlace,
  getPlace,
} from "../../../../utils/db.ts";
import { photosOrigin, siteTitle } from "../../../../utils/env.ts";
import { loginRedirect } from "../../../../utils/resp.ts";
import { State } from "../../../../utils/types.ts";

export default defineRoute<State>(async (_req, ctx) => {
  const user = ctx.state.user;
  if (!user) {
    return loginRedirect(ctx.url);
  }
  const [
    { value: declinedDraft },
    { value: currentDraft, versionstamp: draftVersionstamp },
    { value: place, versionstamp: publishedVersionstamp },
  ] = await Promise.all([
    getLastDeclinedDraftByUserPlace(user.id, ctx.params.id, "strong"),
    getDraft(ctx.params.id, "strong"),
    getPlace(ctx.params.id, "strong"),
  ]);
  if (!declinedDraft) {
    return new Response(null, {
      status: STATUS_CODE.SeeOther,
      headers: { location: "/profile" },
    });
  }
  const isPlaceUpdated = place && place.rev > declinedDraft.rev;
  const isOutdated = isPlaceUpdated || currentDraft;
  return (
    <>
      <Head>
        <title>
          Редактирай{" "}
          {declinedDraft.firstPubRev ? "отказана редакция" : "отказан пост"}:
          {" "}
          {declinedDraft.title} | {siteTitle()}
        </title>
      </Head>
      <EditPlaceHeading place={place || declinedDraft} />
      {currentDraft && <AnotherUserDraftMsg />}
      {isPlaceUpdated && !currentDraft && <AnotherUserRevMsg />}
      {!isOutdated && (
        <PlaceForm
          editedPlace={declinedDraft}
          editedPlaceType="declined"
          publishedVersionstamp={publishedVersionstamp}
          draftVersionstamp={draftVersionstamp}
          photosOrigin={photosOrigin()}
        />
      )}
    </>
  );
});

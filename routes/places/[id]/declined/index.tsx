import { Head } from "$fresh/runtime.ts";
import { defineRoute } from "$fresh/src/server/defines.ts";
import PlaceArticle from "../../(_components)/PlaceArticle.tsx";
import {
  getLastDeclinedDraftByUserPlace,
  getRev,
} from "../../../../utils/db.ts";
import { photosOrigin, siteTitle } from "../../../../utils/env.ts";
import { sanitizePlace } from "../../../../utils/places.ts";
import { loginRedirect } from "../../../../utils/resp.ts";
import { State } from "../../../../utils/types.ts";

export default defineRoute<State>(async (_req, ctx) => {
  let prevRev;
  let declinedDraftUser;
  const placeId = ctx.params.id;
  const user = ctx.state.user;
  const editLink = `${ctx.url.pathname}/edit`;
  if (!user) {
    return loginRedirect(ctx.url);
  }
  const { value: declinedDraft } = await getLastDeclinedDraftByUserPlace(
    user.id,
    placeId,
  );
  if (!declinedDraft) {
    return new Response(null, {
      status: 303,
      headers: { location: user.isAdmin ? "/admin/places" : "/profile" },
    });
  }
  const isOwner = user.id === declinedDraft.revUser;
  if (!isOwner) {
    return new Response(null, { status: 403 });
  } else if (user.isAdmin) {
    declinedDraftUser = user;
  }
  if (declinedDraft.lastPubRev) {
    prevRev = await getRev(placeId, declinedDraft.lastPubRev);
  }
  return (
    <>
      <Head>
        <title>
          {prevRev ? "Отказана редакция" : "Отказан пост"}:{" "}
          {declinedDraft.title} | {siteTitle()}
        </title>
      </Head>
      <PlaceArticle
        place={await sanitizePlace(declinedDraft)}
        editLink={editLink}
        prevRev={prevRev}
        draftUser={declinedDraftUser}
        pathname={ctx.url.pathname}
        photosOrigin={photosOrigin()}
      />
    </>
  );
});

import { Head } from "$fresh/runtime.ts";
import { defineRoute } from "$fresh/server.ts";
import {
  getDeclinedDraft,
  getDraft,
  getDraftRev,
  getUser,
} from "../../../../../../utils/db.ts";
import { photosOrigin, siteTitle } from "../../../../../../utils/env.ts";
import { sanitizePlace } from "../../../../../../utils/places.ts";
import { State } from "../../../../../../utils/types.ts";
import PlaceArticle from "../../../../../places/(_components)/PlaceArticle.tsx";

export default defineRoute<State>(async (_req, ctx) => {
  const rev = await getDraftRev(ctx.params.id, ctx.params.rev_id);
  if (!rev) {
    return ctx.renderNotFound();
  }

  const [revUser, { value: draft }, { value: declinedDraft }] = await Promise
    .all([
      getUser(rev.revUser),
      getDraft(rev.id),
      getDeclinedDraft(rev.rev),
    ]);

  if (!revUser) {
    throw new Error("missing draft user");
  }

  let lastPubRev;
  const lastPubRevId = draft?.lastPubRev || declinedDraft?.lastPubRev;
  if (lastPubRevId) {
    lastPubRev = await getDraftRev(ctx.params.id, lastPubRevId);
  }

  return (
    <>
      <Head>
        <title>Админ | Ревизия: {rev.title} | {siteTitle()}</title>
      </Head>
      <PlaceArticle
        place={await sanitizePlace(declinedDraft || rev)}
        isDraft={!!draft && !declinedDraft}
        isApprovedDraft={!draft && !declinedDraft}
        isAdmin
        prevRev={lastPubRev}
        draftUser={revUser}
        pathname={ctx.url.pathname}
        photosOrigin={photosOrigin()}
      />
    </>
  );
});

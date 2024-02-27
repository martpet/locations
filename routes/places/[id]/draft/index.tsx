import { Head } from "$fresh/runtime.ts";
import { defineRoute } from "$fresh/server.ts";
import PlaceArticle from "../../(_components)/PlaceArticle.tsx";
import { getDraft, getRev, getUser } from "../../../../utils/db.ts";
import { photosOrigin, siteTitle } from "../../../../utils/env.ts";
import { sanitizePlace } from "../../../../utils/places.ts";
import { loginRedirect } from "../../../../utils/resp.ts";
import { State } from "../../../../utils/types.ts";

export default defineRoute<State>(async (_req, ctx) => {
  let prevRev;
  let editLink;
  let draftUser;
  const placeId = ctx.params.id;
  const user = ctx.state.user;
  if (!user) {
    return loginRedirect(ctx.url);
  }
  const { value: draft } = await getDraft(placeId, "strong");
  const isOwner = user.id === draft?.revUser;
  if (!draft && user.isAdmin) {
    return new Response(null, {
      status: 303,
      headers: { location: "/admin/places" },
    });
  } else if (!draft || (!isOwner && !user.isAdmin)) {
    return new Response(null, {
      status: 303,
      headers: { location: "/profile" },
    });
  }
  if (draft.lastPubRev) {
    prevRev = await getRev(placeId, draft.lastPubRev, "strong");
  }
  if (isOwner) {
    editLink = `${ctx.url.pathname}/edit`;
    if (user.isAdmin) draftUser = user;
  } else if (user.isAdmin) {
    draftUser = await getUser(draft.revUser);
    if (!draftUser) throw new Error("missing draft user");
  }
  return (
    <>
      <Head>
        <title>Очакващ одобрение: {draft.title} | {siteTitle()}</title>
      </Head>
      <PlaceArticle
        place={await sanitizePlace(draft)}
        editLink={editLink}
        isDraft
        isAdmin={user.isAdmin!}
        prevRev={prevRev}
        draftUser={draftUser}
        pathname={ctx.url.pathname}
        photosOrigin={photosOrigin()}
      />
    </>
  );
});

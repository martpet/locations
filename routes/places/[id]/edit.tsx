import { Head } from "$fresh/runtime.ts";
import { FreshContext, STATUS_CODE } from "$fresh/server.ts";
import { defineRoute } from "$fresh/src/server/defines.ts";
import { MINUTE } from "$std/datetime/constants.ts";
import AnotherUserDraftMsg from "../(_components)/AnotherUserDraftMsg.tsx";
import EditPlaceHeading from "../(_components)/EditPlaceHeading.tsx";
import PlaceForm from "../(_islands)/PlaceForm.tsx";
import { getDraft, getPlace } from "../../../utils/db.ts";
import { photosOrigin, siteTitle } from "../../../utils/env.ts";

import { loginRedirect } from "../../../utils/resp.ts";
import { State } from "../../../utils/types.ts";

export async function handler(_req: Request, ctx: FreshContext) {
  const resp = await ctx.render();
  resp.headers.set("cache-control", `public, max-age=${MINUTE * 30 / 1000}`);
  return resp;
}

export default defineRoute<State>(async (_req, ctx) => {
  const user = ctx.state.user;
  if (!user) {
    return loginRedirect(ctx.url);
  }
  const [
    { value: place, versionstamp: publishedVersionstamp },
    { value: draft, versionstamp: draftVersionstamp },
  ] = await Promise.all([
    getPlace(ctx.params.id, "strong"),
    getDraft(ctx.params.id, "strong"),
  ]);
  if (!place) {
    return ctx.renderNotFound();
  }
  const isDraftOwner = user.id === draft?.revUser;
  if (isDraftOwner) {
    return new Response(null, {
      status: STATUS_CODE.SeeOther,
      headers: { location: "./draft/edit" },
    });
  }
  return (
    <>
      <Head>
        <title>Редактирай: {place.title} | {siteTitle()}</title>
      </Head>
      <EditPlaceHeading place={place} />
      {draft ? <AnotherUserDraftMsg /> : (
        <PlaceForm
          editedPlace={place}
          editedPlaceType="published"
          publishedVersionstamp={publishedVersionstamp}
          draftVersionstamp={draftVersionstamp}
          photosOrigin={photosOrigin()}
          isAdmin={user.isAdmin}
        />
      )}
    </>
  );
});

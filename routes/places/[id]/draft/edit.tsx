import { defineRoute, STATUS_CODE } from "$fresh/server.ts";
import { Head } from "$fresh/src/runtime/head.ts";
import EditPlaceHeading from "../../(_components)/EditPlaceHeading.tsx";
import PlaceDraftHeader from "../../(_components)/PlaceDraftHeader.tsx";
import PlaceForm from "../../(_islands)/PlaceForm.tsx";
import { getDraft, getPlace } from "../../../../utils/db.ts";
import { photosOrigin, siteTitle } from "../../../../utils/env.ts";
import { loginRedirect } from "../../../../utils/resp.ts";
import { State } from "../../../../utils/types.ts";

export default defineRoute<State>(async (_req, ctx) => {
  const user = ctx.state.user;
  if (!user) {
    return loginRedirect(ctx.url);
  }
  const [
    { value: draft, versionstamp: draftVersionstamp },
    { value: place, versionstamp: publishedVersionstamp },
  ] = await Promise.all(
    [
      getDraft(ctx.params.id, "strong"),
      getPlace(ctx.params.id, "strong"),
    ],
  );
  const isDraftOwner = user.id === draft?.revUser;
  if (!draft || !isDraftOwner) {
    return new Response(null, {
      status: STATUS_CODE.SeeOther,
      headers: { location: "/profile" },
    });
  }
  return (
    <>
      <Head>
        <title>Редактирай: {draft.title} | {siteTitle()}</title>
      </Head>
      <PlaceDraftHeader
        place={draft}
        prevRev={place}
        isDraft={true}
        pathname={ctx.url.pathname}
        photosOrigin={photosOrigin()}
      />
      <EditPlaceHeading place={place || draft} />
      <PlaceForm
        editedPlace={draft}
        editedPlaceType="draft"
        publishedVersionstamp={publishedVersionstamp}
        draftVersionstamp={draftVersionstamp}
        photosOrigin={photosOrigin()}
      />
    </>
  );
});

import { Head } from "$fresh/runtime.ts";
import { defineRoute, Handler } from "$fresh/server.ts";
import { getPlaceBySlug, getUser } from "../../utils/db.ts";
import { photosOrigin, siteTitle } from "../../utils/env.ts";
import { sanitizePlace } from "../../utils/places.ts";
import { State } from "../../utils/types.ts";
import PlaceArticle from "../places/(_components)/PlaceArticle.tsx";

export const handler: Handler = async (_req, ctx) => {
  const resp = await ctx.render();
  resp.headers.set("cache-control", "public, max-age=1800");
  return resp;
};

export default defineRoute<State>(async (_req, ctx) => {
  let firstPubUser;
  const { value: place } = await getPlaceBySlug(
    ctx.params.slug,
    ctx.state.user ? "strong" : "eventual",
  );
  if (!place) {
    return ctx.renderNotFound();
  }
  if (place.firstRevUser === ctx.state.user?.id) {
    firstPubUser = ctx.state.user;
  } else {
    firstPubUser = await getUser(place.firstRevUser);
    if (!firstPubUser) throw new Error("missing place first rev user");
  }
  return (
    <>
      <Head>
        <title>{place.title} | {siteTitle()}</title>
      </Head>
      <PlaceArticle
        place={await sanitizePlace(place)}
        editLink={`/places/${place.id}/edit`}
        createdBy={firstPubUser}
        photosOrigin={photosOrigin()}
      />
    </>
  );
});

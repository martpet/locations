import { FreshContext } from "$fresh/server.ts";
import { defineRoute } from "$fresh/src/server/defines.ts";
import { MINUTE } from "$std/datetime/constants.ts";
import MapView from "../islands/MapView.tsx";
import { listPlaces } from "../utils/db.ts";
import { getEnv, photosOrigin } from "../utils/env.ts";
import { placesToGeoJson } from "../utils/places.ts";
import { State } from "../utils/types.ts";

export async function handler(_req: Request, ctx: FreshContext) {
  const resp = await ctx.render();
  resp.headers.set("cache-control", `public, max-age=${MINUTE * 30 / 1000}`);
  return resp;
}

export default defineRoute<State>(async () => {
  const places = await listPlaces();
  const apiKey = getEnv("MAP_API_KEY");
  const geojson = placesToGeoJson(places, photosOrigin());
  return <MapView geojson={geojson} apiKey={apiKey} />;
});

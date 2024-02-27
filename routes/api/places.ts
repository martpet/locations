import { Handler } from "$fresh/server.ts";
import { listPlaces } from "../../utils/db.ts";
import { photosOrigin } from "../../utils/env.ts";
import { State } from "../../utils/types.ts";

export const handler: Handler<undefined, State> = async (_req, ctx) => {
  const places = await listPlaces();
  const items = places.map((place) => ({
    url: new URL(`/${place.slug}`, ctx.url.origin).href,
    title: place.title,
    lngLat: place.lngLat,
    photo: `${photosOrigin()}/${place.photos[0]}`,
  }));
  return Response.json(items);
};

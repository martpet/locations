import { Handler } from "$fresh/server.ts";
import { getPlace } from "../../../utils/db.ts";

export const handler: Handler = async (_req, ctx) => {
  const { value: place } = await getPlace(ctx.params.id);
  if (!place) {
    return ctx.renderNotFound();
  }
  return new Response(null, {
    status: 301,
    headers: {
      location: "/" + place.slug,
    },
  });
};

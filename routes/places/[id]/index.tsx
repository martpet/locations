import { Handler, STATUS_CODE } from "$fresh/server.ts";
import { getPlace } from "../../../utils/db.ts";

export const handler: Handler = async (_req, ctx) => {
  const { value: place } = await getPlace(ctx.params.id);
  if (!place) {
    return ctx.renderNotFound();
  }
  return new Response(null, {
    status: STATUS_CODE.MovedPermanently,
    headers: {
      location: "/" + place.slug,
    },
  });
};

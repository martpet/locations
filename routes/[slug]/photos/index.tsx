import { Handler, STATUS_CODE } from "$fresh/server.ts";

export const handler: Handler = (_req, ctx) => {
  return new Response(null, {
    status: STATUS_CODE.MovedPermanently,
    headers: {
      location: "/" + ctx.params.slug,
    },
  });
};

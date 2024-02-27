import { Handler } from "$fresh/server.ts";

export const handler: Handler = (_req, ctx) => {
  return new Response(null, {
    status: 301,
    headers: {
      location: "/" + ctx.params.slug,
    },
  });
};

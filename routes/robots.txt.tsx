import { FreshContext } from "$fresh/server.ts";

export const handler = (_req: Request, ctx: FreshContext) => {
  const txt = `sitemap: ${ctx.url.origin}/sitemap.xml`;
  return new Response(txt);
};

import { FreshContext } from "$fresh/server.ts";
import { CACHE_FOREVER_PARAM } from "../utils/consts.ts";
import { flashMiddleware } from "../utils/flash.ts";
import { sessionMiddleware } from "../utils/session.ts";
import { State } from "../utils/types.ts";

export const handler = [
  mainMiddleware,
  sessionMiddleware,
  flashMiddleware,
];

async function mainMiddleware(_req: Request, ctx: FreshContext<State>) {
  const resp = await ctx.next();
  if (ctx.url.searchParams.has(CACHE_FOREVER_PARAM)) {
    resp.headers.set("cache-control", "public, max-age=31536000, immutable");
  }
  return resp;
}

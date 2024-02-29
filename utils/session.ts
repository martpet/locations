import { FreshContext, STATUS_CODE } from "$fresh/server.ts";
import { getCookies } from "$std/http/cookie.ts";
import { SESSION_COOKIE } from "../routes/oauth/callback.ts";
import { ASSETS_EXTENSIONS } from "./consts.ts";
import { getUserBySession } from "./db.ts";
import { State } from "./types.ts";

const assetsExtRegex = new RegExp(ASSETS_EXTENSIONS.join("|"));

export async function sessionMiddleware(
  req: Request,
  ctx: FreshContext<State>,
) {
  if (assetsExtRegex.test(ctx.url.pathname) || req.method === "OPTIONS") {
    return ctx.next();
  }
  const session = getCookies(req.headers)[SESSION_COOKIE];
  if (session) {
    ctx.state.session = session;
    ctx.state.user = await getUserBySession(session);
  }
  if (ctx.state.user?.isBanned) {
    return new Response(ctx.state.user.banUserMsg, {
      status: STATUS_CODE.Forbidden,
    });
  }
  const resp = await ctx.next();
  if (session && !ctx.state.noCacheOverride) {
    resp.headers.set("cache-control", "private");
  }
  resp.headers.set("vary", "Cookie");
  return resp;
}

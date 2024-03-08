import { FreshContext, STATUS_CODE } from "$fresh/server.ts";
import { getEnv } from "../utils/env.ts";
import { flashMiddleware } from "../utils/flash.ts";
import { sessionMiddleware } from "../utils/session.ts";
import { State } from "../utils/types.ts";

export const handler = [
  sessionMiddleware,
  flashMiddleware,

  function mainMiddleware(_: Request, ctx: FreshContext<State>) {
    // Redirect defualt Deno prod host to 'demo' branch
    if (ctx.url.host === getEnv("PROD_HOST_DENO") && !ctx.state.user?.isAdmin) {
      return new Response(null, {
        status: STATUS_CODE.MovedPermanently,
        headers: { location: "https://locations--demo.deno.dev" },
      });
    }
    return ctx.next();
  },
];

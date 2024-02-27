import { FreshContext } from "$fresh/server.ts";
import { loginRedirect } from "../../utils/resp.ts";
import { State } from "../../utils/types.ts";

export function handler(_req: Request, ctx: FreshContext<State>) {
  const user = ctx.state.user;
  if (!user) {
    return loginRedirect(ctx.url);
  }
  return ctx.next();
}

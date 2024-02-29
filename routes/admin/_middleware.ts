import { FreshContext, STATUS_CODE } from "$fresh/server.ts";
import { State } from "../../utils/types.ts";

export function handler(_req: Request, ctx: FreshContext<State>) {
  const user = ctx.state.user;
  if (!user?.isAdmin) {
    return new Response(null, {
      headers: { location: "/" },
      status: STATUS_CODE.SeeOther,
    });
  }
  return ctx.next();
}

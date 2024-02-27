import { FreshContext } from "$fresh/server.ts";
import { deleteCookie } from "$std/http/cookie.ts";
import { deleteUserSession } from "../../utils/db.ts";
import { State } from "../../utils/types.ts";
import { SESSION_COOKIE } from "./callback.ts";

export async function handler(_req: Request, ctx: FreshContext<State>) {
  if (ctx.state.session) {
    await deleteUserSession(ctx.state.session);
  }
  const resp = new Response("Logged out", {
    headers: { Location: "/" },
    status: 303,
  });
  deleteCookie(resp.headers, SESSION_COOKIE, { path: "/" });
  return resp;
}

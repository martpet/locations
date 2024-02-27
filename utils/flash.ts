import { FreshContext } from "$fresh/server.ts";
import { deleteCookie, getCookies, setCookie } from "$std/http/cookie.ts";
import { Flash, State } from "./types.ts";

export const FLASH_COOKIE = "flash";

interface SetFlashOptions {
  type: Flash["type"];
}

export function setFlash(
  resp: Response,
  msg: string,
  opt?: SetFlashOptions,
) {
  const flash: Flash = { msg, type: opt?.type };
  setCookie(resp.headers, {
    name: FLASH_COOKIE,
    value: encodeURIComponent(JSON.stringify(flash)),
    path: "/",
    httpOnly: true,
  });
}

export async function flashMiddleware(req: Request, ctx: FreshContext<State>) {
  const flash = getCookies(req.headers)[FLASH_COOKIE];
  if (flash) ctx.state.flash = JSON.parse(decodeURIComponent(flash));
  const resp = await ctx.next();
  if (flash) deleteCookie(resp.headers, FLASH_COOKIE);
  return resp;
}

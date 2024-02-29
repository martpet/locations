import { FreshContext, STATUS_CODE } from "$fresh/server.ts";
import { setCookie } from "$std/http/cookie.ts";
import { setOauthSession } from "../../utils/db.ts";
import {
  getOauthClient,
  OAUTH_SESSION_COOKIE,
  OAUTH_SESSION_EXPIRES_SEC,
} from "../../utils/oauth.ts";
import { State } from "../../utils/types.ts";

export const REDIRECT_PARAM = "redirect";

export async function handler(_req: Request, ctx: FreshContext<State>) {
  const { origin, searchParams } = ctx.url;
  const state = encodeURI(JSON.stringify({
    nonce: crypto.randomUUID(),
    origin,
  }));
  const oauthClient = getOauthClient(ctx);
  const oauthSession = crypto.randomUUID();
  const authUri = await oauthClient.code.getAuthorizationUri({ state });
  const { uri, codeVerifier } = authUri;
  setOauthSession(oauthSession, {
    state,
    codeVerifier,
    redirect: searchParams.get(REDIRECT_PARAM),
  });
  const resp = new Response("Redirecting...", {
    headers: { location: uri.href },
    status: STATUS_CODE.SeeOther,
  });
  setCookie(resp.headers, {
    name: OAUTH_SESSION_COOKIE,
    value: oauthSession,
    path: "/",
    httpOnly: true,
    maxAge: OAUTH_SESSION_EXPIRES_SEC,
  });
  return resp;
}

import { STATUS_CODE } from "$fresh/server.ts";
import { REDIRECT_PARAM } from "../routes/oauth/signin.ts";

export function loginRedirect(urlOrString: URL | string) {
  const url = new URL(urlOrString);
  return new Response(null, {
    status: STATUS_CODE.SeeOther,
    headers: { location: loginLink(url.pathname) },
  });
}

export function loginLink(redirect: string) {
  return `/oauth/signin?${REDIRECT_PARAM}=${encodeURIComponent(redirect)}`;
}

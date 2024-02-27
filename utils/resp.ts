import { REDIRECT_PARAM } from "../routes/oauth/signin.ts";

export function loginRedirect(urlOrString: URL | string) {
  const url = new URL(urlOrString);
  return new Response(null, {
    status: 303,
    headers: { location: loginLink(url.pathname) },
  });
}

export function loginLink(redirect: string) {
  return `/oauth/signin?${REDIRECT_PARAM}=${encodeURIComponent(redirect)}`;
}

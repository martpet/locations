import { FreshContext } from "$fresh/server.ts";
import { OAuth2Client } from "oauth2_client";
import { getEnv, googleClientId, googleClientSecret, isProd } from "./env.ts";
import { State } from "./types.ts";

export const OAUTH_SESSION_COOKIE = "oauth-session";
export const SESSION_EXPIRES_SEC = 60 * 60 * 24 * 365;
export const OAUTH_SESSION_EXPIRES_SEC = 60 * 60 * 24;

export function getOauthClient(ctx: FreshContext<State>) {
  const redirectUriBase = isProd() ? ctx.url.origin : getEnv("OAUTH_PROXY");

  const authorizationEndpointUri = isProd()
    ? "https://accounts.google.com/o/oauth2/v2/auth"
    : getEnv("OAUTH_PROXY");

  return new OAuth2Client({
    clientId: googleClientId(),
    clientSecret: googleClientSecret(),
    authorizationEndpointUri,
    tokenUri: "https://oauth2.googleapis.com/token",
    redirectUri: redirectUriBase + "/oauth/callback",
    defaults: {
      scope: ["profile", "email"],
    },
  });
}

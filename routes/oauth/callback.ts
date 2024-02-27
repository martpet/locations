import { FreshContext } from "$fresh/server.ts";
import { deleteCookie, getCookies, setCookie } from "$std/http/cookie.ts";
import { ulid } from "ulid";
import {
  getOauthSession,
  getUserByGoogleId,
  setAlert,
  setLog,
  setUser,
  setUserSession,
} from "../../utils/db.ts";
import { siteEmail } from "../../utils/env.ts";
import { fetchGoogleUser } from "../../utils/google.ts";
import {
  getOauthClient,
  OAUTH_SESSION_COOKIE,
  SESSION_EXPIRES_SEC,
} from "../../utils/oauth.ts";
import { State } from "../../utils/types.ts";
import { isSiteOwner } from "../../utils/users.ts";

export const SESSION_COOKIE = "session";

export async function handler(req: Request, ctx: FreshContext<State>) {
  // Get oauth session id from cookie
  const oauthSessionId = getCookies(req.headers)[OAUTH_SESSION_COOKIE];
  if (!oauthSessionId) {
    return new Response("Missing OAuth session cookie", {
      status: 400,
    });
  }
  // Get oauth session from db
  const oauthSession = await getOauthSession(oauthSessionId);
  if (!oauthSession) {
    return new Response("Missing OAuth session", {
      status: 400,
    });
  }
  // Exchange oauth response code for tokens
  const { state, codeVerifier, redirect } = oauthSession;
  const client = getOauthClient(ctx);
  const tokens = await client.code.getToken(req.url, { state, codeVerifier });

  // Fetch google user and db user
  const gUser = await fetchGoogleUser(tokens.accessToken);
  let user = await getUserByGoogleId(gUser.id);
  let isNewUser;

  // Save user and session to db
  const promises: Promise<unknown>[] = [];
  if (user && JSON.stringify(user.gUser) !== JSON.stringify(gUser)) {
    user.gUser = gUser;
    promises.push(
      setUser(user),
      setLog({
        id: ulid(),
        type: "google_user_updated",
        user: user.id,
        data: {
          oldGUser: user.gUser,
          newGUser: gUser,
        },
      }),
    );
  } else if (!user) {
    isNewUser = true;
    user = {
      id: ulid(),
      isAdmin: isSiteOwner({ gUser }),
      pubName: gUser.name,
      pubEmail: "",
      pubWebsite: "",
      isGooglePicPub: true,
      gUser,
    };
    promises.push(setUser(user));
  }
  if (isNewUser) {
    promises.push(
      setLog({
        id: ulid(),
        user: user.id,
        type: "user_registered",
        data: { user },
      }),
      setAlert({
        id: ulid(),
        userId: user.id,
        title: `👋 Привет, ${user.gUser.name}`,
        body: `За всякакви въпроси можеш да пишеш на ${siteEmail()}`,
      }),
    );
  }
  const session = crypto.randomUUID();
  promises.push(setUserSession(session, user.id));
  await Promise.all(promises);

  // Redirect with session cookie
  const resp = new Response("Logged in", {
    headers: {
      Location: redirect || "/",
    },
    status: 303,
  });
  setCookie(resp.headers, {
    name: SESSION_COOKIE,
    value: session,
    path: "/",
    httpOnly: true,
    maxAge: SESSION_EXPIRES_SEC,
  });
  deleteCookie(resp.headers, OAUTH_SESSION_COOKIE, { path: "/" });
  return resp;
}

import { chunk } from "$std/collections/chunk.ts";
import { isSendEmailMsg, sendEmail } from "./email.ts";
import { isProd } from "./env.ts";
import { isAlertableLog } from "./logs.ts";
import { OAUTH_SESSION_EXPIRES_SEC, SESSION_EXPIRES_SEC } from "./oauth.ts";
import { isProcessPhotosMsg, processPhotos } from "./photos.ts";
import {
  Alert,
  DeclinedDraft,
  Log,
  OauthSession,
  Photo,
  Place,
  PublishedPlace,
  UploadSession,
  User,
} from "./types.ts";

export const kv = await Deno.openKv();

// Set isProd global variable
declare global {
  // deno-lint-ignore no-var
  var IS_PROD: boolean;
}
const res = await kv.get<boolean>(["isProd"], { consistency: "eventual" });
if (res.value === null && !Deno.args.includes("build")) {
  throw new Error("db missing isProd key");
}
globalThis.IS_PROD = res.value!;

// Oauth Session

export async function setOauthSession(id: string, session: OauthSession) {
  await kv.set(["oauth_sessions", id], session, {
    expireIn: 1000 * OAUTH_SESSION_EXPIRES_SEC,
  });
}

export async function getOauthSession(id: string) {
  const res = await kv.get<OauthSession>(["oauth_sessions", id]);
  return res.value;
}

// User Session

export async function setUserSession(sessionId: string, userId: string) {
  await kv.set(["user_sessions", sessionId], userId, {
    expireIn: 1000 * SESSION_EXPIRES_SEC,
  });
}

export async function deleteUserSession(sessionId: string) {
  await kv.delete(["user_sessions", sessionId]);
}

// Upload Session

export async function setUploadSession(session: UploadSession) {
  await kv.set(["upload_sessions", session.userId, session.id], session, {
    expireIn: 1000 * 60 * 60 * 2,
  });
}

export async function getUploadSession(id: string, userId: string) {
  const res = await kv.get<UploadSession>(["upload_sessions", userId, id]);
  return res.value;
}

// User

export function setUser(user: User) {
  return kv.atomic()
    .set(["users", user.id], user)
    .set(["users_by_googleId", user.gUser.id], user)
    .commit();
}

export async function getUser(
  id: string,
  consistency: Deno.KvConsistencyLevel = "eventual",
) {
  const res = await kv.get<User>(["users", id], { consistency });
  return res.value;
}

export async function getUserByGoogleId(googleId: string) {
  const res = await kv.get<User>(["users_by_googleId", googleId], {
    consistency: "eventual",
  });
  return res.value;
}

export async function getUserBySession(sessionId: string) {
  const res = await kv.get<string>(["user_sessions", sessionId]);
  if (!res.value) return null;
  return getUser(res.value);
}

export async function listUsers(options?: Deno.KvListOptions) {
  const iter = kv.list<User>({ prefix: ["users"] }, {
    reverse: true,
    consistency: "eventual",
    ...options,
  });
  const values = [];
  for await (const res of iter) values.push(res.value);
  return values;
}

// Places

export async function setPlace(
  place: Place,
  versionstamps: {
    published: string | null;
    draft: string | null;
  },
) {
  let isSlugNew = true;
  let currentPlace;
  if (versionstamps.published) {
    const res = await getPlace(place.id);
    currentPlace = res.value;
    if (place.slug === currentPlace?.slug) {
      isSlugNew = false;
    }
  }

  const atomic = kv.atomic();
  if (currentPlace && isSlugNew) {
    atomic.delete(["places_by_slug", currentPlace.slug]);
  }
  return atomic
    .check({
      key: ["places", place.id],
      versionstamp: versionstamps.published,
    })
    .check({
      key: ["drafts", place.id],
      versionstamp: versionstamps.draft,
    })
    .check({
      key: ["places_by_slug", place.slug],
      versionstamp: isSlugNew ? null : versionstamps.published,
    })
    .set(["places", place.id], place)
    .set(["places_by_slug", place.slug], place)
    .set(["places_revs", place.id, place.rev], place)
    .set(["places_revs_by_user", place.revUser, place.id, place.rev], "")
    .set(["places_users", place.id, place.revUser], "")
    .set(["places_by_user", place.revUser, place.id], "")
    .sum(["places_revs_count", place.id], 1n)
    .sum(["places_user_revs_count", place.revUser, place.id], 1n)
    .commit();
}

export function getPlace(
  id: string,
  consistency: Deno.KvConsistencyLevel = "eventual",
) {
  return kv.get<PublishedPlace>(["places", id], { consistency });
}

export function getPlaceBySlug(
  slug: string,
  consistency: Deno.KvConsistencyLevel = "eventual",
) {
  return kv.get<PublishedPlace>(["places_by_slug", slug], { consistency });
}

export async function getRev(
  placeid: string,
  revId: string,
  consistency: Deno.KvConsistencyLevel = "eventual",
) {
  const res = await kv.get<Place>(["places_revs", placeid, revId], {
    consistency,
  });
  return res.value;
}

export async function listPlaces(options?: Deno.KvListOptions) {
  const iter = kv.list<PublishedPlace>({ prefix: ["places"] }, {
    reverse: true,
    consistency: "eventual",
    ...options,
  });
  const values = [];
  for await (const res of iter) values.push(res.value);
  return values;
}

export async function listRevIds(
  placeId: string,
  options?: Deno.KvListOptions,
) {
  const kvIter = kv.list({ prefix: ["places_revs", placeId] }, {
    reverse: true,
    consistency: "eventual",
    ...options,
  });
  const ids = [];
  for await (const res of kvIter) ids.push(res.key.at(-1) as string);
  return ids;
}

export async function getManyRevs(
  items: {
    placeId: string;
    revId: string;
  }[],
  consistency: Deno.KvConsistencyLevel = "eventual",
) {
  const keys = items.map((it) => ["places_revs", it.placeId, it.revId]);
  const res = await kv.getMany<Place[]>(keys, { consistency });
  return res.map((r) => r.value);
}

export async function listPlacesByUser(
  userId: string,
  options?: Deno.KvListOptions,
) {
  const iter = kv.list<PublishedPlace>({ prefix: ["places_by_user", userId] }, {
    reverse: true,
    consistency: "eventual",
    ...options,
  });
  const keys = [];
  for await (const res of iter) keys.push(["places", res.key.at(-1)!]);
  const places = await getManyValues<Place>(keys, options?.consistency);
  return places.filter((p) => p !== null) as Place[];
}

// Places Drafts

export function setDraft(
  place: Place,
  versionstamps: {
    published: string | null;
    draft: string | null;
  },
) {
  return kv.atomic()
    .check({
      key: ["places", place.id],
      versionstamp: versionstamps.published,
    })
    .check({
      key: ["drafts", place.id],
      versionstamp: versionstamps.draft,
    })
    .set(["drafts", place.id], place)
    .set(["drafts_revs", place.id, place.rev], place)
    .set(["drafts_by_user", place.revUser, place.id], place)
    .commit();
}

export function deleteDraft(userId: string, placeId: string) {
  return kv.atomic()
    .delete(["drafts", placeId])
    .delete(["drafts_by_user", userId, placeId])
    .commit();
}

export function getDraft(
  id: string,
  consistency: Deno.KvConsistencyLevel = "eventual",
) {
  return kv.get<Place>(["drafts", id], { consistency });
}

export async function getDraftRev(
  placeId: string,
  revId: string,
  consistency: Deno.KvConsistencyLevel = "eventual",
) {
  const res = await kv.get<Place>(["drafts_revs", placeId, revId], {
    consistency,
  });
  return res.value;
}

export async function listDrafts(options?: Deno.KvListOptions) {
  const iter = kv.list<Place>({ prefix: ["drafts"] }, {
    reverse: true,
    consistency: "eventual",
    ...options,
  });
  const values = [];
  for await (const res of iter) values.push(res.value);
  return values;
}

export async function listDraftsByUser(
  userId: string,
  options?: Deno.KvListOptions,
) {
  const iter = kv.list<Place>({ prefix: ["drafts_by_user", userId] }, {
    reverse: true,
    consistency: "eventual",
    ...options,
  });
  const values = [];
  for await (const res of iter) values.push(res.value);
  return values;
}

// Declined Place Drafts

export function setDeclinedDraft(place: DeclinedDraft) {
  const { id, rev, revUser } = place;
  return kv.atomic()
    .set(["declined_drafts", rev], place)
    .set(["declined_drafts_by_place", id, rev], place)
    .set(["declined_drafts_by_user", revUser, rev], place)
    .set(["declined_drafts_user_place_last", revUser, id], place)
    .commit();
}

export async function deleteLastDeclinedDraftByUserPlace(
  userId: string,
  placeId: string,
) {
  await kv.delete(["declined_drafts_user_place_last", userId, placeId]);
}

export function getDeclinedDraft(
  rev: string,
  consistency: Deno.KvConsistencyLevel = "eventual",
) {
  return kv.get<DeclinedDraft>(["declined_drafts", rev], { consistency });
}

export function getLastDeclinedDraftByUserPlace(
  userId: string,
  placeId: string,
  consistency: Deno.KvConsistencyLevel = "eventual",
) {
  return kv.get<DeclinedDraft>([
    "declined_drafts_user_place_last",
    userId,
    placeId,
  ], { consistency });
}

export async function listLastDeclinedDraftsByUsers(
  userId?: string,
  options?: Deno.KvListOptions,
) {
  const prefix = ["declined_drafts_user_place_last"];
  if (userId) prefix.push(userId);
  const iter = kv.list<Place>({ prefix }, {
    reverse: true,
    consistency: "eventual",
    ...options,
  });
  const values = [];
  for await (const res of iter) values.push(res.value);
  return values;
}

// Photos

export async function setPhoto(photo: Photo) {
  await kv.set(["photos", photo.s3Key], photo);
}

export async function getPhoto(
  s3Key: string,
  consistency: Deno.KvConsistencyLevel = "eventual",
) {
  const res = await kv.get<Photo>(["photos", s3Key], { consistency });
  return res.value;
}

// Alerts

export async function setAlert(alert: Alert) {
  await kv.set(["alerts", alert.userId, alert.id], alert);
}

export async function setLastSeenAlert(id: string, userId: string) {
  await kv.set(["last_seen_alert", userId], id);
}

export async function getLastSeenAlertId(userId: string) {
  const iter = kv.list<string>(
    { prefix: ["last_seen_alert", userId] },
    { reverse: true, limit: 1 },
  );
  return (await iter.next()).value;
}

export async function listAlerts(user: User, options?: Deno.KvListOptions) {
  const iter = kv.list<Alert>({ prefix: ["alerts", user.id] }, {
    reverse: true,
    consistency: "eventual",
    ...options,
  });
  const values = [];
  for await (const res of iter) values.push(res.value);
  return values;
}

export async function getUnseenAlertsCount(user: User) {
  const lastSeenId = (await kv.get<string>(["last_seen_alert", user.id])).value;
  const listOptions = {
    reverse: true,
    consistency: "eventual",
  } as const;
  const alertsSelector = {
    prefix: ["alerts", user.id],
    start: lastSeenId ? ["alerts", user.id, lastSeenId] : undefined,
  };
  const values = [];
  for await (const res of kv.list<Alert>(alertsSelector, listOptions)) {
    if (res.value.id !== lastSeenId) {
      values.push(res.value);
    }
  }
  if (user.isAdmin) {
    const logsSelector = {
      prefix: ["logs"],
      start: lastSeenId ? ["logs", lastSeenId] : undefined,
    };
    for await (const res of kv.list<Log>(logsSelector, listOptions)) {
      if (res.value.id !== lastSeenId && isAlertableLog(res.value, user)) {
        values.push(res.value);
      }
    }
  }
  return values.length;
}

// Logs

export async function setLog(log: Log) {
  await kv.atomic()
    .set(["logs", log.id], log)
    .set(["logs_by_user", log.user, log.id], log)
    .set(["logs_by_type", log.type, log.id], log)
    .commit();
}

export async function getLog(
  id: string,
  consistency: Deno.KvConsistencyLevel = "eventual",
) {
  const res = await kv.get<Log>(["logs", id], { consistency });
  return res.value;
}

export async function listLogs(options?: Deno.KvListOptions) {
  const iter = kv.list<Log>({ prefix: ["logs"] }, {
    reverse: true,
    consistency: "eventual",
    ...options,
  });
  const values = [];
  for await (const res of iter) values.push(res.value);
  return values;
}

// Admin

export async function dbReset() {
  if (isProd()) return;
  const rows = kv.list({ prefix: [] });
  for await (const row of rows) {
    kv.delete(row.key);
  }
  await kv.set(["isProd"], false);
}

// Queue

if (!Deno.args.includes("build")) {
  kv.listenQueue((msg) => {
    if (isProcessPhotosMsg(msg)) {
      processPhotos(msg);
    } else if (isSendEmailMsg(msg)) {
      sendEmail(msg.payload);
    } else {
      console.error("Unknown message received:", msg);
    }
  });
}

/**
 * Gets many values from KV. Uses batched requests to get values in chunks of 10.
 */
async function getManyValues<T>(
  keys: Deno.KvKey[],
  consistency: Deno.KvConsistencyLevel = "eventual",
): Promise<(T | null)[]> {
  const promises = [];
  for (const batch of chunk(keys, 10)) {
    promises.push(kv.getMany<T[]>(batch, { consistency }));
  }
  return (await Promise.all(promises))
    .flat()
    .map((entry) => entry?.value);
}

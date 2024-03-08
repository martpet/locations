import "$std/dotenv/load.ts";

type ENV_KEY =
  | "AWS_REGION"
  | "AWS_ACCESS_KEY_ID"
  | "AWS_SECRET_ACCESS_KEY"
  | "PROD_HOST_CUSTOM"
  | "PROD_HOST_DENO"
  | "SITE_TITLE_PROD"
  | "SITE_TITLE_DEV"
  | "SITE_EMAIL_PROD"
  | "SITE_EMAIL_DEV"
  | "OWNER_GOOGLE_ID"
  | "GOOGLE_CLIENT_ID"
  | "GOOGLE_CLIENT_SECRET"
  | "DEV_GOOGLE_CLIENT_ID"
  | "DEV_GOOGLE_CLIENT_SECRET"
  | "OAUTH_PROXY"
  | "MAP_API_KEY"
  | "PHOTOS_ORIGIN_PROD"
  | "PHOTOS_ORIGIN_DEV"
  | "UPLOAD_PHOTO_BUCKET_PROD"
  | "UPLOAD_PHOTO_BUCKET_DEV"
  | "UPLOAD_PHOTO_COMPRESSED_BUCKET_PROD"
  | "UPLOAD_PHOTO_COMPRESSED_BUCKET_DEV";

export function getEnv(key: ENV_KEY) {
  const value = Deno.env.get(key);
  if (value === undefined) {
    throw new Error(`Missing ${key} environment variable`);
  }
  return value;
}

export function isProd() {
  if (globalThis.IS_PROD === undefined) {
    throw new Error("globalThis.IS_PROD is undefined");
  }
  return globalThis.IS_PROD;
}

export function photosOrigin() {
  return isProd() ? getEnv("PHOTOS_ORIGIN_PROD") : getEnv("PHOTOS_ORIGIN_DEV");
}

export function uploadPhotoBucket() {
  return isProd()
    ? getEnv("UPLOAD_PHOTO_BUCKET_PROD")
    : getEnv("UPLOAD_PHOTO_BUCKET_DEV");
}

export function uploadPhotoCompressedBucket() {
  return isProd()
    ? getEnv("UPLOAD_PHOTO_COMPRESSED_BUCKET_PROD")
    : getEnv("UPLOAD_PHOTO_COMPRESSED_BUCKET_DEV");
}

export function googleClientId() {
  return isProd() ? getEnv("GOOGLE_CLIENT_ID") : getEnv("DEV_GOOGLE_CLIENT_ID");
}

export function googleClientSecret() {
  return isProd()
    ? getEnv("GOOGLE_CLIENT_SECRET")
    : getEnv("DEV_GOOGLE_CLIENT_SECRET");
}

export function siteTitle() {
  return isProd() ? getEnv("SITE_TITLE_PROD") : getEnv("SITE_TITLE_DEV");
}

export function siteEmail() {
  return isProd() ? getEnv("SITE_EMAIL_PROD") : getEnv("SITE_EMAIL_DEV");
}

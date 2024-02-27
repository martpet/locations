// requires AWS SES in non-sandboxed mode
export const CAN_EMAIL_UNVERIFIED_IDENTITIES = false;

// disabled until Sharp works in Deno or ImageMagick doesn cause CPU time error on Deno Deploy
export const RESIZE_PHOTOS_IN_DENO = false;

export const CACHE_FOREVER_PARAM = "cache_forever";

export const ASSETS_EXTENSIONS = [
  ".css$",
  ".js$",
  ".txt$",
  ".svg$",
  ".png$",
  ".gif$",
  ".jpg$",
  ".jpeg$",
  ".ico$",
];

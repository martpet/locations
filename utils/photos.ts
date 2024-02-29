import { DAY } from "$std/datetime/constants.ts";
import { AWSSignerV4 } from "aws_sign_v4";
import { RESIZE_PHOTOS_IN_DENO } from "./consts.ts";
import { kv, setPhoto } from "./db.ts";
import {
  getEnv,
  uploadPhotoBucket,
  uploadPhotoCompressedBucket,
} from "./env.ts";
import { ExifData, LngLat, Photo } from "./types.ts";

export interface ProcessPhotosMsg {
  type: "process-photos";
  photos: Photo[];
}

export function isProcessPhotosMsg(o: unknown): o is ProcessPhotosMsg {
  const obj = o as Partial<ProcessPhotosMsg>;
  return typeof o !== "undefined" &&
    obj.type === "process-photos" &&
    Array.isArray(obj.photos) &&
    obj.photos.every((it: Partial<Photo>) => {
      return it !== undefined &&
        typeof it.s3Key === "string" &&
        typeof it.placeId === "string" &&
        typeof it.userId === "string";
    });
}

export async function processPhotos({ photos }: ProcessPhotosMsg) {
  const photo = photos.shift();
  if (!photo) return;
  const signer = new AWSSignerV4();
  const REGION = getEnv("AWS_REGION");
  const DOWNLOAD_URL =
    `https://${uploadPhotoBucket()}.s3.${REGION}.amazonaws.com/${photo.s3Key}`;
  const SHA256_EMPTRY_STRING =
    "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
  const req = new Request(DOWNLOAD_URL, {
    headers: { "x-amz-content-sha256": SHA256_EMPTRY_STRING },
  });
  const signedReq = await signer.sign("s3", req);
  const resp = await fetch(signedReq);
  if (!resp.ok) throw new Error(await resp.text());
  const uint8 = new Uint8Array(await resp.arrayBuffer());
  const exif = await parseExif(uint8);
  if (RESIZE_PHOTOS_IN_DENO) {
    await resizePhoto(uint8, photo, signer);
  }
  await setPhoto({ ...photo, exif });
  if (photos.length) {
    await kv.enqueue({ type: "process-photos", payload: photos });
  }
}

async function parseExif(imgBuffer: Uint8Array) {
  const ExifParser = await import("exif-parser");
  const parser = ExifParser.create(imgBuffer);
  const { tags } = parser.parse();
  const lng = tags.GPSLongitude;
  const lat = tags.GPSLatitude;
  const data: ExifData = {
    date: tags.DateTimeOriginal,
    altitude: tags.GPSAltitude,
    destBearing: tags.GPSDestBearing,
  };
  if (lng && lat) {
    data.lngLat = [
      Number(lng.toFixed(5)),
      Number(lat.toFixed(5)),
    ] as LngLat;
  }
  return data;
}

async function resizePhoto(
  uint8: Uint8Array,
  photo: Photo,
  signer: AWSSignerV4,
) {
  const { ImageMagick, initialize } = await import("image-magick");
  const { encodeHex } = await import("$std/encoding/hex.ts");
  const REGION = getEnv("AWS_REGION");
  const UPLOAD_URL =
    `https://${uploadPhotoCompressedBucket()}.s3.${REGION}.amazonaws.com/${photo.s3Key}`;
  await initialize();
  const SIZES = [
    { size: 400, ext: "thumb" },
    { size: 1600, ext: "" },
  ];
  for (const { size, ext } of SIZES) {
    const uint8Resized = await new Promise<Uint8Array>((resolve) => {
      ImageMagick.read(uint8, (img) => {
        if (img.orientation === 6 || img.orientation === 8) { // make portrait mode load from top to bottom
          img.rotate(img.orientation === 6 ? 90 : -90);
          img.orientation = 1;
        }
        img.resize(size, size);
        img.write(resolve);
      });
    });
    const blob = new Blob([uint8Resized], { type: "image/jpeg" });
    const buffer = await blob.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
    const url = UPLOAD_URL.replace(".jpeg", `${ext && `.${ext}`}.jpeg`);
    const req = new Request(url, {
      method: "put",
      body: blob,
      headers: {
        "x-amz-content-sha256": encodeHex(hashBuffer),
        "cache-control": `public, max-age=${DAY * 365 / 1000}, immutable`,
      },
    });
    const signedReq = await signer.sign("s3", req);
    const resp = await fetch(signedReq);
    if (!resp.ok) throw new Error(await resp.text());
  }
}

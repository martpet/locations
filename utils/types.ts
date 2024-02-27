import { SetNonNullable } from "type-fest";
import { GoogleUser } from "./google.ts";

export interface State {
  user: User | null;
  session?: string;
  flash?: Flash;
  noCacheOverride?: Readonly<boolean>;
}

export interface Flash {
  msg: string;
  type?: "success" | "info" | "warning" | "error";
}

export interface OauthSession {
  state: string;
  codeVerifier: string;
  redirect: string | null;
}

export interface UploadSession {
  id: string;
  userId: string;
  s3Keys: string[];
}

export interface User {
  id: string;
  isAdmin?: boolean;
  isBanned?: boolean;
  banToggleDate?: Date;
  banUserMsg?: string;
  pubName: string;
  pubEmail: string;
  pubWebsite: string;
  isGooglePicPub: boolean;
  gUser: GoogleUser;
}

export interface Place {
  id: string;
  slug: string;
  firstRevUser: string;
  rev: string;
  revUser: string;
  firstPubRev: string | null;
  lastPubRev: string | null;
  title: string;
  description?: string;
  lngLat: LngLat;
  photos: string[];
  address: Address;
}

export type PublishedPlace = SetNonNullable<
  Place,
  "firstPubRev" | "lastPubRev"
>;

export type SanitizedPlace<T extends Place | PublishedPlace | DeclinedDraft> =
  & T
  & { sanitized_description: string | null };

export type PlaceType = "published" | "draft" | "declined";

export type LngLat = [number, number];

export interface DeclinedDraft extends Place {
  reasonDeclined: string;
  dateDeclined: Date;
}

export interface Photo {
  s3Key: string;
  exif?: ExifData | null;
  userId: string;
  placeId: string;
}

export type Address = { [k in AddressType]: string } & {
  current: AddressType;
  details: {
    postalCode: number;
  };
};

export type AddressType = "esri" | "here" | "custom";

export interface ExifData {
  lngLat?: LngLat;
  altitude?: number;
  destBearing?: number;
  date?: number;
}

export interface Alert {
  id: string;
  userId: string;
  title: string;
  body?: string;
}

export type Log =
  | UserRegisterLog
  | UserBanLog
  | GoogleUserUpdateLog
  | PersonalDetailsUpdateLog
  | DraftEvaluatedLog
  | PlaceSubmittedLog;

interface LogBase {
  id: string;
  user: string;
}

export interface UserRegisterLog extends LogBase {
  type: "user_registered";
  data: { user: User };
}

export interface UserBanLog extends LogBase {
  type: "user_banned" | "user_unbanned";
  data: { targetUser: User };
}

export interface GoogleUserUpdateLog extends LogBase {
  type: "google_user_updated";
  data: { oldGUser: GoogleUser; newGUser: GoogleUser };
}

export interface PersonalDetailsUpdateLog extends LogBase {
  type: "user_personal_details_updated";
  data: { olduser: User; newUser: User };
}

export interface DraftEvaluatedLog extends LogBase {
  type: "draft_approved" | "draft_declined";
  data: {
    revId: string;
    placeId: string;
    reason?: string;
  };
}

export interface PlaceSubmittedLog extends LogBase {
  type:
    | "place_created"
    | "place_updated"
    | "draft_created"
    | "draft_updated";
  data: {
    placeId: string;
    revId: string;
    publishDirectly: boolean;
    editedPlaceType?: PlaceType;
    editedPlaceRev?: string;
  };
}

import { getEnv } from "./env.ts";
import { User } from "./types.ts";

export function isSiteOwner(user: Pick<User, "gUser">) {
  return user.gUser.id === getEnv("OWNER_GOOGLE_ID");
}

export function banUserDisallowed(
  { currentUser, targetUser }: { currentUser: User; targetUser: User },
) {
  if (targetUser.id === currentUser.id) {
    return "ban_self";
  }
  if (isSiteOwner(targetUser)) {
    return "ban_owner";
  }
}

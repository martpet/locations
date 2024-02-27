import { Log, User } from "./types.ts";

export function isAlertableLog(log: Log, user: User) {
  return log.user !== user.id;
}

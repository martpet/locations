import { flashMiddleware } from "../utils/flash.ts";
import { sessionMiddleware } from "../utils/session.ts";

export const handler = [
  sessionMiddleware,
  flashMiddleware,
];

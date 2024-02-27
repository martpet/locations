import { Handler } from "$fresh/server.ts";
import { getUnseenAlertsCount } from "../../../utils/db.ts";
import { State } from "../../../utils/types.ts";

export const handler: Handler<undefined, State> = async (_req, ctx) => {
  const unseenAlertsCount = await getUnseenAlertsCount(ctx.state.user!);
  return Response.json(unseenAlertsCount);
};

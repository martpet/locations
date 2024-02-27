import { Partial } from "$fresh/runtime.ts";
import { defineRoute, FreshContext, RouteConfig } from "$fresh/server.ts";

import PlaceDiff from "../../../(_components)/PlaceDiff.tsx";
import { photosOrigin } from "../../../../../utils/env.ts";
import { State } from "../../../../../utils/types.ts";
import { getDiffData } from "./index.tsx";

export const config: RouteConfig = {
  skipAppWrapper: true,
  skipInheritedLayouts: true,
};

import { handler as pageHandler } from "./index.tsx";

export const handler = async (req: Request, ctx: FreshContext<State>) => {
  const resp = await pageHandler(req, ctx);
  ctx.state.noCacheOverride = true;
  return resp;
};

export default defineRoute<State>(async (_req, ctx) => {
  const diffData = await getDiffData(
    ctx.params.id,
    ctx.params.rev_id,
    ctx.state.user,
  );
  if (diffData === "rev-not-found") {
    return ctx.renderNotFound();
  }
  return (
    <Partial name="rev-diff">
      <PlaceDiff
        current={diffData.currentRev}
        prev={diffData.prevRev}
        author={diffData.revUser}
        pathname={ctx.params.pathname}
        photosOrigin={photosOrigin()}
      />
    </Partial>
  );
});

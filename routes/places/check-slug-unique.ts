import { Handler } from "$fresh/server.ts";
import { getPlaceBySlug } from "../../utils/db.ts";

export type CheckSlugUniqueRespData = boolean;

export const handler: Handler = async (_req, ctx) => {
  const slug = ctx.url.searchParams.get("q");
  if (!slug) {
    return new Response("missing 'q' param", {
      status: 400,
    });
  }
  const kvRes = await getPlaceBySlug(slug);
  const respData: CheckSlugUniqueRespData = !kvRes.value;
  return Response.json(respData);
};

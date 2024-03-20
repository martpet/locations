import { Head } from "$fresh/runtime.ts";
import { defineRoute, FreshContext } from "$fresh/server.ts";
import { MINUTE } from "$std/datetime/constants.ts";
import { decodeTime } from "ulid";
import { dateTimeFormat } from "../../../utils/datetime.ts";
import { getPlaceBySlug } from "../../../utils/db.ts";
import { photosOrigin, siteTitle } from "../../../utils/env.ts";
import { State } from "../../../utils/types.ts";
import PlaceHeader from "../../places/(_components)/PlaceHeader.tsx";

export async function handler(_req: Request, ctx: FreshContext) {
  const resp = await ctx.render();
  resp.headers.set("cache-control", `public, max-age=${MINUTE * 30 / 1000}`);
  return resp;
}

export default defineRoute<State>(async (_req, ctx) => {
  const photoId = ctx.params.photo_id;
  const placeSlug = ctx.params.slug;
  const s3Key = `${photoId}.jpeg`;
  const { value: place } = await getPlaceBySlug(placeSlug);
  if (!place) {
    return ctx.renderNotFound();
  }
  const dateFmt = dateTimeFormat({ dateStyle: "long" });
  const photoDate = dateFmt.format(decodeTime(photoId));
  const imgSrc = `${photosOrigin()}/${s3Key}`;
  return (
    <>
      <Head>
        <title>Снимка: {place.title} | {siteTitle()}</title>
      </Head>
      <article>
        <PlaceHeader place={place} />
        <figure>
          <img src={imgSrc} />
          <figcaption>{photoDate}</figcaption>
        </figure>
        <footer>
          <a href={"/" + place.slug}>Обратно в поста</a>
        </footer>
      </article>
    </>
  );
});

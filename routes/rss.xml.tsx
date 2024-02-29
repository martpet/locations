import { defineRoute } from "$fresh/server.ts";
import { HOUR } from "$std/datetime/constants.ts";
import { decodeTime } from "ulid";
import { listPlaces } from "../utils/db.ts";
import { photosOrigin, siteTitle } from "../utils/env.ts";
import { State } from "../utils/types.ts";

export const RSS_TITLE = "Последни постове";

export default defineRoute<State>(async (_req, ctx) => {
  const { Feed } = await import("feed");
  const { origin } = ctx.url;
  const SITE_TITLE = siteTitle();
  const PHOTOS_ORIGIN = photosOrigin();
  const places = await listPlaces({ limit: 5 });
  const feed = new Feed({
    id: origin,
    title: SITE_TITLE,
    copyright: `Copyright ${new Date().getFullYear()} ${SITE_TITLE}`,
    description: RSS_TITLE,
    link: origin,
    language: "bg",
  });

  for (const place of places) {
    feed.addItem({
      title: place.title,
      description: place.address[place.address.current],
      link: `/${place.slug}`,
      date: new Date(decodeTime(place.id)),
      image: `${PHOTOS_ORIGIN}/${place.photos[0]}`,
    });
  }

  const rssFeed = feed.rss2();
  return new Response(rssFeed, {
    headers: {
      "content-type": "application/xml",
      "cache-control": `public, max-age=${HOUR / 1000}`,
    },
  });
});

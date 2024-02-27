import { FreshContext } from "$fresh/server.ts";
import { decodeTime } from "ulid";
import { listPlaces } from "../utils/db.ts";

export const handler = async (_req: Request, ctx: FreshContext) => {
  const places = await listPlaces();
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${
    places.map((place) =>
      `<url>
        <loc>${ctx.url.origin}/${place.slug}</loc>
        <lastmod>${new Date(decodeTime(place.rev)).toISOString()}</lastmod>
        </url>`
    ).join("")
  }
    </urlset>`;

  return new Response(xml, {
    headers: {
      "content-type": "application/xml",
    },
  });
};

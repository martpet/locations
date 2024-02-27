import type { Feature, FeatureCollection, Point } from "geojson";
import {
  DeclinedDraft,
  Place,
  PublishedPlace,
  SanitizedPlace,
} from "./types.ts";

export interface PlaceGeoJsonFeature extends Feature {
  geometry: Point;
  properties: {
    title: string;
    slug: string;
    thumb: string;
  };
}

export interface PlacesFeatureCollection extends FeatureCollection {
  features: PlaceGeoJsonFeature[];
}

export function placesToGeoJson(
  places: Place[],
  photosOrigin: string,
): PlacesFeatureCollection {
  return {
    type: "FeatureCollection",
    features: places.map((place) => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: place.lngLat,
      },
      properties: {
        title: place.title,
        slug: place.slug,
        thumb: `${photosOrigin}/${place.photos[0]}`.replace(
          ".jpeg",
          ".thumb.jpeg",
        ),
      },
    })),
  };
}

export async function sanitizePlace<
  T extends Place | PublishedPlace | DeclinedDraft,
>(
  place: T,
) {
  const [ammonia, Marked] = await Promise.all([
    import("ammonia"),
    import("marked"),
  ]);
  await ammonia.init();
  const sanitized: SanitizedPlace<T> = {
    sanitized_description: null,
    ...place,
  };
  if (place.description) {
    sanitized.sanitized_description = Marked.parse(
      ammonia.clean(place.description),
    ) as string;
  }
  return sanitized;
}

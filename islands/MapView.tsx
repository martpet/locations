import { asset, Head, IS_BROWSER } from "$fresh/runtime.ts";
import { renderToString } from "$fresh/src/server/deps.ts";
import type { Point } from "geojson";
import maplibre from "maplibregl";
import { useEffect, useRef, useState } from "preact/hooks";
import useThemeDetector from "../hooks/useThemeDetector.ts";
import {
  PlaceGeoJsonFeature,
  PlacesFeatureCollection,
} from "../utils/places.ts";
import ImageWithLoader from "./ImageWithLoader.tsx";

const CONTAINER = "map";
const PLACES = "places";
const CLUSTERS = "places-clusters";
const CLUSTER_COUNT = "cluster-count";
const BOUNDS_STORAGE_KEY = "bounds";
const PLACE_SEARCH_PARAM = "place";

interface MapViewProps {
  geojson: PlacesFeatureCollection;
  apiKey: string;
}

export default function MapView(props: MapViewProps) {
  if (!IS_BROWSER) {
    return (
      <Head>
        <link rel="stylesheet" href={asset("/maplibre-gl.css")} />
      </Head>
    );
  }
  const map = useRef<maplibre.Map>();
  const DARK_MAP = "places-open-data-dark";
  const LIGHT_MAP = "places-open-data-light";
  const STYLES = useRef<{ [k: string]: maplibre.StyleSpecification }>({});
  const [style, setStyle] = useState<maplibre.StyleSpecification>();
  const isDarkTheme = useThemeDetector();
  const mapName = isDarkTheme ? DARK_MAP : LIGHT_MAP;
  const styleUrl =
    `https://maps.geo.eu-central-1.amazonaws.com/maps/v0/maps/${mapName}/style-descriptor?key=${props.apiKey}`;

  useEffect(() => {
    if (!style) return;
    if (map.current) {
      map.current.setStyle(style, { diff: false }); // https://github.com/maplibre/maplibre-gl-js/issues/2587#issuecomment-1656579725
    } else {
      map.current = initMap(style, props.geojson);
    }
  }, [style]);

  useEffect(() => {
    const cached = STYLES.current[styleUrl];
    if (cached) {
      setStyle(cached);
    } else {
      getStyle(styleUrl).then((fetched) => {
        setStyle(fetched);
        STYLES.current[styleUrl] = fetched;
      });
    }
  }, [styleUrl]);

  return (
    <div
      id={CONTAINER}
      class={`
        not-prose !absolute left-0 top-0 w-full h-full !font-[inherit]
        [&_.maplibregl-popup-content]:p-2.5
        dark:[&_.maplibregl-popup-content]:bg-black
        dark:[&_.maplibregl-popup-anchor-bottom_.maplibregl-popup-tip]:!border-t-black
        dark:[&_.maplibregl-popup-anchor-top_.maplibregl-popup-tip]:!border-b-black
        dark:[&_.maplibregl-popup-anchor-left_.maplibregl-popup-tip]:!border-r-black
        dark:[&_.maplibregl-popup-anchor-right_.maplibregl-popup-tip]:!border-l-black
        dark:[&_.maplibregl-ctrl]:invert
      `}
    />
  );
}

interface PlacePopupProps {
  thumb: string;
  title: string;
  url: string;
}

function PlacePopup(props: PlacePopupProps) {
  return (
    <figure class="w-min text-sm">
      <div class="w-48 bg-stone-950 aspect-square">
        <a href={props.url} class="outline-none">
          <ImageWithLoader
            src={props.thumb}
            class="object-cover w-full h-full"
            invertSpinnerColor
          />
        </a>
      </div>
      <figcaption class="leading-5 mt-1.5">
        {props.title}
      </figcaption>
    </figure>
  );
}

function initMap(
  style: maplibre.StyleSpecification,
  geojson: PlacesFeatureCollection,
) {
  const DEFAULT_BOUNDS = [[22.334, 41.223], [28.611, 44.232]];
  const savedBoundsJson = localStorage.getItem(BOUNDS_STORAGE_KEY);
  const savedBounds = savedBoundsJson && JSON.parse(savedBoundsJson);
  const bounds = savedBounds || DEFAULT_BOUNDS;
  const map = new maplibre.Map({
    container: CONTAINER,
    style,
    bounds,
    attributionControl: false,
    hash: true,
    fadeDuration: 0,
  });
  addControls(map);
  addEvents(map, geojson);
  return map;
}

const placePopup = new maplibre.Popup({
  closeButton: false,
  closeOnClick: false,
  maxWidth: "none",
  offset: { bottom: [0, -31] },
  anchor: "bottom",
});

placePopup.on("close", () => {
  removePlaceSearchParam();
});

function addControls(map: maplibre.Map) {
  const position: maplibre.ControlPosition = "bottom-right";
  map.addControl(
    new maplibre.NavigationControl(),
    position,
  );
  map.addControl(
    new maplibre.GeolocateControl({
      positionOptions: { enableHighAccuracy: true },
      trackUserLocation: true,
    }),
    position,
  );
}

function addEvents(
  map: maplibre.Map,
  geojson: PlacesFeatureCollection,
) {
  map.on("load", () => {
    addPopupFromUrlParams(map, geojson);
  });
  map.on("style.load", async () => {
    await addImages(map); // todo: move to `map.on("load")` when `map.setStyle` is called with diff:true
    addSourcesAndLayers(map, geojson);
  });
  map.on("moveend", () => {
    saveBoundsInLocalStorage(map);
  });
  map.on("click", (e) => {
    if (isMobile() && placePopup.isOpen()) {
      placePopup.remove();
    }
  });
  map.on("click", PLACES, (e) => {
    const feature = e.features?.[0];
    if (feature) {
      if (isMobile()) {
        addPlacePopup(map, feature);
      } else {
        location.href = "/" + feature.properties.slug;
      }
    }
  });
  map.on("click", CLUSTERS, (e) => {
    const feature = e.features?.[0];
    if (feature) zoomOnCluster(map, feature);
  });
  map.on("mouseenter", PLACES, (e) => {
    const feature = e.features?.[0];
    if (feature) {
      map.getCanvas().style.cursor = "pointer";
      addPlacePopup(map, feature);
    }
  });
  map.on("mouseleave", PLACES, () => {
    map.getCanvas().style.cursor = "";
    if (!isMobile()) placePopup.remove();
  });

  map.on("mouseenter", CLUSTERS, () => {
    map.getCanvas().style.cursor = "Pointer";
  });
  map.on("mouseleave", CLUSTERS, () => {
    map.getCanvas().style.cursor = "";
  });
}

function removePlaceSearchParam() {
  const url = new URL(location.href);
  if (url.searchParams.has(PLACE_SEARCH_PARAM)) {
    url.searchParams.delete(PLACE_SEARCH_PARAM);
    history.replaceState(null, "", url.href);
  }
}

function addSourcesAndLayers(
  map: maplibre.Map,
  geojson: PlacesFeatureCollection,
) {
  const isDarkTheme = matchMedia("(prefers-color-scheme: dark)").matches;
  map.addSource(PLACES, {
    type: "geojson",
    data: geojson,
    cluster: true,
    clusterRadius: 30,
  });
  map.addLayer({
    id: PLACES,
    source: PLACES,
    type: "symbol",
    filter: ["!", ["has", "point_count"]],
    layout: {
      "icon-image": isDarkTheme ? "pin-small-light" : "pin-small",
      "icon-anchor": "bottom",
      "icon-allow-overlap": true,
    },
  });
  map.addLayer({
    id: CLUSTERS,
    source: PLACES,
    type: "symbol",
    filter: ["has", "point_count"],
    layout: {
      "icon-image": isDarkTheme ? "pin_light" : "pin",
      "icon-anchor": "bottom",
      "icon-allow-overlap": true,
    },
  });
  map.addLayer({
    id: CLUSTER_COUNT,
    type: "symbol",
    source: PLACES,
    filter: ["has", "point_count"],
    layout: {
      "text-field": "{point_count}",
      "text-font": ["Noto Sans Regular"],
      "text-size": 13,
      "text-offset": [0, -1.95],
    },
    paint: {
      "text-color": isDarkTheme ? "black" : "white",
    },
  });
}

let imagesPromises: Promise<HTMLImageElement>[];

if (IS_BROWSER) {
  imagesPromises = [
    loadImg("/icons/pin.svg", [33, 41.25]),
    loadImg("/icons/pin.svg", [25, 31.25]),
    loadImg("/icons/pin_light.svg", [33, 41.25]),
    loadImg("/icons/pin_light.svg", [25, 31.25]),
  ];
}

async function addImages(map: maplibre.Map) {
  const [pin, pinSmall, pinLight, pinSmallLight] = await Promise.all(
    imagesPromises,
  );
  map.addImage("pin", pin);
  map.addImage("pin-small", pinSmall);
  map.addImage("pin_light", pinLight);
  map.addImage("pin-small-light", pinSmallLight);
}

function addPopupFromUrlParams(
  map: maplibre.Map,
  geojson: PlacesFeatureCollection,
) {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get(PLACE_SEARCH_PARAM);
  if (slug) {
    const feature = geojson.features.find((f) => f.properties.slug === slug);
    if (feature) addPlacePopup(map, feature);
  }
}

function addPlacePopup(
  map: maplibre.Map,
  feature: PlaceGeoJsonFeature | maplibre.MapGeoJSONFeature,
) {
  const coords = (feature.geometry as Point).coordinates;
  const { thumb, slug, title } = feature.properties;
  const html = renderToString(
    <PlacePopup thumb={thumb} title={title} url={"/" + slug} />,
  );
  placePopup.setLngLat(coords as maplibre.LngLatLike).setHTML(html).addTo(map);
}

function saveBoundsInLocalStorage(map: maplibre.Map) {
  const bounds = map.getBounds().toArray();
  localStorage.setItem(BOUNDS_STORAGE_KEY, JSON.stringify(bounds));
}

function zoomOnCluster(map: maplibre.Map, feature: maplibre.MapGeoJSONFeature) {
  const { cluster_id } = feature.properties;
  if (!cluster_id) return;
  const source = map.getSource(PLACES) as maplibre.GeoJSONSource;
  source.getClusterExpansionZoom(cluster_id, (err, zoom) => {
    if (err || !zoom) return;
    map.easeTo({
      center: (feature.geometry as Point).coordinates as [number, number],
      zoom: zoom + 0.5,
    });
  });
}

async function getStyle(url: string): Promise<maplibregl.StyleSpecification> {
  const resp = await fetch(url);
  let str = await resp.text();
  str = str.replaceAll("name:en", `name:bg`);
  return JSON.parse(str);
}

function loadImg(src: string, size: [number, number]) {
  return new Promise<HTMLImageElement>((resolve) => {
    const img = new Image(...size);
    img.onload = () => resolve(img);
    img.src = asset(src);
  });
}

function isSafari() {
  return navigator.userAgent.indexOf("Chrome") === -1 &&
    navigator.userAgent.indexOf("Safari") > -1;
}

function isMobile() {
  return /android/i.test(navigator.userAgent) ||
    /iPad|iPhone|iPod/.test(navigator.userAgent);
}

import { IS_BROWSER } from "$fresh/runtime.ts";
// @deno-types="npm:@types/diff"
import { Change } from "diff";
import { useCallback, useEffect, useMemo, useReducer } from "preact/hooks";
import { JSX } from "preact/jsx-runtime";
import MarkedChanges from "../components/MarkedChanges.tsx";
import ImageWithLoader from "./ImageWithLoader.tsx";
import Lightbox from "./Lightbox.tsx";

interface GalleryProps extends JSX.HTMLAttributes<HTMLUListElement> {
  items: GalleryItem[];
  errorRetryAttempts?: number;
}

export interface GalleryItem {
  src: string;
  href: string;
  css?: string;
  diffChange?: Change;
}

export default function Gallery(
  { items, errorRetryAttempts, ...ulProps }: GalleryProps,
) {
  const [, forceUpdate] = useReducer((x) => x + 1, 0);

  const currentItem = !IS_BROWSER ? null : items.find((it) => {
    const { pathname, hash } = new URL(it.href, location.href);
    return pathname === location.pathname && hash === location.hash;
  });

  let prevItem: GalleryItem | undefined;
  let nextItem: GalleryItem | undefined;
  if (currentItem) {
    const index = items.indexOf(currentItem);
    prevItem = items[index - 1] || items.at(-1);
    nextItem = items[index + 1] || items[0];
  }

  const isDiff = useMemo(
    () => items.some((it) => it.diffChange !== undefined),
    [items],
  );

  const onAnchorClick: JSX.MouseEventHandler<HTMLAnchorElement> = (e) => {
    e.preventDefault();
    const url = e.currentTarget.href;
    if (currentItem) {
      history.replaceState(null, "", url);
    } else {
      history.pushState(null, "", url);
    }
    forceUpdate("");
  };

  const onLightboxArrow = useCallback((key: "ArrowLeft" | "ArrowRight") => {
    if (!nextItem || !prevItem) return;
    const next = key === "ArrowLeft" ? prevItem : nextItem;
    history.replaceState(null, "", next.href);
    forceUpdate("");
  }, [items, currentItem]);

  const onLightboxClose = useCallback(() => {
    if (!history.state) {
      history.back();
    } else {
      // after direct visit
      const url = new URL(location.href);
      url.hash = "";
      history.pushState(null, "", url);
      forceUpdate("");
    }
  }, []);

  useEffect(() => {
    const popListener = () => forceUpdate("");
    addEventListener("popstate", popListener);
    return () => removeEventListener("popstate", popListener);
  }, []);

  return (
    <>
      {currentItem && (
        <Lightbox
          src={currentItem.src}
          prevSrc={prevItem?.src}
          nextSrc={nextItem?.src}
          onClose={onLightboxClose}
          onArrow={onLightboxArrow}
        />
      )}
      <ul
        class={`
          ${ulProps.class || ""}
          not-prose flex flex-wrap gap-5
          [&_ins]:inline-block [&_ins]:h-full
          [&_del]:inline-block [&_del]:h-full
        `}
      >
        {items.map((item) => {
          const image = (
            <ImageWithLoader
              src={item.src.replace(".jpeg", ".thumb.jpeg")}
              reloadOnError
              spinnerOnErrorOnly
              class={`max-h-full rounded ${isDiff ? "p-2" : ""}`}
              maxRetryAttempts={errorRetryAttempts}
            />
          );
          return (
            <li
              class={`sm:h-56 rounded shadow  ${item.css || ""}`}
            >
              <a
                href={item.href}
                onClick={onAnchorClick}
              >
                {item.diffChange
                  ? (
                    <MarkedChanges
                      changes={[{ ...item.diffChange, value: image }]}
                      class="rounded"
                    />
                  )
                  : image}
              </a>
            </li>
          );
        })}
      </ul>
    </>
  );
}

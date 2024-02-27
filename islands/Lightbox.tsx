import { useEffect, useLayoutEffect, useState } from "preact/hooks";
import { JSX } from "preact/jsx-runtime";
import CloseButton from "../components/CloseButton.tsx";
import ImageWithLoader from "./ImageWithLoader.tsx";

interface LightBoxProps {
  src: string;
  prevSrc?: string;
  nextSrc?: string;
  onClose(): void;
  onArrow?(k: "ArrowRight" | "ArrowLeft"): void;
}

export default function LightBox(
  { src, prevSrc, nextSrc, onClose, onArrow }: LightBoxProps,
) {
  const [isLoaded, setIsLoaded] = useState(false);
  const onBackgroundClick: JSX.MouseEventHandler<HTMLDivElement> = (event) => {
    if (event.target instanceof HTMLDivElement) {
      onClose();
    }
  };

  useLayoutEffect(() => {
    setIsLoaded(false);
  }, [src]);

  useEffect(() => {
    // disable scroll
    const prevOverflowStyle = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflowStyle;
    };
  }, []);

  useEffect(() => {
    // handle ESC key
    const listener = (e: WindowEventMap["keydown"]) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    addEventListener("keydown", listener);
    return () => {
      removeEventListener("keydown", listener);
    };
  }, [onClose]);

  useEffect(() => {
    // handle left/right arrow keys
    if (onArrow) {
      const listener = (e: WindowEventMap["keydown"]) => {
        if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
          e.preventDefault();
          onArrow(e.key);
        }
      };
      addEventListener("keydown", listener);
      return () => {
        removeEventListener("keydown", listener);
      };
    }
  }, [onArrow]);

  return (
    <>
      {prevSrc && <link rel="preload" href={prevSrc} as="image" />}
      {nextSrc && <link rel="preload" href={nextSrc} as="image" />}
      <div
        class="not-prose fixed z-20 left-0 top-0 w-screen h-screen flex justify-center items-center bg-black/90"
        onClick={onBackgroundClick}
      >
        <div class="relative h-fit">
          <ImageWithLoader
            src={src}
            key={src} // removes img from dom on src change, prevents next src waiting for prev src to load
            invertSpinnerColor
            onLoad={() => setIsLoaded(true)}
            class="max-w-[calc(100vw-40px)] max-h-[calc(100vh-40px)] rounded object-cover"
          />
          {isLoaded && (
            <CloseButton
              class="absolute z-10 right-0 top-0 translate-x-2/4 -translate-y-2/4 border border-gray-100"
              onClick={onClose}
            />
          )}
        </div>
      </div>
    </>
  );
}

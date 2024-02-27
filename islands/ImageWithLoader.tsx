import { useEffect, useLayoutEffect, useRef, useState } from "preact/hooks";
import { JSX } from "preact/jsx-runtime";
import Spinner from "../components/Spinner.tsx";

interface ImageWithLoaderProps extends JSX.HTMLAttributes<HTMLImageElement> {
  reloadOnError?: boolean;
  spinnerOnErrorOnly?: boolean;
  invertSpinnerColor?: boolean;
  hideUntilLoaded?: boolean;
  onLoad?(): void;
  maxRetryAttempts?: number;
}

export default function ImageWithLoader(props: ImageWithLoaderProps) {
  const {
    invertSpinnerColor,
    reloadOnError,
    spinnerOnErrorOnly,
    hideUntilLoaded,
    maxRetryAttempts = 5,
    onLoad,
    ...imgProps
  } = props;
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errRetryCount, setErrRetryCount] = useState(0);
  const imgRef = useRef<HTMLImageElement>(null);
  const errRetryMaxed = errRetryCount >= maxRetryAttempts;

  const handleLoaded = () => {
    setIsLoaded(true);
    setHasError(false);
    onLoad && onLoad();
  };

  const handleError = () => {
    setHasError(true);
    if (reloadOnError && !errRetryMaxed) {
      setErrRetryCount((count) => count + 1);
      const url = new URL(imgRef.current!.src);
      url.searchParams.set("time", Date.now().toString());
      const delay = 2000 + errRetryCount * 1000;
      setTimeout(() => imgRef.current!.src = url.href, delay);
    }
  };

  useLayoutEffect(() => {
    setIsLoaded(false);
  }, [imgProps.src]);

  useEffect(() => {
    if (imgRef.current?.complete) {
      handleLoaded();
    }
  }, []);

  return (
    <span class="relative block h-full">
      <img
        {...imgProps}
        ref={imgRef}
        onLoad={handleLoaded}
        onError={handleError}
        class={`
          ${imgProps.class || ""}
          ${
          (hideUntilLoaded && !isLoaded) ||
            (spinnerOnErrorOnly && hasError && !errRetryMaxed)
            ? "hidden"
            : ""
        }
          relative z-10
        `}
      />
      {(spinnerOnErrorOnly ? hasError : !isLoaded) && !errRetryMaxed && (
        <Spinner
          invertColor={invertSpinnerColor}
          class="absolute left-1/2 top-1/2 -translate-x-2/4 -translate-y-2/4"
        />
      )}
    </span>
  );
}

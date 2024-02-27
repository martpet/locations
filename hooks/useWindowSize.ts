import { useLayoutEffect, useState } from "preact/hooks";

function windowSize() {
  return {
    width: globalThis.innerWidth,
    height: globalThis.innerHeight,
  };
}

export function useWindowSize() {
  const [size, setSize] = useState(windowSize);

  useLayoutEffect(() => {
    const listener = () => setSize(windowSize());
    addEventListener("resize", listener);
    return () => removeEventListener("resize", listener);
  }, []);

  return size;
}

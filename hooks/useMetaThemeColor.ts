import { useCallback, useLayoutEffect } from "preact/hooks";

export default function useMetaThemeColor(color: string) {
  const getNodes = useCallback(() => {
    const selector = "meta[name='theme-color']";
    return document.querySelectorAll<HTMLMetaElement>(selector);
  }, []);

  useLayoutEffect(() => {
    const prevContent: string[] = [];

    for (const node of getNodes()) {
      prevContent.push(node.content);
      node.content = color;
    }

    return () => {
      Array.from(getNodes()).forEach((node, index) => {
        node.content = prevContent[index];
      });
    };
  }, []);
}

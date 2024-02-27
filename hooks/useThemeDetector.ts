import { useEffect, useState } from "preact/hooks";

export default function useThemeDetector() {
  const darkThemeMq = matchMedia("(prefers-color-scheme: dark)");
  const [isDarkTheme, setIsDarkTheme] = useState(darkThemeMq.matches);
  useEffect(() => {
    const listener = (e: MediaQueryListEvent) => setIsDarkTheme(e.matches);
    darkThemeMq.addEventListener("change", listener);
    return () => darkThemeMq.removeEventListener("change", listener);
  }, []);
  return isDarkTheme;
}

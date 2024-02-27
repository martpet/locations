import { ComponentChildren } from "preact";
import { JSX } from "preact/jsx-runtime";

interface HighlightProps extends JSX.HTMLAttributes<HTMLSpanElement> {
  type?: "warn" | "negative" | "error" | "success";
  children: ComponentChildren;
}

export default function Highlight(
  { type = "warn", children, ...spanProps }: HighlightProps,
) {
  return (
    <span
      class={`
        ${spanProps.class || ""}
        ${
        type === "warn"
          ? "bg-yellow-400/80 dark:bg-yellow-500/50"
          : type === "success"
          ? "bg-green-700 text-white"
          : type === "negative"
          ? "bg-red-300/80 dark:bg-orange-800/80"
          : "bg-red-700 text-white"
      }
        inline-block px-1  rounded-sm
      `}
    >
      {children}
    </span>
  );
}

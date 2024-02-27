import { ComponentChildren } from "preact";
import { JSX } from "preact/jsx-runtime";

interface SpinnerProps
  extends Omit<JSX.HTMLAttributes<HTMLSpanElement>, "size"> {
  size?: "sm" | "md" | "lg";
  children?: ComponentChildren;
  invertColor?: boolean;
}

export default function Spinner(
  { size = "sm", invertColor, children, ...spanProps }: SpinnerProps,
) {
  const diam = { sm: 12, md: 24, lg: 48 }[size];
  return (
    <span
      role="alert"
      {...spanProps}
      class={`inline-flex items-center gap-1.5 ${
        spanProps.class ? spanProps.class : ""
      }`}
    >
      <svg
        role="alert"
        width={diam}
        height={diam}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        class={`animate-spin inline-block text-black
          ${invertColor ? "invert" : ""} ${
          invertColor === false ? "" : "dark:invert"
        }`}
      >
        <circle
          style="opacity:0.25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          stroke-width="4"
        >
        </circle>
        <path
          style="opacity:0.75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        >
        </path>
      </svg>
      {children}
    </span>
  );
}

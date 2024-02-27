import { JSX } from "preact/jsx-runtime";

interface CloseButtonProps extends JSX.HTMLAttributes<HTMLButtonElement> {
  invertColor?: boolean;
  circle?: boolean;
}

export default function CloseButton(
  { invertColor, circle = true, ...props }: CloseButtonProps,
) {
  return (
    <button
      type="button"
      title="Затвори"
      {...props}
      class={`
        ${props.class || ""} w-5 h-5 rounded-full
        ${circle ? "bg-stone-950 shadow" : "hover:bg-black/30"}
        ${invertColor ? "invert" : ""}
        ${invertColor === false ? "" : "dark:invert"}
      `}
    >
      <svg class="w-full h-full text-white">
        <use href="/icons.svg#close" />
      </svg>
    </button>
  );
}

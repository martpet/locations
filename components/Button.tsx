import { ComponentChildren } from "preact";
import { JSX } from "preact/jsx-runtime";

interface ButtonProps
  extends Omit<JSX.HTMLAttributes<HTMLButtonElement>, "size"> {
  children: ComponentChildren;
  size?: "sm" | "md";
}

export default function Button({ size = "md", ...props }: ButtonProps) {
  return (
    <button
      {...props}
      class={`
        ${props.class || ""}
        rounded-md text-sm
        px-3 ${size === "md" ? "py-2" : "py-0.5"}
        ${props.disabled
          ? "text-zinc-400 dark:text-zinc-500 bg-zinc-300/50 dark:bg-zinc-500/50 shadow-none"
          : `bg-zinc-300 dark:bg-zinc-500 active:bg-zinc-400 active:dark:bg-zinc-600 shadow-sm shadow-zinc-500 dark:shadow-inner font-semibold       
             [:disabled_&]:text-zinc-400 [:disabled_&]:dark:text-zinc-500 [:disabled_&]:bg-zinc-300/50 [:disabled_&]:dark:bg-zinc-500/50 [:disabled_&]:shadow-none`
        // disabled styles are repeated with [:disabled] selector for when parent <fieldset> is disabled
      }
      `}
    />
  );
}

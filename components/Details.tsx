import { ComponentChildren, JSX } from "preact";

interface DetailsProps extends JSX.HTMLAttributes<HTMLDetailsElement> {
  children: ComponentChildren;
}

export default function Details({ children, ...props }: DetailsProps) {
  return (
    <details
      {...props}
      class={`
        ${props.class || ""}
        inline-block px-3 py-0 rounded
        border border-stone-300 dark:border-stone-700
        [&_summary]:cursor-pointer
        [&_summary]:py-1
        [&_summary]:border-stone-300 [&_summary]:dark:border-stone-700
        [&[open]_summary]:border-b
        [&[open]_summary]:-mx-3
        [&[open]_summary]:px-3
      `}
    >
      {children}
    </details>
  );
}

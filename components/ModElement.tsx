import { ComponentChildren, JSX } from "preact";

interface ModElementProps extends JSX.HTMLAttributes<HTMLModElement> {
  children: ComponentChildren;
}

export function Ins(props: ModElementProps) {
  return (
    <ins
      {...props}
      class={`${props.class || ""} bg-green-200 dark:bg-green-800 no-underline`}
    />
  );
}

export function Del(props: ModElementProps) {
  return (
    <del
      {...props}
      class={`${props.class || ""} bg-red-200 dark:bg-red-800`}
    />
  );
}

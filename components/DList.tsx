import { ComponentChildren } from "preact";
import { JSX } from "preact/jsx-runtime";

interface DListProps extends JSX.HTMLAttributes<HTMLDListElement> {
  children: ComponentChildren;
}

export default function DList(props: DListProps) {
  return (
    <dl
      {...props}
      class={`
        ${props.class || ""}
        sm:grid grid-flow-row grid-cols-[auto_1fr] gap-5
        [&>*]:m-0
      `}
    />
  );
}

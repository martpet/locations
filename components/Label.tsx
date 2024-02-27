import { JSX } from "preact/jsx-runtime";

type LabelProps = JSX.HTMLAttributes<HTMLLabelElement>;

export default function Label(props: LabelProps) {
  return (
    <label
      {...props}
      class={`${props.class || ""} my-5 flex flex-col items-start`}
    />
  );
}

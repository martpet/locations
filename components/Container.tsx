import { JSX } from "preact/jsx-runtime";

export default function Container(props: JSX.HTMLAttributes<HTMLDivElement>) {
  return <div {...props} class={`${props.class || ""} max-w-screen-md`} />;
}

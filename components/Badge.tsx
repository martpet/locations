import { JSX } from "preact/jsx-runtime";

export default function Badge(props: JSX.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      {...props}
      class={`${
        props.class || ""
      } inline-flex w-fit min-w-[1.5em] h-[1.5em] justify-center items-center text-sm bg-red-600 text-white rounded-full`}
    />
  );
}

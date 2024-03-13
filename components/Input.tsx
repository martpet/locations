import { Ref } from "preact";
import { JSX } from "preact/jsx-runtime";

interface InputProps extends Omit<JSX.HTMLAttributes<HTMLInputElement>, "ref"> {
  elRef?: Ref<HTMLInputElement>;
}

type TextAreaProps = JSX.HTMLAttributes<HTMLTextAreaElement>;

export default function Input({ elRef, ...props }: InputProps) {
  return (
    <input
      {...props}
      {...(elRef && { ref: elRef })}
      class={`${props.class || ""} ${css(props)}`}
    />
  );
}

export function TextArea(props: TextAreaProps) {
  return (
    <textarea
      {...props}
      class={`${props.class || ""} ${css(props)}`}
    />
  );
}

function css(props: InputProps | TextAreaProps) {
  let str =
    "bg-transparent dark:border-neutral-600 [:disabled_&]:opacity-50 rounded shadow-inner";
  if (props.type !== "checkbox") str += " w-full";
  if (props.disabled) str += " opacity-50";
  return str;
}

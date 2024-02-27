import { ComponentChildren, JSX } from "preact";

interface SideNavProps extends JSX.HTMLAttributes<HTMLElement> {
  children: ComponentChildren;
}

export default function SideNav({ children, ...navProps }: SideNavProps) {
  return (
    <nav {...navProps}>
      <ul
        class={`
          px-0 p-1 list-none rounded overflow-hidden
          bg-neutral-100 dark:bg-stone-800
          [&_a]:block
          [&_a]:py-2
          [&_a]:px-3
          [&_a]:no-underline 
          [&_a[aria-current]]:-mr-1
          [&_a[aria-current]]:pl-2.5
          [&_a[aria-current]]:border-l-2
          [&_a[aria-current]]:text-inherit
          [&_a[aria-current]]:font-semibold
          [&_a[aria-current]]:pointer-events-none
          [&_a[aria-current]]:bg-slate-300
          [&_a:hover:not([aria-current])]:bg-stone-200
          [&_a[aria-current]]:border-l-slate-500
          dark:[&_a[aria-current]]:bg-stone-700 
          dark:[&_a:hover:not([aria-current])]:bg-stone-700/50
          dark:[&_a[aria-current]]:border-l-stone-300
          [&_li]:m-0
          [&_li]:p-0
        `}
      >
        {children}
      </ul>
    </nav>
  );
}

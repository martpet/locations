import { RouteContext } from "$fresh/server.ts";
import { JSX } from "preact/jsx-runtime";
import ProfileDropdown from "../islands/ProfileDropdown.tsx";
import { getEnv, isProd, siteTitle } from "../utils/env.ts";
import { loginLink } from "../utils/resp.ts";
import { State } from "../utils/types.ts";
import Highlight from "./Highlight.tsx";

interface HeaderProps {
  ctx: RouteContext<void, State>;
}

export default function Header({ ctx }: HeaderProps) {
  const path = ctx.url.pathname;
  const user = ctx.state.user;
  const isDenoDevEnv = !isProd() && !ctx.url.origin.includes("localhost");
  const isDemoHost = ctx.url.host === getEnv("PROD_HOST_DENO");

  return (
    <header class="sm:flex flex-wrap items-center gap-10 px-5 dark:bg-zinc-900 border-b dark:border-b-zinc-800">
      <h1 class="max-sm:mb-3 text-stone-900 dark:text-white m-0 text-[55px]">
        <span class="relative top-[3px]">{siteTitle()}</span>
      </h1>
      {(isDenoDevEnv || isDemoHost) && (
        <Highlight class="text-xs">
          {isDenoDevEnv ? "DEV" : "DEMO"}
        </Highlight>
      )}
      <nav class="grow">
        <ul class="not-prose grow flex flex-wrap gap-5 items-center text-sm">
          {path !== "/places/new" && (
            <>
              <NavLinkItem href="/">Карта</NavLinkItem>
              <NavLinkItem href="/places">Списък</NavLinkItem>
            </>
          )}
          <div class="flex gap-2.5 ml-auto items-center">
            {path !== "/places/new" && (
              <NavButtonItem href="/places/new">
                Добави
              </NavButtonItem>
            )}
            {!user && (
              <NavLinkItem href={loginLink(ctx.url.pathname)}>Вход</NavLinkItem>
            )}
            {user && (
              <li class="-my-1">
                <ProfileDropdown user={user} />
              </li>
            )}
          </div>
        </ul>
      </nav>
    </header>
  );
}

function NavLinkItem(props: JSX.HTMLAttributes<HTMLAnchorElement>) {
  return (
    <li class="-mx-2 px-2 rounded-md hover:bg-gray-100/90 dark:hover:bg-stone-800">
      <a
        {...props}
        class={`block h-6 leading-6 px-0.5 text-gray-500 dark:text-stone-400 hover:text-black dark:hover:text-white 
        data-[current]:text-stone-900 dark:data-[current]:text-stone-100 data-[current]:border-b data-[current]:border-b-black dark:data-[current]:border-b-white`}
      />
    </li>
  );
}

function NavButtonItem(props: JSX.HTMLAttributes<HTMLAnchorElement>) {
  return (
    <li>
      <a
        {...props}
        class={`inline-flex h-7 items-center gap-1 px-3 whitespace-nowrap rounded-md before:content-['+_']
        border border-gray-300 hover:border-gray-600 dark:border-gray-500 hover:dark:border-gray-300`}
      />
    </li>
  );
}

import { asset } from "$fresh/runtime.ts";
import { type PageProps } from "$fresh/server.ts";
import { siteTitle } from "../utils/env.ts";
import { RSS_TITLE } from "./rss.xml.tsx";
export default function App({ Component }: PageProps) {
  return (
    <html lang="bg">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta
          name="theme-color"
          content="white"
          media="(prefers-color-scheme: light)"
        />
        <meta
          name="theme-color"
          content="rgb(24 24 27)"
          media="(prefers-color-scheme: dark)"
        />
        <title>{siteTitle()}</title>
        <link rel="stylesheet" href={asset("/styles.css")} />
        <link
          rel="alternate"
          type="application/xml"
          href="/rss.xml"
          title={RSS_TITLE}
        />
      </head>
      <body
        class={`max-w-none min-h-dvh flex flex-col
        prose prose-stone dark:prose-invert 
        dark:bg-stone-950 
        prose-a:text-blue-600 dark:prose-a:text-blue-400 
        visited:prose-a:text-purple-700 visited:dark:prose-a:text-purple-400
        active:prose-a:text-red-500 active:dark:prose-a:text-red-400`}
      >
        <Component />
      </body>
    </html>
  );
}

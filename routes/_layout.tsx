import { defineLayout } from "$fresh/server.ts";
import Flash from "../components/Flash.tsx";
import Header from "../components/Header.tsx";
import { State } from "../utils/types.ts";

export default defineLayout<State>((_req, ctx) => {
  return (
    <>
      <Header ctx={ctx} />
      <Flash ctx={ctx} />
      <main class="relative flex-grow px-5 pt-6 sm:pt-12 pb-8">
        <ctx.Component />
      </main>
    </>
  );
});

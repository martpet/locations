import { Head } from "$fresh/runtime.ts";
import { defineRoute } from "$fresh/src/server/defines.ts";
import { siteTitle } from "../../utils/env.ts";
import { loginRedirect } from "../../utils/resp.ts";
import { State } from "../../utils/types.ts";
import PlaceForm from "./(_islands)/PlaceForm.tsx";

export default defineRoute<State>((req, ctx) => {
  const user = ctx.state.user;
  if (!user) {
    return loginRedirect(req.url);
  }
  return (
    <>
      <Head>
        <title>Добави | {siteTitle()}</title>
      </Head>
      <h1>Добави</h1>
      <PlaceForm />
    </>
  );
});

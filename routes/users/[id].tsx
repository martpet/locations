import { Head } from "$fresh/runtime.ts";
import { defineRoute, Handler } from "$fresh/server.ts";
import { decodeTime } from "ulid";
import { UserPublicPic } from "../../components/Avatar.tsx";
import { dateTimeFormat } from "../../utils/datetime.ts";
import { getUser, listPlacesByUser } from "../../utils/db.ts";
import { siteTitle } from "../../utils/env.ts";
import { State } from "../../utils/types.ts";
import UserPlaces from "../profile/(_components)/UserPlaces.tsx";

export const handler: Handler = async (_req, ctx) => {
  const resp = await ctx.render();
  resp.headers.set("cache-control", "public, max-age=1800");
  return resp;
};

export default defineRoute<State>(async (_req, ctx) => {
  const id = ctx.params.id;
  const currentUser = ctx.state.user;
  let user;

  if (currentUser?.id === id) {
    user = currentUser;
  } else {
    user = await getUser(id);
  }
  if (!user) {
    return ctx.renderNotFound();
  }
  const places = await listPlacesByUser(user.id);
  const dateCreated = new Date(decodeTime(user.id));
  const dateFmt = dateTimeFormat({ dateStyle: "long" });

  return (
    <>
      <Head>
        <title>Потребител: {user.pubName} | {siteTitle()}</title>
      </Head>
      <article>
        <h1 class="flex items-center gap-3">
          <UserPublicPic user={user} class="!w-14 shrink-0" />{" "}
          <span class="break-all">{user.pubName}</span>
        </h1>
        <aside>
          <p>
            Регистриран на{" "}
            <time datetime={dateCreated.toISOString()}>
              {dateFmt.format(dateCreated)}
            </time>
            {user.pubEmail && (
              <>
                <br />
                <a href={`mailto:${user.pubEmail}`}>{user.pubEmail}</a>
              </>
            )}
            {user.pubWebsite && (
              <>
                <br />
                <a href={user.pubWebsite} rel="nofollow">
                  {user.pubWebsite.split("//").at(-1)}
                </a>
              </>
            )}
          </p>
        </aside>
        <UserPlaces user={user} places={places} />
      </article>
    </>
  );
});

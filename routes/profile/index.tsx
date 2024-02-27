import { Head } from "$fresh/runtime.ts";
import { defineRoute } from "$fresh/server.ts";
import { UserPublicPic } from "../../components/Avatar.tsx";
import DList from "../../components/DList.tsx";
import Details from "../../components/Details.tsx";
import {
  listDraftsByUser,
  listLastDeclinedDraftsByUsers,
  listPlacesByUser,
} from "../../utils/db.ts";
import { siteTitle } from "../../utils/env.ts";
import { State, User } from "../../utils/types.ts";
import UserPlaces from "./(_components)/UserPlaces.tsx";

export default defineRoute<State>(async (_req, ctx) => {
  const user = ctx.state.user;
  if (!user) {
    throw new Error("missing profile user");
  }
  const [places, drafts, declined] = await Promise.all([
    listPlacesByUser(user.id),
    listDraftsByUser(user.id),
    listLastDeclinedDraftsByUsers(user.id),
  ]);

  return (
    <>
      <Head>
        <title>Твоят профил | {siteTitle()}</title>
      </Head>
      <h1>Здравей, {user.pubName}</h1>
      <PersonalDetails user={user} />
      <UserPlaces
        user={user}
        places={places}
        drafts={drafts}
        declined={declined}
      />
    </>
  );
});

function PersonalDetails({ user }: { user: User }) {
  return (
    <Details>
      <summary>Твоите публични данни</summary>
      <DList class="!gap-3 mb-5 mt-3">
        <dt>Име</dt>
        <dd>{user.pubName}</dd>
        <dt>Снимка</dt>
        <dd class="self-center">
          <UserPublicPic user={user} />
        </dd>
        <dt>Имейл</dt>
        <dd>{user.pubEmail || "няма"}</dd>
        <dt>Уебсайт</dt>
        <dd>{user.pubWebsite || "няма"}</dd>
      </DList>
      <nav class="mb-3 flex flex-col gap-1">
        <a href="/profile/edit">Редактирай</a>
        <a href={"/users/" + user.id}>Виж публичния си профил</a>
      </nav>
    </Details>
  );
}

import { Head } from "$fresh/runtime.ts";
import { defineRoute } from "$fresh/src/server/defines.ts";
import Avatar from "../../../../components/Avatar.tsx";
import DList from "../../../../components/DList.tsx";
import Highlight from "../../../../components/Highlight.tsx";
import { dateTimeFormat } from "../../../../utils/datetime.ts";
import { getUser } from "../../../../utils/db.ts";
import { siteTitle } from "../../../../utils/env.ts";
import { State, User } from "../../../../utils/types.ts";
import { banUserDisallowed } from "../../../../utils/users.ts";

export default defineRoute<State>(async (_req, ctx) => {
  const user = await getUser(ctx.params.id);
  if (!user) {
    return ctx.renderNotFound();
  }
  const canBan = !banUserDisallowed({
    targetUser: user,
    currentUser: ctx.state.user!,
  });
  return (
    <>
      <Head>
        <title>Админ | Потребител: {user.id} | {siteTitle()}</title>
      </Head>
      <h1>Потребител</h1>
      <DList>
        <dt>ID</dt>
        <dd>{user.id}</dd>
        <dt>Google снимка</dt>
        <dd>
          <a href={user.gUser.picture}>
            <Avatar picture={user.gUser.picture} />
          </a>
        </dd>
        <dt>Google ID</dt>
        <dd>{user.gUser.id}</dd>
        <dt>Google име</dt>
        <dd>{user.gUser.name}</dd>
        <dt>Google имейл</dt>
        <dd>{user.gUser.email}</dd>
        <dt>Публично име</dt>
        <dd>{user.pubName}</dd>
        <dt>Блокиран</dt>
        <dd>
          <BannedUserField user={user} />
        </dd>
      </DList>

      {canBan && (
        <p>
          <a href={`/admin/users/${user.id}/access`}>Достъп</a>
        </p>
      )}

      <footer class="mt-16">
        <a href="/admin/users">Всички потребители</a>
      </footer>
    </>
  );
});

function BannedUserField({ user }: { user: User }) {
  const dateFmt = dateTimeFormat({ dateStyle: "short", timeStyle: "short" });
  return (
    <>
      {user.isBanned
        ? (
          <>
            <Highlight type="negative">
              блокиран на {dateFmt.format(user.banToggleDate)}
            </Highlight>
            {user.banUserMsg && (
              <>
                {" "}Текст до потребителя: <em>{user.banUserMsg}</em>
              </>
            )}
          </>
        )
        : user.banToggleDate
        ? `отблокиран на ${dateFmt.format(user.banToggleDate)}`
        : "не"}
    </>
  );
}

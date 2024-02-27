import { Head } from "$fresh/runtime.ts";
import { defineRoute } from "$fresh/src/server/defines.ts";
// @deno-types="npm:@types/diff"
import { diffWordsWithSpace } from "diff";
import { decodeTime } from "ulid";
import DList from "../../../components/DList.tsx";
import MarkedChanges from "../../../components/MarkedChanges.tsx";
import { dateTimeFormat } from "../../../utils/datetime.ts";
import { getLog, getUser } from "../../../utils/db.ts";
import { siteTitle } from "../../../utils/env.ts";
import { Log } from "../../../utils/types.ts";

export default defineRoute(async (_req, ctx) => {
  const dateFmt = dateTimeFormat({ dateStyle: "long", timeStyle: "medium" });
  const log = await getLog(ctx.params.id);
  if (!log) {
    return ctx.renderNotFound();
  }
  const user = await getUser(log.user);
  if (!user) {
    throw new Error("missing log user");
  }
  return (
    <>
      <Head>
        <title>Админ | Лог: {log.id} | {siteTitle()}</title>
      </Head>
      <h1>{log.type.replace("_", " ")}</h1>
      <DList>
        <dt>Дата</dt>
        <dd>{dateFmt.format(decodeTime(log.id))}</dd>
        <dt>ID</dt>
        <dd>{log.id}</dd>
        <dt>От потребител</dt>
        <dd>
          <a href={`/admin/users/${log.user}`}>{user.gUser.name}</a>
        </dd>
        <RelatedLink log={log} />
        {log.data && (
          <>
            <dt>Data</dt>
            <dd class="whitespace-pre-wrap font-mono">
              <LogData log={log} />
            </dd>
          </>
        )}
      </DList>
      <footer class="mt-16">
        <a href="/admin/logs">Всички логове</a>
      </footer>
    </>
  );
});

function LogData({ log }: { log: Log }) {
  if (log.type === "user_personal_details_updated") {
    return (
      <MarkedChanges
        changes={diffWordsWithSpace(
          JSON.stringify(log.data.olduser, null, 2),
          JSON.stringify(log.data.newUser, null, 2),
        )}
      />
    );
  }
  return <>{JSON.stringify(log.data, null, 2)}</>;
}

function RelatedLink({ log }: { log: Log }) {
  const isDraftRev = log.type === "draft_created" ||
    log.type === "draft_approved" || log.type === "draft_declined";

  if (isDraftRev) {
    return (
      <>
        <dt>Link</dt>
        <dd>
          <a
            href={`/admin/places/${log.data.placeId}/draft/revs/${log.data.revId}`}
          >
            Draft Rev
          </a>
        </dd>
      </>
    );
  }

  return null;
}

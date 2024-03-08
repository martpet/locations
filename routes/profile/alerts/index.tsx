import { Head } from "$fresh/runtime.ts";
import { defineRoute } from "$fresh/server.ts";
import { decodeTime } from "ulid";
import { dateTimeFormat } from "../../../utils/datetime.ts";
import {
  getLastSeenAlertId,
  listAlerts,
  listLogs,
  setLastSeenAlert,
} from "../../../utils/db.ts";
import { siteTitle } from "../../../utils/env.ts";
import { isAlertableLog } from "../../../utils/logs.ts";
import { Alert, Log, State } from "../../../utils/types.ts";

export default defineRoute<State>(async (_req, ctx) => {
  const user = ctx.state.user!;
  const dateFmt = dateTimeFormat({ timeStyle: "short", dateStyle: "medium" });
  const [ammonia, Marked] = await Promise.all([
    import("ammonia"),
    import("marked"),
  ]);
  await ammonia.init();

  const [alerts, logs, lastSeenId = ""] = await Promise.all([
    listAlerts(user),
    user.isAdmin ? listLogs() : [],
    getLastSeenAlertId(user.id),
  ]);

  const filteredLogs = logs.filter((log) => isAlertableLog(log, user));
  const logsAsAlerts = filteredLogs.map(logToAlert);

  const items = [...alerts, ...logsAsAlerts]
    .sort((a, b) => a.id > b.id ? -1 : a.id < b.id ? 1 : 0);

  if (items.length && lastSeenId < items[0].id) {
    await setLastSeenAlert(items[0].id, user.id);
  }

  return (
    <>
      <Head>
        <title>Съобщения | {siteTitle()}</title>
      </Head>
      <h1>Съобщения</h1>
      {!items.length && <p>Няма съобщения</p>}
      <div class="max-w-6xl sm:grid grid-flow-row grid-cols-[auto_1fr] gap-8 max-sm:divide-y dark:max-sm:divide-gray-800 [&>*+*]:max-sm:pt-3">
        {items.map((item) => (
          <article class="col-span-2 grid grid-cols-subgrid grid-rows-subgrid sm:mt-3">
            <header class="sm:mt-1">
              {dateFmt.format(decodeTime(item.id))}
            </header>
            <div>
              <h2 class="m-0">{item.title}</h2>
              {item.body && (
                <div
                  dangerouslySetInnerHTML={{
                    __html: ammonia.clean(Marked.parse(item.body) as string),
                  }}
                />
              )}
            </div>
          </article>
        ))}
      </div>
    </>
  );
});

function logToAlert(log: Log): Alert {
  return {
    id: log.id,
    userId: log.user,
    title: log.type.replace("_", " "),
    body: `[Log](/admin/logs/${log.id})`,
  };
}

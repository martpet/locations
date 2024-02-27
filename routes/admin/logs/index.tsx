import { Head } from "$fresh/runtime.ts";
import { defineRoute } from "$fresh/server.ts";
import { decodeTime } from "ulid";
import { dateTimeFormat } from "../../../utils/datetime.ts";
import { listLogs } from "../../../utils/db.ts";
import { siteTitle } from "../../../utils/env.ts";

export default defineRoute(async () => {
  const logs = await listLogs();
  const dateFmt = dateTimeFormat({ dateStyle: "long", timeStyle: "medium" });
  return (
    <>
      <Head>
        <title>Админ | Логове | {siteTitle()}</title>
      </Head>
      <h1>Логове</h1>
      <table class="w-auto">
        <thead>
          <tr>
            <th>Дата</th>
            <th>Тип</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr>
              <td data-label="Дата">
                {dateFmt.format(decodeTime(log.id))}
              </td>
              <td data-label="Действие">
                <a href={`/admin/logs/${log.id}`} class="font-inherit">
                  {log.type.replace("_", " ")}
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
});

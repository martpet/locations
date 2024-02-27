import { Head } from "$fresh/runtime.ts";
import { defineRoute } from "$fresh/server.ts";
import { decodeTime } from "ulid";
import { dateTimeFormat } from "../../../utils/datetime.ts";
import { listUsers } from "../../../utils/db.ts";
import { siteTitle } from "../../../utils/env.ts";

export default defineRoute(async () => {
  const users = await listUsers();
  const dateFmt = dateTimeFormat({ dateStyle: "short", timeStyle: "short" });
  return (
    <>
      <Head>
        <title>Админ | Потребители | {siteTitle()}</title>
      </Head>
      <h1>Потребители</h1>
      <table class="w-auto">
        <thead>
          <tr>
            <th>Име</th>
            <th>Админ</th>
            <th>Имейл</th>
            <th>Създаден на</th>
          </tr>
        </thead>
        {users.map((user) => (
          <tr>
            <td data-label="Име">
              <a href={`/admin/users/${user.id}`}>{user.gUser.name}</a>
            </td>
            <td data-label="Админ">{user.isAdmin ? "☑️" : "-"}</td>
            <td data-label="Имейл">{user.gUser.email}</td>
            <td data-label="Създаден на">
              {dateFmt.format(decodeTime(user.id))}
            </td>
          </tr>
        ))}
      </table>
    </>
  );
});

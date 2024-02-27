import { Head } from "$fresh/runtime.ts";
import { siteTitle } from "../../utils/env.ts";

export default function AdminPage() {
  return (
    <>
      <Head>
        <title>Админ | {siteTitle()}</title>
      </Head>
      <h1>Админ</h1>
      <nav>
        <ul>
          <li>
            <a href="/admin/places">Постове</a>
          </li>
          <li>
            <a href="/admin/logs">Логове</a>
          </li>
          <li>
            <a href="/admin/users">Потребители</a>
          </li>
          <li>
            <a href="/admin/edit-db">Редактиране база данни</a>
          </li>
          <li>
            <a href="/admin/delete-db">Изтриване база данни</a>
          </li>
        </ul>
      </nav>
    </>
  );
}

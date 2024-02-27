import { Head } from "$fresh/runtime.ts";
import { siteTitle } from "../utils/env.ts";

export default function Error404() {
  return (
    <>
      <Head>
        <title>
          Грешка 404: Страницата не e открита | {siteTitle()}
        </title>
      </Head>
      <h1>Страницата не e открита</h1>
      <p>
        <a href="/places">Виж всички постове</a>
      </p>
    </>
  );
}

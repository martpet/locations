import { Head } from "$fresh/runtime.ts";
import { defineRoute } from "$fresh/server.ts";
import { decodeTime } from "ulid";
import { dateTimeFormat } from "../../../utils/datetime.ts";
import {
  listDrafts,
  listLastDeclinedDraftsByUsers,
  listPlaces,
} from "../../../utils/db.ts";
import { siteTitle } from "../../../utils/env.ts";
import { DeclinedDraft, Place, State } from "../../../utils/types.ts";

export default defineRoute<State>(async (_req, ctx) => {
  const [published, drafts, declined] = await Promise.all([
    listPlaces({ consistency: "strong" }),
    listDrafts({ consistency: "strong" }),
    listLastDeclinedDraftsByUsers(undefined, { consistency: "strong" }),
  ]);
  return (
    <>
      <Head>
        <title>Админ | Постове | {siteTitle()}</title>
      </Head>
      <h1>Постове</h1>
      <section>
        <h2>Чакащи одобрениe</h2>
        {drafts.length > 0 ? <PlacesTable places={drafts} isDraft /> : "няма"}
      </section>
      <section>
        <h2>Публикувани</h2>
        {published.length > 0 ? <PlacesTable places={published} /> : "няма"}
      </section>
      <section>
        <h2>Отказани</h2>
        {declined.length > 0
          ? <PlacesTable places={declined} isDeclined />
          : "няма"}
      </section>
    </>
  );
});

interface PlacesTableProps {
  places: Place[];
  isDraft?: boolean;
  isDeclined?: boolean;
}

function PlacesTable({ places, isDraft, isDeclined }: PlacesTableProps) {
  const dateFmt = dateTimeFormat({ dateStyle: "short", timeStyle: "short" });
  return (
    <table>
      <thead>
        <tr>
          <th>Заглавие</th>
          <th>Редакция</th>
          <th>Първа публикация</th>
          {isDeclined && <th>Дата на отказване</th>}
        </tr>
      </thead>
      <tbody>
        {places.map((place) => {
          let href = `/${place.slug}`;
          if (isDraft || isDeclined) {
            href = `/admin/places/${place.id}/draft/revs/${place.rev}`;
          }
          return (
            <tr>
              <td data-label="Заглавие">
                <a href={href}>{place.title}</a>
              </td>
              <td data-label="Редакция">
                {dateFmt.format(decodeTime(place.rev))}
              </td>
              <td data-label="Първа публикация">
                {place.firstPubRev
                  ? dateFmt.format(decodeTime(place.firstPubRev))
                  : "-"}
              </td>
              {isDeclined && (
                <td data-label="Дата на отказване">
                  {dateFmt.format((place as DeclinedDraft).dateDeclined)}
                </td>
              )}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

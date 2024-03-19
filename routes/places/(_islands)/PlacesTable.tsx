import { IS_BROWSER } from "$fresh/runtime.ts";
import { useEffect, useState } from "preact/hooks";
import { decodeTime } from "ulid";
import Spinner from "../../../components/Spinner.tsx";
import { dateTimeFormat } from "../../../utils/datetime.ts";
import { PublishedPlace } from "../../../utils/types.ts";

interface PlaceSort {
  attr: "rev" | "firstPubRev" | "postalCode";
  order: "asc" | "desc";
}

const LOCAL_STORAGE_SORT_KEY = "places_table_sort";

function initialSort(): PlaceSort {
  if (IS_BROWSER) {
    const savedSort = localStorage.getItem(LOCAL_STORAGE_SORT_KEY);
    if (savedSort) return JSON.parse(savedSort);
  }
  return { attr: "firstPubRev", order: "desc" };
}

interface PlacesTableProps {
  places: PublishedPlace[];
}

export default function PlacesTable({ places }: PlacesTableProps) {
  const [sort, setSort] = useState<PlaceSort>(initialSort);
  const dateFmt = dateTimeFormat({ dateStyle: "short", timeStyle: "short" });

  places.sort((placeA, placeB) => {
    let a, b;
    if (sort.attr === "postalCode") {
      a = placeA.address.details.postalCode;
      b = placeB.address.details.postalCode;
    } else {
      a = placeA[sort.attr];
      b = placeB[sort.attr];
    }
    const val = a > b ? 1 : a < b ? -1 : 0;
    if (sort.order === "asc") return val;
    return val * -1;
  });

  const sortArrow = (attr: PlaceSort["attr"]) =>
    sort.attr !== attr ? "" : sort.order === "asc" ? "▲" : "▼";

  const toggleSort = (attr: PlaceSort["attr"]) =>
    setSort({
      attr,
      order: sort.order === "asc" ? "desc" : "asc",
    });

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_SORT_KEY, JSON.stringify(sort));
  }, [sort]);

  return (
    <>
      <Spinner class={IS_BROWSER ? "hidden" : ""} />
      <table class={`${!IS_BROWSER ? "hidden" : ""} mt-0`}>
        <thead class="max-sm:hidden">
          <tr>
            <th>Име</th>
            <th>Адрес</th>
            <th>
              <button onClick={() => toggleSort("postalCode")}>
                Пощенски код {sortArrow("postalCode")}
              </button>
            </th>
            <th class="whitespace-nowrap">
              <button onClick={() => toggleSort("firstPubRev")}>
                Добавен на {sortArrow("firstPubRev")}
              </button>
            </th>
            <th class="whitespace-nowrap">
              <button onClick={() => toggleSort("rev")}>
                Редактиран на {sortArrow("rev")}
              </button>
            </th>
          </tr>
        </thead>
        <tbody class="max-sm:[&_td]:block max-sm:[&_td]:px-0 max-sm:[&_td]:py-0">
          {places.map((place) => (
            <tr class="max-sm:flex max-sm:flex-col max-sm:mb-5 max-sm:border-none">
              <td>
                <a href={"/" + place.slug}>{place.title}</a>
              </td>
              <td>{place.address[place.address.current]}</td>
              <td class="max-sm:!hidden">{place.address.details.postalCode}</td>
              <td class="whitespace-nowrap">
                {dateFmt.format(decodeTime(place.firstPubRev))}
              </td>
              <td class="whitespace-nowrap max-sm:!hidden">
                {place.rev === place.firstPubRev
                  ? "-"
                  : dateFmt.format(decodeTime(place.rev))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

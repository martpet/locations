// @deno-types="npm:@types/diff"
import { Change, diffLines, diffWordsWithSpace } from "diff";
import { JSX } from "preact/jsx-runtime";
import { UserPublicPic } from "../../../components/Avatar.tsx";
import Container from "../../../components/Container.tsx";
import DList from "../../../components/DList.tsx";
import MarkedChanges from "../../../components/MarkedChanges.tsx";
import Gallery, { GalleryItem } from "../../../islands/Gallery.tsx";
import { Place, User } from "../../../utils/types.ts";

function hasChanges(changes: Change[]) {
  return changes.some((c) => c.added || c.removed);
}

interface PlaceDiffProps extends JSX.HTMLAttributes<HTMLDListElement> {
  current: Place;
  prev: Place | null;
  pathname: string;
  photosOrigin: string;
  author?: User;
  onlyChanges?: boolean;
  hideAuthor?: boolean;
}

export default function PlaceDiff(props: PlaceDiffProps) {
  const { current, prev, author, onlyChanges, hideAuthor, ...dListProps } =
    props;

  const titleChanges = diffWordsWithSpace(
    prev?.title || "",
    current.title,
  );
  const descriptionChanges = diffWordsWithSpace(
    prev?.description || "",
    current.description || "",
  );
  const addressChanges = diffWordsWithSpace(
    prev ? prev.address[prev.address.current] : "",
    current.address[current.address.current],
  );
  const lngChanges = diffWordsWithSpace(
    prev?.lngLat[0].toString() || "",
    current.lngLat[0].toString(),
  );
  const latChanges = diffWordsWithSpace(
    prev?.lngLat[1].toString() || "",
    current.lngLat[1].toString(),
  );
  const photosChanges = diffLines(
    (prev?.photos || [""]).join("\n") + "\n",
    current.photos.join("\n") + "\n",
  );

  const galleryItems = (changes: Change[]) => {
    if (onlyChanges) changes = changes.filter((it) => it.added || it.removed);
    return changes.map((change) =>
      change.value.split("\n").filter((x) => x).map((val) => ({
        src: `${props.photosOrigin}/${val}`,
        href: `${props.pathname}#${val.replace(".jpeg", "")}`,
        css: "!h-24",
        diffChange: change,
      } satisfies GalleryItem))
    ).flat();
  };

  return (
    <DList
      {...dListProps}
      class={`${dListProps.class || ""} gap-y-8 [&_dt]:w-24`}
    >
      {author && !hideAuthor && (
        <>
          <dt>Автор</dt>
          <dd>
            <a href={"/users/" + author.id} class="flex items-center gap-1.5">
              <UserPublicPic user={author} />
              {author.pubName}
            </a>
          </dd>
        </>
      )}
      {(hasChanges(titleChanges) || !onlyChanges) && (
        <>
          <dt>Заглавие</dt>
          <dd>
            <MarkedChanges changes={titleChanges} />
          </dd>
        </>
      )}
      {(hasChanges(descriptionChanges) || !onlyChanges) &&
        (prev?.description || current.description) && (
        <>
          <dt>Допълнение</dt>
          <dd class={`whitespace-pre-wrap`}>
            <Container>
              <MarkedChanges
                changes={descriptionChanges}
                onlyChangedLines={onlyChanges}
              />
            </Container>
          </dd>
        </>
      )}
      {(hasChanges(addressChanges) || !onlyChanges) && (
        <>
          <dt>Адрес</dt>
          <dd>
            <MarkedChanges changes={addressChanges} />
          </dd>
        </>
      )}
      {(hasChanges(lngChanges) || hasChanges(latChanges) || !onlyChanges) && (
        <>
          <dt>Координати</dt>
          <dd>
            <MarkedChanges changes={lngChanges} />
            {", "}
            <MarkedChanges changes={latChanges} />
          </dd>
        </>
      )}
      {(hasChanges(photosChanges) || !onlyChanges) && (
        <>
          <dt>Снимки</dt>
          <dd>
            <Gallery items={galleryItems(photosChanges)} />
          </dd>
        </>
      )}
    </DList>
  );
}

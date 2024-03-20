import { decodeTime } from "ulid";
import Container from "../../../components/Container.tsx";
import Gallery from "../../../islands/Gallery.tsx";
import { dateTimeFormat } from "../../../utils/datetime.ts";
import {
  DeclinedDraft,
  Place,
  PublishedPlace,
  SanitizedPlace,
  User,
} from "../../../utils/types.ts";
import PlaceDraftHeader from "./PlaceDraftHeader.tsx";
import PlaceHeader from "./PlaceHeader.tsx";

interface PlaceProps {
  place: SanitizedPlace<Place | DeclinedDraft>;
  photosOrigin: string;
  editLink?: string;
  prevRev?: Place | null;
  createdBy?: User;
  draftUser?: User;
  pathname?: string;
  isDraft?: boolean;
  isApprovedDraft?: boolean;
  isAdmin?: boolean;
}

export default function PlaceArticle(props: PlaceProps) {
  const galleryItems = props.place.photos.map((key) => ({
    href: `/${props.place.slug}/photos/${key.replace(".jpeg", "")}`,
    src: props.photosOrigin + "/" + key,
  }));
  const isDeclined = isDeclinedDraft(props.place);
  return (
    <article>
      {(props.isDraft || props.isApprovedDraft || isDeclined) && (
        <PlaceDraftHeader
          place={props.place}
          prevRev={props.prevRev}
          draftUser={props.draftUser}
          isDraft={props.isDraft}
          isApprovedDraft={props.isApprovedDraft}
          isAdmin={props.isAdmin}
          pathname={props.pathname}
          photosOrigin={props.photosOrigin}
        />
      )}
      <PlaceHeader place={props.place} />
      <Gallery
        class="my-10"
        items={galleryItems}
        errorRetryAttempts={10}
      />
      {props.place.sanitized_description && (
        <Container
          class="mt-12"
          dangerouslySetInnerHTML={{
            __html: props.place.sanitized_description,
          }}
        />
      )}
      <footer class="mt-16 border-t dark:border-stone-800">
        {props.createdBy && (
          <ArticleDate
            place={props.place as PublishedPlace}
            createdBy={props.createdBy}
          />
        )}
        {props.editLink && (
          <p class="text-sm">
            <a href={props.editLink}>Редактирай страницата</a>
          </p>
        )}
      </footer>
    </article>
  );
}

function ArticleDate(props: { place: PublishedPlace; createdBy: User }) {
  const { place, createdBy } = props;
  const isEditted = place.firstPubRev && place.lastPubRev &&
    place.firstPubRev !== place.lastPubRev;
  const pubDate = place.firstPubRev && new Date(decodeTime(place.firstPubRev));
  const editDate = isEditted && new Date(decodeTime(place.lastPubRev));
  const dateOnlyFmt = dateTimeFormat({ dateStyle: "short" });
  const dateFmt = dateTimeFormat({ dateStyle: "short", timeStyle: "short" });
  return (
    <p class="text-sm my-6">
      {pubDate && (
        <>
          Добавено на{" "}
          <time datetime={pubDate.toISOString()}>
            {dateOnlyFmt.format(pubDate)}
          </time>
          {createdBy && (
            <>
              {" от "}
              <a href={"/users/" + createdBy.id}>{createdBy?.pubName}</a>
            </>
          )}
        </>
      )}
      {editDate && (
        <>
          <br /> Редактирано на{" "}
          <time datetime={editDate.toISOString()}>
            {dateFmt.format(editDate)}
          </time>{" "}
          (<a href={`/places/${place.id}/revs/${place.lastPubRev}`}>
            история
          </a>)
        </>
      )}
    </p>
  );
}

function isDeclinedDraft(place: Place | DeclinedDraft): place is DeclinedDraft {
  return typeof (place as DeclinedDraft).reasonDeclined === "string";
}

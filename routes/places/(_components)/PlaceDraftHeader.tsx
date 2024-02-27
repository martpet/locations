import { decodeTime } from "ulid";
import Details from "../../../components/Details.tsx";
import Highlight from "../../../components/Highlight.tsx";
import { dateTimeFormat } from "../../../utils/datetime.ts";
import { DeclinedDraft, Place, User } from "../../../utils/types.ts";
import PlaceDiff from "./PlaceDiff.tsx";

interface PlaceDraftHeaderProps {
  place: Place | DeclinedDraft;
  photosOrigin: string;
  prevRev?: Place | null;
  draftUser?: User;
  isDraft?: boolean;
  isApprovedDraft?: boolean;
  isAdmin?: boolean;
  pathname?: string;
}

export default function PlaceDraftHeader(props: PlaceDraftHeaderProps) {
  const { place } = props;
  const isDeclined = isDeclinedDraft(place);
  return (
    <header class="mb-7 pb-7 border-b dark:border-gray-700">
      {props.isDraft && <DraftAlert place={place} isAdmin={props.isAdmin} />}
      {props.isApprovedDraft && <ApprovedDraftAlert place={place} />}
      {isDeclined && <DeclinedDraftAlert place={place} />}
      {(props.isDraft || props.isApprovedDraft || isDeclined) && (
        <DraftDate
          place={props.place}
          draftUser={props.draftUser}
          isAdmin={props.isAdmin}
        />
      )}
      {(props.isDraft || props.isApprovedDraft || isDeclined) && (
        <div class="flex flex-col items-start gap-3">
          {isDeclined && <ReasonDeclined place={place} />}
          {props.prevRev && props.pathname && (
            <PlaceDiffCompact
              current={props.place}
              prev={props.prevRev}
              pathname={props.pathname}
              photosOrigin={props.photosOrigin}
            />
          )}
        </div>
      )}
    </header>
  );
}

export function DraftAlert(
  props: {
    place: Place;
    isAdmin?: boolean;
  },
) {
  return (
    <>
      <p>
        <Highlight class="font-semibold">
          {props.place.firstPubRev ? "Редакцията" : "Постът"}{" "}
          очаква одобрение от администратор
        </Highlight>
      </p>
      {props.isAdmin && (
        <p>
          <a
            href={`/admin/places/${props.place.id}/draft/evaluate`}
            class="font-bold"
          >
            Одобри или откажи
          </a>
        </p>
      )}
    </>
  );
}

function DeclinedDraftAlert(props: {
  place: DeclinedDraft;
}) {
  return (
    <p>
      <Highlight type="negative" class="font-semibold">
        {props.place.firstPubRev ? "Отказана редакция" : "Отказан пост"}{" "}
        от администратор
      </Highlight>
    </p>
  );
}

function ApprovedDraftAlert(props: { place: Place }) {
  return (
    <p>
      <Highlight type="success" class="font-semibold">
        {props.place.firstPubRev ? "Одобрена редакция" : "Одобрен пост"}
      </Highlight>
    </p>
  );
}

function DraftDate(
  props: { place: Place; draftUser?: User; isAdmin?: boolean },
) {
  const date = new Date(decodeTime(props.place.rev));
  const dateFmt = dateTimeFormat({ dateStyle: "short", timeStyle: "short" });
  return (
    <p>
      Изпратено на {dateFmt.format(date)}
      {props.isAdmin && props.draftUser && (
        <>
          {" от "}
          <a href={`/admin/users/${props.draftUser.id}`}>
            {props.draftUser.pubName}
          </a>
        </>
      )}
    </p>
  );
}

export function PlaceDiffCompact(props: {
  current: Place;
  prev: Place;
  pathname: string;
  photosOrigin: string;
}) {
  return (
    <Details>
      <summary>Виж разликите</summary>
      <PlaceDiff
        current={props.current}
        prev={props.prev}
        pathname={props.pathname}
        photosOrigin={props.photosOrigin}
        onlyChanges
        class="my-2"
      />
    </Details>
  );
}

function ReasonDeclined(props: {
  place: DeclinedDraft;
}) {
  return (
    <Details>
      <summary>Причина за отказ</summary>
      <p class="my-1">
        <em>{props.place.reasonDeclined}</em>
      </p>
    </Details>
  );
}

function isDeclinedDraft(place: Place | DeclinedDraft): place is DeclinedDraft {
  return typeof (place as DeclinedDraft).reasonDeclined === "string";
}

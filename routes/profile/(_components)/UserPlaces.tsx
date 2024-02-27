import { partition } from "$std/collections/partition.ts";
import { Place, User } from "../../../utils/types.ts";

interface PostsProps {
  user: User;
  places: Place[];
  drafts?: Place[];
  declined?: Place[];
}

export default function UserPlaces(props: PostsProps) {
  const { user, places, drafts, declined } = props;
  const [created, edited] = partition(
    places,
    (it) => it.firstRevUser === user.id,
  );
  const hasOwnPostsOnly = created.length > 0 && !drafts?.length &&
    !edited.length && !declined?.length;

  return (
    <section>
      <h2>Постове</h2>
      {!created.length && !edited.length && !drafts?.length &&
        !declined?.length && (
        <p>
          няма
        </p>
      )}

      {hasOwnPostsOnly && <PlacesList places={created} />}

      {!hasOwnPostsOnly && (
        <>
          {drafts && drafts.length > 0 && (
            <section>
              <h3>Чакащи одобрeние</h3>
              <PlacesList places={drafts} isDraft />
            </section>
          )}
          {created.length > 0 && (
            <section>
              <h3>Добавени</h3>
              <PlacesList places={created} />
            </section>
          )}
          {edited.length > 0 && (
            <section>
              <h3>Редактирани</h3>
              <PlacesList places={edited} />
            </section>
          )}
          {declined && declined.length > 0 && (
            <section>
              <h3>Отказани от администратор</h3>
              <PlacesList places={declined} isDeclined />
            </section>
          )}
        </>
      )}
    </section>
  );
}

interface PlacesListProps {
  places: Place[];
  isDraft?: boolean;
  isDeclined?: boolean;
}

function PlacesList({ places, isDraft, isDeclined }: PlacesListProps) {
  return (
    <ul>
      {places.map(({ id, title, slug }) => {
        let href = "/" + slug;
        if (isDraft) href = `/places/${id}/draft`;
        if (isDeclined) href = `/places/${id}/declined`;
        return (
          <li>
            <a href={href}>{title}</a>
          </li>
        );
      })}
    </ul>
  );
}

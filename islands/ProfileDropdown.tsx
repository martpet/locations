import { useEffect, useState } from "preact/hooks";
import { JSX } from "preact/jsx-runtime";
import Avatar from "../components/Avatar.tsx";
import Badge from "../components/Badge.tsx";
import { User } from "../utils/types.ts";
import ModalOverlay from "./ModalOverlay.tsx";

async function fetchUnseenAlertsCount(): Promise<number> {
  const resp = await fetch("/profile/alerts/unseen-count");
  return resp.json();
}

interface ProfileDropdownProps extends JSX.HTMLAttributes<HTMLDivElement> {
  user: User;
}

export default function ProfileDropdown(
  { user, ...divProps }: ProfileDropdownProps,
) {
  const [isDropDownOpen, setIsDropDownOpen] = useState(false);
  const [alertCount, setAlertCount] = useState(0);

  useEffect(() => {
    fetchUnseenAlertsCount().then(setAlertCount);
  }, []);

  return (
    <div
      {...divProps}
      class={`${divProps.class || ""} not-prose relative flex`}
    >
      <button onClick={() => setIsDropDownOpen(true)}>
        <Avatar picture={user.gUser.picture} />
      </button>
      {alertCount > 0 && (
        <Badge class="absolute -right-2 -top-1 text-xs scale-75">
          {alertCount}
        </Badge>
      )}
      {isDropDownOpen && (
        <ModalOverlay setOpen={setIsDropDownOpen}>
          <ul
            class={`
            absolute z-10 right-0 top-9 overflow-hidden
            bg-white dark:bg-stone-950
            rounded-lg shadow-lg
            divide-y dark:divide-stone-800
            border border-stone-300 dark:border-stone-600
            [&_a]:block
            [&_a]:py-2
            [&_a]:px-4
            [&_a:hover]:bg-stone-100
            dark:[&_a:hover]:bg-stone-900
          `}
          >
            <li>
              <a href="/profile">Профил</a>
            </li>
            <li>
              <a href="/profile/alerts" class="!flex items-center gap-1.5">
                Съобщения
                {alertCount > 0 && <Badge class="scale-75">{alertCount}</Badge>}
              </a>
            </li>
            {user.isAdmin && (
              <li>
                <a href="/admin">Админ</a>
              </li>
            )}
            <li>
              <a href="/oauth/signout">Изход</a>
            </li>
          </ul>
        </ModalOverlay>
      )}
    </div>
  );
}

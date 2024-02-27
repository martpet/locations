import { JSX } from "preact/jsx-runtime";
import { User } from "../utils/types.ts";

interface AvatarProps extends JSX.HTMLAttributes<HTMLImageElement> {
  picture: string;
}

export default function Avatar({ picture, ...imgProps }: AvatarProps) {
  return (
    <img
      src={picture}
      referrerpolicy="no-referrer"
      class={`${imgProps.class || ""} not-prose w-7 rounded-full`}
      alt="Профилна снимка"
    />
  );
}

export function DefaultAvatar(props: JSX.HTMLAttributes<SVGSVGElement>) {
  return (
    <svg
      viewBox="2.5 2.5 95 95"
      width="20"
      {...props}
      class={`
        ${props.class || ""} 
        w-6 aspect-square fill-neutral-400
      `}
    >
      <path d="M50,2.5C23.8,2.5,2.5,23.8,2.5,50c0,26.2,21.3,47.5,47.5,47.5S97.5,76.2,97.5,50C97.5,23.8,76.2,2.5,50,2.5z M50,29.7    c8.2,0,14.9,6.7,14.9,14.9c0,8.2-6.7,14.9-14.9,14.9c-8.2,0-14.9-6.7-14.9-14.9C35.1,36.4,41.8,29.7,50,29.7z M24,78.8v-2.2    c0-6.3,5.1-11.5,11.5-11.5h29c6.3,0,11.5,5.1,11.5,11.5v2.2c-6.9,6.2-16,10-26,10C40,88.8,30.9,85,24,78.8z" />
    </svg>
  );
}

interface UserPublicPicProps
  extends Pick<JSX.HTMLAttributes<HTMLElement>, "class"> {
  user: User;
}

export function UserPublicPic({ user, ...props }: UserPublicPicProps) {
  return user.isGooglePicPub
    ? <Avatar picture={user.gUser.picture} {...props} />
    : <DefaultAvatar {...props} />;
}

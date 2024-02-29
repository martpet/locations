import { Handlers, PageProps, STATUS_CODE } from "$fresh/server.ts";
import { ulid } from "ulid";
import Avatar, { DefaultAvatar } from "../../components/Avatar.tsx";
import Button from "../../components/Button.tsx";
import Input from "../../components/Input.tsx";
import Label from "../../components/Label.tsx";
import { setLog, setUser } from "../../utils/db.ts";
import { setFlash } from "../../utils/flash.ts";
import slugify from "../../utils/slugify.ts";
import { State } from "../../utils/types.ts";

interface Data {
  form: {
    pubName: string;
    pubEmail: string;
    pubWebsite: string;
    pubPhoto: string;
  };
  errors?: {
    pubName?: string;
    pubPhoto?: string;
  };
}

export const handler: Handlers<Data, State> = {
  async POST(req, ctx) {
    const user = ctx.state.user;
    if (!user) {
      throw new Error("missing user");
    }
    const formData = await req.formData();
    const pubName = formData.get("pubName") as string || "";
    const pubEmail = formData.get("pubEmail") as string || "";
    const pubPhoto = formData.get("pubPhoto") as string || "";
    const pubWebsite = formData.get("pubWebsite") as string || "";
    const errors: Data["errors"] = {};
    if (!pubName) {
      errors.pubName = "Липсва името";
    }
    if (!pubPhoto) {
      errors.pubPhoto = "Избери профилна снимка";
    }
    if (Object.keys(errors).length) {
      return ctx.render({
        form: {
          pubName,
          pubEmail,
          pubPhoto,
          pubWebsite,
        },
        errors,
      });
    }
    const newUser = {
      ...user,
      slug: await slugify(pubName),
      pubName,
      pubEmail,
      pubWebsite,
      isGooglePicPub: pubPhoto === "google",
    };
    if (JSON.stringify(newUser) !== JSON.stringify(user)) {
      await Promise.all([
        setUser(newUser),
        setLog({
          id: ulid(),
          type: "user_personal_details_updated",
          user: user.id,
          data: { olduser: user, newUser },
        }),
      ]);
    }
    const resp = new Response(null, {
      status: STATUS_CODE.SeeOther,
      headers: { location: "/profile" },
    });
    setFlash(resp, "Успешно запазване на данните");
    return resp;
  },
};

export default function EditPage(props: PageProps<Data, State>) {
  const user = props.state.user;
  if (!user) {
    throw new Error("missing user");
  }
  const { form, errors } = props.data || {};
  return (
    <>
      <h1>Редактирай публичните ти данни</h1>
      <form method="post" class="max-w-md">
        <Label>
          Име
          <Input
            name="pubName"
            type="text"
            value={form?.pubName ?? user.pubName}
            required
            size={30}
          />
          <ErrorMsg msg={errors?.pubName} />
        </Label>
        <Label>
          <span>
            Имейл <small>(не е задължителен)</small>
          </span>
          <Input
            name="pubEmail"
            type="email"
            value={form?.pubEmail ?? user.pubEmail}
            size={30}
          />
        </Label>
        <Label>
          <span>
            Уебсайт <small>(не е задължителен)</small>
          </span>
          <Input
            name="pubWebsite"
            type="url"
            value={form?.pubWebsite ?? user.pubWebsite}
            size={30}
          />
        </Label>
        <fieldset class="mb-6">
          <legend>Профилна снимка</legend>
          <div class="flex flex-col mt-1 gap-1 [&_label]:flex [&_label]:items-center [&_label]:gap-2">
            <label>
              <input
                type="radio"
                name="pubPhoto"
                value="default"
                checked={form?.pubPhoto === "default" || !user.isGooglePicPub}
                required
              />
              <DefaultAvatar />
              Анонимна
            </label>
            <label>
              <input
                type="radio"
                name="pubPhoto"
                value="google"
                checked={form?.pubPhoto === "google" || user.isGooglePicPub}
                required
              />
              <Avatar picture={user.gUser.picture} class="!w-6" />
              От Гугъл профила
            </label>
          </div>
          <ErrorMsg msg={errors?.pubPhoto} />
        </fieldset>
        <Button>Запази</Button>
      </form>
    </>
  );
}

function ErrorMsg({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <strong class="text-red-600">{msg}</strong>;
}

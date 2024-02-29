import { Head } from "$fresh/runtime.ts";
import { Handlers, PageProps, STATUS_CODE } from "$fresh/server.ts";
import Button from "../../components/Button.tsx";
import Input from "../../components/Input.tsx";
import Label from "../../components/Label.tsx";
import { dbReset } from "../../utils/db.ts";
import { isProd, siteTitle } from "../../utils/env.ts";
import { setFlash } from "../../utils/flash.ts";
import { State } from "../../utils/types.ts";

export const handler: Handlers<undefined, State> = {
  async POST() {
    if (isProd()) {
      return new Response(null, {
        status: STATUS_CODE.BadRequest,
      });
    }
    await dbReset();
    const resp = new Response(null, {
      headers: { location: "/" },
      status: STATUS_CODE.SeeOther,
    });
    setFlash(resp, "Базата данни беше изтрита");
    return resp;
  },
};

export default function ResetDbPage(props: PageProps<undefined, State>) {
  return (
    <>
      <Head>
        <title>Админ | Изтриване база данни | {siteTitle()}</title>
      </Head>
      <h1>Изтрий база данни</h1>
      {isProd() && (
        <p>
          <em>Prod</em> базата не може да бъде изтрита.
        </p>
      )}
      {!isProd() && (
        <form method="POST" class="max-w-xs">
          <Label>
            <span>
              Напиши <em>delete</em>:
            </span>
            <Input
              type="text"
              id="confirm"
              placeholder="delete"
              pattern="delete"
              required
            />
          </Label>
          <Button>Изтрий</Button>
        </form>
      )}
    </>
  );
}

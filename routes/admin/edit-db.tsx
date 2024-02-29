import { Head } from "$fresh/runtime.ts";
import { Handlers, PageProps, STATUS_CODE } from "$fresh/server.ts";
import Button from "../../components/Button.tsx";
import Input, { TextArea } from "../../components/Input.tsx";
import Label from "../../components/Label.tsx";
import { kv } from "../../utils/db.ts";
import { siteTitle } from "../../utils/env.ts";
import { setFlash } from "../../utils/flash.ts";
import { State } from "../../utils/types.ts";

const KV_KEY_PARAM = "kv_key";
const KV_VALUE_PARAM = "kv_value";
const KV_ACTION_PARAM = "kv_action";

interface Data {
  kvKeyString: string;
  kvValueString: string;
  versionstamp?: string;
}

export const handler: Handlers<Data, State> = {
  async GET(_req, ctx) {
    let kvKeyString = "";
    let kvValueString = "";
    let versionstamp;
    try {
      kvKeyString = ctx.url.searchParams.get(KV_KEY_PARAM) || "";
      if (kvKeyString) {
        const kvKey = JSON.parse(kvKeyString);
        const kvRes = await kv.get(kvKey);
        if (kvRes.value !== null) {
          kvValueString = JSON.stringify(kvRes.value, null, 2);
          versionstamp = kvRes.versionstamp;
        }
      }
    } catch (err) {
      ctx.state.flash = { msg: err.message, type: "error" };
    }
    return ctx.render({
      kvKeyString,
      kvValueString,
      versionstamp,
    });
  },
  async POST(req, ctx) {
    const resp = new Response(null, {
      status: STATUS_CODE.SeeOther,
      headers: { location: ctx.url.href },
    });
    try {
      const formData = await req.formData();
      const kvKeyString = formData.get(KV_KEY_PARAM)?.toString() || "";
      const action = formData.get(KV_ACTION_PARAM)?.toString();
      if (!kvKeyString) throw new Error("req data missing kvKey");
      const kvKey = JSON.parse(kvKeyString);
      if (action === "delete") {
        await kv.delete(kvKey);
        setFlash(resp, "Успешно изтриване");
      } else {
        const kvValueString = formData.get(KV_VALUE_PARAM)?.toString() || "";
        let kvValue;
        try {
          kvValue = JSON.parse(kvValueString);
        } catch (err) {
          kvValue = kvValueString;
        }
        await kv.set(kvKey, kvValue);
        setFlash(resp, "Успешно запазване");
      }
    } catch (err) {
      setFlash(resp, err.message, { type: "error" });
    }
    return resp;
  },
};

export default function KvEditPage(props: PageProps<Data>) {
  const { kvKeyString, kvValueString, versionstamp } = props.data;
  return (
    <>
      <Head>
        <title>Админ | Редактиране база данни | {siteTitle()}</title>
      </Head>
      <h1>Редактирай база данни</h1>

      <form class="mt-10">
        <Label>
          KV key:
          <Input
            name={KV_KEY_PARAM}
            value={kvKeyString}
            placeholder='Ex: ["users","01HP280V53ZNZZWPTMPFJ5FPRA"]'
            required
            readonly={Boolean(kvValueString)}
          />
        </Label>
        {kvValueString
          ? (
            <p class="text-sm block -mt-3">
              <a href="/admin/edit-db">
                Промени
              </a>
            </p>
          )
          : <Button size="sm">Зареди</Button>}
        {versionstamp && <p>Versionstamp: {versionstamp}</p>}
        {kvKeyString && (
          <>
            <Label class="mt-8">
              KV value:
              <TextArea
                name={KV_VALUE_PARAM}
                value={kvValueString}
                rows={10}
              >
              </TextArea>
            </Label>
            <div class="flex items-center gap-8 ">
              <Button formmethod="post">Изпрати</Button>
              <Button
                formmethod="post"
                name={KV_ACTION_PARAM}
                value="delete"
                size="sm"
                // @ts-ignore: "onclick" does not exist
                onclick="return confirm(`Сигурен ли, че искаш да изтриеш?`)"
              >
                Delete
              </Button>
            </div>
          </>
        )}
      </form>
    </>
  );
}

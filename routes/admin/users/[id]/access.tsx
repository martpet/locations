import { Head } from "$fresh/runtime.ts";
import { Handlers } from "$fresh/server.ts";
import { defineRoute } from "$fresh/src/server/defines.ts";
import { ulid } from "ulid";
import Button from "../../../../components/Button.tsx";
import { TextArea } from "../../../../components/Input.tsx";
import Label from "../../../../components/Label.tsx";
import { getUser, kv, setLog, setUser } from "../../../../utils/db.ts";
import { getEnv, siteEmail, siteTitle } from "../../../../utils/env.ts";
import { setFlash } from "../../../../utils/flash.ts";
import { State } from "../../../../utils/types.ts";
import { banUserDisallowed } from "../../../../utils/users.ts";

type AccessAction = "ban" | "unban";

interface AccessReqData {
  action: AccessAction;
  banMsg?: string;
}

export const handler: Handlers<undefined, State> = {
  async POST(req, ctx) {
    const reqData = Object.fromEntries(await req.formData());
    if (!isAccessReqData(reqData)) {
      return new Response("bad data", { status: 400 });
    }
    const { action } = reqData;

    const targetUser = await getUser(ctx.params.id);
    if (!targetUser) {
      throw new Error("missing target user");
    }

    const cannotBanReason = banUserDisallowed({
      targetUser,
      currentUser: ctx.state.user!,
    });

    if (cannotBanReason) {
      return new Response(cannotBanReason, {
        status: 403,
        headers: {
          location: ctx.url.href,
        },
      });
    }
    const resp = new Response(null, {
      status: 303,
      headers: {
        location: `/admin/users/${targetUser.id}`,
      },
    });

    const { ok } = await setUser({
      ...targetUser,
      isBanned: action === "ban",
      banUserMsg: reqData.banMsg || "",
      banToggleDate: new Date(),
    });

    if (!ok) {
      setFlash(resp, "Грешка при записването", { type: "error" });
      return resp;
    }

    await setLog({
      id: ulid(),
      user: ctx.state.user!.id,
      type: action === "ban" ? "user_banned" : "user_unbanned",
      data: { targetUser },
    });

    if (ctx.state.user!.gUser.id !== getEnv("OWNER_GOOGLE_ID")) {
      await kv.enqueue({
        type: "send-email",
        payload: {
          to: siteEmail(),
          subject: `${action === "ban" ? "Блокиран" : "Отблокиран"} потребител`,
          body: `${ctx.url.origin}/admin/users/${targetUser.id}`,
        },
      });
    }

    setFlash(
      resp,
      `Потребителят е ${action === "ban" ? "блокиран" : "отблокиран"}`,
      { type: "success" },
    );
    return resp;
  },
};

export default defineRoute<State>(async (_req, ctx) => {
  const user = await getUser(ctx.params.id);
  if (!user) {
    return ctx.renderNotFound();
  }

  const action: AccessAction = user.isBanned ? "unban" : "ban";
  const cannotBanReason = banUserDisallowed({
    targetUser: user,
    currentUser: ctx.state.user!,
  });

  return (
    <>
      <Head>
        <title>
          Админ | Достъп на потребител: {user.id} | {siteTitle()}
        </title>
      </Head>
      <h1>Достъп на потребител: {user.id}</h1>
      {cannotBanReason
        ? (
          <p>
            Достъпът не може да бъде променен: {cannotBanReason}
          </p>
        )
        : (
          <form method="post" class="max-w-xl">
            <input
              type="hidden"
              name="action"
              value={action}
            />
            <Label>
              Съобщение до потребителя (не е задължително):
              {!user.isBanned && <TextArea name="banMsg" />}
            </Label>
            <Button size="sm">
              {user.isBanned ? "Отблокирай" : "Блокирай"}
            </Button>
          </form>
        )}
      <footer class="mt-10">
        <a href="../">Обратно</a>
      </footer>
    </>
  );
});

function isAccessReqData(o: unknown): o is AccessReqData {
  const obj = o as Partial<AccessReqData>;
  return typeof o === "object" &&
    (obj.action === "ban" || obj.action === "unban") &&
    (obj.banMsg === undefined || typeof obj.banMsg === "string");
}

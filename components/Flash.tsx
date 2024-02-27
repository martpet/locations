import { RouteContext } from "$fresh/server.ts";
import { Flash as IFlash, State } from "../utils/types.ts";
import CloseButton from "./CloseButton.tsx";

const bg: { [k in NonNullable<IFlash["type"]>]: string } = {
  info: "bg-blue-700",
  success: "bg-green-700",
  error: "bg-red-700",
  warning: "bg-yellow-600",
};

interface FlashProps {
  ctx: RouteContext<void, State>;
}

export default function Flash({ ctx }: FlashProps) {
  const { flash } = ctx.state;
  if (!flash) return null;
  const type = flash.type || "success";

  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html: `addEventListener("beforeunload", () => flashForm.submit())`,
        }}
      />
      <dialog id="flash" open class="relative z-10 top-2 bg-transparent">
        <div
          class={`flex min-w-min gap-2 px-3 py-1 text-neutral-100 rounded ${
            bg[type]
          }`}
        >
          {flash.msg}
          <form method="dialog" id="flashForm" class="contents">
            <CloseButton
              type="submit"
              invertColor={false}
              circle={false}
              class="relative top-[4px]"
            />
          </form>
        </div>
      </dialog>
    </>
  );
}

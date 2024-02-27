import { Head, Partial } from "$fresh/runtime.ts";
import { defineRoute, FreshContext } from "$fresh/server.ts";
import { decodeTime } from "ulid";
import PlaceDiff from "../../../(_components)/PlaceDiff.tsx";
import SideNav from "../../../../../components/SideNav.tsx";
import { dateTimeFormat } from "../../../../../utils/datetime.ts";
import {
  getManyRevs,
  getPlace,
  getUser,
  listRevIds,
} from "../../../../../utils/db.ts";
import { photosOrigin, siteTitle } from "../../../../../utils/env.ts";
import { State, User } from "../../../../../utils/types.ts";

export async function getDiffData(
  placeId: string,
  currentRevId: string,
  currentUser: User | null,
) {
  const revsIds = await listRevIds(placeId, {
    consistency: currentUser ? "strong" : "eventual",
  });
  const prevRevIndex = revsIds.findIndex((id) => id === currentRevId) + 1;
  const prevRevId = revsIds[prevRevIndex];
  const keysData = [{ placeId, revId: currentRevId }];
  if (prevRevId) keysData.push({ placeId, revId: prevRevId });
  const [currentRev, prevRev] = await getManyRevs(
    keysData,
    currentUser ? "strong" : "eventual",
  );
  if (!currentRev) return "rev-not-found";
  let revUser = currentUser;
  if (!revUser || revUser.id !== currentRev.revUser) {
    revUser = await getUser(currentRev.revUser);
  }
  if (!revUser) throw new Error("missing rev user");
  return {
    revsIds,
    currentRev,
    prevRev,
    revUser,
  };
}

export const handler = async (_req: Request, ctx: FreshContext<State>) => {
  const resp = await ctx.render();
  resp.headers.set("cache-control", `public, max-age=${60 * 60 * 24}`);
  return resp;
};

export default defineRoute<State>(async (_req, ctx) => {
  const placeId = ctx.params.id;
  const currentRevId = ctx.params.rev_id;
  const [diffData, { value: currentPlace }] = await Promise.all([
    getDiffData(placeId, currentRevId, ctx.state.user),
    getPlace(placeId),
  ]);
  if (diffData === "rev-not-found" || !currentPlace) {
    return ctx.renderNotFound();
  }
  const { revsIds, currentRev, prevRev, revUser } = diffData;
  return (
    <>
      <Head>
        <title>
          История на ревизиите: {currentPlace.title} | {siteTitle()}
        </title>
      </Head>
      <article>
        <hgroup class="mb-10">
          <h1 class="mb-0">
            История на ревизиите
          </h1>
          <p class="mt-4 text-xl">
            <a href={"/" + currentPlace.slug}>
              {currentPlace.title}
            </a>
          </p>
        </hgroup>
        <div class="sm:flex items-start gap-16">
          <aside f-client-nav>
            <RevsNav revsIds={revsIds} placeId={placeId} />
          </aside>
          <Partial name="rev-diff">
            <PlaceDiff
              current={currentRev}
              prev={prevRev}
              author={revUser}
              pathname={ctx.url.pathname}
              photosOrigin={photosOrigin()}
            />
          </Partial>
        </div>
      </article>
    </>
  );
});

interface RevsNavProps {
  revsIds: string[];
  placeId: string;
}

function RevsNav({ revsIds, placeId }: RevsNavProps) {
  const dateFmt = dateTimeFormat({ dateStyle: "short", timeStyle: "short" });
  return (
    <SideNav class="min-w-[180px]">
      {revsIds.map((revId) => (
        <li>
          <a
            href={`/places/${placeId}/revs/${revId}`}
            f-partial={`/places/${placeId}/revs/${revId}/rev-diff-partial`}
          >
            {dateFmt.format(decodeTime(revId))}
          </a>
        </li>
      ))}
    </SideNav>
  );
}

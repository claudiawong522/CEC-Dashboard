import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/getSession";
import { createClient } from "@/lib/supabase/server";
import type { ChatPerson } from "@/lib/types/coffee-chats";
import { currentTermKey, termFromKey } from "@/lib/utils/terms";
import { ShoutoutForm } from "@/components/shoutouts/ShoutoutForm";
import { ShoutoutWall, type ShoutoutRow } from "@/components/shoutouts/ShoutoutWall";
import { Sticker } from "@/components/stickers/Sticker";
import { Heart, Seal } from "@/components/stickers/shapes";

const SHOUTOUT_COLUMNS =
  "id, message, is_anonymous, hidden, created_at, receiver_name, " +
  "giver:profiles!shoutouts_giver_id_fkey(id, full_name, email), " +
  "receiver:profiles!shoutouts_receiver_id_fkey(id, full_name, email)";

export default async function ShoutoutsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const supabase = await createClient();
  const semester = currentTermKey();
  const term = termFromKey(semester);
  const isAdmin = session.profile.role === "admin";

  const [{ data: shoutouts }, { data: members }] = await Promise.all([
    supabase
      .from("shoutouts")
      .select(SHOUTOUT_COLUMNS)
      .eq("semester", semester)
      .order("created_at", { ascending: false })
      .returns<ShoutoutRow[]>(),
    supabase
      .from("profiles")
      .select("id, full_name, email")
      .eq("active", true)
      .neq("status", "revoked")
      .neq("id", session.profile.id)
      .order("full_name", { ascending: true, nullsFirst: false })
      .returns<ChatPerson[]>(),
  ]);

  // Hidden shoutouts are filtered here rather than by policy, so an admin can
  // still see them in order to put one back.
  const visible = (shoutouts ?? [])
    .filter((shoutout) => isAdmin || !shoutout.hidden)
    // Anonymity has to happen here, not at render. ShoutoutWall is a client
    // component, so anything handed to it is serialized into the page for the
    // browser to read, and it was being handed the giver's name and email on
    // every anonymous shoutout. It drew "someone" for non-admins while the
    // real name sat in the payload underneath. An admin still gets the name,
    // because moderating the wall is the whole reason for hiding one.
    .map((shoutout) =>
      shoutout.is_anonymous && !isAdmin ? { ...shoutout, giver: null } : shoutout,
    );

  return (
    <div className="relative flex flex-col gap-[17px]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-3 z-0 h-28 overflow-hidden"
      >
        <Sticker
          floatVariant="float3"
          floatDuration="15s"
          wrapperClassName="pointer-events-none absolute right-[12%] top-1"
          className="pointer-events-auto opacity-[0.4]"
        >
          <Heart size={62} />
        </Sticker>
      </div>

      <div className="relative z-10 flex items-end justify-between gap-4">
        <div className="flex flex-col gap-[5px]">
          <h1 className="font-sans text-[24px] leading-[1.2] font-medium tracking-[-0.022em] text-ink">
            Shoutouts
          </h1>
          <span className="font-sans text-[12.5px] text-body">
            Say thanks to someone who made something work.
          </span>
        </div>
        <Sticker floatVariant="none" wrapperClassName="shrink-0">
          <Seal label={term.key} size={40} color={term.color} />
        </Sticker>
      </div>

      <div className="relative z-10 flex flex-col gap-[17px]">
        <ShoutoutForm members={members ?? []} />
        <ShoutoutWall shoutouts={visible} isAdmin={isAdmin} />
      </div>
    </div>
  );
}

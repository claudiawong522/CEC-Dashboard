import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth/getSession";
import { createClient } from "@/lib/supabase/server";
import { RequestInbox, type IncomingRequest } from "@/components/matching/RequestInbox";
import { Sticker } from "@/components/stickers/Sticker";
import { Cherries } from "@/components/stickers/shapes";

export default async function ChatRequestsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const supabase = await createClient();
  // No filter by member here: the RLS policy already returns the caller's own
  // requests, plus everything for an admin. Repeating it in the query is how
  // the two drift apart.
  const { data: requests } = await supabase
    .from("chat_requests")
    .select(
      "id, student_email, student_name, prompt, tags, status, created_at, profile_id, " +
        "member:profiles!chat_requests_profile_id_fkey(full_name, email)",
    )
    .order("created_at", { ascending: false })
    .returns<IncomingRequest[]>();

  const rows = requests ?? [];
  const pending = rows.filter((request) => request.status === "pending");

  return (
    <div className="relative flex flex-col gap-[17px]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-3 z-0 h-28 overflow-hidden"
      >
        <Sticker
          floatVariant="float2"
          floatDuration="16s"
          wrapperClassName="pointer-events-none absolute right-[11%] top-1"
          className="pointer-events-auto opacity-[0.38]"
        >
          <Cherries size={54} />
        </Sticker>
      </div>

      <div className="relative z-10 flex items-end justify-between gap-4">
        <div className="flex flex-col gap-[5px]">
          <h1 className="font-sans text-[24px] leading-[1.2] font-medium tracking-[-0.022em] text-ink">
            Chat requests
          </h1>
          <span className="font-sans text-[12.5px] text-body">
            Prospective members asking to talk{pending.length > 0 && ` · ${pending.length} waiting`}.
          </span>
        </div>
        <Link
          href="/profile"
          className="shrink-0 rounded-btn border border-[rgba(35,32,28,0.14)] px-[15px] py-[9px] font-sans text-[12.5px] text-body transition-[background-color,border-color,color] duration-200 ease-brand hover:border-[rgba(35,32,28,0.24)] hover:bg-wash hover:text-ink"
        >
          Chat settings
        </Link>
      </div>

      <div className="relative z-10">
        <RequestInbox requests={rows} isAdmin={session.profile.role === "admin"} />
      </div>
    </div>
  );
}

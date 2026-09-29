import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/getSession";
import { createClient } from "@/lib/supabase/server";
import { rankRequests } from "@/lib/utils/chat-matching";
import { RequestPool } from "@/components/matching/RequestPool";
import type { ClaimedRequest, OpenRequest } from "@/lib/types/chat-requests";

export const dynamic = "force-dynamic";

type RequestRow = {
  id: string;
  student_name: string;
  student_email: string;
  prompt: string;
  interests: string[] | null;
  status: string;
  created_at: string;
  claimed_at: string | null;
  claimed_by: string | null;
  guest_id: string | null;
  claimer: { full_name: string | null } | null;
};

export default async function ChatRequestsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const supabase = await createClient();

  const [{ data: rows }, { data: me }] = await Promise.all([
    supabase
      .from("chat_requests")
      .select(
        "id, student_name, student_email, prompt, interests, status, created_at, claimed_at, claimed_by, guest_id, " +
          "claimer:profiles!chat_requests_claimed_by_fkey(full_name)",
      )
      .in("status", ["pending", "claimed"])
      .order("created_at", { ascending: true })
      .returns<RequestRow[]>(),
    supabase
      .from("profiles")
      .select("interests")
      .eq("id", session.profile.id)
      .maybeSingle<{ interests: string[] | null }>(),
  ]);

  const all = rows ?? [];

  // How many times this person has been to something. A request from someone on
  // their fourth Startup Hours is a different proposition to a cold one, and the
  // guests table already knows because both flows write to it.
  const guestIds = all.map((r) => r.guest_id).filter((id): id is string => !!id);
  const { data: visits } = guestIds.length
    ? await supabase
        .from("guest_signins")
        .select("guest_id")
        .in("guest_id", guestIds)
        .returns<{ guest_id: string }[]>()
    : { data: [] as { guest_id: string }[] };

  const visitCount = new Map<string, number>();
  for (const row of visits ?? []) {
    visitCount.set(row.guest_id, (visitCount.get(row.guest_id) ?? 0) + 1);
  }

  const toOpen = (r: RequestRow): OpenRequest => ({
    id: r.id,
    full_name: r.student_name,
    netid: r.student_email.split("@")[0],
    grad_year: null,
    major: null,
    interests: r.interests ?? [],
    prompt: r.prompt,
    created_at: r.created_at,
    visit_count: r.guest_id ? (visitCount.get(r.guest_id) ?? 0) : 0,
  });

  const ranked = rankRequests(
    all.filter((r) => r.status === "pending").map(toOpen),
    me?.interests,
  );

  const claimed: ClaimedRequest[] = all
    .filter((r) => r.status === "claimed")
    .map((r) => ({
      ...toOpen(r),
      claimed_at: r.claimed_at ?? r.created_at,
      claimed_by_name: r.claimer?.full_name ?? null,
      is_mine: r.claimed_by === session.profile.id,
    }));

  return (
    <RequestPool
      ranked={ranked}
      claimed={claimed}
      myInterests={me?.interests ?? []}
      canClaim={session.profile.role !== "view"}
      isAdmin={session.profile.role === "admin"}
    />
  );
}

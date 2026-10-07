import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/getSession";
import { createClient } from "@/lib/supabase/server";
import { wallClockDate } from "@/lib/utils/signin-window";
import { TriangleScatter } from "@/components/decor/shapes";
import { PageHeader } from "@/components/ui/page-header";
import type { LeaderboardRow } from "@/lib/types/signin";

// Counts change as people scan, and a stale leaderboard on a screen at the
// front of the room is worse than none.
export const dynamic = "force-dynamic";

// Roughly a semester back. Turning up in February should not be competing with
// a record set last spring.
const SEMESTER_DAYS = 150;

function shiftDate(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

function prettyDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export default async function LeaderboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const supabase = await createClient();
  const since = shiftDate(wallClockDate(), -SEMESTER_DAYS);

  const { data: signins } = await supabase
    .from("guest_signins")
    .select(
      "guest_id, signin_date, guest:guests!guest_signins_guest_id_fkey(full_name, profile_id)",
    )
    .gte("signin_date", since)
    .returns<
      {
        guest_id: string;
        signin_date: string;
        guest: { full_name: string; profile_id: string | null } | null;
      }[]
    >();

  const tally = new Map<string, LeaderboardRow>();
  for (const row of signins ?? []) {
    const existing = tally.get(row.guest_id);
    if (existing) {
      existing.visits += 1;
      if (row.signin_date > existing.lastSeen) existing.lastSeen = row.signin_date;
      continue;
    }
    tally.set(row.guest_id, {
      guestId: row.guest_id,
      fullName: row.guest?.full_name ?? "Unknown",
      visits: 1,
      lastSeen: row.signin_date,
      isMember: !!row.guest?.profile_id,
    });
  }

  // Most nights first, then whoever was here most recently. No emails: this is
  // a ranking, and the roster on /signins is where contact details belong.
  const rows = [...tally.values()].sort(
    (a, b) => b.visits - a.visits || b.lastSeen.localeCompare(a.lastSeen),
  );

  // Ties share a place, so two people on nine nights are both second, and the
  // next person down is fourth.
  const ranked: (LeaderboardRow & { place: number })[] = [];
  for (let i = 0; i < rows.length; i++) {
    const previous = ranked[i - 1];
    const place = previous && previous.visits === rows[i].visits ? previous.place : i + 1;
    ranked.push({ ...rows[i], place });
  }

  return (
    <div className="relative flex flex-col gap-6">
      <TriangleScatter count={5} seed={71} opacity={0.2} />

      <PageHeader className="relative z-10" title="Leaderboard">
        Startup Hours nights this semester, most first. One night counts
        once however many times somebody scans. The gift card at the end of
        the semester goes to the top of this list.
      </PageHeader>

      <div className="relative z-10 overflow-hidden border border-line bg-background shadow-soft">
        {ranked.length === 0 && (
          <p className="px-4 py-4 font-sans text-[13px] text-foreground/50">
            Nobody has signed in yet this semester.
          </p>
        )}

        {ranked.map((row, i) => (
          <div
            key={row.guestId}
            className={`flex items-center justify-between gap-4 px-4 py-3 transition-colors duration-200 hover:bg-muted/40 ${
              i < ranked.length - 1 ? "border-b border-line" : ""
            }`}
          >
            <div className="flex min-w-0 items-baseline gap-3">
              <span className="w-[26px] shrink-0 font-display text-[12px] font-bold text-foreground/50">
                {row.place}
              </span>
              <div className="flex min-w-0 flex-col gap-[2px]">
                <span className="flex items-center gap-2 font-sans text-[13.5px] text-foreground">
                  <span className="truncate">{row.fullName}</span>
                  {row.isMember && (
                    <span className="t-eyebrow shrink-0 border border-line px-2 py-0.5 text-foreground/50">
                      member
                    </span>
                  )}
                </span>
                <span className="t-eyebrow text-foreground/50">
                  last here {prettyDate(row.lastSeen)}
                </span>
              </div>
            </div>
            <span className="shrink-0 font-display text-[16px] font-bold text-foreground">
              {row.visits}
              <span className="font-sans text-[12px] font-normal text-foreground/50">
                {" "}
                night{row.visits === 1 ? "" : "s"}
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

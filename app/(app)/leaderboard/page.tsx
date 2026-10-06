import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/getSession";
import { createClient } from "@/lib/supabase/server";
import { wallClockDate } from "@/lib/utils/signin-window";
import { Sticker } from "@/components/stickers/Sticker";
import { StarPolygon } from "@/components/stickers/shapes";
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
    <div className="flex flex-col gap-[23px]">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-[7px]">
          <h1 className="font-sans text-[27px] leading-[1.2] font-medium tracking-[-0.022em] text-ink">
            Leaderboard
          </h1>
          <p className="max-w-[62ch] font-sans text-[13.5px] leading-[1.75] text-body">
            Startup Hours nights this semester, most first. One night counts
            once however many times somebody scans. The gift card at the end of
            the semester goes to the top of this list.
          </p>
        </div>
        <Sticker floatVariant="none" wrapperClassName="hidden shrink-0 sm:block">
          <StarPolygon />
        </Sticker>
      </div>

      <div className="overflow-hidden rounded-[10px] border border-[rgba(0,0,0,0.1)] bg-paper">
        {ranked.length === 0 && (
          <p className="px-[15px] py-4 font-sans text-[13px] text-faint">
            Nobody has signed in yet this semester.
          </p>
        )}

        {ranked.map((row, i) => (
          <div
            key={row.guestId}
            className={`flex items-center justify-between gap-4 px-[15px] py-3 transition-colors duration-200 hover:bg-wash ${
              i < ranked.length - 1 ? "border-b border-[rgba(0,0,0,0.07)]" : ""
            }`}
          >
            <div className="flex min-w-0 items-baseline gap-[13px]">
              <span className="w-[26px] shrink-0 font-mono text-[11px] tracking-[0.06em] text-faint">
                {row.place}
              </span>
              <div className="flex min-w-0 flex-col gap-[2px]">
                <span className="flex items-center gap-2 font-sans text-[13.5px] text-ink">
                  <span className="truncate">{row.fullName}</span>
                  {row.isMember && (
                    <span className="shrink-0 font-mono text-[9px] tracking-[0.1em] text-faint uppercase">
                      member
                    </span>
                  )}
                </span>
                <span className="font-mono text-[10px] tracking-[0.06em] text-faint">
                  last here {prettyDate(row.lastSeen)}
                </span>
              </div>
            </div>
            <span className="shrink-0 font-sans text-[15px] font-medium tracking-[-0.014em] text-ink">
              {row.visits}
              <span className="font-sans text-[12px] font-normal text-faint">
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

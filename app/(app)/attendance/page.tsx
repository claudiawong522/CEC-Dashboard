import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/getSession";
import { createClient } from "@/lib/supabase/server";
import type { ChatPerson } from "@/lib/types/coffee-chats";
import { currentTermKey, termFromKey } from "@/lib/utils/terms";
import { EVENT_TYPE_LABELS, type AttendanceEventType } from "@/lib/validation/club-schemas";
import { AttendanceRecorder, type EventOption } from "@/components/attendance/AttendanceRecorder";
import { Sticker } from "@/components/decor/Sticker";
import { Seal, TriangleScatter } from "@/components/decor/shapes";
import { PageHeader } from "@/components/ui/page-header";

type AttendanceRow = {
  id: string;
  event_id: string | null;
  event_name: string;
  event_type: AttendanceEventType;
  attended_at: string;
  profile: { id: string; full_name: string | null; email: string } | null;
};

export default async function AttendancePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  // Taking attendance is an edit-role action, and a view-only account has no
  // reason to be on this screen at all.
  if (session.profile.role === "view") redirect("/calendar");

  const supabase = await createClient();
  const semester = currentTermKey();
  const term = termFromKey(semester);

  const [{ data: events }, { data: members }, { data: records }] = await Promise.all([
    supabase
      .from("events")
      .select("id, name, event_date")
      .order("event_date", { ascending: false })
      .limit(40)
      .returns<EventOption[]>(),
    supabase
      .from("profiles")
      .select("id, full_name, email")
      .eq("active", true)
      .neq("status", "revoked")
      .order("full_name", { ascending: true, nullsFirst: false })
      .returns<ChatPerson[]>(),
    supabase
      .from("attendance")
      .select(
        "id, event_id, event_name, event_type, attended_at, " +
          "profile:profiles!attendance_profile_id_fkey(id, full_name, email)",
      )
      .eq("semester", semester)
      .order("attended_at", { ascending: false })
      .returns<AttendanceRow[]>(),
  ]);

  const rows = records ?? [];

  // Which people are already in, per event, so the recorder can grey them out
  // on a second pass for latecomers.
  const alreadyRecorded: Record<string, string[]> = {};
  for (const row of rows) {
    if (!row.event_id || !row.profile) continue;
    (alreadyRecorded[row.event_id] ??= []).push(row.profile.id);
  }

  // Headcount per thing attended, newest first. Cheap to do here and it is
  // the only number anyone asks this page for.
  const bySession = new Map<string, { name: string; type: AttendanceEventType; count: number; at: string }>();
  for (const row of rows) {
    const key = row.event_id ?? `${row.event_name}::${row.event_type}`;
    const existing = bySession.get(key);
    if (existing) existing.count += 1;
    else
      bySession.set(key, {
        name: row.event_name,
        type: row.event_type,
        count: 1,
        at: row.attended_at,
      });
  }
  const sessions = Array.from(bySession.values());

  return (
    <div className="relative flex flex-col gap-6">
      <TriangleScatter count={5} seed={51} opacity={0.2} />

      <PageHeader
        className="relative z-10"
        title="Attendance"
        actions={
          <Sticker floatVariant="none" wrapperClassName="shrink-0">
            <Seal label={term.key} size={40} color={term.color} />
          </Sticker>
        }
      >
        Who turned up, for the things worth counting.
      </PageHeader>

      <div className="relative z-10 flex flex-col gap-6">
        <AttendanceRecorder
          events={events ?? []}
          members={members ?? []}
          alreadyRecorded={alreadyRecorded}
        />

        {sessions.length > 0 && (
          <div className="overflow-hidden border border-line bg-background shadow-soft">
            <div className="t-eyebrow grid grid-cols-[1.6fr_1fr_auto] gap-3 border-b border-line bg-muted/40 px-4 py-2.5 text-foreground/50">
              <span>what</span>
              <span>kind</span>
              <span>here</span>
            </div>
            {sessions.map((entry, index) => (
              <div
                key={`${entry.name}-${entry.at}`}
                className={`grid grid-cols-[1.6fr_1fr_auto] items-center gap-3 px-4 py-3 transition-colors duration-200 hover:bg-muted/40 ${
                  index < sessions.length - 1 ? "border-b border-line" : ""
                }`}
              >
                <span className="truncate font-sans text-[12.5px] text-foreground">{entry.name}</span>
                <span className="truncate font-sans text-[12px] text-subtle">
                  {EVENT_TYPE_LABELS[entry.type]}
                </span>
                <span className="justify-self-end font-display text-[12px] font-bold text-foreground">
                  {entry.count}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

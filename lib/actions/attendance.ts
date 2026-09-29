"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/requireRole";
import { createClient } from "@/lib/supabase/server";
import { actionFailed, actionOk, type ActionResult } from "@/lib/actions/result";
import { currentTermKey } from "@/lib/utils/terms";
import { attendanceSchema, type AttendanceInput } from "@/lib/validation/club-schemas";

function databaseFailure(what: string, error: { message: string }): ActionResult {
  console.error(`[attendance] couldn't ${what}:`, error.message);
  return actionFailed(`Couldn't ${what} — try again`);
}

export async function recordAttendance(input: AttendanceInput): Promise<ActionResult> {
  const session = await requireRole("edit");

  const parsed = attendanceSchema.safeParse(input);
  if (!parsed.success) {
    return actionFailed(parsed.error.issues[0]?.message ?? "Check the form");
  }
  const { eventId, eventName, eventType, profileIds } = parsed.data;

  const supabase = await createClient();
  const semester = currentTermKey();

  // Taking attendance is a bulk action someone repeats as latecomers arrive,
  // so re-submitting a list that includes people already recorded has to be
  // harmless. For a real event the unique index makes that automatic, and
  // ignoreDuplicates turns the conflict into a skip rather than an error.
  if (eventId) {
    const { error } = await supabase.from("attendance").upsert(
      profileIds.map((profileId) => ({
        profile_id: profileId,
        event_id: eventId,
        event_type: eventType,
        event_name: eventName,
        semester,
        recorded_by: session.profile.id,
      })),
      { onConflict: "profile_id,event_id", ignoreDuplicates: true },
    );
    if (error) return databaseFailure("record attendance", error);
  } else {
    // No event row means no unique index to lean on (nulls are distinct), so
    // the duplicate check is explicit: same person, same name, same semester.
    // Deliberately not a database constraint — someone genuinely can attend
    // two separate build nights, and only the name being identical makes it
    // look like a double-tap.
    const { data: existing } = await supabase
      .from("attendance")
      .select("profile_id")
      .is("event_id", null)
      .eq("event_name", eventName)
      .eq("semester", semester)
      .in("profile_id", profileIds)
      .returns<{ profile_id: string }[]>();

    const already = new Set((existing ?? []).map((row) => row.profile_id));
    const fresh = profileIds.filter((profileId) => !already.has(profileId));
    if (fresh.length === 0) return actionOk("Everyone on that list was already recorded");

    const { error } = await supabase.from("attendance").insert(
      fresh.map((profileId) => ({
        profile_id: profileId,
        event_id: null,
        event_type: eventType,
        event_name: eventName,
        semester,
        recorded_by: session.profile.id,
      })),
    );
    if (error) return databaseFailure("record attendance", error);
  }

  revalidatePath("/attendance");
  return actionOk(`Recorded ${profileIds.length}`);
}

export async function removeAttendance(attendanceId: string): Promise<ActionResult> {
  await requireRole("edit");

  const supabase = await createClient();
  const { error } = await supabase.from("attendance").delete().eq("id", attendanceId);
  if (error) return databaseFailure("remove that record", error);

  revalidatePath("/attendance");
  return actionOk();
}

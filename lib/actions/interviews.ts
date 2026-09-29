"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/getSession";
import { getStudent } from "@/lib/auth/getStudent";
import { requireRole } from "@/lib/auth/requireRole";
import { createClient } from "@/lib/supabase/server";
import { actionFailed, actionOk, type ActionResult } from "@/lib/actions/result";
import {
  cycleSchema,
  slotSchema,
  type CycleInput,
  type SlotInput,
} from "@/lib/validation/interview-schemas";
import { ithacaInstant } from "@/lib/utils/signin-window";

function databaseFailure(what: string, error: { message: string }): ActionResult {
  console.error(`[interviews] couldn't ${what}:`, error.message);
  return actionFailed(`Couldn't ${what} — try again`);
}

export async function createCycle(input: CycleInput): Promise<ActionResult> {
  await requireRole("admin");

  const parsed = cycleSchema.safeParse(input);
  if (!parsed.success) {
    return actionFailed(parsed.error.issues[0]?.message ?? "Check the form");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("interview_cycles").insert({
    name: parsed.data.name,
    approved_netids: parsed.data.approvedNetids,
    is_active: true,
  });

  if (error) {
    // A partial unique index allows only one active cycle, so "the current
    // cycle" is never ambiguous and an applicant can't be shown two sets of
    // slots.
    if (error.code === "23505") {
      return actionFailed("A cycle is already open — close that one first");
    }
    return databaseFailure("open that cycle", error);
  }

  revalidatePath("/interviews");
  revalidatePath("/apply");
  return actionOk();
}

export async function closeCycle(cycleId: string): Promise<ActionResult> {
  await requireRole("admin");

  const supabase = await createClient();
  const { error } = await supabase
    .from("interview_cycles")
    .update({ is_active: false })
    .eq("id", cycleId);
  if (error) return databaseFailure("close that cycle", error);

  revalidatePath("/interviews");
  revalidatePath("/apply");
  return actionOk("Closed — applicants can no longer see or claim slots");
}

export async function addSlots(input: SlotInput): Promise<ActionResult> {
  const session = await requireRole("admin");

  const parsed = slotSchema.safeParse(input);
  if (!parsed.success) {
    return actionFailed(parsed.error.issues[0]?.message ?? "Check the form");
  }
  const { cycleId, date, startTime, durationMinutes, count, location, interviewerId } = parsed.data;

  // An interviewer types a date and a time meaning Ithaca, and these columns
  // are timestamptz. `new Date(`${date}T${startTime}:00`)` has no zone, so it
  // meant the server's, which is UTC on Vercel: every slot was stored four or
  // five hours early and an applicant would have seen a 2pm interview as 9am.
  const start = ithacaInstant(date, startTime);
  if (Number.isNaN(start.getTime())) return actionFailed("That date and time don't parse");

  // A block of back-to-back slots, because that is how interview days are
  // actually run: one person sits down for two hours and takes six.
  const rows = Array.from({ length: count }, (_, index) => {
    const slotStart = new Date(start.getTime() + index * durationMinutes * 60_000);
    const slotEnd = new Date(slotStart.getTime() + durationMinutes * 60_000);
    return {
      cycle_id: cycleId,
      start_time: slotStart.toISOString(),
      end_time: slotEnd.toISOString(),
      location,
      interviewer_id: interviewerId ?? session.profile.id,
      is_claimed: false,
    };
  });

  const supabase = await createClient();
  const { error } = await supabase.from("interview_slots").insert(rows);
  if (error) return databaseFailure("add those slots", error);

  revalidatePath("/interviews");
  revalidatePath("/apply");
  return actionOk(`Added ${count}`);
}

export async function deleteSlot(slotId: string): Promise<ActionResult> {
  await requireRole("admin");

  const supabase = await createClient();
  // Refuse to delete a slot someone is holding — that person turns up to a
  // room at a time nobody is expecting them.
  const { data: deleted, error } = await supabase
    .from("interview_slots")
    .delete()
    .eq("id", slotId)
    .eq("is_claimed", false)
    .select("id");

  if (error) return databaseFailure("remove that slot", error);
  if (!deleted || deleted.length === 0) {
    return actionFailed("That slot is claimed — release it first");
  }

  revalidatePath("/interviews");
  revalidatePath("/apply");
  return actionOk();
}

export async function releaseSlot(slotId: string): Promise<ActionResult> {
  await requireRole("admin");

  const supabase = await createClient();
  const { error } = await supabase
    .from("interview_slots")
    .update({ applicant_netid: null, is_claimed: false })
    .eq("id", slotId);
  if (error) return databaseFailure("release that slot", error);

  revalidatePath("/interviews");
  revalidatePath("/apply");
  return actionOk("Released — someone else can take it");
}

// The applicant side. An applicant is the student tier: a Cornell account
// with no profile, approved by netid on the open cycle.
export async function claimSlot(slotId: string): Promise<ActionResult> {
  const student = await getStudent();
  if (!student) throw new Error("Not signed in as an applicant");

  const netid = student.email.split("@")[0].toLowerCase();
  const supabase = await createClient();

  // The `using` clause on the claim policy matches only unclaimed rows, so
  // two applicants racing for the last slot means the second one updates zero
  // rows rather than overwriting the first. That race is the whole reason
  // this is an update-with-select rather than a read-then-write.
  const { data: claimed, error } = await supabase
    .from("interview_slots")
    .update({ applicant_netid: netid, is_claimed: true })
    .eq("id", slotId)
    .eq("is_claimed", false)
    .select("id, start_time");

  if (error) {
    if (error.code === "23505") {
      return actionFailed("You already have a slot in this cycle");
    }
    return databaseFailure("book that slot", error);
  }
  if (!claimed || claimed.length === 0) {
    return actionFailed("Someone just took that one — pick another");
  }

  revalidatePath("/interviews");
  revalidatePath("/apply");
  return actionOk("Booked");
}

export async function releaseOwnSlot(slotId: string): Promise<ActionResult> {
  const student = await getStudent();
  if (!student) throw new Error("Not signed in as an applicant");

  // An applicant may only give up a slot they are actually holding. RLS
  // scopes the update to their own netid too.
  const netid = student.email.split("@")[0].toLowerCase();
  const supabase = await createClient();

  const { data: released, error } = await supabase
    .from("interview_slots")
    .update({ applicant_netid: null, is_claimed: false })
    .eq("id", slotId)
    .eq("applicant_netid", netid)
    .select("id");

  if (error) return databaseFailure("give up that slot", error);
  if (!released || released.length === 0) {
    return actionFailed("That isn't your slot");
  }

  revalidatePath("/interviews");
  revalidatePath("/apply");
  return actionOk("Given up");
}

// Used by the member-facing page to show interviewers their own day.
export async function myInterviewSlots() {
  const session = await getSession();
  if (!session) throw new Error("Not signed in");

  const supabase = await createClient();
  const { data } = await supabase
    .from("interview_slots")
    .select("id, start_time, end_time, location, applicant_netid, is_claimed")
    .eq("interviewer_id", session.profile.id)
    .order("start_time");

  return data ?? [];
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/requireRole";
import { createClient } from "@/lib/supabase/server";
import {
  quickAddSchema,
  pitchSchema,
  personSchema,
  dateTimeSchema,
  notesSchema,
  type StageValue,
} from "@/lib/validation/external-schemas";
import type { IdeaRow } from "@/lib/types/external";

function revalidateIdea(ideaId: string) {
  revalidatePath("/external");
  revalidatePath(`/external/${ideaId}`);
}

// Quick-add only ever needs a name — everything else (pitch detail, contact
// info, owners) gets filled in later from the detail view. The typed name
// doubles as both the idea's pitch title and its first person.
export async function createIdea(name: string) {
  const session = await requireRole("admin");
  const parsed = quickAddSchema.parse({ name });
  const supabase = await createClient();

  const { data: idea, error } = await supabase
    .from("external_ideas")
    .insert({ pitch: parsed.name, created_by: session.user.id })
    .select("id")
    .single();
  if (error || !idea) throw new Error(error?.message ?? "Failed to add lead");

  const { error: personError } = await supabase
    .from("external_idea_people")
    .insert({ idea_id: idea.id, name: parsed.name });
  if (personError) throw new Error(personError.message);

  revalidatePath("/external");
  return idea.id as string;
}

export async function updatePitch(ideaId: string, pitch: string) {
  await requireRole("admin");
  const parsed = pitchSchema.parse({ pitch });
  const supabase = await createClient();
  const { error } = await supabase.from("external_ideas").update({ pitch: parsed.pitch }).eq("id", ideaId);
  if (error) throw new Error(error.message);
  revalidateIdea(ideaId);
}

export async function updateTargetDateTime(ideaId: string, values: { targetDate: string; targetTime: string }) {
  await requireRole("admin");
  const parsed = dateTimeSchema.parse(values);
  const supabase = await createClient();
  const { error } = await supabase
    .from("external_ideas")
    .update({ target_date: parsed.targetDate || null, target_time: parsed.targetTime || null })
    .eq("id", ideaId);
  if (error) throw new Error(error.message);
  revalidateIdea(ideaId);
}

export async function updateIdeaNotes(ideaId: string, notes: string) {
  await requireRole("admin");
  const parsed = notesSchema.parse({ notes });
  const supabase = await createClient();
  const { error } = await supabase
    .from("external_ideas")
    .update({ notes: parsed.notes || null })
    .eq("id", ideaId);
  if (error) throw new Error(error.message);
  revalidateIdea(ideaId);
}

// Handles every stage move — the stepper, the Declined shortcut, and
// Reactivate all funnel through here. Declining stashes the current stage
// in prev_stage first so Reactivate has somewhere to go back to; moving to
// any other stage is a plain write.
export async function setIdeaStage(ideaId: string, stage: StageValue) {
  await requireRole("admin");
  const supabase = await createClient();

  const { data: existing, error: existingError } = await supabase
    .from("external_ideas")
    .select("stage")
    .eq("id", ideaId)
    .single<Pick<IdeaRow, "stage">>();
  if (existingError || !existing) throw new Error(existingError?.message ?? "Lead not found");

  const update: { stage: StageValue; prev_stage?: StageValue } = { stage };
  if (stage === "declined" && existing.stage !== "declined") {
    update.prev_stage = existing.stage;
  }

  const { error } = await supabase.from("external_ideas").update(update).eq("id", ideaId);
  if (error) throw new Error(error.message);
  revalidateIdea(ideaId);
}

// Hard delete — people and owners cascade with the row. A converted lead's
// event is deliberately left alone: it lives on its own in /calendar once
// it exists, and nuking a real event from the outreach list would surprise.
export async function deleteIdea(ideaId: string) {
  await requireRole("admin");
  const supabase = await createClient();
  const { error } = await supabase.from("external_ideas").delete().eq("id", ideaId);
  if (error) throw new Error(error.message);
  revalidatePath("/external");
}

// Deleting from a list row can stay on /external — the revalidate above
// re-renders this route and the row just goes. Deleting from the lead's own
// page can't: revalidating re-renders the current route too, which would run
// /external/[id] straight into notFound() before we could leave. So this
// variant navigates instead, and does it with `replace` (Server Actions
// default to `push`) so Back doesn't return to a lead that no longer exists.
export async function deleteIdeaAndReturnToList(ideaId: string) {
  await deleteIdea(ideaId);
  redirect("/external", "replace");
}

export async function addPerson(ideaId: string) {
  await requireRole("admin");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("external_idea_people")
    .insert({ idea_id: ideaId, name: "" })
    .select("id")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to add person");
  revalidateIdea(ideaId);
  return data.id as string;
}

export async function updatePerson(ideaId: string, personId: string, values: { name: string; email: string }) {
  await requireRole("admin");
  const parsed = personSchema.parse(values);
  const supabase = await createClient();
  const { error } = await supabase
    .from("external_idea_people")
    .update({ name: parsed.name, email: parsed.email || null })
    .eq("id", personId);
  if (error) throw new Error(error.message);
  revalidateIdea(ideaId);
}

export async function removePerson(ideaId: string, personId: string) {
  await requireRole("admin");
  const supabase = await createClient();
  const { error } = await supabase.from("external_idea_people").delete().eq("id", personId);
  if (error) throw new Error(error.message);
  revalidateIdea(ideaId);
}

export async function toggleOwner(ideaId: string, profileId: string) {
  await requireRole("admin");
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("external_idea_owners")
    .select("profile_id")
    .eq("idea_id", ideaId)
    .eq("profile_id", profileId)
    .maybeSingle();

  const { error } = existing
    ? await supabase.from("external_idea_owners").delete().eq("idea_id", ideaId).eq("profile_id", profileId)
    : await supabase.from("external_idea_owners").insert({ idea_id: ideaId, profile_id: profileId });
  if (error) throw new Error(error.message);
  revalidateIdea(ideaId);
}

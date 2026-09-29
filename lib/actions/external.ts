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
// info, owners) gets filled in on the detail view, which the caller navigates
// to with the id returned here. The typed name doubles as both the idea's
// pitch title and its first person.
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

  // Since 0037 a person on a pitch is a pointer at a CRM contact, so the
  // quick-add's name creates the contact and the join row points at it.
  const { data: contact, error: contactError } = await supabase
    .from("outreach_contacts")
    .insert({ name: parsed.name, type: "speaker", visibility: "exec", source: "external pipeline" })
    .select("id")
    .single();
  if (contactError || !contact) throw new Error(contactError?.message ?? "Failed to add contact");

  const { error: personError } = await supabase
    .from("external_idea_people")
    .insert({ idea_id: idea.id, contact_id: contact.id });
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

// Adds an empty stub the admin then types into, exactly as before — the stub
// is now a blank CRM contact plus a join row rather than a blank name on the
// join row.
export async function addPerson(ideaId: string) {
  await requireRole("admin");
  const supabase = await createClient();

  const { data: contact, error: contactError } = await supabase
    .from("outreach_contacts")
    .insert({ name: "", type: "speaker", visibility: "exec", source: "external pipeline" })
    .select("id")
    .single();
  if (contactError || !contact) throw new Error(contactError?.message ?? "Failed to add person");

  const { data, error } = await supabase
    .from("external_idea_people")
    .insert({ idea_id: ideaId, contact_id: contact.id })
    .select("id")
    .single();
  if (error || !data) {
    // Don't leave a nameless contact behind if the link failed.
    await supabase.from("outreach_contacts").delete().eq("id", contact.id);
    throw new Error(error?.message ?? "Failed to add person");
  }

  revalidateIdea(ideaId);
  // Both ids come back: the join row's, which the detail screen keys and
  // edits by, and the contact's, so the optimistic row it inserts locally is
  // the same shape as one that came from the database.
  return { id: data.id as string, contactId: contact.id as string };
}

// Editing a person on a pitch edits the contact behind it, so the same edit
// shows up in the CRM and on that person's interaction timeline. `personId`
// is still the join row's id, which keeps the detail screen unchanged; the
// contact it points at is resolved here.
export async function updatePerson(ideaId: string, personId: string, values: { name: string; email: string }) {
  await requireRole("admin");
  const parsed = personSchema.parse(values);
  const supabase = await createClient();

  const { data: link } = await supabase
    .from("external_idea_people")
    .select("contact_id")
    .eq("id", personId)
    .maybeSingle<{ contact_id: string }>();
  if (!link) throw new Error("That person is no longer on this lead");

  const { error } = await supabase
    .from("outreach_contacts")
    .update({ name: parsed.name, email: parsed.email || null })
    .eq("id", link.contact_id);
  if (error) throw new Error(error.message);
  revalidateIdea(ideaId);
  revalidatePath("/crm");
}

// Removes the person from this pitch only. The contact survives, along with
// whatever has already been said to them — taking someone off a panel idea
// is not a reason to forget the conversation.
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

"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/requireRole";
import { createClient } from "@/lib/supabase/server";
import { actionFailed, actionOk, type ActionResult } from "@/lib/actions/result";
import {
  contactSchema,
  interactionSchema,
  organizationSchema,
  organizationDomainFromEmail,
  type ContactInput,
  type InteractionInput,
  type OrganizationInput,
} from "@/lib/validation/crm-schemas";

function databaseFailure(what: string, error: { message: string }): ActionResult {
  console.error(`[crm] couldn't ${what}:`, error.message);
  return actionFailed(`Couldn't ${what} — try again`);
}

// Everything here is admin-only, matching the RLS on outreach_contacts and
// the existing External pipeline: these are outside people's details, and
// they never opted into being visible to the whole club.

export async function createContact(
  input: ContactInput,
): Promise<ActionResult & { contactId?: string }> {
  await requireRole("admin");

  const parsed = contactSchema.safeParse(input);
  if (!parsed.success) {
    return actionFailed(parsed.error.issues[0]?.message ?? "Check the form");
  }
  const values = parsed.data;

  const supabase = await createClient();

  // Dedupe before insert so the answer is a sentence rather than a unique
  // violation. The partial index on lower(email) is still the real guard.
  if (values.email) {
    const { data: existing } = await supabase
      .from("outreach_contacts")
      .select("id, name")
      .ilike("email", values.email)
      .maybeSingle<{ id: string; name: string }>();
    if (existing) {
      return actionFailed(`${existing.name} is already in the CRM with that email`);
    }
  }

  // Attach to an organization by email domain when one already exists. Not
  // created automatically: a new organization is a deliberate act, and
  // inventing one per new domain fills the list with one-contact shells.
  let organizationId = values.organizationId;
  if (!organizationId) {
    const domain = organizationDomainFromEmail(values.email);
    if (domain) {
      const { data: org } = await supabase
        .from("organizations")
        .select("id")
        .eq("domain", domain)
        .maybeSingle<{ id: string }>();
      organizationId = org?.id ?? null;
    }
  }

  const { data, error } = await supabase
    .from("outreach_contacts")
    .insert({
      name: values.name,
      email: values.email,
      company: values.company,
      title: values.title,
      type: values.type,
      status: values.status,
      notes: values.notes,
      assigned_to: values.assignedTo,
      organization_id: organizationId,
      visibility: values.visibility,
      source: values.source,
      linkedin_url: values.linkedinUrl,
      next_follow_up_at: values.nextFollowUpAt,
    })
    .select("id")
    .single();

  if (error || !data) return databaseFailure("add that contact", error ?? { message: "no row" });

  revalidatePath("/crm");
  return { ...actionOk(), contactId: data.id as string };
}

export async function updateContact(
  contactId: string,
  input: ContactInput,
): Promise<ActionResult> {
  await requireRole("admin");

  const parsed = contactSchema.safeParse(input);
  if (!parsed.success) {
    return actionFailed(parsed.error.issues[0]?.message ?? "Check the form");
  }
  const values = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase
    .from("outreach_contacts")
    .update({
      name: values.name,
      email: values.email,
      company: values.company,
      title: values.title,
      type: values.type,
      status: values.status,
      notes: values.notes,
      assigned_to: values.assignedTo,
      organization_id: values.organizationId,
      visibility: values.visibility,
      source: values.source,
      linkedin_url: values.linkedinUrl,
      next_follow_up_at: values.nextFollowUpAt,
    })
    .eq("id", contactId);

  if (error) {
    if (error.code === "23505") {
      return actionFailed("Another contact already has that email");
    }
    return databaseFailure("save that contact", error);
  }

  revalidatePath("/crm");
  revalidatePath(`/crm/${contactId}`);
  return actionOk();
}

export async function deleteContact(contactId: string): Promise<ActionResult> {
  await requireRole("admin");
  const supabase = await createClient();

  // external_idea_people cascades from the contact, so deleting one that is
  // named on a live pitch would quietly remove them from that panel too. Say
  // so instead of doing it.
  const { count } = await supabase
    .from("external_idea_people")
    .select("id", { count: "exact", head: true })
    .eq("contact_id", contactId);

  if ((count ?? 0) > 0) {
    return actionFailed(
      "This person is named on a lead in External — take them off it first",
    );
  }

  const { error } = await supabase.from("outreach_contacts").delete().eq("id", contactId);
  if (error) return databaseFailure("delete that contact", error);

  revalidatePath("/crm");
  return actionOk("Deleted");
}

export async function logInteraction(input: InteractionInput): Promise<ActionResult> {
  const session = await requireRole("admin");

  const parsed = interactionSchema.safeParse(input);
  if (!parsed.success) {
    return actionFailed(parsed.error.issues[0]?.message ?? "Check the form");
  }
  const values = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase.from("interactions").insert({
    contact_id: values.contactId,
    profile_id: session.profile.id,
    kind: values.kind,
    occurred_at: new Date(values.occurredAt).toISOString(),
    summary: values.summary,
    body: values.body,
  });
  if (error) return databaseFailure("log that", error);

  // last_touched_at is maintained by trigger, so nothing to set here.
  revalidatePath(`/crm/${values.contactId}`);
  revalidatePath("/crm");
  return actionOk("Logged");
}

// No update action on purpose. An interaction records something that
// happened; correcting one means adding another. The table has no update
// policy either, so this isn't merely a missing feature.
export async function deleteInteraction(
  interactionId: string,
  contactId: string,
): Promise<ActionResult> {
  await requireRole("admin");
  const supabase = await createClient();

  const { error } = await supabase.from("interactions").delete().eq("id", interactionId);
  if (error) return databaseFailure("remove that entry", error);

  revalidatePath(`/crm/${contactId}`);
  return actionOk();
}

export async function createOrganization(input: OrganizationInput): Promise<ActionResult> {
  await requireRole("admin");

  const parsed = organizationSchema.safeParse(input);
  if (!parsed.success) {
    return actionFailed(parsed.error.issues[0]?.message ?? "Check the form");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("organizations").insert(parsed.data);
  if (error) {
    if (error.code === "23505") return actionFailed("An organization already has that domain");
    return databaseFailure("add that organization", error);
  }

  revalidatePath("/crm");
  return actionOk();
}

// Rolls every contact whose email matches an organization's domain onto that
// organization. Run after adding one, so the people already in the CRM don't
// have to be reattached by hand.
export async function attachContactsByDomain(organizationId: string): Promise<ActionResult> {
  await requireRole("admin");
  const supabase = await createClient();

  const { data: org } = await supabase
    .from("organizations")
    .select("domain")
    .eq("id", organizationId)
    .maybeSingle<{ domain: string | null }>();

  if (!org?.domain) return actionFailed("That organization has no domain to match on");

  const { data: updated, error } = await supabase
    .from("outreach_contacts")
    .update({ organization_id: organizationId })
    .is("organization_id", null)
    .ilike("email", `%@${org.domain}`)
    .select("id");

  if (error) return databaseFailure("attach contacts", error);

  revalidatePath("/crm");
  return actionOk(`Attached ${updated?.length ?? 0}`);
}

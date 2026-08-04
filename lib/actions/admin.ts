"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/requireRole";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { actionFailed, actionOk, type ActionResult } from "@/lib/actions/result";
import type { Role } from "@/lib/auth/getSession";

// A database error isn't something the person clicking can do anything about,
// and its text names columns and constraints, so they get a plain retry line
// while the real message goes to the server log — which is where a failure
// like a migration that never ran on production actually gets diagnosed.
function databaseFailure(what: string, error: { message: string }): ActionResult {
  console.error(`[admin] couldn't ${what}:`, error.message);
  return actionFailed(`Couldn't ${what} — try again`);
}

export async function updateUserRole(userId: string, role: Role): Promise<ActionResult> {
  await requireRole("admin");
  const supabase = await createClient();

  const { error } = await supabase.from("profiles").update({ role }).eq("id", userId);
  if (error) return databaseFailure("update their role", error);

  revalidatePath("/admin");
  return actionOk();
}

// There's no self-serve signup — every account starts from an admin invite
// (see app/auth/callback/route.ts). This just bounds which domains an admin
// can invite from, e.g. a personal Gmail for a non-Cornell collaborator.
// Configurable via a comma-separated env var.
const INVITE_ALLOWED_DOMAINS = (process.env.INVITE_ALLOWED_DOMAINS ?? "cornell.edu,gmail.com")
  .split(",")
  .map((domain) => domain.trim().toLowerCase())
  .filter(Boolean);

export async function inviteUser(email: string, role: Role): Promise<ActionResult> {
  const session = await requireRole("admin");

  const normalizedEmail = email.trim().toLowerCase();
  const domain = normalizedEmail.split("@")[1];
  if (!domain || !INVITE_ALLOWED_DOMAINS.includes(domain)) {
    return actionFailed(`Invites are limited to: ${INVITE_ALLOWED_DOMAINS.join(", ")}`);
  }

  const admin = createAdminClient();

  const { data: existingProfile } = await admin
    .from("profiles")
    .select("id")
    .eq("email", normalizedEmail)
    .maybeSingle();
  if (existingProfile) return actionFailed("This person already has access");

  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const { data, error } = await admin.auth.admin.inviteUserByEmail(normalizedEmail, {
    redirectTo: `${origin}/login`,
  });
  // The one place a Supabase message is worth passing through: these are
  // about the email itself ("already been registered", "invalid format"),
  // which the admin can act on, and the profiles check above can't catch an
  // auth.users shell that outlived its profile row.
  if (error || !data.user) {
    console.error("[admin] couldn't send invite:", error?.message ?? "no user returned");
    return actionFailed(error?.message ?? "Couldn't send invite");
  }

  const { error: profileError } = await admin.from("profiles").insert({
    id: data.user.id,
    email: normalizedEmail,
    role,
    status: "invited",
    invited_by: session.profile.id,
    invited_at: new Date().toISOString(),
  });
  if (profileError) {
    // Don't leave an orphan auth.users shell if the profile row failed.
    await admin.auth.admin.deleteUser(data.user.id);
    return databaseFailure("send invite", profileError);
  }

  revalidatePath("/admin");
  return actionOk();
}

export async function revokeInvite(userId: string): Promise<ActionResult> {
  await requireRole("admin");
  const admin = createAdminClient();

  // Scoping the delete to status='invited' silently matches zero rows if
  // this invite was already accepted (e.g. the person accepted it in
  // another tab right before this ran) — deleting the auth user
  // unconditionally afterward would then destroy their now-active,
  // fully-working account instead of a stale invite. Only proceed if a
  // pending-invite row genuinely existed and was removed.
  const { data: deleted, error } = await admin
    .from("profiles")
    .delete()
    .eq("id", userId)
    .eq("status", "invited")
    .select("id");
  if (error) return databaseFailure("cancel the invite", error);
  if (!deleted || deleted.length === 0) {
    return actionFailed("This invite was already accepted — refresh to see their current access");
  }

  await admin.auth.admin.deleteUser(userId);

  revalidatePath("/admin");
  return actionOk();
}

// Removing an accepted member, as opposed to cancelling an unaccepted invite
// above. This one can't delete anything: profiles.id cascades from
// auth.users, and events.created_by / files.uploaded_by / notes.updated_by /
// external_ideas.created_by / event_tagged_members.tagged_by / invited_by all
// reference profiles(id) with no on-delete rule, so the delete is refused for
// anyone who has ever done anything in here. Flipping status to 'revoked'
// keeps their name attached to the work they did while getSession() stops
// building a session for them — see lib/auth/getSession.ts.
export async function removeAccess(userId: string): Promise<ActionResult> {
  const session = await requireRole("admin");
  const supabase = await createClient();

  if (userId === session.profile.id) {
    return actionFailed("You can't remove your own access");
  }

  const { data: target } = await supabase
    .from("profiles")
    .select("id, role, status")
    .eq("id", userId)
    .maybeSingle<{ id: string; role: Role; status: string }>();
  if (!target) return actionFailed("That person no longer exists — refresh the page");
  if (target.status === "revoked") {
    return actionFailed("Their access was already removed — refresh the page");
  }

  // Nobody can be left without a way back in. Counting active admins rather
  // than all admins matters: a revoked admin can't sign in to promote anyone,
  // so they don't count toward the app still having someone in charge.
  if (target.role === "admin") {
    const { count } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin")
      .eq("status", "active");
    if ((count ?? 0) <= 1) {
      return actionFailed("This is the only admin left — make someone else an admin first");
    }
  }

  const { error } = await supabase
    .from("profiles")
    .update({ status: "revoked" })
    .eq("id", userId);
  if (error) return databaseFailure("remove access", error);

  revalidatePath("/admin");
  return actionOk();
}

// The counterpart to removeAccess. Necessary rather than merely convenient:
// inviteUser refuses an email that already has a profile row, and a revoked
// person still has one, so without this an accidental removal couldn't be
// undone from the UI at all. Their old role comes back with them.
export async function restoreAccess(userId: string): Promise<ActionResult> {
  await requireRole("admin");
  const supabase = await createClient();

  const { data: restored, error } = await supabase
    .from("profiles")
    .update({ status: "active" })
    .eq("id", userId)
    .eq("status", "revoked")
    .select("id");
  if (error) return databaseFailure("restore access", error);
  if (!restored || restored.length === 0) {
    return actionFailed("They aren't removed — refresh the page");
  }

  revalidatePath("/admin");
  return actionOk();
}

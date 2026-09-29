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
    .select("id, status")
    .eq("email", normalizedEmail)
    .maybeSingle<{ id: string; status: string }>();

  // Inviting someone who was removed is how they come back — there's no
  // restore button any more, because /admin doesn't show removed people at
  // all. Their profile row and their auth.users row both still exist (that's
  // why removal isn't a delete), so this revives what's there rather than
  // creating anything: back to 'invited' with whatever role this invite
  // grants, and the Google sign-in flips them to active exactly as it would
  // a newcomer. No mail goes out, here or anywhere else in this action, so
  // say so rather than leaving them waiting for one.
  if (existingProfile?.status === "revoked") {
    const { error: reviveError } = await admin
      .from("profiles")
      .update({
        role,
        status: "invited",
        invited_by: session.profile.id,
        invited_at: new Date().toISOString(),
      })
      .eq("id", existingProfile.id);
    if (reviveError) return databaseFailure("send invite", reviveError);

    revalidatePath("/admin");
    return actionOk(`${normalizedEmail} can sign in again — no new email was sent`);
  }

  if (existingProfile) return actionFailed("This person already has access");

  // No mail goes out, and the invite no longer depends on any being sent.
  //
  // inviteUserByEmail used to do this, but it creates the account and mails
  // about it in one call, so the mailer's limit (2/hour on this project, with
  // no custom SMTP) decided whether the account came into existence at all.
  // Nothing about access needs that email: an invite *is* a profiles row at
  // status 'invited', and app/auth/callback flips it to active when the person
  // signs in with Google. The email only ever told them to do a thing they
  // could be told in person.
  const { userId, adopted, error: userError } = await ensureAuthUser(admin, normalizedEmail);
  if (!userId) {
    console.error("[admin] couldn't create the account:", userError ?? "no user returned");
    return actionFailed(userError ?? "Couldn't create their account");
  }

  const { error: profileError } = await admin.from("profiles").insert({
    id: userId,
    email: normalizedEmail,
    role,
    status: "invited",
    invited_by: session.profile.id,
    invited_at: new Date().toISOString(),
  });
  if (profileError) {
    // Only clean up a shell this call made. Adopting someone's existing
    // Google account and then deleting it over a failed insert would sign
    // them out of an account that was not ours to remove.
    if (!adopted) await admin.auth.admin.deleteUser(userId);
    return databaseFailure("send invite", profileError);
  }

  revalidatePath("/admin");
  return actionOk(`${normalizedEmail} can sign in now. Tell them to use Google at this site`);
}

// The auth.users row for this email, creating it if there isn't one.
//
// Someone who signs in with Google *before* being invited leaves a shell
// behind: app/auth/callback bounces them to /login?error=not_invited, but
// Google has already created the account by the time that check runs. That
// shell used to lock the person out of the club permanently. The profiles
// lookup above sees nothing, so this fell through to creating an account,
// which failed with "already been registered", so no profiles row was ever
// written, so their next sign-in bounced them again, forever.
//
// Adopting the shell is the fix: it is their account, it just never had a
// profile attached. createUser is tried first because it is one call and the
// common case is a genuine newcomer; the listUsers scan only runs when the
// address is already taken.
//
// `adopted` says whether the account predates this call, because the caller
// may only delete one it created itself.
async function ensureAuthUser(
  admin: ReturnType<typeof createAdminClient>,
  email: string,
): Promise<{ userId: string | null; adopted: boolean; error: string | null }> {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
  });
  if (data?.user) return { userId: data.user.id, adopted: false, error: null };

  // Anything other than "that address is taken" is a real failure.
  if (!error || !/already|registered|exists/i.test(error.message)) {
    return { userId: null, adopted: false, error: error?.message ?? null };
  }

  // No getUserByEmail in supabase-js, so page through. This club is a dozen
  // accounts; the loop is bounded so a future one of any size still ends.
  for (let page = 1; page <= 20; page += 1) {
    const { data: list, error: listError } = await admin.auth.admin.listUsers({
      page,
      perPage: 200,
    });
    if (listError) return { userId: null, adopted: false, error: listError.message };

    const match = list.users.find((user) => user.email?.toLowerCase() === email);
    if (match) return { userId: match.id, adopted: true, error: null };
    if (list.users.length < 200) break;
  }

  // Taken, but not findable. Nothing sensible left to do but say so.
  return {
    userId: null,
    adopted: false,
    error: "That address already has an account we can't reach. Ask for help",
  };
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
  if (error) {
    // A re-invited former member can't be deleted: the events, photos and
    // notes they made before being removed still reference this row, which
    // is the whole reason removal is a revoke rather than a delete. Cancel
    // their invite by putting them back to removed — same outcome on screen,
    // nothing of theirs destroyed, and their auth user is left alone.
    if (error.code === "23503") {
      const { error: revokeError } = await admin
        .from("profiles")
        .update({ status: "revoked" })
        .eq("id", userId)
        .eq("status", "invited");
      if (revokeError) return databaseFailure("cancel the invite", revokeError);

      revalidatePath("/admin");
      return actionOk();
    }
    return databaseFailure("cancel the invite", error);
  }
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
//
// It reads as a delete from /admin, though: the row is filtered out of that
// page, so there's no trace of them and no restore. Undoing it means
// inviting the address again, which inviteUser handles above.
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

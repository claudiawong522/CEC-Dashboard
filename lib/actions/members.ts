"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/getSession";
import { requireRole } from "@/lib/auth/requireRole";
import { createClient } from "@/lib/supabase/server";
import { actionFailed, actionOk, type ActionResult } from "@/lib/actions/result";
import {
  matchingSchema,
  profileSchema,
  type MatchingInput,
  type ProfileInput,
} from "@/lib/validation/member-schemas";

function databaseFailure(what: string, error: { message: string }): ActionResult {
  console.error(`[members] couldn't ${what}:`, error.message);
  return actionFailed(`Couldn't ${what} — try again`);
}

// Editing your own profile is the one write in this app available to every
// role, 'view' included: an alumni account that can't change an event still
// has a name and a bio of their own. So this checks for a session rather
// than calling requireRole.
//
// Nothing here can touch role or status even if it were passed: the schema
// doesn't carry those fields, the RLS policy scopes the row to auth.uid(),
// and the trigger from 0030 rejects the change outright. Three layers on
// purpose — this is the one place a member writes to their own profiles row.
export async function updateOwnProfile(values: ProfileInput): Promise<ActionResult> {
  const session = await getSession();
  if (!session) throw new Error("Not signed in");

  const parsed = profileSchema.safeParse(values);
  if (!parsed.success) {
    return actionFailed(parsed.error.issues[0]?.message ?? "Check the highlighted fields");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update(parsed.data)
    .eq("id", session.profile.id);

  if (error) {
    // netid is unique across the club, and the message names the constraint
    // rather than the problem, so it's worth translating: two people typing
    // the same netid is a real thing that happens when someone guesses a
    // teammate's instead of their own.
    if (error.code === "23505") {
      return actionFailed("That netid already belongs to another member");
    }
    return databaseFailure("save your profile", error);
  }

  revalidatePath("/profile");
  revalidatePath("/members");
  revalidatePath(`/members/${session.profile.id}`);
  return actionOk();
}

export async function updateOwnMatching(values: MatchingInput): Promise<ActionResult> {
  const session = await getSession();
  if (!session) throw new Error("Not signed in");

  const parsed = matchingSchema.safeParse(values);
  if (!parsed.success) {
    return actionFailed(parsed.error.issues[0]?.message ?? "Check the highlighted fields");
  }

  // Being listed with nothing to say is worse than not being listed: a
  // student picking someone to ask has only the blurb to go on.
  if (parsed.data.open_to_chats && !parsed.data.chat_blurb) {
    return actionFailed("Add a line about what you're happy to chat about first");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update(parsed.data)
    .eq("id", session.profile.id);
  if (error) return databaseFailure("save your chat preferences", error);

  revalidatePath("/profile");
  revalidatePath("/members");
  return actionOk();
}

// Marking someone inactive keeps them in the directory but drops them out of
// pickers and the bingo board. Deliberately not the same as removing access
// (lib/actions/admin.ts): a member who graduated still signs in, and an
// account that was revoked may well still be listed as an alum.
export async function setMemberActive(
  memberId: string,
  active: boolean,
): Promise<ActionResult> {
  await requireRole("admin");

  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ active }).eq("id", memberId);
  if (error) return databaseFailure("update their status", error);

  revalidatePath("/members");
  revalidatePath(`/members/${memberId}`);
  return actionOk();
}

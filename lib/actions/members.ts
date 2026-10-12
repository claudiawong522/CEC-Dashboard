"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/getSession";
import { requireRole } from "@/lib/auth/requireRole";
import { createClient } from "@/lib/supabase/server";
import { pingSiteRevalidate } from "@/lib/site-sync";
import { actionFailed, actionOk, type ActionResult } from "@/lib/actions/result";
import {
  matchingSchema,
  parseProfileFields,
  type MatchingInput,
  type ProfileFieldErrors,
  type ProfileInput,
} from "@/lib/validation/member-schemas";

function databaseFailure(what: string, error: { message: string }): ActionResult {
  console.error(`[members] couldn't ${what}:`, error.message);
  return actionFailed(`Couldn't ${what}. Try again`);
}

// Editing your own profile is open to every signed-in member, so this checks
// for a session rather than calling requireRole.
//
// Nothing here can touch role or status even if it were passed: the schema
// doesn't carry those fields, the RLS policy scopes the row to auth.uid(),
// and the trigger from 0030 rejects the change outright. Three layers on
// purpose — this is the one place a member writes to their own profiles row.
// Valid fields are saved even when others are not; the invalid ones come
// back in fieldErrors so the form can show each under its own input.
export async function updateOwnProfile(
  values: ProfileInput,
): Promise<ActionResult & { fieldErrors?: ProfileFieldErrors }> {
  const session = await getSession();
  if (!session) throw new Error("Not signed in");

  const { data, errors: fieldErrors } = parseProfileFields(values);

  const supabase = await createClient();
  let { error } = await supabase.from("profiles").update(data).eq("id", session.profile.id);

  // netid is unique across the club, and the message names the constraint
  // rather than the problem, so it's worth translating: two people typing
  // the same netid is a real thing that happens when someone guesses a
  // teammate's instead of their own. The rest of the row still saves.
  if (error?.code === "23505" && "netid" in data) {
    fieldErrors.netid = "That netid already belongs to another member";
    delete data.netid;
    ({ error } = await supabase.from("profiles").update(data).eq("id", session.profile.id));
  }
  if (error) return databaseFailure("save your profile", error);

  revalidatePath("/profile");
  revalidatePath("/members");
  revalidatePath(`/members/${session.profile.id}`);
  pingSiteRevalidate();
  return Object.keys(fieldErrors).length ? { ...actionOk(), fieldErrors } : actionOk();
}

// The photo is uploaded straight from the browser into the public
// `portraits` bucket (components/members/AvatarUploader.tsx); this only
// records where it landed. null clears it. Same three layers as above keep
// it to the person's own row.
export async function updateOwnAvatar(avatarUrl: string | null): Promise<ActionResult> {
  const session = await getSession();
  if (!session) throw new Error("Not signed in");

  if (avatarUrl !== null) {
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
    const expected = `${base}/storage/v1/object/public/portraits/avatars/${session.profile.id}/`;
    if (!avatarUrl.startsWith(expected)) return actionFailed("That photo isn't yours to use");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: avatarUrl })
    .eq("id", session.profile.id);
  if (error) return databaseFailure("save your photo", error);

  revalidatePath("/profile");
  revalidatePath("/members");
  revalidatePath(`/members/${session.profile.id}`);
  pingSiteRevalidate();
  return actionOk();
}

export async function updateOwnMatching(values: MatchingInput): Promise<ActionResult> {
  const session = await getSession();
  if (!session) throw new Error("Not signed in");

  const parsed = matchingSchema.safeParse(values);
  if (!parsed.success) {
    return actionFailed(parsed.error.issues[0]?.message ?? "Check the highlighted fields");
  }

  // Opting in before writing a blurb is allowed: the card prompts for one
  // inline, and the member page only shows the chat section once both exist.
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

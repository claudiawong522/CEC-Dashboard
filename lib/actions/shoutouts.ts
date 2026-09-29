"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/getSession";
import { requireRole } from "@/lib/auth/requireRole";
import { createClient } from "@/lib/supabase/server";
import { actionFailed, actionOk, type ActionResult } from "@/lib/actions/result";
import { currentTermKey } from "@/lib/utils/terms";
import { shoutoutSchema, type ShoutoutInput } from "@/lib/validation/club-schemas";

function databaseFailure(what: string, error: { message: string }): ActionResult {
  console.error(`[shoutouts] couldn't ${what}:`, error.message);
  return actionFailed(`Couldn't ${what} — try again`);
}

export async function giveShoutout(input: ShoutoutInput): Promise<ActionResult> {
  const session = await getSession();
  if (!session) throw new Error("Not signed in");

  const parsed = shoutoutSchema.safeParse(input);
  if (!parsed.success) {
    return actionFailed(parsed.error.issues[0]?.message ?? "Check the form");
  }
  const { receiverId, receiverName, message, isAnonymous } = parsed.data;

  if (receiverId === session.profile.id) {
    return actionFailed("Shouting yourself out is a bit much");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("shoutouts").insert({
    giver_id: session.profile.id,
    receiver_id: receiverId,
    receiver_name: receiverName,
    message,
    is_anonymous: isAnonymous,
    semester: currentTermKey(),
  });
  if (error) return databaseFailure("post that shoutout", error);

  revalidatePath("/shoutouts");
  return actionOk("Posted");
}

// Hidden rather than deleted: the same message can't simply be reposted, and
// an admin who hides the wrong one can put it back.
export async function setShoutoutHidden(
  shoutoutId: string,
  hidden: boolean,
): Promise<ActionResult> {
  await requireRole("admin");

  const supabase = await createClient();
  const { error } = await supabase.from("shoutouts").update({ hidden }).eq("id", shoutoutId);
  if (error) return databaseFailure("update that shoutout", error);

  revalidatePath("/shoutouts");
  return actionOk(hidden ? "Hidden" : "Restored");
}

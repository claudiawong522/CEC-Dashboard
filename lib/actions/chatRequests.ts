"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth/getSession";
import { requireRole } from "@/lib/auth/requireRole";
import { actionFailed, actionOk, type ActionResult } from "@/lib/actions/result";
import { chatRequestSchema, type ChatRequestInput } from "@/lib/validation/chat-request-schemas";

function databaseFailure(what: string, error: { message: string }): ActionResult {
  console.error(`[chat-requests] couldn't ${what}:`, error.message);
  return actionFailed(`Couldn't ${what}, try again`);
}

/**
 * The public signup. No account and no session, so it runs on the service role
 * exactly like the Startup Hours sign in: `anon` has no grants on this project
 * and keeps none. Everything it writes is derived from the validated form, and
 * it never accepts an id from the browser.
 */
export async function submitChatRequest(input: ChatRequestInput): Promise<ActionResult> {
  const parsed = chatRequestSchema.safeParse(input);
  if (!parsed.success) return actionFailed(parsed.error.issues[0]?.message ?? "Check the form");

  const { netid, fullName, gradYear, major, interests, prompt } = parsed.data;
  // The form only ever offers a netid, so the address is Cornell by
  // construction rather than by validating what someone typed.
  const email = `${netid}@cornell.edu`;
  const admin = createAdminClient();

  // A member asking for a coffee chat with a member is what the bingo board is
  // for, and it would put them in the prospective pool.
  const { data: member } = await admin
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle<{ id: string }>();
  if (member) {
    return actionFailed("You're already a member — use the coffee chat board instead");
  }

  const background = [major, gradYear].filter(Boolean).join(", ") || null;

  const { data: guest, error: guestError } = await admin
    .from("guests")
    .upsert(
      {
        email,
        full_name: fullName,
        // Don't wipe a background captured at a Startup Hours sign in.
        ...(background ? { background } : {}),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "email" },
    )
    .select("id")
    .single<{ id: string }>();

  if (guestError || !guest) {
    return databaseFailure("save your details", guestError ?? { message: "no guest row returned" });
  }

  const { error } = await admin.from("chat_requests").insert({
    guest_id: guest.id,
    student_email: email,
    student_name: fullName,
    tags: interests,
    interests,
    prompt,
    status: "pending",
  });

  if (error) {
    // The partial unique index on (guest_id) where status = 'pending'.
    if (error.code === "23505") {
      return actionFailed("You've already got a request waiting — someone will be in touch");
    }
    return databaseFailure("send your request", error);
  }

  revalidatePath("/chat-requests");
  return actionOk();
}

/**
 * Take a request out of the pool. The `is null` in the filter is the whole
 * concurrency story: two members clicking at the same moment both run this, and
 * the second one matches zero rows rather than overwriting the first.
 */
export async function claimChatRequest(requestId: string): Promise<ActionResult> {
  const session = await getSession();
  if (!session) throw new Error("Not signed in");
  if (session.profile.role === "view") {
    return actionFailed("View-only accounts can't take chat requests");
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("chat_requests")
    .update({
      claimed_by: session.profile.id,
      claimed_at: new Date().toISOString(),
      status: "claimed",
    })
    .eq("id", requestId)
    .is("claimed_by", null)
    .select("id");

  if (error) return databaseFailure("claim that request", error);
  if (!data?.length) return actionFailed("Someone just took that one");

  revalidatePath("/chat-requests");
  return actionOk("Yours — reach out and say hello");
}

/** Put one back, for when a member claims and then can't do it. */
export async function releaseChatRequest(requestId: string): Promise<ActionResult> {
  const session = await getSession();
  if (!session) throw new Error("Not signed in");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("chat_requests")
    .update({ claimed_by: null, claimed_at: null, status: "pending" })
    .eq("id", requestId)
    .eq("claimed_by", session.profile.id)
    .select("id");

  if (error) return databaseFailure("release that request", error);
  if (!data?.length) return actionFailed("That one isn't yours to release");

  revalidatePath("/chat-requests");
  return actionOk("Back in the pool");
}

export async function declineChatRequest(requestId: string): Promise<ActionResult> {
  await requireRole("admin");

  const supabase = await createClient();
  const { error } = await supabase
    .from("chat_requests")
    .update({ status: "declined", claimed_by: null, claimed_at: null, responded_at: new Date().toISOString() })
    .eq("id", requestId);

  if (error) return databaseFailure("decline that request", error);

  revalidatePath("/chat-requests");
  return actionOk("Declined");
}

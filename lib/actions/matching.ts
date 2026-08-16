"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/getSession";
import { getStudent } from "@/lib/auth/getStudent";
import { createClient } from "@/lib/supabase/server";
import { actionFailed, actionOk, type ActionResult } from "@/lib/actions/result";
import {
  chatRequestSchema,
  MAX_OPEN_PER_MEMBER,
  MAX_OPEN_PER_STUDENT,
  type ChatRequestInput,
  type RequestStatus,
} from "@/lib/validation/matching-schemas";

function databaseFailure(what: string, error: { message: string }): ActionResult {
  console.error(`[matching] couldn't ${what}:`, error.message);
  return actionFailed(`Couldn't ${what} — try again`);
}

// Sent by a prospective member, not a club member. The database enforces all
// of this too (0013 and 0018): that the sender is writing in their own name,
// that they're a Cornell account with no profile, and that the member they're
// asking actually opted in. These checks exist to return a sentence instead
// of a constraint violation.
export async function requestChat(input: ChatRequestInput): Promise<ActionResult> {
  const student = await getStudent();
  if (!student) throw new Error("Not signed in as a prospective member");

  const parsed = chatRequestSchema.safeParse(input);
  if (!parsed.success) {
    return actionFailed(parsed.error.issues[0]?.message ?? "Check the form");
  }
  const { profileId, prompt, tags, studentName } = parsed.data;

  const supabase = await createClient();

  // Two caps, for two different problems. One student papering the whole club
  // with requests, and one member being buried by them.
  const { count: mine } = await supabase
    .from("chat_requests")
    .select("id", { count: "exact", head: true })
    .ilike("student_email", student.email)
    .eq("status", "pending");

  if ((mine ?? 0) >= MAX_OPEN_PER_STUDENT) {
    return actionFailed(
      `You have ${MAX_OPEN_PER_STUDENT} requests still open. Wait for a reply before sending more.`,
    );
  }

  const { count: theirs } = await supabase
    .from("chat_requests")
    .select("id", { count: "exact", head: true })
    .eq("profile_id", profileId)
    .eq("status", "pending");

  if ((theirs ?? 0) >= MAX_OPEN_PER_MEMBER) {
    return actionFailed("They have a full inbox right now — try someone else");
  }

  const { error } = await supabase.from("chat_requests").insert({
    student_email: student.email,
    student_name: studentName || student.name || student.email,
    tags,
    prompt,
    profile_id: profileId,
    status: "pending",
  });

  if (error) {
    if (error.code === "23505") {
      return actionFailed("You've already asked them — give them a chance to reply");
    }
    // The insert policy refuses a member who isn't open to chats, which
    // arrives as a policy violation rather than a check violation.
    if (error.code === "42501") {
      return actionFailed("They're not taking chat requests right now");
    }
    return databaseFailure("send that request", error);
  }

  revalidatePath("/matching");
  return actionOk("Sent — they'll get back to you by email");
}

// The member's side. A student cannot move their own request along, which is
// what keeps 'accepted' meaningful.
export async function respondToRequest(
  requestId: string,
  status: Exclude<RequestStatus, "pending">,
): Promise<ActionResult> {
  const session = await getSession();
  if (!session) throw new Error("Not signed in");

  const supabase = await createClient();
  const { data: updated, error } = await supabase
    .from("chat_requests")
    .update({ status, responded_at: new Date().toISOString() })
    .eq("id", requestId)
    // Scoped so two tabs, or a member and an admin, can't overwrite each
    // other's decision without noticing.
    .eq("status", "pending")
    .select("id");

  if (error) return databaseFailure("update that request", error);
  if (!updated || updated.length === 0) {
    return actionFailed("That one was already answered — refresh");
  }

  revalidatePath("/chat-requests");
  return actionOk(status === "accepted" ? "Accepted" : "Declined");
}

// Marking a chat as actually having happened, after accepting it.
export async function completeRequest(requestId: string): Promise<ActionResult> {
  const session = await getSession();
  if (!session) throw new Error("Not signed in");

  const supabase = await createClient();
  const { data: updated, error } = await supabase
    .from("chat_requests")
    .update({ status: "completed" })
    .eq("id", requestId)
    .eq("status", "accepted")
    .select("id");

  if (error) return databaseFailure("update that request", error);
  if (!updated || updated.length === 0) {
    return actionFailed("That one isn't waiting to be completed — refresh");
  }

  revalidatePath("/chat-requests");
  return actionOk("Nice");
}

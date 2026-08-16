"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/getSession";
import { requireRole } from "@/lib/auth/requireRole";
import { createClient } from "@/lib/supabase/server";
import { actionFailed, actionOk, type ActionResult } from "@/lib/actions/result";
import { currentTermKey } from "@/lib/utils/terms";
import {
  categorySchema,
  reviewChatSchema,
  submitChatSchema,
  SELFIE_BUCKET,
  type CategoryInput,
  type ReviewChatInput,
  type SubmitChatInput,
} from "@/lib/validation/coffee-chat-schemas";

function databaseFailure(what: string, error: { message: string }): ActionResult {
  console.error(`[coffee-chats] couldn't ${what}:`, error.message);
  return actionFailed(`Couldn't ${what} — try again`);
}

export async function submitChat(input: SubmitChatInput): Promise<ActionResult> {
  const session = await getSession();
  if (!session) throw new Error("Not signed in");

  const parsed = submitChatSchema.safeParse(input);
  if (!parsed.success) {
    return actionFailed(parsed.error.issues[0]?.message ?? "Check the form");
  }
  const { partnerId, categoryId, storagePath } = parsed.data;

  if (partnerId === session.profile.id) {
    return actionFailed("Pick someone other than yourself");
  }

  const supabase = await createClient();
  const semester = currentTermKey();

  // The unique index on (submitter_id, category_id, semester) is the real
  // guard, but catching it here means a readable message instead of a
  // constraint name — and the common case is someone forgetting they already
  // filled this square weeks ago.
  const { error } = await supabase.from("coffee_chats").insert({
    submitter_id: session.profile.id,
    partner_id: partnerId,
    category_id: categoryId,
    selfie_url: storagePath,
    semester,
    status: "pending",
  });

  if (error) {
    if (error.code === "23505") {
      return actionFailed("You've already filled that square this semester");
    }
    if (error.code === "23514") {
      return actionFailed("Pick someone other than yourself");
    }
    return databaseFailure("submit your chat", error);
  }

  revalidatePath("/coffee-chats");
  return actionOk("Submitted — an admin will approve it shortly");
}

export async function reviewChat(input: ReviewChatInput): Promise<ActionResult> {
  const session = await requireRole("admin");

  const parsed = reviewChatSchema.safeParse(input);
  if (!parsed.success) {
    return actionFailed(parsed.error.issues[0]?.message ?? "Check the form");
  }
  const { chatId, approve, note } = parsed.data;

  const supabase = await createClient();
  // Scoped to status='pending' so two admins working the queue at once don't
  // overwrite each other: the second one matches zero rows and is told so,
  // rather than silently flipping a decision that was already made.
  const { data: updated, error } = await supabase
    .from("coffee_chats")
    .update({
      status: approve ? "approved" : "rejected",
      review_note: note,
      reviewed_by: session.profile.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", chatId)
    .eq("status", "pending")
    .select("id");

  if (error) return databaseFailure("review that chat", error);
  if (!updated || updated.length === 0) {
    return actionFailed("Someone already reviewed that one — refresh the queue");
  }

  revalidatePath("/coffee-chats");
  return actionOk(approve ? "Approved" : "Sent back");
}

export async function createCategory(input: CategoryInput): Promise<ActionResult> {
  await requireRole("admin");

  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) {
    return actionFailed(parsed.error.issues[0]?.message ?? "Check the form");
  }

  const supabase = await createClient();
  const semester = currentTermKey();

  // board_position is append-at-the-end. Reordering isn't offered: the board
  // is set up once a semester, and a square changing position after people
  // have started filling it in would move the tile out from under them.
  const { data: last } = await supabase
    .from("coffee_chat_categories")
    .select("board_position")
    .eq("semester", semester)
    .order("board_position", { ascending: false })
    .limit(1)
    .maybeSingle<{ board_position: number }>();

  const { error } = await supabase.from("coffee_chat_categories").insert({
    ...parsed.data,
    semester,
    board_position: (last?.board_position ?? -1) + 1,
  });
  if (error) return databaseFailure("add that square", error);

  revalidatePath("/coffee-chats");
  return actionOk();
}

export async function deleteCategory(categoryId: string): Promise<ActionResult> {
  await requireRole("admin");
  const supabase = await createClient();

  // Chats pointing at this square survive it: category_id is ON DELETE SET
  // NULL, so a removed tile turns those into uncategorised chats rather than
  // destroying someone's submission and its selfie.
  const { error } = await supabase
    .from("coffee_chat_categories")
    .delete()
    .eq("id", categoryId);
  if (error) return databaseFailure("remove that square", error);

  revalidatePath("/coffee-chats");
  return actionOk("Square removed — any chats on it are kept as uncategorised");
}

// The selfie bucket is private, unlike the event buckets, because these are
// photos of people rather than logistics evidence. Signing happens on the
// server per render: a short expiry means a URL that leaks out of a screenshot
// or a shared tab stops working quickly.
export async function signSelfies(paths: string[]): Promise<Record<string, string>> {
  if (paths.length === 0) return {};
  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from(SELFIE_BUCKET)
    .createSignedUrls(paths, 60 * 30);

  if (error || !data) {
    console.error("[coffee-chats] couldn't sign selfies:", error?.message);
    return {};
  }

  const signed: Record<string, string> = {};
  for (const entry of data) {
    if (entry.path && entry.signedUrl) signed[entry.path] = entry.signedUrl;
  }
  return signed;
}

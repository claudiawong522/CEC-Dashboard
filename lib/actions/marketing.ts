"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/requireRole";
import { createClient } from "@/lib/supabase/server";
import { customMarketingItemSchema } from "@/lib/validation/event-schemas";

export async function addCustomMarketingItem(eventId: string, label: string) {
  await requireRole("edit");
  const parsed = customMarketingItemSchema.parse({ label });
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("event_marketing_custom_items")
    .insert({ event_id: eventId, label: parsed.label })
    .select("id, event_id, label, done")
    .single();

  if (error || !data) throw new Error(error?.message ?? "Failed to add item");

  revalidatePath(`/events/${eventId}`);
  return data;
}

export async function toggleCustomMarketingItem(itemId: string, eventId: string, done: boolean) {
  await requireRole("edit");
  const supabase = await createClient();

  const { error } = await supabase
    .from("event_marketing_custom_items")
    .update({ done })
    .eq("id", itemId);

  if (error) throw new Error(error.message);
  revalidatePath(`/events/${eventId}`);
}

export async function deleteCustomMarketingItem(itemId: string, eventId: string) {
  await requireRole("edit");
  const supabase = await createClient();

  const { error } = await supabase.from("event_marketing_custom_items").delete().eq("id", itemId);
  if (error) throw new Error(error.message);
  revalidatePath(`/events/${eventId}`);
}

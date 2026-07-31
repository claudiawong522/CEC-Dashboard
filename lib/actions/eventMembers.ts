"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/requireRole";
import { createClient } from "@/lib/supabase/server";

export async function tagMember(eventId: string, profileId: string) {
  const session = await requireRole("edit");
  const supabase = await createClient();
  const { error } = await supabase
    .from("event_tagged_members")
    .insert({ event_id: eventId, profile_id: profileId, tagged_by: session.user.id });
  if (error) throw new Error(error.message);
  revalidatePath(`/events/${eventId}`);
  revalidatePath("/photos");
}

export async function untagMember(eventId: string, profileId: string) {
  await requireRole("edit");
  const supabase = await createClient();
  const { error } = await supabase
    .from("event_tagged_members")
    .delete()
    .eq("event_id", eventId)
    .eq("profile_id", profileId);
  if (error) throw new Error(error.message);
  revalidatePath(`/events/${eventId}`);
  revalidatePath("/photos");
}

"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/requireRole";
import { createClient } from "@/lib/supabase/server";
import type { Role } from "@/lib/auth/getSession";

export async function updateUserRole(userId: string, role: Role) {
  await requireRole("admin");
  const supabase = await createClient();

  const { error } = await supabase.from("profiles").update({ role }).eq("id", userId);
  if (error) throw new Error(error.message);

  revalidatePath("/admin");
}

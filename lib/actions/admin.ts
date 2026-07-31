"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/requireRole";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Role } from "@/lib/auth/getSession";

export async function updateUserRole(userId: string, role: Role) {
  await requireRole("admin");
  const supabase = await createClient();

  const { error } = await supabase.from("profiles").update({ role }).eq("id", userId);
  if (error) throw new Error(error.message);

  revalidatePath("/admin");
}

export async function inviteUser(email: string, role: Role) {
  const session = await requireRole("admin");

  const allowedDomain = process.env.ALLOWED_EMAIL_DOMAIN ?? "cornell.edu";
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail.endsWith(`@${allowedDomain}`)) {
    throw new Error(`Invites are limited to @${allowedDomain} addresses`);
  }

  const admin = createAdminClient();

  const { data: existingProfile } = await admin
    .from("profiles")
    .select("id")
    .eq("email", normalizedEmail)
    .maybeSingle();
  if (existingProfile) throw new Error("This person already has access");

  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const { data, error } = await admin.auth.admin.inviteUserByEmail(normalizedEmail, {
    redirectTo: `${origin}/login`,
  });
  if (error || !data.user) throw new Error(error?.message ?? "Couldn't send invite");

  const { error: profileError } = await admin.from("profiles").insert({
    id: data.user.id,
    email: normalizedEmail,
    role,
    status: "invited",
    invited_by: session.profile.id,
    invited_at: new Date().toISOString(),
  });
  if (profileError) {
    // Don't leave an orphan auth.users shell if the profile row failed.
    await admin.auth.admin.deleteUser(data.user.id);
    throw new Error(profileError.message);
  }

  revalidatePath("/admin");
}

export async function revokeInvite(userId: string) {
  await requireRole("admin");
  const admin = createAdminClient();

  const { error } = await admin
    .from("profiles")
    .delete()
    .eq("id", userId)
    .eq("status", "invited");
  if (error) throw new Error(error.message);

  await admin.auth.admin.deleteUser(userId);

  revalidatePath("/admin");
}

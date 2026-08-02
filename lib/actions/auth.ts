"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Counterpart to app/auth/callback/route.ts's invited -> active flip, for
// someone who accepted by clicking the invite email's own link instead of
// "Sign in with Google". That link establishes a session entirely
// client-side (the token lives in the URL hash, which never reaches a
// server route), so /login calls this once it notices the session exists.
export async function acceptInvitedSession() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) throw new Error("Not signed in");

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("id, status")
    .eq("id", user.id)
    .maybeSingle();

  // A revoked member clicking an old invite link would otherwise sit here
  // with a live session and no profile flip — harmless on its own, since
  // getSession() refuses them, but sign them out so they land on the login
  // screen with an explanation instead of a blank redirect loop.
  if (profile?.status === "revoked") {
    await supabase.auth.signOut();
    redirect("/login?error=removed");
  }

  if (profile?.status === "invited") {
    await admin
      .from("profiles")
      .update({
        status: "active",
        full_name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? null,
        avatar_url: user.user_metadata?.avatar_url ?? null,
      })
      .eq("id", user.id);
  }

  redirect("/calendar");
}

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Role } from "@/lib/auth/getSession";

const ALLOWED_DOMAIN = process.env.ALLOWED_EMAIL_DOMAIN ?? "cornell.edu";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=unknown`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user?.email) {
    return NextResponse.redirect(`${origin}/login?error=unknown`);
  }

  const { user } = data;
  const email = user.email!;

  // Google's `hd` param is only a soft UI hint on an External OAuth consent
  // screen — the real domain restriction has to be enforced here.
  if (!email.toLowerCase().endsWith(`@${ALLOWED_DOMAIN}`)) {
    await supabase.auth.signOut();
    return NextResponse.redirect(`${origin}/login?error=domain`);
  }

  const seedAdminEmail = process.env.SEED_ADMIN_EMAIL?.toLowerCase();
  const role: Role = email.toLowerCase() === seedAdminEmail ? "admin" : "view";

  // Service-role client: creating/reading another user's profile row on
  // first login is outside what the anon+session client's RLS allows.
  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("profiles")
    .select("id, status")
    .eq("id", user.id)
    .maybeSingle();

  if (!existing) {
    await admin.from("profiles").insert({
      id: user.id,
      email,
      full_name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? null,
      avatar_url: user.user_metadata?.avatar_url ?? null,
      role,
      status: "active",
    });
  } else if (existing.status === "invited") {
    // An admin-issued invite already created this row (with the role the
    // admin chose) ahead of the person's first sign-in — just mark it
    // active and fill in the profile fields Google now gives us. Don't
    // touch `role`, so the invite's grant survives.
    await admin
      .from("profiles")
      .update({
        status: "active",
        full_name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? null,
        avatar_url: user.user_metadata?.avatar_url ?? null,
      })
      .eq("id", user.id);
  }

  return NextResponse.redirect(`${origin}/calendar`);
}

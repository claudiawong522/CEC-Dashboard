import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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

  // Service-role client: creating/reading another user's profile row on
  // first login is outside what the anon+session client's RLS allows.
  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("profiles")
    .select("id, status")
    .eq("id", user.id)
    .maybeSingle();

  const seedAdminEmail = process.env.SEED_ADMIN_EMAIL?.toLowerCase();
  const isSeedAdmin = email.toLowerCase() === seedAdminEmail;

  // No self-serve signup: the only ways in are (1) an admin already invited
  // this email (a `profiles` row exists), or (2) this is the one bootstrap
  // admin identity configured out-of-band via SEED_ADMIN_EMAIL — every other
  // first-time Google sign-in gets turned away here, Cornell email or not.
  if (!existing && !isSeedAdmin) {
    await supabase.auth.signOut();
    return NextResponse.redirect(`${origin}/login?error=not_invited`);
  }

  if (!existing) {
    // Only reachable by the seed admin's very first sign-in.
    await admin.from("profiles").insert({
      id: user.id,
      email,
      full_name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? null,
      avatar_url: user.user_metadata?.avatar_url ?? null,
      role: "admin",
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

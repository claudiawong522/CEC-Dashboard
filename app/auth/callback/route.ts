import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    // Google itself turned them away, or the redirect arrived malformed.
    // Both land here looking identical, and "unknown" on the login screen is
    // all anyone ever saw — so say which it was, out loud, in the server log.
    console.error(
      "[auth/callback] no code in the redirect:",
      JSON.stringify({
        error: searchParams.get("error"),
        error_code: searchParams.get("error_code"),
        error_description: searchParams.get("error_description"),
      }),
    );
    return NextResponse.redirect(`${origin}/login?error=unknown`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user?.email) {
    // The failure this one usually hides is a stale sign-in secret: the app
    // stores a one-time value when the person clicks "Sign in with Google"
    // and checks it here, so an abandoned earlier attempt, a stale tab, or a
    // cleared cookie breaks the exchange — and it works on the next try,
    // which makes it maddening to chase without the real message.
    console.error(
      "[auth/callback] code exchange failed:",
      error ? `${error.name}: ${error.message} (status ${error.status})` : "no email on the returned user",
    );
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

  // No self-serve signup *into the club*: the only ways to become a member
  // are (1) an admin already invited this email (a `profiles` row exists), or
  // (2) this is the one bootstrap admin identity configured out-of-band via
  // SEED_ADMIN_EMAIL.
  //
  // A Cornell address with no invite is now let through as the student tier
  // rather than turned away — a prospective member who wants to ask someone
  // for a coffee chat. They are given a session and NO profiles row, which is
  // the entire definition of the tier: getSession() returns null for them, so
  // every members-only page and action already treats them as signed out, and
  // app_user_role() is null in the database, so RLS does too. All they can
  // reach is /apply. Any non-Cornell address with no invite is still
  // turned away exactly as before.
  if (!existing && !isSeedAdmin) {
    if (email.toLowerCase().endsWith("@cornell.edu")) {
      return NextResponse.redirect(`${origin}/apply`);
    }
    await supabase.auth.signOut();
    return NextResponse.redirect(`${origin}/login?error=not_invited`);
  }

  // An admin removed them. The row is still here (it has to be — other
  // tables reference it), so the "already invited" check above waves them
  // through; this is what actually turns them away. Distinct from
  // not_invited so the message can tell them it was revoked rather than
  // never granted.
  if (existing?.status === "revoked") {
    await supabase.auth.signOut();
    return NextResponse.redirect(`${origin}/login?error=removed`);
  }

  const googleName = user.user_metadata?.full_name ?? user.user_metadata?.name ?? null;
  const googleAvatar = user.user_metadata?.avatar_url ?? null;

  if (!existing) {
    // Only reachable by the seed admin's very first sign-in.
    await admin.from("profiles").insert({
      id: user.id,
      email,
      full_name: googleName,
      avatar_url: googleAvatar,
      role: "admin",
      status: "active",
    });
  } else {
    // Refresh the Google-sourced fields on every sign-in, not just on the
    // invited -> active flip. Someone who accepted by clicking the invite
    // email's own link has no Google metadata at that moment
    // (inviteUserByEmail creates a bare auth user with none), so their name
    // would otherwise read "—" forever, with no later sign-in able to fill
    // it in. Keeps names and photos current after that, too.
    //
    // `role` is deliberately untouched, so an invite's role grant survives.
    // Null values are skipped rather than written, so a sign-in that somehow
    // arrives without metadata can't blank out a name we already have.
    const patch = {
      ...(existing.status === "invited" ? { status: "active" } : {}),
      ...(googleName ? { full_name: googleName } : {}),
      ...(googleAvatar ? { avatar_url: googleAvatar } : {}),
    };
    if (Object.keys(patch).length > 0) {
      await admin.from("profiles").update(patch).eq("id", user.id);
    }
  }

  return NextResponse.redirect(`${origin}/calendar`);
}

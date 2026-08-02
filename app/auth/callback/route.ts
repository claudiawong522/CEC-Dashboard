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

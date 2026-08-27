import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type Role = "view" | "edit" | "admin";
export type ProfileStatus = "invited" | "active" | "revoked";

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: Role;
  status: ProfileStatus;
};

export type Session = {
  user: { id: string; email: string };
  profile: Profile;
};

/**
 * Wrapped in React's `cache()` so it runs at most once per request. The
 * layout calls it, the page calls it again, and a server action on that page
 * calls it a third time through requireRole() — without this they were three
 * separate auth checks and three separate `profiles` queries, stacked one
 * after another before anything rendered. Now the first caller pays and the
 * rest get the same promise back.
 */
export const getSession = cache(async function getSession(): Promise<Session | null> {
  const supabase = await createClient();

  // getClaims() reads the identity out of the access token and verifies its
  // signature locally against the project's ES256 JWKS, instead of asking
  // the Supabase Auth server who this is on every single page render. The
  // proxy has already refreshed the token by the time we get here.
  //
  // This is not a weaker check. A forged or tampered token fails signature
  // verification, and the "is this person still allowed in" question was
  // never the token's job anyway — it's the profiles.status check below.
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub ?? null;

  if (!userId) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, full_name, avatar_url, role, status")
    .eq("id", userId)
    .single();

  if (!profile) return null;

  // Only an active profile gets a session. This is the single choke point
  // that makes "remove access" real: a revoked member may still be holding a
  // perfectly valid Supabase cookie, but every page and every server action
  // reaches its role through here, so they get treated as signed out on the
  // very next request rather than at token expiry. An 'invited' row lands
  // here too — that's a person who hasn't signed in with Google yet, and
  // app/auth/callback/route.ts flips them to active when they do.
  if (profile.status !== "active") return null;

  return {
    // Email comes off the profile row rather than the token: `email` is an
    // optional JWT claim, while profiles.email is written from the auth
    // identity on first sign-in and is the same value. `sub` is the only
    // thing we need from the token, and that one is always there.
    user: { id: userId, email: (profile as Profile).email },
    profile: profile as Profile,
  };
});

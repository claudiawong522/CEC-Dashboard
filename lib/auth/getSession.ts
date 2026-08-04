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

export async function getSession(): Promise<Session | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, full_name, avatar_url, role, status")
    .eq("id", user.id)
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
    user: { id: user.id, email: user.email },
    profile: profile as Profile,
  };
}

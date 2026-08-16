import { createClient } from "@/lib/supabase/server";

// The student tier: a signed-in Cornell account with no profiles row.
//
// This is deliberately NOT a role. `getSession()` stays the members-only
// choke point and returns null here, so every existing page and server action
// treats a student as signed out — which is exactly right, because the only
// thing a student may reach is the matching flow. Adding a 'student' role
// instead would have quietly widened every role check in the app.
//
// The absence of a profiles row is the definition, and it is the same thing
// the database keys off: app_user_role() reads that row, so it returns null
// for precisely these callers.
export type Student = { id: string; email: string; name: string | null };

export async function getStudent(): Promise<Student | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) return null;
  if (!user.email.toLowerCase().endsWith("@cornell.edu")) return null;

  // A member is not a student. Checked against the row rather than a role
  // value so an invited-but-not-yet-active member doesn't fall through into
  // the student tier.
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle<{ id: string }>();

  if (profile) return null;

  return {
    id: user.id,
    email: user.email,
    name:
      (user.user_metadata?.full_name as string | undefined) ??
      (user.user_metadata?.name as string | undefined) ??
      null,
  };
}

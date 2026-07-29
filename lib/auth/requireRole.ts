import { getSession, type Role, type Session } from "@/lib/auth/getSession";

const RANK: Record<Role, number> = { view: 0, edit: 1, admin: 2 };

/**
 * Guards a Server Action / route handler. Throws if there's no session or
 * the caller's role is below `minRole`. This is the ergonomic layer — RLS
 * policies are the real backstop if a mutation is ever triggered outside
 * this helper.
 */
export async function requireRole(minRole: Role): Promise<Session> {
  const session = await getSession();
  if (!session) throw new Error("Not signed in");
  if (RANK[session.profile.role] < RANK[minRole]) {
    throw new Error(`Requires ${minRole} access`);
  }
  return session;
}

import type { Role } from "@/lib/auth/getSession";

// Shown on the trigger of every role picker. A separate module because
// lib/auth/getSession.ts reaches for next/headers, so a client component cannot
// import from it just to read three words.
export const ROLE_LABELS: Record<Role, string> = {
  view: "View",
  edit: "Edit",
  admin: "Admin",
};

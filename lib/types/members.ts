import type { Profile } from "@/lib/auth/getSession";
import type { Team } from "@/lib/validation/member-schemas";

// The directory half of a profile. `Profile` (lib/auth/getSession.ts) stays
// the small shape every page already gets from the session — id, email, role,
// status — and this extends it with the columns 0009 added. Kept separate so
// the session payload doesn't grow a bio and a hometown on every request.
export type MemberProfile = Profile & {
  netid: string | null;
  pronouns: string | null;
  major: string | null;
  minor: string | null;
  college: string | null;
  graduation_year: number | null;
  team: Team | null;
  position: string;
  hometown: string | null;
  about: string | null;
  linkedin_url: string | null;
  portfolio_url: string | null;
  active: boolean;
  interests: string[];
  open_to_chats: boolean;
  chat_blurb: string | null;
};

// The column list every members query selects. One constant so the directory,
// the detail page and the profile editor can't drift into asking for
// different fields and then disagreeing about which are present.
export const MEMBER_COLUMNS =
  "id, email, full_name, avatar_url, role, status, netid, pronouns, major, minor, " +
  "college, graduation_year, team, position, hometown, about, linkedin_url, " +
  "portfolio_url, active, interests, open_to_chats, chat_blurb";

export function memberInitials(member: Pick<MemberProfile, "full_name" | "email">): string {
  return (member.full_name ?? member.email)
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

// "Class of 2027" reads better than a bare year, and a missing year should
// produce nothing at all rather than "Class of null".
export function classLabel(graduationYear: number | null): string | null {
  return graduationYear ? `Class of ${graduationYear}` : null;
}

import type {
  ContactStatus,
  ContactType,
  InteractionKind,
  OrgType,
  Visibility,
} from "@/lib/validation/crm-schemas";

export type Organization = {
  id: string;
  name: string;
  domain: string | null;
  type: OrgType;
  notes: string | null;
};

export type Contact = {
  id: string;
  name: string;
  email: string | null;
  company: string | null;
  title: string | null;
  type: ContactType;
  status: ContactStatus;
  notes: string | null;
  assigned_to: string | null;
  organization_id: string | null;
  visibility: Visibility;
  source: string | null;
  linkedin_url: string | null;
  last_touched_at: string | null;
  next_follow_up_at: string | null;
  created_at: string;
};

export type ContactWithOrg = Contact & {
  organization: { id: string; name: string } | null;
  assignee: { id: string; full_name: string | null; email: string } | null;
};

export type Interaction = {
  id: string;
  contact_id: string;
  kind: InteractionKind;
  occurred_at: string;
  summary: string;
  body: string | null;
  created_at: string;
  member: { id: string; full_name: string | null; email: string } | null;
};

export const CONTACT_COLUMNS =
  "id, name, email, company, title, type, status, notes, assigned_to, organization_id, " +
  "visibility, source, linkedin_url, last_touched_at, next_follow_up_at, created_at, " +
  "organization:organizations(id, name), " +
  "assignee:profiles!outreach_contacts_assigned_to_fkey(id, full_name, email)";

export const INTERACTION_COLUMNS =
  "id, contact_id, kind, occurred_at, summary, body, created_at, " +
  "member:profiles!interactions_profile_id_fkey(id, full_name, email)";

// How long a live contact can sit untouched before it needs chasing. Only
// applies to contacts still in play: a declined one is finished, and an
// identified one has not been contacted yet, so there is nothing to be late on.
const STALE_AFTER_DAYS = 14;

const IN_PLAY: ContactStatus[] = ["contacted", "responded", "confirmed"];

export function isStale(contact: Contact, now: Date = new Date()): boolean {
  if (!IN_PLAY.includes(contact.status)) return false;
  if (!contact.last_touched_at) return true;
  const days = (now.getTime() - new Date(contact.last_touched_at).getTime()) / 86_400_000;
  return days >= STALE_AFTER_DAYS;
}

export function isFollowUpDue(contact: Contact, now: Date = new Date()): boolean {
  if (!contact.next_follow_up_at) return false;
  return new Date(contact.next_follow_up_at).getTime() <= now.getTime();
}

// Contacts needing attention first, then everything else newest-first. The
// CRM's only real question is "who am I supposed to be chasing", so the list
// answers it by ordering rather than by making someone apply a filter.
export function sortContacts(contacts: ContactWithOrg[], now: Date = new Date()): ContactWithOrg[] {
  function rank(contact: ContactWithOrg): number {
    if (isFollowUpDue(contact, now)) return 0;
    if (isStale(contact, now)) return 1;
    if (contact.status === "declined") return 3;
    return 2;
  }
  return contacts.slice().sort((a, b) => {
    const byRank = rank(a) - rank(b);
    if (byRank !== 0) return byRank;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

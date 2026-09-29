import { z } from "zod";

export const CONTACT_TYPES = ["speaker", "recruitment"] as const;
export type ContactType = (typeof CONTACT_TYPES)[number];

export const CONTACT_STATUSES = [
  "identified",
  "contacted",
  "responded",
  "confirmed",
  "scheduled",
  "declined",
] as const;
export type ContactStatus = (typeof CONTACT_STATUSES)[number];

export const CONTACT_STATUS_LABELS: Record<ContactStatus, string> = {
  identified: "Identified",
  contacted: "Contacted",
  responded: "Responded",
  confirmed: "Confirmed",
  scheduled: "Scheduled",
  declined: "Declined",
};

export const ORG_TYPES = ["company", "vc", "university", "nonprofit", "other"] as const;
export type OrgType = (typeof ORG_TYPES)[number];

export const ORG_TYPE_LABELS: Record<OrgType, string> = {
  company: "Company",
  vc: "VC",
  university: "University",
  nonprofit: "Nonprofit",
  other: "Other",
};

export const INTERACTION_KINDS = ["email", "meeting", "call", "event", "note"] as const;
export type InteractionKind = (typeof INTERACTION_KINDS)[number];

export const INTERACTION_KIND_LABELS: Record<InteractionKind, string> = {
  email: "Email",
  meeting: "Meeting",
  call: "Call",
  event: "Event",
  note: "Note",
};

export const VISIBILITIES = ["exec", "club"] as const;
export type Visibility = (typeof VISIBILITIES)[number];

const optionalText = z
  .string()
  .trim()
  .transform((value) => (value === "" ? null : value))
  .nullable();

const optionalEmail = z
  .string()
  .trim()
  .toLowerCase()
  .transform((value) => (value === "" ? null : value))
  .nullable()
  .refine(
    (value) => value === null || z.string().email().safeParse(value).success,
    "Enter a valid email",
  );

export const contactSchema = z.object({
  name: z.string().trim().min(1, "Required"),
  email: optionalEmail,
  company: optionalText,
  title: optionalText,
  type: z.enum(CONTACT_TYPES),
  status: z.enum(CONTACT_STATUSES),
  notes: optionalText,
  assignedTo: z.string().uuid().nullable(),
  organizationId: z.string().uuid().nullable(),
  visibility: z.enum(VISIBILITIES),
  source: optionalText,
  linkedinUrl: optionalText,
  // A date input hands back "" when cleared and YYYY-MM-DD otherwise.
  nextFollowUpAt: optionalText,
});
export type ContactInput = z.input<typeof contactSchema>;

export const interactionSchema = z.object({
  contactId: z.string().uuid(),
  kind: z.enum(INTERACTION_KINDS),
  occurredAt: z.string().min(1, "When did this happen?"),
  summary: z.string().trim().min(1, "Say what happened").max(200, "Keep the summary to one line"),
  body: optionalText,
});
export type InteractionInput = z.input<typeof interactionSchema>;

export const organizationSchema = z.object({
  name: z.string().trim().min(1, "Required"),
  // The dedupe key. Stored bare (stripe.com), so a pasted URL or an address
  // both land on the same organization.
  domain: z
    .string()
    .trim()
    .toLowerCase()
    .transform((value) => {
      if (value === "") return null;
      return value
        .replace(/^https?:\/\//, "")
        .replace(/^www\./, "")
        .replace(/\/.*$/, "")
        .replace(/^.*@/, "");
    })
    .nullable(),
  type: z.enum(ORG_TYPES),
  notes: optionalText,
});
export type OrganizationInput = z.input<typeof organizationSchema>;

// The domain half of an email, used to suggest an organization when a contact
// is created. Free providers are excluded: a gmail.com address says nothing
// about where someone works, and grouping every personal address into one
// "Gmail" organization would be worse than leaving it blank.
const FREE_EMAIL_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "outlook.com",
  "hotmail.com",
  "yahoo.com",
  "icloud.com",
  "me.com",
  "proton.me",
  "protonmail.com",
  "aol.com",
]);

export function organizationDomainFromEmail(email: string | null): string | null {
  if (!email) return null;
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain || FREE_EMAIL_DOMAINS.has(domain)) return null;
  return domain;
}

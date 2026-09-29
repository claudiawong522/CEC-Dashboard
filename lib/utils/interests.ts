// The one vocabulary both sides of a coffee chat match pick from.
//
// Members' profiles.interests has always been free text, which is why matching
// on it never worked: "Hardware" and "hardware startups" are the same interest
// and never compare equal. A prospective member and a club member now choose
// from this list, so an overlap means something.
//
// It lives in code rather than an admin table on purpose. It changes about once
// a semester, and a table plus a screen to manage it is not worth that. Adding
// one is a one-line edit and a deploy.
export const INTEREST_TAGS = [
  "ai",
  "biotech",
  "climate",
  "consumer",
  "consulting",
  "crypto",
  "design",
  "fintech",
  "fundraising",
  "gaming",
  "hardware",
  "healthcare",
  "marketing",
  "nonprofits",
  "operations",
  "product",
  "robotics",
  "sales",
  "software",
  "sustainability",
] as const;

export type InterestTag = (typeof INTEREST_TAGS)[number];

const TAG_SET = new Set<string>(INTEREST_TAGS);

export function isInterestTag(value: string): value is InterestTag {
  return TAG_SET.has(value);
}

// Free-text interests predate this list and are kept on profiles, so a member's
// stored array can hold anything. Scoring only ever considers the values that
// are actually in the vocabulary.
export function onlyKnownTags(values: readonly string[] | null | undefined): InterestTag[] {
  if (!values) return [];
  const seen = new Set<string>();
  const out: InterestTag[] = [];
  for (const raw of values) {
    const tag = raw.trim().toLowerCase();
    if (isInterestTag(tag) && !seen.has(tag)) {
      seen.add(tag);
      out.push(tag);
    }
  }
  return out;
}

// "hardware" -> "Hardware". The list is stored lowercase so comparison is
// trivial; this is only for display.
export function labelForTag(tag: string): string {
  if (tag === "ai") return "AI";
  return tag.charAt(0).toUpperCase() + tag.slice(1);
}

// Fixed per design/BRAND_KIT.md: "Section colours are fixed: Venue/Attendees/
// Media teal, Speaker/Marketing coral, Money/Recurring blue, Food/Notes amber."
export const SECTION_COLORS = {
  Venue: "var(--teal)",
  Speaker: "var(--coral)",
  Attendees: "var(--teal)",
  Money: "var(--blue)",
  Food: "var(--amber)",
  Marketing: "var(--coral)",
  Media: "var(--teal)",
  Recurring: "var(--blue)",
  Notes: "var(--amber)",
} as const;

export type SectionLabel = keyof typeof SECTION_COLORS;

// "First prep section" for an event, used to colour its calendar chip/bead:
// the first optional section enabled, in the same priority order as the
// event-details tab order (components/events/DetailsForm.tsx). Venue is
// unconditional on every event, so it's the fallback rather than the default —
// otherwise every event would always read as Venue/teal.
export function firstPrepSection(event: {
  has_speaker?: boolean;
  has_attendees?: boolean;
  has_money?: boolean;
  has_food?: boolean;
  has_marketing?: boolean;
  has_media?: boolean;
  has_recurring?: boolean;
}): SectionLabel {
  if (event.has_speaker) return "Speaker";
  if (event.has_attendees) return "Attendees";
  if (event.has_money) return "Money";
  if (event.has_food) return "Food";
  if (event.has_marketing) return "Marketing";
  if (event.has_media) return "Media";
  if (event.has_recurring) return "Recurring";
  return "Venue";
}

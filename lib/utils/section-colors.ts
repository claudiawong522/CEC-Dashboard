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

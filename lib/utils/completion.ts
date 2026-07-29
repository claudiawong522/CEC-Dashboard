export type CompletionInput = {
  venue_done: boolean;
  has_speaker: boolean;
  speaker_done: boolean;
  has_attendees: boolean;
  attendees_done: boolean;
  has_money: boolean;
  money_done: boolean;
  has_food: boolean;
  food_done: boolean;
  has_marketing: boolean;
  marketing_done: boolean;
  has_media: boolean;
  media_done: boolean;
  has_recurring: boolean;
  recurring_done: boolean;
};

const SECTION_LABELS: [keyof CompletionInput, keyof CompletionInput, string][] = [
  ["has_speaker", "speaker_done", "Speaker"],
  ["has_attendees", "attendees_done", "Attendees"],
  ["has_money", "money_done", "Money"],
  ["has_food", "food_done", "Food"],
  ["has_marketing", "marketing_done", "Marketing"],
  ["has_media", "media_done", "Media"],
  ["has_recurring", "recurring_done", "Recurring"],
];

/**
 * Mirrors the recalc_event_completion() Postgres trigger — kept as a pure
 * function here so the Todo tab can list *which* sections are still
 * outstanding, not just whether the event is done overall.
 */
export function incompleteSections(event: CompletionInput): string[] {
  const missing: string[] = [];
  if (!event.venue_done) missing.push("Venue");

  for (const [hasKey, doneKey, label] of SECTION_LABELS) {
    if (event[hasKey] && !event[doneKey]) missing.push(label);
  }

  return missing;
}

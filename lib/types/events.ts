export type EventRow = {
  id: string;
  name: string;
  event_date: string;
  event_time: string;
  event_end_time: string | null;
  venue: string;
  venue_done: boolean;
  notes: string | null;
  has_speaker: boolean;
  has_attendees: boolean;
  has_money: boolean;
  has_food: boolean;
  has_marketing: boolean;
  has_media: boolean;
  media_done: boolean;
  has_recurring: boolean;
  recurring_series_id: string | null;
  is_recurring_parent: boolean;
  is_complete: boolean;
};

export type SpeakerRow = {
  event_id: string;
  description: string | null;
  done: boolean;
  portrait_file_id: string | null;
};

export type AttendeesRow = {
  event_id: string;
  luma_url: string | null;
  headcount_notes: string | null;
  done: boolean;
};

export type MoneyRow = {
  event_id: string;
  budgeted_amount: number | null;
  actual_amount: number | null;
  notes: string | null;
  done: boolean;
};

export type FoodRow = {
  event_id: string;
  usual_options: string | null;
  halal_enabled: boolean;
  halal_options: string | null;
  done: boolean;
};

export type MarketingRow = {
  event_id: string;
  instagram_post: boolean;
  eship_listserve: boolean;
  story_shoutout_1: boolean;
  story_shoutout_2: boolean;
  story_shoutout_3: boolean;
  posters: boolean;
  reel: boolean;
  done: boolean;
};

export type MarketingCustomItemRow = {
  id: string;
  event_id: string;
  label: string;
  done: boolean;
};

export type RecurringSeriesRow = {
  id: string;
  frequency: "weekly" | "biweekly" | "monthly";
  end_date: string;
};

export type EventFileRow = {
  id: string;
  event_id: string;
  section: string;
  bucket: string;
  storage_path: string;
  file_name: string | null;
  mime_type: string | null;
};

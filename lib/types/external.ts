import type { StageValue } from "@/lib/validation/external-schemas";

export type IdeaRow = {
  id: string;
  pitch: string;
  stage: StageValue;
  prev_stage: StageValue | null;
  target_date: string | null;
  target_time: string | null;
  notes: string | null;
  converted_event_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type IdeaPersonRow = {
  id: string;
  idea_id: string;
  name: string;
  email: string | null;
};

export type IdeaOwnerRow = {
  idea_id: string;
  profile_id: string;
};

export type IdeaWithRelations = IdeaRow & {
  external_idea_people: { id: string; name: string; email: string | null }[];
  external_idea_owners: { profile_id: string }[];
};

export type AdminInfo = { full_name: string | null; email: string };


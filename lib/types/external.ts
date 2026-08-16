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

// A person on a pitch, as the UI wants them: a name and an email sitting on
// the row. Since 0016 those two live on the CRM contact the row points at
// rather than on the row itself, so this is the flattened shape and
// `flattenPeople` is what produces it. Keeping the flat shape means the
// detail screen's inline editing didn't have to change at all.
export type IdeaPersonRow = {
  id: string;
  idea_id: string;
  contact_id: string;
  name: string;
  email: string | null;
};

// What the join actually returns. Supabase gives a to-one embed as an object,
// and it can be null if the contact was deleted out from under the row.
export type IdeaPersonJoin = {
  id: string;
  idea_id: string;
  contact_id: string;
  contact: { name: string; email: string | null } | null;
};

export function flattenPeople(rows: IdeaPersonJoin[] | null): IdeaPersonRow[] {
  return (rows ?? []).map((row) => ({
    id: row.id,
    idea_id: row.idea_id,
    contact_id: row.contact_id,
    name: row.contact?.name ?? "",
    email: row.contact?.email ?? null,
  }));
}

export type IdeaOwnerRow = {
  idea_id: string;
  profile_id: string;
};

export type IdeaWithRelations = IdeaRow & {
  external_idea_people: IdeaPersonJoin[];
  external_idea_owners: { profile_id: string }[];
};

export type AdminInfo = { full_name: string | null; email: string };

// The embed the list and detail pages both select, kept in one place so the
// two can't drift into asking for different columns.
export const PERSON_EMBED = "id, idea_id, contact_id, contact:outreach_contacts(name, email)";

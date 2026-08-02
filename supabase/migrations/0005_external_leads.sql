-- External — speaker outreach pipeline, tracked separately from events
-- until a lead is actually converted. Admin-only end to end: unlike every
-- other table here, even select is restricted, since idea_people carries
-- outside contacts' emails that never opted into being visible to the
-- whole club the way event logistics are.

create table external_ideas (
  id uuid primary key default gen_random_uuid(),
  pitch text not null,
  stage text not null default 'idea' check (stage in
    ('idea', 'reached_out', 'responded', 'agreed', 'date_set', 'declined', 'converted')),
  -- stage the lead was in right before being declined, so "Reactivate"
  -- can restore it instead of dropping back to the start every time.
  prev_stage text check (prev_stage in
    ('idea', 'reached_out', 'responded', 'agreed', 'date_set')),
  target_date date,
  target_time time,
  notes text,
  converted_event_id uuid references events(id) on delete set null,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index external_ideas_stage_idx on external_ideas (stage);

create or replace function trg_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger external_ideas_touch_updated_at
  before update on external_ideas
  for each row execute function trg_touch_updated_at();

-- ---------------------------------------------------------------------------
-- external_idea_people — a pitch can name more than one person (a panel
-- idea), each tracked with their own contact info under the same card.
-- ---------------------------------------------------------------------------
create table external_idea_people (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid not null references external_ideas(id) on delete cascade,
  name text not null,
  email text,
  created_at timestamptz not null default now()
);

create index external_idea_people_idea_idx on external_idea_people (idea_id);

-- ---------------------------------------------------------------------------
-- external_idea_owners — many-to-many: more than one admin can be tagged
-- as following up on the same lead.
-- ---------------------------------------------------------------------------
create table external_idea_owners (
  idea_id uuid not null references external_ideas(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  primary key (idea_id, profile_id)
);

alter table external_ideas enable row level security;
alter table external_idea_people enable row level security;
alter table external_idea_owners enable row level security;

create policy "external_ideas_admin_only"
  on external_ideas for all to authenticated
  using (app_user_role() = 'admin') with check (app_user_role() = 'admin');

create policy "external_idea_people_admin_only"
  on external_idea_people for all to authenticated
  using (app_user_role() = 'admin') with check (app_user_role() = 'admin');

create policy "external_idea_owners_admin_only"
  on external_idea_owners for all to authenticated
  using (app_user_role() = 'admin') with check (app_user_role() = 'admin');

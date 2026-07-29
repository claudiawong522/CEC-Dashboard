-- CEC Dashboard — initial schema
create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text,
  avatar_url text,
  role text not null default 'view' check (role in ('view', 'edit', 'admin')),
  created_at timestamptz not null default now()
);

create index profiles_email_idx on profiles (email);

-- Reads the caller's role. security definer so it can read profiles even
-- when the caller's own RLS-visible rows are limited; stable so the planner
-- can reuse the result within a single statement.
create or replace function app_user_role()
returns text
language sql
security definer
stable
as $$
  select role from profiles where id = auth.uid()
$$;

alter table profiles enable row level security;

create policy "profiles_select_authenticated"
  on profiles for select to authenticated using (true);

create policy "profiles_update_role_by_admin"
  on profiles for update to authenticated
  using (app_user_role() = 'admin')
  with check (app_user_role() = 'admin');

-- ---------------------------------------------------------------------------
-- recurring_series
-- ---------------------------------------------------------------------------
create table recurring_series (
  id uuid primary key default gen_random_uuid(),
  frequency text not null check (frequency in ('weekly', 'biweekly', 'monthly')),
  end_date date not null,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

alter table recurring_series enable row level security;

create policy "recurring_series_select_authenticated"
  on recurring_series for select to authenticated using (true);

create policy "recurring_series_write_edit_or_admin"
  on recurring_series for all to authenticated
  using (app_user_role() in ('edit', 'admin'))
  with check (app_user_role() in ('edit', 'admin'));

-- ---------------------------------------------------------------------------
-- events
-- ---------------------------------------------------------------------------
create table events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  event_date date not null,
  event_time time not null,
  venue text not null,
  venue_done boolean not null default false,
  notes text,
  has_speaker boolean not null default false,
  has_attendees boolean not null default false,
  has_money boolean not null default false,
  has_food boolean not null default false,
  has_marketing boolean not null default false,
  has_media boolean not null default false,
  media_done boolean not null default false,
  has_recurring boolean not null default false,
  recurring_series_id uuid references recurring_series(id) on delete set null,
  is_recurring_parent boolean not null default false,
  is_complete boolean not null default false,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index events_date_idx on events (event_date, event_time);
create index events_is_complete_idx on events (is_complete);
create index events_series_idx on events (recurring_series_id);

alter table events enable row level security;

create policy "events_select_authenticated"
  on events for select to authenticated using (true);

create policy "events_write_edit_or_admin"
  on events for all to authenticated
  using (app_user_role() in ('edit', 'admin'))
  with check (app_user_role() in ('edit', 'admin'));

-- ---------------------------------------------------------------------------
-- event_files (polymorphic evidence / portraits / receipts / media store)
-- ---------------------------------------------------------------------------
create table event_files (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  section text not null check (section in
    ('venue', 'speaker', 'speaker_portrait', 'attendees', 'money', 'food',
     'marketing', 'media', 'recurring')),
  bucket text not null,
  storage_path text not null,
  file_name text,
  mime_type text,
  file_size bigint,
  uploaded_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create index event_files_event_section_idx on event_files (event_id, section);
create index event_files_media_idx on event_files (section, created_at desc)
  where section = 'media';

alter table event_files enable row level security;

create policy "event_files_select_authenticated"
  on event_files for select to authenticated using (true);

create policy "event_files_write_edit_or_admin"
  on event_files for all to authenticated
  using (app_user_role() in ('edit', 'admin'))
  with check (app_user_role() in ('edit', 'admin'));

-- ---------------------------------------------------------------------------
-- per-section child tables (one row per event, created alongside the event
-- for every section toggled on in Step 1)
-- ---------------------------------------------------------------------------
create table event_speaker (
  event_id uuid primary key references events(id) on delete cascade,
  description text,
  done boolean not null default false,
  portrait_file_id uuid references event_files(id) on delete set null
);

create table event_attendees (
  event_id uuid primary key references events(id) on delete cascade,
  luma_url text,
  headcount_notes text,
  done boolean not null default false
);

create table event_money (
  event_id uuid primary key references events(id) on delete cascade,
  budgeted_amount numeric(10, 2),
  actual_amount numeric(10, 2),
  notes text,
  done boolean not null default false
);

create table event_food (
  event_id uuid primary key references events(id) on delete cascade,
  usual_options text,
  halal_enabled boolean not null default false,
  halal_options text,
  done boolean not null default false
);

create table event_marketing (
  event_id uuid primary key references events(id) on delete cascade,
  instagram_post boolean not null default false,
  eship_listserve boolean not null default false,
  story_shoutout_1 boolean not null default false,
  story_shoutout_2 boolean not null default false,
  story_shoutout_3 boolean not null default false,
  posters boolean not null default false,
  reel boolean not null default false,
  done boolean not null default false
);

create table event_recurring (
  event_id uuid primary key references events(id) on delete cascade,
  done boolean not null default false
);

alter table event_speaker enable row level security;
alter table event_attendees enable row level security;
alter table event_money enable row level security;
alter table event_food enable row level security;
alter table event_marketing enable row level security;
alter table event_recurring enable row level security;

create policy "event_speaker_select_authenticated" on event_speaker for select to authenticated using (true);
create policy "event_speaker_write_edit_or_admin" on event_speaker for all to authenticated
  using (app_user_role() in ('edit', 'admin')) with check (app_user_role() in ('edit', 'admin'));

create policy "event_attendees_select_authenticated" on event_attendees for select to authenticated using (true);
create policy "event_attendees_write_edit_or_admin" on event_attendees for all to authenticated
  using (app_user_role() in ('edit', 'admin')) with check (app_user_role() in ('edit', 'admin'));

create policy "event_money_select_authenticated" on event_money for select to authenticated using (true);
create policy "event_money_write_edit_or_admin" on event_money for all to authenticated
  using (app_user_role() in ('edit', 'admin')) with check (app_user_role() in ('edit', 'admin'));

create policy "event_food_select_authenticated" on event_food for select to authenticated using (true);
create policy "event_food_write_edit_or_admin" on event_food for all to authenticated
  using (app_user_role() in ('edit', 'admin')) with check (app_user_role() in ('edit', 'admin'));

create policy "event_marketing_select_authenticated" on event_marketing for select to authenticated using (true);
create policy "event_marketing_write_edit_or_admin" on event_marketing for all to authenticated
  using (app_user_role() in ('edit', 'admin')) with check (app_user_role() in ('edit', 'admin'));

create policy "event_recurring_select_authenticated" on event_recurring for select to authenticated using (true);
create policy "event_recurring_write_edit_or_admin" on event_recurring for all to authenticated
  using (app_user_role() in ('edit', 'admin')) with check (app_user_role() in ('edit', 'admin'));

-- ---------------------------------------------------------------------------
-- shared Notion-style notes doc — single fixed-id row
-- ---------------------------------------------------------------------------
create table notes_doc (
  id uuid primary key default '00000000-0000-0000-0000-000000000001',
  content jsonb not null default '[]',
  updated_by uuid references profiles(id),
  updated_at timestamptz not null default now()
);

insert into notes_doc (id) values ('00000000-0000-0000-0000-000000000001');

alter table notes_doc enable row level security;

create policy "notes_doc_select_authenticated" on notes_doc for select to authenticated using (true);
create policy "notes_doc_write_edit_or_admin" on notes_doc for all to authenticated
  using (app_user_role() in ('edit', 'admin')) with check (app_user_role() in ('edit', 'admin'));

-- ---------------------------------------------------------------------------
-- completion tracking
--
-- events.is_complete is denormalized and trigger-maintained so the Todo and
-- Past Events pages can filter on a single flat boolean column instead of
-- joining across up to seven child tables on every page load.
-- ---------------------------------------------------------------------------
create or replace function recalc_event_completion(p_event_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  v_complete boolean;
begin
  select
    e.venue_done
    and (not e.has_speaker or coalesce((select done from event_speaker where event_id = p_event_id), false))
    and (not e.has_attendees or coalesce((select done from event_attendees where event_id = p_event_id), false))
    and (not e.has_money or coalesce((select done from event_money where event_id = p_event_id), false))
    and (not e.has_food or coalesce((select done from event_food where event_id = p_event_id), false))
    and (not e.has_marketing or coalesce((select done from event_marketing where event_id = p_event_id), false))
    and (not e.has_media or e.media_done)
    and (not e.has_recurring or coalesce((select done from event_recurring where event_id = p_event_id), false))
  into v_complete
  from events e
  where e.id = p_event_id;

  update events
  set is_complete = coalesce(v_complete, false), updated_at = now()
  where id = p_event_id;
end;
$$;

-- Only ever attached to INSERT/UPDATE (never DELETE), so NEW is always
-- assigned — referencing OLD here would error on INSERT since OLD is
-- unassigned for that operation.
create or replace function trg_recalc_event_completion_child()
returns trigger
language plpgsql
security definer
as $$
begin
  perform recalc_event_completion(new.event_id);
  return new;
end;
$$;

create trigger event_speaker_recalc
  after insert or update of done on event_speaker
  for each row execute function trg_recalc_event_completion_child();

create trigger event_attendees_recalc
  after insert or update of done on event_attendees
  for each row execute function trg_recalc_event_completion_child();

create trigger event_money_recalc
  after insert or update of done on event_money
  for each row execute function trg_recalc_event_completion_child();

create trigger event_food_recalc
  after insert or update of done on event_food
  for each row execute function trg_recalc_event_completion_child();

create trigger event_marketing_recalc
  after insert or update of done on event_marketing
  for each row execute function trg_recalc_event_completion_child();

create trigger event_recurring_recalc
  after insert or update of done on event_recurring
  for each row execute function trg_recalc_event_completion_child();

create or replace function trg_recalc_event_completion_self()
returns trigger
language plpgsql
security definer
as $$
begin
  perform recalc_event_completion(new.id);
  return new;
end;
$$;

-- Fires when venue/media done-state changes or when a section is toggled
-- on/off for an existing event; does NOT fire on the inner UPDATE that
-- recalc_event_completion() itself issues (that only touches is_complete /
-- updated_at), so this cannot recurse.
create trigger events_recalc
  after insert or update of
    venue_done, media_done,
    has_speaker, has_attendees, has_money, has_food, has_marketing, has_media, has_recurring
  on events
  for each row execute function trg_recalc_event_completion_self();

-- ---------------------------------------------------------------------------
-- storage buckets
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values
  ('evidence', 'evidence', true),
  ('portraits', 'portraits', true),
  ('receipts', 'receipts', true),
  ('media', 'media', true)
on conflict (id) do nothing;

create policy "storage_write_edit_or_admin"
  on storage.objects for insert to authenticated
  with check (
    bucket_id in ('evidence', 'portraits', 'receipts', 'media')
    and app_user_role() in ('edit', 'admin')
  );

create policy "storage_delete_edit_or_admin"
  on storage.objects for delete to authenticated
  using (
    bucket_id in ('evidence', 'portraits', 'receipts', 'media')
    and app_user_role() in ('edit', 'admin')
  );

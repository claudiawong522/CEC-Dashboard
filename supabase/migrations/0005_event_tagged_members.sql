-- Tag members into an event — an internal staff/participant list distinct
-- from event_attendees (which is the public Luma RSVP link + headcount
-- notes). Surfaces as chips on the event's own "Members" tab and, read-only,
-- on that event's photos. No invite/notification plumbing yet — see
-- FUTURE.md for the deferred Google Calendar invite feature this sets up.
create table event_tagged_members (
  event_id uuid not null references events(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  tagged_by uuid references profiles(id),
  tagged_at timestamptz not null default now(),
  primary key (event_id, profile_id)
);

create index event_tagged_members_profile_idx on event_tagged_members (profile_id);

alter table event_tagged_members enable row level security;

create policy "event_tagged_members_select_authenticated"
  on event_tagged_members for select to authenticated using (true);

create policy "event_tagged_members_write_edit_or_admin"
  on event_tagged_members for all to authenticated
  using (app_user_role() in ('edit', 'admin'))
  with check (app_user_role() in ('edit', 'admin'));

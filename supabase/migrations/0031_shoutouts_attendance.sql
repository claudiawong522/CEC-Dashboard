-- Shoutouts and attendance.
--
-- Both are thin tables that only become useful once profiles is a real
-- directory (0008), and both are scoped by `semester` rather than by date
-- range: the club thinks in semesters, and "this semester's board" is a
-- string equality instead of two date comparisons that have to agree with
-- whatever the academic calendar did that year.

-- ---------------------------------------------------------------------------
-- shoutouts
-- ---------------------------------------------------------------------------
create table shoutouts (
  id uuid primary key default gen_random_uuid(),
  giver_id uuid not null references profiles(id),
  -- A shoutout can name someone who has no profile yet (a guest speaker, a
  -- friend who came to help at a build night), so the receiver is either a
  -- member row or a plain name, and exactly one of the two.
  receiver_id uuid references profiles(id),
  receiver_name text,
  message text not null,
  is_anonymous boolean not null default false,
  -- Admin moderation. Hidden rather than deleted so the same message can't
  -- simply be reposted, and so removing one is reversible.
  hidden boolean not null default false,
  semester text not null,
  created_at timestamptz not null default now(),
  constraint shoutouts_receiver_present
    check (num_nonnulls(receiver_id, receiver_name) = 1)
);

create index shoutouts_semester_idx on shoutouts (semester, created_at desc);
create index shoutouts_receiver_idx on shoutouts (receiver_id);

alter table shoutouts enable row level security;

-- Everyone reads the wall; hidden ones are filtered in the query rather than
-- by policy so admins can still see and unhide them.
create policy "shoutouts_select_authenticated"
  on shoutouts for select to authenticated using (true);

-- Anyone who can edit may give a shoutout, but only as themselves — writing
-- one under someone else's name is the whole thing worth preventing here.
create policy "shoutouts_insert_self"
  on shoutouts for insert to authenticated
  with check (app_user_role() in ('edit', 'admin') and giver_id = auth.uid());

create policy "shoutouts_update_by_admin"
  on shoutouts for update to authenticated
  using (app_user_role() = 'admin') with check (app_user_role() = 'admin');

create policy "shoutouts_delete_by_admin"
  on shoutouts for delete to authenticated
  using (app_user_role() = 'admin');

-- ---------------------------------------------------------------------------
-- attendance
-- ---------------------------------------------------------------------------
-- `event_id` points at a real event when one exists, and stays null for the
-- things the events table never held — a team meeting, an ad-hoc work session.
-- `event_name` is therefore always populated: it is what a report reads, and
-- it survives the event row being deleted.
create table attendance (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id),
  event_id uuid references events(id) on delete set null,
  event_type text not null default 'other' check (event_type in
    ('startup_hours', 'team_meeting', 'build_night', 'social', 'other')),
  event_name text not null,
  semester text not null,
  attended_at timestamptz not null default now(),
  recorded_by uuid not null references profiles(id)
);

-- Stops a second tap on the same name double-recording someone. Postgres
-- treats nulls as distinct in a unique index, so this constrains only
-- attendance tied to a real event; the null-event rows are deduped in the
-- action layer against (profile_id, event_name, semester), which is a
-- judgement call rather than a hard rule (someone genuinely can attend two
-- separate build nights).
create unique index attendance_member_event_idx
  on attendance (profile_id, event_id) where event_id is not null;

create index attendance_semester_idx on attendance (semester, attended_at desc);
create index attendance_profile_idx on attendance (profile_id);

alter table attendance enable row level security;

create policy "attendance_select_authenticated"
  on attendance for select to authenticated using (true);

create policy "attendance_write_edit_or_admin"
  on attendance for all to authenticated
  using (app_user_role() in ('edit', 'admin'))
  with check (app_user_role() in ('edit', 'admin'));

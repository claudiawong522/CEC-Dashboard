-- Coffee-chat matching for students, and the ask-bar audit log.
--
-- The student tier is the reason this migration is more careful than the rest.
-- A prospective member is *not* a club member: they have a valid Cornell
-- Google session and no `profiles` row at all. That absence is the whole
-- definition — there is no 'student' role, because adding one would mean
-- every existing role check silently starts including them.
--
-- app_user_role() returns null for such a caller, since it reads a profiles
-- row that isn't there. Every policy below leans on that: `app_user_role() is
-- null` means "signed in, not a member", and it is checked together with the
-- email on their own JWT so one student can't act as another.

create table chat_requests (
  id uuid primary key default gen_random_uuid(),
  student_email text not null,
  student_name text not null,
  tags text[] not null default '{}',
  prompt text not null,
  profile_id uuid not null references profiles(id) on delete cascade,
  status text not null default 'pending' check (status in
    ('pending', 'accepted', 'completed', 'declined')),
  created_at timestamptz not null default now(),
  responded_at timestamptz
);

create index chat_requests_member_status_idx on chat_requests (profile_id, status);
create index chat_requests_student_idx on chat_requests (lower(student_email));

-- Caps live in the action layer, not here: "at most 3 open requests per
-- student" and "at most 5 pending per member" are product rules that need to
-- return a readable message, and a check constraint can only abort.

alter table chat_requests enable row level security;

-- A student sees only the requests they themselves sent.
create policy "chat_requests_select_own_student"
  on chat_requests for select to authenticated
  using (
    app_user_role() is null
    and lower(student_email) = lower(auth.jwt() ->> 'email')
  );

-- A member sees requests addressed to them; admins see all, to unstick a
-- member who has gone quiet.
create policy "chat_requests_select_member_or_admin"
  on chat_requests for select to authenticated
  using (profile_id = auth.uid() or app_user_role() = 'admin');

-- Only a non-member may create one, and only in their own name. Members don't
-- request chats through this table — they have the bingo board.
create policy "chat_requests_insert_student"
  on chat_requests for insert to authenticated
  with check (
    app_user_role() is null
    and lower(student_email) = lower(auth.jwt() ->> 'email')
  );

-- Responding is the member's own call. The student cannot move their own
-- request along, which is what keeps 'accepted' meaningful.
create policy "chat_requests_update_member_or_admin"
  on chat_requests for update to authenticated
  using (profile_id = auth.uid() or app_user_role() = 'admin')
  with check (profile_id = auth.uid() or app_user_role() = 'admin');

-- ---------------------------------------------------------------------------
-- ask_logs
-- ---------------------------------------------------------------------------
-- Every ask is recorded: who asked, which tools ran, and which records came
-- back. This is the audit trail, and the first place to look when retrieval
-- returns something surprising or nothing at all.
create table ask_logs (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  question text not null,
  tools_used text[] not null default '{}',
  record_ids text[] not null default '{}',
  answered boolean not null default true,
  created_at timestamptz not null default now()
);

create index ask_logs_member_created_idx on ask_logs (profile_id, created_at desc);
-- Partial index over the failures, which is the query anyone actually runs
-- against this table.
create index ask_logs_unanswered_idx on ask_logs (created_at desc) where not answered;

alter table ask_logs enable row level security;

-- Your own history, or everything if you're an admin. A member's questions
-- are readable by admins on purpose: the log exists to diagnose retrieval,
-- and that's not possible over a filtered view of it.
create policy "ask_logs_select_own_or_admin"
  on ask_logs for select to authenticated
  using (profile_id = auth.uid() or app_user_role() = 'admin');

create policy "ask_logs_insert_self"
  on ask_logs for insert to authenticated
  with check (profile_id = auth.uid());

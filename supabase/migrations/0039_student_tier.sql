-- The student tier, and the profiles leak it would otherwise open.
--
-- A prospective member is a signed-in Cornell account with no profiles row.
-- That is the whole definition — there is no 'student' role, because adding
-- one would quietly widen every existing role check.
--
-- The problem: 0001's profiles select policy is `using (true)` for anyone
-- authenticated. Members are the only authenticated callers today, so that is
-- currently fine. The moment a non-member can hold a session, it hands them
-- the entire directory — every member's email and, after 0030, their netid.
-- Introducing the student tier without changing this would be the leak.
--
-- RLS gates rows, not columns, so this needs both halves: restrict the table
-- to members, and expose a deliberately narrow view for everyone else.

-- ---------------------------------------------------------------------------
-- 1. profiles becomes members-only
-- ---------------------------------------------------------------------------
drop policy "profiles_select_authenticated" on profiles;

-- app_user_role() reads the caller's own profiles row, so it is null exactly
-- when the caller is not a member. Every existing app user has a row and is
-- unaffected.
create policy "profiles_select_members"
  on profiles for select to authenticated
  using (app_user_role() is not null);

-- ---------------------------------------------------------------------------
-- 2. A narrow view for prospective members
-- ---------------------------------------------------------------------------
-- Only members who opted in, and only the columns that opting in is about.
-- No email, no netid, no hometown, no links. security_invoker = off so the
-- view reads profiles as its owner: a student cannot select the table
-- directly, which is the point.
create view chat_directory
with (security_invoker = off) as
  select
    p.id,
    p.full_name,
    p.pronouns,
    p.major,
    p.graduation_year,
    p.team,
    p.position,
    p.interests,
    p.chat_blurb
  from profiles p
  where p.open_to_chats
    and p.active
    and p.status = 'active';

comment on view chat_directory is
  'Opted-in members, for prospective students who have no profiles row. '
  'Deliberately excludes email, netid and anything else opting into coffee '
  'chats does not imply consenting to publish.';

grant select on chat_directory to authenticated;

-- ---------------------------------------------------------------------------
-- 3. Caps on the matching flow
-- ---------------------------------------------------------------------------
-- Enforced in the action layer too, where they can return a readable message.
-- These exist so a single student cannot paper the whole club with requests,
-- and so one member cannot be buried.
create or replace function app_open_requests_from_student(p_email text)
returns int
language sql
security definer
stable
as $$
  select count(*)::int from chat_requests
  where lower(student_email) = lower(p_email) and status = 'pending'
$$;

create or replace function app_open_requests_to_member(p_profile uuid)
returns int
language sql
security definer
stable
as $$
  select count(*)::int from chat_requests
  where profile_id = p_profile and status = 'pending'
$$;

-- A student may not ask the same member twice while the first is still open.
-- Partial, so a completed or declined chat can be followed by a new request.
create unique index chat_requests_one_open_per_pair_idx
  on chat_requests (lower(student_email), profile_id)
  where status = 'pending';

-- ---------------------------------------------------------------------------
-- 4. The chat request itself must name a member who is actually open
-- ---------------------------------------------------------------------------
-- 0034's insert policy checks that the student is writing in their own name.
-- It does not check the other side: nothing stopped a request being addressed
-- to a member who never opted in, or who has left.
create or replace function app_member_open_to_chats(p_profile uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from profiles
    where id = p_profile and open_to_chats and active and status = 'active'
  )
$$;

drop policy "chat_requests_insert_student" on chat_requests;

create policy "chat_requests_insert_student"
  on chat_requests for insert to authenticated
  with check (
    app_user_role() is null
    and lower(student_email) = lower(auth.jwt() ->> 'email')
    -- Cornell accounts only. The student tier is for prospective members, and
    -- an arbitrary Google account is not one.
    and lower(auth.jwt() ->> 'email') like '%@cornell.edu'
    and app_member_open_to_chats(profile_id)
    and status = 'pending'
  );

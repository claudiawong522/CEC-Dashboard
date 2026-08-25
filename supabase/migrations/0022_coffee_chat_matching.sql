-- Coffee chat signup and matching.
--
-- Prospective members stop browsing the directory and picking someone. They
-- describe themselves; members see the pool ranked by shared interests and
-- claim what they want. This inverts who does the choosing: the person with the
-- least information about the club was being asked to judge which member was
-- worth an hour.

-- ---------------------------------------------------------------------------
-- chat_requests: altered, not replaced
-- ---------------------------------------------------------------------------
-- The hosted app may hold real requests, so existing rows stay valid: they keep
-- their profile_id and simply read as already-directed at someone.

-- The identity is now a guest, the same row Startup Hours writes. A netid typed
-- into the form becomes <netid>@cornell.edu and resolves here, so one person
-- who scanned the QR in September and asks for a chat in October is one record
-- with a visit history rather than two.
alter table chat_requests add column guest_id uuid references guests(id) on delete cascade;

-- profile_id stops meaning "the member they chose". It is null on a new request
-- until somebody claims it.
alter table chat_requests alter column profile_id drop not null;

alter table chat_requests add column claimed_by uuid references profiles(id) on delete set null;
alter table chat_requests add column claimed_at timestamptz;

-- The tags they picked, from the fixed vocabulary in lib/utils/interests.ts.
-- Deliberately not a foreign key to a table: the list changes about once a
-- semester and lives in code.
alter table chat_requests add column interests text[] not null default '{}';

alter table chat_requests drop constraint chat_requests_status_check;
alter table chat_requests add constraint chat_requests_status_check
  check (status in ('pending', 'claimed', 'accepted', 'completed', 'declined'));

-- A claimed request has a claimer, and an unclaimed one does not. Without this
-- a bug could leave a request marked taken with nobody attached, which reads to
-- everyone else as "someone has this" while no one does.
alter table chat_requests add constraint chat_requests_claim_consistent
  check ((status = 'claimed') = (claimed_by is not null));

-- The pool query: unclaimed, newest-waiting first.
create index chat_requests_open_idx on chat_requests (created_at) where claimed_by is null;
create index chat_requests_guest_idx on chat_requests (guest_id);

-- One open request per guest. They can ask again once the first is resolved,
-- which replaces 0018's cap of three open requests per student email.
create unique index chat_requests_one_open_per_guest_idx
  on chat_requests (guest_id) where status = 'pending';

-- ---------------------------------------------------------------------------
-- coffee_chats: a partner can now be a guest
-- ---------------------------------------------------------------------------
-- Claiming does not create the chat: selfie_url is not null and a claim has no
-- selfie yet. The member submits through the existing dialog when the chat
-- actually happens, and it counts toward their board like any other.
--
-- Exactly one of the two partner columns is set, the same shape shoutouts has
-- used since 0010 for a receiver who is either a member or a plain name.
alter table coffee_chats add column partner_guest_id uuid references guests(id) on delete cascade;
alter table coffee_chats alter column partner_id drop not null;

alter table coffee_chats add constraint coffee_chats_partner_present
  check (num_nonnulls(partner_id, partner_guest_id) = 1);

-- 0014's check compared two non-null columns. It has to tolerate a null
-- partner_id now, and null <> null is null rather than false, which a check
-- constraint treats as passing. Spelled out so that is deliberate.
alter table coffee_chats drop constraint coffee_chats_distinct_people;
alter table coffee_chats add constraint coffee_chats_distinct_people
  check (partner_id is null or submitter_id <> partner_id);

create index coffee_chats_partner_guest_idx on coffee_chats (partner_guest_id);

-- 0014's select policy names partner_id = auth.uid(). A guest partner holds no
-- session, so there is nothing to widen for them; the policy is left alone.

-- ---------------------------------------------------------------------------
-- The browse flow goes
-- ---------------------------------------------------------------------------
-- chat_directory existed so a student could pick a member. Nobody picks a
-- member any more, and the view is the only reason a prospective member could
-- read anything derived from profiles.
drop view if exists chat_directory;

-- 0013 and 0018 let a signed-in student insert their own request. The form is
-- public now and writes through a service-role action, exactly like the
-- Startup Hours sign in, so no anon or student insert path is wanted here.
drop policy if exists "chat_requests_insert_student" on chat_requests;
drop policy if exists "chat_requests_select_student" on chat_requests;
drop index if exists chat_requests_one_open_per_pair_idx;

-- Members read the pool; admins clear it out. Claiming goes through a server
-- action so the update stays a single conditional statement.
drop policy if exists "chat_requests_select_member" on chat_requests;
create policy "chat_requests_select_members"
  on chat_requests for select to authenticated
  using (app_user_role() is not null);

drop policy if exists "chat_requests_update_member" on chat_requests;
create policy "chat_requests_update_admin"
  on chat_requests for update to authenticated
  using (app_user_role() = 'admin') with check (app_user_role() = 'admin');

grant select, insert, update on chat_requests to service_role;

-- Sign in by day, not by clock, and a question bank behind the form.
--
-- Three things changed about how Startup Hours actually runs, and 0019/0024
-- encoded the old shape of all three.
--
-- 1. The QR code must always work. It used to resolve an event from the wall
--    clock, so a scan at 7:29 or at an unscheduled afternoon session found
--    nothing and the poster looked broken. The unit is now the calendar day in
--    Ithaca, and a day with no event on the calendar still accepts sign ins:
--    somebody forgetting to add the event must not stop the door working.
--
-- 2. Food is open to everyone, always. That is the condition the funding came
--    with, so the gate 0024 built is gone from the product. The columns stay
--    for the history already recorded in them, but nothing reads them to
--    decide anything any more.
--
-- 3. Nobody is asked the same question twice. What a returning attendee is
--    asked is drawn from a bank the board edits, which also means the per
--    night question can change without a deploy.

-- ---------------------------------------------------------------------------
-- The day is the unit
-- ---------------------------------------------------------------------------
alter table guest_signins add column signin_date date;

-- Existing rows keep their real date: the event's own date where there is one,
-- which is what "which night was this" has always meant here.
update guest_signins gs
set signin_date = coalesce(
  (select e.event_date from events e where e.id = gs.event_id),
  (gs.signed_in_at at time zone 'America/New_York')::date
);

alter table guest_signins alter column signin_date set not null;

-- Written explicitly by the action layer, which knows Ithaca's date. The
-- default is a backstop for a hand-inserted row, and is deliberately the club's
-- wall clock rather than the server's.
alter table guest_signins
  alter column signin_date set default (now() at time zone 'America/New_York')::date;

-- A day with nothing on the calendar is still a day people walked in. The
-- sign in stands on its own and /signins offers to attach it to an event
-- afterwards.
alter table guest_signins alter column event_id drop not null;

-- One sign in per person per day is the whole rate limit: scanning the poster
-- again, in another tab or on the kiosk, is the same visit.
delete from guest_signins a
using guest_signins b
where a.guest_id = b.guest_id
  and a.signin_date = b.signin_date
  and a.signed_in_at > b.signed_in_at;

alter table guest_signins drop constraint if exists guest_signins_once_per_event;

alter table guest_signins
  add constraint guest_signins_once_per_day unique (guest_id, signin_date);

create index guest_signins_date_idx on guest_signins (signin_date desc);

-- ---------------------------------------------------------------------------
-- The question bank
-- ---------------------------------------------------------------------------
-- `audience` is the point of the table. A first-timer and someone on their
-- ninth visit should not be asked the same thing, and until now the form
-- hard-coded one question for both.
create table signin_questions (
  id uuid primary key default gen_random_uuid(),
  prompt text not null,
  -- Shown under the prompt in grey. Optional, and worth writing: it is what
  -- stops every answer being one word.
  placeholder text,
  audience text not null check (audience in ('new', 'returning', 'both')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index signin_questions_active_idx on signin_questions (audience) where active;

alter table signin_questions enable row level security;

create policy "signin_questions_select_members"
  on signin_questions for select to authenticated
  using (app_user_role() is not null);

-- Editing the bank is ordinary door work, same as marking someone in, so it is
-- edit-or-admin rather than admin only.
create policy "signin_questions_write_edit_or_admin"
  on signin_questions for all to authenticated
  using (app_user_role() in ('edit', 'admin'))
  with check (app_user_role() in ('edit', 'admin'));

-- Answers keyed by question id, so a question can be reworded or retired
-- without orphaning what people already said. Kept on the sign in and not on
-- the guest: these are per-night answers by design.
alter table guest_signins add column answers jsonb not null default '{}'::jsonb;

-- 0019's `wants_to_meet` was this feature with one hard-coded question. It
-- stays, holding its own history, and is now simply the first returning
-- question in the bank.
insert into signin_questions (prompt, placeholder, audience) values
  ('What are you working on right now?', 'A class project, a startup, or nothing yet', 'new'),
  ('How did you hear about Startup Hours?', 'A friend, a poster, Instagram', 'new'),
  ('Anyone you''re hoping to meet tonight?', 'Someone who''s raised a pre-seed', 'returning'),
  ('What''s changed since you were last here?', 'Shipped something, joined a team, still thinking', 'returning'),
  ('What would make tonight worth it for you?', 'One intro, one answer, one co-founder', 'both');

grant select on signin_questions to service_role;

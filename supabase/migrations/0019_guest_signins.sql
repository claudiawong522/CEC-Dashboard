-- Startup Hours sign in.
--
-- Startup Hours is ungated: Cornell or not, member or not, everyone is
-- welcome. So the identity here cannot be a profiles row (members only), and
-- it cannot be an auth session either (the student tier is Cornell only). It
-- is a typed email, and nothing else. No account, no login, and no change to
-- the auth callback: that callback has already been widened once for the
-- student tier, and widening it again is where auth bugs come from.
--
-- Named `guests` because `event_attendees` is already taken by 0001's
-- per-section prep checklist, which is a different thing entirely.

-- ---------------------------------------------------------------------------
-- Which events have a sign in
-- ---------------------------------------------------------------------------
-- The public page resolves the event from the clock, not from the URL, so one
-- QR code can be printed once onto a poster that gets reused every week. This
-- flag is what makes an event resolvable at all: without it, every meeting on
-- the calendar would quietly accept walk-in sign ins.
alter table events add column has_signin boolean not null default false;

create index events_signin_idx on events (event_date) where has_signin;

-- ---------------------------------------------------------------------------
-- guests: one row per person, ever
-- ---------------------------------------------------------------------------
-- The stable facts. A name and a background do not change between events, so
-- a returning attendee types their email and is recognised rather than
-- retyping everything they already told us.
create table guests (
  id uuid primary key default gen_random_uuid(),
  -- Stored already normalised (trimmed, lowercased) by the action layer.
  email text not null,
  full_name text not null,
  linkedin_url text,
  background text,
  -- Set when the email matches a member. Members take attendance on
  -- /attendance, not here, but if one signs in on the QR anyway the two
  -- records can still be reconciled later.
  profile_id uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Two constraints on purpose. The plain unique is what the upsert in
-- lib/actions/signin.ts names in `onConflict`, which PostgREST can only do for
-- a real constraint and not for a functional index. The functional index is
-- the backstop that still catches a differently-cased address inserted by
-- hand or by some future importer that forgets to normalise.
alter table guests add constraint guests_email_key unique (email);
create unique index guests_email_lower_idx on guests (lower(email));

create index guests_profile_idx on guests (profile_id) where profile_id is not null;

alter table guests enable row level security;

-- Members read the guest list. Nobody writes through RLS on the public path:
-- that goes through a service-role server action, because `anon` has zero
-- grants and zero policies on this project and stays that way. Admins keep a
-- write policy so a typo in someone's name can be fixed without anyone
-- reaching for the service role by hand.
create policy "guests_select_members"
  on guests for select to authenticated
  using (app_user_role() is not null);

create policy "guests_write_admin"
  on guests for all to authenticated
  using (app_user_role() = 'admin')
  with check (app_user_role() = 'admin');

-- ---------------------------------------------------------------------------
-- guest_signins: one row per person per event
-- ---------------------------------------------------------------------------
-- The per-night facts. Who someone wants to meet changes every week, which is
-- exactly why it lives here and not on the guest.
create table guest_signins (
  id uuid primary key default gen_random_uuid(),
  guest_id uuid not null references guests(id) on delete cascade,
  event_id uuid not null references events(id) on delete cascade,
  wants_to_meet text,
  -- 'qr' is someone's own phone, 'kiosk' is the shared laptop at the door.
  source text not null default 'qr' check (source in ('qr', 'kiosk')),
  signed_in_at timestamptz not null default now()
);

-- A second tap on the same phone is the same visit, not a second one.
alter table guest_signins
  add constraint guest_signins_once_per_event unique (guest_id, event_id);

create index guest_signins_event_idx on guest_signins (event_id, signed_in_at desc);

alter table guest_signins enable row level security;

create policy "guest_signins_select_members"
  on guest_signins for select to authenticated
  using (app_user_role() is not null);

create policy "guest_signins_write_admin"
  on guest_signins for all to authenticated
  using (app_user_role() = 'admin')
  with check (app_user_role() = 'admin');

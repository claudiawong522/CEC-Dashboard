# Startup Hours sign in

Claudia asked for "a simple sign in thing that syncs with the dashboard", backed by
"prolly a db", tracking attendance across events by email. This is that, and only that.

## The problem

Startup Hours is ungated: anyone is welcome, Cornell or not, member or not. People
take food at 7pm and leave. A sign in is the lever, but it has to work for a
population that is a superset of every identity tier the app knows about.

Three groups show up:

| Who | Has a `profiles` row | Can hold a session today |
| --- | --- | --- |
| CEC members | yes | yes |
| Cornell non members | no | yes, the student tier |
| Non Cornell visitors | no | no |

So sign in cannot require a club account, and cannot require a Cornell account
either, without breaking "anyone's welcome".

## Decisions

**Identity is a typed email. No accounts, no login.** Claudia's own framing was
"updated with future attendances with that email", so email is the key. This
touches neither `profiles` nor the student tier, and needs no change to the auth
callback. That callback has already been widened once for the student tier, and a
second widening is where auth bugs come from.

**A person is created once, a visit is recorded every event.** A one time
registration would gate nothing, since the food gate needs to know who is in the
room tonight. So a returning attendee types the same email and gets recognised,
with a new visit logged.

**Stable facts live on the person, per night facts live on the visit.** LinkedIn
and background do not change between events. Who someone wants to meet does.

**Members do not use this form.** Per the decision on the day, member attendance
stays on the existing `/attendance` screen. If a member types their email anyway
the visit is linked to their profile so the two records can be reconciled, but no
member attendance row is created from here.

**The public page writes through a server action using the service role client.**
`anon` currently has zero grants and zero policies on this project, and it stays
that way. This is the pattern the invite flow already uses. The cost is that a bug
in that one action is unguarded by RLS, so it must never accept an event id from
the client without resolving it server side.

**The event is resolved from the clock, not from the URL.** One permanent QR,
printed once, on a poster reused every week. The page resolves whichever sign in
enabled event is running now and says nothing is on otherwise. A photographed
poster is worthless on a non event night, and there is no per event QR to
regenerate.

**Sign in stays open past 7pm.** Claudia: "if they come at 7, they still have to
sign in". So 6:30 to 7 is guidance to attendees, not an enforced close. The window
opens at the event's start time and closes at `event_end_time`, or three hours
after the start when that column is null.

(Corrected during implementation on 2026-08-24. This section first said a flat
three hours because the schema was read as having no end time. `events` does have
one, `event_end_time`, nullable, added by 0002. The flat three hours survives as
the fallback.)

## Data model

`events` gains `has_signin boolean not null default false`. Only events with it set
are resolvable by the public page.

`guests`, one row per person, ever. Named `guests` because `event_attendees` is
already taken by the per section checklist table from 0001.

- `id`, `email` unique on the normalised lowercase value, `full_name`
- `linkedin_url`, `background`, both nullable
- `created_at`, `updated_at`
- `profile_id` nullable, set when the email matches a member

`guest_signins`, one row per person per event.

- `id`, `guest_id`, `event_id`
- `wants_to_meet` nullable, captured per night
- `source`, either `qr` or `kiosk`
- `signed_in_at`
- unique on `(guest_id, event_id)` so a double tap is idempotent rather than a
  duplicate

RLS: both tables readable by members, writable by admins. The public path does not
go through RLS at all, it goes through the service role action.

The migration also states the `service_role` grants out loud rather than
inheriting them. Every other table in the schema leans on Supabase Cloud's
default privileges, which the local stack image does not reproduce, so without
this the walk-in sign in works in production and returns "permission denied for
table events" on a laptop. `anon` is granted nothing, which is the reason the
public page goes through a server action at all.

## Surfaces

**Public sign in** at `/checkin`, added to `PUBLIC_PATHS` in `proxy.ts`. It
resolves tonight's event, shows the form, and recognises a returning email so it
can skip straight to the per night question.

The host view is `/signins`, and the two deliberately share no prefix:
`PUBLIC_PATHS` is matched with `startsWith`, so a host view named
`/checkin-board` would have published the guest list.

**The confirmation is the food pass.** It is a card in the brand's green with a
thick outline, readable at arm's length across a room, because what actually
happens at 7pm is that someone holds up their phone at the food table. That is
also why it has no way back to the form: one phone, one sign in, and a green
screen that cannot be cleared by a stray tap while it is being shown.

**Kiosk mode**, the same route with a flag that keeps the form short, name and
email only, and returns to a blank form after each submission instead of a personal
confirmation. A shared device should not hold the previous person's details on
screen.

**Host view**, on the dashboard, live list of who has signed in tonight with a
count, plus each guest's history so a host can see this is someone's fourth visit.

## Out of scope, deliberately

**No blacklist.** Claudia asked to "check who's blacklisted" and this does not do
it. Flagged during design and decided against for v1. Adding it later means a
migration on `guests` plus an admin toggle, which is small, but it is not free.

**No detection of who took food and left.** The app cannot observe it. Any version
of this needs either a second touch later in the evening or a host marking people
by hand.

**No matchmaking.** `wants_to_meet` is captured so the data exists when matching is
designed, but nothing reads it yet.

**No recruitment pipeline.** Turning attendees into applicants is a later layer over
data this already produces.

## Testing

Unit tests on the window resolution and email normalisation, which are the two bits
of pure logic. A returning email must attach to the existing guest rather than
creating a second one, and a double submit must not create two visits. The RLS
harness gains a check that the guest tables are not readable by the student tier.

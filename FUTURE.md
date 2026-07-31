# Future work

## Google Calendar invites from tagged members

Members tagged into an event (`event_tagged_members`, see `components/events/sections/
TaggedMembersSection.tsx`) currently just reflect who's involved — as chips on the event's
"Members" tab and read-only on that event's photos in the gallery lightbox. The next step,
deliberately not built yet, is an admin-only "Send Invites" action that creates/updates a Google
Calendar event with the tagged members as attendees.

### Why this is deferred
Calendar access is a Google "sensitive" OAuth scope. A brand-new OAuth app starts in **Testing**
publishing status, where refresh tokens expire every 7 days regardless of which account is
connected — that's true for a personal Gmail account just as much as a Workspace one. Getting a
non-expiring connection requires moving the app to **Production**, which for a sensitive scope
requires a one-time Google verification review (a hosted privacy policy + homepage, a scope
justification, sometimes a short demo video). Realistic turnaround: one submission, 3 days to
~2 weeks. This is a real lead-time dependency, not a coding task — worth kicking off before
building the rest so it's not the thing blocking launch.

Cornell's Workspace domain isn't something this app can get domain-wide delegation on, and a
personal Gmail account can't use the verification-skipping "Internal" app type (that only works
for orgs you administer) — so a **dedicated Gmail account you fully own**, run through the normal
verification process, is the realistic path. Not each admin's personal account — one shared
"sender" identity that owns every invite as organizer.

### Design (agreed, not yet built)
- **Data model**: `events.google_calendar_event_id` (nullable) so re-sending patches the same
  Calendar event instead of creating duplicates. A single-row `google_calendar_auth` table holds
  the connected account's encrypted refresh token + connected email — encrypt at the app layer
  (key from an env var, not stored alongside the token) rather than storing it in the clear.
- **Admin UI**: a "Calendar Connection" card in `/admin` — connect/disconnect, shows the connected
  email, surfaces connection health (last successful send, a clear "reconnect needed" banner on
  `invalid_grant`).
- **Per-event UI**: a "Send Invites" button on the Members tab, admin-role only (tagging itself
  stays edit+role, same as today) — explicit action, nothing hits Calendar until clicked.
- **Send is a full resync, not just an attendee diff**: every click patches summary/location/
  start/end *and* attendees in one call, so an edited venue/time actually propagates instead of
  silently going stale on already-sent invites. Compare `events.updated_at` against a stored
  `invites_sent_at` to show a "details changed since last send" nudge.
- **Concurrency guard**: re-read `google_calendar_event_id` immediately before create, plus an
  `invite_in_progress` flag on the event, so a double-click / two admins clicking at once can't
  create two Calendar events for the same row.
- **Cleanup**: deleting an event (or clearing all its tags) should cancel the Calendar event
  first, before the DB row disappears — otherwise tagged members keep a phantom invite forever.
- **Reconnect safety**: if the connected account ever changes, flag events with a non-null
  `google_calendar_event_id` from the *old* connection as stale rather than silently trying to
  patch them under a mismatched organizer.
- **Recurring events**: each occurrence is its own `events` row, so tagging doesn't propagate
  automatically across a series — add a "copy tags to remaining occurrences" bulk action using
  `recurring_series_id` rather than forcing per-occurrence re-tagging.
- **Timezone**: hardcode `timeZone: "America/New_York"` on every Calendar payload — Google
  defaults to UTC otherwise, which silently shifts every invite by hours.
- **RLS**: enforce the edit/admin write check as an actual Postgres policy on whatever new tables
  this adds (matching `event_tagged_members`'s policy), not only in the server action — and check
  whether any of this can be reached through the service-role client (`lib/supabase/admin.ts`),
  which bypasses RLS entirely.
- **Roster gap**: the member picker can only tag people who've signed into the dashboard at least
  once (`profiles` rows are created by the Google OAuth trigger) — surface that explicitly in the
  picker rather than a silent omission.

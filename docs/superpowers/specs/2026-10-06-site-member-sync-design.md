# Profile photos in the dashboard, synced to cornellec.com

Date: 2026-10-06. Dashboard branch `feat/cornellec-rehaul` (this repo); site branch `feat/dashboard-members`
in `~/Documents/CEC/CEC-website`.

## Goal
Members upload a photo and fill in their profile once, in the dashboard, and the public members page on
cornellec.com reflects it within seconds. Board titles and the order people appear in stay curated in the
site's `data/members.ts`.

## Direction (decided)
The site reads from the dashboard. The dashboard exposes an anon-readable view and a public storage path;
the site fetches it with ISR and a tag, and every profile save in the dashboard pings a revalidate route on
the site. No GitHub tokens in the dashboard, no generated commits, and the static `members.ts` remains the
fallback if the fetch ever fails.

## Contract: the `members_public` view
Dashboard Supabase, `grant select to anon, authenticated`. One row per profile with `status = 'active'` and
`show_on_site = true`.

| column | type | source |
| --- | --- | --- |
| id | uuid | profiles.id |
| full_name | text | profiles.full_name |
| avatar_url | text | profiles.avatar_url (a full public URL, or null) |
| position | text | profiles.position |
| team | text | profiles.team |
| major | text | profiles.major |
| graduation_year | int | profiles.graduation_year |
| hobbies | text | new column |
| about | text | profiles.about |
| building | text | new column, free text or a domain |
| portfolio_url | text | profiles.portfolio_url |
| github_url | text | new column |
| linkedin_url | text | profiles.linkedin_url |
| active | bool | profiles.active (false = alumni on the site) |
| updated_at | timestamptz | profiles.updated_at |

Email, netid, pronouns, hometown, interests and chat fields are never exposed.

## Dashboard changes
1. Migration `0049_site_profile.sql`: add `hobbies text`, `github_url text`, `building text`,
   `show_on_site boolean not null default true` to `profiles`; create the view above (owner postgres, so it
   reads past RLS by design, and it is the only anon-readable surface); grants.
2. Photos go to the existing public `portraits` bucket under `avatars/<profile id>/<timestamp>.webp`. The
   browser downsizes to a 800x800 centre-crop webp before upload (canvas, no new dependency), so the
   free-tier storage budget holds. Existing write policies already cover every member (there is no
   view-only role since 0048).
3. `ProfileForm` gains an avatar block (square preview with the 2px border, Upload photo, Remove) and the
   fields Hobbies, GitHub, Building, plus a "Show on cornellec.com" switch. `profileSchema` and
   `MemberProfile` grow the same fields. A new `updateOwnAvatar(url | null)` action writes `avatar_url`.
4. `lib/site-sync.ts`: `pingSiteRevalidate()` POSTs to `SITE_REVALIDATE_URL` with
   `x-revalidate-secret: SITE_REVALIDATE_SECRET`, fire and forget, silent when the env is unset. Called after
   every successful profile or avatar save.
5. `scripts/backfill-site-members.mjs`: one-off, dry run by default, `--apply` to write. Reads the site's
   `data/members.ts`, matches each person to a profile by normalised full name, fills only empty profile
   fields (position only when it is still the default "Member"), uploads the site photo as the avatar when
   the profile has none, and prints the names it could not match so an admin can invite them.

## Site changes
1. `lib/members-source.ts`: `fetchDashboardMembers()` (REST call to `/rest/v1/members_public`, `next:
   { revalidate: 3600, tags: ['members'] }`, returns `[]` on any failure or missing env) and
   `mergeMembers()`: for each curated list, match by normalised name and let every non-empty dashboard
   value override the static one, photo included; dashboard rows that match nobody are appended to
   `members` (active) or `alumni` (inactive). Board `role` is never taken from the dashboard.
2. `app/members/page.tsx` becomes a server component that fetches, merges and renders the existing client
   page (moved to `MembersClient.tsx`) with the lists as props.
3. `app/api/revalidate/route.ts`: POST, compares `x-revalidate-secret` to `REVALIDATE_SECRET`, calls
   `revalidateTag('members')`.
4. `next.config.ts`: `images.remotePatterns` for the Supabase host.
5. Env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `REVALIDATE_SECRET` on the site;
   `SITE_REVALIDATE_URL`, `SITE_REVALIDATE_SECRET` on the dashboard. Documented in each repo.

## Existing site members
Nobody is removed. A person who exists only in `members.ts` keeps rendering from it. Once an admin invites
their email and they sign in, the backfill (or their own edits) takes over, field by field.

## Verification
Dashboard: migration applies on a local reset, tsc, lint, tests, upload a photo and see it on the members
page. Site: `npm run build`, the members page renders with the env unset (static fallback) and with it set
against the local dashboard stack, `POST /api/revalidate` with and without the secret.

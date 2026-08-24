# Startup Hours Sign In Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let anyone at a Startup Hours event sign in from one permanent QR code with just an email, building a cross-event attendance record hosts can watch live.

**Architecture:** A public route resolves tonight's sign-in-enabled event from the wall clock (never from the URL) and writes through a service-role server action, because `anon` has zero grants on this project. Two new tables, `guests` (one row per person ever) and `guest_signins` (one row per person per event), hold the stable and per-night facts respectively. A members-only host view lists who is in the room and which upcoming events have sign-in switched on.

**Tech Stack:** Next.js 16 App Router, React 19, Supabase (Postgres + RLS), zod 4, react-hook-form, Tailwind 4, Vitest 4.

**Spec:** `docs/superpowers/specs/2026-08-20-startup-hours-signin-design.md`

## Global Constraints

- Route names: public sign in is `/checkin`, host view is `/signins`. They must not share a prefix, because `proxy.ts` matches `PUBLIC_PATHS` with `startsWith` and `/signins` would otherwise become public.
- The public action must never accept an event id from the client. It resolves the event server side, every time.
- The public path uses `createAdminClient()` from `@/lib/supabase/admin`. It never uses the anon client, which has no grants.
- Table names are `guests` and `guest_signins`. `event_attendees` is already taken by 0001's per-section checklist.
- Emails are stored already-normalised (trimmed, lowercased). Uniqueness is a `lower(email)` index as a backstop.
- Wall-clock comparisons happen in `America/New_York`. Never `new Date(eventDate + "T" + eventTime)`, which reads as the server's zone (UTC in production).
- Migration number is `0019`. Existing head is `0018_student_tier.sql`.
- Spec correction: `events.event_end_time` exists (nullable, added by 0002). The sign-in window closes at `event_end_time` when set, and at start plus 3 hours when it is null. The spec's flat 3 hours was written from a wrong reading of the schema.
- No em dashes anywhere, including SQL comments and UI copy.

---

### Task 1: Sign-in window and email normalisation

Pure logic, no database. Everything else depends on the shape of `pickCurrentEvent`.

**Files:**
- Create: `lib/utils/signin-window.ts`
- Test: `lib/utils/signin-window.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `normalizeEmail(raw: string): string`
  - `type WindowEvent = { id: string; event_date: string; event_time: string; event_end_time: string | null }`
  - `wallClockNow(now?: Date, timeZone?: string): number` returning minutes since the Unix epoch in the given zone
  - `signInWindow(event: WindowEvent): { opensAt: number; closesAt: number }` in the same minute units
  - `pickCurrentEvent<T extends WindowEvent>(events: T[], nowMinutes: number): T | null`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import {
  normalizeEmail,
  signInWindow,
  pickCurrentEvent,
  wallClockNow,
} from "@/lib/utils/signin-window";

const base = { id: "a", event_date: "2026-09-03", event_time: "18:30:00", event_end_time: null };

describe("normalizeEmail", () => {
  it("trims and lowercases", () => {
    expect(normalizeEmail("  Ada@Cornell.EDU ")).toBe("ada@cornell.edu");
  });
});

describe("signInWindow", () => {
  it("closes three hours after the start when there is no end time", () => {
    const { opensAt, closesAt } = signInWindow(base);
    expect(closesAt - opensAt).toBe(180);
  });

  it("closes at the event end time when one is set", () => {
    const { opensAt, closesAt } = signInWindow({ ...base, event_end_time: "20:00:00" });
    expect(closesAt - opensAt).toBe(90);
  });

  it("carries an end time past midnight into the next day", () => {
    const { opensAt, closesAt } = signInWindow({
      ...base,
      event_time: "22:00:00",
      event_end_time: "01:00:00",
    });
    expect(closesAt - opensAt).toBe(180);
  });
});

describe("wallClockNow", () => {
  it("reads the clock in Ithaca, not the server zone", () => {
    // 2026-09-03T22:30:00Z is 6:30pm EDT the same day.
    const minutes = wallClockNow(new Date("2026-09-03T22:30:00Z"), "America/New_York");
    expect(minutes).toBe(signInWindow(base).opensAt);
  });
});

describe("pickCurrentEvent", () => {
  const at = (iso: string) => wallClockNow(new Date(iso), "America/New_York");

  it("returns null before the window opens", () => {
    expect(pickCurrentEvent([base], at("2026-09-03T22:29:00Z"))).toBeNull();
  });

  it("returns the event once it has started", () => {
    expect(pickCurrentEvent([base], at("2026-09-03T22:30:00Z"))?.id).toBe("a");
  });

  it("stays open past 7pm, which is the whole point", () => {
    expect(pickCurrentEvent([base], at("2026-09-03T23:45:00Z"))?.id).toBe("a");
  });

  it("returns null after the window closes", () => {
    expect(pickCurrentEvent([base], at("2026-09-04T01:31:00Z"))).toBeNull();
  });

  it("prefers the event that started most recently when two overlap", () => {
    const later = { ...base, id: "b", event_time: "19:00:00" };
    expect(pickCurrentEvent([base, later], at("2026-09-03T23:15:00Z"))?.id).toBe("b");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- signin-window`
Expected: FAIL, cannot resolve `@/lib/utils/signin-window`.

- [ ] **Step 3: Write the implementation**

```ts
// Resolving "which event is running right now" is the one piece of this
// feature with no database in it, so it lives here and is tested directly.
//
// Everything is minutes since the Unix epoch *as read off a wall clock in
// Ithaca*. events stores `event_date` (a date) and `event_time` (a time)
// with no zone attached, so the naive `new Date(date + "T" + time)` reads
// them in the server's zone, which is UTC in production and would put the
// window four or five hours off. Comparing wall-clock minutes on both sides
// sidesteps the whole problem without pulling in a timezone library.

export const CLUB_TIME_ZONE = "America/New_York";

// A sign-in stays open this long after the start when the event has no end
// time recorded. Generous on purpose: people arrive late, take food, and
// still have to sign in.
const DEFAULT_WINDOW_MINUTES = 180;

export type WindowEvent = {
  id: string;
  event_date: string;
  event_time: string;
  event_end_time: string | null;
};

export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

function dayNumber(dateStr: string): number {
  const [y, m, d] = dateStr.split("-").map(Number);
  return Date.UTC(y, m - 1, d) / 86_400_000;
}

function minutesIntoDay(timeStr: string): number {
  const [h, min] = timeStr.split(":").map(Number);
  return h * 60 + min;
}

/** Minutes since the epoch, read off a wall clock in `timeZone`. */
export function wallClockNow(now: Date = new Date(), timeZone: string = CLUB_TIME_ZONE): number {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)!.value;
  // en-CA renders midnight as "24" rather than "00" in some runtimes.
  const hour = Number(get("hour")) % 24;
  return dayNumber(`${get("year")}-${get("month")}-${get("day")}`) * 1440 + hour * 60 + Number(get("minute"));
}

export function signInWindow(event: WindowEvent): { opensAt: number; closesAt: number } {
  const start = minutesIntoDay(event.event_time);
  const opensAt = dayNumber(event.event_date) * 1440 + start;

  if (!event.event_end_time) return { opensAt, closesAt: opensAt + DEFAULT_WINDOW_MINUTES };

  const end = minutesIntoDay(event.event_end_time);
  // An event that ends earlier in the day than it starts ran past midnight.
  const spansMidnight = end <= start;
  return { opensAt, closesAt: opensAt + (spansMidnight ? end + 1440 - start : end - start) };
}

/**
 * The event a walk-in is signing in to. Only events already filtered to
 * `has_signin` should be passed in. When two windows overlap the one that
 * started most recently wins, because that is the room the person is
 * standing in.
 */
export function pickCurrentEvent<T extends WindowEvent>(events: T[], nowMinutes: number): T | null {
  let best: { event: T; opensAt: number } | null = null;

  for (const event of events) {
    const { opensAt, closesAt } = signInWindow(event);
    if (nowMinutes < opensAt || nowMinutes > closesAt) continue;
    if (!best || opensAt > best.opensAt) best = { event, opensAt };
  }

  return best?.event ?? null;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- signin-window`
Expected: PASS, 9 tests.

- [ ] **Step 5: Commit**

```bash
git add lib/utils/signin-window.ts lib/utils/signin-window.test.ts
git commit -m "feat: resolve the sign in window from an Ithaca wall clock"
```

---

### Task 2: Migration 0019

**Files:**
- Create: `supabase/migrations/0019_guest_signins.sql`

**Interfaces:**
- Produces: `events.has_signin`, tables `guests` and `guest_signins` with the columns Task 3 reads and writes.

- [ ] **Step 1: Write the migration**

```sql
-- Startup Hours sign in.
--
-- Startup Hours is ungated: Cornell or not, member or not, everyone is
-- welcome. So the identity here cannot be a profiles row (members only) and
-- cannot be an auth session either (the student tier is Cornell only). It is
-- a typed email, and nothing else. No account, no login, no auth callback
-- change: that callback has already been widened once for the student tier,
-- and widening it again is where auth bugs come from.
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
-- retyping everything.
create table guests (
  id uuid primary key default gen_random_uuid(),
  -- Stored already normalised by the action layer. The index below is the
  -- backstop that makes "same person" true regardless of how they typed it.
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

create unique index guests_email_idx on guests (lower(email));
create index guests_profile_idx on guests (profile_id) where profile_id is not null;

alter table guests enable row level security;

-- Members read the guest list. Nobody writes through RLS: the public path
-- goes through a service-role server action, because `anon` has zero grants
-- and zero policies on this project and stays that way. Admins keep a write
-- policy so a typo in someone's name can be fixed from a SQL console or a
-- future admin screen without reaching for the service role.
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
create unique index guest_signins_once_per_event_idx on guest_signins (guest_id, event_id);
create index guest_signins_event_idx on guest_signins (event_id, signed_in_at desc);

alter table guest_signins enable row level security;

create policy "guest_signins_select_members"
  on guest_signins for select to authenticated
  using (app_user_role() is not null);

create policy "guest_signins_write_admin"
  on guest_signins for all to authenticated
  using (app_user_role() = 'admin')
  with check (app_user_role() = 'admin');
```

- [ ] **Step 2: Apply it and verify the tables exist**

```bash
docker exec -i supabase_db_cec-dashboard psql -U postgres -d postgres < supabase/migrations/0019_guest_signins.sql
docker exec supabase_db_cec-dashboard psql -U postgres -d postgres -tAc \
  "select table_name from information_schema.tables where table_name in ('guests','guest_signins') order by 1"
```

Expected: `guest_signins` then `guests`.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/0019_guest_signins.sql
git commit -m "feat: add guests and guest_signins tables"
```

---

### Task 3: Types, schemas, and the server actions

**Files:**
- Create: `lib/types/signin.ts`
- Create: `lib/validation/signin-schemas.ts`
- Create: `lib/actions/signin.ts`

**Interfaces:**
- Consumes: `normalizeEmail`, `pickCurrentEvent`, `wallClockNow`, `WindowEvent` from Task 1. `guests` / `guest_signins` from Task 2. `ActionResult`, `actionOk`, `actionFailed` from `@/lib/actions/result`. `requireRole` from `@/lib/auth/requireRole`.
- Produces:
  - `type CurrentEvent = { id: string; name: string; venue: string }`
  - `type GuestLookup = { known: boolean; fullName: string | null }`
  - `getCurrentSignInEvent(): Promise<CurrentEvent | null>`
  - `lookupGuest(rawEmail: string): Promise<GuestLookup>`
  - `submitSignIn(input: SignInInput): Promise<SignInResult>` where `SignInResult = ActionResult & { firstName?: string; visitNumber?: number }`
  - `setEventSignIn(eventId: string, enabled: boolean): Promise<ActionResult>`
  - `signInSchema` / `SignInInput` from the schemas file

- [ ] **Step 1: Write the types**

```ts
// lib/types/signin.ts
export type CurrentEvent = { id: string; name: string; venue: string };

export type GuestLookup = { known: boolean; fullName: string | null };

export type SignInBoardRow = {
  signin_id: string;
  guest_id: string;
  full_name: string;
  email: string;
  wants_to_meet: string | null;
  source: "qr" | "kiosk";
  signed_in_at: string;
  visit_number: number;
};

export type SignInEventRow = {
  id: string;
  name: string;
  venue: string;
  event_date: string;
  event_time: string;
  event_end_time: string | null;
  has_signin: boolean;
};
```

- [ ] **Step 2: Write the schemas**

```ts
// lib/validation/signin-schemas.ts
import { z } from "zod";

// The public form is the one place in this app where the person filling it in
// has no account and no session, so every field is validated here and again
// by the database constraints behind it.
export const signInSchema = z.object({
  email: z.string().trim().min(1, "Email is required").email("That doesn't look like an email").max(254),
  fullName: z.string().trim().min(1, "Name is required").max(120, "That name is too long"),
  linkedinUrl: z
    .union([z.literal(""), z.string().trim().url("Paste the full LinkedIn URL")])
    .optional()
    .transform((v) => (v ? v : null)),
  background: z.string().trim().max(500, "Keep it under 500 characters").optional().transform((v) => v || null),
  wantsToMeet: z.string().trim().max(500, "Keep it under 500 characters").optional().transform((v) => v || null),
  source: z.enum(["qr", "kiosk"]).default("qr"),
});

export type SignInInput = z.input<typeof signInSchema>;
```

- [ ] **Step 3: Write the actions**

```ts
// lib/actions/signin.ts
"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/requireRole";
import { actionFailed, actionOk, type ActionResult } from "@/lib/actions/result";
import { normalizeEmail, pickCurrentEvent, wallClockNow } from "@/lib/utils/signin-window";
import { signInSchema, type SignInInput } from "@/lib/validation/signin-schemas";
import type { CurrentEvent, GuestLookup, SignInEventRow } from "@/lib/types/signin";

export type SignInResult = ActionResult & { firstName?: string; visitNumber?: number };

function databaseFailure(what: string, error: { message: string }): ActionResult {
  console.error(`[signin] couldn't ${what}:`, error.message);
  return actionFailed(`Couldn't ${what}, try again`);
}

// The whole public path runs on the service role, because `anon` has no
// grants and no policies on this project and that is worth keeping. The cost
// is that RLS is not guarding these three functions, so the rule they follow
// is absolute: the event is resolved here, from the clock, and an event id
// coming from the browser is never trusted or even accepted.
async function resolveCurrentEvent(): Promise<SignInEventRow | null> {
  const admin = createAdminClient();
  const now = wallClockNow();

  // Yesterday through tomorrow covers a window that runs past midnight and
  // any disagreement between the server's date and Ithaca's.
  const today = new Date();
  const day = 86_400_000;
  const iso = (d: Date) => d.toISOString().slice(0, 10);

  const { data, error } = await admin
    .from("events")
    .select("id, name, venue, event_date, event_time, event_end_time, has_signin")
    .eq("has_signin", true)
    .gte("event_date", iso(new Date(today.getTime() - day)))
    .lte("event_date", iso(new Date(today.getTime() + day)))
    .returns<SignInEventRow[]>();

  if (error) {
    console.error("[signin] couldn't resolve tonight's event:", error.message);
    return null;
  }

  return pickCurrentEvent(data ?? [], now);
}

export async function getCurrentSignInEvent(): Promise<CurrentEvent | null> {
  const event = await resolveCurrentEvent();
  if (!event) return null;
  // Only what the poster already says. No id: the browser has no use for one,
  // and not sending it is what makes it impossible to send one back.
  return { id: event.id, name: event.name, venue: event.venue };
}

/**
 * Does this email already belong to someone who has signed in before? Used to
 * skip a returning attendee straight past the questions they have already
 * answered.
 *
 * This is unauthenticated, so it does technically answer "is this address
 * known to the club". It only answers at all while a sign in window is open,
 * which bounds that to a few hours a week, and the answer is a first name the
 * person typing the address already knows.
 */
export async function lookupGuest(rawEmail: string): Promise<GuestLookup> {
  const email = normalizeEmail(rawEmail);
  if (!email || !(await resolveCurrentEvent())) return { known: false, fullName: null };

  const admin = createAdminClient();
  const { data } = await admin
    .from("guests")
    .select("full_name")
    .eq("email", email)
    .maybeSingle<{ full_name: string }>();

  return { known: !!data, fullName: data?.full_name ?? null };
}

export async function submitSignIn(input: SignInInput): Promise<SignInResult> {
  const parsed = signInSchema.safeParse(input);
  if (!parsed.success) return actionFailed(parsed.error.issues[0]?.message ?? "Check the form");

  const event = await resolveCurrentEvent();
  if (!event) return actionFailed("Sign in isn't open right now");

  const { fullName, linkedinUrl, background, wantsToMeet, source } = parsed.data;
  const email = normalizeEmail(parsed.data.email);
  const admin = createAdminClient();

  // A member typing their email here gets linked rather than duplicated. It
  // does not record member attendance: that stays on /attendance, which is a
  // deliberate decision and not an oversight.
  const { data: profile } = await admin
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle<{ id: string }>();

  const { data: guest, error: guestError } = await admin
    .from("guests")
    .upsert(
      {
        email,
        full_name: fullName,
        // A returning attendee's blank optional field must not wipe what they
        // gave last time, so nulls are merged away below rather than written.
        ...(linkedinUrl ? { linkedin_url: linkedinUrl } : {}),
        ...(background ? { background } : {}),
        ...(profile ? { profile_id: profile.id } : {}),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "email" },
    )
    .select("id")
    .single<{ id: string }>();

  if (guestError || !guest) {
    return databaseFailure("save your details", guestError ?? { message: "no guest row" });
  }

  const { error: signinError } = await admin
    .from("guest_signins")
    .upsert(
      { guest_id: guest.id, event_id: event.id, wants_to_meet: wantsToMeet, source },
      { onConflict: "guest_id,event_id", ignoreDuplicates: true },
    );

  if (signinError) return databaseFailure("sign you in", signinError);

  const { count } = await admin
    .from("guest_signins")
    .select("id", { count: "exact", head: true })
    .eq("guest_id", guest.id);

  revalidatePath("/signins");
  return { ...actionOk(), firstName: fullName.split(" ")[0], visitNumber: count ?? 1 };
}

/** Members-only. Turns the walk-in sign in on for one event. */
export async function setEventSignIn(eventId: string, enabled: boolean): Promise<ActionResult> {
  await requireRole("edit");

  const supabase = await createClient();
  const { error } = await supabase.from("events").update({ has_signin: enabled }).eq("id", eventId);
  if (error) return databaseFailure("update that event", error);

  revalidatePath("/signins");
  return actionOk();
}
```

Note: the `upsert` on `guests` uses `onConflict: "email"`, which needs a
unique constraint PostgREST can name. The index in Task 2 is on
`lower(email)`, which it cannot. Fix in Task 2's migration by adding a plain
`unique (email)` constraint on the column as well, since the action layer
already normalises before writing. Both are kept: the constraint is what
`onConflict` targets, the functional index is the backstop against a row
inserted by hand.

- [ ] **Step 4: Amend the migration for the named constraint**

Add to `supabase/migrations/0019_guest_signins.sql`, replacing the
`guests_email_idx` line:

```sql
-- Two constraints on purpose. The plain unique is what the upsert in
-- lib/actions/signin.ts names in `onConflict`, which PostgREST can only do
-- for a real constraint. The functional index is the backstop that still
-- catches a differently-cased address inserted by hand.
alter table guests add constraint guests_email_key unique (email);
create unique index guests_email_lower_idx on guests (lower(email));
```

Re-apply the migration against a clean local database.

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors in the new files.

- [ ] **Step 6: Commit**

```bash
git add lib/types/signin.ts lib/validation/signin-schemas.ts lib/actions/signin.ts supabase/migrations/0019_guest_signins.sql
git commit -m "feat: sign in actions resolving the event server side"
```

---

### Task 4: The public sign-in page

**Files:**
- Create: `app/checkin/page.tsx`
- Create: `components/signin/CheckInForm.tsx`
- Modify: `proxy.ts:4` to add `/checkin` to `PUBLIC_PATHS`

**Interfaces:**
- Consumes: `getCurrentSignInEvent`, `lookupGuest`, `submitSignIn` from Task 3.
- Produces: the route a QR code points at. `?kiosk=1` switches to kiosk mode.

- [ ] **Step 1: Make the route public**

```ts
const PUBLIC_PATHS = ["/login", "/auth/callback", "/auth/signout", "/checkin"];
```

`/signins` deliberately does not share this prefix. `PUBLIC_PATHS` is matched
with `startsWith`, so naming the host view `/signin-board` or `/signins` while
the public page is `/signin` would have silently published the guest list.

- [ ] **Step 2: Write the page**

A server component that resolves the event and renders either the form or a
"nothing on tonight" card. It has no layout above it in `app/`, so it renders
its own shell rather than borrowing `AppShell` (which needs a Profile) or the
student layout (which redirects anyone without a Cornell session).

- [ ] **Step 3: Write the form**

Three states: email, details, confirmation. On blur of the email field it
calls `lookupGuest`; a known address skips the name and background fields and
asks only the per-night question. Kiosk mode collects name and email only and
returns to a blank form after two seconds rather than showing a personal
confirmation, because a shared screen must not hold the last person's details.

- [ ] **Step 4: Verify by hand**

```bash
npm run dev
```

Set a local event's `has_signin` and time so its window is open, load
`http://localhost:3000/checkin` in a private window with no session, and
confirm it renders the form rather than redirecting to `/login`.

- [ ] **Step 5: Commit**

```bash
git add app/checkin components/signin/CheckInForm.tsx proxy.ts
git commit -m "feat: public sign in page and kiosk mode"
```

---

### Task 5: The host view

**Files:**
- Create: `app/(app)/signins/page.tsx`
- Create: `components/signin/SignInBoard.tsx`
- Modify: `components/app-shell/AppShell.tsx` to add the nav entry

**Interfaces:**
- Consumes: `setEventSignIn` from Task 3, `SignInBoardRow` / `SignInEventRow` from Task 3's types.

- [ ] **Step 1: Write the page**

Members only, through the existing `(app)` layout. Shows tonight's event with
a live count and the list of who has signed in, each row carrying the visit
number so a host can see this is someone's fourth time. Below that, the next
fortnight of events with a switch each for `has_signin`.

- [ ] **Step 2: Add the nav entry**

Alongside `/attendance` in the edit-or-admin group, since it is the same job
seen from the other side.

- [ ] **Step 3: Verify**

Run: `npm run build`
Expected: the new routes appear in the route list, `/checkin` as a dynamic
route.

- [ ] **Step 4: Commit**

```bash
git add "app/(app)/signins" components/signin/SignInBoard.tsx components/app-shell/AppShell.tsx
git commit -m "feat: host view for tonight's sign ins"
```

---

### Task 6: RLS checks

**Files:**
- Modify: `supabase/tests/rls_check.sql`

- [ ] **Step 1: Add the fixture cleanup**

In the re-runnable cleanup block, before the profiles delete:

```sql
  delete from guest_signins where guest_id in (
    select id from guests where email in ('walkin@example.com', 'member@cornell.edu')
  );
  delete from guests where email in ('walkin@example.com', 'member@cornell.edu');
```

- [ ] **Step 2: Add checks 23 and 24**

```sql
\echo '--- 23. a student cannot read the guest list ---'
do $$
declare v_seen int;
begin
  insert into guests (email, full_name) values ('walkin@example.com', 'Wanda Walkin');
  perform become_outsider('prospect@cornell.edu');
  select count(*) into v_seen from guests;
  reset role;
  if v_seen <> 0 then raise exception 'FAIL: a student saw % guest rows', v_seen; end if;
  raise notice 'PASS: guests are members only';
end $$;

\echo '--- 24. a member reads the guest list but cannot rewrite it ---'
do $$
declare v_seen int;
begin
  perform become('22222222-2222-2222-2222-222222222222', 'member@cornell.edu');
  select count(*) into v_seen from guests;
  begin
    update guests set full_name = 'Tampered' where email = 'walkin@example.com';
    reset role;
    raise exception 'FAIL: a non-admin member rewrote a guest';
  exception when insufficient_privilege then
    reset role;
    raise notice 'PASS: read yes, write no';
  end;
  if v_seen < 1 then raise exception 'FAIL: a member could not read the guest list'; end if;
end $$;
```

- [ ] **Step 3: Run the harness**

First confirm the target is the local stack and not production:

```bash
docker exec supabase_db_cec-dashboard psql -U postgres -d postgres -tAc "select inet_server_addr(), current_database()"
```

Then:

```bash
docker exec -i supabase_db_cec-dashboard psql -U postgres -d postgres < supabase/tests/rls_check.sql
```

Expected: `ALL CHECKS PASSED`.

- [ ] **Step 4: Commit**

```bash
git add supabase/tests/rls_check.sql
git commit -m "test: guest tables are members-read, admin-write"
```

---

## Self-review

**Spec coverage:** identity as typed email (Task 3), guest created once and a
visit per event (Tasks 2 and 3), stable facts on the person and per-night
facts on the visit (Task 2), members not recorded here but linked (Task 3),
service-role public write (Task 3), event resolved from the clock (Task 1),
window open past 7pm (Task 1), `has_signin` (Tasks 2 and 5), public page
(Task 4), kiosk mode (Task 4), host view with history (Task 5), RLS (Tasks 2
and 6), unit tests on window and normalisation (Task 1), duplicate handling
(Tasks 2 and 3).

**Deviation from the spec:** the window closes at `event_end_time` when it is
set. The spec said a flat three hours because it recorded the column as
missing; it exists. Three hours remains the fallback.

**Out of scope, unchanged:** no blacklist, no food-and-leave detection, no
matchmaking (`wants_to_meet` is captured and unread), no recruitment pipeline.

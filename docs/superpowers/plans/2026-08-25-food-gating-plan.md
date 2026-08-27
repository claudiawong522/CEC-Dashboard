# Food Gating Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans.

**Goal:** Release food partway through the event, only to people who signed in before it opened.

**Spec:** `docs/superpowers/specs/2026-08-25-food-gating-design.md`

## Global constraints

- Timings come from the event row. Never hardcode 7:30 or 8:15.
- `foodState()` is pure and unit tested, like `signInWindow()` beside it.
- The public path stays on the service role; no event id or netid is trusted from the browser beyond the typed address.
- No em dashes.

---

### Task 1: `foodState`, pure

**Files:** `lib/utils/signin-window.ts`, `lib/utils/signin-window.test.ts`

Add `foodOpensMinutes(event)` (uses `food_opens_at`, else start + 45) and:

```ts
export type FoodState =
  | { status: "not_yet"; opensAt: number }
  | { status: "open" }
  | { status: "too_late" };   // signed in after food opened

export function foodState(
  event: WindowEvent & { food_opens_at: string | null },
  signedInAtMinutes: number | null,
  nowMinutes: number,
): FoodState
```

Tests: opens exactly at the boundary; someone who signed in a minute before is
`open`; a minute after is `too_late`; before the time is `not_yet`; a null
`food_opens_at` defaults to start + 45.

### Task 2: Migration 0024

```sql
alter table events add column food_opens_at time;
alter table guest_signins add column food_claimed_at timestamptz;
alter table guest_signins add column food_claimed_by uuid references profiles(id);
```

`food_claimed_by` is null for a self-scan and set for a host override, so the two
are distinguishable afterwards. Grant `update` on `guest_signins` to
`service_role` for the claim.

### Task 3: `claimFood` action

**Files:** `lib/actions/signin.ts`

`claimFood(rawEmail)`:
1. Resolve tonight's event server side, as `getCurrentSignInEvent` does.
2. Find the guest and their signin for that event. No signin, refuse.
3. `foodState(...)` must be `open`, else return its reason.
4. `update guest_signins set food_claimed_at = now() where id = ... and food_claimed_at is null`.
   Zero rows means already collected: say when.

Also extend `getCurrentSignInEvent` to return `food_opens_at` so the page can
render the countdown.

### Task 4: `/checkin` states

**Files:** `app/checkin/page.tsx`, `components/signin/CheckInForm.tsx`

Split the confirmation. Signing in gives a plain confirmation plus "food at
8:15". The green pass renders only when `foodState` is `open` and unclaimed.
Remember the netid in `localStorage` (skip on kiosk) so the second scan offers
"Get food" without retyping.

### Task 5: Host override

**Files:** `app/(app)/signins/page.tsx`, `components/signin/SignInBoard.tsx`, `lib/actions/signin.ts`

A "Mark fed" / "Undo" control per row, `requireRole("edit")`, writing
`food_claimed_by`. Show the count fed against the count signed in.

### Task 6: Tests

RLS: a guest cannot set `food_claimed_at`; a member can via the override; the
conditional update prevents a double claim. Plus the `foodState` unit tests from
Task 1.

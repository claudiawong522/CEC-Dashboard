# Food gating

People take the food and leave. Rather than tracking who does it, the food is
released partway through the event and only to people who were already there.

## The rule

Three facts decide whether someone eats, and all three come from rows that
already exist:

1. The event has a food time.
2. Now is at or past it.
3. They signed in **before** that time.

The third is the whole mechanism. Arriving at 8:30 for a 8:15 food release gets
nothing, because the sign in came after food opened. It is one comparison, it is
easy to say out loud at a door, and it needs no list of names.

Deliberately not a rolling "you must have been here 45 minutes" gap. That version
makes a late arrival's eligibility drift with the clock and is harder to explain
when someone argues.

## Timings

The Luma listing for 2026-04-23 gives the real shape: 7:30pm to 9:00pm at eHub
Collegetown, 90 minutes, 81 marked as gone.

- 7:30 doors, sign in opens
- 8:15 food opens, 45 minutes in
- 9:00 event ends, sign in closes

`food_opens_at` is a nullable time on `events`, defaulting to start plus 45
minutes when unset so nobody configures it weekly. It is only meaningful on an
event with `has_signin`.

## Surfaces

One QR, unchanged. `/checkin` gains states rather than routes:

| When | What they see |
| --- | --- |
| Not signed in, before food | The sign in form |
| Signed in, before food | Plain confirmation, and when food opens |
| Signed in, after food, unclaimed | The green pass with their name |
| Already claimed | When they collected, no green |
| Not signed in, after food | Refused, with the reason |

The green screen already exists. Today it fires the moment someone signs in,
which is the wrong moment: it is a food pass being handed out at the door.

**The device remembers them.** A netid in `localStorage` after signing in, so the
8:15 scan is one tap rather than retyping. Cleared on the kiosk, which is shared.

## Anti-cheat, in proportion

**One claim per person per event**, `food_claimed_at` on `guest_signins`, set by
a conditional update so a double tap cannot claim twice. This is what defeats the
obvious attack of screenshotting a friend's green screen: the name is on it, and
the second use reports already collected.

Not attempted: rotating codes, or anything that assumes a determined adversary.
This is a burrito.

**Host override** on `/signins`: mark fed, and undo. Phones die and people forget,
and without this a volunteer has to argue with a freshman instead of running the
event.

## Throughput

81 people through one food table is the practical constraint. The name renders
large enough to check at a glance, and the only state anyone has to think about
is "already collected".

## Out of scope

**Luma matching.** Luma stays the RSVP and reach; the QR stays the record of who
came. Reconciling the two, so no-shows and walk-ins can be counted, is worth
doing and is a separate piece of work starting from a CSV export.

**Walk-ins are fed.** Someone who never registered but signed in and stayed eats.
Flagging them is a Luma-matching concern, not a gate.

**People who leave at 8:35.** The leaving point moves, it does not disappear. The
next lever is making the last half hour worth staying for, which is not software.

# Coffee chat signup and matching

Prospective members stop browsing the member directory and picking someone.
They fill in a form about themselves; members see the requests ranked by fit and
claim the ones they want.

## The problem with what exists

`/matching` shows a prospective member the `chat_directory` view and asks them to
choose. That puts the burden on the person with the least information: someone
who has never met the club is asked to judge which member is worth an hour. It
also needs a Cornell Google login, which is why the whole student tier in 0018
exists.

## Decisions

**Identity is a netid, and it resolves to a guest.** The form takes a netid with
a fixed `@cornell.edu` suffix beside the box, so the address is Cornell by
construction with no login. That netid becomes `<netid>@cornell.edu` and lands in
`guests`, the table Startup Hours already writes to. Someone who scanned the QR
in September and asks for a chat in October is one person with a visit history,
not two records.

Startup Hours itself stays open to anyone. Only this form is Cornell-gated.

**The vocabulary is a fixed list in code.** Members' `profiles.interests` is free
text today, so "Hardware" and "hardware startups" never match. Both sides now
pick from one list. It lives in code rather than an admin table: it changes
about once a semester, and a table plus an admin screen is not worth that.

**Ranking is shared-tag count, nothing cleverer.** The card shows which tags
matched and the prospect's own sentence. The member is doing the choosing, so
the ranking only has to order the list, not make the decision. It is a pure
function and is unit tested. No model call, so the feature does not depend on
`ANTHROPIC_API_KEY`.

**Claiming is a conditional update.** `update ... where claimed_by is null`, so
two members clicking at once produces one winner and one "someone just took
this" rather than a duplicate.

**The chat itself reuses the existing flow.** Claiming does not create a
`coffee_chats` row, because `selfie_url` is `not null` and a claim has no selfie
yet. The member submits through the dialog that already exists when the chat
actually happens, choosing the guest as partner. It then counts toward their
bingo board like any other chat.

**The student tier survives for `/apply` only.** `/matching`, `chat_directory`
and the browse flow go. `getStudent()` stays, because interview booking is where
a verified Google identity earns its keep: a slot booked under someone else's
netid is a real problem, a junk chat request is noise an admin clears.

## Data model

`chat_requests` is altered rather than replaced, since the hosted app may hold
real rows:

- `guest_id` references `guests(id)`, the new identity
- `profile_id` becomes nullable, and stops meaning "who they picked"
- `claimed_by`, `claimed_at`, for the member who took it
- `interests text[]`, the tags they chose
- `status` gains `claimed`

`coffee_chats` gains `partner_guest_id references guests(id)`, `partner_id`
becomes nullable, and exactly one of the two must be set. This follows the
`num_nonnulls` pattern `shoutouts` already uses for its member-or-plain-name
receiver, rather than inventing a second convention.

## Surfaces

**`/chat`**, public, in `PUBLIC_PATHS` beside `/checkin`: netid box with the
suffix, name, interest chips, and one sentence about what they want to talk
about.

**`/chat-requests`**, members only, already exists for exactly this audience. It
stops listing requests addressed to you and becomes the ranked pool: best match
first, matched tags shown, Claim on each.

## Out of scope

No admin table for the vocabulary. No weighted scoring. No aging or nudge view
for unclaimed requests, though that is the failure mode to watch: the risk is
not a bug, it is a request sitting unclaimed for three weeks while someone waits.

## Testing

Unit tests on the ranking function and netid normalisation. RLS checks that the
public path cannot read `chat_requests` or `profiles`, and that a claim cannot be
stolen from another member. A contention test that two claims produce one winner.

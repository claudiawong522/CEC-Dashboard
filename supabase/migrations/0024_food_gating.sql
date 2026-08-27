-- Food gating.
--
-- The problem 0019 named but could not solve: people take the food and leave.
-- The answer is not a blacklist. A blacklist punishes after the fact, needs a
-- maintained list of names, and asks a volunteer to make a judgement at a food
-- table. Releasing the food partway through the event and only to people who
-- were already in the room removes the incentive instead of policing it.
--
-- The rule is one comparison: you may eat if food has opened and you signed in
-- before it did. Turning up at 8:16 for an 8:15 release gets nothing.

-- When food is released. Null means 45 minutes after the doors, which is 8:15
-- for the 7:30 to 9:00 Startup Hours slot, so nobody sets this weekly. Only
-- meaningful on an event with has_signin.
alter table events add column food_opens_at time;

comment on column events.food_opens_at is
  'When food is released to people who signed in before it. Null means 45 '
  'minutes after event_time.';

-- One claim per person per event. The row already exists once they have signed
-- in, so this is an update rather than an insert, and the conditional update in
-- the action is what makes a double tap idempotent.
alter table guest_signins add column food_claimed_at timestamptz;

-- Null for someone who scanned the QR themselves, set when a host marked them
-- fed by hand. Phones die; without an override a volunteer ends up arguing with
-- a freshman instead of running the event. Keeping the two distinguishable
-- means "how many overrides did we do" stays answerable.
alter table guest_signins add column food_claimed_by uuid references profiles(id);

create index guest_signins_food_idx on guest_signins (event_id) where food_claimed_at is not null;

-- The public claim runs through the service role, exactly like the sign in.
grant update on guest_signins to service_role;

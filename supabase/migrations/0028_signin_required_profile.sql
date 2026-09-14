-- Requiring something back from a walk-in.
--
-- The sign in asked for a LinkedIn and a background, both optional, and the
-- result was a guests table that is almost entirely email and name. Optional
-- on a form somebody fills in standing up, on a phone, with a queue behind
-- them, means blank. So the form now asks for them, and keeps asking on later
-- visits until they are filled: whoever signed in during the first weeks is
-- not written off, they are simply asked next time they scan.
--
-- Nothing here is backfilled and nothing is made `not null`. The column can
-- only be enforced at the point somebody is standing in front of the form, and
-- a constraint would take the whole door down over a row that predates it.

-- Where they are from, which is the thing a host most wants to know and the
-- one the form never asked. A year and a major for a student, a company for
-- anybody else, in their own words rather than a dropdown nobody maintains.
alter table guests add column affiliation text;

comment on column guests.affiliation is
  'Free text: "CS ''27" for a student, a company or "not a student" for anyone else. Asked on the sign in, required for new guests and backfilled from returning ones.';

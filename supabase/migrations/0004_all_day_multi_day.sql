-- Events could only ever span a single day with a required time — no way
-- to model an all-day event or one that runs across multiple calendar days
-- (a retreat, a multi-day conference). event_end_date makes the date a
-- range (defaults to a single day); all_day drops the time requirement in
-- the UI (event_time/event_end_time stay populated underneath — see
-- lib/actions/events.ts — so existing NOT NULL/ordering logic elsewhere
-- doesn't need to change).

alter table events add column event_end_date date;
update events set event_end_date = event_date where event_end_date is null;
alter table events alter column event_end_date set not null;

alter table events add column all_day boolean not null default false;

alter table events add constraint events_end_date_after_start_check
  check (event_end_date >= event_date);

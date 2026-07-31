-- A series can end on a fixed date (existing behavior) or after a fixed
-- number of occurrences — end_date becomes optional, occurrence_count is
-- new, and ends_mode says which one to honor.

alter table recurring_series alter column end_date drop not null;
alter table recurring_series add column ends_mode text not null default 'date' check (ends_mode in ('date', 'count'));
alter table recurring_series add column occurrence_count int;

alter table recurring_series add constraint recurring_series_ends_mode_check
  check (
    (ends_mode = 'date' and end_date is not null) or
    (ends_mode = 'count' and occurrence_count is not null)
  );

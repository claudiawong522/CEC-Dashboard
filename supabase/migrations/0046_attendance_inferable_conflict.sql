-- Make recording attendance for an event actually work.
--
-- 0031 created the uniqueness as a PARTIAL index:
--
--   create unique index attendance_member_event_idx
--     on attendance (profile_id, event_id) where event_id is not null;
--
-- lib/actions/attendance.ts then upserts with
-- `onConflict: "profile_id,event_id"`. Postgres cannot infer a partial index
-- from a bare column list, and PostgREST has no way to send the predicate, so
-- every event-linked upsert fails with 42P10 "there is no unique or exclusion
-- constraint matching the ON CONFLICT specification" and writes nothing.
-- Recording attendance for an event has never once worked.
--
-- The predicate was never needed. A plain unique index already allows any
-- number of rows with a null event_id, because nulls are not equal to each
-- other, which is the same behaviour the partial index was reaching for and
-- the same behaviour attendance.ts documents in its own comment for the
-- no-event branch. Dropping the predicate changes nothing about what is
-- allowed and makes the index inferable.

drop index if exists attendance_member_event_idx;

create unique index attendance_member_event_idx
  on attendance (profile_id, event_id);

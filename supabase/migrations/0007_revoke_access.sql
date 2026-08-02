-- Removing someone's access, without deleting them.
--
-- A hard delete isn't available here: profiles.id references auth.users(id)
-- on delete cascade, and almost everything else references profiles(id) with
-- no on-delete clause at all (events.created_by, files.uploaded_by,
-- notes.updated_by, external_ideas.created_by, event_tagged_members.tagged_by,
-- profiles.invited_by). So deleting the auth user cascades into the profile
-- row and immediately trips those RESTRICTs for anyone who has ever created
-- an event, uploaded a file or invited someone — i.e. every real member.
-- Forcing it through would mean either destroying the work they authored or
-- orphaning the attribution on it.
--
-- 'revoked' keeps the row (so "created by" still resolves to a name) while
-- getSession() refuses to build a session for them, which drops them out of
-- every page and server action. See lib/auth/getSession.ts.
-- `if exists` so re-running this is harmless. profiles_status_check is
-- Postgres's own default name for the check that 0006 attached to the status
-- column; if a hand-edit ever renamed it, this drop quietly does nothing and
-- the old constraint keeps rejecting 'revoked' — which surfaces immediately
-- as an error the first time an admin tries to remove someone.
alter table profiles
  drop constraint if exists profiles_status_check;

alter table profiles
  add constraint profiles_status_check
  check (status in ('invited', 'active', 'revoked'));

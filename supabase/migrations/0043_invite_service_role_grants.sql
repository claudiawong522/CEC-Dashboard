-- The invite flow could never run on a local stack.
--
-- lib/actions/admin.ts creates, revives and deletes profiles rows through the
-- service role, because writing another person's profile is outside what the
-- caller's own RLS allows. Supabase Cloud grants service_role those privileges
-- through default privileges, so production has always worked; the local image
-- does not, so `Send invite` answered "Couldn't send invite" with
-- "permission denied for table profiles" in the log and nothing else.
--
-- That is why this flow sat untested: it was not broken, it was untestable.
-- 0019 already established that the privileges this app actually depends on
-- belong in a migration rather than inherited silently, so these follow.
grant insert, update, delete on profiles to service_role;

-- There is no separate invites table: an invite is a profiles row at status
-- 'invited', which is why the grant above is the whole of it. Reviving a
-- removed member updates that row, and revoking a pending one deletes it.

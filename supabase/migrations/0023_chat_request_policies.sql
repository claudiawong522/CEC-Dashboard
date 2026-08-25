-- Fixing what 0022 left behind on chat_requests.
--
-- 0022 tried to drop the student-era policies by name and guessed two of them
-- wrong. `drop policy if exists` on a name that does not exist is a no-op with
-- a notice, so the old rules survived silently. Policies are permissive and
-- OR'd together, which means one stale policy is enough to keep a door open:
-- the RLS harness caught a prospective member still reading the request pool.
--
-- The real names, from pg_policies rather than from memory this time.
drop policy if exists "chat_requests_select_own_student" on chat_requests;
drop policy if exists "chat_requests_select_member_or_admin" on chat_requests;
drop policy if exists "chat_requests_update_member_or_admin" on chat_requests;

-- 0022 also left only an admin UPDATE policy, which would have stopped an
-- ordinary member claiming anything at all: the whole feature, refused by RLS.
--
-- USING picks which rows a member may touch: one nobody has taken, or one they
-- are holding. WITH CHECK constrains the row they leave behind, so a claim can
-- only ever name themselves and a release can only clear it. Between them, a
-- member cannot assign a request to someone else or take one out of another
-- member's hands.
create policy "chat_requests_claim_member"
  on chat_requests for update to authenticated
  using (
    app_user_role() in ('edit', 'admin')
    and (claimed_by is null or claimed_by = auth.uid())
  )
  with check (
    app_user_role() in ('edit', 'admin')
    and (claimed_by is null or claimed_by = auth.uid())
  );

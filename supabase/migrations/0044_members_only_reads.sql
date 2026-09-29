-- Close the tier 0039 opened.
--
-- 0039 introduced a second kind of authenticated caller: a signed-in Cornell
-- account with no profiles row. Its own comment states the danger exactly:
-- "0001's profiles select policy is `using (true)` for anyone authenticated.
-- Members are the only authenticated callers today, so that is currently fine.
-- The moment a non-member can hold a session, it hands them the entire
-- directory." It then fixed that one table and shipped.
--
-- Nineteen other select policies have the same shape and were not fixed.
-- Verified by impersonating a JWT with no profiles row: app_user_role() is
-- null, profiles correctly returns nothing, and every table below returns
-- everything. Including the club's brain notes, and a club-visible speaker
-- read back in full as name, email and company.
--
-- This is not only a student-tier problem. Anyone who signs in with Google
-- before being invited is bounced to /login?error=not_invited by
-- app/auth/callback, but Google has already minted them a session by then, and
-- that session is a perfectly good bearer token against PostgREST. Two such
-- accounts exist on production today.
--
-- app_user_role() reads the caller's own profiles row, so it is null exactly
-- when the caller is not a member. Every existing member is unaffected.
--
-- interview_slots is deliberately NOT in here: the student tier books
-- interviews, and 0036 already gates it on the cycle's approved netids.

-- ---------------------------------------------------------------------------
-- 1. The fifteen that were flatly `using (true)`
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
  tables text[] := array[
    'events', 'event_speaker', 'event_attendees', 'event_money', 'event_food',
    'event_marketing', 'event_marketing_custom_items', 'event_recurring',
    'event_files', 'event_tagged_members', 'recurring_series',
    'attendance', 'shoutouts', 'coffee_chat_categories', 'organizations'
  ];
begin
  foreach t in array tables loop
    execute format('drop policy if exists %I on %I', t || '_select_authenticated', t);
    execute format(
      'create policy %I on %I for select to authenticated using (app_user_role() is not null)',
      t || '_select_members', t
    );
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- 2. The four that gated on a data column but never on membership
-- ---------------------------------------------------------------------------
-- These already decide *which* rows a caller sees. What they never asked is
-- whether the caller is a member at all, so "visible to the club" was in
-- practice visible to anyone holding a session.

drop policy if exists "brain_notes_select_by_visibility" on brain_notes;
create policy "brain_notes_select_by_visibility"
  on brain_notes for select to authenticated
  using (
    app_user_role() is not null
    and (visibility = 'club' or app_user_role() = 'admin')
  );

drop policy if exists "outreach_contacts_select_by_visibility" on outreach_contacts;
create policy "outreach_contacts_select_by_visibility"
  on outreach_contacts for select to authenticated
  using (
    app_user_role() is not null
    and (visibility = 'club' or app_user_role() = 'admin')
  );

drop policy if exists "interactions_select_by_contact_visibility" on interactions;
create policy "interactions_select_by_contact_visibility"
  on interactions for select to authenticated
  using (
    app_user_role() is not null
    and exists (
      select 1 from outreach_contacts c
      where c.id = interactions.contact_id
        and (c.visibility = 'club' or app_user_role() = 'admin')
    )
  );

-- A coffee chat names two people and carries a photo of them. The submitter
-- and partner clauses already imply a profiles row, but `status = 'approved'`
-- did not, and that is the clause that matched everything.
drop policy if exists "coffee_chats_select_own_approved_or_admin" on coffee_chats;
create policy "coffee_chats_select_own_approved_or_admin"
  on coffee_chats for select to authenticated
  using (
    app_user_role() is not null
    and (
      status = 'approved'
      or submitter_id = auth.uid()
      or partner_id = auth.uid()
      or app_user_role() = 'admin'
    )
  );

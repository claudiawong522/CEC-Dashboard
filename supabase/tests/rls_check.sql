-- Verifies the access rules added by 0009-0015 by acting as real callers.
-- Runs as the `authenticated` role with a JWT claim set, which is exactly how
-- PostgREST executes a request, so the policies are exercised, not described.
\set ON_ERROR_STOP on


-- Local-stack only. Supabase Cloud grants DML on public tables to anon/
-- authenticated through default privileges; this local image does not, and
-- it withholds them from the pre-existing tables (profiles, events) exactly
-- as it does from the new ones. Granting here keeps the harness testing the
-- RLS policies, which is the thing under test, rather than a local grant
-- quirk. Deliberately NOT in a migration: her existing tables don't carry
-- grants either, and adding them for only the new tables would diverge.
grant select, insert, update, delete on all tables in schema public to authenticated;

-- Two members and one outsider. auth.users rows first, since profiles.id
-- references them.
insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
values
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin@cornell.edu', '', now(), now(), now()),
  ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'member@cornell.edu', '', now(), now(), now());

insert into profiles (id, email, full_name, role, status, open_to_chats, chat_blurb)
values
  ('11111111-1111-1111-1111-111111111111', 'admin@cornell.edu', 'Ada Admin', 'admin', 'active', false, null),
  -- Opted in, because 0018 refuses a chat request aimed at someone who isn't.
  ('22222222-2222-2222-2222-222222222222', 'member@cornell.edu', 'Mo Member', 'edit', 'active', true, 'Happy to talk hardware.');

create or replace function become(p_user uuid, p_email text) returns void language plpgsql as $$
begin
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims',
    json_build_object('sub', p_user, 'role', 'authenticated', 'email', p_email)::text, true);
end $$;

create or replace function become_outsider(p_email text) returns void language plpgsql as $$
begin
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims',
    json_build_object('sub', '33333333-3333-3333-3333-333333333333', 'role', 'authenticated', 'email', p_email)::text, true);
end $$;

\echo '--- 1. a member cannot promote themselves to admin ---'
do $$
begin
  perform become('22222222-2222-2222-2222-222222222222', 'member@cornell.edu');
  begin
    update profiles set role = 'admin' where id = '22222222-2222-2222-2222-222222222222';
    raise exception 'FAIL: member escalated to admin';
  exception when raise_exception then
    if sqlerrm like 'FAIL:%' then raise; end if;
    raise notice 'PASS: blocked (%)', sqlerrm;
  end;
  reset role;
end $$;

\echo '--- 2. a member CAN edit their own bio ---'
do $$
declare v_about text;
begin
  perform become('22222222-2222-2222-2222-222222222222', 'member@cornell.edu');
  update profiles set about = 'builds robots' where id = '22222222-2222-2222-2222-222222222222';
  select about into v_about from profiles where id = '22222222-2222-2222-2222-222222222222';
  reset role;
  if v_about is distinct from 'builds robots' then raise exception 'FAIL: own bio not saved'; end if;
  raise notice 'PASS: own bio saved';
end $$;

\echo '--- 3. a member cannot edit someone else''s bio ---'
do $$
declare v_rows int;
begin
  perform become('22222222-2222-2222-2222-222222222222', 'member@cornell.edu');
  update profiles set about = 'hacked' where id = '11111111-1111-1111-1111-111111111111';
  get diagnostics v_rows = ROW_COUNT;
  reset role;
  if v_rows <> 0 then raise exception 'FAIL: wrote to another profile'; end if;
  raise notice 'PASS: 0 rows touched';
end $$;

\echo '--- 4. a signed-in non-member is the student tier: no role, can request a chat ---'
do $$
declare v_role text; v_rows int;
begin
  perform become_outsider('prospect@cornell.edu');
  select app_user_role() into v_role;
  if v_role is not null then raise exception 'FAIL: outsider resolved a role: %', v_role; end if;

  insert into chat_requests (student_email, student_name, prompt, profile_id)
  values ('prospect@cornell.edu', 'Pat Prospect', 'How do I join?', '22222222-2222-2222-2222-222222222222');
  get diagnostics v_rows = ROW_COUNT;
  reset role;
  if v_rows <> 1 then raise exception 'FAIL: student could not request a chat'; end if;
  raise notice 'PASS: app_user_role() is null and the request landed';
end $$;

\echo '--- 5. a student cannot request a chat in someone else''s name ---'
do $$
begin
  perform become_outsider('prospect@cornell.edu');
  begin
    insert into chat_requests (student_email, student_name, prompt, profile_id)
    values ('someone.else@cornell.edu', 'Not Them', 'hi', '22222222-2222-2222-2222-222222222222');
    raise exception 'FAIL: student impersonated another student';
  exception when insufficient_privilege then
    raise notice 'PASS: blocked by RLS';
  end;
  reset role;
end $$;

\echo '--- 6. a student cannot accept their own chat request ---'
do $$
declare v_rows int;
begin
  perform become_outsider('prospect@cornell.edu');
  update chat_requests set status = 'accepted' where student_email = 'prospect@cornell.edu';
  get diagnostics v_rows = ROW_COUNT;
  reset role;
  if v_rows <> 0 then raise exception 'FAIL: student accepted their own request'; end if;
  raise notice 'PASS: 0 rows touched';
end $$;

\echo '--- 7. a member cannot approve their own coffee chat ---'
do $$
declare v_cat uuid; v_rows int;
begin
  insert into coffee_chat_categories (name, semester, board_position)
  values ('Another subteam', 'F26', 0) returning id into v_cat;

  perform become('22222222-2222-2222-2222-222222222222', 'member@cornell.edu');
  insert into coffee_chats (submitter_id, partner_id, category_id, selfie_url, semester)
  values ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', v_cat, 'p/1.jpg', 'F26');

  update coffee_chats set status = 'approved' where submitter_id = '22222222-2222-2222-2222-222222222222';
  get diagnostics v_rows = ROW_COUNT;
  reset role;
  if v_rows <> 0 then raise exception 'FAIL: member self-approved'; end if;
  raise notice 'PASS: 0 rows touched';
end $$;

\echo '--- 8. an exec-only CRM contact is invisible to a non-admin ---'
do $$
declare v_seen int;
begin
  insert into outreach_contacts (name, type, visibility) values ('Secret Speaker', 'speaker', 'exec');
  insert into outreach_contacts (name, type, visibility) values ('Public Alum', 'speaker', 'club');

  perform become('22222222-2222-2222-2222-222222222222', 'member@cornell.edu');
  select count(*) into v_seen from outreach_contacts;
  reset role;
  if v_seen <> 1 then raise exception 'FAIL: member saw % contacts, expected 1', v_seen; end if;
  raise notice 'PASS: member sees only the club-visible contact';
end $$;

\echo '--- 9. an unapproved netid cannot claim an interview slot ---'
do $$
declare v_cycle uuid; v_slot uuid; v_rows int;
begin
  insert into interview_cycles (name, approved_netids, is_active)
  values ('Fall 26', array['ok123'], true) returning id into v_cycle;
  insert into interview_slots (cycle_id, start_time, end_time)
  values (v_cycle, now() + interval '1 day', now() + interval '1 day 30 minutes') returning id into v_slot;

  perform become_outsider('nope999@cornell.edu');
  update interview_slots set applicant_netid = 'nope999', is_claimed = true where id = v_slot;
  get diagnostics v_rows = ROW_COUNT;
  reset role;
  if v_rows <> 0 then raise exception 'FAIL: unapproved applicant claimed a slot'; end if;
  raise notice 'PASS: 0 rows touched';
end $$;

\echo '--- 10. an approved netid CAN claim, and cannot claim it for someone else ---'
do $$
declare v_slot uuid; v_rows int;
begin
  select id into v_slot from interview_slots limit 1;

  perform become_outsider('ok123@cornell.edu');
  begin
    update interview_slots set applicant_netid = 'someoneelse', is_claimed = true where id = v_slot;
    raise exception 'FAIL: claimed a slot under a different netid';
  exception when insufficient_privilege then
    raise notice 'PASS: cannot claim under another netid';
  end;

  update interview_slots set applicant_netid = 'ok123', is_claimed = true where id = v_slot;
  get diagnostics v_rows = ROW_COUNT;
  reset role;
  if v_rows <> 1 then raise exception 'FAIL: approved applicant could not claim'; end if;
  raise notice 'PASS: approved applicant claimed the slot';
end $$;

\echo '--- 11. an interaction moves its contact''s last_touched_at forward only ---'
do $$
declare v_contact uuid; v_touched timestamptz;
begin
  select id into v_contact from outreach_contacts where name = 'Public Alum';
  insert into interactions (contact_id, profile_id, kind, occurred_at, summary)
  values (v_contact, '11111111-1111-1111-1111-111111111111', 'email', '2026-06-01', 'first note');
  insert into interactions (contact_id, profile_id, kind, occurred_at, summary)
  values (v_contact, '11111111-1111-1111-1111-111111111111', 'email', '2026-01-01', 'backfilled older note');

  select last_touched_at into v_touched from outreach_contacts where id = v_contact;
  if v_touched::date <> date '2026-06-01' then
    raise exception 'FAIL: last_touched_at went backwards to %', v_touched;
  end if;
  raise notice 'PASS: stayed at the newer interaction';
end $$;

\echo '--- 12. brain-note full text search finds a note by a stemmed word ---'
do $$
declare v_hits int;
begin
  insert into brain_notes (kind, title, body, visibility)
  values ('retro', 'Demo Day retrospective', 'The projector failed and we lost twenty minutes.', 'club');

  select count(*) into v_hits from brain_notes
  where search_vector @@ websearch_to_tsquery('english', 'projectors failing');
  if v_hits <> 1 then raise exception 'FAIL: search returned % rows', v_hits; end if;
  raise notice 'PASS: stemmed search matched';
end $$;

\echo '--- 13. a contact can only be named once on the same pitch ---'
do $$
declare v_idea uuid; v_contact uuid;
begin
  insert into external_ideas (pitch) values ('Panel on hardware startups') returning id into v_idea;
  select id into v_contact from outreach_contacts where name = 'Secret Speaker';

  insert into external_idea_people (idea_id, contact_id) values (v_idea, v_contact);
  begin
    insert into external_idea_people (idea_id, contact_id) values (v_idea, v_contact);
    raise exception 'FAIL: same contact added to a pitch twice';
  exception when unique_violation then
    raise notice 'PASS: blocked by the unique index';
  end;
end $$;

\echo '--- 14. taking someone off a pitch keeps the contact and their history ---'
do $$
declare v_contact uuid; v_still int; v_interactions int;
begin
  select c.id into v_contact from outreach_contacts c where c.name = 'Secret Speaker';
  insert into interactions (contact_id, profile_id, kind, occurred_at, summary)
  values (v_contact, '11111111-1111-1111-1111-111111111111', 'email', now(), 'asked about the panel');

  delete from external_idea_people where contact_id = v_contact;

  select count(*) into v_still from outreach_contacts where id = v_contact;
  select count(*) into v_interactions from interactions where contact_id = v_contact;
  if v_still <> 1 then raise exception 'FAIL: contact was destroyed with the link'; end if;
  if v_interactions <> 1 then raise exception 'FAIL: history was destroyed'; end if;
  raise notice 'PASS: contact and timeline survived';
end $$;

\echo '--- 15. the editor document keeps the searchable body in sync ---'
do $$
declare v_note uuid; v_body text; v_hits int;
begin
  insert into brain_notes (kind, title, body, content, visibility)
  values (
    'note', 'Sponsorship playbook', '',
    '[{"type":"paragraph","content":[{"type":"text","text":"Ask sponsors in August."}]},
      {"type":"bulletListItem","content":[{"type":"text","text":"Catering quotes need two weeks."}]}]'::jsonb,
    'club'
  ) returning id into v_note;

  select body into v_body from brain_notes where id = v_note;
  if v_body not like '%Ask sponsors in August.%' then
    raise exception 'FAIL: body not derived from the document, got %', v_body;
  end if;
  -- Nested blocks count too, not just top-level paragraphs.
  if v_body not like '%Catering quotes need two weeks.%' then
    raise exception 'FAIL: nested block text was dropped, got %', v_body;
  end if;

  -- And the search index followed it, without the app flattening anything.
  select count(*) into v_hits from brain_notes
  where id = v_note and search_vector @@ websearch_to_tsquery('english', 'catering quote');
  if v_hits <> 1 then raise exception 'FAIL: derived body is not searchable'; end if;

  -- Editing the document rewrites the body rather than leaving the old text.
  update brain_notes
  set content = '[{"type":"paragraph","content":[{"type":"text","text":"Ask sponsors in June instead."}]}]'::jsonb
  where id = v_note;
  select body into v_body from brain_notes where id = v_note;
  if v_body like '%August%' then raise exception 'FAIL: stale body survived an edit'; end if;
  raise notice 'PASS: body tracks the document, including on edit';
end $$;

\echo '--- 16. the club doc survived the move and is still shared-editable ---'
do $$
declare v_kind text; v_rows int;
begin
  select kind into v_kind from brain_notes where id = '00000000-0000-0000-0000-000000000002';
  if v_kind is distinct from 'doc' then raise exception 'FAIL: club doc missing after 0017'; end if;

  -- An edit-role member is not its author, and 0012's policy is
  -- author-or-admin, so without the shared-doc policy this writes 0 rows.
  perform become('22222222-2222-2222-2222-222222222222', 'member@cornell.edu');
  update brain_notes
  set content = '[{"type":"paragraph","content":[{"type":"text","text":"Everyone can write here."}]}]'::jsonb
  where id = '00000000-0000-0000-0000-000000000002';
  get diagnostics v_rows = ROW_COUNT;
  reset role;

  if v_rows <> 1 then raise exception 'FAIL: an edit member could not write to the shared doc'; end if;
  raise notice 'PASS: club doc is a brain note and stayed shared-editable';
end $$;

\echo '--- 17. a member still cannot edit someone else''s retro ---'
do $$
declare v_note uuid; v_rows int;
begin
  insert into brain_notes (author_id, kind, title, body, visibility)
  values ('11111111-1111-1111-1111-111111111111', 'retro', 'Demo Day retro', 'went fine', 'club')
  returning id into v_note;

  perform become('22222222-2222-2222-2222-222222222222', 'member@cornell.edu');
  update brain_notes set title = 'hijacked' where id = v_note;
  get diagnostics v_rows = ROW_COUNT;
  reset role;

  if v_rows <> 0 then raise exception 'FAIL: the shared-doc policy leaked to retros'; end if;
  raise notice 'PASS: 0 rows touched';
end $$;

\echo '--- 18. a student cannot read the members table at all ---'
do $$
declare v_seen int;
begin
  perform become_outsider('prospect@cornell.edu');
  select count(*) into v_seen from profiles;
  reset role;
  -- Before 0018 this returned every member, with their emails and netids.
  if v_seen <> 0 then raise exception 'FAIL: student read % profiles rows', v_seen; end if;
  raise notice 'PASS: 0 rows visible';
end $$;

\echo '--- 19. a student CAN read the opted-in directory, and it has no email ---'
do $$
declare v_seen int; v_has_email boolean;
begin
  perform become_outsider('prospect@cornell.edu');
  select count(*) into v_seen from chat_directory;
  reset role;

  if v_seen <> 1 then raise exception 'FAIL: directory showed % members, expected 1', v_seen; end if;

  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'chat_directory'
      and column_name in ('email', 'netid')
  ) into v_has_email;
  if v_has_email then raise exception 'FAIL: chat_directory exposes email or netid'; end if;
  raise notice 'PASS: one opted-in member, no contact details';
end $$;

\echo '--- 20. a student cannot ask a member who never opted in ---'
do $$
begin
  perform become_outsider('prospect@cornell.edu');
  begin
    insert into chat_requests (student_email, student_name, prompt, profile_id)
    values ('prospect@cornell.edu', 'Pat', 'hi', '11111111-1111-1111-1111-111111111111');
    raise exception 'FAIL: request landed on a member who is not open to chats';
  exception when insufficient_privilege then
    raise notice 'PASS: blocked by RLS';
  end;
  reset role;
end $$;

\echo '--- 21. a signed-in non-Cornell account is not the student tier ---'
do $$
begin
  perform become_outsider('someone@gmail.com');
  begin
    insert into chat_requests (student_email, student_name, prompt, profile_id)
    values ('someone@gmail.com', 'Rando', 'let me in', '22222222-2222-2222-2222-222222222222');
    raise exception 'FAIL: a non-Cornell account created a chat request';
  exception when insufficient_privilege then
    raise notice 'PASS: blocked by RLS';
  end;
  reset role;
end $$;

\echo '--- 22. a student cannot ask the same member twice while one is open ---'
do $$
begin
  perform become_outsider('prospect@cornell.edu');
  begin
    -- Check 4 already created a pending request to this member.
    insert into chat_requests (student_email, student_name, prompt, profile_id)
    values ('prospect@cornell.edu', 'Pat Prospect', 'again?', '22222222-2222-2222-2222-222222222222');
    raise exception 'FAIL: duplicate open request allowed';
  exception when unique_violation then
    raise notice 'PASS: blocked by the partial unique index';
  end;
  reset role;
end $$;

\echo 'ALL CHECKS PASSED'

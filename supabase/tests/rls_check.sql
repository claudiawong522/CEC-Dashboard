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

-- Re-runnable: clear anything a previous run left behind, in dependency
-- order. Several tables reference profiles(id) with no on-delete rule (that is
-- deliberate — it is why removing a member is a revoke rather than a delete),
-- so the rows pointing at the fixtures have to go before the fixtures do.
do $$
declare
  v_fixtures uuid[] := array[
    '11111111-1111-4111-8111-111111111111'::uuid,
    '22222222-2222-4222-8222-222222222222'::uuid
  ];
begin
  delete from interactions where profile_id = any(v_fixtures);
  delete from interactions where contact_id in (
    select id from outreach_contacts where name in ('Secret Speaker', 'Public Alum')
  );
  delete from guest_signins where event_id in (select id from events where name = 'RLS Food Night');
  delete from events where name = 'RLS Food Night';
  delete from guest_signins where guest_id in (
    select id from guests where email in ('walkin@example.com', 'member@cornell.edu', 'prospect@cornell.edu')
  );
  delete from guests where email in ('walkin@example.com', 'member@cornell.edu', 'prospect@cornell.edu');
  delete from ask_logs where profile_id = any(v_fixtures);
  delete from attendance where profile_id = any(v_fixtures) or recorded_by = any(v_fixtures);
  delete from shoutouts where giver_id = any(v_fixtures) or receiver_id = any(v_fixtures);
  delete from coffee_chats where submitter_id = any(v_fixtures) or partner_id = any(v_fixtures)
     or partner_guest_id in (select id from guests where email = 'prospect@cornell.edu');
  delete from coffee_chat_categories where name = 'Another subteam';
  delete from chat_requests where student_email = 'prospect@cornell.edu'
     or profile_id = any(v_fixtures) or claimed_by = any(v_fixtures);
  delete from brain_notes
    where title in ('Demo Day retrospective', 'Sponsorship playbook', 'Demo Day retro');
  delete from external_idea_people where idea_id in (
    select id from external_ideas where pitch = 'Panel on hardware startups'
  );
  delete from external_ideas where pitch = 'Panel on hardware startups';
  delete from interview_slots where cycle_id in (
    select id from interview_cycles where name = 'Fall 26'
  );
  delete from interview_cycles where name = 'Fall 26';
  delete from outreach_contacts where name in ('Secret Speaker', 'Public Alum');
  -- profiles cascades from auth.users.
  delete from auth.users where id = any(v_fixtures);
end $$;

-- Two members and one outsider. auth.users rows first, since profiles.id
-- references them.
--
-- The ids are real version-4 UUIDs (note the `4` and `8` nibbles) rather than
-- the more readable all-ones/all-twos. Zod 4's .uuid() enforces the RFC 4122
-- version and variant bits, so a fixture like 1111-1111-1111 is rejected by
-- every schema in lib/validation the moment one of these rows reaches a form
-- picker -- which they do, because this harness clears its fixtures at the
-- start of a run rather than the end, leaving them in the local database.
insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
values
  ('11111111-1111-4111-8111-111111111111', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin@cornell.edu', '', now(), now(), now()),
  ('22222222-2222-4222-8222-222222222222', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'member@cornell.edu', '', now(), now(), now());

insert into profiles (id, email, full_name, role, status, open_to_chats, chat_blurb)
values
  ('11111111-1111-4111-8111-111111111111', 'admin@cornell.edu', 'Ada Admin', 'admin', 'active', false, null),
  -- Opted in, because 0018 refuses a chat request aimed at someone who isn't.
  ('22222222-2222-4222-8222-222222222222', 'member@cornell.edu', 'Mo Member', 'edit', 'active', true, 'Happy to talk hardware.');

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
    json_build_object('sub', '33333333-3333-4333-8333-333333333333', 'role', 'authenticated', 'email', p_email)::text, true);
end $$;

\echo '--- 1. a member cannot promote themselves to admin ---'
do $$
begin
  perform become('22222222-2222-4222-8222-222222222222', 'member@cornell.edu');
  begin
    update profiles set role = 'admin' where id = '22222222-2222-4222-8222-222222222222';
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
  perform become('22222222-2222-4222-8222-222222222222', 'member@cornell.edu');
  update profiles set about = 'builds robots' where id = '22222222-2222-4222-8222-222222222222';
  select about into v_about from profiles where id = '22222222-2222-4222-8222-222222222222';
  reset role;
  if v_about is distinct from 'builds robots' then raise exception 'FAIL: own bio not saved'; end if;
  raise notice 'PASS: own bio saved';
end $$;

\echo '--- 3. a member cannot edit someone else''s bio ---'
do $$
declare v_rows int;
begin
  perform become('22222222-2222-4222-8222-222222222222', 'member@cornell.edu');
  update profiles set about = 'hacked' where id = '11111111-1111-4111-8111-111111111111';
  get diagnostics v_rows = ROW_COUNT;
  reset role;
  if v_rows <> 0 then raise exception 'FAIL: wrote to another profile'; end if;
  raise notice 'PASS: 0 rows touched';
end $$;

\echo '--- 4. a prospective member cannot write a chat request through RLS ---'
do $$
declare v_role text; v_guest uuid;
begin
  perform become_outsider('prospect@cornell.edu');
  select app_user_role() into v_role;
  reset role;
  if v_role is not null then raise exception 'FAIL: outsider resolved a role: %', v_role; end if;

  insert into guests (email, full_name) values ('prospect@cornell.edu', 'Pat Prospect')
    on conflict (email) do update set full_name = excluded.full_name
    returning id into v_guest;

  -- Signup is a public form with no session at all, so it writes through the
  -- service role exactly like the Startup Hours sign in. Nobody holding a
  -- session should be able to insert here, student tier included.
  perform become_outsider('prospect@cornell.edu');
  begin
    insert into chat_requests (guest_id, student_email, student_name, prompt, interests)
    values (v_guest, 'prospect@cornell.edu', 'Pat Prospect', 'How do I join?', array['hardware']);
    raise exception 'FAIL: a signed-in outsider inserted a chat request';
  exception when insufficient_privilege then
    raise notice 'PASS: app_user_role() is null and RLS refused the insert';
  end;
  reset role;

  -- Seed the row the later checks read, as the owner.
  insert into chat_requests (guest_id, student_email, student_name, prompt, interests)
  values (v_guest, 'prospect@cornell.edu', 'Pat Prospect', 'How do I join?', array['hardware', 'climate']);
end $$;

\echo '--- 5. a prospective member cannot read the request pool ---'
do $$
declare v_seen int;
begin
  perform become_outsider('prospect@cornell.edu');
  select count(*) into v_seen from chat_requests;
  reset role;
  if v_seen <> 0 then raise exception 'FAIL: an outsider saw % requests', v_seen; end if;
  raise notice 'PASS: the pool is members only';
end $$;

\echo '--- 6a. an ordinary member CAN claim an open request ---'
do $$
declare v_rows int; v_id uuid;
begin
  select id into v_id from chat_requests where student_email = 'prospect@cornell.edu';

  -- The check that would have caught 0022 shipping an admin-only UPDATE
  -- policy: claiming is the entire feature, and an 'edit' member does it.
  perform become('22222222-2222-4222-8222-222222222222', 'member@cornell.edu');
  update chat_requests
     set claimed_by = '22222222-2222-4222-8222-222222222222',
         claimed_at = now(), status = 'claimed'
   where id = v_id and claimed_by is null;
  get diagnostics v_rows = ROW_COUNT;
  reset role;

  if v_rows <> 1 then raise exception 'FAIL: a member could not claim an open request'; end if;
  raise notice 'PASS: claimed';

  -- Put it back so the next check starts from an open request.
  update chat_requests set claimed_by = null, claimed_at = null, status = 'pending' where id = v_id;
end $$;

\echo '--- 6b. a member cannot claim a request on someone else''s behalf ---'
do $$
declare v_id uuid;
begin
  select id into v_id from chat_requests where student_email = 'prospect@cornell.edu';
  perform become('22222222-2222-4222-8222-222222222222', 'member@cornell.edu');
  -- Refused rather than filtered: USING decides which rows are visible to the
  -- update, WITH CHECK inspects the row it would leave behind, and failing
  -- that raises instead of quietly matching nothing.
  begin
    update chat_requests
       set claimed_by = '11111111-1111-4111-8111-111111111111',
           claimed_at = now(), status = 'claimed'
     where id = v_id and claimed_by is null;
    reset role;
    raise exception 'FAIL: a member assigned a request to someone else';
  exception when insufficient_privilege then
    raise notice 'PASS: blocked by RLS';
  end;
  reset role;
end $$;

\echo '--- 6. a member cannot steal a request another member claimed ---'
do $$
declare v_rows int; v_id uuid;
begin
  select id into v_id from chat_requests where student_email = 'prospect@cornell.edu';

  -- Ada claims it first, the way the server action does.
  update chat_requests
     set claimed_by = '11111111-1111-4111-8111-111111111111',
         claimed_at = now(), status = 'claimed'
   where id = v_id and claimed_by is null;

  -- Mo tries to take it. The `claimed_by is null` filter is the whole
  -- concurrency story: the second writer matches no rows rather than
  -- overwriting the first.
  perform become('22222222-2222-4222-8222-222222222222', 'member@cornell.edu');
  update chat_requests
     set claimed_by = '22222222-2222-4222-8222-222222222222'
   where id = v_id and claimed_by is null;
  get diagnostics v_rows = ROW_COUNT;
  reset role;

  if v_rows <> 0 then raise exception 'FAIL: a claimed request was stolen'; end if;
  raise notice 'PASS: 0 rows touched';
end $$;

\echo '--- 7. a member cannot approve their own coffee chat ---'
do $$
declare v_cat uuid; v_rows int;
begin
  insert into coffee_chat_categories (name, semester, board_position)
  values ('Another subteam', 'F26', 0) returning id into v_cat;

  perform become('22222222-2222-4222-8222-222222222222', 'member@cornell.edu');
  insert into coffee_chats (submitter_id, partner_id, category_id, selfie_url, semester)
  values ('22222222-2222-4222-8222-222222222222', '11111111-1111-4111-8111-111111111111', v_cat, 'p/1.jpg', 'F26');

  update coffee_chats set status = 'approved' where submitter_id = '22222222-2222-4222-8222-222222222222';
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

  perform become('22222222-2222-4222-8222-222222222222', 'member@cornell.edu');
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
  values (v_contact, '11111111-1111-4111-8111-111111111111', 'email', '2026-06-01', 'first note');
  insert into interactions (contact_id, profile_id, kind, occurred_at, summary)
  values (v_contact, '11111111-1111-4111-8111-111111111111', 'email', '2026-01-01', 'backfilled older note');

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
  values (v_contact, '11111111-1111-4111-8111-111111111111', 'email', now(), 'asked about the panel');

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
  perform become('22222222-2222-4222-8222-222222222222', 'member@cornell.edu');
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
  values ('11111111-1111-4111-8111-111111111111', 'retro', 'Demo Day retro', 'went fine', 'club')
  returning id into v_note;

  perform become('22222222-2222-4222-8222-222222222222', 'member@cornell.edu');
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

\echo '--- 19. chat_directory is gone ---'
do $$
begin
  -- It existed so a student could browse members and pick one. Nobody picks a
  -- member any more, and it was the only path from a non-member to anything
  -- derived from profiles.
  if exists (select 1 from information_schema.views
             where table_schema = 'public' and table_name = 'chat_directory') then
    raise exception 'FAIL: chat_directory still exists';
  end if;
  raise notice 'PASS: the browse view is dropped';
end $$;

\echo '--- 20. a member reads the pool but cannot rewrite it ---'
do $$
declare v_seen int; v_rows int;
begin
  perform become('22222222-2222-4222-8222-222222222222', 'member@cornell.edu');
  select count(*) into v_seen from chat_requests;
  update chat_requests set prompt = 'Tampered' where student_email = 'prospect@cornell.edu';
  get diagnostics v_rows = ROW_COUNT;
  reset role;

  if v_seen < 1 then raise exception 'FAIL: a member could not read the pool'; end if;
  if v_rows <> 0 then raise exception 'FAIL: a non-admin rewrote % request(s)', v_rows; end if;
  raise notice 'PASS: read yes, write no';
end $$;

\echo '--- 21. one open request per person ---'
do $$
declare v_guest uuid;
begin
  select id into v_guest from guests where email = 'prospect@cornell.edu';
  -- Check 6 moved the first request to 'claimed', so a second pending one is
  -- allowed. A third while that one is pending is not.
  insert into chat_requests (guest_id, student_email, student_name, prompt)
  values (v_guest, 'prospect@cornell.edu', 'Pat Prospect', 'second ask');
  begin
    insert into chat_requests (guest_id, student_email, student_name, prompt)
    values (v_guest, 'prospect@cornell.edu', 'Pat Prospect', 'third ask');
    raise exception 'FAIL: two open requests from one person';
  exception when unique_violation then
    raise notice 'PASS: blocked by the partial unique index';
  end;
end $$;

\echo '--- 22. a coffee chat partner is a member or a guest, never both or neither ---'
do $$
declare v_guest uuid;
begin
  select id into v_guest from guests where email = 'prospect@cornell.edu';
  begin
    insert into coffee_chats (submitter_id, partner_id, partner_guest_id, selfie_url, semester)
    values ('22222222-2222-4222-8222-222222222222',
            '11111111-1111-4111-8111-111111111111', v_guest, 'x.jpg', 'F26');
    raise exception 'FAIL: a chat had two partners';
  exception when check_violation then
    raise notice 'PASS: two partners refused';
  end;
  begin
    insert into coffee_chats (submitter_id, selfie_url, semester)
    values ('22222222-2222-4222-8222-222222222222', 'x.jpg', 'F26');
    raise exception 'FAIL: a chat had no partner';
  exception when check_violation then
    raise notice 'PASS: no partner refused';
  end;
end $$;

\echo '--- 23. a student cannot read the guest list ---'
do $$
declare v_seen int;
begin
  -- Written as the table owner, which is how the service-role sign in action
  -- writes it in production.
  insert into guests (email, full_name) values ('walkin@example.com', 'Wanda Walkin');

  perform become_outsider('prospect@cornell.edu');
  select count(*) into v_seen from guests;
  reset role;

  if v_seen <> 0 then raise exception 'FAIL: a student saw % guest rows', v_seen; end if;
  raise notice 'PASS: guests are members only';
end $$;

\echo '--- 24. a member reads the guest list but cannot rewrite it ---'
do $$
declare
  v_seen int;
  v_touched int;
begin
  perform become('22222222-2222-4222-8222-222222222222', 'member@cornell.edu');

  select count(*) into v_seen from guests;
  if v_seen < 1 then
    reset role;
    raise exception 'FAIL: a member could not read the guest list';
  end if;

  -- An UPDATE whose USING clause matches nothing is not an error, it is a
  -- no-op. Counting the rows it touched is the only way to tell "blocked"
  -- from "worked" here; an exception test would pass whether or not the
  -- policy existed.
  update guests set full_name = 'Tampered' where email = 'walkin@example.com';
  get diagnostics v_touched = row_count;
  if v_touched <> 0 then
    reset role;
    raise exception 'FAIL: a non-admin member rewrote % guest rows', v_touched;
  end if;

  -- An INSERT that fails its WITH CHECK does raise, so this half is a
  -- straight exception test.
  begin
    insert into guests (email, full_name) values ('sneaky@example.com', 'Sneaky');
    reset role;
    raise exception 'FAIL: a non-admin member created a guest';
  exception when insufficient_privilege then
    raise notice 'PASS: read yes, write no';
  end;

  reset role;
end $$;

\echo '--- 25. a student cannot read who signed in ---'
do $$
declare v_seen int;
begin
  perform become_outsider('prospect@cornell.edu');
  select count(*) into v_seen from guest_signins;
  reset role;
  if v_seen <> 0 then raise exception 'FAIL: a student saw % sign in rows', v_seen; end if;
  raise notice 'PASS: sign ins are members only';
end $$;

\echo '--- 26. a guest cannot mark themselves fed ---'
do $$
declare v_guest uuid; v_event uuid; v_signin uuid; v_rows int;
begin
  select id into v_guest from guests where email = 'walkin@example.com';
  insert into events (name, event_date, event_end_date, event_time, event_end_time, venue, has_signin)
  values ('RLS Food Night', current_date, current_date, '19:30', '21:00', 'eHub', true)
  returning id into v_event;
  insert into guest_signins (guest_id, event_id, signed_in_at)
  values (v_guest, v_event, now() - interval '1 hour') returning id into v_signin;

  -- The public path writes through the service role. Nobody holding a session
  -- should be able to hand themselves food.
  perform become_outsider('prospect@cornell.edu');
  update guest_signins set food_claimed_at = now() where id = v_signin;
  get diagnostics v_rows = ROW_COUNT;
  reset role;
  if v_rows <> 0 then raise exception 'FAIL: an outsider fed themselves'; end if;
  raise notice 'PASS: 0 rows touched';
end $$;

\echo '--- 27. a member CAN mark someone fed, and only once ---'
do $$
declare v_signin uuid; v_rows int;
begin
  select s.id into v_signin from guest_signins s
    join events e on e.id = s.event_id where e.name = 'RLS Food Night';

  perform become('22222222-2222-4222-8222-222222222222', 'member@cornell.edu');
  update guest_signins
     set food_claimed_at = now(), food_claimed_by = '22222222-2222-4222-8222-222222222222'
   where id = v_signin and food_claimed_at is null;
  get diagnostics v_rows = ROW_COUNT;
  if v_rows <> 1 then reset role; raise exception 'FAIL: a member could not mark someone fed'; end if;

  -- The conditional update is what stops a double claim.
  update guest_signins set food_claimed_at = now() where id = v_signin and food_claimed_at is null;
  get diagnostics v_rows = ROW_COUNT;
  reset role;
  if v_rows <> 0 then raise exception 'FAIL: food was claimed twice'; end if;
  raise notice 'PASS: fed once, second claim matched nothing';
end $$;

\echo 'ALL CHECKS PASSED'

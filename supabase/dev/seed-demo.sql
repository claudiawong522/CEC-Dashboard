-- Demo data for local development, so every page has something on it.
--
-- Not a Supabase seed (supabase/seed.sql runs on every `db reset`, and this is
-- for when you want the app populated, not for a clean slate). Run it by hand:
--
--   docker exec -i supabase_db_cec-dashboard psql -U postgres -d postgres \
--     < supabase/dev/seed-demo.sql
--
-- Re-runnable: each block returns early if its own data is already there, so
-- a second run neither fails nor doubles anything.
--
-- Needs nothing in place. It creates two local accounts and an event to hang
-- the rest off if the database is empty, so `supabase db reset` followed by
-- this file is a working app from scratch. If you have already signed in
-- locally it uses the profiles it finds instead. Nothing here is intended for
-- production.

-- Two accounts to hang everything off, if the database has none.
--
-- This used to assume you had already signed in locally, which made a fresh
-- `db reset` land on "null value in column giver_id" a dozen statements later
-- rather than saying what was actually missing. It also only ever looked for
-- dev.host@cornell.edu, so signing in with a real Cornell address left it
-- looking for a profile that was never going to exist.
--
-- Local stacks only. These rows have no usable password: sign-in here is
-- Google, and these exist to own demo data, not to be logged into.
do $$
declare v_admin uuid; v_member uuid;
begin
  if exists (select 1 from profiles) then return; end if;

  v_admin := gen_random_uuid();
  v_member := gen_random_uuid();

  -- confirmation_token, recovery_token, email_change_token_new and email_change
  -- are empty strings rather than left to default, which is null. GoTrue scans
  -- them into Go strings, and a null there is not a quiet inconsistency: every
  -- call to the admin API answers 500 "Database error finding users" for as
  -- long as one such row exists, which takes the invite flow down with it. The
  -- other token columns already default to ''.
  insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
                          email_confirmed_at, created_at, updated_at,
                          confirmation_token, recovery_token,
                          email_change_token_new, email_change,
                          raw_app_meta_data, raw_user_meta_data)
  values
    (v_admin, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'dev.host@cornell.edu', '', now(), now(), now(), '', '', '', '',
     '{"provider":"email","providers":["email"]}', '{"full_name":"Dev Host"}'),
    (v_member, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'dev.member@cornell.edu', '', now(), now(), now(), '', '', '', '',
     '{"provider":"email","providers":["email"]}', '{"full_name":"Dev Member"}');

  insert into profiles (id, email, full_name, role, status)
  values (v_admin, 'dev.host@cornell.edu', 'Dev Host', 'admin', 'active'),
         (v_member, 'dev.member@cornell.edu', 'Dev Member', 'edit', 'active');

  raise notice 'seeded two local accounts: dev.host@cornell.edu, dev.member@cornell.edu';
end $$;

-- Something for attendance and sign-ins to attach to. Everything below reaches
-- for the most recent event and assumes it found one.
do $$
begin
  if exists (select 1 from events) then return; end if;

  insert into events (name, event_date, event_end_date, event_time, event_end_time,
                      venue, has_signin, has_speaker, has_attendees)
  values ('Startup Hours', current_date, current_date, '19:30', '21:00',
          'eHub Collegetown', true, true, true);

  raise notice 'seeded one event to hang demo data off';
end $$;

-- Realistic data in every table, so every page has something to exercise.
do $$
declare v_admin uuid; v_member uuid; v_event uuid; v_contact uuid; v_org uuid; v_cat uuid; v_cycle uuid;
begin
  -- Prefer the fixture host, but fall back to whoever is actually here, so a
  -- database seeded from a real Google sign-in still works.
  select id into v_admin from profiles where email='dev.host@cornell.edu';
  if v_admin is null then
    select id into v_admin from profiles order by created_at limit 1;
  end if;
  select id into v_member from profiles where id <> v_admin order by created_at limit 1;
  if v_admin is null or v_member is null then
    raise exception 'seed needs two profiles and found % ', (select count(*) from profiles);
  end if;

  -- One guard for the whole block rather than a condition per insert. Most of
  -- what follows keys on a generated uuid, so a second run would not fail on
  -- these, it would quietly double the shoutouts, notes and interactions. The
  -- attendance index was the only thing that noticed, and it noticed by
  -- aborting halfway through, leaving a half-seeded database behind.
  if exists (select 1 from organizations where name = 'Sequoia') then
    raise notice 'demo data is already here, leaving it alone';
    return;
  end if;

  select id into v_event from events order by event_date desc limit 1;

  update profiles set interests = array['hardware','climate','fintech'], open_to_chats = true,
    chat_blurb = 'Happy to talk hardware.', netid = 'dh1', major = 'CS', graduation_year = '2027',
    team = 'generalist', hometown = 'Ithaca'
  where id = v_admin;

  insert into shoutouts (giver_id, receiver_id, message, semester)
  values (v_admin, v_member, 'Rewired the demo table at 1am.', 'F26'),
         (v_member, v_admin, 'Ran the whole night solo.', 'F26');

  insert into attendance (profile_id, event_id, event_type, event_name, semester, recorded_by)
  select p.id, v_event, 'startup_hours', 'Startup Hours', 'F26', v_admin from profiles p limit 8;

  insert into coffee_chat_categories (name, description, semester, board_position)
  select v.name, v.descr, 'F26', v.pos
  from (values ('Another subteam','Someone not on yours',0),
               ('A senior','Someone graduating',1),
               ('A freshman','Someone new',2)) as v(name, descr, pos)
  where not exists (
    select 1 from coffee_chat_categories c where c.semester = 'F26' and c.board_position = v.pos
  );
  select id into v_cat from coffee_chat_categories where semester='F26' order by board_position limit 1;

  insert into coffee_chats (submitter_id, partner_id, category_id, selfie_url, semester, status)
  values (v_member, v_admin, v_cat, 'seed/selfie.jpg', 'F26', 'pending');

  insert into organizations (name) values ('Sequoia') returning id into v_org;
  insert into outreach_contacts (name, email, company, type, status, visibility, organization_id, assigned_to)
  values ('Priya Shah','priya@sequoiacap.com','Sequoia','speaker','contacted','exec',v_org,v_admin)
  returning id into v_contact;
  insert into interactions (contact_id, profile_id, kind, summary, occurred_at)
  values (v_contact, v_admin, 'email', 'Asked about an October slot', now() - interval '3 days'),
         (v_contact, v_admin, 'call', 'She said yes in principle', now() - interval '1 day');

  insert into brain_notes (author_id, kind, title, body, semester, visibility)
  values (v_admin,'retro','Demo Day retro','Went well, food was late.','F26','club'),
         (v_admin,'note','Sponsorship playbook','Ask sponsors in June.','F26','club');

  insert into external_ideas (pitch, stage, created_by)
  values ('Panel on hardware startups','idea',v_admin),
         ('Fireside with a robotics founder','reached_out',v_admin);

  select id into v_cycle from interview_cycles where is_active limit 1;
  if v_cycle is null then
    insert into interview_cycles (name, is_active, approved_netids)
    values ('Fall 26', true, array['ok123','pq88']) returning id into v_cycle;
  else
    update interview_cycles set approved_netids = array['ok123','pq88'] where id = v_cycle;
  end if;
  insert into interview_slots (cycle_id, start_time, end_time, location, interviewer_id)
  select v_cycle, now() + (g || ' hours')::interval, now() + ((g+1) || ' hours')::interval, 'Uris G01', v_admin
  from generate_series(1,4) g;

  insert into guests (email, full_name, background)
  values ('walkin@example.com','Wanda Walkin','CS junior'),
         ('priya.q@cornell.edu','Priya Quinn','MechE, 2029')
  on conflict (email) do update set full_name = excluded.full_name;

  insert into guest_signins (guest_id, event_id, signin_date, source, signed_in_at)
  select g.id, v_event, (now() at time zone 'America/New_York')::date, 'qr',
         now() - interval '90 min'
  from guests g
  on conflict (guest_id, signin_date) do nothing;
end $$;

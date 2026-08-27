-- Demo data for local development, so every page has something on it.
--
-- Not a Supabase seed (supabase/seed.sql runs on every `db reset`, and this is
-- for when you want the app populated, not for a clean slate). Run it by hand:
--
--   docker exec -i supabase_db_cec-dashboard psql -U postgres -d postgres \
--     < supabase/dev/seed-demo.sql
--
-- Re-runnable: everything either checks for its own existence or upserts, so
-- running it twice does not fail on a unique constraint.
--
-- It assumes a profile exists for dev.host@cornell.edu and at least one other
-- member, plus some events. Nothing here is intended for production.

-- Realistic data in every table, so every page has something to exercise.
do $$
declare v_admin uuid; v_member uuid; v_event uuid; v_contact uuid; v_org uuid; v_cat uuid; v_cycle uuid;
begin
  select id into v_admin from profiles where email='dev.host@cornell.edu';
  select id into v_member from profiles where email <> 'dev.host@cornell.edu' limit 1;
  select id into v_event from events order by event_date desc limit 1;

  update profiles set interests = array['hardware','climate','fintech'], open_to_chats = true,
    chat_blurb = 'Happy to talk hardware.', netid = 'dh1', major = 'CS', graduation_year = '2027',
    team = 'builders', hometown = 'Ithaca'
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

  insert into guest_signins (guest_id, event_id, source, signed_in_at)
  select g.id, v_event, 'qr', now() - interval '90 min' from guests g
  on conflict (guest_id, event_id) do nothing;
end $$;

-- Join the two halves of outreach.
--
-- external_ideas (0008) is pitch-first: a pitch moves idea -> reached_out ->
-- ... -> converted, and one card can hold a whole panel. outreach_contacts
-- (0032) is contact-first: a person belongs to an organization, carries an
-- append-only interaction timeline, and feeds dedupe and follow-up.
--
-- Neither is a subset of the other. Collapsing them loses something either
-- way: drop the pipeline and pitch-to-event conversion goes, drop the CRM and
-- the timeline the follow-ups read goes. So both stay, and the seam is a
-- single foreign key: external_idea_people stops carrying a name and an email
-- of its own and starts pointing at a contact.
--
-- The pipeline answers "where has this idea got to". The contact answers "who
-- is this person and what have we already said to them". After this migration
-- there is one record of a person, not two, so emailing a speaker about a
-- panel shows up on the same timeline as emailing them about anything else.

alter table external_idea_people
  add column contact_id uuid references outreach_contacts(id) on delete cascade;

-- Backfill. Every existing person becomes a contact, reusing one that already
-- matches on email rather than creating a duplicate — which is the entire
-- reason for doing this. Rows with no email can't be matched on anything
-- reliable (two different people really can both be typed in as "Sam"), so
-- each gets its own contact.
do $$
declare
  r record;
  v_contact uuid;
begin
  for r in select id, name, email from external_idea_people order by created_at loop
    v_contact := null;

    if r.email is not null and r.email <> '' then
      select id into v_contact
      from outreach_contacts
      where lower(email) = lower(r.email)
      limit 1;
    end if;

    if v_contact is null then
      insert into outreach_contacts (name, email, type, visibility, source)
      values (
        r.name,
        nullif(r.email, ''),
        'speaker',
        -- external_ideas is admin-only end to end, so a contact lifted out of
        -- it must not become club-visible just by moving table.
        'exec',
        'external pipeline'
      )
      returning id into v_contact;
    end if;

    update external_idea_people set contact_id = v_contact where id = r.id;
  end loop;
end $$;

alter table external_idea_people
  alter column contact_id set not null;

-- The name and email now live on the contact. Dropping them rather than
-- leaving them as a stale copy is the point: two places to edit a person's
-- email is how the two halves drift apart again.
alter table external_idea_people
  drop column name,
  drop column email;

-- A person appears once per pitch. Adding the same contact twice was
-- previously possible (two rows, same name typed twice) and never meaningful.
create unique index external_idea_people_unique_contact_idx
  on external_idea_people (idea_id, contact_id);

create index external_idea_people_contact_idx on external_idea_people (contact_id);

-- Reading a pitch's people now means reading the contacts behind them, and
-- external_ideas is admin-only, so the contact policy has to allow it. The
-- existing outreach_contacts policies already gate select on
-- visibility='club' or admin, and every pipeline contact is 'exec', so an
-- admin sees them and nobody else does. Nothing further to add here — this
-- comment exists because that alignment is load-bearing and easy to break by
-- relaxing one of the two policies later.

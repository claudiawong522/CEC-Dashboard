-- Outreach CRM — organizations, contacts, and an append-only interaction log.
--
-- This is the *contact-first* half of outreach. The pitch-first half already
-- exists as `external_ideas` (0008) and is kept: neither is a subset of the
-- other. A pitch answers "where has this idea got to"; a contact answers "who
-- is this person and what have we already said to them". 0034 is where the two
-- are joined by a foreign key — this migration only stands the CRM up.
--
-- Nothing renders off these tables yet.

-- ---------------------------------------------------------------------------
-- organizations
-- ---------------------------------------------------------------------------
-- `domain` is the dedupe key: two people with @stripe.com addresses belong to
-- one Stripe, however their company was typed in. Unique but nullable, since
-- plenty of contacts arrive with no company at all.
create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  domain text unique,
  type text not null default 'company' check (type in
    ('company', 'vc', 'university', 'nonprofit', 'other')),
  notes text,
  created_at timestamptz not null default now()
);

create index organizations_name_idx on organizations (lower(name));

-- ---------------------------------------------------------------------------
-- outreach_contacts
-- ---------------------------------------------------------------------------
create table outreach_contacts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  company text,
  title text,
  type text not null check (type in ('speaker', 'recruitment')),
  status text not null default 'identified' check (status in
    ('identified', 'contacted', 'responded', 'confirmed', 'scheduled', 'declined')),
  notes text,
  assigned_to uuid references profiles(id) on delete set null,
  event_date date,
  luma_link text,
  organization_id uuid references organizations(id) on delete set null,
  -- 'exec' keeps a contact to admins, matching how external_ideas already
  -- treats outside people's details. 'club' opens it to every member, for the
  -- alumni and friendly-founder rolodex there is no reason to hide.
  visibility text not null default 'exec' check (visibility in ('exec', 'club')),
  source text,
  linkedin_url text,
  -- Maintained by trigger off the interaction log rather than set by hand, so
  -- "who have we gone quiet on" can be a plain index scan instead of a
  -- correlated subquery over every contact's timeline.
  last_touched_at timestamptz,
  next_follow_up_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index outreach_contacts_status_idx on outreach_contacts (status);
create index outreach_contacts_org_idx on outreach_contacts (organization_id);
create index outreach_contacts_assigned_idx on outreach_contacts (assigned_to);
create index outreach_contacts_follow_up_idx on outreach_contacts (next_follow_up_at)
  where next_follow_up_at is not null;
-- Case-insensitive email dedupe. Partial so the many contacts with no email
-- don't collide with each other.
create unique index outreach_contacts_email_idx on outreach_contacts (lower(email))
  where email is not null;

create trigger outreach_contacts_touch_updated_at
  before update on outreach_contacts
  for each row execute function trg_touch_updated_at();

-- ---------------------------------------------------------------------------
-- interactions — append-only timeline
-- ---------------------------------------------------------------------------
-- Deliberately has no update policy. An interaction is a record of something
-- that happened; correcting one means adding another. This is what the agent
-- reads to suggest follow-ups, and a rewritable history would make those
-- suggestions unauditable.
create table interactions (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references outreach_contacts(id) on delete cascade,
  profile_id uuid not null references profiles(id),
  kind text not null check (kind in ('email', 'meeting', 'call', 'event', 'note')),
  occurred_at timestamptz not null,
  summary text not null,
  body text,
  created_at timestamptz not null default now()
);

create index interactions_contact_idx on interactions (contact_id, occurred_at desc);

-- last_touched_at only ever moves forward, so a backfilled interaction from
-- last month doesn't make a contact look freshly contacted.
create or replace function trg_interaction_touches_contact()
returns trigger
language plpgsql
security definer
as $$
begin
  update outreach_contacts
  set last_touched_at = greatest(coalesce(last_touched_at, new.occurred_at), new.occurred_at)
  where id = new.contact_id;
  return new;
end;
$$;

create trigger interactions_touch_contact
  after insert on interactions
  for each row execute function trg_interaction_touches_contact();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table organizations enable row level security;
alter table outreach_contacts enable row level security;
alter table interactions enable row level security;

create policy "organizations_select_authenticated"
  on organizations for select to authenticated using (true);

create policy "organizations_write_admin"
  on organizations for all to authenticated
  using (app_user_role() = 'admin') with check (app_user_role() = 'admin');

-- Visibility is enforced here rather than in the query layer, so an
-- exec-only contact stays invisible even to a hand-written select.
create policy "outreach_contacts_select_by_visibility"
  on outreach_contacts for select to authenticated
  using (visibility = 'club' or app_user_role() = 'admin');

create policy "outreach_contacts_write_admin"
  on outreach_contacts for all to authenticated
  using (app_user_role() = 'admin') with check (app_user_role() = 'admin');

-- An interaction is readable exactly when its contact is.
create policy "interactions_select_by_contact_visibility"
  on interactions for select to authenticated
  using (exists (
    select 1 from outreach_contacts c
    where c.id = interactions.contact_id
      and (c.visibility = 'club' or app_user_role() = 'admin')
  ));

create policy "interactions_insert_admin"
  on interactions for insert to authenticated
  with check (app_user_role() = 'admin' and profile_id = auth.uid());

create policy "interactions_delete_admin"
  on interactions for delete to authenticated
  using (app_user_role() = 'admin');

-- Recruitment interviews — cycles and bookable slots.
--
-- Lowest-traffic surface in the app and purely seasonal, but it has the
-- sharpest access rule: applicants are not members. An applicant is identified
-- by netid against `approved_netids` on the active cycle, and can see and
-- claim slots without a `profiles` row, the same way the student tier works in
-- 0034.

create table interview_cycles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  -- Who is allowed to book in this cycle. A plain array rather than a table:
  -- it is pasted in wholesale from the application spreadsheet once per cycle
  -- and never edited row by row.
  approved_netids text[] not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- At most one cycle open at a time, so "the current cycle" is never ambiguous
-- and an applicant can't be shown two sets of slots.
create unique index interview_cycles_single_active_idx on interview_cycles (is_active)
  where is_active;

create table interview_slots (
  id uuid primary key default gen_random_uuid(),
  cycle_id uuid not null references interview_cycles(id) on delete cascade,
  start_time timestamptz not null,
  end_time timestamptz not null,
  location text,
  interviewer_id uuid references profiles(id) on delete set null,
  applicant_netid text,
  is_claimed boolean not null default false,
  created_at timestamptz not null default now(),
  constraint interview_slots_ends_after_start check (end_time > start_time),
  -- is_claimed and applicant_netid must agree. Without this the two drift on
  -- any partial update and a slot shows as free while holding someone's name.
  constraint interview_slots_claim_consistent
    check (is_claimed = (applicant_netid is not null))
);

create index interview_slots_cycle_idx on interview_slots (cycle_id, start_time);
create index interview_slots_open_idx on interview_slots (cycle_id, start_time) where not is_claimed;

-- One slot per applicant per cycle. Partial, so the unclaimed slots (all
-- carrying a null netid) don't collide.
create unique index interview_slots_one_per_applicant_idx
  on interview_slots (cycle_id, lower(applicant_netid))
  where applicant_netid is not null;

-- Is this netid allowed to book in this cycle? security definer so an
-- applicant with no profiles row can still be checked against the cycle,
-- which RLS would otherwise hide from them.
create or replace function app_netid_approved(p_cycle_id uuid, p_netid text)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from interview_cycles
    where id = p_cycle_id
      and is_active
      and lower(p_netid) = any (select lower(n) from unnest(approved_netids) n)
  )
$$;

-- The netid on the caller's own Cornell address. Applicants sign in with
-- Google, so netid@cornell.edu is the identity we can trust; anything else
-- returns null and therefore matches nothing.
create or replace function app_caller_netid()
returns text
language sql
stable
as $$
  select case
    when auth.jwt() ->> 'email' like '%@cornell.edu'
      then lower(split_part(auth.jwt() ->> 'email', '@', 1))
    else null
  end
$$;

alter table interview_cycles enable row level security;
alter table interview_slots enable row level security;

-- Members read cycles. An applicant does not: `approved_netids` is the list of
-- everyone who made it to interviews, which is not theirs to see.
create policy "interview_cycles_select_member"
  on interview_cycles for select to authenticated
  using (app_user_role() is not null);

create policy "interview_cycles_write_admin"
  on interview_cycles for all to authenticated
  using (app_user_role() = 'admin') with check (app_user_role() = 'admin');

create policy "interview_slots_select_member"
  on interview_slots for select to authenticated
  using (app_user_role() is not null);

-- An approved applicant sees the slots in their cycle. They see who is
-- interviewing and when, and nothing about other applicants — the netid on a
-- claimed slot is filtered in the query layer for this reader.
create policy "interview_slots_select_applicant"
  on interview_slots for select to authenticated
  using (
    app_user_role() is null
    and app_caller_netid() is not null
    and app_netid_approved(cycle_id, app_caller_netid())
  );

-- Claiming: an applicant may only write their own netid, only onto a slot
-- that is currently free, and only in a cycle they're approved for. The
-- `using` clause is what makes this a claim rather than a steal — it matches
-- only unclaimed rows, so two applicants racing for the last slot means the
-- second one updates zero rows instead of overwriting the first.
create policy "interview_slots_claim_applicant"
  on interview_slots for update to authenticated
  using (
    app_user_role() is null
    and not is_claimed
    and app_caller_netid() is not null
    and app_netid_approved(cycle_id, app_caller_netid())
  )
  with check (
    applicant_netid = app_caller_netid()
    and is_claimed
  );

create policy "interview_slots_write_admin"
  on interview_slots for all to authenticated
  using (app_user_role() = 'admin') with check (app_user_role() = 'admin');

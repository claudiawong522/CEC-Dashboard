-- Member directory — profiles grows from an auth record into a real person.
--
-- Until now `profiles` existed to answer "may this account sign in, and what
-- may it do". The internal-tooling merge brings a members directory, a profile
-- page people edit themselves, and coffee-chat matching, all of which want the
-- same row. Extending `profiles` rather than adding a parallel `members` table
-- keeps one identity: `created_by` on an event and the person's netid are the
-- same record, so there is nothing to keep in sync and no way for the two to
-- disagree about who someone is.
--
-- Name and photo are deliberately NOT re-added here: `full_name` and
-- `avatar_url` already carry them from Google sign-in.

alter table profiles
  -- Directory
  add column netid text unique,
  add column pronouns text,
  add column major text,
  add column minor text,
  add column college text,
  add column graduation_year int,
  add column team text check (team in ('events', 'media', 'builders', 'operations')),
  add column position text not null default 'Member',
  add column hometown text,
  add column about text,
  add column linkedin_url text,
  add column portfolio_url text,
  -- Alumni and people who've stepped back stay in the directory but drop out
  -- of pickers and the bingo board. Distinct from status='revoked', which is
  -- about access; someone can be inactive and still sign in.
  add column active boolean not null default true,
  -- Coffee-chat matching
  add column interests text[] not null default '{}',
  add column open_to_chats boolean not null default false,
  add column chat_blurb text,
  add column updated_at timestamptz not null default now();

-- netid is unique but nullable: Postgres permits many nulls in a unique index,
-- so existing rows and anyone invited before they fill in a profile are fine.
create index profiles_active_idx on profiles (active) where active;
create index profiles_team_idx on profiles (team);
create index profiles_open_to_chats_idx on profiles (open_to_chats) where open_to_chats;

create trigger profiles_touch_updated_at
  before update on profiles
  for each row execute function trg_touch_updated_at();

-- ---------------------------------------------------------------------------
-- Self-service editing, without handing out a role change
-- ---------------------------------------------------------------------------
-- Before this migration the only update policy on profiles was admin-only, so
-- letting people edit their own bio needs a second policy. RLS policies are
-- OR'd, so "profiles_update_self" would otherwise also let someone set their
-- own role to 'admin' or flip their own status back from 'revoked' — the
-- policy can gate which *rows* you may touch but not which *columns*.
--
-- The trigger is where that gap closes: privileged columns may only change
-- when the caller is an admin. It runs on every update regardless of which
-- policy allowed the row through, so it also covers a service-role client that
-- bypasses RLS entirely by mistake.
create policy "profiles_update_self"
  on profiles for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create or replace function trg_profiles_guard_privileged_columns()
returns trigger
language plpgsql
security definer
as $$
begin
  -- auth.uid() is null for the service role and for migrations/seed scripts,
  -- which are trusted by definition and must stay able to set roles.
  if auth.uid() is null or app_user_role() = 'admin' then
    return new;
  end if;

  if new.role is distinct from old.role
     or new.status is distinct from old.status
     or new.invited_by is distinct from old.invited_by
     or new.invited_at is distinct from old.invited_at then
    raise exception 'Only an admin may change role, status or invite details';
  end if;

  return new;
end;
$$;

create trigger profiles_guard_privileged_columns
  before update on profiles
  for each row execute function trg_profiles_guard_privileged_columns();

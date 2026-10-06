-- Profile fields the public site shows that the dashboard did not hold yet,
-- an opt-out from the public listing, and the one anon-readable surface the
-- site reads: members_public.
--
-- See docs/superpowers/specs/2026-10-06-site-member-sync-design.md.

alter table profiles
  add column if not exists hobbies text,
  add column if not exists github_url text,
  add column if not exists building text,
  add column if not exists show_on_site boolean not null default true;

-- Owned by postgres and not security_invoker, so it reads past the profiles
-- RLS on purpose: this is the public roster, and the column list is the
-- whole point. Email, netid, pronouns, hometown, interests and the coffee
-- chat fields are not here and must never be added.
create or replace view members_public as
  select
    p.id,
    p.full_name,
    p.avatar_url,
    p.position,
    p.team,
    p.major,
    p.graduation_year,
    p.hobbies,
    p.about,
    p.building,
    p.portfolio_url,
    p.github_url,
    p.linkedin_url,
    p.active,
    p.updated_at
  from profiles p
  where p.status = 'active'
    and p.show_on_site = true;

grant select on members_public to anon, authenticated;

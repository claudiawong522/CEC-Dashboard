-- A member can opt in to an Email button on cornellec.com. Off by default;
-- the view only exposes the address for those who turned it on.
alter table profiles add column if not exists show_email_on_site boolean not null default false;

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
    p.updated_at,
    p.pronouns,
    p.minor,
    p.college,
    p.hometown,
    case when p.show_email_on_site then p.email end as email
  from profiles p
  where p.status = 'active'
    and p.show_on_site = true;

grant select on members_public to anon, authenticated;

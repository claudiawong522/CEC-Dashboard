-- Everything a member fills in on their profile shows on cornellec.com when
-- they opt in, except email, netid and the coffee-chat matching fields. New columns go at the end so
-- `create or replace view` can keep the existing ones in place.
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
    p.hometown
  from profiles p
  where p.status = 'active'
    and p.show_on_site = true;

grant select on members_public to anon, authenticated;

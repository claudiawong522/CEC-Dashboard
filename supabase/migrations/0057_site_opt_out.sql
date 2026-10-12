-- Turning off "Show on cornellec.com" also turns off the Email button.
update profiles set show_email_on_site = false where not show_on_site and show_email_on_site;

create or replace function enforce_site_email_opt_in() returns trigger
language plpgsql as $$
begin
  if not new.show_on_site then
    new.show_email_on_site := false;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_site_email_opt_in on profiles;
create trigger profiles_site_email_opt_in
  before insert or update of show_on_site, show_email_on_site on profiles
  for each row execute function enforce_site_email_opt_in();

-- The site's curated roster still lists people who have since turned the
-- switch off. This view tells it whom to drop, without publishing names:
-- one sha256 per normalised name (lowercase, trimmed, single spaces) where
-- the person has an active account and none of their accounts is shown.
-- A name shared with a shown account (a personal-address duplicate) is not
-- listed, so the shown account wins.
create or replace view members_hidden as
  select encode(sha256(convert_to(regexp_replace(lower(trim(p.full_name)), '\s+', ' ', 'g'), 'UTF8')), 'hex') as name_hash
  from profiles p
  where p.status = 'active' and coalesce(trim(p.full_name), '') <> ''
  group by regexp_replace(lower(trim(p.full_name)), '\s+', ' ', 'g')
  having not bool_or(p.show_on_site);

grant select on members_hidden to anon, authenticated;

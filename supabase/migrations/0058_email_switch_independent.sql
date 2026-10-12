-- The Email button setting is remembered on its own. It only takes effect
-- while "Show on cornellec.com" is on (members_public already exposes the
-- address only then), so turning the site off and on again keeps the choice.
drop trigger if exists profiles_site_email_opt_in on profiles;
drop function if exists enforce_site_email_opt_in();

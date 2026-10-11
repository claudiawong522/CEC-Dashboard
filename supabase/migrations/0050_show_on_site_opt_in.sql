-- Listing on cornellec.com is opt-in. 0049 defaulted show_on_site to true,
-- which put every member with a dashboard account on the public page the
-- moment the site started reading the view, including people who had never
-- been on it. New accounts now start hidden; a member turns the switch on
-- from their profile. Existing rows are left alone here and were set by hand
-- (people already on the site stay on, the rest were switched off).
alter table profiles alter column show_on_site set default false;

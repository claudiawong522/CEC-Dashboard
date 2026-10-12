-- Retire the read-only `view` role.
--
-- 0048 moved every existing view member to edit but kept the role in the
-- check constraint for a hypothetical alum or outside collaborator. The club
-- has since decided against it: every member edits, and admin is the only
-- other role. The app no longer offers or understands `view`, so the database
-- stops accepting it too.
--
-- profiles.role is text with a check constraint (not an enum), so retiring a
-- value is a constraint swap, no type rewrite needed. Order matters: move any
-- straggler rows first so the new constraint validates, and change the column
-- default before the constraint that would reject it.

update profiles set role = 'edit' where role = 'view';

alter table profiles alter column role set default 'edit';

alter table profiles drop constraint if exists profiles_role_check;
alter table profiles
  add constraint profiles_role_check check (role in ('edit', 'admin'));

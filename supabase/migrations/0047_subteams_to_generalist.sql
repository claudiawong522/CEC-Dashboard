-- Three subteams, not four: Events, Media, Generalist.
--
-- Builders and Operations are both folded into Generalist. Anyone currently on
-- either is moved rather than cleared, because a subteam is how the directory
-- groups people and emptying the column would quietly un-group them.
--
-- The constraint from 0030 was written inline on the column, so Postgres named
-- it rather than us. Looking it up instead of guessing `profiles_team_check`
-- keeps this working against a database where that name differs.

do $$
declare v_constraint text;
begin
  select con.conname into v_constraint
  from pg_constraint con
  join pg_class c on c.oid = con.conrelid
  where c.relname = 'profiles'
    and con.contype = 'c'
    and pg_get_constraintdef(con.oid) ilike '%team%';

  if v_constraint is not null then
    execute format('alter table profiles drop constraint %I', v_constraint);
  end if;
end $$;

-- Belt and braces: if the lookup above found nothing because the constraint
-- was already renamed to this, the add below would collide with itself.
alter table profiles drop constraint if exists profiles_team_check;

-- Move people before the new constraint exists, or the update is rejected by
-- the very rule it is preparing for.
update profiles set team = 'generalist' where team in ('builders', 'operations');

alter table profiles
  add constraint profiles_team_check
  check (team in ('events', 'media', 'generalist'));

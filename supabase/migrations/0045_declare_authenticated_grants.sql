-- Say out loud which grants this app depends on.
--
-- Nothing in this repo has ever granted `authenticated` anything. The app works
-- in production only because Supabase Cloud's default privileges grant it on
-- every table created in `public`. That is an inherited platform behaviour the
-- schema never states, and it is already load-bearing for every page.
--
-- It is not hypothetical. The CLI image this project builds against does *not*
-- apply those defaults: its default ACL for `public` gives anon and
-- authenticated only Dxtm (truncate, references, trigger). So `supabase db
-- reset` produces a database where a signed-in member gets
-- "permission denied for table profiles" on every page, and the only reason
-- nobody hit it is that people restore rather than reset. The same gap would
-- appear on a restore into a fresh Cloud project.
--
-- 0019 and 0043 already set the precedent, both pinning service_role grants
-- rather than inheriting them, and both say so in their comments. This
-- finishes the job for the role that actually serves the pages.
--
-- This grants table access, not row access. RLS is untouched and remains the
-- only thing deciding which rows anyone sees, which is the standard Supabase
-- arrangement and exactly what Cloud does today. Nothing here widens what any
-- policy already allows.

grant usage on schema public to anon, authenticated;

grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;

-- anon reaches the public sign-in and the prospective-member form, both of
-- which are served through the service role. It is granted select only, and
-- every policy in this schema is scoped `to authenticated`, so anon still
-- matches no rows. This exists so a future public read has to add a policy
-- deliberately rather than discovering it already works.
grant select on all tables in schema public to anon;

-- And for whatever the next migration creates.
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public grant select on tables to anon;
alter default privileges in schema public grant usage, select on sequences to authenticated;

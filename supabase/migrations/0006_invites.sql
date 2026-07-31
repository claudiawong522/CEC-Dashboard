-- Admin-issued invites. An invite creates the `profiles` row (and its
-- backing `auth.users` shell via the Auth Admin API, from application code)
-- immediately with status 'invited' and an admin-chosen role, instead of
-- waiting for the person's first self-serve Google login to default them to
-- 'view'. `app/auth/callback/route.ts` flips status to 'active' on their
-- first sign-in and preserves whatever role the invite already granted.
alter table profiles
  add column status text not null default 'active' check (status in ('invited', 'active')),
  add column invited_by uuid references profiles(id),
  add column invited_at timestamptz;

create policy "profiles_insert_by_admin"
  on profiles for insert to authenticated
  with check (app_user_role() = 'admin');

create policy "profiles_delete_by_admin"
  on profiles for delete to authenticated
  using (app_user_role() = 'admin');

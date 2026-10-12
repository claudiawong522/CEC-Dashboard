-- position (Co-President, Head of Events, Member, ...) decides which section
-- of cornellec.com someone is listed under, so it joins the admin-only
-- columns. The profile page no longer offers it and updateOwnProfile no
-- longer sends it; this makes the database refuse it from a member too.
-- Admins and the service role (auth.uid() is null) can still change it.
-- Same function as 0051, with position added to the guarded list.

create or replace function trg_profiles_guard_privileged_columns()
returns trigger
language plpgsql
security definer
as $$
begin
  if auth.uid() is null or app_user_role() = 'admin' then
    return new;
  end if;

  if new.role is distinct from old.role
     or new.status is distinct from old.status
     or new.invited_by is distinct from old.invited_by
     or new.invited_at is distinct from old.invited_at
     or new.email is distinct from old.email
     or new.active is distinct from old.active
     or new.position is distinct from old.position then
    raise exception 'Only an admin may change role, status, email, active, position or invite details';
  end if;

  if new.avatar_url is distinct from old.avatar_url
     and new.avatar_url is not null
     and position('/storage/v1/object/public/portraits/avatars/' || new.id::text || '/' in new.avatar_url) = 0 then
    raise exception 'A profile photo must be uploaded through the dashboard';
  end if;

  return new;
end;
$$;

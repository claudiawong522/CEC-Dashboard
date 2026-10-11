-- Guards found in the 2026-10-11 QA pass.
--
-- 1. avatar_url: a member could PATCH any URL into their own row through the
--    REST API (the server action's check was the only guard), and the public
--    site renders it. A non-admin may now only set it to null or to a photo in
--    their own portraits/avatars/<id>/ folder.
-- 2. email and active join role/status as admin-only columns: email is the
--    key invites and sign-in match on, and active decides Members vs Alumni.
-- 3. Storage: the portraits/avatars/<id>/ folders are writable and deletable
--    only by their owner (and admins). Event portraits elsewhere in the bucket
--    keep the old edit-or-admin rule.

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
     or new.active is distinct from old.active then
    raise exception 'Only an admin may change role, status, email, active or invite details';
  end if;

  if new.avatar_url is distinct from old.avatar_url
     and new.avatar_url is not null
     and position('/storage/v1/object/public/portraits/avatars/' || new.id::text || '/' in new.avatar_url) = 0 then
    raise exception 'A profile photo must be uploaded through the dashboard';
  end if;

  return new;
end;
$$;

drop policy if exists "storage_write_edit_or_admin" on storage.objects;
drop policy if exists "storage_delete_edit_or_admin" on storage.objects;

create policy "storage_write_edit_or_admin"
  on storage.objects for insert to authenticated
  with check (
    bucket_id in ('evidence', 'portraits', 'receipts', 'media')
    and app_user_role() in ('edit', 'admin')
    and (
      bucket_id <> 'portraits'
      or (storage.foldername(name))[1] is distinct from 'avatars'
      or (storage.foldername(name))[2] = auth.uid()::text
      or app_user_role() = 'admin'
    )
  );

create policy "storage_delete_edit_or_admin"
  on storage.objects for delete to authenticated
  using (
    bucket_id in ('evidence', 'portraits', 'receipts', 'media')
    and app_user_role() in ('edit', 'admin')
    and (
      bucket_id <> 'portraits'
      or (storage.foldername(name))[1] is distinct from 'avatars'
      or (storage.foldername(name))[2] = auth.uid()::text
      or app_user_role() = 'admin'
    )
  );

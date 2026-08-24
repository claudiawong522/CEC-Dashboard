-- Deleting an event left its files in the bucket, still public, for good.
--
-- 0001 gave storage.objects an INSERT policy and a DELETE policy for the four
-- app buckets, but never a SELECT one. The Storage API resolves the objects a
-- request names before it acts on them, and that resolution runs as the
-- caller. With no SELECT policy the lookup matched nothing, so
-- `supabase.storage.from(bucket).remove(paths)` returned an empty array:
-- zero objects removed, and no error to notice.
--
-- The visible effect was that "This removes it and everything attached to it
-- -- files, notes, prep -- for good" removed the event_files rows and left
-- every actual file behind. These buckets are public, so a photo someone
-- deleted stayed fetchable by URL indefinitely.
--
-- Reading is opened to any member rather than to edit/admin: the buckets are
-- public already, so this grants no visibility that a plain URL did not, and
-- deletion stays restricted by the existing storage_delete_edit_or_admin
-- policy. coffee-chats is untouched, having carried its own SELECT policy
-- since 0014.
create policy "storage_select_members"
  on storage.objects for select to authenticated
  using (
    bucket_id = any (array['evidence', 'portraits', 'receipts', 'media'])
    and app_user_role() is not null
  );

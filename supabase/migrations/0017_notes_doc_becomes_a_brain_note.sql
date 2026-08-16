-- The shared doc becomes one note among many.
--
-- notes_doc was a single BlockNote document the whole club edits. brain_notes
-- (0012) is many typed, searchable rows. Keeping both would mean the one
-- document everyone actually writes in is the one thing the ask bar cannot
-- read, which is exactly backwards.
--
-- So the doc moves into brain_notes as a single row of kind 'doc', keeps its
-- fixed id so /notes can still find it without a lookup, and notes_doc goes
-- away rather than lingering as a second copy that can drift.

-- Plain text out of a BlockNote document, for search.
--
-- brain_notes carries both: `content` is the block document the editor
-- renders, `body` is the flat text the tsvector indexes. Deriving one from
-- the other in the database rather than in the app is what stops them
-- disagreeing — a note written in the editor is searchable whether it was
-- saved by a page, a server action or a backfill like the one below.
--
-- '$.**.text' walks the whole tree, so it picks up text nested in list items
-- and table cells as well as top-level paragraphs. WITH ORDINALITY keeps the
-- words in document order; string_agg without it is free to reorder.
create or replace function blocknote_text(doc jsonb)
returns text
language sql
immutable
as $$
  select coalesce(
    (
      select string_agg(node #>> '{}', ' ' order by ord)
      from jsonb_path_query(doc, '$.**.text') with ordinality as parts(node, ord)
      where jsonb_typeof(node) = 'string'
    ),
    ''
  )
$$;

create or replace function trg_brain_note_sync_body()
returns trigger
language plpgsql
as $$
begin
  -- Only when the note actually has a block document. Notes captured as
  -- plain text (a pasted retro, a derived summary) keep the body they were
  -- given, since there is nothing to derive it from.
  if new.content is not null then
    new.body := blocknote_text(new.content);
  end if;
  return new;
end;
$$;

create trigger brain_notes_sync_body
  before insert or update of content on brain_notes
  for each row execute function trg_brain_note_sync_body();

-- Move the doc across, keeping its id so the /notes route stays a direct
-- lookup. `body` is filled by the trigger above.
insert into brain_notes (id, kind, title, body, content, visibility, created_at, updated_at)
select
  '00000000-0000-0000-0000-000000000002',
  'doc',
  'Club notes',
  '',
  content,
  'club',
  now(),
  coalesce(updated_at, now())
from notes_doc
where id = '00000000-0000-0000-0000-000000000001'
on conflict (id) do nothing;

-- If the row was missing entirely (a database that never ran 0001's seed),
-- still create the doc so /notes has something to open.
insert into brain_notes (id, kind, title, body, content, visibility)
values ('00000000-0000-0000-0000-000000000002', 'doc', 'Club notes', '', '[]'::jsonb, 'club')
on conflict (id) do nothing;

drop table notes_doc;

-- The shared doc needs a shared-write policy.
--
-- 0012's update policy is author-or-admin, which is right for a retro or a
-- personal note: nobody should edit someone else's write-up out from under
-- them. It is wrong for the club doc, which is the one note the whole club
-- edits together and which has no single author. Without this, folding it
-- into brain_notes would silently make it admin-only to write.
--
-- Scoped to kind='doc' rather than to the one id, so any future shared
-- document behaves the same way, and notes/retros keep the stricter rule.
create policy "brain_notes_update_shared_docs"
  on brain_notes for update to authenticated
  using (kind = 'doc' and app_user_role() in ('edit', 'admin'))
  with check (kind = 'doc' and app_user_role() in ('edit', 'admin'));

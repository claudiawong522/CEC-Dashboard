-- Team brain — many typed, searchable notes.
--
-- This sits alongside `notes_doc` (0001) rather than replacing it yet. The doc
-- is one shared BlockNote document the whole club edits; a brain note is one
-- row per thing worth remembering, carrying a kind, a semester and a
-- visibility, and indexed so the ask bar can retrieve it. 0037 folds the
-- shared doc in as a single note of kind 'doc' once the editor is wired up.
--
-- Two text columns on purpose:
--   body    — plain text, always populated. This is what search indexes and
--             what the ask bar reads.
--   content — the BlockNote document, when the note was written in the rich
--             editor. Rendering prefers it; search never touches it.
-- Keeping both means a note written in the editor is still answerable, which
-- is precisely what the shared doc is not today.

create extension if not exists pg_trgm;

create table brain_notes (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references profiles(id) on delete set null,
  kind text not null check (kind in ('retro', 'note', 'doc', 'derived')),
  title text not null,
  body text not null,
  content jsonb,
  semester text,
  source_url text,
  contact_id uuid references outreach_contacts(id) on delete set null,
  event_id uuid references events(id) on delete set null,
  visibility text not null default 'club' check (visibility in ('exec', 'club')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index brain_notes_kind_semester_idx on brain_notes (kind, semester);
create index brain_notes_event_idx on brain_notes (event_id);
create index brain_notes_contact_idx on brain_notes (contact_id);

-- Full-text search. A generated column rather than a trigger-maintained one:
-- the expression is immutable, so Postgres keeps it correct for free and there
-- is no way for the index to drift from the row.
alter table brain_notes
  add column search_vector tsvector
  generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(body, '')), 'B')
  ) stored;

create index brain_notes_search_idx on brain_notes using gin (search_vector);

-- Trigram on the title as well as FTS. They fail in different directions: FTS
-- misses misspellings and partial words ("demo day" typed as "demoday"),
-- trigram misses stemming ("retro" vs "retrospectives"). The ask bar runs
-- both and unions.
create index brain_notes_title_trgm_idx on brain_notes using gin (title gin_trgm_ops);

create trigger brain_notes_touch_updated_at
  before update on brain_notes
  for each row execute function trg_touch_updated_at();

alter table brain_notes enable row level security;

create policy "brain_notes_select_by_visibility"
  on brain_notes for select to authenticated
  using (visibility = 'club' or app_user_role() = 'admin');

create policy "brain_notes_insert_edit_or_admin"
  on brain_notes for insert to authenticated
  with check (app_user_role() in ('edit', 'admin'));

-- An author may revise their own note; admins may revise any. A 'view' member
-- gets neither, and nobody may edit someone else's retro out from under them.
create policy "brain_notes_update_author_or_admin"
  on brain_notes for update to authenticated
  using (app_user_role() = 'admin' or (author_id = auth.uid() and app_user_role() = 'edit'))
  with check (app_user_role() = 'admin' or (author_id = auth.uid() and app_user_role() = 'edit'));

create policy "brain_notes_delete_admin"
  on brain_notes for delete to authenticated
  using (app_user_role() = 'admin');

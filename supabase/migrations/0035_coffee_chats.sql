-- Coffee chats and the bingo board.
--
-- The board is a grid of categories for a semester ("someone on another
-- subteam", "a senior", "someone you've never worked with"). A member fills a
-- square by submitting a selfie with the person they chatted; an admin
-- approves it. `board_position` is the square's index, so the grid renders in
-- a fixed order rather than whatever order the rows came back in.

create table coffee_chat_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  semester text not null,
  board_position int not null,
  created_at timestamptz not null default now(),
  -- One square per position per semester; the board can't have two tiles
  -- fighting over the same cell.
  unique (semester, board_position)
);

create index coffee_chat_categories_semester_idx on coffee_chat_categories (semester, board_position);

create table coffee_chats (
  id uuid primary key default gen_random_uuid(),
  submitter_id uuid not null references profiles(id) on delete cascade,
  partner_id uuid not null references profiles(id) on delete cascade,
  category_id uuid references coffee_chat_categories(id) on delete set null,
  selfie_url text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  -- Why a rejection happened, so the member sees something more useful than
  -- the square going empty again.
  review_note text,
  submitted_at timestamptz not null default now(),
  reviewed_by uuid references profiles(id) on delete set null,
  reviewed_at timestamptz,
  semester text not null,
  -- You can't claim the same square twice in a semester. Nulls are distinct in
  -- Postgres, so an uncategorised chat is never blocked by this.
  unique (submitter_id, category_id, semester),
  -- Chatting with yourself is not a coffee chat.
  constraint coffee_chats_distinct_people check (submitter_id <> partner_id)
);

create index coffee_chats_submitter_idx on coffee_chats (submitter_id, semester);
create index coffee_chats_partner_idx on coffee_chats (partner_id, semester);
create index coffee_chats_pending_idx on coffee_chats (submitted_at) where status = 'pending';

alter table coffee_chat_categories enable row level security;
alter table coffee_chats enable row level security;

create policy "coffee_chat_categories_select_authenticated"
  on coffee_chat_categories for select to authenticated using (true);

create policy "coffee_chat_categories_write_admin"
  on coffee_chat_categories for all to authenticated
  using (app_user_role() = 'admin') with check (app_user_role() = 'admin');

-- A member sees their own submissions at any status, plus every approved chat
-- (the board is social — seeing who else filled a square is the point).
-- Someone else's *pending* or *rejected* submission stays private to them and
-- the admins reviewing the queue.
create policy "coffee_chats_select_own_approved_or_admin"
  on coffee_chats for select to authenticated
  using (
    status = 'approved'
    or submitter_id = auth.uid()
    or partner_id = auth.uid()
    or app_user_role() = 'admin'
  );

create policy "coffee_chats_insert_self"
  on coffee_chats for insert to authenticated
  with check (
    app_user_role() in ('edit', 'admin')
    and submitter_id = auth.uid()
    -- A submission always starts unreviewed; you cannot approve your own.
    and status = 'pending'
    and reviewed_by is null
    and reviewed_at is null
  );

-- Only admins review. A member editing their own row would be able to flip it
-- to 'approved', which is the one thing the queue exists to prevent.
create policy "coffee_chats_update_admin"
  on coffee_chats for update to authenticated
  using (app_user_role() = 'admin') with check (app_user_role() = 'admin');

create policy "coffee_chats_delete_own_pending_or_admin"
  on coffee_chats for delete to authenticated
  using (app_user_role() = 'admin' or (submitter_id = auth.uid() and status = 'pending'));

-- Selfies go in their own bucket rather than the shared `evidence` one: they
-- are pictures of people, and the storage policies for event evidence are
-- edit-or-admin write / public read, which is not what a member submitting a
-- photo of themselves and a friend should get by default.
insert into storage.buckets (id, name, public)
values ('coffee-chats', 'coffee-chats', false)
on conflict (id) do nothing;

create policy "coffee_chats_storage_insert_authenticated"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'coffee-chats' and app_user_role() in ('edit', 'admin'));

create policy "coffee_chats_storage_select_authenticated"
  on storage.objects for select to authenticated
  using (bucket_id = 'coffee-chats');

create policy "coffee_chats_storage_delete_admin"
  on storage.objects for delete to authenticated
  using (bucket_id = 'coffee-chats' and app_user_role() = 'admin');

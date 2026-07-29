-- Add an explicit end time alongside the existing start time (event_time),
-- and let Marketing track arbitrary custom channels beyond the fixed 7.

alter table events add column event_end_time time;

create table event_marketing_custom_items (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  label text not null,
  done boolean not null default false,
  created_at timestamptz not null default now()
);

create index event_marketing_custom_items_event_idx on event_marketing_custom_items (event_id);

alter table event_marketing_custom_items enable row level security;

create policy "event_marketing_custom_items_select_authenticated"
  on event_marketing_custom_items for select to authenticated using (true);

create policy "event_marketing_custom_items_write_edit_or_admin"
  on event_marketing_custom_items for all to authenticated
  using (app_user_role() in ('edit', 'admin'))
  with check (app_user_role() in ('edit', 'admin'));

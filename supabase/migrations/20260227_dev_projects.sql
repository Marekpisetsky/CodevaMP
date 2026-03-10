create extension if not exists "pgcrypto";

create table if not exists public.dev_projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  summary text not null,
  stack text not null,
  repo_url text,
  demo_url text,
  looking_for text,
  status text not null default 'idea' check (status in ('idea', 'building', 'live')),
  author_handle text,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists idx_dev_projects_created_at on public.dev_projects (created_at desc);
create index if not exists idx_dev_projects_created_by on public.dev_projects (created_by);

alter table public.dev_projects enable row level security;

drop policy if exists "dev_projects_public_read" on public.dev_projects;
create policy "dev_projects_public_read"
on public.dev_projects
for select
to anon, authenticated
using (true);

drop policy if exists "dev_projects_owner_insert" on public.dev_projects;
create policy "dev_projects_owner_insert"
on public.dev_projects
for insert
to authenticated
with check (auth.uid() = created_by);

drop policy if exists "dev_projects_owner_update" on public.dev_projects;
create policy "dev_projects_owner_update"
on public.dev_projects
for update
to authenticated
using (auth.uid() = created_by)
with check (auth.uid() = created_by);

drop policy if exists "dev_projects_owner_delete" on public.dev_projects;
create policy "dev_projects_owner_delete"
on public.dev_projects
for delete
to authenticated
using (auth.uid() = created_by);


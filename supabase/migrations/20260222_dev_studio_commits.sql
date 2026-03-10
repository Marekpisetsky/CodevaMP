create table if not exists public.dev_studio_commits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id text not null,
  branch text not null default 'main',
  stack text not null default 'web',
  message text not null,
  files jsonb not null default '{}'::jsonb,
  folder_paths jsonb not null default '[]'::jsonb,
  active_file text not null default '',
  dependencies jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.dev_studio_commits
  add column if not exists branch text not null default 'main';

create index if not exists dev_studio_commits_user_project_created_idx
  on public.dev_studio_commits(user_id, project_id, created_at desc);

create index if not exists dev_studio_commits_user_project_branch_created_idx
  on public.dev_studio_commits(user_id, project_id, branch, created_at desc);

alter table public.dev_studio_commits enable row level security;

drop policy if exists "dev_studio_commits_select_owner" on public.dev_studio_commits;
create policy "dev_studio_commits_select_owner"
  on public.dev_studio_commits
  for select
  using ((select auth.uid()) = user_id);

drop policy if exists "dev_studio_commits_insert_owner" on public.dev_studio_commits;
create policy "dev_studio_commits_insert_owner"
  on public.dev_studio_commits
  for insert
  with check ((select auth.uid()) = user_id);

drop policy if exists "dev_studio_commits_update_owner" on public.dev_studio_commits;
create policy "dev_studio_commits_update_owner"
  on public.dev_studio_commits
  for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "dev_studio_commits_delete_owner" on public.dev_studio_commits;
create policy "dev_studio_commits_delete_owner"
  on public.dev_studio_commits
  for delete
  using ((select auth.uid()) = user_id);

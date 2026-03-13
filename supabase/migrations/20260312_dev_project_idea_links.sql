create table if not exists public.dev_project_idea_links (
  project_id uuid not null references public.dev_projects(id) on delete cascade,
  idea_id uuid not null references public.dev_projects(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (project_id, idea_id),
  constraint dev_project_idea_links_no_self_link check (project_id <> idea_id)
);

create index if not exists idx_dev_project_idea_links_idea_id
on public.dev_project_idea_links (idea_id);

alter table public.dev_project_idea_links enable row level security;

drop policy if exists "dev_project_idea_links_public_read" on public.dev_project_idea_links;
create policy "dev_project_idea_links_public_read"
on public.dev_project_idea_links
for select
to anon, authenticated
using (true);

drop policy if exists "dev_project_idea_links_owner_insert" on public.dev_project_idea_links;
create policy "dev_project_idea_links_owner_insert"
on public.dev_project_idea_links
for insert
to authenticated
with check (
  exists (
    select 1
    from public.dev_projects p
    where p.id = project_id
      and p.created_by = (select auth.uid())
  )
);

drop policy if exists "dev_project_idea_links_owner_delete" on public.dev_project_idea_links;
create policy "dev_project_idea_links_owner_delete"
on public.dev_project_idea_links
for delete
to authenticated
using (
  exists (
    select 1
    from public.dev_projects p
    where p.id = project_id
      and p.created_by = (select auth.uid())
  )
);

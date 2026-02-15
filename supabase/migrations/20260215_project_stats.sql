create table if not exists public.project_stats (
  project_id uuid primary key references public.projects(id) on delete cascade,
  views_count bigint not null default 0,
  likes_count bigint not null default 0,
  shares_count bigint not null default 0,
  watch_seconds bigint not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.project_stats enable row level security;

drop policy if exists "project_stats_read_public" on public.project_stats;
create policy "project_stats_read_public"
on public.project_stats
for select
to anon, authenticated
using (true);

drop policy if exists "project_stats_update_authenticated" on public.project_stats;
drop policy if exists "project_stats_insert_authenticated" on public.project_stats;
drop policy if exists "project_stats_delete_authenticated" on public.project_stats;

revoke insert, update, delete on table public.project_stats from anon, authenticated;

create or replace function public.touch_project_stats_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_touch_project_stats_updated_at on public.project_stats;
create trigger trg_touch_project_stats_updated_at
before update on public.project_stats
for each row
execute function public.touch_project_stats_updated_at();

create or replace function public.record_project_view(p_project_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.project_stats (project_id, views_count)
  values (p_project_id, 1)
  on conflict (project_id) do update
  set views_count = public.project_stats.views_count + 1,
      updated_at = now();
end;
$$;

grant execute on function public.record_project_view(uuid) to anon, authenticated;

create or replace function public.record_project_share(p_project_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.project_stats (project_id, shares_count)
  values (p_project_id, 1)
  on conflict (project_id) do update
  set shares_count = public.project_stats.shares_count + 1,
      updated_at = now();
end;
$$;

grant execute on function public.record_project_share(uuid) to anon, authenticated;

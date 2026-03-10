-- Soft anti-fraud for project views:
-- Count at most one view per viewer_key + project_id within a cooldown window.

create table if not exists public.project_view_events (
  id bigint generated always as identity primary key,
  project_id uuid not null references public.projects(id) on delete cascade,
  viewer_key text not null,
  viewed_at timestamptz not null default now()
);

create index if not exists idx_project_view_events_lookup
  on public.project_view_events (project_id, viewer_key, viewed_at desc);

alter table public.project_view_events enable row level security;
revoke all on table public.project_view_events from anon, authenticated;

create or replace function public.record_project_view_guarded(
  p_project_id uuid,
  p_viewer_key text,
  p_min_seconds integer default 45
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  should_count boolean;
  cooldown_seconds integer;
begin
  if p_project_id is null then
    return false;
  end if;

  cooldown_seconds := greatest(coalesce(p_min_seconds, 45), 5);

  if coalesce(length(trim(p_viewer_key)), 0) = 0 then
    perform public.record_project_view(p_project_id);
    return true;
  end if;

  select not exists (
    select 1
    from public.project_view_events e
    where e.project_id = p_project_id
      and e.viewer_key = p_viewer_key
      and e.viewed_at > now() - make_interval(secs => cooldown_seconds)
  )
  into should_count;

  if should_count then
    insert into public.project_view_events (project_id, viewer_key)
    values (p_project_id, p_viewer_key);

    perform public.record_project_view(p_project_id);
    return true;
  end if;

  return false;
end;
$$;

grant execute on function public.record_project_view_guarded(uuid, text, integer) to anon, authenticated;

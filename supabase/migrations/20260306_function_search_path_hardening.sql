-- Fix advisor warning: functions with mutable search_path.
-- Set explicit search_path for trigger helper functions.

do $$
begin
  if exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'touch_project_stats_updated_at'
      and p.pronargs = 0
  ) then
    execute 'alter function public.touch_project_stats_updated_at() set search_path = public';
  end if;

  if exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'touch_studio_terms_acceptances_updated_at'
      and p.pronargs = 0
  ) then
    execute 'alter function public.touch_studio_terms_acceptances_updated_at() set search_path = public';
  end if;

  if exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'touch_visuales_accounts_updated_at'
      and p.pronargs = 0
  ) then
    execute 'alter function public.touch_visuales_accounts_updated_at() set search_path = public';
  end if;
end $$;

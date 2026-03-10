-- Keep project_view_events locked down while satisfying advisor:
-- explicit deny-all policy under RLS.

do $$
begin
  if to_regclass('public.project_view_events') is not null then
    execute 'alter table public.project_view_events enable row level security';
    execute 'drop policy if exists "project_view_events_deny_all" on public.project_view_events';
    execute 'create policy "project_view_events_deny_all"
      on public.project_view_events
      for all
      to anon, authenticated
      using (false)
      with check (false)';
  end if;
end $$;

-- Final cleanup for remaining advisor warnings:
-- - product_memberships: remove duplicate permissive policies
-- - telemetry_events: avoid repeated auth function eval in RLS expression

do $$
declare
  policy_name text;
begin
  if to_regclass('public.product_memberships') is not null then
    execute 'alter table public.product_memberships enable row level security';

    for policy_name in
      select policyname
      from pg_policies
      where schemaname = 'public'
        and tablename = 'product_memberships'
    loop
      execute format('drop policy if exists %I on public.product_memberships', policy_name);
    end loop;

    execute 'create policy "product_memberships_self_all"
      on public.product_memberships
      for all
      to authenticated
      using ((select auth.uid()) = user_id)
      with check ((select auth.uid()) = user_id)';
  end if;

  if to_regclass('public.telemetry_events') is not null then
    execute 'alter table public.telemetry_events enable row level security';
    execute 'drop policy if exists "telemetry_events_insert_public" on public.telemetry_events';
    execute 'create policy "telemetry_events_insert_public"
      on public.telemetry_events
      for insert
      to anon, authenticated
      with check (
        coalesce((select auth.uid()) = user_id, user_id is null)
      )';
  end if;
end $$;

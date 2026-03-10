-- Consolidate owner/self RLS policies to reduce "multiple permissive policies"
-- and use initplan-friendly auth expression.

do $$
begin
  if to_regclass('public.product_memberships') is not null then
    execute 'alter table public.product_memberships enable row level security';
    execute 'drop policy if exists "product_memberships_self_read" on public.product_memberships';
    execute 'drop policy if exists "product_memberships_self_insert" on public.product_memberships';
    execute 'drop policy if exists "product_memberships_self_update" on public.product_memberships';
    execute 'drop policy if exists "product_memberships_self_all" on public.product_memberships';
    execute 'create policy "product_memberships_self_all"
      on public.product_memberships
      for all
      to authenticated
      using ((select auth.uid()) = user_id)
      with check ((select auth.uid()) = user_id)';
  end if;

  if to_regclass('public.studio_terms_acceptances') is not null then
    execute 'alter table public.studio_terms_acceptances enable row level security';
    execute 'drop policy if exists "studio_terms_owner_read" on public.studio_terms_acceptances';
    execute 'drop policy if exists "studio_terms_owner_insert" on public.studio_terms_acceptances';
    execute 'drop policy if exists "studio_terms_owner_update" on public.studio_terms_acceptances';
    execute 'drop policy if exists "studio_terms_owner_all" on public.studio_terms_acceptances';
    execute 'create policy "studio_terms_owner_all"
      on public.studio_terms_acceptances
      for all
      to authenticated
      using ((select auth.uid()) = user_id)
      with check ((select auth.uid()) = user_id)';
  end if;

  if to_regclass('public.visuales_accounts') is not null then
    execute 'alter table public.visuales_accounts enable row level security';
    execute 'drop policy if exists "visuales_accounts_owner_read" on public.visuales_accounts';
    execute 'drop policy if exists "visuales_accounts_owner_insert" on public.visuales_accounts';
    execute 'drop policy if exists "visuales_accounts_owner_update" on public.visuales_accounts';
    execute 'drop policy if exists "visuales_accounts_owner_delete" on public.visuales_accounts';
    execute 'drop policy if exists "visuales_accounts_owner_all" on public.visuales_accounts';
    execute 'create policy "visuales_accounts_owner_all"
      on public.visuales_accounts
      for all
      to authenticated
      using ((select auth.uid()) = owner_id)
      with check ((select auth.uid()) = owner_id)';
  end if;

  if to_regclass('public.studio_agreements') is not null then
    execute 'alter table public.studio_agreements enable row level security';
    execute 'drop policy if exists "studio_agreements_owner_read" on public.studio_agreements';
    execute 'drop policy if exists "studio_agreements_owner_insert" on public.studio_agreements';
    execute 'drop policy if exists "studio_agreements_owner_update" on public.studio_agreements';
    execute 'drop policy if exists "studio_agreements_owner_delete" on public.studio_agreements';
    execute 'drop policy if exists "studio_agreements_owner_all" on public.studio_agreements';
    execute 'create policy "studio_agreements_owner_all"
      on public.studio_agreements
      for all
      to authenticated
      using ((select auth.uid()) = owner_id)
      with check ((select auth.uid()) = owner_id)';
  end if;

  if to_regclass('public.dev_studio_commits') is not null then
    execute 'alter table public.dev_studio_commits enable row level security';
    execute 'drop policy if exists "dev_studio_commits_select_owner" on public.dev_studio_commits';
    execute 'drop policy if exists "dev_studio_commits_insert_owner" on public.dev_studio_commits';
    execute 'drop policy if exists "dev_studio_commits_update_owner" on public.dev_studio_commits';
    execute 'drop policy if exists "dev_studio_commits_delete_owner" on public.dev_studio_commits';
    execute 'drop policy if exists "dev_studio_commits_owner_all" on public.dev_studio_commits';
    execute 'create policy "dev_studio_commits_owner_all"
      on public.dev_studio_commits
      for all
      to authenticated
      using ((select auth.uid()) = user_id)
      with check ((select auth.uid()) = user_id)';
  end if;

  if to_regclass('public.dev_projects') is not null then
    execute 'alter table public.dev_projects enable row level security';
    execute 'drop policy if exists "dev_projects_owner_insert" on public.dev_projects';
    execute 'drop policy if exists "dev_projects_owner_update" on public.dev_projects';
    execute 'drop policy if exists "dev_projects_owner_delete" on public.dev_projects';
    execute 'create policy "dev_projects_owner_insert"
      on public.dev_projects
      for insert
      to authenticated
      with check ((select auth.uid()) = created_by)';
    execute 'create policy "dev_projects_owner_update"
      on public.dev_projects
      for update
      to authenticated
      using ((select auth.uid()) = created_by)
      with check ((select auth.uid()) = created_by)';
    execute 'create policy "dev_projects_owner_delete"
      on public.dev_projects
      for delete
      to authenticated
      using ((select auth.uid()) = created_by)';
  end if;
end $$;

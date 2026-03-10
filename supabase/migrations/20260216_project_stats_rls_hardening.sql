-- Harden project_stats RLS/write surface.
-- Keep public read via SELECT policy, but deny direct writes from anon/authenticated.
-- Writes are performed only through SECURITY DEFINER RPCs.

drop policy if exists "project_stats_update_authenticated" on public.project_stats;
drop policy if exists "project_stats_insert_authenticated" on public.project_stats;
drop policy if exists "project_stats_delete_authenticated" on public.project_stats;

revoke insert, update, delete on table public.project_stats from anon, authenticated;

-- Ensure read policy exists (idempotent)
drop policy if exists "project_stats_read_public" on public.project_stats;
create policy "project_stats_read_public"
on public.project_stats
for select
to anon, authenticated
using (true);

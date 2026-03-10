create table if not exists public.product_memberships (
  user_id uuid not null references auth.users(id) on delete cascade,
  product_slug text not null,
  role text not null default 'explorer' check (role in ('explorer', 'collaborator', 'admin')),
  updated_at timestamptz not null default now(),
  primary key (user_id, product_slug)
);

create index if not exists idx_product_memberships_user
  on public.product_memberships (user_id, product_slug);

alter table public.product_memberships enable row level security;

drop policy if exists "product_memberships_self_read" on public.product_memberships;
create policy "product_memberships_self_read"
on public.product_memberships
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "product_memberships_self_insert" on public.product_memberships;
create policy "product_memberships_self_insert"
on public.product_memberships
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "product_memberships_self_update" on public.product_memberships;
create policy "product_memberships_self_update"
on public.product_memberships
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create or replace function public.upsert_product_membership(
  p_user_id uuid,
  p_product_slug text,
  p_role text default 'explorer'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_user_id is null or coalesce(trim(p_product_slug), '') = '' then
    return;
  end if;

  insert into public.product_memberships (user_id, product_slug, role)
  values (p_user_id, p_product_slug, p_role)
  on conflict (user_id, product_slug)
  do update
  set role = case
        when public.product_memberships.role = 'admin' then 'admin'
        when public.product_memberships.role = 'collaborator' then 'collaborator'
        when excluded.role = 'collaborator' then 'collaborator'
        else public.product_memberships.role
      end,
      updated_at = now();
end;
$$;

grant execute on function public.upsert_product_membership(uuid, text, text) to authenticated;

create or replace function public.promote_membership_from_project()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid;
  product text;
begin
  if tg_table_name = 'projects' then
    actor_id := new.user_id;
    product := 'visuales';
  elsif tg_table_name = 'dev_projects' then
    actor_id := new.created_by;
    product := 'dev';
  else
    return new;
  end if;

  perform public.upsert_product_membership(actor_id, product, 'collaborator');
  return new;
end;
$$;

do $$
begin
  if to_regclass('public.projects') is not null then
    execute 'drop trigger if exists trg_promote_membership_projects on public.projects';
    execute 'create trigger trg_promote_membership_projects
      after insert on public.projects
      for each row
      execute function public.promote_membership_from_project()';
  end if;

  if to_regclass('public.dev_projects') is not null then
    execute 'drop trigger if exists trg_promote_membership_dev_projects on public.dev_projects';
    execute 'create trigger trg_promote_membership_dev_projects
      after insert on public.dev_projects
      for each row
      execute function public.promote_membership_from_project()';
  end if;

end $$;

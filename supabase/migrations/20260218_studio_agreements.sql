create table if not exists public.studio_agreements (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  partner text not null,
  scope text not null default '',
  status text not null default 'pendiente' check (status in ('pendiente', 'activo', 'pausado', 'cerrado')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_studio_agreements_owner_updated
  on public.studio_agreements (owner_id, updated_at desc);

alter table public.studio_agreements enable row level security;

drop policy if exists "studio_agreements_owner_read" on public.studio_agreements;
create policy "studio_agreements_owner_read"
on public.studio_agreements
for select
to authenticated
using (auth.uid() = owner_id);

drop policy if exists "studio_agreements_owner_insert" on public.studio_agreements;
create policy "studio_agreements_owner_insert"
on public.studio_agreements
for insert
to authenticated
with check (auth.uid() = owner_id);

drop policy if exists "studio_agreements_owner_update" on public.studio_agreements;
create policy "studio_agreements_owner_update"
on public.studio_agreements
for update
to authenticated
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

drop policy if exists "studio_agreements_owner_delete" on public.studio_agreements;
create policy "studio_agreements_owner_delete"
on public.studio_agreements
for delete
to authenticated
using (auth.uid() = owner_id);

create or replace function public.touch_studio_agreements_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_touch_studio_agreements_updated_at on public.studio_agreements;
create trigger trg_touch_studio_agreements_updated_at
before update on public.studio_agreements
for each row
execute function public.touch_studio_agreements_updated_at();

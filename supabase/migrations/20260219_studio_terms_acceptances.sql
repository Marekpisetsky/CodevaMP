create table if not exists public.studio_terms_acceptances (
  user_id uuid not null references auth.users(id) on delete cascade,
  terms_key text not null,
  terms_version text not null,
  accepted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, terms_key)
);

create index if not exists idx_studio_terms_acceptances_user
  on public.studio_terms_acceptances (user_id, accepted_at desc);

alter table public.studio_terms_acceptances enable row level security;

drop policy if exists "studio_terms_owner_read" on public.studio_terms_acceptances;
create policy "studio_terms_owner_read"
on public.studio_terms_acceptances
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "studio_terms_owner_insert" on public.studio_terms_acceptances;
create policy "studio_terms_owner_insert"
on public.studio_terms_acceptances
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "studio_terms_owner_update" on public.studio_terms_acceptances;
create policy "studio_terms_owner_update"
on public.studio_terms_acceptances
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create or replace function public.touch_studio_terms_acceptances_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_touch_studio_terms_acceptances_updated_at on public.studio_terms_acceptances;
create trigger trg_touch_studio_terms_acceptances_updated_at
before update on public.studio_terms_acceptances
for each row
execute function public.touch_studio_terms_acceptances_updated_at();

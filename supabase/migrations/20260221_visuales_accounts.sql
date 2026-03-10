create table if not exists public.visuales_accounts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  username text not null unique,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_visuales_accounts_owner_created
  on public.visuales_accounts (owner_id, created_at desc);

alter table public.visuales_accounts enable row level security;

drop policy if exists "visuales_accounts_owner_read" on public.visuales_accounts;
create policy "visuales_accounts_owner_read"
on public.visuales_accounts
for select
to authenticated
using (auth.uid() = owner_id);

drop policy if exists "visuales_accounts_owner_insert" on public.visuales_accounts;
create policy "visuales_accounts_owner_insert"
on public.visuales_accounts
for insert
to authenticated
with check (auth.uid() = owner_id);

drop policy if exists "visuales_accounts_owner_update" on public.visuales_accounts;
create policy "visuales_accounts_owner_update"
on public.visuales_accounts
for update
to authenticated
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

drop policy if exists "visuales_accounts_owner_delete" on public.visuales_accounts;
create policy "visuales_accounts_owner_delete"
on public.visuales_accounts
for delete
to authenticated
using (auth.uid() = owner_id);

create or replace function public.touch_visuales_accounts_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_touch_visuales_accounts_updated_at on public.visuales_accounts;
create trigger trg_touch_visuales_accounts_updated_at
before update on public.visuales_accounts
for each row
execute function public.touch_visuales_accounts_updated_at();

create or replace function public.create_visuales_account(
  p_username text,
  p_display_name text default null
)
returns public.visuales_accounts
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid;
  normalized_username text;
  total_count integer;
  recent_count integer;
  created_row public.visuales_accounts;
begin
  actor := auth.uid();
  if actor is null then
    raise exception 'Debes iniciar sesion para crear subcuentas.';
  end if;

  normalized_username := lower(regexp_replace(coalesce(p_username, ''), '^@+', ''));
  normalized_username := trim(normalized_username);

  if length(normalized_username) < 3 or length(normalized_username) > 24 then
    raise exception 'Usuario invalido. Usa 3-24 caracteres.';
  end if;
  if normalized_username !~ '^[a-z0-9_-]+$' then
    raise exception 'Usuario invalido. Solo letras, numeros, - y _.';
  end if;

  select count(*) into total_count
  from public.visuales_accounts
  where owner_id = actor;
  if total_count >= 10 then
    raise exception 'Limite alcanzado: maximo 10 subcuentas.';
  end if;

  select count(*) into recent_count
  from public.visuales_accounts
  where owner_id = actor
    and created_at >= now() - interval '6 months';
  if recent_count >= 3 then
    raise exception 'Limite alcanzado: maximo 3 subcuentas cada 6 meses.';
  end if;

  insert into public.visuales_accounts (owner_id, username, display_name)
  values (actor, normalized_username, nullif(trim(coalesce(p_display_name, '')), ''))
  returning * into created_row;

  return created_row;
exception
  when unique_violation then
    raise exception 'Ese usuario ya esta en uso.';
end;
$$;

grant execute on function public.create_visuales_account(text, text) to authenticated;

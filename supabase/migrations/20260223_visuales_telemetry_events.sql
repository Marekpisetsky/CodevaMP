create table if not exists public.telemetry_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null check (event_name in ('project_card_click', 'search_no_results')),
  route text not null default '/visuales',
  user_id uuid references auth.users(id) on delete set null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_telemetry_events_created_at
  on public.telemetry_events (created_at desc);

create index if not exists idx_telemetry_events_event_created
  on public.telemetry_events (event_name, created_at desc);

create index if not exists idx_telemetry_events_route_created
  on public.telemetry_events (route, created_at desc);

create index if not exists idx_telemetry_events_payload_gin
  on public.telemetry_events using gin (payload);

alter table public.telemetry_events enable row level security;

revoke all on table public.telemetry_events from anon, authenticated;
grant insert on table public.telemetry_events to anon, authenticated;

drop policy if exists "telemetry_events_insert_public" on public.telemetry_events;
create policy "telemetry_events_insert_public"
on public.telemetry_events
for insert
to anon, authenticated
with check (
  coalesce(auth.uid() = user_id, user_id is null)
);

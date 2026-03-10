-- Remove secondary indexes currently flagged as unused by Advisor.
-- Keep primary keys / constraint-backed indexes intact.

drop index if exists public.idx_project_view_events_lookup;

drop index if exists public.dev_studio_commits_user_project_created_idx;
drop index if exists public.dev_studio_commits_user_project_branch_created_idx;

drop index if exists public.idx_dev_projects_created_at;
drop index if exists public.idx_dev_projects_created_by;

drop index if exists public.idx_studio_terms_acceptances_user;

drop index if exists public.idx_telemetry_events_created_at;
drop index if exists public.idx_telemetry_events_event_created;
drop index if exists public.idx_telemetry_events_route_created;
drop index if exists public.idx_telemetry_events_payload_gin;

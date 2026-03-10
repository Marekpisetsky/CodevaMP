-- Supabase advisor cleanup:
-- 1) Ensure foreign keys have covering indexes (fixes "Unindexed foreign keys", including prototypes).
-- 2) Drop non-constraint secondary indexes on tables flagged as "Unused Index" in advisor.

do $$
declare
  fk_rec record;
  col_list text;
  idx_name text;
  has_covering_idx boolean;
  target_table text;
  drop_rec record;
begin
  -- 1) Create missing FK indexes across public schema.
  for fk_rec in
    select
      c.oid as constraint_oid,
      n.nspname as schema_name,
      t.relname as table_name,
      c.conrelid as table_oid,
      c.conkey as conkey
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    where c.contype = 'f'
      and n.nspname = 'public'
  loop
    select string_agg(quote_ident(a.attname), ', ' order by k.ord)
      into col_list
    from unnest(fk_rec.conkey) with ordinality as k(attnum, ord)
    join pg_attribute a
      on a.attrelid = fk_rec.table_oid
     and a.attnum = k.attnum;

    select exists (
      select 1
      from pg_indexes i
      where i.schemaname = fk_rec.schema_name
        and i.tablename = fk_rec.table_name
        and replace(i.indexdef, ' ', '') like '%(' || replace(col_list, ' ', '') || '%'
    )
    into has_covering_idx;

    if not has_covering_idx then
      idx_name := left(
        format(
          'idx_%s_%s_fk_auto',
          fk_rec.table_name,
          replace(replace(col_list, ', ', '_'), '"', '')
        ),
        63
      );
      execute format(
        'create index if not exists %I on %I.%I (%s)',
        idx_name,
        fk_rec.schema_name,
        fk_rec.table_name,
        col_list
      );
    end if;
  end loop;

  -- 2) Drop non-primary/non-unique/non-constraint indexes on advisor-flagged tables.
  foreach target_table in array array[
    'autonomy_decisions',
    'autonomy_deployments',
    'autonomy_feedback',
    'autonomy_task_events',
    'autonomy_tasks',
    'dev_projects',
    'dev_studio_commits',
    'project_view_events',
    'telemetry_events'
  ]
  loop
    if to_regclass(format('public.%s', target_table)) is null then
      continue;
    end if;

    for drop_rec in
      select i.indexrelid::regclass::text as index_name
      from pg_index i
      join pg_class tbl on tbl.oid = i.indrelid
      join pg_namespace ns on ns.oid = tbl.relnamespace
      where ns.nspname = 'public'
        and tbl.relname = target_table
        and i.indisprimary = false
        and i.indisunique = false
        and not exists (
          select 1
          from pg_constraint c
          where c.conindid = i.indexrelid
        )
    loop
      execute format('drop index if exists %s', drop_rec.index_name);
    end loop;
  end loop;
end $$;


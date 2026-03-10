-- 1) Auto-create missing FK indexes in public schema.
-- 2) Drop non-constraint secondary indexes on public.prototypes (unused index cleanup).

do $$
declare
  rec record;
  col_list text;
  idx_name text;
  has_covering_idx boolean;
  drop_rec record;
begin
  -- Create indexes for FK columns where no covering index exists.
  for rec in
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
    from unnest(rec.conkey) with ordinality as k(attnum, ord)
    join pg_attribute a
      on a.attrelid = rec.table_oid
     and a.attnum = k.attnum;

    select exists (
      select 1
      from pg_indexes i
      where i.schemaname = rec.schema_name
        and i.tablename = rec.table_name
        and replace(i.indexdef, ' ', '') like '%(' || replace(col_list, ' ', '') || '%'
    )
    into has_covering_idx;

    if not has_covering_idx then
      idx_name := left(format('idx_%s_%s_fk_auto', rec.table_name, replace(replace(col_list, ', ', '_'), '"', '')), 63);
      execute format(
        'create index if not exists %I on %I.%I (%s)',
        idx_name,
        rec.schema_name,
        rec.table_name,
        col_list
      );
    end if;
  end loop;

  -- Drop non-primary/non-unique/non-constraint indexes on prototypes.
  if to_regclass('public.prototypes') is not null then
    for drop_rec in
      select i.indexrelid::regclass::text as index_name
      from pg_index i
      join pg_class tbl on tbl.oid = i.indrelid
      join pg_namespace ns on ns.oid = tbl.relnamespace
      where ns.nspname = 'public'
        and tbl.relname = 'prototypes'
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
  end if;
end $$;

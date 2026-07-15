-- Create this RPC in your Supabase database.
-- It groups by topic JSON and returns count totals.
-- Use SQL editor in Supabase and run this full script.

drop function if exists public.topic_group_counts(text, text);

create or replace function public.topic_group_counts(category text, table_name text)
returns table(topic jsonb, count bigint, first_id bigint)
language plpgsql
stable
as $$
declare
  sql text;
begin
  sql := format(
    'select
       jsonb_build_object(''en'', topic->>''en'', ''hi'', topic->>''hi'') as topic,
       count(*)::bigint as count,
       min(id)::bigint as first_id
     from %I
     where topic is not null
       %s
     group by topic->>''en'', topic->>''hi''
     order by first_id asc',
    table_name,
    case
      when category is not null and btrim(category) <> '' then
        format(
          'and (
             lower(coalesce(sub_category->>''en'', '''')) = lower(%L)
             or lower(coalesce(sub_category->>''hi'', '''')) = lower(%L)
             or lower(coalesce(sub_category::text, '''')) like lower(%L)
           )',
          category,
          category,
          '%' || category || '%'
        )
      else
        ''
    end
  );

  return query execute sql;
end;
$$;

grant execute on function public.topic_group_counts(text, text) to anon, authenticated, service_role;

-- If PostgREST schema cache is stale, run this once after creating function:
-- select pg_notify('pgrst', 'reload schema');

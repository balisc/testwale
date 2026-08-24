-- QuestionWale: authenticated per-exam navigation preferences.
-- Production-safe reconciliation for both a missing table and an earlier
-- partial/failed migration. This application uses a signed app cookie backed
-- by public.users; browser roles never access this table directly.
--
-- Run after:
--   1. migrate_target_exam_onboarding.sql
--   2. migrate_exam_selector_content_readiness.sql

begin;

-- ---------------------------------------------------------------------------
-- Preflight base schema and the ON CONFLICT contract used by onboarding.
-- ---------------------------------------------------------------------------

do $$
declare
  v_missing text;
  v_wrong text;
  v_user_id_attnum smallint;
  v_has_unique_user_id boolean;
begin
  select string_agg(required_name, ', ' order by required_name)
  into v_missing
  from unnest(array[
    'public.users',
    'public.user_profiles',
    'public.exams',
    'public.exam_profiles',
    'public.exam_profile_stages',
    'public.exam_selector_options',
    'public.ssc_cgl_tier_availability'
  ]) as required(required_name)
  where to_regclass(required_name) is null;

  if v_missing is not null then
    raise exception
      'exam preference preflight failed; missing required relations: %',
      v_missing;
  end if;

  with required_columns(table_name, column_name) as (
    values
      ('users', 'id'),
      ('user_profiles', 'user_id'),
      ('user_profiles', 'target_exam_id'),
      ('user_profiles', 'target_exam'),
      ('user_profiles', 'exam_date'),
      ('user_profiles', 'exam_onboarding_required'),
      ('user_profiles', 'exam_onboarding_completed_at'),
      ('user_profiles', 'updated_at'),
      ('exam_profiles', 'id'),
      ('exam_profiles', 'code'),
      ('exam_profiles', 'is_active')
  )
  select string_agg(format('public.%I.%I', r.table_name, r.column_name), ', ' order by r.table_name, r.column_name)
  into v_missing
  from required_columns r
  left join information_schema.columns c
    on c.table_schema = 'public'
   and c.table_name = r.table_name
   and c.column_name = r.column_name
  where c.column_name is null;

  if v_missing is not null then
    raise exception
      'exam preference preflight failed; missing required columns: %',
      v_missing;
  end if;

  with expected(table_name, column_name, data_type) as (
    values
      ('users', 'id', 'uuid'),
      ('user_profiles', 'user_id', 'uuid'),
      ('user_profiles', 'target_exam_id', 'uuid'),
      ('user_profiles', 'exam_date', 'date'),
      ('exam_profiles', 'id', 'uuid'),
      ('exams', 'id', 'uuid')
  )
  select string_agg(
    format('public.%I.%I expected %s, found %s', e.table_name, e.column_name, e.data_type, coalesce(c.data_type, '<missing>')),
    '; ' order by e.table_name, e.column_name
  )
  into v_wrong
  from expected e
  left join information_schema.columns c
    on c.table_schema = 'public'
   and c.table_name = e.table_name
   and c.column_name = e.column_name
  where c.data_type is distinct from e.data_type;

  if v_wrong is not null then
    raise exception
      'exam preference preflight failed; incompatible base column types: %',
      v_wrong;
  end if;

  select a.attnum::smallint
  into v_user_id_attnum
  from pg_attribute a
  where a.attrelid = 'public.user_profiles'::regclass
    and a.attname = 'user_id'
    and a.attisdropped is false;

  select exists (
    select 1
    from pg_index i
    where i.indrelid = 'public.user_profiles'::regclass
      and i.indisunique is true
      and i.indisvalid is true
      and i.indpred is null
      and i.indexprs is null
      and i.indnkeyatts = 1
      and i.indkey[0] = v_user_id_attnum
  )
  into v_has_unique_user_id;

  if not v_has_unique_user_id then
    raise exception
      'exam preference preflight failed; public.user_profiles.user_id must have a valid single-column UNIQUE or PRIMARY KEY for ON CONFLICT (user_id)';
  end if;
end;
$$;

-- A partial non-empty table without ownership/key columns cannot be repaired
-- without inventing data. Fail instead of deleting or merging rows.
do $$
declare
  v_has_rows boolean;
  v_missing text;
  v_relkind "char";
begin
  if to_regclass('public.user_exam_preferences') is null then
    return;
  end if;

  select c.relkind
  into v_relkind
  from pg_class c
  where c.oid = 'public.user_exam_preferences'::regclass;

  if v_relkind not in ('r', 'p') then
    raise exception
      'exam preference reconciliation stopped; public.user_exam_preferences exists but is not a table (relkind %)',
      v_relkind;
  end if;

  execute 'select exists (select 1 from public.user_exam_preferences)'
  into v_has_rows;

  select string_agg(required_column, ', ' order by required_column)
  into v_missing
  from unnest(array['user_id', 'exam_profile_id', 'preferred_tier_code']) as required(required_column)
  where not exists (
    select 1
    from information_schema.columns c
    where c.table_schema = 'public'
      and c.table_name = 'user_exam_preferences'
      and c.column_name = required.required_column
  );

  if v_has_rows and v_missing is not null then
    raise exception
      'exam preference reconciliation stopped; non-empty public.user_exam_preferences is missing non-inferable columns: %. Repair explicitly without deleting rows, then rerun.',
      v_missing;
  end if;
end;
$$;

create table if not exists public.user_exam_preferences (
  user_id uuid,
  exam_profile_id uuid,
  preferred_tier_code text,
  preferred_stage_code text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.user_exam_preferences
  add column if not exists user_id uuid,
  add column if not exists exam_profile_id uuid,
  add column if not exists preferred_tier_code text,
  add column if not exists preferred_stage_code text,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

do $$
declare
  v_bad_types text;
begin
  with expected(column_name, data_type) as (
    values
      ('user_id', 'uuid'),
      ('exam_profile_id', 'uuid'),
      ('preferred_tier_code', 'text'),
      ('preferred_stage_code', 'text'),
      ('created_at', 'timestamp with time zone'),
      ('updated_at', 'timestamp with time zone')
  )
  select string_agg(
    format('%s expected %s, found %s', e.column_name, e.data_type, coalesce(c.data_type, '<missing>')),
    '; ' order by e.column_name
  )
  into v_bad_types
  from expected e
  left join information_schema.columns c
    on c.table_schema = 'public'
   and c.table_name = 'user_exam_preferences'
   and c.column_name = e.column_name
  where c.data_type is distinct from e.data_type;

  if v_bad_types is not null then
    raise exception
      'exam preference reconciliation stopped; incompatible column types: %',
      v_bad_types;
  end if;
end;
$$;

-- Safe deterministic backfills for inferable fields only.
update public.user_exam_preferences
set preferred_stage_code = case preferred_tier_code
  when 'TIER_I' then 'TIER_I'
  when 'TIER_II' then 'TIER_II_PAPER_I'
  else preferred_stage_code
end
where preferred_stage_code is null;

update public.user_exam_preferences
set created_at = coalesce(created_at, now()),
    updated_at = coalesce(updated_at, created_at, now())
where created_at is null or updated_at is null;

do $$
declare
  v_null_rows bigint;
  v_invalid_rows bigint;
  v_duplicate_groups bigint;
  v_orphan_users bigint;
  v_orphan_profiles bigint;
begin
  select count(*) into v_null_rows
  from public.user_exam_preferences
  where user_id is null
     or exam_profile_id is null
     or preferred_tier_code is null
     or preferred_stage_code is null
     or created_at is null
     or updated_at is null;
  if v_null_rows > 0 then
    raise exception
      'exam preference reconciliation stopped; % rows contain NULL required values',
      v_null_rows;
  end if;

  select count(*) into v_invalid_rows
  from public.user_exam_preferences p
  where p.preferred_tier_code not in ('TIER_I', 'TIER_II')
     or not (
       (p.preferred_tier_code = 'TIER_I' and p.preferred_stage_code = 'TIER_I')
       or
       (p.preferred_tier_code = 'TIER_II' and p.preferred_stage_code in (
         'TIER_II_PAPER_I', 'TIER_II_PAPER_II', 'TIER_II_PAPER_III'
       ))
     );
  if v_invalid_rows > 0 then
    raise exception
      'exam preference reconciliation stopped; % rows have invalid Tier/stage combinations',
      v_invalid_rows;
  end if;

  select count(*) into v_duplicate_groups
  from (
    select user_id, exam_profile_id
    from public.user_exam_preferences
    group by user_id, exam_profile_id
    having count(*) > 1
  ) duplicates;
  if v_duplicate_groups > 0 then
    raise exception
      'exam preference reconciliation stopped; % duplicate (user_id, exam_profile_id) groups exist. No rows were deleted or merged.',
      v_duplicate_groups;
  end if;

  select count(*) into v_orphan_users
  from public.user_exam_preferences p
  left join public.users u on u.id = p.user_id
  where u.id is null;
  if v_orphan_users > 0 then
    raise exception
      'exam preference reconciliation stopped; % rows reference missing public.users records',
      v_orphan_users;
  end if;

  select count(*) into v_orphan_profiles
  from public.user_exam_preferences p
  left join public.exam_profiles ep on ep.id = p.exam_profile_id
  where ep.id is null;
  if v_orphan_profiles > 0 then
    raise exception
      'exam preference reconciliation stopped; % rows reference missing public.exam_profiles records',
      v_orphan_profiles;
  end if;
end;
$$;

alter table public.user_exam_preferences
  alter column user_id set not null,
  alter column exam_profile_id set not null,
  alter column preferred_tier_code set not null,
  alter column preferred_stage_code set not null,
  alter column created_at set default now(),
  alter column created_at set not null,
  alter column updated_at set default now(),
  alter column updated_at set not null;

-- Install the canonical composite primary key. A different existing primary
-- key is an unsafe schema conflict and is never silently replaced.
do $$
declare
  v_user_attnum smallint;
  v_exam_attnum smallint;
  v_existing_name text;
  v_existing_key smallint[];
begin
  select a.attnum::smallint into v_user_attnum
  from pg_attribute a
  where a.attrelid = 'public.user_exam_preferences'::regclass
    and a.attname = 'user_id' and a.attisdropped is false;
  select a.attnum::smallint into v_exam_attnum
  from pg_attribute a
  where a.attrelid = 'public.user_exam_preferences'::regclass
    and a.attname = 'exam_profile_id' and a.attisdropped is false;

  select c.conname, c.conkey
  into v_existing_name, v_existing_key
  from pg_constraint c
  where c.conrelid = 'public.user_exam_preferences'::regclass
    and c.contype = 'p';

  if v_existing_name is null then
    alter table public.user_exam_preferences
      add constraint user_exam_preferences_pkey
      primary key (user_id, exam_profile_id);
  elsif v_existing_key is distinct from array[v_user_attnum, v_exam_attnum]::smallint[] then
    raise exception
      'exam preference reconciliation stopped; existing primary key % is not (user_id, exam_profile_id)',
      v_existing_name;
  end if;
end;
$$;

-- Reconcile named constraints without dropping a valid or conflicting object.
-- A same-name incompatible definition stops the transaction with diagnostics.
do $$
declare
  v_user_attnum smallint;
  v_exam_attnum smallint;
  v_users_id_attnum smallint;
  v_profiles_id_attnum smallint;
  v_constraint record;
begin
  select attnum::smallint into v_user_attnum from pg_attribute
  where attrelid = 'public.user_exam_preferences'::regclass and attname = 'user_id' and not attisdropped;
  select attnum::smallint into v_exam_attnum from pg_attribute
  where attrelid = 'public.user_exam_preferences'::regclass and attname = 'exam_profile_id' and not attisdropped;
  select attnum::smallint into v_users_id_attnum from pg_attribute
  where attrelid = 'public.users'::regclass and attname = 'id' and not attisdropped;
  select attnum::smallint into v_profiles_id_attnum from pg_attribute
  where attrelid = 'public.exam_profiles'::regclass and attname = 'id' and not attisdropped;

  select c.* into v_constraint from pg_constraint c
  where c.conrelid = 'public.user_exam_preferences'::regclass
    and c.conname = 'user_exam_preferences_user_id_fkey';
  if found then
    if v_constraint.contype <> 'f'
       or v_constraint.confrelid <> 'public.users'::regclass
       or v_constraint.conkey is distinct from array[v_user_attnum]::smallint[]
       or v_constraint.confkey is distinct from array[v_users_id_attnum]::smallint[] then
      raise exception 'constraint user_exam_preferences_user_id_fkey has incompatible definition: %',
        pg_get_constraintdef(v_constraint.oid, true);
    end if;
  else
    alter table public.user_exam_preferences
      add constraint user_exam_preferences_user_id_fkey
      foreign key (user_id) references public.users(id) on delete cascade;
  end if;

  select c.* into v_constraint from pg_constraint c
  where c.conrelid = 'public.user_exam_preferences'::regclass
    and c.conname = 'user_exam_preferences_exam_profile_id_fkey';
  if found then
    if v_constraint.contype <> 'f'
       or v_constraint.confrelid <> 'public.exam_profiles'::regclass
       or v_constraint.conkey is distinct from array[v_exam_attnum]::smallint[]
       or v_constraint.confkey is distinct from array[v_profiles_id_attnum]::smallint[] then
      raise exception 'constraint user_exam_preferences_exam_profile_id_fkey has incompatible definition: %',
        pg_get_constraintdef(v_constraint.oid, true);
    end if;
  else
    alter table public.user_exam_preferences
      add constraint user_exam_preferences_exam_profile_id_fkey
      foreign key (exam_profile_id) references public.exam_profiles(id) on delete cascade;
  end if;

  select c.* into v_constraint from pg_constraint c
  where c.conrelid = 'public.user_exam_preferences'::regclass
    and c.conname = 'user_exam_preferences_tier_code_check';
  if found then
    if v_constraint.contype <> 'c'
       or pg_get_constraintdef(v_constraint.oid, true) not ilike '%preferred_tier_code%TIER_I%TIER_II%' then
      raise exception 'constraint user_exam_preferences_tier_code_check has incompatible definition: %',
        pg_get_constraintdef(v_constraint.oid, true);
    end if;
  else
    alter table public.user_exam_preferences
      add constraint user_exam_preferences_tier_code_check
      check (preferred_tier_code in ('TIER_I', 'TIER_II'));
  end if;

  select c.* into v_constraint from pg_constraint c
  where c.conrelid = 'public.user_exam_preferences'::regclass
    and c.conname = 'user_exam_preferences_stage_code_check';
  if found then
    if v_constraint.contype <> 'c'
       or pg_get_constraintdef(v_constraint.oid, true) not ilike '%preferred_tier_code%preferred_stage_code%TIER_I%TIER_II_PAPER_I%TIER_II_PAPER_II%TIER_II_PAPER_III%' then
      raise exception 'constraint user_exam_preferences_stage_code_check has incompatible definition: %',
        pg_get_constraintdef(v_constraint.oid, true);
    end if;
  else
    alter table public.user_exam_preferences
      add constraint user_exam_preferences_stage_code_check
      check (
        (preferred_tier_code = 'TIER_I' and preferred_stage_code = 'TIER_I')
        or
        (preferred_tier_code = 'TIER_II' and preferred_stage_code in (
          'TIER_II_PAPER_I', 'TIER_II_PAPER_II', 'TIER_II_PAPER_III'
        ))
      );
  end if;
end;
$$;

create index if not exists idx_user_exam_preferences_exam_profile
  on public.user_exam_preferences (exam_profile_id);

-- Exact target profile on user_profiles is needed by onboarding and profile UI.
alter table public.user_profiles
  add column if not exists target_exam_profile_id uuid;

do $$
declare
  v_type text;
  v_orphans bigint;
begin
  select c.data_type into v_type
  from information_schema.columns c
  where c.table_schema = 'public'
    and c.table_name = 'user_profiles'
    and c.column_name = 'target_exam_profile_id';
  if v_type is distinct from 'uuid' then
    raise exception
      'exam preference reconciliation stopped; public.user_profiles.target_exam_profile_id must be uuid, found %',
      coalesce(v_type, '<missing>');
  end if;

  select count(*) into v_orphans
  from public.user_profiles p
  left join public.exam_profiles ep on ep.id = p.target_exam_profile_id
  where p.target_exam_profile_id is not null and ep.id is null;
  if v_orphans > 0 then
    raise exception
      'exam preference reconciliation stopped; % user_profiles rows have an invalid target_exam_profile_id',
      v_orphans;
  end if;
end;
$$;

do $$
declare
  v_target_attnum smallint;
  v_profile_id_attnum smallint;
  v_constraint record;
begin
  select attnum::smallint into v_target_attnum from pg_attribute
  where attrelid = 'public.user_profiles'::regclass
    and attname = 'target_exam_profile_id' and not attisdropped;
  select attnum::smallint into v_profile_id_attnum from pg_attribute
  where attrelid = 'public.exam_profiles'::regclass
    and attname = 'id' and not attisdropped;

  select c.* into v_constraint from pg_constraint c
  where c.conrelid = 'public.user_profiles'::regclass
    and c.conname = 'user_profiles_target_exam_profile_id_fkey';
  if found then
    if v_constraint.contype <> 'f'
       or v_constraint.confrelid <> 'public.exam_profiles'::regclass
       or v_constraint.conkey is distinct from array[v_target_attnum]::smallint[]
       or v_constraint.confkey is distinct from array[v_profile_id_attnum]::smallint[] then
      raise exception 'constraint user_profiles_target_exam_profile_id_fkey has incompatible definition: %',
        pg_get_constraintdef(v_constraint.oid, true);
    end if;
  else
    alter table public.user_profiles
      add constraint user_profiles_target_exam_profile_id_fkey
      foreign key (target_exam_profile_id) references public.exam_profiles(id) on delete restrict;
  end if;
end;
$$;

create index if not exists idx_user_profiles_target_exam_profile_id
  on public.user_profiles (target_exam_profile_id)
  where target_exam_profile_id is not null;

-- ---------------------------------------------------------------------------
-- Timestamp trigger, RLS and least-privilege grants.
-- ---------------------------------------------------------------------------

create or replace function public.touch_user_exam_preferences_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

revoke all on function public.touch_user_exam_preferences_updated_at()
  from public, anon, authenticated;

drop trigger if exists trg_user_exam_preferences_updated_at
  on public.user_exam_preferences;
create trigger trg_user_exam_preferences_updated_at
before update on public.user_exam_preferences
for each row execute function public.touch_user_exam_preferences_updated_at();

alter table public.user_exam_preferences enable row level security;

drop policy if exists "user_exam_preferences_no_direct"
  on public.user_exam_preferences;
create policy "user_exam_preferences_no_direct"
  on public.user_exam_preferences
  for all
  to anon, authenticated
  using (false)
  with check (false);

revoke all on table public.user_exam_preferences from public, anon, authenticated;
grant select, insert, update on table public.user_exam_preferences to service_role;

-- ---------------------------------------------------------------------------
-- Profile-only Tier change. Does not read or modify exam_date/onboarding state.
-- ---------------------------------------------------------------------------

-- CREATE OR REPLACE retains the stable four-argument identity. PostgreSQL does
-- not permit parameter renames in-place, so inspect and fail actionably first.
do $$
declare
  v_arg_names text[];
begin
  select p.proargnames into v_arg_names
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.proname = 'update_user_exam_tier_preference'
    and oidvectortypes(p.proargtypes) = 'uuid, uuid, text, text';

  if found and v_arg_names[1:4] is distinct from array[
    'p_user_id', 'p_exam_profile_id', 'p_preferred_tier_code', 'p_preferred_stage_code'
  ]::text[] then
    raise exception 'update_user_exam_tier_preference has incompatible argument names: %', v_arg_names;
  end if;
end;
$$;

create or replace function public.update_user_exam_tier_preference(
  p_user_id uuid,
  p_exam_profile_id uuid,
  p_preferred_tier_code text,
  p_preferred_stage_code text default null
)
returns table (
  preferred_tier_code text,
  preferred_stage_code text,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_exam_code text;
  v_stage_code text;
begin
  if p_user_id is null or not exists (
    select 1 from public.users u where u.id = p_user_id
  ) then
    raise exception 'invalid_user' using errcode = '22023';
  end if;

  select o.exam_code
  into v_exam_code
  from public.exam_selector_options o
  where o.exam_profile_id = p_exam_profile_id
    and o.can_select is true
    and o.is_coming_soon is false;

  if not found then
    raise exception 'exam_profile_not_selectable' using errcode = '22023';
  end if;
  if v_exam_code <> 'SSC_CGL' then
    raise exception 'tier_preference_not_supported_for_exam' using errcode = '22023';
  end if;
  if p_preferred_tier_code is null
     or p_preferred_tier_code not in ('TIER_I', 'TIER_II') then
    raise exception 'invalid_tier' using errcode = '22023';
  end if;

  if p_preferred_tier_code = 'TIER_I' then
    if p_preferred_stage_code is not null and p_preferred_stage_code <> 'TIER_I' then
      raise exception 'invalid_tier_stage' using errcode = '22023';
    end if;
    v_stage_code := 'TIER_I';
  else
    v_stage_code := coalesce(p_preferred_stage_code, 'TIER_II_PAPER_I');
    if v_stage_code not in ('TIER_II_PAPER_I', 'TIER_II_PAPER_II', 'TIER_II_PAPER_III') then
      raise exception 'invalid_tier_stage' using errcode = '22023';
    end if;
  end if;

  if not exists (
    select 1
    from public.ssc_cgl_tier_availability a
    where a.exam_profile_id = p_exam_profile_id
      and a.tier_code = p_preferred_tier_code
      and a.is_available is true
  ) then
    raise exception 'tier_unavailable' using errcode = '22023';
  end if;

  return query
  insert into public.user_exam_preferences (
    user_id,
    exam_profile_id,
    preferred_tier_code,
    preferred_stage_code
  ) values (
    p_user_id,
    p_exam_profile_id,
    p_preferred_tier_code,
    v_stage_code
  )
  on conflict (user_id, exam_profile_id) do update
  set preferred_tier_code = excluded.preferred_tier_code,
      preferred_stage_code = excluded.preferred_stage_code
  returning
    user_exam_preferences.preferred_tier_code,
    user_exam_preferences.preferred_stage_code,
    user_exam_preferences.updated_at;
end;
$$;

revoke all on function public.update_user_exam_tier_preference(uuid, uuid, text, text)
  from public, anon, authenticated;
grant execute on function public.update_user_exam_tier_preference(uuid, uuid, text, text)
  to service_role;

-- ---------------------------------------------------------------------------
-- Atomic onboarding + optional SSC CGL Tier preference.
-- ---------------------------------------------------------------------------

-- Repository audit confirms every current server caller uses the four-argument
-- RPC. Remove only the obsolete three-argument overload to avoid PostgREST
-- ambiguity; retain/replace the compatible four-argument function in place.
drop function if exists public.complete_exam_onboarding_with_tier(uuid, uuid, date);

do $$
declare
  v_arg_names text[];
begin
  select p.proargnames into v_arg_names
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.proname = 'complete_exam_onboarding_with_tier'
    and oidvectortypes(p.proargtypes) = 'uuid, uuid, date, text';

  if found and v_arg_names[1:4] is distinct from array[
    'p_user_id', 'p_exam_profile_id', 'p_exam_date', 'p_preferred_tier_code'
  ]::text[] then
    raise exception 'complete_exam_onboarding_with_tier has incompatible argument names: %', v_arg_names;
  end if;
end;
$$;

create or replace function public.complete_exam_onboarding_with_tier(
  p_user_id uuid,
  p_exam_profile_id uuid,
  p_exam_date date,
  p_preferred_tier_code text
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_content_exam_id uuid;
  v_exam_code text;
  v_exam_name text;
begin
  if p_user_id is null or not exists (
    select 1 from public.users u where u.id = p_user_id
  ) then
    raise exception 'invalid_user' using errcode = '22023';
  end if;

  if p_exam_date is null
     or p_exam_date <= (now() at time zone 'Asia/Kolkata')::date then
    raise exception 'invalid_exam_date' using errcode = '22007';
  end if;

  select
    o.content_exam_id,
    o.exam_code,
    coalesce(
      nullif(o.short_name, ''),
      nullif(to_jsonb(o.display_title) ->> 'en', ''),
      nullif(to_jsonb(o.official_title) ->> 'en', ''),
      o.exam_code
    )
  into v_content_exam_id, v_exam_code, v_exam_name
  from public.exam_selector_options o
  where o.exam_profile_id = p_exam_profile_id
    and o.can_select is true
    and o.is_coming_soon is false
    and o.content_exam_id is not null;

  if not found then
    raise exception 'exam_profile_not_selectable' using errcode = '22023';
  end if;

  if v_exam_code = 'SSC_CGL' then
    if p_preferred_tier_code is null
       or p_preferred_tier_code not in ('TIER_I', 'TIER_II') then
      raise exception 'invalid_ssc_cgl_tier' using errcode = '22023';
    end if;
  elsif p_preferred_tier_code is not null then
    raise exception 'tier_not_supported_for_exam' using errcode = '22023';
  end if;

  insert into public.user_profiles (
    user_id,
    target_exam_profile_id,
    target_exam_id,
    target_exam,
    exam_date,
    exam_onboarding_required,
    exam_onboarding_completed_at,
    updated_at
  ) values (
    p_user_id,
    p_exam_profile_id,
    v_content_exam_id,
    v_exam_name,
    p_exam_date,
    false,
    now(),
    now()
  )
  on conflict (user_id) do update
  set target_exam_profile_id = excluded.target_exam_profile_id,
      target_exam_id = excluded.target_exam_id,
      target_exam = excluded.target_exam,
      exam_date = excluded.exam_date,
      exam_onboarding_required = false,
      exam_onboarding_completed_at = excluded.exam_onboarding_completed_at,
      updated_at = excluded.updated_at;

  if v_exam_code = 'SSC_CGL' then
    perform public.update_user_exam_tier_preference(
      p_user_id,
      p_exam_profile_id,
      p_preferred_tier_code,
      null
    );
  end if;
end;
$$;

revoke all on function public.complete_exam_onboarding_with_tier(uuid, uuid, date, text)
  from public, anon, authenticated;
grant execute on function public.complete_exam_onboarding_with_tier(uuid, uuid, date, text)
  to service_role;

-- Fail if an unexpected overload would let PostgREST resolve an obsolete or
-- unsafe signature. The known obsolete 3-argument overload was removed above.
do $$
declare
  v_unexpected text;
begin
  select string_agg(p.oid::regprocedure::text, ', ' order by p.oid::regprocedure::text)
  into v_unexpected
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and (
      (p.proname = 'complete_exam_onboarding_with_tier'
       and oidvectortypes(p.proargtypes) <> 'uuid, uuid, date, text')
      or
      (p.proname = 'update_user_exam_tier_preference'
       and oidvectortypes(p.proargtypes) <> 'uuid, uuid, text, text')
    );

  if v_unexpected is not null then
    raise exception
      'exam preference reconciliation stopped; unexpected function overloads remain: %',
      v_unexpected;
  end if;
end;
$$;

comment on table public.user_exam_preferences is
  'Server-only Tier navigation preferences keyed by custom-auth user and exact exam profile.';

commit;

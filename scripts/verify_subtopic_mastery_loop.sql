-- =============================================================================
-- QuestionWale: verify subtopic mastery-loop migration (READ-ONLY)
-- =============================================================================
-- Run in Supabase SQL Editor AFTER scripts/migrate_subtopic_mastery_loop.sql
-- Does not INSERT, UPDATE, or DELETE any data.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Table + RLS
-- -----------------------------------------------------------------------------
select
  'user_practice_scope_state exists' as check_name,
  case when exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'user_practice_scope_state'
  ) then 'PASS' else 'FAIL' end as status;

select
  'user_practice_scope_state RLS enabled' as check_name,
  case when c.relrowsecurity then 'PASS' else 'FAIL' end as status
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname = 'user_practice_scope_state';

-- -----------------------------------------------------------------------------
-- 2. Unique constraint
-- -----------------------------------------------------------------------------
select
  'user_practice_scope_state_unique exists' as check_name,
  case when exists (
    select 1
    from pg_constraint
    where conname = 'user_practice_scope_state_unique'
      and conrelid = 'public.user_practice_scope_state'::regclass
  ) then 'PASS' else 'FAIL' end as status;

-- -----------------------------------------------------------------------------
-- 3. Expected indexes
-- -----------------------------------------------------------------------------
with expected(index_name) as (
  values
    ('idx_upss_user_scope'),
    ('idx_upss_user_phase'),
    ('idx_uqa_user_question_correct'),
    ('idx_uqa_user_question_attempted_at')
)
select
  e.index_name as check_name,
  case when i.indexname is not null then 'PASS' else 'FAIL' end as status
from expected e
left join pg_indexes i
  on i.schemaname = 'public'
 and i.indexname = e.index_name
order by e.index_name;

-- -----------------------------------------------------------------------------
-- 4. RPC signatures exist
-- -----------------------------------------------------------------------------
with expected(routine_name, identity_args) as (
  values
    ('get_or_init_subtopic_practice_scope', 'uuid, uuid, text'),
    ('get_subtopic_batch_question_state', 'uuid, uuid, text, uuid[]'),
    ('advance_subtopic_practice_cycle', 'uuid, uuid, text'),
    ('reset_subtopic_practice_progress', 'uuid, uuid, text'),
    ('submit_question_answer', 'uuid, uuid, text, integer'),
    ('reopen_subtopic_scope_from_completed', 'uuid, uuid, text, user_practice_scope_state')
)
select
  e.routine_name as check_name,
  case when p.proname is not null then 'PASS' else 'FAIL' end as status,
  coalesce(pg_get_function_identity_arguments(p.oid), '(missing)') as identity_args
from expected e
left join pg_proc p
  on p.proname = e.routine_name
 and p.pronamespace = 'public'::regnamespace
 and pg_get_function_identity_arguments(p.oid) = e.identity_args
order by e.routine_name;

-- -----------------------------------------------------------------------------
-- 5. submit_question_answer privileges
-- -----------------------------------------------------------------------------
select
  grantee,
  privilege_type
from information_schema.routine_privileges
where routine_schema = 'public'
  and routine_name = 'submit_question_answer'
order by grantee, privilege_type;

select
  'submit_question_answer service_role only' as check_name,
  case
    when exists (
      select 1
      from information_schema.routine_privileges
      where routine_schema = 'public'
        and routine_name = 'submit_question_answer'
        and grantee = 'service_role'
        and privilege_type = 'EXECUTE'
    )
    and not exists (
      select 1
      from information_schema.routine_privileges
      where routine_schema = 'public'
        and routine_name = 'submit_question_answer'
        and grantee in ('PUBLIC', 'anon', 'authenticated')
        and privilege_type = 'EXECUTE'
    )
    then 'PASS'
    else 'FAIL'
  end as status;

-- -----------------------------------------------------------------------------
-- 6. Mastery RPCs not executable by anon/authenticated
-- -----------------------------------------------------------------------------
with mastery_rpcs(routine_name) as (
  values
    ('get_or_init_subtopic_practice_scope'),
    ('get_subtopic_batch_question_state'),
    ('advance_subtopic_practice_cycle'),
    ('reset_subtopic_practice_progress')
)
select
  m.routine_name as check_name,
  case
    when not exists (
      select 1
      from information_schema.routine_privileges rp
      where rp.routine_schema = 'public'
        and rp.routine_name = m.routine_name
        and rp.grantee in ('PUBLIC', 'anon', 'authenticated')
        and rp.privilege_type = 'EXECUTE'
    )
    then 'PASS'
    else 'FAIL'
  end as status
from mastery_rpcs m
order by m.routine_name;

-- -----------------------------------------------------------------------------
-- 7. No client policies on user_practice_scope_state
-- -----------------------------------------------------------------------------
select
  polname as policy_name,
  polcmd as command,
  polroles::regrole[] as roles,
  polpermissive as permissive,
  pg_get_expr(polqual, polrelid) as using_expr,
  pg_get_expr(polwithcheck, polrelid) as with_check_expr
from pg_policy
where polrelid = 'public.user_practice_scope_state'::regclass
order by polname;

select
  'upss policies deny all client access' as check_name,
  case
    when count(*) = 4
     and bool_and(pg_get_expr(polqual, polrelid) = 'false' or polcmd in ('a', 'w'))
    then 'PASS'
    else 'REVIEW'
  end as status
from pg_policy
where polrelid = 'public.user_practice_scope_state'::regclass;

-- -----------------------------------------------------------------------------
-- 8. user_question_attempts allows multiple rows per user/question
-- -----------------------------------------------------------------------------
select
  'no unique(user_id, question_id) on user_question_attempts' as check_name,
  case when not exists (
    select 1
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public'
      and t.relname = 'user_question_attempts'
      and c.contype = 'u'
      and pg_get_constraintdef(c.oid) ilike '%user_id%'
      and pg_get_constraintdef(c.oid) ilike '%question_id%'
  ) then 'PASS' else 'FAIL' end as status;

-- -----------------------------------------------------------------------------
-- 9. No duplicate scope-state unique keys (read-only aggregate)
-- -----------------------------------------------------------------------------
select
  'duplicate user_practice_scope_state unique keys' as check_name,
  case when coalesce(sum(dup_count), 0) = 0 then 'PASS' else 'FAIL' end as status,
  coalesce(sum(dup_count), 0) as duplicate_groups
from (
  select count(*) - 1 as dup_count
  from public.user_practice_scope_state
  group by user_id, scope_type, scope_id, exam_code
  having count(*) > 1
) d;

-- -----------------------------------------------------------------------------
-- 10. Schema columns used by migration
-- -----------------------------------------------------------------------------
select
  'questions.exam_tags is text[]' as check_name,
  case when exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'questions'
      and column_name = 'exam_tags'
      and udt_name = '_text'
  ) then 'PASS' else 'FAIL' end as status;

select
  column_name,
  data_type,
  udt_name
from information_schema.columns
where table_schema = 'public'
  and table_name = 'user_question_attempts'
  and column_name in ('attempted_at', 'time_spent_seconds', 'subject_id', 'topic_id', 'subtopic_id')
order by column_name;

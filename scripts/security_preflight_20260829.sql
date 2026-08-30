-- Read-only preflight for migrate_security_hardening_20260828.sql.
-- Run first in the target Supabase SQL Editor. It changes no data or schema.

begin transaction read only;

do $$
declare
  v_name text;
  v_required_tables constant text[] := array[
    'users', 'contact_us', 'map_locations', 'map_questions',
    'history_questions', 'science_questions', 'polity_questions',
    'economics_questions', 'geography_questions', 'general_knowledge_questions',
    'math_questions', 'current_affairs_questions', 'reasoning_questions',
    'user_profiles', 'user_bookmarks', 'user_notes', 'user_attempts',
    'user_question_attempts', 'question_reports'
  ];
  v_required_functions constant text[] := array[
    'public.register_email_user(text,text,text)',
    'public.login_email_user(text,text)',
    'public.upsert_google_user(text,text,text,text)',
    'public.get_user_profile_page(uuid)',
    'public.submit_question_answer(uuid,uuid,text,integer)',
    'public.get_user_progress_dashboard(uuid)',
    'public.report_question(uuid,uuid,text,text)'
  ];
begin
  foreach v_name in array array['anon', 'authenticated', 'service_role'] loop
    if not exists (select 1 from pg_roles where rolname = v_name) then
      raise exception 'preflight failed: required Supabase role % is missing', v_name;
    end if;
  end loop;
  foreach v_name in array v_required_tables loop
    if to_regclass(format('public.%I', v_name)) is null then
      raise exception 'preflight failed: required table public.% is missing', v_name;
    end if;
  end loop;
  foreach v_name in array v_required_functions loop
    if to_regprocedure(v_name) is null then
      raise exception 'preflight failed: required function % is missing', v_name;
    end if;
  end loop;
end
$$;

select expected.table_name, expected.column_name, (actual.column_name is not null) as present
from (values
  ('map_locations', 'latitude'), ('map_locations', 'longitude'),
  ('map_questions', 'correct_location_id'), ('map_questions', 'tolerance_km'),
  ('map_questions', 'explanation'), ('history_questions', 'correct_answer'),
  ('science_questions', 'correct_answer'), ('polity_questions', 'correct_answer'),
  ('economics_questions', 'correct_answer'), ('geography_questions', 'correct_answer'),
  ('general_knowledge_questions', 'correct_answer'), ('math_questions', 'correct_answer'),
  ('current_affairs_questions', 'correct_answer'), ('reasoning_questions', 'correct_answer'),
  ('users', 'password_hash'), ('user_attempts', 'user_id'),
  ('user_attempts', 'question_id'), ('user_question_attempts', 'user_id'),
  ('user_question_attempts', 'question_id')
) as expected(table_name, column_name)
left join information_schema.columns actual
  on actual.table_schema = 'public' and actual.table_name = expected.table_name
 and actual.column_name = expected.column_name
order by expected.table_name, expected.column_name;

select n.nspname as schema_name, c.relname as object_name, c.relkind,
       pg_get_userbyid(c.relowner) as owner, c.relrowsecurity as rls_enabled,
       has_table_privilege('anon', c.oid, 'select') as anon_select,
       has_table_privilege('authenticated', c.oid, 'select') as authenticated_select,
       has_table_privilege('service_role', c.oid, 'select') as service_select
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname in (
  'users', 'contact_us', 'map_locations', 'map_questions',
  'history_questions', 'science_questions', 'polity_questions',
  'economics_questions', 'geography_questions', 'general_knowledge_questions',
  'math_questions', 'current_affairs_questions', 'reasoning_questions',
  'user_profiles', 'user_bookmarks', 'user_notes', 'user_attempts',
  'user_question_attempts', 'question_reports', 'user_practice_scope_state',
  'user_exam_preferences', 'practice_server_secrets', 'user_subject_progress',
  'user_topic_progress', 'user_subtopic_progress'
) order by c.relname;

select schemaname, tablename, policyname, roles, cmd, qual, with_check
from pg_policies where schemaname = 'public' and tablename in (
  'users', 'contact_us', 'map_locations', 'map_questions', 'user_profiles',
  'user_bookmarks', 'user_notes', 'user_attempts', 'user_question_attempts',
  'question_reports', 'user_practice_scope_state', 'user_exam_preferences'
) order by tablename, policyname;

select p.oid::regprocedure::text as function_signature,
       pg_get_userbyid(p.proowner) as owner, p.proconfig,
       has_function_privilege('anon', p.oid, 'execute') as anon_execute,
       has_function_privilege('authenticated', p.oid, 'execute') as authenticated_execute,
       has_function_privilege('service_role', p.oid, 'execute') as service_execute
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.prosecdef is true
order by p.oid::regprocedure::text;

select conrelid::regclass::text as table_name, conname, contype,
       pg_get_constraintdef(oid) as definition
from pg_constraint where connamespace = 'public'::regnamespace and conrelid in (
  'public.users'::regclass, 'public.user_attempts'::regclass,
  'public.user_question_attempts'::regclass, 'public.user_profiles'::regclass,
  'public.map_questions'::regclass
) order by conrelid::regclass::text, conname;

commit;

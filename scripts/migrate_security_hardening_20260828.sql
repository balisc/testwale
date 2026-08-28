-- QuestionWale security hardening consolidation (2026-08-28).
-- Run once in Supabase SQL Editor after deploying the matching application code.
-- Idempotent and intentionally contains no environment secrets.

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'users',
    'contact_us',
    'map_locations',
    'map_questions',
    'history_questions',
    'science_questions',
    'polity_questions',
    'economics_questions',
    'geography_questions',
    'general_knowledge_questions',
    'math_questions',
    'current_affairs_questions',
    'reasoning_questions'
  ] loop
    if to_regclass(format('public.%I', table_name)) is not null then
      execute format('alter table public.%I enable row level security', table_name);
      execute format(
        'revoke all privileges on table public.%I from anon, authenticated',
        table_name
      );
      execute format(
        'grant select, insert, update, delete on table public.%I to service_role',
        table_name
      );
    end if;
  end loop;
end $$;

do $$
begin
  if to_regclass('public.users') is not null then
    drop policy if exists "Allow anon insert users" on public.users;
    drop policy if exists "Allow anon update users" on public.users;
  end if;
  if to_regclass('public.contact_us') is not null then
    drop policy if exists "Public insert contact_us" on public.contact_us;
    drop policy if exists "Allow anon insert contact_us" on public.contact_us;
  end if;
  if to_regclass('public.map_locations') is not null then
    drop policy if exists "Public read map_locations" on public.map_locations;
  end if;
  if to_regclass('public.map_questions') is not null then
    drop policy if exists "Public read map_questions" on public.map_questions;
  end if;
end $$;

do $$
declare
  signature text;
begin
  foreach signature in array array[
    'public.register_email_user(text,text,text)',
    'public.login_email_user(text,text)',
    'public.upsert_google_user(text,text,text,text)',
    'public.get_user_profile_page(uuid)',
    'public.submit_question_answer(uuid,uuid,text,integer)',
    'public.get_user_progress_dashboard(uuid)',
    'public.submit_question_answer_verified(uuid,uuid,text,integer,bigint,text)',
    'public.get_user_progress_dashboard_verified(uuid,bigint,text)',
    'public.get_practice_progress_rows_verified(uuid,uuid,uuid,uuid,bigint,text)'
  ] loop
    if to_regprocedure(signature) is not null then
      execute format(
        'revoke execute on function %s from public, anon, authenticated',
        signature
      );
      execute format('grant execute on function %s to service_role', signature);
    end if;
  end loop;
end $$;

notify pgrst, 'reload schema';

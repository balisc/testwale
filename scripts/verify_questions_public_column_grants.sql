/**
 * Read-only verification of questions column grants.
 * Run in Supabase SQL editor after grants are applied.
 */

select column_name, privilege_type
from information_schema.column_privileges
where table_schema = 'public'
  and table_name = 'questions'
  and grantee = 'anon'
order by column_name;

-- Expect ABSENT for anon: correct_option, explanation, attempt_count, correct_count, report_count
-- Expect PRESENT: id, question_text, options, source, source_metadata, …

set role anon;
-- must ERROR
-- select correct_option from public.questions limit 1;
-- select attempt_count from public.questions limit 1;

select id, source, source_metadata
from public.questions
where is_active = true and is_verified = true
limit 1;
reset role;

-- QuestionWale: signed practice RPCs (works with SUPABASE_ANON_KEY — no service role required)
-- Run once in Supabase SQL Editor AFTER migrate_user_question_attempts.sql
--
-- Production: set PRACTICE_SUBMIT_SECRET in Vercel and run:
--   UPDATE public.practice_server_secrets
--   SET signing_secret = 'your-production-secret'
--   WHERE id = 1;

create extension if not exists pgcrypto;

create table if not exists public.practice_server_secrets (
  id int primary key default 1 check (id = 1),
  signing_secret text not null default 'questionwale-practice-dev-v1'
);

insert into public.practice_server_secrets (id, signing_secret)
values (1, 'questionwale-practice-dev-v1')
on conflict (id) do nothing;

alter table public.practice_server_secrets enable row level security;

-- No policies: only security definer functions can read this table.

create or replace function public.practice_verify_proof(
  p_scope text,
  p_parts text[],
  p_expires_at bigint,
  p_proof text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_secret text;
  v_payload text;
  v_expected text;
begin
  if p_expires_at is null or p_expires_at < extract(epoch from now())::bigint then
    raise exception 'proof_expired' using errcode = '42501';
  end if;

  select signing_secret into v_secret
  from public.practice_server_secrets
  where id = 1;

  if v_secret is null or length(trim(v_secret)) = 0 then
    raise exception 'proof_secret_missing' using errcode = '42501';
  end if;

  v_payload := p_scope || '|' || array_to_string(p_parts, '|') || '|' || p_expires_at::text;
  v_expected := encode(hmac(v_payload, v_secret, 'sha256'), 'hex');

  if coalesce(p_proof, '') <> v_expected then
    raise exception 'invalid_proof' using errcode = '42501';
  end if;
end;
$$;

-- Reuse submit logic via verified wrapper (callable with anon key from Next.js API)
create or replace function public.submit_question_answer_verified(
  p_user_id uuid,
  p_question_id uuid,
  p_selected_option text,
  p_time_taken_seconds integer,
  p_expires_at bigint,
  p_proof text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.practice_verify_proof(
    'submit',
    array[p_user_id::text, p_question_id::text, upper(trim(coalesce(p_selected_option, '')))],
    p_expires_at,
    p_proof
  );

  return public.submit_question_answer(
    p_user_id,
    p_question_id,
    p_selected_option,
    p_time_taken_seconds
  );
end;
$$;

create or replace function public.get_user_progress_dashboard_verified(
  p_user_id uuid,
  p_expires_at bigint,
  p_proof text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.practice_verify_proof(
    'dashboard',
    array[p_user_id::text],
    p_expires_at,
    p_proof
  );

  return public.get_user_progress_dashboard(p_user_id);
end;
$$;

revoke all on function public.practice_verify_proof(text, text[], bigint, text) from public;
revoke all on function public.submit_question_answer_verified(uuid, uuid, text, integer, bigint, text) from public;
revoke all on function public.get_user_progress_dashboard_verified(uuid, bigint, text) from public;

grant execute on function public.submit_question_answer_verified(uuid, uuid, text, integer, bigint, text) to anon, authenticated, service_role;
grant execute on function public.get_user_progress_dashboard_verified(uuid, bigint, text) to anon, authenticated, service_role;

create or replace function public.get_practice_progress_rows_verified(
  p_user_id uuid,
  p_subject_id uuid,
  p_topic_id uuid,
  p_subtopic_id uuid,
  p_expires_at bigint,
  p_proof text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.practice_verify_proof(
    'progress',
    array[p_user_id::text],
    p_expires_at,
    p_proof
  );

  return (
    select coalesce(jsonb_agg(jsonb_build_object(
      'subject_id', subject_id,
      'topic_id', topic_id,
      'subtopic_id', subtopic_id,
      'is_correct', is_correct
    )), '[]'::jsonb)
    from public.user_question_attempts
    where user_id = p_user_id
      and (p_subject_id is null or subject_id = p_subject_id)
      and (p_topic_id is null or topic_id = p_topic_id)
      and (p_subtopic_id is null or subtopic_id = p_subtopic_id)
  );
end;
$$;

revoke all on function public.get_practice_progress_rows_verified(uuid, uuid, uuid, uuid, bigint, text) from public;
grant execute on function public.get_practice_progress_rows_verified(uuid, uuid, uuid, uuid, bigint, text) to anon, authenticated, service_role;

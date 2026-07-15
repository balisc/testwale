-- =============================================================================
-- QuestionWale: subtopic mastery-loop smoke test
-- =============================================================================
-- STAGING / TEST ONLY — DO NOT RUN IN PRODUCTION WITHOUT REVIEW
--
-- Uses BEGIN ... ROLLBACK — no permanent data changes.
-- Edit the placeholder UUIDs in the DO block below before running.
-- Supabase SQL Editor compatible (no psql meta-commands).
-- =============================================================================

begin;

do $$
declare
  -- >>> Edit these placeholders for your staging project <<<
  v_user_id uuid := '00000000-0000-0000-0000-000000000001';
  v_subtopic_id uuid := '00000000-0000-0000-0000-000000000002';
  v_question_id_1 uuid := '00000000-0000-0000-0000-000000000003';
  v_question_id_2 uuid := '00000000-0000-0000-0000-000000000004';
  v_exam_code text := 'ALL';

  v_scope public.user_practice_scope_state%rowtype;
  v_batch jsonb;
  v_submit jsonb;
  v_advance jsonb;
  v_uqa_count bigint;
begin
  raise notice '--- 1. Scope initialization ---';
  v_scope := public.get_or_init_subtopic_practice_scope(v_user_id, v_subtopic_id, v_exam_code);
  raise notice 'phase=%, revision_round=%', v_scope.phase, v_scope.revision_round;

  raise notice '--- 2. Batch question state ---';
  v_batch := public.get_subtopic_batch_question_state(
    v_user_id,
    v_subtopic_id,
    v_exam_code,
    array[v_question_id_1, v_question_id_2]
  );
  raise notice 'batch_state=%', v_batch;

  raise notice '--- 3. First submit ---';
  v_submit := public.submit_question_answer(v_user_id, v_question_id_1, 'A', 12);
  raise notice 'first_submit is_new_attempt=%', v_submit->>'is_new_attempt';

  raise notice '--- 4. Retry submit (extra user_question_attempts row) ---';
  v_submit := public.submit_question_answer(v_user_id, v_question_id_1, 'B', 8);
  raise notice 'retry_submit already_attempted=%', v_submit->>'already_attempted';

  select count(*) into v_uqa_count
  from public.user_question_attempts
  where user_id = v_user_id and question_id = v_question_id_1;
  raise notice 'user_question_attempts rows for question=%', v_uqa_count;

  raise notice '--- 5. Advance cycle ---';
  v_advance := public.advance_subtopic_practice_cycle(v_user_id, v_subtopic_id, v_exam_code);
  raise notice 'advance transition=%, phase=%', v_advance->>'transition', v_advance->>'phase';

  raise notice '--- Done (rolled back) ---';
end $$;

rollback;

-- =============================================================================
-- MANUAL TEST QUERIES (run individually in staging)
-- =============================================================================
--
-- Scope init:
--   select * from public.get_or_init_subtopic_practice_scope(
--     '<user_id>'::uuid, '<subtopic_id>'::uuid, 'ALL'
--   );
--
-- Batch state:
--   select public.get_subtopic_batch_question_state(
--     '<user_id>'::uuid, '<subtopic_id>'::uuid, 'ALL',
--     array['<question_id>'::uuid]
--   );
--
-- Empty catalog (use subtopic with zero active verified questions):
--   select public.advance_subtopic_practice_cycle(
--     '<user_id>'::uuid, '<empty_subtopic_id>'::uuid, 'ALL'
--   );
--   -- Expect: transition = 'no_questions'
--
-- Retry history:
--   select user_id, question_id, is_correct, attempted_at
--   from public.user_question_attempts
--   where user_id = '<user_id>'::uuid and question_id = '<question_id>'::uuid
--   order by attempted_at;
--
-- Permission check (run as anon/authenticated — should fail):
--   select public.get_subtopic_batch_question_state(
--     '<user_id>'::uuid, '<subtopic_id>'::uuid, 'ALL', array[]::uuid[]
--   );
--
-- Reset (subtopic-global — deletes all exam_code scope rows):
--   select public.reset_subtopic_practice_progress(
--     '<user_id>'::uuid, '<subtopic_id>'::uuid, 'ALL'
--   );
--
-- =============================================================================

-- Read-only post-deployment verification for migrate_egress_optimization_v2.sql.
-- Every returned boolean must be true.

select
  to_regprocedure(
    'public.get_exam_question_counts_compact(uuid,uuid[],text[])'
  ) is not null as compact_counts_rpc_present,
  to_regprocedure(
    'public.get_mock_test_candidates_for_user(text,uuid,boolean,integer)'
  ) is not null as compact_mock_candidates_rpc_present,
  to_regclass('public.mock_tests_user_blueprint_history_idx') is not null
    as mock_history_index_present,
  to_regclass('public.mock_test_items_test_question_created_idx') is not null
    as mock_item_index_present,
  has_function_privilege(
    'service_role',
    'public.get_exam_question_counts_compact(uuid,uuid[],text[])',
    'execute'
  ) as service_can_run_compact_counts,
  not has_function_privilege(
    'anon',
    'public.get_exam_question_counts_compact(uuid,uuid[],text[])',
    'execute'
  ) as anon_blocked_from_compact_counts,
  not has_function_privilege(
    'authenticated',
    'public.get_mock_test_candidates_for_user(text,uuid,boolean,integer)',
    'execute'
  ) as authenticated_blocked_from_mock_candidates;

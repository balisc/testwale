-- QuestionWale: complete attempt scope + solve-time analytics.
-- Run after migrate_user_question_attempts.sql / migrate_subtopic_mastery_loop.sql.
-- Safe to re-run. Raw attempts remain the source of truth; views provide rollups.

begin;

-- Repair any historical attempt whose hierarchy IDs were not populated.
update public.user_question_attempts a
set
  subject_id = coalesce(a.subject_id, q.subject_id),
  topic_id = coalesce(a.topic_id, q.topic_id),
  subtopic_id = coalesce(a.subtopic_id, q.subtopic_id)
from public.questions q
where q.id = a.question_id
  and (a.subject_id is null or a.topic_id is null or a.subtopic_id is null);

create or replace view public.user_subject_progress as
select
  user_id,
  subject_id,
  count(*)::bigint as attempts_count,
  count(distinct question_id)::bigint as unique_questions_count,
  count(*) filter (where is_correct)::bigint as correct_count,
  count(*) filter (where not is_correct)::bigint as wrong_count,
  public.calc_attempt_accuracy(count(*) filter (where is_correct)::bigint, count(*)::bigint) as accuracy_percent,
  coalesce(sum(time_spent_seconds), 0)::bigint as total_time_spent_seconds,
  coalesce(round(avg(time_spent_seconds)::numeric, 2), 0) as average_time_spent_seconds
from public.user_question_attempts
group by user_id, subject_id;

create or replace view public.user_topic_progress as
select
  user_id,
  subject_id,
  topic_id,
  count(*)::bigint as attempts_count,
  count(distinct question_id)::bigint as unique_questions_count,
  count(*) filter (where is_correct)::bigint as correct_count,
  count(*) filter (where not is_correct)::bigint as wrong_count,
  public.calc_attempt_accuracy(count(*) filter (where is_correct)::bigint, count(*)::bigint) as accuracy_percent,
  coalesce(sum(time_spent_seconds), 0)::bigint as total_time_spent_seconds,
  coalesce(round(avg(time_spent_seconds)::numeric, 2), 0) as average_time_spent_seconds
from public.user_question_attempts
group by user_id, subject_id, topic_id;

create or replace view public.user_subtopic_progress as
select
  user_id,
  subject_id,
  topic_id,
  subtopic_id,
  count(*)::bigint as attempts_count,
  count(distinct question_id)::bigint as unique_questions_count,
  count(*) filter (where is_correct)::bigint as correct_count,
  count(*) filter (where not is_correct)::bigint as wrong_count,
  public.calc_attempt_accuracy(count(*) filter (where is_correct)::bigint, count(*)::bigint) as accuracy_percent,
  coalesce(sum(time_spent_seconds), 0)::bigint as total_time_spent_seconds,
  coalesce(round(avg(time_spent_seconds)::numeric, 2), 0) as average_time_spent_seconds
from public.user_question_attempts
group by user_id, subject_id, topic_id, subtopic_id;

comment on column public.user_question_attempts.time_spent_seconds is
  'Solve time for this submitted attempt. Subject/topic/subtopic IDs are copied from questions by the trusted submit path.';

commit;

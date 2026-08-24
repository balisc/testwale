-- QuestionWale: exam-scoped hierarchy and progress snapshot.
-- Requires migrate_target_exam_onboarding.sql and the existing catalog/priority/practice tables.
-- No mappings are invented here: exams.code, priority.exam_code and questions.exam_tags
-- are the existing canonical relationships confirmed by repository and production data.

begin;

create or replace function public.get_exam_learning_snapshot(
  p_user_id uuid,
  p_exam_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_exam public.exams%rowtype;
  v_profile public.user_profiles%rowtype;
  v_result jsonb;
begin
  if p_user_id is null or p_exam_id is null then
    raise exception 'unauthenticated' using errcode = '42501';
  end if;

  select * into v_profile
  from public.user_profiles
  where user_id = p_user_id;

  if not found or v_profile.target_exam_id is distinct from p_exam_id
     or v_profile.exam_onboarding_completed_at is null then
    raise exception 'selected_exam_mismatch' using errcode = '42501';
  end if;

  select * into v_exam
  from public.exams
  where id = p_exam_id and is_active is true;

  if not found then
    raise exception 'selected_exam_inactive' using errcode = '22023';
  end if;

  with
  relevant_questions as materialized (
    select q.id, q.subject_id, q.topic_id, q.subtopic_id
    from public.questions q
    join public.subjects s on s.id = q.subject_id and s.is_active is true
    join public.topics t on t.id = q.topic_id and t.subject_id = s.id and t.is_active is true
    left join public.subtopics st
      on st.id = q.subtopic_id and st.topic_id = t.id and st.is_active is true
    where q.is_active is true
      and q.is_verified is true
      and q.exam_tags @> array[v_exam.code]::text[]
      and (q.subtopic_id is null or st.id is not null)
  ),
  mapped_topics as materialized (
    select distinct t.id, t.subject_id
    from public.topics t
    join public.subjects s on s.id = t.subject_id and s.is_active is true
    where t.is_active is true
      and (
        exists (
          select 1 from public.topic_exam_priority tep
          where tep.topic_id = t.id and tep.exam_code = v_exam.code
        )
        or exists (select 1 from relevant_questions rq where rq.topic_id = t.id)
      )
  ),
  mapped_subtopics as materialized (
    select distinct st.id, st.topic_id, t.subject_id
    from public.subtopics st
    join public.topics t on t.id = st.topic_id and t.is_active is true
    join mapped_topics mt on mt.id = t.id
    where st.is_active is true
      and (
        exists (
          select 1 from public.subtopic_exam_priority sep
          where sep.subtopic_id = st.id and sep.exam_code = v_exam.code
        )
        or exists (select 1 from relevant_questions rq where rq.subtopic_id = st.id)
      )
  ),
  scoped_attempts as materialized (
    select ua.*
    from public.user_attempts ua
    join relevant_questions rq on rq.id = ua.question_id
    where ua.user_id = p_user_id
  ),
  subject_rows as (
    select
      s.id,
      s.slug,
      s.title,
      s.description,
      s.icon_key,
      s.hero_image_url,
      s.sort_order,
      (select count(*) from mapped_topics mt where mt.subject_id = s.id)::integer as topic_count,
      (select count(*) from mapped_subtopics ms where ms.subject_id = s.id)::integer as subtopic_count,
      (select count(*) from relevant_questions rq where rq.subject_id = s.id)::integer as question_count,
      (select count(*) from scoped_attempts sa where sa.subject_id = s.id)::integer as attempted_count,
      (select count(*) from scoped_attempts sa where sa.subject_id = s.id and sa.is_correct)::integer as correct_count
    from public.subjects s
    where s.is_active is true
      and (
        exists (select 1 from mapped_topics mt where mt.subject_id = s.id)
        or exists (select 1 from mapped_subtopics ms where ms.subject_id = s.id)
        or exists (select 1 from relevant_questions rq where rq.subject_id = s.id)
      )
  ),
  topic_rows as (
    select
      t.id,
      t.subject_id,
      t.slug,
      t.title,
      t.description,
      t.icon_key,
      t.sort_order,
      tep.priority,
      tep.importance,
      coalesce(tep.is_recommended, false) as is_recommended,
      (select count(*) from mapped_subtopics ms where ms.topic_id = t.id)::integer as subtopic_count,
      (select count(*) from relevant_questions rq where rq.topic_id = t.id)::integer as question_count,
      (select count(*) from scoped_attempts sa where sa.topic_id = t.id)::integer as attempted_count,
      (select count(*) from scoped_attempts sa where sa.topic_id = t.id and sa.is_correct)::integer as correct_count
    from mapped_topics mt
    join public.topics t on t.id = mt.id
    left join public.topic_exam_priority tep
      on tep.topic_id = t.id and tep.exam_code = v_exam.code
  ),
  subtopic_rows as (
    select
      st.id,
      st.topic_id,
      ms.subject_id,
      st.slug,
      st.title,
      st.description,
      st.sort_order,
      sep.priority,
      sep.importance,
      sep.importance_label,
      coalesce(sep.is_recommended, false) as is_recommended,
      (select count(*) from relevant_questions rq where rq.subtopic_id = st.id)::integer as question_count,
      (select count(*) from scoped_attempts sa where sa.subtopic_id = st.id)::integer as attempted_count,
      (select count(*) from scoped_attempts sa where sa.subtopic_id = st.id and sa.is_correct)::integer as correct_count
    from mapped_subtopics ms
    join public.subtopics st on st.id = ms.id
    left join public.subtopic_exam_priority sep
      on sep.subtopic_id = st.id and sep.exam_code = v_exam.code
  ),
  overview as (
    select
      (select count(*) from relevant_questions)::integer as total_questions,
      count(*)::integer as attempted_count,
      count(*) filter (where is_correct)::integer as correct_count
    from scoped_attempts
  )
  select jsonb_build_object(
    'exam', jsonb_build_object(
      'id', v_exam.id,
      'code', v_exam.code,
      'title', v_exam.title,
      'target_date', v_profile.exam_date
    ),
    'overview', (
      select jsonb_build_object(
        'total_questions', o.total_questions,
        'attempted_count', o.attempted_count,
        'correct_count', o.correct_count,
        'wrong_count', greatest(0, o.attempted_count - o.correct_count),
        'completion_percent', case when o.total_questions = 0 then 0
          else round(o.attempted_count::numeric * 100 / o.total_questions, 2) end,
        'accuracy_percent', case when o.attempted_count = 0 then 0
          else round(o.correct_count::numeric * 100 / o.attempted_count, 2) end
      ) from overview o
    ),
    'subjects', coalesce((
      select jsonb_agg(to_jsonb(sr) order by sr.sort_order nulls last, sr.slug)
      from subject_rows sr
    ), '[]'::jsonb),
    'topics', coalesce((
      select jsonb_agg(to_jsonb(tr) order by tr.priority nulls last, tr.sort_order nulls last, tr.slug)
      from topic_rows tr
    ), '[]'::jsonb),
    'subtopics', coalesce((
      select jsonb_agg(to_jsonb(str) order by str.priority nulls last, str.sort_order nulls last, str.slug)
      from subtopic_rows str
    ), '[]'::jsonb),
    'recent_activity', coalesce((
      select jsonb_agg(to_jsonb(recent_row) order by recent_row.attempted_at desc)
      from (
        select ua.question_id, ua.subject_id, ua.topic_id, ua.subtopic_id,
               ua.is_correct, ua.attempted_at,
               q.question_text, s.title as subject_title, t.title as topic_title
        from public.user_attempts ua
        join relevant_questions rq on rq.id = ua.question_id
        join public.questions q on q.id = ua.question_id
        join public.subjects s on s.id = ua.subject_id
        join public.topics t on t.id = ua.topic_id
        where ua.user_id = p_user_id
        order by ua.attempted_at desc
        limit 8
      ) recent_row
    ), '[]'::jsonb)
  ) into v_result;

  return v_result;
end;
$$;

revoke all on function public.get_exam_learning_snapshot(uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.get_exam_learning_snapshot(uuid, uuid) to service_role;

commit;

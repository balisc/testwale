-- QuestionWale: production-safe get_user_profile_page RPC
-- Run once in Supabase SQL Editor before production deploy.
--
-- Security: SECURITY DEFINER + service_role EXECUTE only.
--   /api/profile validates the session cookie server-side, then calls this RPC
--   with SUPABASE_SERVICE_ROLE_KEY. Do not grant to anon or authenticated.
--
-- Performance: stats from attempts/progress tables only; no questions bank scan.
-- Fixes: PostgreSQL 42803 GROUP BY error in rank-change CTEs.

begin;

create or replace function public.get_user_profile_page(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user public.users%rowtype;
  v_profile public.user_profiles%rowtype;
  v_overview jsonb;
  v_study_days bigint;
  v_avg_daily numeric;
  v_rank bigint;
  v_total_users bigint;
  v_rank_change bigint;
  v_readiness numeric;
  v_by_subject jsonb;
  v_by_topic jsonb;
  v_strengths jsonb;
  v_weaknesses jsonb;
  v_recent jsonb;
  v_activity jsonb;
  v_bookmarks bigint;
  v_notes bigint;
  v_mistakes bigint;
  v_today_attempts bigint;
  v_week_attempts bigint;
  v_month_attempts bigint;
begin
  if p_user_id is null then
    raise exception 'unauthenticated' using errcode = '42501';
  end if;

  -- Defense in depth: only the server (service_role JWT) may call this function.
  -- Prevents reading another user's email/stats by passing a different UUID from a client.
  if coalesce(auth.jwt() ->> 'role', '') <> 'service_role' then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select * into v_user from public.users where id = p_user_id;
  if not found then
    raise exception 'invalid_user' using errcode = '22023';
  end if;

  insert into public.user_profiles (user_id)
  values (p_user_id)
  on conflict (user_id) do nothing;

  select * into v_profile from public.user_profiles where user_id = p_user_id;

  select jsonb_build_object(
    'total_attempts', count(*)::bigint,
    'unique_questions_attempted', count(distinct question_id)::bigint,
    'correct_count', sum(case when is_correct then 1 else 0 end)::bigint,
    'wrong_count', sum(case when not is_correct then 1 else 0 end)::bigint,
    'accuracy_percent', public.calc_attempt_accuracy(
      sum(case when is_correct then 1 else 0 end)::bigint,
      count(*)::bigint
    )
  )
  into v_overview
  from public.user_question_attempts
  where user_id = p_user_id;

  if v_overview is null then
    v_overview := jsonb_build_object(
      'total_attempts', 0, 'unique_questions_attempted', 0,
      'correct_count', 0, 'wrong_count', 0, 'accuracy_percent', 0
    );
  end if;

  select count(distinct (attempted_at at time zone 'Asia/Kolkata')::date)
  into v_study_days
  from public.user_question_attempts
  where user_id = p_user_id;

  v_avg_daily := case
    when coalesce(v_study_days, 0) = 0 then 0
    else round((v_overview->>'total_attempts')::numeric / v_study_days, 2)
  end;

  with totals as (
    select user_id, count(*)::bigint as cnt
    from public.user_question_attempts
    group by user_id
  ),
  ranked as (
    select user_id, cnt,
      rank() over (order by cnt desc, user_id) as rnk,
      count(*) over () as total_users
    from totals
  )
  select rnk, total_users into v_rank, v_total_users
  from ranked where user_id = p_user_id;

  v_rank := coalesce(v_rank, 0);
  v_total_users := greatest(coalesce(v_total_users, 0), case when v_rank > 0 then 1 else 0 end);

  with totals_now as (
    select user_id, count(*) as cnt
    from public.user_question_attempts
    where attempted_at >= now() - interval '7 days'
    group by user_id
  ),
  ranked_now as (
    select user_id, rank() over (order by cnt desc, user_id) as rnk from totals_now
  ),
  totals_before as (
    select user_id, count(*) as cnt
    from public.user_question_attempts
    where attempted_at < now() - interval '7 days'
    group by user_id
  ),
  ranked_before as (
    select user_id, rank() over (order by cnt desc, user_id) as rnk from totals_before
  )
  select coalesce(rb.rnk, 0) - coalesce(rn.rnk, 0)
  into v_rank_change
  from (select 1) x
  left join ranked_now rn on rn.user_id = p_user_id
  left join ranked_before rb on rb.user_id = p_user_id;

  v_readiness := least(100, greatest(0,
    round(
      coalesce((v_overview->>'accuracy_percent')::numeric, 0) * 0.75
      + least(25, coalesce(v_study_days, 0) * 0.5)
    , 2)
  ));

  select coalesce(jsonb_agg(row_to_json(t)::jsonb order by t.accuracy_percent desc), '[]'::jsonb)
  into v_by_subject
  from (
    select s.title as subject_title, s.slug as subject_slug, p.accuracy_percent, p.attempts_count
    from public.user_subject_progress p
    left join public.subjects s on s.id = p.subject_id
    where p.user_id = p_user_id and p.attempts_count > 0
  ) t;

  select coalesce(jsonb_agg(row_to_json(t)::jsonb order by t.accuracy_percent desc), '[]'::jsonb)
  into v_by_topic
  from (
    select tp.title as topic_title, tp.slug as topic_slug, s.title as subject_title,
           p.accuracy_percent, p.attempts_count, p.correct_count, p.wrong_count
    from public.user_topic_progress p
    left join public.topics tp on tp.id = p.topic_id
    left join public.subjects s on s.id = p.subject_id
    where p.user_id = p_user_id and p.attempts_count >= 3
  ) t;

  select coalesce(jsonb_agg(row_to_json(t)::jsonb order by t.accuracy_percent desc), '[]'::jsonb)
  into v_strengths
  from (
    select tp.title as topic_title, p.accuracy_percent, p.attempts_count
    from public.user_topic_progress p
    left join public.topics tp on tp.id = p.topic_id
    where p.user_id = p_user_id and p.attempts_count >= 3 and p.accuracy_percent >= 65
    order by p.accuracy_percent desc
    limit 5
  ) t;

  select coalesce(jsonb_agg(row_to_json(t)::jsonb order by t.accuracy_percent asc), '[]'::jsonb)
  into v_weaknesses
  from (
    select tp.title as topic_title, tp.slug as topic_slug, s.slug as subject_slug,
           p.accuracy_percent, p.attempts_count
    from public.user_topic_progress p
    left join public.topics tp on tp.id = p.topic_id
    left join public.subjects s on s.id = p.subject_id
    where p.user_id = p_user_id and p.attempts_count >= 3 and p.accuracy_percent <= 50
    order by p.accuracy_percent asc
    limit 5
  ) t;

  select coalesce(jsonb_agg(row_to_json(t)::jsonb order by t.attempted_at desc), '[]'::jsonb)
  into v_recent
  from (
    select a.id, a.is_correct, a.attempted_at,
           s.title as subject_title, tp.title as topic_title,
           tp.slug as topic_slug, s.slug as subject_slug
    from public.user_question_attempts a
    left join public.subjects s on s.id = a.subject_id
    left join public.topics tp on tp.id = a.topic_id
    where a.user_id = p_user_id
    order by a.attempted_at desc
    limit 10
  ) t;

  select coalesce(jsonb_agg(row_to_json(t)::jsonb order by t.created_at desc), '[]'::jsonb)
  into v_activity
  from (
    select 'quiz_attempted'::text as activity_type,
           coalesce(
             (select (tp.title->>'en') from public.topics tp where tp.id = a.topic_id),
             'Practice Question'
           ) as title,
           a.attempted_at as created_at,
           a.is_correct
    from public.user_question_attempts a
    where a.user_id = p_user_id
    order by a.attempted_at desc
    limit 8
  ) t;

  select count(*) into v_bookmarks from public.user_bookmarks where user_id = p_user_id;
  select count(*) into v_notes from public.user_notes where user_id = p_user_id;

  select count(distinct question_id) into v_mistakes
  from public.user_question_attempts
  where user_id = p_user_id and is_correct = false;

  select count(*) into v_today_attempts
  from public.user_question_attempts
  where user_id = p_user_id
    and (attempted_at at time zone 'Asia/Kolkata')::date = (now() at time zone 'Asia/Kolkata')::date;

  select count(*) into v_week_attempts
  from public.user_question_attempts
  where user_id = p_user_id
    and attempted_at >= date_trunc('week', now());

  select count(*) into v_month_attempts
  from public.user_question_attempts
  where user_id = p_user_id
    and attempted_at >= date_trunc('month', now());

  return jsonb_build_object(
    'user', jsonb_build_object(
      'id', v_user.id,
      'full_name', v_user.full_name,
      'email', v_user.email,
      'avatar_url', v_user.avatar_url,
      'provider', v_user.provider,
      'created_at', v_user.created_at
    ),
    'profile', jsonb_build_object(
      'bio', v_profile.bio,
      'country', v_profile.country,
      'state', v_profile.state,
      'city', v_profile.city,
      'target_exam', v_profile.target_exam,
      'is_premium', coalesce(v_profile.is_premium, false),
      'daily_goal', v_profile.daily_goal,
      'weekly_goal', v_profile.weekly_goal,
      'monthly_goal', v_profile.monthly_goal
    ),
    'overview', v_overview,
    'study_days', coalesce(v_study_days, 0),
    'avg_daily_attempts', coalesce(v_avg_daily, 0),
    'rank', jsonb_build_object(
      'overall', coalesce(v_rank, 0),
      'total_users', coalesce(v_total_users, 0),
      'change_7d', coalesce(v_rank_change, 0)
    ),
    'readiness', jsonb_build_object(
      'score', coalesce(v_readiness, 0),
      'label', public.readiness_label(coalesce(v_readiness, 0))
    ),
    'by_subject', v_by_subject,
    'by_topic', v_by_topic,
    'strengths', v_strengths,
    'weaknesses', v_weaknesses,
    'recent_attempts', v_recent,
    'recent_activity', v_activity,
    'counts', jsonb_build_object(
      'bookmarks', coalesce(v_bookmarks, 0),
      'notes', coalesce(v_notes, 0),
      'mistakes', coalesce(v_mistakes, 0)
    ),
    'goals_progress', jsonb_build_object(
      'today', coalesce(v_today_attempts, 0),
      'week', coalesce(v_week_attempts, 0),
      'month', coalesce(v_month_attempts, 0)
    )
  );
end;
$$;

revoke all on function public.get_user_profile_page(uuid) from public;
revoke all on function public.get_user_profile_page(uuid) from anon;
revoke all on function public.get_user_profile_page(uuid) from authenticated;
grant execute on function public.get_user_profile_page(uuid) to service_role;

commit;

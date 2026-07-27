import supabase from '@/lib/supabase';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { getCatalogSnapshot } from '@/lib/catalogCache';
import { getUserProgressDashboardForUser } from '@/lib/practiceServer';
import type { TopicProgressRow, SubjectProgressRow } from '@/lib/practiceAnalytics';
import {
  buildCoverageSummary,
  buildDifficultyInsights,
  buildSubjectInsightRows,
  buildTopicInsightRows,
  matchExamCodeFromTarget,
  pickFocusNext,
  pickFocusSubject,
  pickStrongArea,
  pickTopSubjects,
  type TopicCatalogRow,
} from '@/lib/profileInsightsCore';
import type { ProfileInsightsData } from '@/lib/profileInsightsTypes';

async function fetchUserTargetExam(userId: string): Promise<string | null> {
  const admin = getSupabaseAdmin();
  const client = admin ?? supabase;

  const { data, error } = await client
    .from('user_profiles')
    .select('target_exam')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('[profileInsights/fetchUserTargetExam]', error);
    return null;
  }

  return (data as { target_exam: string | null } | null)?.target_exam ?? null;
}

async function fetchRecommendedTopicIds(examCode: string): Promise<Set<string>> {
  const admin = getSupabaseAdmin();
  const client = admin ?? supabase;

  const { data, error } = await client
    .from('topic_exam_priority')
    .select('topic_id')
    .eq('exam_code', examCode)
    .eq('is_recommended', true);

  if (error) {
    console.error('[profileInsights/fetchRecommendedTopicIds]', error);
    return new Set();
  }

  return new Set(
    (data ?? []).map((row: { topic_id: string }) => String(row.topic_id)),
  );
}

async function fetchDifficultyAttempts(userId: string) {
  const admin = getSupabaseAdmin();
  const client = admin ?? supabase;

  const { data, error } = await client
    .from('user_attempts')
    .select('is_correct, questions!inner(difficulty, is_active, is_verified)')
    .eq('user_id', userId);

  if (error) {
    console.error('[profileInsights/fetchDifficultyAttempts]', error);
    return [];
  }

  return (data ?? [])
    .map((row: { is_correct: boolean; questions?: { difficulty?: string | null; is_active?: boolean; is_verified?: boolean } | null }) => {
      const question = row.questions;
      if (!question?.is_active || !question.is_verified) return null;
      return {
        is_correct: Boolean(row.is_correct),
        difficulty: question.difficulty ?? null,
      };
    })
    .filter(Boolean) as Array<{ is_correct: boolean; difficulty: string | null }>;
}

function mapTopicProgress(rows: TopicProgressRow[]) {
  return rows.map((row) => ({
    topic_id: row.topic_id,
    subject_id: row.subject_id,
    topic_title: row.topic_title,
    topic_slug: row.topic_slug,
    subject_slug: row.subject_slug,
    unique_questions_count: row.unique_questions_count,
    accuracy_percent: row.accuracy_percent,
    wrong_count: row.wrong_count,
  }));
}

function mapSubjectProgress(rows: SubjectProgressRow[]) {
  return rows.map((row) => ({
    subject_id: row.subject_id,
    subject_title: row.subject_title,
    subject_slug: row.subject_slug,
    unique_questions_count: row.unique_questions_count,
    accuracy_percent: row.accuracy_percent,
  }));
}

export async function getUserProfileInsights(userId: string): Promise<ProfileInsightsData | null> {
  const [dashboard, targetExam, catalog, difficultyRows] = await Promise.all([
    getUserProgressDashboardForUser(userId),
    fetchUserTargetExam(userId),
    getCatalogSnapshot(),
    fetchDifficultyAttempts(userId),
  ]);

  if (!dashboard) return null;

  const subjectsById = new Map(catalog.subjects.map((subject) => [subject.id, subject]));

  const subjectProgress = mapSubjectProgress(dashboard.by_subject);
  const topicProgress = mapTopicProgress(dashboard.by_topic);

  const hasAnyAttempts = dashboard.overview.unique_questions_attempted > 0;
  const matchedExamCode = matchExamCodeFromTarget(
    targetExam,
    catalog.exams.map((exam) => ({ code: exam.code, title: exam.title })),
  );

  const activeSubjectIds = new Set(
    subjectProgress.map((row) => row.subject_id).filter(Boolean) as string[],
  );

  let planTopicCatalog: TopicCatalogRow[] = catalog.topics
    .filter((topic) => (topic.question_count ?? 0) > 0)
    .map((topic) => ({
      id: topic.id,
      subject_id: topic.subject_id,
      title: topic.title,
      slug: topic.slug,
      question_count: topic.question_count ?? 0,
    }));

  if (matchedExamCode) {
    const recommendedIds = await fetchRecommendedTopicIds(matchedExamCode);
    if (recommendedIds.size > 0) {
      planTopicCatalog = planTopicCatalog.filter((topic) => recommendedIds.has(topic.id));
    }
  } else if (activeSubjectIds.size > 0) {
    planTopicCatalog = planTopicCatalog.filter((topic) => activeSubjectIds.has(topic.subject_id));
  } else {
    planTopicCatalog = [];
  }

  const progressByTopicId = new Map(
    topicProgress.filter((row) => row.topic_id).map((row) => [row.topic_id!, row]),
  );

  const coverage = buildCoverageSummary(
    planTopicCatalog.map((topic) => ({
      uniqueAttempted: progressByTopicId.get(topic.id)?.unique_questions_count ?? 0,
      totalQuestions: topic.question_count,
    })),
  );

  const subjectRows = pickTopSubjects(
    buildSubjectInsightRows(subjectProgress, subjectsById),
    3,
  );

  const focusSubject = pickFocusSubject({
    subjects: subjectProgress,
    subjectsById,
  });

  const focusTopics = focusSubject
    ? buildTopicInsightRows({
        catalogTopics: catalog.topics
          .filter((topic) => topic.subject_id === focusSubject.subject_id && (topic.question_count ?? 0) > 0)
          .map((topic) => ({
            id: topic.id,
            subject_id: topic.subject_id,
            title: topic.title,
            slug: topic.slug,
            question_count: topic.question_count ?? 0,
          })),
        progressRows: topicProgress.filter((row) => row.subject_id === focusSubject.subject_id),
        subjectSlug: focusSubject.subject_slug,
        limit: 5,
      })
    : [];

  return {
    target_exam: targetExam,
    coverage,
    subjects: subjectRows,
    focus_subject: focusSubject,
    focus_topics: focusTopics,
    strong_area: pickStrongArea(topicProgress),
    focus_next: pickFocusNext(topicProgress),
    by_difficulty: buildDifficultyInsights(difficultyRows),
    has_any_attempts: hasAnyAttempts,
  };
}

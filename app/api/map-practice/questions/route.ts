import { NextResponse } from 'next/server';
import supabase, { SUPABASE_AVAILABLE } from '@/lib/supabase';
import { normalizeDifficulty, normalizeMapScope, shuffleArray, type MapQuestion } from '@/lib/mapPractice';
import { enrichMapQuestionCopy } from '@/lib/mapPracticeI18n';
import { resolveQuestionListLimit } from '@/lib/publicQuestionApiGuards';
import { MAX_QUESTION_LIMIT } from '@/lib/supabaseQueryLimits';
type SupabaseQuestionRow = {
  id: string;
  question_text: string;
  question_type: string;
  main_topic: string;
  subtopic: string;
  map_scope: string;
  tolerance_km: number | string | null;
  explanation: string | null;
  difficulty: string | null;
  exam_tags: string[] | null;
  is_current_affairs: boolean | null;
  current_affairs_month: string | null;
  correct_location: {
    id: string;
    name: string;
    category: string;
    map_scope: string;
    latitude: number | null;
    longitude: number | null;
    difficulty: string | null;
    is_current_affairs: boolean | null;
  } | null;
};

export const revalidate = 0;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const scope = normalizeMapScope(searchParams.get('scope'));
  const difficulty = normalizeDifficulty(searchParams.get('difficulty'));
  const topic = (searchParams.get('topic') ?? '').trim();
  const subtopic = (searchParams.get('subtopic') ?? '').trim();

  if (!SUPABASE_AVAILABLE) {
    return NextResponse.json(
      {
        questions: [],
        topics: [],
        subtopics: [],
        error: 'Supabase is not configured.',
      },
      { status: 200 }
    );
  }

  const mapLimit = Math.min(resolveQuestionListLimit(searchParams.get('limit')), MAX_QUESTION_LIMIT);

  let query = supabase
    .from('map_questions')
    .select(
      `
      id,
      question_text,
      question_type,
      main_topic,
      subtopic,
      map_scope,
      tolerance_km,
      explanation,
      difficulty,
      exam_tags,
      is_current_affairs,
      current_affairs_month,
      correct_location:map_locations!map_questions_correct_location_id_fkey(
        id,
        name,
        category,
        map_scope,
        latitude,
        longitude,
        difficulty,
        is_current_affairs
      )
      `
    )
    .eq('map_scope', scope)
    .eq('question_type', 'map_click_point')
    .order('created_at', { ascending: false })
    .limit(mapLimit);

  if (difficulty !== 'all') {
    query = query.eq('difficulty', difficulty);
  }
  if (topic) {
    query = query.eq('main_topic', topic);
  }
  if (subtopic) {
    query = query.eq('subtopic', subtopic);
  }

  const { data, error } = await query;

  if (error) {
    const message = error.message ?? 'Unable to fetch map questions.';
    const normalizedMessage = message.toLowerCase();
    const isMissingTable =
      (normalizedMessage.includes('relation') && normalizedMessage.includes('does not exist')) ||
      normalizedMessage.includes("could not find the table");

    return NextResponse.json(
      {
        questions: [],
        topics: [],
        subtopics: [],
        error: isMissingTable
          ? 'Map practice tables are not created yet. Run scripts/create_map_practice_tables.sql in Supabase SQL editor.'
          : message,
      },
      { status: isMissingTable ? 200 : 500 }
    );
  }

  const rows = (data ?? []) as SupabaseQuestionRow[];
  const validQuestions: MapQuestion[] = [];
  const topicSet = new Set<string>();
  const subtopicSet = new Set<string>();

  for (const row of rows) {
    if (
      !row.correct_location ||
      row.correct_location.latitude == null ||
      row.correct_location.longitude == null
    ) {
      continue;
    }
    if (!row.main_topic || !row.subtopic) {
      continue;
    }

    topicSet.add(row.main_topic);
    subtopicSet.add(row.subtopic);

    validQuestions.push(
      enrichMapQuestionCopy({
        id: row.id,
        question_text: row.question_text,
        question_type: row.question_type as MapQuestion['question_type'],
        main_topic: row.main_topic,
        subtopic: row.subtopic,
        map_scope: row.map_scope as MapQuestion['map_scope'],
        tolerance_km: Number(row.tolerance_km ?? 30),
        explanation: null,
        difficulty: row.difficulty,
        exam_tags: row.exam_tags,
        is_current_affairs: Boolean(row.is_current_affairs),
        current_affairs_month: row.current_affairs_month,
        correct_location: {
          id: row.correct_location.id,
          name: row.correct_location.name,
          category: row.correct_location.category,
          map_scope: row.correct_location.map_scope as MapQuestion['map_scope'],
          latitude: Number(row.correct_location.latitude),
          longitude: Number(row.correct_location.longitude),
          difficulty: row.correct_location.difficulty,
          is_current_affairs: row.correct_location.is_current_affairs,
        },
      }),
    );
  }

  return NextResponse.json({
    questions: shuffleArray(validQuestions),
    topics: Array.from(topicSet).sort((a, b) => a.localeCompare(b)),
    subtopics: Array.from(subtopicSet).sort((a, b) => a.localeCompare(b)),
    error: null,
  });
}

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import {
  getBroadMapRegionHint,
  normalizeDifficulty,
  normalizeMapScope,
  shuffleArray,
  type MapQuestion,
} from '@/lib/mapPractice';
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

const FILTER_PATTERN = /^[\p{L}\p{N}\s&()'.,/-]{0,80}$/u;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const scope = normalizeMapScope(searchParams.get('scope'));
  const difficulty = normalizeDifficulty(searchParams.get('difficulty'));
  const topic = (searchParams.get('topic') ?? '').trim();
  const subtopic = (searchParams.get('subtopic') ?? '').trim();
  const admin = getSupabaseAdmin();

  if (!FILTER_PATTERN.test(topic) || !FILTER_PATTERN.test(subtopic)) {
    return NextResponse.json({ error: 'invalid_filter' }, { status: 400 });
  }

  if (!admin) {
    return NextResponse.json(
      {
        questions: [],
        topics: [],
        subtopics: [],
        error: 'Map practice is temporarily unavailable.',
      },
      { status: 503, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  const mapLimit = Math.min(resolveQuestionListLimit(searchParams.get('limit')), MAX_QUESTION_LIMIT);

  let query = admin
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
    const message = error.message ?? '';
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
          ? 'Map practice is temporarily unavailable.'
          : 'Unable to fetch map questions.',
      },
      { status: isMissingTable ? 503 : 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  const rows = (data ?? []) as unknown as SupabaseQuestionRow[];
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
        region_hint: getBroadMapRegionHint(
          Number(row.correct_location.latitude),
          Number(row.correct_location.longitude),
          row.map_scope as MapQuestion['map_scope'],
        ),
        difficulty: row.difficulty,
        exam_tags: row.exam_tags,
        is_current_affairs: Boolean(row.is_current_affairs),
        current_affairs_month: row.current_affairs_month,
      }),
    );
  }

  return NextResponse.json(
    {
      questions: shuffleArray(validQuestions),
      topics: Array.from(topicSet).sort((a, b) => a.localeCompare(b)),
      subtopics: Array.from(subtopicSet).sort((a, b) => a.localeCompare(b)),
      error: null,
    },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}

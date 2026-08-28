import { NextResponse } from 'next/server';
import {
  getEffectiveToleranceKm,
  haversineDistanceKm,
  type MapAnswerResult,
} from '@/lib/mapPractice';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type AnswerRow = {
  id: string;
  question_type: string;
  tolerance_km: number | string | null;
  explanation: string | null;
  difficulty: string | null;
  correct_location: {
    name: string;
    latitude: number | string | null;
    longitude: number | string | null;
  } | null;
};

function isCoordinate(value: unknown, min: number, max: number): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const input = body as Record<string, unknown>;
  const questionId = typeof input?.questionId === 'string' ? input.questionId.trim() : '';
  const latitude = input?.latitude;
  const longitude = input?.longitude;
  const timedOut = input?.timedOut === true;
  const hasNoPoint = (latitude === null || latitude === undefined) &&
    (longitude === null || longitude === undefined);

  if (
    !UUID_PATTERN.test(questionId) ||
    (!hasNoPoint && (!isCoordinate(latitude, -90, 90) || !isCoordinate(longitude, -180, 180))) ||
    (hasNoPoint && !timedOut)
  ) {
    return NextResponse.json({ error: 'invalid_answer' }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'service_unavailable' }, { status: 503 });
  }

  const { data, error } = await admin
    .from('map_questions')
    .select(`
      id,
      question_type,
      tolerance_km,
      explanation,
      difficulty,
      correct_location:map_locations!map_questions_correct_location_id_fkey(
        name,
        latitude,
        longitude
      )
    `)
    .eq('id', questionId)
    .eq('question_type', 'map_click_point')
    .maybeSingle();

  if (error) {
    console.error('Map answer lookup failed:', error.message);
    return NextResponse.json({ error: 'answer_unavailable' }, { status: 500 });
  }

  const row = data as AnswerRow | null;
  const correctLatitude = Number(row?.correct_location?.latitude);
  const correctLongitude = Number(row?.correct_location?.longitude);
  if (!row || !Number.isFinite(correctLatitude) || !Number.isFinite(correctLongitude)) {
    return NextResponse.json({ error: 'question_not_found' }, { status: 404 });
  }

  const toleranceKm = getEffectiveToleranceKm(row);
  const distanceKm = hasNoPoint
    ? 99_999
    : haversineDistanceKm(
        latitude as number,
        longitude as number,
        correctLatitude,
        correctLongitude,
      );
  const result: MapAnswerResult & { timedOut: boolean } = {
    isCorrect: !timedOut && distanceKm <= toleranceKm,
    distanceKm: Math.round(distanceKm * 100) / 100,
    toleranceKm,
    correctPoint: { lat: correctLatitude, lng: correctLongitude },
    correctLocationName: row.correct_location?.name ?? '',
    explanation: row.explanation,
    timedOut,
  };

  return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } });
}

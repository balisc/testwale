import { getAuthUserFromCookies } from '@/lib/authCookies';
import { getCorrectQuestionIdsForBatch } from '@/lib/practiceServer';
import {
  isTextBodyTooLarge,
  parseCorrectIdsPayload,
  privateNoStoreJsonResponse,
} from '@/lib/publicQuestionApiGuards';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

function errorResponse(error: string, status: number) {
  return privateNoStoreJsonResponse({ error }, status);
}

export async function POST(request: Request) {
  const user = await getAuthUserFromCookies();
  if (!user) {
    return errorResponse('unauthorized', 401);
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    return errorResponse('service_unavailable', 503);
  }

  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return errorResponse('invalid_body', 400);
  }

  if (isTextBodyTooLarge(rawBody)) {
    return errorResponse('payload_too_large', 400);
  }

  let body: unknown;
  try {
    body = JSON.parse(rawBody) as unknown;
  } catch {
    return errorResponse('invalid_body', 400);
  }

  const parsed = parseCorrectIdsPayload(body);
  if (!parsed.ok) {
    return errorResponse(parsed.error, 400);
  }

  const correctQuestionIds = await getCorrectQuestionIdsForBatch(admin, user.id, parsed.questionIds);
  if (correctQuestionIds === null) {
    return errorResponse('correct_ids_failed', 500);
  }

  return privateNoStoreJsonResponse({ correctQuestionIds });
}

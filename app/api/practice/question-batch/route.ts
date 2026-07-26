import {
  getQuestionBatchBySubtopic,
  getQuestionBatchByTopic,
  normalizeExamCode,
} from '@/lib/polity';
import {
  isKnownExamSelection,
  resolvePracticeExamQuestionTag,
} from '@/lib/polity/practiceExamFilter';
import {
  isUuid,
  parseStrictBatchSize,
  privateNoStoreJsonResponse,
} from '@/lib/publicQuestionApiGuards';

export const dynamic = 'force-dynamic';

function errorResponse(error: string, status: number) {
  return privateNoStoreJsonResponse({ error }, status);
}

async function resolveExamCodeParam(
  raw: string | null,
): Promise<{ examCode?: string; error?: 'invalid_exam_code' }> {
  const trimmed = raw?.trim();
  if (!trimmed) return {};

  const normalized = normalizeExamCode(trimmed);
  if (!normalized || normalized === 'ALL') return {};

  const known = await isKnownExamSelection(normalized);
  if (!known) {
    return { error: 'invalid_exam_code' };
  }

  const questionTag = await resolvePracticeExamQuestionTag(normalized);
  return { examCode: questionTag };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const scope = searchParams.get('scope')?.trim().toLowerCase();

    if (scope !== 'subtopic' && scope !== 'topic') {
      return errorResponse('invalid_scope', 400);
    }

    const batchSizeResult = parseStrictBatchSize(searchParams.get('batchSize'));
    if (!batchSizeResult.ok) {
      return errorResponse('invalid_batch_size', 400);
    }

    const cursorRaw = searchParams.get('cursor');
    const cursorTrimmed = cursorRaw?.trim();
    if (cursorTrimmed && !isUuid(cursorTrimmed)) {
      return errorResponse('invalid_cursor', 400);
    }

    const examResult = await resolveExamCodeParam(searchParams.get('examCode'));
    if (examResult.error) {
      return errorResponse('invalid_exam_code', 400);
    }

    const examCode = examResult.examCode;
    const batchOptions = {
      cursor: cursorTrimmed || undefined,
      batchSize: batchSizeResult.value,
    };

    if (scope === 'subtopic') {
      const subtopicId = searchParams.get('subtopicId')?.trim() ?? '';
      if (!subtopicId) {
        return errorResponse('missing_subtopic_id', 400);
      }
      if (!isUuid(subtopicId)) {
        return errorResponse('invalid_subtopic_id', 400);
      }

      const page = await getQuestionBatchBySubtopic(subtopicId, examCode, batchOptions);
      return privateNoStoreJsonResponse(page);
    }

    const topicId = searchParams.get('topicId')?.trim() ?? '';
    if (!topicId) {
      return errorResponse('missing_topic_id', 400);
    }
    if (!isUuid(topicId)) {
      return errorResponse('invalid_topic_id', 400);
    }

    const page = await getQuestionBatchByTopic(topicId, examCode, batchOptions);
    return privateNoStoreJsonResponse(page);
  } catch (error) {
    console.error('[practice/question-batch]', error);
    return errorResponse('question_batch_failed', 500);
  }
}

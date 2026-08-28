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
  getExactExamQuestionBatchByTopic,
  getExactExamQuestionBatchBySubtopic,
  resolveReadyExamProfileId,
} from '@/lib/exactExamQuestionsServer';
import { getExamPreparationTracks } from '@/lib/examPreferenceServer';
import { getSscCglStageByCode, isSscCglExamCode } from '@/lib/sscCglSyllabus';
import { getSscChslStageByCode, isSscChslExamCode } from '@/lib/sscChsl';
import {
  isUuid,
  parseStrictBatchSize,
  privateNoStoreJsonResponse,
} from '@/lib/publicQuestionApiGuards';
import { getSelectedExamContext } from '@/lib/examLearningServer';

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

    const selected = await getSelectedExamContext();
    if (selected.status === 'incomplete') return errorResponse('onboarding_incomplete', 409);
    if (selected.status === 'inactive') return errorResponse('selected_exam_inactive', 409);
    if (selected.status === 'error') return errorResponse('exam_scope_failed', 503);

    let examCode: string | undefined;
    let exactExamProfileId: string | null = null;
    if (selected.status === 'ready') {
      // Authenticated callers cannot override their durable selected exam.
      examCode = selected.questionTag;
      exactExamProfileId = selected.examProfileId;
    } else {
      const examResult = await resolveExamCodeParam(searchParams.get('examCode'));
      if (examResult.error) return errorResponse('invalid_exam_code', 400);
      examCode = examResult.examCode;
      const requestedProfileId = searchParams.get('examProfileId')?.trim() ?? '';
      if (requestedProfileId) {
        if (!isUuid(requestedProfileId)) return errorResponse('invalid_exam_profile_id', 400);
        exactExamProfileId = await resolveReadyExamProfileId({
          examProfileId: requestedProfileId,
          examCode: searchParams.get('examCode'),
        });
        if (!exactExamProfileId) return errorResponse('exam_profile_not_selectable', 404);
      }
    }
    const requestedStageCode = searchParams.get('stage_code')?.trim() ?? '';
    let exactStageCode: string | null = null;
    if (requestedStageCode) {
      if (!exactExamProfileId) return errorResponse('exam_profile_required_for_stage', 400);
      const isSscCgl = selected.status === 'ready'
        ? isSscCglExamCode(selected.examCode)
        : isSscCglExamCode(searchParams.get('examCode'));
      if (isSscCgl) {
        // SSC CGL stages are an application-owned closed enum. Validating them
        // locally avoids a slow preparation-track database lookup on every
        // cursor request while the exact profile mapping still scopes the data.
        const stage = getSscCglStageByCode(requestedStageCode);
        if (!stage) return errorResponse('invalid_stage_code', 400);
        exactStageCode = stage.code;
      } else if (
        selected.status === 'ready'
          ? isSscChslExamCode(selected.examCode)
          : isSscChslExamCode(searchParams.get('examCode'))
      ) {
        const stage = getSscChslStageByCode(requestedStageCode);
        if (!stage) return errorResponse('invalid_stage_code', 400);
        exactStageCode = stage.code;
      } else {
        const tracks = await getExamPreparationTracks(exactExamProfileId);
        if (tracks.status === 'error') return errorResponse('exam_track_lookup_failed', 503);
        if (tracks.status !== 'ready') return errorResponse('invalid_exam_profile_id', 400);
        const track = tracks.tracks.find((item) => (
          item.stageCode === requestedStageCode
          && item.preparationMode === 'MCQ'
          && item.isAvailable
        ));
        if (!track) return errorResponse('invalid_stage_code', 400);
        exactStageCode = track.stageCode;
      }
    }
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
      const page = exactExamProfileId
        ? await getExactExamQuestionBatchBySubtopic({
            examProfileId: exactExamProfileId,
            contentSubtopicId: subtopicId,
            stageCodes: exactStageCode ? [exactStageCode] : undefined,
            cursor: batchOptions.cursor,
            batchSize: batchOptions.batchSize,
          })
        : await getQuestionBatchBySubtopic(subtopicId, examCode, batchOptions);
      return privateNoStoreJsonResponse(page);
    }

    const topicId = searchParams.get('topicId')?.trim() ?? '';
    if (!topicId) {
      return errorResponse('missing_topic_id', 400);
    }
    if (!isUuid(topicId)) {
      return errorResponse('invalid_topic_id', 400);
    }
    const page = exactExamProfileId
      ? await getExactExamQuestionBatchByTopic({
          examProfileId: exactExamProfileId,
          contentTopicId: topicId,
          stageCodes: exactStageCode ? [exactStageCode] : undefined,
          cursor: batchOptions.cursor,
          batchSize: batchOptions.batchSize,
        })
      : await getQuestionBatchByTopic(topicId, examCode, batchOptions);
    return privateNoStoreJsonResponse(page);
  } catch (error) {
    console.error('[practice/question-batch]', error);
    return errorResponse('question_batch_failed', 500);
  }
}

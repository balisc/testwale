export type PracticePhase = 'unseen' | 'revision' | 'completed';

export const ADVANCE_CYCLE_TRANSITIONS = [
  'no_questions',
  'reopened_unseen',
  'reopened_revision',
  'remain_unseen',
  'start_revision',
  'remain_revision_round',
  'next_revision_round',
  'complete',
  'noop',
] as const;

export type AdvanceCycleTransition = (typeof ADVANCE_CYCLE_TRANSITIONS)[number];

export function isAdvanceCycleTransition(value: unknown): value is AdvanceCycleTransition {
  return (
    typeof value === 'string' &&
    (ADVANCE_CYCLE_TRANSITIONS as readonly string[]).includes(value)
  );
}

export type SubtopicQuestionBatchState = {
  phase: PracticePhase;
  revisionRound: number;
  roundStartedAt: string | null;
  catalogQuestionCount: number | null;
  eligibleQuestionIds: string[];
  masteredQuestionIds: string[];
  unresolvedQuestionIds: string[];
  attemptedThisRoundQuestionIds: string[];
};

export type AdvanceSubtopicCycleResult = {
  phase: PracticePhase;
  revisionRound: number;
  roundStartedAt: string | null;
  coverageCompletedAt?: string | null;
  completedAt?: string | null;
  catalogQuestionCount: number | null;
  transition: AdvanceCycleTransition;
};

export type ParseSubtopicQuestionBatchStateResult =
  | { ok: true; state: SubtopicQuestionBatchState }
  | { ok: false; error: 'invalid_payload' | 'invalid_phase' };

export type ParseAdvanceSubtopicCycleResult =
  | { ok: true; state: AdvanceSubtopicCycleResult }
  | { ok: false; error: 'invalid_payload' | 'invalid_phase' | 'invalid_transition' };

function parsePracticePhase(value: unknown): PracticePhase | null {
  if (value === 'unseen' || value === 'revision' || value === 'completed') {
    return value;
  }
  return null;
}

function parseCatalogQuestionCount(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const count = Number(value);
  return Number.isFinite(count) && count >= 0 ? count : null;
}

function toQuestionIds(value: unknown): string[] {
  return Array.isArray(value) ? value.map((id) => String(id)) : [];
}

export function parseSubtopicQuestionBatchState(
  raw: unknown,
): ParseSubtopicQuestionBatchStateResult {
  if (!raw || typeof raw !== 'object') {
    return { ok: false, error: 'invalid_payload' };
  }

  const row = raw as Record<string, unknown>;
  const phase = parsePracticePhase(row.phase);
  if (!phase) {
    return { ok: false, error: 'invalid_phase' };
  }

  return {
    ok: true,
    state: {
      phase,
      revisionRound: Number(row.revisionRound ?? 0),
      roundStartedAt:
        typeof row.roundStartedAt === 'string' ? row.roundStartedAt : null,
      catalogQuestionCount: parseCatalogQuestionCount(row.catalogQuestionCount),
      eligibleQuestionIds: toQuestionIds(row.eligibleQuestionIds),
      masteredQuestionIds: toQuestionIds(row.masteredQuestionIds),
      unresolvedQuestionIds: toQuestionIds(row.unresolvedQuestionIds),
      attemptedThisRoundQuestionIds: toQuestionIds(row.attemptedThisRoundQuestionIds),
    },
  };
}

export function parseAdvanceSubtopicCycleResult(
  raw: unknown,
): ParseAdvanceSubtopicCycleResult {
  if (!raw || typeof raw !== 'object') {
    return { ok: false, error: 'invalid_payload' };
  }

  const row = raw as Record<string, unknown>;
  const phase = parsePracticePhase(row.phase);
  if (!phase) {
    return { ok: false, error: 'invalid_phase' };
  }

  if (!isAdvanceCycleTransition(row.transition)) {
    return { ok: false, error: 'invalid_transition' };
  }

  return {
    ok: true,
    state: {
      phase,
      revisionRound: Number(row.revisionRound ?? 0),
      roundStartedAt:
        typeof row.roundStartedAt === 'string' ? row.roundStartedAt : null,
      coverageCompletedAt:
        typeof row.coverageCompletedAt === 'string' ? row.coverageCompletedAt : null,
      completedAt: typeof row.completedAt === 'string' ? row.completedAt : null,
      catalogQuestionCount: parseCatalogQuestionCount(row.catalogQuestionCount),
      transition: row.transition,
    },
  };
}

/** @deprecated Prefer parseSubtopicQuestionBatchState for explicit error handling. */
export function parseSubtopicQuestionBatchStateOrNull(
  raw: unknown,
): SubtopicQuestionBatchState | null {
  const parsed = parseSubtopicQuestionBatchState(raw);
  return parsed.ok ? parsed.state : null;
}

/** @deprecated Prefer parseAdvanceSubtopicCycleResult for explicit error handling. */
export function parseAdvanceSubtopicCycleResultOrNull(
  raw: unknown,
): AdvanceSubtopicCycleResult | null {
  const parsed = parseAdvanceSubtopicCycleResult(raw);
  return parsed.ok ? parsed.state : null;
}

export function buildPhaseLabel(
  phase: PracticePhase,
  revisionRound: number,
  language: 'en' | 'hi',
): string {
  if (phase === 'unseen') {
    return language === 'hi' ? 'नए प्रश्न' : 'New Questions';
  }
  if (phase === 'revision') {
    return language === 'hi'
      ? `दोहराव राउंड ${revisionRound}`
      : `Revision Round ${revisionRound}`;
  }
  return language === 'hi' ? 'उप-विषय पूर्ण' : 'Subtopic Mastered';
}

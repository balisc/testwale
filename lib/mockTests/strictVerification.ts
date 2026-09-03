import { createHash } from 'node:crypto';

export const STRICT_CHSL_VERIFIER_VERSION = 'ssc-chsl-tier1-strict-v2';
export const STRICT_CHSL_BLUEPRINT_CODE = 'ssc-chsl-tier1-2025-v1';
export const STRICT_CHSL_EVENT_START = '2024-01-01';
export const STRICT_CHSL_EVENT_END = '2025-08-31';

const OPTIONS = ['A', 'B', 'C', 'D'] as const;
const SECTION_SUBJECT: Record<string, string> = {
  english: 'SUBJ_ENGLISH',
  reasoning: 'SUBJ_REASONING',
  quantitative_aptitude: 'SUBJ_MATHEMATICS',
  general_awareness: 'SUBJ_GENERAL_AWARENESS',
};

type JsonRecord = Record<string, unknown>;

export type StrictFacetRow = {
  id: string;
  question_id: string;
  blueprint_code: string;
  section_key: string;
  bucket_key: string;
  difficulty_band: string;
  question_type?: string | null;
  event_date?: string | null;
  group_id?: string | null;
  group_order?: number | null;
  evidence_source?: string | null;
  reviewer_status: string;
  is_active: boolean;
  metadata?: unknown;
  updated_at?: string | null;
};

export type StrictQuestionRow = {
  id: string;
  subject_id?: string | null;
  topic_id?: string | null;
  subtopic_id?: string | null;
  question_text?: unknown;
  options?: unknown;
  correct_option?: string | null;
  explanation?: unknown;
  difficulty?: string | null;
  source?: string | null;
  source_metadata?: unknown;
  is_active: boolean;
  is_verified: boolean;
  report_count?: number | null;
  updated_at?: string | null;
};

export type StrictGroupRow = {
  id: string;
  group_type?: string | null;
  passage?: unknown;
  media?: unknown;
  expected_item_count?: number | null;
  source_metadata?: unknown;
  reviewer_status?: string | null;
  is_active?: boolean | null;
};

export type StrictVerificationContext = {
  mappedQuestionIds: ReadonlySet<string>;
  activeSubjectIds: ReadonlySet<string>;
  activeTopicIds: ReadonlySet<string>;
  activeSubtopicIds: ReadonlySet<string>;
  questionTextCounts: ReadonlyMap<string, number>;
  questionKeyCounts: ReadonlyMap<string, number>;
  sourceRegistryKeys: ReadonlySet<string>;
  groupsById: ReadonlyMap<string, StrictGroupRow>;
  now?: Date;
};

export type StrictVerificationResult = {
  facetId: string;
  questionId: string;
  sectionKey: string;
  bucketKey: string;
  difficultyBand: string;
  correctOption: string;
  subtopicCode: string;
  questionType: string;
  provenanceTemplate: string;
  requiredSourceRegistryKeys: string[];
  derivedEventDate: string | null;
  contentHash: string;
  questionUpdatedAt: string | null;
  facetUpdatedAt: string | null;
  decision: 'promotable' | 'hold' | 'already_verified';
  blockers: string[];
  checks: string[];
};

export type StrictBucketPlan = {
  sectionKey: string;
  bucketKey: string;
  deficit: number;
  promotable: number;
  selected: StrictVerificationResult[];
  unresolved: number;
};

function record(value: unknown): JsonRecord {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as JsonRecord : {};
}

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function localized(value: unknown, language: 'en' | 'hi') {
  const source = record(value);
  return text(source[language]);
}

function optionText(value: unknown, option: typeof OPTIONS[number], language: 'en' | 'hi') {
  const source = record(value);
  const nestedLanguage = record(source[language]);
  if (text(nestedLanguage[option])) return text(nestedLanguage[option]);
  return localized(source[option], language);
}

function normalize(value: string) {
  return value.normalize('NFKC').toLocaleLowerCase('en').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}

function normalizeOption(value: string) {
  return value.normalize('NFKC').toLocaleLowerCase('en').replace(/\s+/g, ' ').trim();
}

export function strictQuestionTextFingerprint(value: unknown, options?: unknown) {
  const question = normalize(localized(value, 'en'));
  if (options === undefined) return question;
  const optionSet = OPTIONS.map((option) => normalizeOption(optionText(options, option, 'en'))).join('|');
  return `${question}||${optionSet}`;
}

export function strictQuestionKey(value: unknown) {
  return text(record(value).question_key);
}

function normalizedDifficulty(value: unknown) {
  const candidate = text(value).toLowerCase();
  if (candidate === 'easy' || candidate === 'basic') return 'basic';
  if (candidate === 'hard' || candidate === 'advanced') return 'advanced';
  return candidate === 'medium' || candidate === 'intermediate' ? 'intermediate' : '';
}

function validDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function stable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stable);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value as JsonRecord)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, item]) => [key, stable(item)]));
}

function sha256(value: unknown) {
  return createHash('sha256').update(JSON.stringify(stable(value))).digest('hex');
}

function stringArray(value: unknown) {
  return Array.isArray(value) ? value.map(text).filter(Boolean) : [];
}

function add(blockers: Set<string>, condition: boolean, code: string) {
  if (!condition) blockers.add(code);
}

function hasNonEmptyJson(value: unknown) {
  return Object.keys(record(value)).length > 0;
}

function resolveEventDate(facet: StrictFacetRow, sourceMetadata: JsonRecord) {
  const candidates = [facet.event_date, sourceMetadata.event_date, sourceMetadata.reference_date].map(text);
  return candidates.find(validDate) ?? null;
}

function verifyRationales(sourceMetadata: JsonRecord, correctOption: string) {
  const rationales = record(sourceMetadata.option_rationales);
  const markedCorrect = OPTIONS.filter((option) => record(rationales[option]).is_correct === true);
  return OPTIONS.every((option) => {
    const rationale = record(rationales[option]);
    return text(rationale.en).length >= 12 && text(rationale.hi).length >= 8;
  }) && markedCorrect.length === 1 && markedCorrect[0] === correctOption;
}

function verifyOriginality(sourceMetadata: JsonRecord) {
  const originality = record(sourceMetadata.originality);
  const common = originality.independently_authored === true
    && originality.third_party_question_bank_used === false
    && originality.pyq_wording_copied === false
    && originality.option_set_copied === false
    && originality.copied_explanation === false
    && originality.external_asset_used === false;
  if (!common) return false;
  return text(originality.template_generation) === 'deterministic_rule_and_context_checked'
    ? originality.copied_passage === false
    : originality.copied_illustration !== true;
}

function verifyAlignment(facet: StrictFacetRow, sourceMetadata: JsonRecord) {
  const facetMetadata = record(facet.metadata);
  const alignment = record(sourceMetadata.syllabus_alignment);
  const stages = stringArray(alignment.stages);
  return text(alignment.exam_profile_code) === 'SSC_CHSL'
    && stages.includes('TIER_I')
    && text(alignment.subject_code) === SECTION_SUBJECT[facet.section_key]
    && text(alignment.topic_code) === text(facetMetadata.topic_code)
    && text(alignment.subtopic_code) === text(facetMetadata.subtopic_code);
}

function verifyProvenance(
  facet: StrictFacetRow,
  sourceMetadata: JsonRecord,
  sourceRegistryKeys: ReadonlySet<string>,
) {
  const originality = record(sourceMetadata.originality);
  const template = text(originality.template_generation);
  const deterministicSection = template === 'deterministic_rule_checked' && facet.section_key === 'reasoning'
    || template === 'deterministic_formula_checked' && facet.section_key === 'quantitative_aptitude'
    || template === 'deterministic_rule_and_context_checked' && facet.section_key === 'english';
  if (deterministicSection) {
    return text(sourceMetadata.answer_proof).length >= 8
      && text(sourceMetadata.relation_family).length >= 4;
  }
  if (template !== 'source_grounded_deterministic_reauthoring') return false;
  const registryKeys = stringArray(sourceMetadata.source_registry_keys);
  const locator = record(sourceMetadata.evidence_locator);
  return registryKeys.length > 0
    && registryKeys.every((key) => sourceRegistryKeys.has(key))
    && locator.claim_level_support === true
    && text(locator.target_fact).length >= 8
    && text(locator.source_fact_pool).length >= 4
    && validDate(text(sourceMetadata.source_checked_on))
    && text(sourceMetadata.answer_proof).length >= 8;
}

function verifyGroup(facet: StrictFacetRow, context: StrictVerificationContext) {
  if (!facet.group_id) return false;
  const group = context.groupsById.get(facet.group_id);
  if (!group || group.is_active !== true || group.reviewer_status !== 'verified') return false;
  return group.expected_item_count === 5
    && Number(facet.group_order) >= 1
    && Number(facet.group_order) <= 5
    && localized(group.passage, 'en').length >= 40
    && localized(group.passage, 'hi').length >= 20
    && hasNonEmptyJson(group.source_metadata);
}

export function verifyStrictChslFacet(
  facet: StrictFacetRow,
  question: StrictQuestionRow,
  context: StrictVerificationContext,
): StrictVerificationResult {
  const blockers = new Set<string>();
  const checks: string[] = [];
  const sourceMetadata = record(question.source_metadata);
  const facetMetadata = record(facet.metadata);
  const correctOption = text(question.correct_option).toUpperCase();
  const questionType = text(facet.question_type) || text(sourceMetadata.question_type);
  const provenanceTemplate = text(record(sourceMetadata.originality).template_generation);
  const requiredSourceRegistryKeys = stringArray(sourceMetadata.source_registry_keys);
  const subtopicCode = text(facetMetadata.subtopic_code);
  const fingerprint = strictQuestionTextFingerprint(question.question_text, question.options);
  const questionKey = strictQuestionKey(question.source_metadata);
  const eventDate = resolveEventDate(facet, sourceMetadata);
  const now = context.now ?? new Date();

  add(blockers, facet.blueprint_code === STRICT_CHSL_BLUEPRINT_CODE, 'WRONG_BLUEPRINT');
  add(blockers, facet.question_id === question.id, 'FACET_QUESTION_MISMATCH');
  add(blockers, facet.is_active === true, 'FACET_INACTIVE');
  add(blockers, question.is_active === true, 'QUESTION_INACTIVE');
  add(blockers, question.is_verified === true, 'QUESTION_NOT_BASE_VERIFIED');
  add(blockers, Number(question.report_count ?? 0) === 0, 'QUESTION_REPORTED');
  add(blockers, context.mappedQuestionIds.has(question.id), 'TIER_I_MAPPING_MISSING');
  add(blockers, Boolean(question.subject_id && context.activeSubjectIds.has(question.subject_id)), 'SUBJECT_INACTIVE');
  add(blockers, Boolean(question.topic_id && context.activeTopicIds.has(question.topic_id)), 'TOPIC_INACTIVE');
  add(blockers, Boolean(question.subtopic_id && context.activeSubtopicIds.has(question.subtopic_id)), 'SUBTOPIC_INACTIVE');

  add(blockers, localized(question.question_text, 'en').length >= 12, 'ENGLISH_QUESTION_MISSING');
  add(blockers, localized(question.question_text, 'hi').length >= 8, 'HINDI_QUESTION_MISSING');
  add(blockers, localized(question.explanation, 'en').length >= 20, 'ENGLISH_EXPLANATION_MISSING');
  add(blockers, localized(question.explanation, 'hi').length >= 12, 'HINDI_EXPLANATION_MISSING');
  const englishOptions = OPTIONS.map((option) => optionText(question.options, option, 'en'));
  const hindiOptions = OPTIONS.map((option) => optionText(question.options, option, 'hi'));
  add(blockers, englishOptions.every(Boolean), 'ENGLISH_OPTIONS_INVALID');
  add(blockers, hindiOptions.every(Boolean), 'HINDI_OPTIONS_INVALID');
  add(blockers, new Set(englishOptions.map(normalizeOption)).size === 4, 'ENGLISH_OPTIONS_DUPLICATE');
  add(blockers, new Set(hindiOptions.map(normalizeOption)).size === 4, 'HINDI_OPTIONS_DUPLICATE');
  add(blockers, OPTIONS.includes(correctOption as typeof OPTIONS[number]), 'CORRECT_OPTION_INVALID');
  add(blockers, verifyRationales(sourceMetadata, correctOption), 'ANSWER_RATIONALE_MISMATCH');

  add(blockers, text(question.source).length >= 8, 'SOURCE_LABEL_MISSING');
  add(blockers, hasNonEmptyJson(question.source_metadata), 'SOURCE_METADATA_MISSING');
  add(blockers, text(sourceMetadata.answer_proof).length >= 8, 'ANSWER_PROOF_MISSING');
  add(blockers, questionKey.length >= 8, 'QUESTION_KEY_MISSING');
  add(blockers, text(sourceMetadata.batch_key).length >= 8, 'BATCH_KEY_MISSING');
  add(blockers, text(sourceMetadata.content_owner) === 'QuestionWale', 'CONTENT_OWNER_INVALID');
  add(blockers, text(sourceMetadata.exam_profile_code) === 'SSC_CHSL', 'SOURCE_EXAM_MISMATCH');
  add(blockers, /SSC\s*CHSL/i.test(text(sourceMetadata.target_level)), 'TARGET_LEVEL_MISMATCH');
  add(blockers, questionType.length >= 4, 'QUESTION_TYPE_MISSING');
  add(blockers, sourceMetadata.is_exact_pyq === false, 'EXACT_PYQ_REQUIRES_MANUAL_REVIEW');
  add(blockers, verifyOriginality(sourceMetadata), 'ORIGINALITY_CONTRACT_FAILED');
  add(blockers, verifyAlignment(facet, sourceMetadata), 'SYLLABUS_ALIGNMENT_MISMATCH');
  add(blockers, verifyProvenance(facet, sourceMetadata, context.sourceRegistryKeys), 'PROVENANCE_NOT_RESOLVED');
  add(blockers, normalizedDifficulty(question.difficulty) === facet.difficulty_band, 'DIFFICULTY_MISMATCH');

  add(blockers, fingerprint.length >= 12, 'QUESTION_FINGERPRINT_INVALID');
  add(blockers, (context.questionTextCounts.get(fingerprint) ?? 0) === 1, 'DUPLICATE_QUESTION_TEXT');
  add(blockers, (context.questionKeyCounts.get(questionKey) ?? 0) === 1, 'DUPLICATE_QUESTION_KEY');

  const originality = record(sourceMetadata.originality);
  const hasMedia = Array.isArray(sourceMetadata.media) && sourceMetadata.media.length > 0
    || originality.external_asset_used === true;
  add(blockers, !hasMedia || facetMetadata.media_verified === true, 'MEDIA_NOT_VERIFIED');

  const preparedOn = text(sourceMetadata.prepared_on);
  add(blockers, validDate(preparedOn), 'PREPARED_DATE_INVALID');
  add(blockers, !validDate(preparedOn) || Date.parse(`${preparedOn}T00:00:00Z`) <= now.getTime(), 'PREPARED_DATE_IN_FUTURE');

  if (facet.bucket_key === 'current_events') {
    add(blockers, Boolean(eventDate), 'CURRENT_EVENT_DATE_MISSING');
    add(blockers, Boolean(eventDate && eventDate >= STRICT_CHSL_EVENT_START && eventDate <= STRICT_CHSL_EVENT_END), 'CURRENT_EVENT_DATE_OUT_OF_WINDOW');
    add(blockers, stringArray(sourceMetadata.source_registry_keys).length > 0, 'CURRENT_EVENT_SOURCE_REGISTRY_MISSING');
  }
  if (facet.bucket_key === 'atomic_comprehension') {
    add(blockers, verifyGroup(facet, context), 'VERIFIED_ATOMIC_GROUP_REQUIRED');
  }

  if (blockers.size === 0) checks.push(
    'base-content', 'mapping', 'taxonomy', 'bilingual', 'options', 'answer-rationales',
    'provenance', 'originality', 'alignment', 'duplicates', 'difficulty', 'freshness',
  );

  const alreadyVerified = facet.reviewer_status === 'verified';
  if (!alreadyVerified) add(blockers, facet.reviewer_status === 'provisional', 'FACET_STATUS_NOT_PROVISIONAL');
  const decision = alreadyVerified ? 'already_verified' : blockers.size === 0 ? 'promotable' : 'hold';
  const contentHash = sha256({
    verifier: STRICT_CHSL_VERIFIER_VERSION,
    facet: {
      id: facet.id, question_id: facet.question_id, blueprint_code: facet.blueprint_code,
      section_key: facet.section_key, bucket_key: facet.bucket_key,
      difficulty_band: facet.difficulty_band, group_id: facet.group_id, group_order: facet.group_order,
      metadata: facet.metadata,
    },
    question: {
      id: question.id, question_text: question.question_text, options: question.options,
      correct_option: question.correct_option, explanation: question.explanation,
      difficulty: question.difficulty, source: question.source, source_metadata: question.source_metadata,
    },
  });
  return {
    facetId: facet.id,
    questionId: question.id,
    sectionKey: facet.section_key,
    bucketKey: facet.bucket_key,
    difficultyBand: facet.difficulty_band,
    correctOption,
    subtopicCode,
    questionType,
    provenanceTemplate,
    requiredSourceRegistryKeys,
    derivedEventDate: facet.bucket_key === 'current_events' ? eventDate : facet.event_date ?? null,
    contentHash,
    questionUpdatedAt: question.updated_at ?? null,
    facetUpdatedAt: facet.updated_at ?? null,
    decision,
    blockers: [...blockers].sort(),
    checks,
  };
}

function deterministicRank(result: StrictVerificationResult) {
  return sha256(`${STRICT_CHSL_VERIFIER_VERSION}:${result.questionId}`);
}

function diverseSelection(candidates: StrictVerificationResult[], count: number) {
  const queues = new Map<string, StrictVerificationResult[]>();
  for (const candidate of candidates) {
    const key = `${candidate.difficultyBand}:${candidate.correctOption}`;
    const queue = queues.get(key) ?? [];
    queue.push(candidate);
    queues.set(key, queue);
  }
  for (const queue of queues.values()) queue.sort((left, right) => deterministicRank(left).localeCompare(deterministicRank(right)));
  const keys = ['basic', 'intermediate', 'advanced'].flatMap((difficulty) => OPTIONS.map((option) => `${difficulty}:${option}`));
  const selected: StrictVerificationResult[] = [];
  while (selected.length < count) {
    let progressed = false;
    for (const key of keys) {
      const next = queues.get(key)?.shift();
      if (!next) continue;
      selected.push(next);
      progressed = true;
      if (selected.length === count) break;
    }
    if (!progressed) break;
  }
  return selected;
}

export function buildStrictPromotionPlan(
  results: StrictVerificationResult[],
  readiness: Array<{ section_key: string; bucket_key: string; deficit: number }>,
) {
  const plans: StrictBucketPlan[] = readiness.map((bucket) => {
    const candidates = results.filter((result) => result.decision === 'promotable'
      && result.sectionKey === bucket.section_key && result.bucketKey === bucket.bucket_key);
    const deficit = Math.max(0, Math.trunc(Number(bucket.deficit) || 0));
    const selected = diverseSelection(candidates, deficit);
    return {
      sectionKey: bucket.section_key,
      bucketKey: bucket.bucket_key,
      deficit,
      promotable: candidates.length,
      selected,
      unresolved: Math.max(0, deficit - selected.length),
    };
  });
  return {
    buckets: plans,
    selected: plans.flatMap((plan) => plan.selected),
    unresolved: plans.reduce((total, plan) => total + plan.unresolved, 0),
  };
}

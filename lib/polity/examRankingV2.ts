import supabase from '@/lib/supabase';
import { CATALOG_CACHE_TAG, CATALOG_REVALIDATE_SECONDS } from '@/lib/catalogCache';
import { humanizeExamCode, getImportanceLabel } from '@/lib/polity/examRankingLabels';
import { normalizeExamCode } from '@/lib/polity';
import type { LocalizedText, TopicWithPriority } from '@/types/polity';
import type {
  PolityExamRankingBundle,
  PolityRankedExamOption,
  PolitySubtopicRankingRow,
  PolityTopicRankingRow,
} from '@/types/polityExamRankingV2';
import { unstable_cache } from 'next/cache';

const DEBUG = process.env.NODE_ENV !== 'production';

/** Safety net — ranked view should already exclude these no-Polity paths. */
const EXCLUDED_EXAM_CODES = new Set([
  'CTET_PAPER_I',
  'CTET_PAPER_1',
  'CTET_PAPER1',
  'CTET_MATHS_SCIENCE',
  'CTET_MATHEMATICS_SCIENCE',
  'CTET_MATH_SCIENCE',
]);

const TOPIC_PRIORITY_SELECT =
  'exam_code, family_code, jurisdiction_code, jurisdiction_name, exam_type, stage, paper, ranking_profile_code, topic_id, priority, importance, is_recommended, basis_note, evidence_status, official_ranking_status, match_type, syllabus_clause, source_url, source_title, source_locator, effective_ranking_status, effective_ranking_method, pyq_evidence_mode, pyq_confidence, ranking_basis';

const SUBTOPIC_PRIORITY_SELECT =
  `${TOPIC_PRIORITY_SELECT}, subtopic_id, depth_level`;

type RawRankingRow = Record<string, unknown>;

function logQuery(name: string, params: Record<string, unknown>, count: number, error: unknown) {
  if (!DEBUG) return;
  if (error) {
    console.error(`[examRankingV2] ${name} error`, error);
    return;
  }
  console.log(`[examRankingV2] ${name}`, params, `rows=${count}`);
}

function parseLocalizedField(value: unknown): LocalizedText {
  if (!value) return {};
  if (typeof value === 'string') return { en: value, hi: value };
  if (typeof value === 'object' && value !== null) {
    const obj = value as Record<string, unknown>;
    return {
      en: typeof obj.en === 'string' ? obj.en : undefined,
      hi: typeof obj.hi === 'string' ? obj.hi : undefined,
    };
  }
  return {};
}

function isExcludedExamCode(code: string): boolean {
  return EXCLUDED_EXAM_CODES.has(normalizeExamCode(code));
}

function resolveJurisdictionGroup(row: {
  jurisdiction_code?: string | null;
  jurisdiction_name?: string | null;
}): PolityRankedExamOption['jurisdictionGroup'] {
  const name = String(row.jurisdiction_name ?? '').toLowerCase();
  const code = String(row.jurisdiction_code ?? '').toUpperCase();

  if (
    name.includes('union territory') ||
    name.includes('ut ') ||
    code.startsWith('UT_') ||
    ['AN', 'CH', 'DN', 'DD', 'JK', 'LA', 'LD', 'PY', 'DL'].includes(code)
  ) {
    return 'union_territory';
  }

  if (
    name.includes('national') ||
    name.includes('all india') ||
    name === 'india' ||
    code === 'IN' ||
    code === 'NATIONAL' ||
    code === 'INDIA'
  ) {
    return 'national';
  }

  return 'state';
}

function mapEvidence(row: RawRankingRow) {
  return {
    ranking_basis: row.ranking_basis != null ? String(row.ranking_basis) : null,
    evidence_status: row.evidence_status != null ? String(row.evidence_status) : null,
    official_ranking_status:
      row.official_ranking_status != null ? String(row.official_ranking_status) : null,
    effective_ranking_status:
      row.effective_ranking_status != null ? String(row.effective_ranking_status) : null,
    effective_ranking_method:
      row.effective_ranking_method != null ? String(row.effective_ranking_method) : null,
    pyq_evidence_mode: row.pyq_evidence_mode != null ? String(row.pyq_evidence_mode) : null,
    pyq_confidence: row.pyq_confidence != null ? String(row.pyq_confidence) : null,
    basis_note: row.basis_note != null ? String(row.basis_note) : null,
    syllabus_clause: row.syllabus_clause != null ? String(row.syllabus_clause) : null,
    source_url: row.source_url != null ? String(row.source_url) : null,
    source_title: row.source_title != null ? String(row.source_title) : null,
    source_locator: row.source_locator != null ? String(row.source_locator) : null,
    match_type: row.match_type != null ? String(row.match_type) : null,
  };
}

async function fetchExamSeriesTitles(
  examCodes: string[],
): Promise<Map<string, LocalizedText>> {
  if (examCodes.length === 0) return new Map();

  const { data, error } = await supabase
    .from('polity_exam_series')
    .select('exam_code, title')
    .in('exam_code', examCodes);

  if (error) {
    logQuery('fetchExamSeriesTitles', { count: examCodes.length }, 0, error);
    return new Map();
  }

  const map = new Map<string, LocalizedText>();
  for (const row of data ?? []) {
    const code = String((row as RawRankingRow).exam_code ?? '');
    if (!code) continue;
    const title = parseLocalizedField((row as RawRankingRow).title);
    if (title.en || title.hi) {
      map.set(normalizeExamCode(code), title);
    }
  }

  logQuery('fetchExamSeriesTitles', { count: examCodes.length }, map.size, null);
  return map;
}

function buildExamOption(
  row: RawRankingRow,
  seriesTitles: Map<string, LocalizedText>,
): PolityRankedExamOption {
  const examCode = normalizeExamCode(String(row.exam_code ?? ''));
  const seriesTitle = seriesTitles.get(examCode);
  const hasSeriesTitle = Boolean(seriesTitle?.en || seriesTitle?.hi);

  return {
    exam_code: examCode,
    family_code: row.family_code != null ? String(row.family_code) : null,
    jurisdiction_code: row.jurisdiction_code != null ? String(row.jurisdiction_code) : null,
    jurisdiction_name: row.jurisdiction_name != null ? String(row.jurisdiction_name) : null,
    exam_type: row.exam_type != null ? String(row.exam_type) : null,
    stage: row.stage != null ? String(row.stage) : null,
    paper: row.paper != null ? String(row.paper) : null,
    ranking_profile_code:
      row.ranking_profile_code != null ? String(row.ranking_profile_code) : null,
    title: hasSeriesTitle ? seriesTitle! : humanizeExamCode(examCode),
    titleSource: hasSeriesTitle ? 'series' : 'humanized',
    jurisdictionGroup: resolveJurisdictionGroup({
      jurisdiction_code: row.jurisdiction_code != null ? String(row.jurisdiction_code) : null,
      jurisdiction_name: row.jurisdiction_name != null ? String(row.jurisdiction_name) : null,
    }),
  };
}

async function loadRankedExamSeedRows(): Promise<RawRankingRow[]> {
  const { data, error } = await supabase
    .from('polity_exam_topic_priority_v2')
    .select(TOPIC_PRIORITY_SELECT)
    .eq('priority', 1)
    .order('exam_code', { ascending: true });

  if (error) {
    logQuery('loadRankedExamSeedRows', {}, 0, error);
    return [];
  }

  const rows = (data ?? []).filter(
    (row: RawRankingRow) => !isExcludedExamCode(String(row.exam_code ?? '')),
  ) as RawRankingRow[];

  logQuery('loadRankedExamSeedRows', {}, rows.length, null);
  return rows;
}

export const listRankedExamOptions = unstable_cache(
  async (): Promise<PolityRankedExamOption[]> => {
    const seedRows = await loadRankedExamSeedRows();
    const examCodes = [...new Set(seedRows.map((row) => normalizeExamCode(String(row.exam_code))))];
    const seriesTitles = await fetchExamSeriesTitles(examCodes);

    return seedRows
      .map((row) => buildExamOption(row, seriesTitles))
      .sort((a, b) => {
        const groupOrder = { national: 0, state: 1, union_territory: 2 };
        const groupDiff = groupOrder[a.jurisdictionGroup] - groupOrder[b.jurisdictionGroup];
        if (groupDiff !== 0) return groupDiff;
        const titleA = a.title.en ?? a.exam_code;
        const titleB = b.title.en ?? b.exam_code;
        return titleA.localeCompare(titleB);
      });
  },
  ['polity-v2-ranked-exam-options'],
  { revalidate: CATALOG_REVALIDATE_SECONDS, tags: [CATALOG_CACHE_TAG] },
);

export async function getRankedExamCodes(): Promise<Set<string>> {
  const exams = await listRankedExamOptions();
  return new Set(exams.map((exam) => exam.exam_code));
}

export function findRankedExamOption(
  exams: PolityRankedExamOption[],
  examCode: string | null | undefined,
): PolityRankedExamOption | null {
  if (!examCode) return null;
  const normalized = normalizeExamCode(examCode);
  if (isExcludedExamCode(normalized)) return null;
  return exams.find((exam) => exam.exam_code === normalized) ?? null;
}

export function validateRankedExamCode(
  exams: PolityRankedExamOption[],
  examCode: string | null | undefined,
): { valid: boolean; normalized: string | null; exam: PolityRankedExamOption | null } {
  if (!examCode) {
    return { valid: false, normalized: null, exam: null };
  }
  const normalized = normalizeExamCode(examCode);
  if (isExcludedExamCode(normalized)) {
    return { valid: false, normalized, exam: null };
  }
  const exam = findRankedExamOption(exams, normalized);
  return { valid: Boolean(exam), normalized, exam };
}

async function fetchTopicMetadata(topicIds: string[]) {
  if (topicIds.length === 0) return new Map<string, Record<string, unknown>>();

  const { data, error } = await supabase
    .from('topics')
    .select(
      'id, subject_id, title, slug, description, icon_key, sort_order, subtopic_count, question_count, is_active',
    )
    .in('id', topicIds)
    .eq('is_active', true);

  if (error) {
    logQuery('fetchTopicMetadata', { topicIds: topicIds.length }, 0, error);
    return new Map();
  }

  return new Map(
    (data ?? []).map((row: RawRankingRow) => [String(row.id), row as Record<string, unknown>]),
  );
}

async function fetchSubtopicMetadata(subtopicIds: string[]) {
  if (subtopicIds.length === 0) return new Map<string, Record<string, unknown>>();

  const { data, error } = await supabase
    .from('subtopics')
    .select('id, topic_id, title, slug, description, sort_order, question_count, is_active')
    .in('id', subtopicIds)
    .eq('is_active', true);

  if (error) {
    logQuery('fetchSubtopicMetadata', { subtopicIds: subtopicIds.length }, 0, error);
    return new Map();
  }

  return new Map(
    (data ?? []).map((row: RawRankingRow) => [String(row.id), row as Record<string, unknown>]),
  );
}

function mapTopicRankingRow(
  row: RawRankingRow,
  topicMap: Map<string, Record<string, unknown>>,
): PolityTopicRankingRow | null {
  const topicId = String(row.topic_id ?? '');
  const topicRow = topicMap.get(topicId);
  if (!topicRow) return null;

  return {
    exam_code: normalizeExamCode(String(row.exam_code ?? '')),
    family_code: row.family_code != null ? String(row.family_code) : null,
    topic_id: topicId,
    priority: Number(row.priority ?? 0),
    importance: row.importance != null ? String(row.importance) : null,
    is_recommended: Boolean(row.is_recommended),
    ...mapEvidence(row),
    topic: {
      id: topicId,
      title: parseLocalizedField(topicRow.title),
      slug: String(topicRow.slug ?? ''),
      description: (() => {
        const parsed = parseLocalizedField(topicRow.description);
        return parsed.en || parsed.hi ? parsed : null;
      })(),
      icon_key: topicRow.icon_key != null ? String(topicRow.icon_key) : null,
      subtopic_count:
        typeof topicRow.subtopic_count === 'number' ? topicRow.subtopic_count : null,
      question_count: typeof topicRow.question_count === 'number' ? topicRow.question_count : null,
    },
  };
}

function mapSubtopicRankingRow(
  row: RawRankingRow,
  subtopicMap: Map<string, Record<string, unknown>>,
  topicMap: Map<string, Record<string, unknown>>,
): PolitySubtopicRankingRow | null {
  const subtopicId = String(row.subtopic_id ?? '');
  const topicId = String(row.topic_id ?? '');
  const subtopicRow = subtopicMap.get(subtopicId);
  const topicRow = topicMap.get(topicId);
  if (!subtopicRow || !topicRow) return null;

  return {
    exam_code: normalizeExamCode(String(row.exam_code ?? '')),
    family_code: row.family_code != null ? String(row.family_code) : null,
    topic_id: topicId,
    subtopic_id: subtopicId,
    priority: Number(row.priority ?? 0),
    importance: row.importance != null ? String(row.importance) : null,
    depth_level: row.depth_level != null ? String(row.depth_level) : null,
    is_recommended: Boolean(row.is_recommended),
    ...mapEvidence(row),
    subtopic: {
      id: subtopicId,
      topic_id: topicId,
      title: parseLocalizedField(subtopicRow.title),
      slug: String(subtopicRow.slug ?? ''),
      description: (() => {
        const parsed = parseLocalizedField(subtopicRow.description);
        return parsed.en || parsed.hi ? parsed : null;
      })(),
      question_count:
        typeof subtopicRow.question_count === 'number' ? subtopicRow.question_count : null,
    },
    topic: {
      id: topicId,
      title: parseLocalizedField(topicRow.title),
      slug: String(topicRow.slug ?? ''),
      icon_key: topicRow.icon_key != null ? String(topicRow.icon_key) : null,
    },
  };
}

export async function getExamRankingBundle(examCode: string): Promise<PolityExamRankingBundle> {
  const normalized = normalizeExamCode(examCode);
  if (!normalized || isExcludedExamCode(normalized)) {
    return { examCode: normalized, exam: null, topics: [], subtopics: [] };
  }

  return unstable_cache(
    async () => {
      const [examOptions, topicResult, subtopicResult] = await Promise.all([
        listRankedExamOptions(),
        supabase
          .from('polity_exam_topic_priority_v2')
          .select(TOPIC_PRIORITY_SELECT)
          .eq('exam_code', normalized)
          .order('priority', { ascending: true }),
        supabase
          .from('polity_exam_subtopic_priority_v2')
          .select(SUBTOPIC_PRIORITY_SELECT)
          .eq('exam_code', normalized)
          .order('priority', { ascending: true }),
      ]);

      const exam = findRankedExamOption(examOptions, normalized);

      if (topicResult.error) {
        logQuery('getExamRankingBundle.topics', { examCode: normalized }, 0, topicResult.error);
      }
      if (subtopicResult.error) {
        logQuery(
          'getExamRankingBundle.subtopics',
          { examCode: normalized },
          0,
          subtopicResult.error,
        );
      }

      const topicRows = (topicResult.data ?? []) as RawRankingRow[];
      const subtopicRows = (subtopicResult.data ?? []) as RawRankingRow[];

      const topicIds = [...new Set(topicRows.map((row) => String(row.topic_id)))];
      const subtopicIds = [...new Set(subtopicRows.map((row) => String(row.subtopic_id)))];
      const parentTopicIds = [...new Set(subtopicRows.map((row) => String(row.topic_id)))];

      const [topicMeta, subtopicMeta] = await Promise.all([
        fetchTopicMetadata([...new Set([...topicIds, ...parentTopicIds])]),
        fetchSubtopicMetadata(subtopicIds),
      ]);

      const topics = topicRows
        .map((row) => mapTopicRankingRow(row, topicMeta))
        .filter((row): row is PolityTopicRankingRow => row != null)
        .sort((a, b) => a.priority - b.priority);

      const subtopics = subtopicRows
        .map((row) => mapSubtopicRankingRow(row, subtopicMeta, topicMeta))
        .filter((row): row is PolitySubtopicRankingRow => row != null)
        .sort((a, b) => a.priority - b.priority);

      logQuery(
        'getExamRankingBundle',
        { examCode: normalized },
        topics.length + subtopics.length,
        null,
      );

      return { examCode: normalized, exam, topics, subtopics };
    },
    ['polity-v2-exam-bundle', normalized],
    { revalidate: CATALOG_REVALIDATE_SECONDS, tags: [CATALOG_CACHE_TAG] },
  )();
}

export async function getExamWiseTopicsV2(
  subjectId: string,
  examCode: string,
): Promise<TopicWithPriority[]> {
  const normalized = normalizeExamCode(examCode);
  if (!subjectId || !normalized || isExcludedExamCode(normalized)) return [];

  return unstable_cache(
    async () => {
      const { data: priorityRows, error } = await supabase
        .from('polity_exam_topic_priority_v2')
        .select(TOPIC_PRIORITY_SELECT)
        .eq('exam_code', normalized)
        .order('priority', { ascending: true });

      if (error) {
        logQuery('getExamWiseTopicsV2', { subjectId, examCode: normalized }, 0, error);
        return [];
      }

      const rows = (priorityRows ?? []) as RawRankingRow[];
      if (rows.length === 0) return [];

      const topicIds = rows.map((row) => String(row.topic_id));
      const topicMeta = await fetchTopicMetadata(topicIds);

      return rows
        .map((row) => mapTopicRankingRow(row, topicMeta))
        .filter((row): row is PolityTopicRankingRow => row != null)
        .filter((row) => {
          const topicRow = topicMeta.get(row.topic_id);
          return topicRow && String(topicRow.subject_id) === subjectId;
        })
        .sort((a, b) => a.priority - b.priority)
        .map((row) => ({
          id: row.topic.id,
          title: row.topic.title,
          slug: row.topic.slug,
          description: row.topic.description,
          icon_key: row.topic.icon_key,
          subtopic_count: row.topic.subtopic_count,
          question_count: row.topic.question_count,
          priority: row.priority,
          importance: getImportanceLabel(row.importance) ?? row.importance,
          is_recommended: row.is_recommended,
        }));
    },
    ['polity-v2-exam-topics', subjectId, normalized],
    { revalidate: CATALOG_REVALIDATE_SECONDS, tags: [CATALOG_CACHE_TAG] },
  )();
}

export type ExamSeriesTitleCoverage = {
  rankedCount: number;
  seriesTitleCount: number;
  humanizedFallbackCount: number;
};

export async function getExamSeriesTitleCoverage(): Promise<ExamSeriesTitleCoverage> {
  const exams = await listRankedExamOptions();
  const seriesTitleCount = exams.filter((exam) => exam.titleSource === 'series').length;
  return {
    rankedCount: exams.length,
    seriesTitleCount,
    humanizedFallbackCount: exams.length - seriesTitleCount,
  };
}

export async function getExamWiseSubtopicsV2(
  topicId: string,
  examCode: string,
): Promise<
  import('@/types/polity').SubtopicWithExamPriority[]
> {
  const normalized = normalizeExamCode(examCode);
  if (!topicId || !normalized) return [];

  const { data, error } = await supabase
    .from('polity_exam_subtopic_priority_v2')
    .select(SUBTOPIC_PRIORITY_SELECT)
    .eq('exam_code', normalized)
    .eq('topic_id', topicId)
    .order('priority', { ascending: true });

  if (error) {
    logQuery('getExamWiseSubtopicsV2', { topicId, examCode: normalized }, 0, error);
    return [];
  }

  const rows = (data ?? []) as RawRankingRow[];
  if (rows.length === 0) return [];

  const subtopicIds = rows.map((row) => String(row.subtopic_id));
  const subtopicMap = await fetchSubtopicMetadata(subtopicIds);

  return rows
    .map((row, index) => {
      const subtopicRow = subtopicMap.get(String(row.subtopic_id));
      if (!subtopicRow) return null;

      const subtopic = {
        id: String(subtopicRow.id),
        topic_id: String(subtopicRow.topic_id),
        title: parseLocalizedField(subtopicRow.title),
        slug: String(subtopicRow.slug ?? ''),
        description: (() => {
          const parsed = parseLocalizedField(subtopicRow.description);
          return parsed.en || parsed.hi ? parsed : null;
        })(),
        sort_order: typeof subtopicRow.sort_order === 'number' ? subtopicRow.sort_order : null,
        question_count:
          typeof subtopicRow.question_count === 'number' ? subtopicRow.question_count : null,
        is_active: Boolean(subtopicRow.is_active),
      };

      return {
        ...subtopic,
        priority: index + 1,
        exam_priority: Number(row.priority ?? index + 1),
        importance: row.importance != null ? String(row.importance) : null,
        importance_label: getImportanceLabelForLegacy(row.importance),
        is_recommended: Boolean(row.is_recommended),
      };
    })
    .filter((item): item is NonNullable<typeof item> => item != null);
}

function getImportanceLabelForLegacy(value: unknown): import('@/types/polity').LocalizedText | null {
  if (value == null) return null;
  const key = String(value).toLowerCase();
  const labels: Record<string, import('@/types/polity').LocalizedText> = {
    high: { en: 'High', hi: 'उच्च' },
    medium: { en: 'Medium', hi: 'मध्यम' },
    low: { en: 'Low', hi: 'कम' },
  };
  return labels[key] ?? { en: String(value), hi: String(value) };
}

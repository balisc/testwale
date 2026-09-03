import { isExamOptionSelectable, type ExamSelectorOption } from '@/lib/examSelector';
import type { PublicMockExamSummary } from '@/lib/mockTests/showcase';

export const PUBLIC_EXAM_NAV_LIMIT = 6;

const PUBLIC_EXAM_CODE_PATTERN = /^[A-Z0-9]+(?:_[A-Z0-9]+)*$/;
const PUBLIC_EXAM_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Existing short canonical preserved by the permanent redirect in next.config.mjs. */
const CANONICAL_SLUG_OVERRIDES: Readonly<Record<string, string>> = {
  SSC_CGL: 'ssc-cgl',
};

export type PublicExamDirectoryEntry = {
  code: string;
  shortName: string;
  publicTitle: { en: string; hi: string | null };
  canonicalPath: string;
  sortOrder: number;
  subjectCount: number;
  topicCount: number;
  subtopicCount: number;
  verifiedQuestionCount: number;
  stageSummary: string | null;
  mockAvailable: boolean;
  mockPath: string | null;
};

export type PublicExamNavigationEntry = Pick<
  PublicExamDirectoryEntry,
  'code' | 'shortName' | 'publicTitle' | 'canonicalPath' | 'mockAvailable' | 'mockPath'
>;

function cleanText(value: string | null | undefined): string | null {
  const normalized = value?.trim().replace(/\s+/g, ' ') ?? '';
  return normalized ? normalized.slice(0, 180) : null;
}

export function isValidPublicExamCode(value: string): boolean {
  return PUBLIC_EXAM_CODE_PATTERN.test(value) && value.length <= 80;
}

export function isValidPublicExamSlug(value: string): boolean {
  return PUBLIC_EXAM_SLUG_PATTERN.test(value) && value.length <= 120;
}

export function publicExamCanonicalPath(examCode: string, examSlug: string): string | null {
  const code = examCode.trim().toUpperCase();
  const slug = (CANONICAL_SLUG_OVERRIDES[code] ?? examSlug).trim().toLowerCase();
  if (!isValidPublicExamCode(code) || !isValidPublicExamSlug(slug)) return null;
  return `/exams/${slug}`;
}

function validMockPath(value: string): string | null {
  const match = value.trim().match(/^\/mock-tests\/([a-z0-9]+(?:-[a-z0-9]+)*)$/);
  return match ? value.trim() : null;
}

export function buildPublicExamDirectory(
  options: readonly ExamSelectorOption[],
  mockSummaries: readonly PublicMockExamSummary[],
): PublicExamDirectoryEntry[] {
  const mocksByExactCode = new Map(
    mockSummaries
      .filter((mock) => isValidPublicExamCode(mock.examCode))
      .map((mock) => [mock.examCode, mock] as const),
  );

  const entries = options.flatMap((option): PublicExamDirectoryEntry[] => {
    if (!isExamOptionSelectable(option)) return [];
    const code = option.exam_code.trim().toUpperCase();
    const canonicalPath = publicExamCanonicalPath(code, option.exam_slug);
    if (!canonicalPath) return [];

    const mock = mocksByExactCode.get(code);
    const englishTitle = cleanText(option.official_title.en)
      ?? cleanText(option.display_title.en)
      ?? cleanText(option.short_name)
      ?? code.replaceAll('_', ' ');
    const hindiTitle = cleanText(option.official_title.hi)
      ?? cleanText(option.display_title.hi);
    const shortName = cleanText(option.short_name)
      ?? cleanText(option.display_title.en)
      ?? code.replaceAll('_', ' ');

    return [{
      code,
      shortName,
      publicTitle: {
        en: englishTitle,
        hi: hindiTitle && hindiTitle !== englishTitle ? hindiTitle : null,
      },
      canonicalPath,
      sortOrder: option.sort_order ?? Number.MAX_SAFE_INTEGER,
      subjectCount: option.active_subject_count,
      topicCount: option.active_topic_count,
      subtopicCount: option.active_subtopic_count,
      verifiedQuestionCount: option.verified_question_count,
      stageSummary: mock?.tier ?? null,
      mockAvailable: mock?.availability === 'available',
      mockPath: mock ? validMockPath(mock.destination) : null,
    }];
  }).sort((left, right) => (
    left.sortOrder - right.sortOrder
    || left.shortName.localeCompare(right.shortName, 'en-IN')
    || left.code.localeCompare(right.code, 'en-IN')
  ));

  const seenCodes = new Set<string>();
  const seenPaths = new Set<string>();
  return entries.filter((entry) => {
    if (seenCodes.has(entry.code) || seenPaths.has(entry.canonicalPath)) return false;
    seenCodes.add(entry.code);
    seenPaths.add(entry.canonicalPath);
    return true;
  });
}

export function isExamNavigationPath(
  pathname: string | null,
  exams: readonly PublicExamNavigationEntry[],
): boolean {
  if (!pathname) return false;
  if (pathname === '/exams' || pathname.startsWith('/exams/')) return true;
  return exams.some((exam) => exam.mockPath === pathname);
}

export function isCurrentExamPath(
  pathname: string | null,
  exam: PublicExamNavigationEntry,
): boolean {
  if (!pathname) return false;
  return pathname === exam.canonicalPath
    || pathname.startsWith(`${exam.canonicalPath}/`)
    || pathname === exam.mockPath;
}

export function toPublicExamNavigationEntries(
  exams: readonly PublicExamDirectoryEntry[],
): PublicExamNavigationEntry[] {
  return exams.slice(0, PUBLIC_EXAM_NAV_LIMIT).map((exam) => ({
    code: exam.code,
    shortName: exam.shortName,
    publicTitle: exam.publicTitle,
    canonicalPath: exam.canonicalPath,
    mockAvailable: exam.mockAvailable,
    mockPath: exam.mockPath,
  }));
}

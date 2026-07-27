import { calcAccuracyPercent, clampPercent } from './profileOverviewCore';
import type {
  ProfileSavedData,
  SavedMistakeRow,
  SavedMistakeStatus,
  SavedQueueBucket,
  SavedRecentItem,
  SavedRevisionQueue,
} from './profileSavedTypes';

export const SAVED_RECENT_MISTAKE_DAYS = 7;
export const SAVED_MONTH_MISTAKE_DAYS = 30;

export type SavedFirstAttemptRow = {
  question_id: string;
  is_correct: boolean;
  attempted_at: string;
  subject_id: string | null;
  topic_id: string | null;
  topic_title?: string | null;
  topic_slug?: string | null;
  subject_slug?: string | null;
  subject_title_en?: string | null;
};

export type SavedRetryRow = {
  question_id: string;
  is_correct: boolean;
  attempted_at: string;
};

export type SavedBookmarkRow = {
  id: string;
  question_id: string;
  created_at: string;
  question_title_en?: string | null;
  topic_title?: string | null;
  topic_slug?: string | null;
  subject_slug?: string | null;
  subject_title_en?: string | null;
  question_href?: string | null;
};

export type SavedNoteRow = {
  id: string;
  title: string;
  note_text: string;
  created_at: string;
  updated_at: string;
  topic_title?: string | null;
  topic_slug?: string | null;
  subject_slug?: string | null;
  subject_title_en?: string | null;
  question_href?: string | null;
};

export function buildPracticeHref(
  subjectSlug: string | null | undefined,
  topicSlug: string | null | undefined,
): string | null {
  if (subjectSlug && topicSlug) return `/subjects/${subjectSlug}/${topicSlug}/practice`;
  return null;
}

export function daysSince(iso: string, now = new Date()): number {
  const ts = new Date(iso).getTime();
  return Math.floor((now.getTime() - ts) / 86_400_000);
}

export function isWithinRecentDays(iso: string, days: number, now = new Date()): boolean {
  return daysSince(iso, now) <= days;
}

export function getWeekStartMs(now = new Date()): number {
  const istNow = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  const day = istNow.getDay();
  const diff = day === 0 ? 6 : day - 1;
  istNow.setDate(istNow.getDate() - diff);
  istNow.setHours(0, 0, 0, 0);
  return istNow.getTime();
}

export function buildRecoveryMaps(
  firstAttempts: SavedFirstAttemptRow[],
  retries: SavedRetryRow[],
) {
  const firstByQuestion = new Map(firstAttempts.map((row) => [row.question_id, row]));
  const recovered = new Set<string>();
  const firstCorrectRetryAt = new Map<string, string>();

  for (const retry of retries) {
    const first = firstByQuestion.get(retry.question_id);
    if (!first || first.is_correct) continue;
    if (new Date(retry.attempted_at).getTime() <= new Date(first.attempted_at).getTime()) continue;
    if (!retry.is_correct) continue;

    if (!firstCorrectRetryAt.has(retry.question_id)) {
      firstCorrectRetryAt.set(retry.question_id, retry.attempted_at);
      recovered.add(retry.question_id);
    }
  }

  return { firstByQuestion, recovered, firstCorrectRetryAt };
}

export function buildMistakeRecovery(
  firstAttempts: SavedFirstAttemptRow[],
  retries: SavedRetryRow[],
  now = new Date(),
) {
  const mistakes = firstAttempts.filter((row) => !row.is_correct);
  const { recovered, firstCorrectRetryAt } = buildRecoveryMaps(firstAttempts, retries);
  const weekStartMs = getWeekStartMs(now);

  let recoveredThisWeek = 0;
  for (const correctedAt of firstCorrectRetryAt.values()) {
    if (new Date(correctedAt).getTime() >= weekStartMs) recoveredThisWeek += 1;
  }

  const totalMistakes = mistakes.length;
  const recoveredCount = recovered.size;
  const unresolvedCount = totalMistakes - recoveredCount;

  return {
    total_mistakes: totalMistakes,
    recovered_count: recoveredCount,
    unresolved_count: unresolvedCount,
    recovery_percent:
      totalMistakes > 0 ? clampPercent(calcAccuracyPercent(recoveredCount, totalMistakes)) : null,
    recovered_this_week: recoveredThisWeek,
    has_mistakes: totalMistakes > 0,
  };
}

export function buildRevisionQueue(
  unresolvedRows: SavedFirstAttemptRow[],
  now = new Date(),
): SavedRevisionQueue {
  const recent = unresolvedRows.filter((row) =>
    isWithinRecentDays(row.attempted_at, SAVED_RECENT_MISTAKE_DAYS, now),
  ).length;
  const thisMonth = unresolvedRows.filter((row) => {
    const age = daysSince(row.attempted_at, now);
    return age > SAVED_RECENT_MISTAKE_DAYS && age <= SAVED_MONTH_MISTAKE_DAYS;
  }).length;
  const older = unresolvedRows.filter(
    (row) => daysSince(row.attempted_at, now) > SAVED_MONTH_MISTAKE_DAYS,
  ).length;

  const buckets: SavedQueueBucket[] = [
    {
      key: 'recent',
      label_en: 'Recently missed',
      label_hi: 'हाल में छूटे',
      count: recent,
    },
    {
      key: 'this_month',
      label_en: 'This month',
      label_hi: 'इस महीने',
      count: thisMonth,
    },
    {
      key: 'older',
      label_en: 'Older',
      label_hi: 'पुराने',
      count: older,
    },
  ];

  const topHref = pickTopMistakeHref(unresolvedRows);

  return {
    has_revision_schedule: false,
    title_en: 'Questions to review',
    title_hi: 'समीक्षा के लिए प्रश्न',
    explanation_en:
      'QuestionWale will organise review dates when revision scheduling is available.',
    explanation_hi:
      'रिविज़न शेड्यूल उपलब्ध होने पर QuestionWale समीक्षा तिथियाँ व्यवस्थित करेगा।',
    buckets,
    total_actionable: unresolvedRows.length,
    start_href: topHref,
    start_label_en: topHref ? 'Review next' : null,
    start_label_hi: topHref ? 'अगला समीक्षा करें' : null,
  };
}

function pickTopMistakeHref(rows: SavedFirstAttemptRow[]): string | null {
  const sorted = [...rows].sort(
    (a, b) => new Date(b.attempted_at).getTime() - new Date(a.attempted_at).getTime(),
  );
  for (const row of sorted) {
    const href = buildPracticeHref(row.subject_slug, row.topic_slug);
    if (href) return href;
  }
  return null;
}

export function countIncorrectAttempts(
  questionId: string,
  retries: SavedRetryRow[],
  firstAttemptAt: string,
): number {
  let count = 1;
  for (const retry of retries) {
    if (retry.question_id !== questionId) continue;
    if (new Date(retry.attempted_at).getTime() <= new Date(firstAttemptAt).getTime()) continue;
    if (!retry.is_correct) count += 1;
  }
  return count;
}

export function classifyMistakeStatus(
  attemptedAt: string,
  incorrectAttempts: number,
  now = new Date(),
): SavedMistakeStatus {
  if (incorrectAttempts >= 2) return 'incorrect_twice';
  if (isWithinRecentDays(attemptedAt, SAVED_RECENT_MISTAKE_DAYS, now)) return 'recently_missed';
  return 'unresolved';
}

export function buildMistakesToReview(
  firstAttempts: SavedFirstAttemptRow[],
  retries: SavedRetryRow[],
  recovered: Set<string>,
  limit = 4,
  now = new Date(),
): SavedMistakeRow[] {
  const unresolved = firstAttempts
    .filter((row) => !row.is_correct && !recovered.has(row.question_id))
    .sort((a, b) => new Date(b.attempted_at).getTime() - new Date(a.attempted_at).getTime());

  return unresolved.slice(0, limit).map((row) => {
    const incorrectCount = countIncorrectAttempts(row.question_id, retries, row.attempted_at);
    return {
      question_id: row.question_id,
      title: row.topic_title?.trim() || 'Practice question',
      subject_title: row.subject_title_en?.trim() || 'Subject',
      status: classifyMistakeStatus(row.attempted_at, incorrectCount, now),
      review_href: buildPracticeHref(row.subject_slug, row.topic_slug),
      attempted_at: row.attempted_at,
    };
  });
}

export function safeNotePreview(text: string, maxLen = 80): string {
  const stripped = text.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  if (stripped.length <= maxLen) return stripped;
  return `${stripped.slice(0, maxLen - 1)}…`;
}

export function formatSavedTimestamp(iso: string, now = new Date()): { en: string; hi: string } {
  const ts = new Date(iso).getTime();
  const diffDays = Math.floor((now.getTime() - ts) / 86_400_000);
  if (diffDays <= 0) return { en: 'Today', hi: 'आज' };
  if (diffDays === 1) return { en: 'Yesterday', hi: 'कल' };
  if (diffDays < 7) return { en: `${diffDays} days ago`, hi: `${diffDays} दिन पहले` };
  const date = new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    timeZone: 'Asia/Kolkata',
  }).format(new Date(iso));
  return { en: date, hi: date };
}

export function buildRecentSavedItems(
  bookmarks: SavedBookmarkRow[],
  notes: SavedNoteRow[],
  limit = 5,
  now = new Date(),
): SavedRecentItem[] {
  const items: SavedRecentItem[] = [];

  for (const bookmark of bookmarks) {
    const labels = formatSavedTimestamp(bookmark.created_at, now);
    items.push({
      id: bookmark.id,
      type: 'bookmark',
      title: bookmark.question_title_en?.trim() || bookmark.topic_title?.trim() || 'Bookmarked question',
      context: bookmark.subject_title_en?.trim() || null,
      preview: null,
      timestamp: bookmark.created_at,
      timestamp_label_en: labels.en,
      timestamp_label_hi: labels.hi,
      href:
        bookmark.question_href ??
        buildPracticeHref(bookmark.subject_slug, bookmark.topic_slug),
    });
  }

  for (const note of notes) {
    const labels = formatSavedTimestamp(note.updated_at, now);
    items.push({
      id: note.id,
      type: 'note',
      title: note.title?.trim() || 'Untitled note',
      context: note.subject_title_en?.trim() || note.topic_title?.trim() || null,
      preview: safeNotePreview(note.note_text),
      timestamp: note.updated_at,
      timestamp_label_en: labels.en,
      timestamp_label_hi: labels.hi,
      href:
        note.question_href ?? buildPracticeHref(note.subject_slug, note.topic_slug),
    });
  }

  return items
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit);
}

export function buildProfileSavedData(input: {
  firstAttempts: SavedFirstAttemptRow[];
  retries: SavedRetryRow[];
  bookmarks: SavedBookmarkRow[];
  notes: SavedNoteRow[];
  reportedQuestions: number;
  now?: Date;
}): ProfileSavedData {
  const now = input.now ?? new Date();
  const { recovered } = buildRecoveryMaps(input.firstAttempts, input.retries);
  const mistakeRecovery = buildMistakeRecovery(input.firstAttempts, input.retries, now);

  const unresolvedRows = input.firstAttempts.filter(
    (row) => !row.is_correct && !recovered.has(row.question_id),
  );

  const revisionQueue = buildRevisionQueue(unresolvedRows, now);
  const mistakesToReview = buildMistakesToReview(
    input.firstAttempts,
    input.retries,
    recovered,
    4,
    now,
  );

  const recentSavedItems = buildRecentSavedItems(input.bookmarks, input.notes, 5, now);

  const hasAnyData =
    input.firstAttempts.length > 0 ||
    input.bookmarks.length > 0 ||
    input.notes.length > 0 ||
    input.reportedQuestions > 0;

  const allMistakesRecovered =
    mistakeRecovery.has_mistakes && mistakeRecovery.unresolved_count === 0;
  const caughtUp = unresolvedRows.length === 0 && mistakeRecovery.has_mistakes;

  return {
    has_revision_schedule: false,
    revision_queue: revisionQueue,
    mistake_recovery: mistakeRecovery,
    mistakes_to_review: mistakesToReview,
    saved_learning: {
      bookmarks: input.bookmarks.length,
      notes: input.notes.length,
      reported_questions: input.reportedQuestions,
      has_recently_viewed: false,
    },
    recent_saved_items: recentSavedItems,
    has_any_data: hasAnyData,
    all_mistakes_recovered: allMistakesRecovered,
    caught_up: caughtUp,
  };
}

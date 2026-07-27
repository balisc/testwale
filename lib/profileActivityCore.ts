import {
  calcAccuracyPercent,
  calcStreakDays,
  clampPercent,
  formatStudyTime,
  istDateKey,
} from './profileOverviewCore';
import type {
  ActivityAccuracyTrend,
  ActivityAccuracyTrendPoint,
  ActivityMixRow,
  ActivityPeriodDays,
  ActivityPracticeMix,
  ActivityRecentItem,
  ActivityRetryImprovement,
  ActivitySummaryMetrics,
  ActivityTimeConsistency,
  ProfileActivityData,
} from './profileActivityTypes';

export { formatStudyTime };

const IST = 'Asia/Kolkata';

/** Minimum paired retry cohort before showing improvement metrics. */
export const ACTIVITY_MIN_RETRY_COHORT = 5;

/** Ignore answer durations above this many seconds as corrupted. */
export const ACTIVITY_MAX_ANSWER_SECONDS = 7200;

export type FirstAttemptRow = {
  question_id: string;
  is_correct: boolean;
  attempted_at: string;
  time_taken_seconds: number | null;
  subject_id: string | null;
  topic_id: string | null;
  topic_title?: string | null;
  topic_slug?: string | null;
  subject_slug?: string | null;
  difficulty?: string | null;
  subject_title_en?: string | null;
};

export type RetryAttemptRow = {
  question_id: string;
  is_correct: boolean;
  attempted_at: string;
  time_spent_seconds: number | null;
};

export function parseActivityPeriod(raw: string | null | undefined): ActivityPeriodDays {
  if (raw === '30') return 30;
  if (raw === '90') return 90;
  if (raw === 'all') return 'all';
  return 7;
}

export function getPeriodWindow(period: ActivityPeriodDays, now = new Date()) {
  if (period === 'all') {
    return { startMs: 0, endMs: now.getTime(), previousStartMs: 0, previousEndMs: 0 };
  }
  const endMs = now.getTime();
  const startMs = endMs - period * 86_400_000;
  const previousEndMs = startMs;
  const previousStartMs = previousEndMs - period * 86_400_000;
  return { startMs, endMs, previousStartMs, previousEndMs };
}

export function isWithinMs(iso: string, startMs: number, endMs: number): boolean {
  const ts = new Date(iso).getTime();
  return ts >= startMs && ts < endMs;
}

export function isValidDuration(seconds: number | null | undefined): seconds is number {
  return (
    typeof seconds === 'number' &&
    Number.isFinite(seconds) &&
    seconds > 0 &&
    seconds <= ACTIVITY_MAX_ANSWER_SECONDS
  );
}

export function filterFirstAttemptsInPeriod(
  rows: FirstAttemptRow[],
  startMs: number,
  endMs: number,
): FirstAttemptRow[] {
  if (startMs === 0 && endMs === Number.MAX_SAFE_INTEGER) return rows;
  return rows.filter((row) => isWithinMs(row.attempted_at, startMs, endMs));
}

export function buildSummaryMetrics(rows: FirstAttemptRow[]): ActivitySummaryMetrics {
  const unique = rows.length;
  const correct = rows.filter((row) => row.is_correct).length;
  const incorrect = unique - correct;
  const timed = rows.filter((row) => isValidDuration(row.time_taken_seconds));
  const hasRecordedTime = timed.length > 0;
  const avg =
    timed.length > 0
      ? Math.round(timed.reduce((sum, row) => sum + row.time_taken_seconds!, 0) / timed.length)
      : null;

  return {
    unique_questions: unique,
    correct,
    incorrect,
    avg_answer_seconds: avg,
    has_recorded_time: hasRecordedTime,
  };
}

export function formatAverageAnswerTime(seconds: number | null, notRecordedLabel: string): string {
  if (seconds == null || seconds <= 0) return notRecordedLabel;
  if (seconds < 60) return `${seconds} sec`;
  const mins = Math.floor(seconds / 60);
  const rem = seconds % 60;
  if (rem <= 0) return `${mins} min`;
  return `${mins}m ${rem}s`;
}

export function buildAccuracyTrend(
  currentRows: FirstAttemptRow[],
  previousRows: FirstAttemptRow[],
  period: ActivityPeriodDays,
  now = new Date(),
): ActivityAccuracyTrend {
  const currentAccuracy = calcAccuracyPercent(
    currentRows.filter((row) => row.is_correct).length,
    currentRows.length,
  );
  const previousAccuracy = calcAccuracyPercent(
    previousRows.filter((row) => row.is_correct).length,
    previousRows.length,
  );
  const changePoints =
    previousRows.length > 0 ? Math.round((currentAccuracy - previousAccuracy) * 10) / 10 : null;

  const points =
    period === 30 || period === 90
      ? buildWeeklyAccuracyPoints(currentRows, period, now)
      : buildDailyAccuracyPoints(currentRows, period === 'all' ? 30 : period, now);

  return {
    current_accuracy_percent: currentAccuracy,
    change_points: changePoints,
    points,
  };
}

function buildDailyAccuracyPoints(
  rows: FirstAttemptRow[],
  dayCount: number,
  now: Date,
): ActivityAccuracyTrendPoint[] {
  const formatter = new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: IST });
  const istNow = new Date(now.toLocaleString('en-US', { timeZone: IST }));
  const points: ActivityAccuracyTrendPoint[] = [];

  for (let offset = dayCount - 1; offset >= 0; offset -= 1) {
    const date = new Date(istNow);
    date.setDate(istNow.getDate() - offset);
    const key = istDateKey(date.toISOString());
    const dayRows = rows.filter((row) => istDateKey(row.attempted_at) === key);
    points.push({
      key,
      label: formatter.format(date),
      accuracy_percent:
        dayRows.length > 0
          ? calcAccuracyPercent(dayRows.filter((row) => row.is_correct).length, dayRows.length)
          : null,
      attempts: dayRows.length,
    });
  }

  return points;
}

function buildWeeklyAccuracyPoints(
  rows: FirstAttemptRow[],
  period: 30 | 90,
  now: Date,
): ActivityAccuracyTrendPoint[] {
  const bucketCount = period === 30 ? 6 : 13;
  const bucketSize = Math.ceil(period / bucketCount);
  const endMs = now.getTime();
  const startMs = endMs - period * 86_400_000;
  const points: ActivityAccuracyTrendPoint[] = [];

  for (let index = 0; index < bucketCount; index += 1) {
    const bucketStart = startMs + index * bucketSize * 86_400_000;
    const bucketEnd = Math.min(endMs, bucketStart + bucketSize * 86_400_000);
    const bucketRows = rows.filter((row) => {
      const ts = new Date(row.attempted_at).getTime();
      return ts >= bucketStart && ts < bucketEnd;
    });
    points.push({
      key: `w${index}`,
      label: `W${index + 1}`,
      accuracy_percent:
        bucketRows.length > 0
          ? calcAccuracyPercent(
              bucketRows.filter((row) => row.is_correct).length,
              bucketRows.length,
            )
          : null,
      attempts: bucketRows.length,
    });
  }

  return points;
}

export function buildRetryImprovement(
  firstAttempts: FirstAttemptRow[],
  retries: RetryAttemptRow[],
  startMs: number,
  endMs: number,
): ActivityRetryImprovement {
  const firstByQuestion = new Map(firstAttempts.map((row) => [row.question_id, row]));
  const cohort = new Map<string, { firstCorrect: boolean; latestRetryCorrect: boolean }>();

  for (const retry of retries) {
    const first = firstByQuestion.get(retry.question_id);
    if (!first) continue;
    if (new Date(retry.attempted_at).getTime() <= new Date(first.attempted_at).getTime()) continue;
    if (startMs > 0 && !isWithinMs(retry.attempted_at, startMs, endMs)) continue;

    const existing = cohort.get(retry.question_id);
    if (!existing) {
      cohort.set(retry.question_id, {
        firstCorrect: first.is_correct,
        latestRetryCorrect: retry.is_correct,
      });
      continue;
    }
    existing.latestRetryCorrect = retry.is_correct;
  }

  const entries = [...cohort.values()];
  if (entries.length < ACTIVITY_MIN_RETRY_COHORT) {
    return {
      locked: true,
      cohort_size: entries.length,
      first_attempt_accuracy_percent: 0,
      after_retry_accuracy_percent: 0,
      improvement_points: 0,
      mistakes_corrected: 0,
    };
  }

  const firstCorrect = entries.filter((entry) => entry.firstCorrect).length;
  const retryCorrect = entries.filter((entry) => entry.latestRetryCorrect).length;
  const firstAccuracy = calcAccuracyPercent(firstCorrect, entries.length);
  const retryAccuracy = calcAccuracyPercent(retryCorrect, entries.length);
  const mistakesCorrected = entries.filter(
    (entry) => !entry.firstCorrect && entry.latestRetryCorrect,
  ).length;

  return {
    locked: false,
    cohort_size: entries.length,
    first_attempt_accuracy_percent: firstAccuracy,
    after_retry_accuracy_percent: retryAccuracy,
    improvement_points: Math.round((retryAccuracy - firstAccuracy) * 10) / 10,
    mistakes_corrected: mistakesCorrected,
  };
}

export function calcLongestStreakDays(dateKeys: string[]): number {
  if (dateKeys.length === 0) return 0;
  const unique = [...new Set(dateKeys)].sort();
  let longest = 1;
  let current = 1;

  for (let index = 1; index < unique.length; index += 1) {
    const prev = new Date(`${unique[index - 1]!}T12:00:00Z`).getTime();
    const currentDay = new Date(`${unique[index]!}T12:00:00Z`).getTime();
    if (Math.round((currentDay - prev) / 86_400_000) === 1) {
      current += 1;
      longest = Math.max(longest, current);
    } else {
      current = 1;
    }
  }

  return longest;
}

export function buildTimeConsistency(
  periodRows: FirstAttemptRow[],
  allRows: FirstAttemptRow[],
  period: ActivityPeriodDays,
  now = new Date(),
): ActivityTimeConsistency {
  const timedRows = periodRows.filter((row) => isValidDuration(row.time_taken_seconds));
  const totalStudySeconds = timedRows.reduce((sum, row) => sum + row.time_taken_seconds!, 0);
  const activeDays = new Set(periodRows.map((row) => istDateKey(row.attempted_at))).size;
  const allDateKeys = allRows.map((row) => istDateKey(row.attempted_at));

  const dailyMinutes =
    period === 30 || period === 90
      ? buildWeeklyMinutePoints(periodRows, period, now)
      : buildDailyMinutePoints(periodRows, period === 'all' ? 30 : period, now);

  return {
    total_study_seconds: totalStudySeconds,
    has_recorded_time: timedRows.length > 0,
    active_days: activeDays,
    current_streak_days: calcStreakDays(allDateKeys),
    longest_streak_days: calcLongestStreakDays(allDateKeys),
    daily_minutes: dailyMinutes,
  };
}

function buildDailyMinutePoints(rows: FirstAttemptRow[], dayCount: number, now: Date) {
  const formatter = new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: IST });
  const istNow = new Date(now.toLocaleString('en-US', { timeZone: IST }));

  return Array.from({ length: dayCount }, (_, offset) => {
    const index = dayCount - 1 - offset;
    const date = new Date(istNow);
    date.setDate(istNow.getDate() - index);
    const key = istDateKey(date.toISOString());
    const dayRows = rows.filter((row) => istDateKey(row.attempted_at) === key);
    const seconds = dayRows
      .filter((row) => isValidDuration(row.time_taken_seconds))
      .reduce((sum, row) => sum + row.time_taken_seconds!, 0);
    return {
      key,
      label: formatter.format(date),
      minutes: Math.round(seconds / 60),
    };
  });
}

function buildWeeklyMinutePoints(rows: FirstAttemptRow[], period: 30 | 90, now: Date) {
  const bucketCount = period === 30 ? 6 : 13;
  const bucketSize = Math.ceil(period / bucketCount);
  const endMs = now.getTime();
  const startMs = endMs - period * 86_400_000;

  return Array.from({ length: bucketCount }, (_, index) => {
    const bucketStart = startMs + index * bucketSize * 86_400_000;
    const bucketEnd = Math.min(endMs, bucketStart + bucketSize * 86_400_000);
    const bucketRows = rows.filter((row) => {
      const ts = new Date(row.attempted_at).getTime();
      return ts >= bucketStart && ts < bucketEnd;
    });
    const seconds = bucketRows
      .filter((row) => isValidDuration(row.time_taken_seconds))
      .reduce((sum, row) => sum + row.time_taken_seconds!, 0);
    return {
      key: `w${index}`,
      label: `W${index + 1}`,
      minutes: Math.round(seconds / 60),
    };
  });
}

function normalizeDifficultyBucket(raw: string | null | undefined): string | null {
  const value = String(raw ?? '')
    .trim()
    .toLowerCase();
  if (!value) return null;
  if (value === 'basic' || value === 'easy' || value === 'foundation') return 'basic';
  if (value === 'intermediate' || value === 'medium' || value === 'standard') return 'intermediate';
  if (value === 'advanced' || value === 'hard') return 'advanced';
  if (value === 'pyq') return 'pyq';
  return null;
}

const DIFFICULTY_LABELS: Record<string, { en: string; hi: string }> = {
  basic: { en: 'Basic', hi: 'बुनियादी' },
  intermediate: { en: 'Intermediate', hi: 'मध्यम' },
  advanced: { en: 'Advanced', hi: 'उन्नत' },
  pyq: { en: 'PYQ', hi: 'PYQ' },
};

export function buildPracticeMix(rows: FirstAttemptRow[]): ActivityPracticeMix {
  const difficultyCounts = new Map<string, number>();
  const subjectCounts = new Map<string, { count: number; label: string }>();

  for (const row of rows) {
    const bucket = normalizeDifficultyBucket(row.difficulty ?? null);
    if (bucket) {
      difficultyCounts.set(bucket, (difficultyCounts.get(bucket) ?? 0) + 1);
    }
    if (row.subject_id) {
      const label = row.subject_title_en?.trim() || 'Subject';
      const existing = subjectCounts.get(row.subject_id);
      if (!existing) subjectCounts.set(row.subject_id, { count: 1, label });
      else existing.count += 1;
    }
  }

  const totalDifficulty = [...difficultyCounts.values()].reduce((sum, count) => sum + count, 0);
  const totalSubjects = [...subjectCounts.values()].reduce((sum, item) => sum + item.count, 0);

  const toRows = (
    counts: Map<string, number>,
    total: number,
    labels: Record<string, { en: string; hi: string }>,
  ): ActivityMixRow[] =>
    [...counts.entries()]
      .map(([key, count]) => ({
        key,
        label_en: labels[key]?.en ?? key,
        label_hi: labels[key]?.hi ?? key,
        count,
        percent: total > 0 ? clampPercent(Math.round((count * 1000) / total) / 10) : 0,
      }))
      .sort((a, b) => b.count - a.count);

  return {
    difficulty: toRows(difficultyCounts, totalDifficulty, DIFFICULTY_LABELS),
    subjects: [...subjectCounts.entries()]
      .map(([key, value]) => ({
        key,
        label_en: value.label,
        label_hi: value.label,
        count: value.count,
        percent: totalSubjects > 0 ? clampPercent(Math.round((value.count * 1000) / totalSubjects) / 10) : 0,
      }))
      .sort((a, b) => b.count - a.count),
    exam_tags_omitted: true,
  };
}

export function buildRecentActivity(
  rows: FirstAttemptRow[],
  limit = 5,
): ActivityRecentItem[] {
  const groups = new Map<
    string,
    ActivityRecentItem & { sortTs: number }
  >();

  for (const row of rows) {
    const title = row.topic_title?.trim() || 'Practice';
    const dayKey = istDateKey(row.attempted_at);
    const key = `${row.topic_id ?? 'unknown'}:${dayKey}`;
    const href =
      row.subject_slug && row.topic_slug
        ? `/subjects/${row.subject_slug}/${row.topic_slug}/practice`
        : null;
    const ts = new Date(row.attempted_at).getTime();
    const existing = groups.get(key);

    if (!existing) {
      groups.set(key, {
        title,
        correct: row.is_correct ? 1 : 0,
        total: 1,
        accuracy_percent: row.is_correct ? 100 : 0,
        duration_seconds: isValidDuration(row.time_taken_seconds) ? row.time_taken_seconds : null,
        created_at: row.attempted_at,
        href,
        action: row.is_correct ? 'view' : 'review',
        sortTs: ts,
      });
      continue;
    }

    existing.total += 1;
    if (row.is_correct) existing.correct += 1;
    existing.accuracy_percent = calcAccuracyPercent(existing.correct, existing.total);
    if (isValidDuration(row.time_taken_seconds)) {
      existing.duration_seconds = (existing.duration_seconds ?? 0) + row.time_taken_seconds!;
    }
    if (ts > existing.sortTs) {
      existing.created_at = row.attempted_at;
      existing.sortTs = ts;
    }
    existing.action = existing.accuracy_percent >= 70 ? 'view' : 'review';
  }

  return [...groups.values()]
    .sort((a, b) => b.sortTs - a.sortTs)
    .slice(0, limit)
    .map(({ sortTs: _sortTs, ...item }) => item);
}

export function buildProfileActivityData(input: {
  period: ActivityPeriodDays;
  firstAttempts: FirstAttemptRow[];
  retries: RetryAttemptRow[];
  now?: Date;
}): ProfileActivityData {
  const now = input.now ?? new Date();
  const { startMs, endMs, previousStartMs, previousEndMs } = getPeriodWindow(input.period, now);
  const periodRows =
    input.period === 'all'
      ? input.firstAttempts
      : filterFirstAttemptsInPeriod(input.firstAttempts, startMs, endMs);
  const previousRows =
    input.period === 'all'
      ? []
      : filterFirstAttemptsInPeriod(input.firstAttempts, previousStartMs, previousEndMs);

  return {
    period: input.period,
    has_genuine_sessions: false as const,
    summary: buildSummaryMetrics(periodRows),
    accuracy_trend: buildAccuracyTrend(periodRows, previousRows, input.period, now),
    retry_improvement: buildRetryImprovement(
      input.firstAttempts,
      input.retries,
      input.period === 'all' ? 0 : startMs,
      endMs,
    ),
    time_consistency: buildTimeConsistency(
      periodRows,
      input.firstAttempts,
      input.period,
      now,
    ),
    practice_mix: buildPracticeMix(periodRows),
    recent_activity: buildRecentActivity(periodRows, 5),
    has_any_attempts: input.firstAttempts.length > 0,
  };
}

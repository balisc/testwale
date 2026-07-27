import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ACTIVITY_MAX_ANSWER_SECONDS,
  ACTIVITY_MIN_RETRY_COHORT,
  buildAccuracyTrend,
  buildPracticeMix,
  buildProfileActivityData,
  buildRecentActivity,
  buildRetryImprovement,
  buildSummaryMetrics,
  buildTimeConsistency,
  filterFirstAttemptsInPeriod,
  formatAverageAnswerTime,
  getPeriodWindow,
  isValidDuration,
  parseActivityPeriod,
  type FirstAttemptRow,
  type RetryAttemptRow,
} from './profileActivityCore.ts';

const baseRow = (overrides: Partial<FirstAttemptRow> = {}): FirstAttemptRow => ({
  question_id: 'q1',
  is_correct: true,
  attempted_at: '2026-07-18T10:00:00.000Z',
  time_taken_seconds: 45,
  subject_id: 's1',
  topic_id: 't1',
  topic_title: 'Topic A',
  topic_slug: 'topic-a',
  subject_slug: 'subject-a',
  difficulty: 'basic',
  subject_title_en: 'Subject A',
  ...overrides,
});

test('parseActivityPeriod validates and defaults safely', () => {
  assert.equal(parseActivityPeriod('7'), 7);
  assert.equal(parseActivityPeriod('30'), 30);
  assert.equal(parseActivityPeriod('90'), 90);
  assert.equal(parseActivityPeriod('all'), 'all');
  assert.equal(parseActivityPeriod('invalid'), 7);
  assert.equal(parseActivityPeriod(null), 7);
});

test('getPeriodWindow uses equal-length previous period', () => {
  const now = new Date('2026-07-18T12:00:00.000Z');
  const window = getPeriodWindow(7, now);
  assert.equal(window.endMs - window.startMs, 7 * 86_400_000);
  assert.equal(window.previousEndMs, window.startMs);
  assert.equal(window.previousEndMs - window.previousStartMs, 7 * 86_400_000);
});

test('buildSummaryMetrics reconciles correct + incorrect = unique', () => {
  const summary = buildSummaryMetrics([
    baseRow({ question_id: 'q1', is_correct: true }),
    baseRow({ question_id: 'q2', is_correct: false }),
    baseRow({ question_id: 'q3', is_correct: true }),
  ]);
  assert.equal(summary.unique_questions, 3);
  assert.equal(summary.correct, 2);
  assert.equal(summary.incorrect, 1);
  assert.equal(summary.correct + summary.incorrect, summary.unique_questions);
});

test('retries do not inflate first-attempt summary metrics', () => {
  const firstAttempts = [baseRow({ question_id: 'q1' })];
  const summary = buildSummaryMetrics(firstAttempts);
  assert.equal(summary.unique_questions, 1);
  const payload = buildProfileActivityData({
    period: 7,
    firstAttempts,
    retries: [
      {
        question_id: 'q1',
        is_correct: true,
        attempted_at: '2026-07-19T10:00:00.000Z',
        time_spent_seconds: 30,
      },
    ],
    now: new Date('2026-07-20T12:00:00.000Z'),
  });
  assert.equal(payload.summary.unique_questions, 1);
});

test('isValidDuration rejects missing and corrupted values', () => {
  assert.equal(isValidDuration(null), false);
  assert.equal(isValidDuration(0), false);
  assert.equal(isValidDuration(-5), false);
  assert.equal(isValidDuration(ACTIVITY_MAX_ANSWER_SECONDS + 1), false);
  assert.equal(isValidDuration(47), true);
});

test('formatAverageAnswerTime shows not recorded for missing data', () => {
  assert.equal(formatAverageAnswerTime(null, 'Not recorded'), 'Not recorded');
  assert.equal(formatAverageAnswerTime(47, 'Not recorded'), '47 sec');
});

test('buildAccuracyTrend compares percentage points not relative percent', () => {
  const now = new Date('2026-07-18T12:00:00.000Z');
  const current = [
    baseRow({ attempted_at: '2026-07-17T10:00:00.000Z', is_correct: true }),
    baseRow({ question_id: 'q2', attempted_at: '2026-07-17T11:00:00.000Z', is_correct: true }),
    baseRow({ question_id: 'q3', attempted_at: '2026-07-17T12:00:00.000Z', is_correct: false }),
    baseRow({ question_id: 'q4', attempted_at: '2026-07-17T13:00:00.000Z', is_correct: false }),
  ];
  const previous = [
    baseRow({ attempted_at: '2026-07-10T10:00:00.000Z', is_correct: true }),
    baseRow({ question_id: 'q2', attempted_at: '2026-07-10T11:00:00.000Z', is_correct: false }),
  ];
  const trend = buildAccuracyTrend(current, previous, 7, now);
  assert.equal(trend.current_accuracy_percent, 50);
  assert.equal(trend.change_points, 0);
});

test('accuracy trend handles zero attempts without NaN', () => {
  const trend = buildAccuracyTrend([], [], 7, new Date('2026-07-18T12:00:00.000Z'));
  assert.equal(Number.isNaN(trend.current_accuracy_percent), false);
  assert.equal(trend.current_accuracy_percent, 0);
});

test('buildRetryImprovement uses paired cohort and latest retry only', () => {
  const firstAttempts = [
    baseRow({ question_id: 'q1', is_correct: false, attempted_at: '2026-07-01T10:00:00.000Z' }),
    baseRow({ question_id: 'q2', is_correct: false, attempted_at: '2026-07-01T10:00:00.000Z' }),
    baseRow({ question_id: 'q3', is_correct: true, attempted_at: '2026-07-01T10:00:00.000Z' }),
    baseRow({ question_id: 'q4', is_correct: false, attempted_at: '2026-07-01T10:00:00.000Z' }),
    baseRow({ question_id: 'q5', is_correct: false, attempted_at: '2026-07-01T10:00:00.000Z' }),
  ];
  const retries: RetryAttemptRow[] = [
    { question_id: 'q1', is_correct: false, attempted_at: '2026-07-02T10:00:00.000Z', time_spent_seconds: 20 },
    { question_id: 'q1', is_correct: true, attempted_at: '2026-07-03T10:00:00.000Z', time_spent_seconds: 20 },
    { question_id: 'q2', is_correct: true, attempted_at: '2026-07-02T10:00:00.000Z', time_spent_seconds: 20 },
    { question_id: 'q3', is_correct: false, attempted_at: '2026-07-02T10:00:00.000Z', time_spent_seconds: 20 },
    { question_id: 'q4', is_correct: true, attempted_at: '2026-07-02T10:00:00.000Z', time_spent_seconds: 20 },
    { question_id: 'q5', is_correct: true, attempted_at: '2026-07-02T10:00:00.000Z', time_spent_seconds: 20 },
  ];
  const result = buildRetryImprovement(firstAttempts, retries, 0, Date.now());
  assert.equal(result.locked, false);
  assert.equal(result.cohort_size, 5);
  assert.equal(result.first_attempt_accuracy_percent, 20);
  assert.equal(result.after_retry_accuracy_percent, 80);
  assert.equal(result.improvement_points, 60);
  assert.equal(result.mistakes_corrected, 4);
});

test('buildRetryImprovement locks when cohort below minimum', () => {
  const firstAttempts = [baseRow({ question_id: 'q1', is_correct: false, attempted_at: '2026-07-01T10:00:00.000Z' })];
  const retries: RetryAttemptRow[] = [
    { question_id: 'q1', is_correct: true, attempted_at: '2026-07-02T10:00:00.000Z', time_spent_seconds: 20 },
  ];
  const result = buildRetryImprovement(firstAttempts, retries, 0, Date.now());
  assert.equal(result.locked, true);
  assert.equal(result.cohort_size, 1);
  assert.ok(result.cohort_size < ACTIVITY_MIN_RETRY_COHORT);
});

test('buildRetryImprovement ignores retries before first attempt', () => {
  const firstAttempts = [baseRow({ question_id: 'q1', is_correct: false, attempted_at: '2026-07-05T10:00:00.000Z' })];
  const retries: RetryAttemptRow[] = [
    { question_id: 'q1', is_correct: true, attempted_at: '2026-07-04T10:00:00.000Z', time_spent_seconds: 20 },
  ];
  const result = buildRetryImprovement(firstAttempts, retries, 0, Date.now());
  assert.equal(result.locked, true);
  assert.equal(result.cohort_size, 0);
});

test('buildTimeConsistency reuses canonical streak and active days', () => {
  const now = new Date();
  const yesterday = new Date(now.getTime() - 86_400_000);
  const twoDaysAgo = new Date(now.getTime() - 2 * 86_400_000);
  const rows = [
    baseRow({ attempted_at: twoDaysAgo.toISOString(), time_taken_seconds: 60 }),
    baseRow({ question_id: 'q2', attempted_at: yesterday.toISOString(), time_taken_seconds: 120 }),
    baseRow({ question_id: 'q3', attempted_at: yesterday.toISOString(), time_taken_seconds: 90 }),
  ];
  const result = buildTimeConsistency(rows, rows, 7, now);
  assert.equal(result.active_days, 2);
  assert.ok(result.current_streak_days >= 1);
  assert.ok(result.longest_streak_days >= 1);
  assert.equal(result.has_recorded_time, true);
  assert.equal(result.total_study_seconds, 270);
});

test('buildPracticeMix difficulty distribution reconciles to denominator', () => {
  const mix = buildPracticeMix([
    baseRow({ difficulty: 'basic' }),
    baseRow({ question_id: 'q2', difficulty: 'basic' }),
    baseRow({ question_id: 'q3', difficulty: 'advanced' }),
  ]);
  assert.equal(mix.exam_tags_omitted, true);
  const totalPercent = mix.difficulty.reduce((sum, row) => sum + row.percent, 0);
  assert.ok(totalPercent >= 99 && totalPercent <= 101);
});

test('buildRecentActivity groups by topic and day without fake sessions', () => {
  const items = buildRecentActivity([
    baseRow({ attempted_at: '2026-07-18T10:00:00.000Z', is_correct: true }),
    baseRow({ question_id: 'q2', attempted_at: '2026-07-18T11:00:00.000Z', is_correct: false }),
    baseRow({ question_id: 'q3', attempted_at: '2026-07-17T10:00:00.000Z', is_correct: true }),
  ]);
  assert.equal(items.length, 2);
  assert.equal(items[0]?.total, 2);
  assert.equal(items[0]?.correct, 1);
  assert.equal(items[0]?.href, '/subjects/subject-a/topic-a/practice');
});

test('filterFirstAttemptsInPeriod respects half-open window', () => {
  const now = new Date('2026-07-18T12:00:00.000Z');
  const { startMs, endMs } = getPeriodWindow(7, now);
  const rows = [
    baseRow({ attempted_at: new Date(startMs).toISOString() }),
    baseRow({ question_id: 'q-old', attempted_at: new Date(startMs - 1000).toISOString() }),
  ];
  const filtered = filterFirstAttemptsInPeriod(rows, startMs, endMs);
  assert.equal(filtered.length, 1);
});

test('buildProfileActivityData marks no genuine sessions', () => {
  const payload = buildProfileActivityData({ period: 7, firstAttempts: [], retries: [] });
  assert.equal(payload.has_genuine_sessions, false);
  assert.equal(payload.has_any_attempts, false);
});

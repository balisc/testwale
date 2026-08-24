import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildOverviewMetricsFromAttempts,
  buildReadinessBreakdown,
  calcAccuracyPercent,
  calcProfileCompletionPercent,
  calcStreakDays,
  groupRecentActivity,
  maskEmail,
  pickContinuePracticeHref,
  READINESS_MIN_UNIQUE_QUESTIONS,
} from './profileOverviewCore.ts';

test('maskEmail masks local part and keeps domain', () => {
  assert.equal(maskEmail('bali@gmail.com'), 'ba••••@gmail.com');
  assert.equal(maskEmail('a@x.co'), 'a••••@x.co');
});

test('calcProfileCompletionPercent counts editable fields only', () => {
  assert.equal(
    calcProfileCompletionPercent({
      bio: null,
      country: null,
      state: null,
      city: null,
      target_exam: null,
      exam_date: null,
    }),
    0,
  );
  assert.equal(
    calcProfileCompletionPercent({
      bio: 'Hello',
      country: 'India',
      state: null,
      city: null,
      target_exam: 'SSC CGL',
      exam_date: '2026-08-15',
    }),
    67,
  );
});

test('buildOverviewMetricsFromAttempts uses unique first attempts only', () => {
  const rows = [
    {
      question_id: 'q1',
      is_correct: true,
      attempted_at: '2026-07-27T06:00:00.000Z',
      time_taken_seconds: 60,
      subject_id: null,
      topic_id: null,
      subtopic_id: null,
    },
    {
      question_id: 'q2',
      is_correct: false,
      attempted_at: '2026-07-27T07:00:00.000Z',
      time_taken_seconds: 90,
      subject_id: null,
      topic_id: null,
      subtopic_id: null,
    },
  ];
  const metrics = buildOverviewMetricsFromAttempts(rows);
  assert.equal(metrics.questions, 2);
  assert.equal(metrics.accuracy_percent, 50);
  assert.equal(metrics.study_time_seconds, 150);
});

test('calcAccuracyPercent handles divide by zero', () => {
  assert.equal(calcAccuracyPercent(0, 0), 0);
  assert.equal(calcAccuracyPercent(3, 0), 0);
});

test('buildReadinessBreakdown locks below minimum unique questions', () => {
  const locked = buildReadinessBreakdown(READINESS_MIN_UNIQUE_QUESTIONS - 1, 80, 5);
  assert.equal(locked.locked, true);
  assert.equal(locked.overall, 0);

  const unlocked = buildReadinessBreakdown(READINESS_MIN_UNIQUE_QUESTIONS, 80, 5);
  assert.equal(unlocked.locked, false);
  assert.ok(unlocked.overall > 0);
  assert.ok(unlocked.coverage <= 100);
  assert.ok(unlocked.accuracy <= 100);
  assert.ok(unlocked.consistency <= 100);
});

test('calcStreakDays returns zero for empty activity', () => {
  assert.equal(calcStreakDays([]), 0);
});

test('pickContinuePracticeHref prefers recent topic then weakness then subjects', () => {
  assert.equal(pickContinuePracticeHref({ weaknesses: [] }), '/subjects');

  assert.equal(
    pickContinuePracticeHref({
      recent_attempts: [
        {
          is_correct: true,
          attempted_at: '2026-07-27T06:00:00.000Z',
          topic_title: { en: 'Polity' },
          topic_slug: 'fundamental-rights',
          subject_slug: 'indian-polity',
        },
      ],
      weaknesses: [],
    }),
    '/subjects/indian-polity/fundamental-rights/practice',
  );
});

test('groupRecentActivity groups by topic and limits rows', () => {
  const grouped = groupRecentActivity(
    [
      {
        is_correct: true,
        attempted_at: '2026-07-27T08:00:00.000Z',
        topic_title: { en: 'British Rule Acts' },
        topic_slug: 'british-rule',
        subject_slug: 'history',
      },
      {
        is_correct: false,
        attempted_at: '2026-07-27T07:00:00.000Z',
        topic_title: { en: 'British Rule Acts' },
        topic_slug: 'british-rule',
        subject_slug: 'history',
      },
    ],
    2,
  );
  assert.equal(grouped.length, 1);
  assert.equal(grouped[0]?.correct, 1);
  assert.equal(grouped[0]?.total, 2);
});

import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildCoverageSummary,
  buildDifficultyInsights,
  calcTopicProgressPercent,
  classifyTopicStatus,
  INSIGHTS_MIN_FOCUS_SAMPLE,
  INSIGHTS_MIN_SAMPLE,
  INSIGHTS_STRONG_ACCURACY,
  normalizeDifficultyBucket,
  pickFocusNext,
  pickStrongArea,
} from './profileInsightsCore.ts';

test('buildCoverageSummary reconciles topic counts', () => {
  const summary = buildCoverageSummary([
    { uniqueAttempted: 10, totalQuestions: 10 },
    { uniqueAttempted: 3, totalQuestions: 10 },
    { uniqueAttempted: 0, totalQuestions: 8 },
  ]);
  assert.equal(summary.total, 3);
  assert.equal(summary.completed, 1);
  assert.equal(summary.in_progress, 1);
  assert.equal(summary.not_started, 1);
  assert.equal(summary.completed + summary.in_progress + summary.not_started, summary.total);
});

test('calcTopicProgressPercent handles zero denominator safely', () => {
  assert.equal(calcTopicProgressPercent(0, 0), 0);
  assert.equal(calcTopicProgressPercent(2, 0), 100);
  assert.equal(calcTopicProgressPercent(2, 10), 20);
});

test('classifyTopicStatus follows canonical buckets', () => {
  assert.equal(classifyTopicStatus(0, 0), 'not_started');
  assert.equal(classifyTopicStatus(2, 40), 'in_progress');
  assert.equal(classifyTopicStatus(10, 100), 'completed');
});

test('pickStrongArea requires minimum sample and accuracy threshold', () => {
  assert.equal(
    pickStrongArea([
      {
        topic_id: 't1',
        subject_id: 's1',
        topic_title: { en: 'Topic' },
        topic_slug: 'topic',
        subject_slug: 'subject',
        unique_questions_count: INSIGHTS_MIN_SAMPLE - 1,
        accuracy_percent: 90,
        wrong_count: 1,
      },
    ]),
    null,
  );

  const strong = pickStrongArea([
    {
      topic_id: 't1',
      subject_id: 's1',
      topic_title: { en: 'Strong Topic' },
      topic_slug: 'strong-topic',
      subject_slug: 'indian-polity',
      unique_questions_count: INSIGHTS_MIN_SAMPLE,
      accuracy_percent: INSIGHTS_STRONG_ACCURACY,
      wrong_count: 2,
    },
  ]);
  assert.ok(strong);
  assert.equal(strong?.practice_href, '/subjects/indian-polity/strong-topic/practice');
});

test('pickFocusNext prefers topics with mistakes and low accuracy', () => {
  const focus = pickFocusNext([
    {
      topic_id: 't1',
      subject_id: 's1',
      topic_title: { en: 'Weak Topic' },
      topic_slug: 'weak-topic',
      subject_slug: 'history',
      unique_questions_count: INSIGHTS_MIN_FOCUS_SAMPLE,
      accuracy_percent: 40,
      wrong_count: 3,
    },
    {
      topic_id: 't2',
      subject_id: 's1',
      topic_title: { en: 'Other' },
      topic_slug: 'other',
      subject_slug: 'history',
      unique_questions_count: 20,
      accuracy_percent: 90,
      wrong_count: 1,
    },
  ]);
  assert.ok(focus);
  assert.equal(focus?.topic_slug, 'weak-topic');
  assert.equal(focus?.mistakes_due, 3);
});

test('buildDifficultyInsights uses first-attempt rows only and hides unstable percentages', () => {
  const rows = buildDifficultyInsights([
    { is_correct: true, difficulty: 'easy' },
    { is_correct: false, difficulty: 'medium' },
    { is_correct: true, difficulty: 'hard' },
    { is_correct: false, difficulty: 'hard' },
    { is_correct: true, difficulty: 'hard' },
    { is_correct: true, difficulty: 'hard' },
    { is_correct: false, difficulty: 'hard' },
  ]);

  const basic = rows.find((row) => row.key === 'basic');
  const advanced = rows.find((row) => row.key === 'advanced');
  assert.equal(basic?.insufficient_data, true);
  assert.equal(advanced?.insufficient_data, false);
  assert.equal(advanced?.accuracy_percent, 60);
});

test('normalizeDifficultyBucket maps legacy values', () => {
  assert.equal(normalizeDifficultyBucket('easy'), 'basic');
  assert.equal(normalizeDifficultyBucket('medium'), 'intermediate');
  assert.equal(normalizeDifficultyBucket('hard'), 'advanced');
  assert.equal(normalizeDifficultyBucket('PYQ'), null);
});

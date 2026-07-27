import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ACHIEVEMENT_ACCURACY_MIN_SAMPLE,
  ACHIEVEMENT_STREAK_THRESHOLD,
  ACHIEVEMENT_UNIQUE_THRESHOLDS,
  buildDerivedAchievements,
  buildGoalRows,
  buildProfileGoalsData,
  calcGoalPercent,
  countUniqueFirstAttemptsInPeriod,
  getMonthStartIst,
  getWeekStartIst,
  pickNextMilestone,
  validateGoalPatch,
  validateGoalValue,
  type GoalAttemptRow,
} from './profileGoalsCore.ts';

const attempt = (iso: string, id = 'q1'): GoalAttemptRow => ({
  question_id: id,
  attempted_at: iso,
  is_correct: true,
});

test('validateGoalValue rejects invalid goal numbers', () => {
  assert.equal(validateGoalValue(-1, 'daily').ok, false);
  assert.equal(validateGoalValue(1.5, 'daily').ok, false);
  assert.equal(validateGoalValue(501, 'daily').ok, false);
  assert.equal(validateGoalValue(20, 'daily').ok, true);
});

test('validateGoalPatch accepts partial valid patches', () => {
  const result = validateGoalPatch({ daily_goal: 25 });
  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.patch.daily_goal, 25);
});

test('countUniqueFirstAttemptsInPeriod uses IST daily boundary', () => {
  const now = new Date('2026-07-27T12:00:00.000Z');
  const rows = [
    attempt('2026-07-27T04:00:00.000Z', 'q1'),
    attempt('2026-07-26T04:00:00.000Z', 'q2'),
  ];
  assert.equal(countUniqueFirstAttemptsInPeriod(rows, 'daily', now), 1);
});

test('weekly goal uses Monday-start IST week', () => {
  const now = new Date('2026-07-27T12:00:00.000Z');
  const weekStart = getWeekStartIst(now);
  assert.equal(weekStart.getDay(), 1);
  const rows = [
    attempt(weekStart.toISOString(), 'q1'),
    attempt('2026-07-20T04:00:00.000Z', 'q2'),
  ];
  assert.equal(countUniqueFirstAttemptsInPeriod(rows, 'weekly', now), 1);
});

test('monthly goal counts from IST month start', () => {
  const now = new Date('2026-07-27T12:00:00.000Z');
  const monthStart = getMonthStartIst(now);
  const rows = [
    attempt(monthStart.toISOString(), 'q1'),
    attempt('2026-06-28T04:00:00.000Z', 'q2'),
  ];
  assert.equal(countUniqueFirstAttemptsInPeriod(rows, 'monthly', now), 1);
});

test('future attempts are excluded from goal progress', () => {
  const now = new Date('2026-07-27T12:00:00.000Z');
  const rows = [attempt('2026-07-28T12:00:00.000Z')];
  assert.equal(countUniqueFirstAttemptsInPeriod(rows, 'daily', now), 0);
});

test('calcGoalPercent caps visual percent at 100', () => {
  assert.equal(calcGoalPercent(24, 20), 100);
  assert.equal(calcGoalPercent(0, 0), 0);
});

test('buildGoalRows preserves actual above target', () => {
  const rows = buildGoalRows({ daily: 20, weekly: 100, monthly: 400 }, { daily: 24, weekly: 50, monthly: 10 });
  assert.equal(rows[0]?.actual, 24);
  assert.equal(rows[0]?.percent, 100);
  assert.equal(rows[0]?.achieved, true);
});

test('buildDerivedAchievements requires minimum sample for accuracy badge', () => {
  const cards = buildDerivedAchievements({
    uniqueQuestions: ACHIEVEMENT_ACCURACY_MIN_SAMPLE - 1,
    streakDays: 0,
    accuracyPercent: 90,
    accuracySample: ACHIEVEMENT_ACCURACY_MIN_SAMPLE - 1,
  });
  const accuracy = cards.find((card) => card.id === 'accuracy_80');
  assert.equal(accuracy?.unlocked, false);
});

test('buildDerivedAchievements unlocks streak at canonical threshold', () => {
  const cards = buildDerivedAchievements({
    uniqueQuestions: 0,
    streakDays: ACHIEVEMENT_STREAK_THRESHOLD,
    accuracyPercent: 0,
    accuracySample: 0,
  });
  assert.equal(cards.find((card) => card.id === 'streak_7')?.unlocked, true);
});

test('pickNextMilestone returns next unique-question threshold', () => {
  const next = pickNextMilestone(120);
  assert.ok(next);
  assert.match(next!.en, /250/);
});

test('pickNextMilestone returns null when all thresholds complete', () => {
  assert.equal(pickNextMilestone(ACHIEVEMENT_UNIQUE_THRESHOLDS.at(-1)! + 1), null);
});

test('buildProfileGoalsData reuses readiness and omits exam date', () => {
  const data = buildProfileGoalsData({
    targets: { daily_goal: 20, weekly_goal: 100, monthly_goal: 400 },
    attempts: Array.from({ length: 12 }, (_, index) => ({
      question_id: `q${index}`,
      attempted_at: '2026-07-27T06:00:00.000Z',
      is_correct: index < 9,
    })),
    targetExam: 'Custom Exam',
    isPremium: false,
    membershipAvailable: true,
    displayName: 'Student',
    email: 'student@example.com',
    joinedAt: '2026-07-01T00:00:00.000Z',
    now: new Date('2026-07-27T12:00:00.000Z'),
  });
  assert.equal(data.exam_target.exam_date_set, false);
  assert.equal(data.exam_target.days_remaining, null);
  assert.equal(data.readiness.locked, false);
  assert.ok(data.readiness.percent != null);
  assert.equal(data.peer_comparison.available, false);
  assert.equal(data.preferences.reminders_supported, false);
});

test('readiness locked when insufficient unique questions', () => {
  const data = buildProfileGoalsData({
    targets: { daily_goal: 20, weekly_goal: 100, monthly_goal: 400 },
    attempts: [{ question_id: 'q1', attempted_at: '2026-07-27T06:00:00.000Z', is_correct: true }],
    targetExam: null,
    isPremium: false,
    membershipAvailable: true,
    displayName: 'Student',
    email: 'student@example.com',
    joinedAt: '2026-07-01T00:00:00.000Z',
  });
  assert.equal(data.readiness.locked, true);
  assert.equal(data.readiness.percent, null);
});

test('membership unavailable is not shown as Free', () => {
  const data = buildProfileGoalsData({
    targets: { daily_goal: 20, weekly_goal: 100, monthly_goal: 400 },
    attempts: [],
    targetExam: null,
    isPremium: false,
    membershipAvailable: false,
    displayName: 'Student',
    email: 'student@example.com',
    joinedAt: '2026-07-01T00:00:00.000Z',
  });
  assert.equal(data.preferences.membership_label_en, 'Unavailable');
});

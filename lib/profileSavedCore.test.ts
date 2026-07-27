import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildMistakeRecovery,
  buildMistakesToReview,
  buildProfileSavedData,
  buildRecentSavedItems,
  buildRecoveryMaps,
  buildRevisionQueue,
  classifyMistakeStatus,
  countIncorrectAttempts,
  safeNotePreview,
  SAVED_MONTH_MISTAKE_DAYS,
  SAVED_RECENT_MISTAKE_DAYS,
  type SavedFirstAttemptRow,
  type SavedRetryRow,
} from './profileSavedCore.ts';

const baseFirst = (overrides: Partial<SavedFirstAttemptRow> = {}): SavedFirstAttemptRow => ({
  question_id: 'q1',
  is_correct: false,
  attempted_at: '2026-07-20T10:00:00.000Z',
  subject_id: 's1',
  topic_id: 't1',
  topic_title: 'Topic A',
  topic_slug: 'topic-a',
  subject_slug: 'subject-a',
  subject_title_en: 'Subject A',
  ...overrides,
});

test('buildMistakeRecovery counts each question once', () => {
  const firstAttempts = [
    baseFirst({ question_id: 'q1' }),
    baseFirst({ question_id: 'q2', is_correct: true }),
  ];
  const retries: SavedRetryRow[] = [
    { question_id: 'q1', is_correct: true, attempted_at: '2026-07-21T10:00:00.000Z' },
    { question_id: 'q1', is_correct: true, attempted_at: '2026-07-22T10:00:00.000Z' },
  ];
  const recovery = buildMistakeRecovery(firstAttempts, retries);
  assert.equal(recovery.total_mistakes, 1);
  assert.equal(recovery.recovered_count, 1);
  assert.equal(recovery.unresolved_count, 0);
  assert.equal(recovery.recovery_percent, 100);
});

test('retry before first attempt is ignored for recovery', () => {
  const firstAttempts = [baseFirst({ attempted_at: '2026-07-20T10:00:00.000Z' })];
  const retries: SavedRetryRow[] = [
    { question_id: 'q1', is_correct: true, attempted_at: '2026-07-19T10:00:00.000Z' },
  ];
  const { recovered } = buildRecoveryMaps(firstAttempts, retries);
  assert.equal(recovered.size, 0);
});

test('zero mistakes shows null recovery percent not 100%', () => {
  const recovery = buildMistakeRecovery(
    [baseFirst({ is_correct: true })],
    [],
  );
  assert.equal(recovery.recovery_percent, null);
  assert.equal(recovery.has_mistakes, false);
});

test('revision queue buckets do not overlap', () => {
  const now = new Date('2026-07-27T12:00:00.000Z');
  const unresolved = [
    baseFirst({ attempted_at: '2026-07-26T10:00:00.000Z' }),
    baseFirst({ question_id: 'q2', attempted_at: '2026-07-10T10:00:00.000Z' }),
    baseFirst({ question_id: 'q3', attempted_at: '2026-05-01T10:00:00.000Z' }),
  ];
  const queue = buildRevisionQueue(unresolved, now);
  const sum = queue.buckets.reduce((total, bucket) => total + bucket.count, 0);
  assert.equal(sum, unresolved.length);
  assert.equal(queue.total_actionable, unresolved.length);
  assert.equal(queue.has_revision_schedule, false);
});

test('revision queue uses recent and month boundaries', () => {
  const now = new Date('2026-07-27T12:00:00.000Z');
  const recentIso = new Date(now.getTime() - 3 * 86_400_000).toISOString();
  const monthIso = new Date(now.getTime() - 15 * 86_400_000).toISOString();
  const queue = buildRevisionQueue(
    [
      baseFirst({ attempted_at: recentIso }),
      baseFirst({ question_id: 'q2', attempted_at: monthIso }),
    ],
    now,
  );
  assert.equal(queue.buckets.find((bucket) => bucket.key === 'recent')?.count, 1);
  assert.equal(queue.buckets.find((bucket) => bucket.key === 'this_month')?.count, 1);
});

test('buildMistakesToReview excludes recovered mistakes', () => {
  const firstAttempts = [
    baseFirst({ question_id: 'q1' }),
    baseFirst({ question_id: 'q2', attempted_at: '2026-07-19T10:00:00.000Z' }),
  ];
  const retries: SavedRetryRow[] = [
    { question_id: 'q1', is_correct: true, attempted_at: '2026-07-21T10:00:00.000Z' },
  ];
  const { recovered } = buildRecoveryMaps(firstAttempts, retries);
  const rows = buildMistakesToReview(firstAttempts, retries, recovered);
  assert.equal(rows.length, 1);
  assert.equal(rows[0]?.question_id, 'q2');
});

test('countIncorrectAttempts includes first attempt as one incorrect', () => {
  const retries: SavedRetryRow[] = [
    { question_id: 'q1', is_correct: false, attempted_at: '2026-07-21T10:00:00.000Z' },
  ];
  assert.equal(countIncorrectAttempts('q1', retries, '2026-07-20T10:00:00.000Z'), 2);
});

test('classifyMistakeStatus prefers incorrect twice', () => {
  assert.equal(classifyMistakeStatus(new Date().toISOString(), 2), 'incorrect_twice');
});

test('safeNotePreview strips markup and truncates', () => {
  const preview = safeNotePreview('<b>Hello</b> ' + 'x'.repeat(100));
  assert.ok(!preview.includes('<b>'));
  assert.ok(preview.length <= 80);
});

test('buildRecentSavedItems sorts by timestamp descending', () => {
  const items = buildRecentSavedItems(
    [
      {
        id: 'b1',
        question_id: 'q1',
        created_at: '2026-07-20T10:00:00.000Z',
        topic_title: 'Topic',
        topic_slug: 'topic',
        subject_slug: 'subject',
      },
    ],
    [
      {
        id: 'n1',
        title: 'Note',
        note_text: 'Body',
        created_at: '2026-07-18T10:00:00.000Z',
        updated_at: '2026-07-25T10:00:00.000Z',
      },
    ],
    5,
    new Date('2026-07-27T12:00:00.000Z'),
  );
  assert.equal(items[0]?.type, 'note');
});

test('buildProfileSavedData keeps bookmarks and reports separate', () => {
  const payload = buildProfileSavedData({
    firstAttempts: [],
    retries: [],
    bookmarks: [{ id: 'b1', question_id: 'q1', created_at: new Date().toISOString() }],
    notes: [],
    reportedQuestions: 3,
  });
  assert.equal(payload.saved_learning.bookmarks, 1);
  assert.equal(payload.saved_learning.reported_questions, 3);
  assert.equal(payload.saved_learning.has_recently_viewed, false);
});

test('buildProfileSavedData marks caught up when all mistakes recovered', () => {
  const firstAttempts = [baseFirst()];
  const retries: SavedRetryRow[] = [
    { question_id: 'q1', is_correct: true, attempted_at: '2026-07-21T10:00:00.000Z' },
  ];
  const payload = buildProfileSavedData({
    firstAttempts,
    retries,
    bookmarks: [],
    notes: [],
    reportedQuestions: 0,
  });
  assert.equal(payload.caught_up, true);
  assert.equal(payload.all_mistakes_recovered, true);
});

test('mistake review href uses active slug practice route', () => {
  const rows = buildMistakesToReview(
    [baseFirst()],
    [],
    new Set(),
    4,
  );
  assert.equal(rows[0]?.review_href, '/subjects/subject-a/topic-a/practice');
});

test('constants define recent and month windows', () => {
  assert.equal(SAVED_RECENT_MISTAKE_DAYS, 7);
  assert.equal(SAVED_MONTH_MISTAKE_DAYS, 30);
});

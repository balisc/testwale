import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  getLegacyExplanation,
  resolveLegacyCorrectIndex,
  stripLegacyAnswerFields,
} from './legacyQuiz.ts';
import { getBroadMapRegionHint, haversineDistanceKm } from './mapPractice.ts';

test('legacy quiz payload stripping removes every answer-bearing field', () => {
  const result = stripLegacyAnswerFields({
    id: '1',
    question: 'Example?',
    options: ['A', 'B'],
    answer: 'A',
    correct_answer: 'A',
    correct_option: 'A',
    explanation: 'secret',
    explanation_text: 'secret',
  });
  assert.deepEqual(result, { id: '1', question: 'Example?', options: ['A', 'B'] });
});

test('legacy answer resolution handles letters, numbers, localized options and explanations', () => {
  const options = { en: ['One', 'Two'], hi: ['Ek', 'Do'] };
  assert.equal(resolveLegacyCorrectIndex('B', options, 'en'), 1);
  assert.equal(resolveLegacyCorrectIndex('2', options, 'hi'), 1);
  assert.equal(getLegacyExplanation({ en: 'Why', hi: 'Kyon' }, 'hi'), 'Kyon');
});

test('map scoring and public hint computation do not need client-side answer coordinates', () => {
  assert.ok(haversineDistanceKm(28.6139, 77.209, 28.6139, 77.209) < 0.001);
  assert.equal(
    getBroadMapRegionHint(28.6139, 77.209, 'india'),
    'Hint: The location is in the northern India belt.',
  );
});

test('consolidation migration revokes public answer and identity-bearing access', () => {
  const migration = readFileSync('scripts/migrate_security_hardening_20260828.sql', 'utf8');
  assert.match(migration, /revoke all privileges on table public\.%I from anon, authenticated/i);
  assert.match(migration, /revoke execute on function %s from public, anon, authenticated/i);
  assert.doesNotMatch(migration, /questionwale-practice-dev-v1/i);
});

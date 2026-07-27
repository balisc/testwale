import assert from 'node:assert/strict';
import test from 'node:test';
import { getExamCountdownParts, validateExamDateInput } from './examCountdown.ts';

test('getExamCountdownParts returns null for invalid date', () => {
  assert.equal(getExamCountdownParts('invalid'), null);
});

test('validateExamDateInput accepts ISO date strings', () => {
  assert.equal(validateExamDateInput('2099-01-01'), true);
  assert.equal(validateExamDateInput('bad'), false);
});

test('getExamCountdownParts marks expired dates', () => {
  const parts = getExamCountdownParts('2000-01-01', Date.now());
  assert.ok(parts);
  assert.equal(parts?.expired, true);
});

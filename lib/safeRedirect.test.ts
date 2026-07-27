import assert from 'node:assert/strict';
import test from 'node:test';
import { getSafeRedirectPath } from './safeRedirect.ts';

test('getSafeRedirectPath accepts internal paths', () => {
  assert.equal(getSafeRedirectPath('/dashboard', '/dashboard'), '/dashboard');
  assert.equal(getSafeRedirectPath('/subjects/indian-polity', '/dashboard'), '/subjects/indian-polity');
  assert.equal(getSafeRedirectPath('/profile', '/dashboard'), '/profile');
});

test('getSafeRedirectPath rejects open redirects', () => {
  assert.equal(getSafeRedirectPath('//evil.example', '/dashboard'), '/dashboard');
  assert.equal(getSafeRedirectPath('https://evil.example', '/dashboard'), '/dashboard');
  assert.equal(getSafeRedirectPath('/\\evil', '/dashboard'), '/dashboard');
  assert.equal(getSafeRedirectPath('%2F%2Fevil.example', '/dashboard'), '/dashboard');
  assert.equal(getSafeRedirectPath(null, '/dashboard'), '/dashboard');
  assert.equal(getSafeRedirectPath('', '/dashboard'), '/dashboard');
});

test('getSafeRedirectPath never returns token-bearing paths', () => {
  const malicious = '/login?access_token=TEST_REDACTED_TOKEN';
  const result = getSafeRedirectPath(malicious, '/dashboard');
  assert.equal(result.startsWith('/'), true);
  assert.equal(result.includes('://'), false);
});

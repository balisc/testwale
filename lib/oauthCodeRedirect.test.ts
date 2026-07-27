import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildOAuthCallbackForwardUrl,
  pathnameHasStrayOAuthParams,
} from './oauthCodeRedirect.ts';

test('pathnameHasStrayOAuthParams ignores /auth/callback', () => {
  const params = new URLSearchParams('code=test');
  assert.equal(pathnameHasStrayOAuthParams('/auth/callback', params), false);
});

test('pathnameHasStrayOAuthParams detects stray code on homepage', () => {
  const params = new URLSearchParams('code=test');
  assert.equal(pathnameHasStrayOAuthParams('/', params), true);
});

test('pathnameHasStrayOAuthParams detects oauth error without code', () => {
  const params = new URLSearchParams('error=access_denied');
  assert.equal(pathnameHasStrayOAuthParams('/login', params), true);
});

test('buildOAuthCallbackForwardUrl forwards homepage code to callback with next=/', () => {
  const params = new URLSearchParams('code=TEST_REDACTED');
  const target = buildOAuthCallbackForwardUrl('https://questionwale.com', '/', params);
  const url = new URL(target);
  assert.equal(url.pathname, '/auth/callback');
  assert.equal(url.searchParams.get('code'), 'TEST_REDACTED');
  assert.equal(url.searchParams.get('next'), '/');
});

test('buildOAuthCallbackForwardUrl preserves safe explicit next', () => {
  const params = new URLSearchParams('code=TEST_REDACTED&next=%2Fprofile');
  const target = buildOAuthCallbackForwardUrl('https://questionwale.com', '/', params);
  const url = new URL(target);
  assert.equal(url.searchParams.get('next'), '/profile');
});

test('buildOAuthCallbackForwardUrl rejects malicious next values', () => {
  const params = new URLSearchParams('code=TEST_REDACTED&next=//evil.example');
  const target = buildOAuthCallbackForwardUrl('https://questionwale.com', '/', params);
  const url = new URL(target);
  assert.equal(url.searchParams.get('next'), '/');
});

test('buildOAuthCallbackForwardUrl forwards oauth error to callback', () => {
  const params = new URLSearchParams('error=access_denied');
  const target = buildOAuthCallbackForwardUrl('http://localhost:3000', '/login', params);
  const url = new URL(target);
  assert.equal(url.searchParams.get('error'), 'access_denied');
  assert.equal(url.searchParams.has('code'), false);
});

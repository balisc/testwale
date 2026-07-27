import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  hashContainsSensitiveAuthKeys,
  SENSITIVE_AUTH_HASH_KEYS,
} from './authSensitiveHash.ts';
import { getSafeRedirectPath } from './safeRedirect.ts';

test('hashContainsSensitiveAuthKeys detects legacy implicit-flow fragments', () => {
  assert.equal(
    hashContainsSensitiveAuthKeys('#access_token=TEST_REDACTED_TOKEN&refresh_token=TEST_REDACTED_TOKEN'),
    true,
  );
  assert.equal(hashContainsSensitiveAuthKeys('#provider_token=TEST_REDACTED_TOKEN'), true);
  assert.equal(hashContainsSensitiveAuthKeys('#section=intro'), false);
  assert.equal(hashContainsSensitiveAuthKeys(''), false);
});

test('OAuth start route builds callback server-side with PKCE client', () => {
  const startRoute = readFileSync(
    join(process.cwd(), 'app/api/auth/google/start/route.ts'),
    'utf8',
  );
  assert.match(startRoute, /buildOAuthCallbackForRequest/);
  assert.match(startRoute, /signInWithOAuth/);
  assert.match(startRoute, /skipBrowserRedirect:\s*true/);
  assert.match(startRoute, /createSupabaseAuthExchangeClient/);
  assert.match(startRoute, /applyPendingSupabaseCookies/);
});

test('Google CTA delegates to secured server OAuth start route', () => {
  const source = readFileSync(join(process.cwd(), 'app/components/HomeGoogleCtaButton.tsx'), 'utf8');
  assert.match(source, /\/api\/auth\/google\/start/);
  assert.doesNotMatch(source, /signInWithOAuth/);
  assert.doesNotMatch(source, /getClientOAuthOrigin/);
});

test('auth callback route exchanges code server-side and avoids signup error query params', () => {
  const source = readFileSync(join(process.cwd(), 'app/auth/callback/route.ts'), 'utf8');
  assert.match(source, /exchangeCodeForSession/);
  assert.match(source, /createSupabaseAuthExchangeClient/);
  assert.match(source, /getPublicOrigin/);
  assert.doesNotMatch(source, /signup\?error=/);
  assert.doesNotMatch(source, /console\.(log|error|warn)/);
});

test('proxy forwards stray OAuth code params to /auth/callback', () => {
  const source = readFileSync(join(process.cwd(), 'proxy.ts'), 'utf8');
  assert.match(source, /maybeForwardStrayOAuthCode/);
  assert.match(source, /buildOAuthCallbackForwardUrl/);
  assert.match(source, /pathnameHasStrayOAuthParams/);
});

test('supabase server auth client uses PKCE flow', () => {
  const source = readFileSync(join(process.cwd(), 'lib/supabaseServerAuth.ts'), 'utf8');
  assert.match(source, /flowType:\s*['"]pkce['"]/);
  assert.match(source, /detectSessionInUrl:\s*false/);
});

test('safe redirect rejects malicious next values used after OAuth', () => {
  for (const raw of ['//evil.example', 'https://evil.example', '/%2F%2Fevil.example']) {
    assert.equal(getSafeRedirectPath(raw, '/dashboard'), '/dashboard');
  }
  assert.equal(getSafeRedirectPath('/profile', '/dashboard'), '/profile');
});

test('sensitive hash key list covers required OAuth fragment keys', () => {
  for (const key of [
    'access_token',
    'refresh_token',
    'provider_token',
    'provider_refresh_token',
    'id_token',
    'session_id',
  ]) {
    assert.ok(SENSITIVE_AUTH_HASH_KEYS.includes(key as (typeof SENSITIVE_AUTH_HASH_KEYS)[number]));
  }
});

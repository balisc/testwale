import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  PublicOriginConfigError,
  getTrustedPublicOrigin,
  validateTrustedOrigin,
} from './publicOrigin.ts';
import { getSafeRedirectPath } from './safeRedirect.ts';

function buildOAuthCallbackUrl(trustedOrigin: string, nextPath?: string | null): string {
  const next = getSafeRedirectPath(nextPath, '/dashboard');
  const url = new URL('/auth/callback', trustedOrigin);
  url.searchParams.set('next', next);
  return url.toString();
}

const ORIGINAL_ENV = { ...process.env };

function restoreEnv() {
  for (const key of Object.keys(process.env)) {
    if (!(key in ORIGINAL_ENV)) delete process.env[key];
  }
  Object.assign(process.env, ORIGINAL_ENV);
}

function withEnv(overrides: Record<string, string | undefined>, fn: () => void) {
  restoreEnv();
  Object.assign(process.env, overrides);
  try {
    fn();
  } finally {
    restoreEnv();
  }
}

test('production resolves configured HTTPS origin', () => {
  withEnv(
    {
      NODE_ENV: 'production',
      NEXT_PUBLIC_SITE_URL: 'https://questionwale.com',
      VERCEL_ENV: undefined,
    },
    () => {
      const origin = getTrustedPublicOrigin();
      assert.equal(origin, 'https://questionwale.com');
      const callback = buildOAuthCallbackUrl(origin, '/profile');
      assert.equal(callback, 'https://questionwale.com/auth/callback?next=%2Fprofile');
    },
  );
});

test('local development resolves localhost callback', () => {
  withEnv(
    {
      NODE_ENV: 'development',
      NEXT_PUBLIC_SITE_URL: 'http://localhost:3000',
    },
    () => {
      const request = new Request('http://localhost:3000/login');
      const origin = getTrustedPublicOrigin(request);
      assert.equal(origin, 'http://localhost:3000');
      const callback = buildOAuthCallbackUrl(origin, '/profile');
      assert.equal(callback, 'http://localhost:3000/auth/callback?next=%2Fprofile');
    },
  );
});

test('production rejects localhost configured origin', () => {
  withEnv(
    {
      NODE_ENV: 'production',
      NEXT_PUBLIC_SITE_URL: 'http://localhost:3000',
    },
    () => {
      assert.throws(
        () => getTrustedPublicOrigin(),
        (error: unknown) => error instanceof PublicOriginConfigError,
      );
    },
  );
});

test('production rejects missing configured origin', () => {
  withEnv(
    {
      NODE_ENV: 'production',
      NEXT_PUBLIC_SITE_URL: '',
    },
    () => {
      assert.throws(
        () => getTrustedPublicOrigin(),
        (error: unknown) => error instanceof PublicOriginConfigError,
      );
    },
  );
});

test('production rejects invalid configured origins', () => {
  for (const bad of [
    'http://questionwale.com',
    'https://questionwale.com/path',
    'https://user:pass@questionwale.com',
    'https://questionwale.com?x=1',
    'https://questionwale.com#hash',
  ]) {
    assert.equal(
      validateTrustedOrigin(bad, { allowLocalhost: false, requireHttps: true }),
      null,
      `expected reject for ${bad.split('@').pop()}`,
    );
  }
});

test('host and forwarded-host headers cannot change trusted production origin', () => {
  withEnv(
    {
      NODE_ENV: 'production',
      NEXT_PUBLIC_SITE_URL: 'https://questionwale.com',
    },
    () => {
      const request = new Request('https://evil.example/api/auth/google/start', {
        headers: {
          host: 'evil.example',
          'x-forwarded-host': 'evil.example',
          'x-forwarded-proto': 'https',
        },
      });
      const origin = getTrustedPublicOrigin(request);
      assert.equal(origin, 'https://questionwale.com');
      const callback = buildOAuthCallbackUrl(origin, '/profile');
      assert.match(callback, /^https:\/\/questionwale\.com\/auth\/callback\?next=%2Fprofile$/);
      assert.doesNotMatch(callback, /localhost|127\.0\.0\.1|\[::1\]/i);
    },
  );
});

test('Google login button uses server OAuth start route', () => {
  const source = readFileSync(
    join(process.cwd(), 'app/components/HomeGoogleCtaButton.tsx'),
    'utf8',
  );
  assert.match(source, /\/api\/auth\/google\/start/);
  assert.doesNotMatch(source, /signInWithOAuth/);
  assert.doesNotMatch(source, /getClientOAuthOrigin/);
});

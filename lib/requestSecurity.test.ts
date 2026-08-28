import assert from 'node:assert/strict';
import test from 'node:test';
import { checkMutationRequest, MAX_API_MUTATION_BYTES } from './requestSecurity.ts';

function post(headers: HeadersInit = {}) {
  return new Request('https://questionwale.com/api/profile', {
    method: 'POST',
    headers,
  });
}

test('safe methods do not require browser origin headers', () => {
  assert.deepEqual(
    checkMutationRequest(new Request('https://questionwale.com/api/profile')),
    { ok: true },
  );
});

test('same-origin mutation is accepted', () => {
  assert.deepEqual(
    checkMutationRequest(post({ origin: 'https://questionwale.com' })),
    { ok: true },
  );
});

test('cross-origin and same-site sibling mutations are rejected', () => {
  assert.deepEqual(
    checkMutationRequest(post({ origin: 'https://evil.example' })),
    { ok: false, status: 403, error: 'cross_origin_request' },
  );
  assert.deepEqual(
    checkMutationRequest(post({ 'sec-fetch-site': 'same-site' })),
    { ok: false, status: 403, error: 'cross_origin_request' },
  );
});

test('same-origin fetch metadata is accepted when privacy settings omit referrer', () => {
  assert.deepEqual(
    checkMutationRequest(post({ 'sec-fetch-site': 'same-origin' })),
    { ok: true },
  );
});

test('oversized mutations are rejected before route body parsing', () => {
  assert.deepEqual(
    checkMutationRequest(post({
      origin: 'https://questionwale.com',
      'content-length': String(MAX_API_MUTATION_BYTES + 1),
    })),
    { ok: false, status: 413, error: 'payload_too_large' },
  );
});

test('preview deployments use their platform URL instead of the production canonical origin', () => {
  const previousEnvironment = process.env.VERCEL_ENV;
  const previousUrl = process.env.VERCEL_URL;
  try {
    process.env.VERCEL_ENV = 'preview';
    process.env.VERCEL_URL = 'questionwale-preview.example';
    assert.deepEqual(
      checkMutationRequest(new Request('https://questionwale-preview.example/api/profile', {
        method: 'PATCH',
        headers: { origin: 'https://questionwale-preview.example' },
      })),
      { ok: true },
    );
    assert.deepEqual(
      checkMutationRequest(new Request('https://questionwale-preview.example/api/profile', {
        method: 'PATCH',
        headers: { origin: 'https://questionwale.com' },
      })),
      { ok: false, status: 403, error: 'cross_origin_request' },
    );
  } finally {
    if (previousEnvironment === undefined) delete process.env.VERCEL_ENV;
    else process.env.VERCEL_ENV = previousEnvironment;
    if (previousUrl === undefined) delete process.env.VERCEL_URL;
    else process.env.VERCEL_URL = previousUrl;
  }
});

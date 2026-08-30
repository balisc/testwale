import assert from 'node:assert/strict';
import test from 'node:test';
import { checkMutationRequest, MAX_API_MUTATION_BYTES } from './requestSecurity.ts';

function post(headers: HeadersInit = {}) {
  return new Request('https://questionwale.com/api/profile', {
    method: 'POST',
    headers,
  });
}

test('safe methods do not require browser origin headers', async () => {
  assert.deepEqual(
    await checkMutationRequest(new Request('https://questionwale.com/api/profile')),
    { ok: true },
  );
});

test('same-origin mutation is accepted', async () => {
  assert.deepEqual(
    await checkMutationRequest(post({ origin: 'https://questionwale.com' })),
    { ok: true },
  );
});

test('cross-origin and same-site sibling mutations are rejected', async () => {
  assert.deepEqual(
    await checkMutationRequest(post({ origin: 'https://evil.example' })),
    { ok: false, status: 403, error: 'cross_origin_request' },
  );
  assert.deepEqual(
    await checkMutationRequest(post({ 'sec-fetch-site': 'same-site' })),
    { ok: false, status: 403, error: 'cross_origin_request' },
  );
});

test('same-origin fetch metadata is accepted when privacy settings omit referrer', async () => {
  assert.deepEqual(
    await checkMutationRequest(post({ 'sec-fetch-site': 'same-origin' })),
    { ok: true },
  );
});

test('oversized mutations are rejected before route body parsing', async () => {
  assert.deepEqual(
    await checkMutationRequest(post({
      origin: 'https://questionwale.com',
      'content-length': String(MAX_API_MUTATION_BYTES + 1),
    })),
    { ok: false, status: 413, error: 'payload_too_large' },
  );
});

test('preview deployments use their platform URL instead of the production canonical origin', async () => {
  const previousEnvironment = process.env.VERCEL_ENV;
  const previousUrl = process.env.VERCEL_URL;
  try {
    process.env.VERCEL_ENV = 'preview';
    process.env.VERCEL_URL = 'questionwale-preview.example';
    assert.deepEqual(
      await checkMutationRequest(new Request('https://questionwale-preview.example/api/profile', {
        method: 'PATCH',
        headers: { origin: 'https://questionwale-preview.example' },
      })),
      { ok: true },
    );
    assert.deepEqual(
      await checkMutationRequest(new Request('https://questionwale-preview.example/api/profile', {
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

test('chunked JSON bodies are bounded even without content-length', async () => {
  const request = new Request('https://questionwale.com/api/profile', {
    method: 'PATCH',
    headers: { origin: 'https://questionwale.com', 'content-type': 'application/json' },
    body: JSON.stringify({ value: 'x'.repeat(MAX_API_MUTATION_BYTES) }),
  });
  assert.deepEqual(await checkMutationRequest(request), {
    ok: false,
    status: 413,
    error: 'payload_too_large',
  });
});

test('unsafe request bodies require JSON except the local OAuth form route', async () => {
  const request = new Request('https://questionwale.com/api/profile', {
    method: 'PATCH',
    headers: { origin: 'https://questionwale.com', 'content-type': 'text/plain' },
    body: '{}',
  });
  assert.deepEqual(await checkMutationRequest(request), {
    ok: false,
    status: 415,
    error: 'unsupported_media_type',
  });
});

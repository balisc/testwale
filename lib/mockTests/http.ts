import { NextResponse } from 'next/server';
import { MockTestServerError, type MockTestErrorCode } from './server';

export const MOCK_PRIVATE_HEADERS = { 'Cache-Control': 'private, no-store' } as const;

const STATUS_BY_CODE: Record<MockTestErrorCode, number> = {
  LOGIN_REQUIRED: 401,
  FEATURE_DISABLED: 503,
  BLUEPRINT_UNAVAILABLE: 503,
  INSUFFICIENT_VERIFIED_INVENTORY: 409,
  RATE_LIMITED: 429,
  INVALID_REQUEST: 400,
  NOT_FOUND: 404,
  STATE_CONFLICT: 409,
  STALE_RESPONSE: 409,
  SECTION_LOCKED: 409,
  TEST_EXPIRED: 409,
  ALREADY_SUBMITTED: 409,
  INTERNAL_ERROR: 500,
};

const MESSAGE_BY_CODE: Record<MockTestErrorCode, string> = {
  LOGIN_REQUIRED: 'Sign in to continue.',
  FEATURE_DISABLED: 'Full mock tests are not enabled for this rollout yet.',
  BLUEPRINT_UNAVAILABLE: 'The mock-test blueprint is temporarily unavailable.',
  INSUFFICIENT_VERIFIED_INVENTORY: 'A complete exam-realistic mock cannot be generated from the verified inventory yet.',
  RATE_LIMITED: 'Too many requests. Please wait and try again.',
  INVALID_REQUEST: 'The request was invalid.',
  NOT_FOUND: 'The mock test was not found.',
  STATE_CONFLICT: 'This action is not available in the test’s current state.',
  STALE_RESPONSE: 'A newer response is already saved.',
  SECTION_LOCKED: 'This section is locked.',
  TEST_EXPIRED: 'The test time has ended and the result is being finalized.',
  ALREADY_SUBMITTED: 'This test has already been submitted.',
  INTERNAL_ERROR: 'The request could not be completed.',
};

export function mockJson(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: MOCK_PRIVATE_HEADERS });
}

export function mockErrorResponse(error: unknown) {
  const known = error instanceof MockTestServerError
    ? error
    : new MockTestServerError('INTERNAL_ERROR');
  if (known.code === 'INTERNAL_ERROR') console.error('[mock-tests]', error);
  return mockJson({ ok: false, code: known.code, message: MESSAGE_BY_CODE[known.code] }, STATUS_BY_CODE[known.code]);
}

export function rejectUnknownFields(body: Record<string, unknown>, allowed: readonly string[]) {
  const allowedSet = new Set(allowed);
  return Object.keys(body).some((key) => !allowedSet.has(key));
}


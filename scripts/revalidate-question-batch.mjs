#!/usr/bin/env node
/**
 * Call the secure manual question-batch revalidation endpoint.
 *
 * Usage:
 *   QUESTION_CACHE_REVALIDATE_SECRET=... node scripts/revalidate-question-batch.mjs --subtopicId <uuid>
 *   QUESTION_CACHE_REVALIDATE_SECRET=... node scripts/revalidate-question-batch.mjs --topicId <uuid>
 *   QUESTION_CACHE_REVALIDATE_SECRET=... node scripts/revalidate-question-batch.mjs --baseUrl https://questionwale.com
 *
 * Omit --subtopicId and --topicId to revalidate the broad `question-batch` tag (use sparingly).
 */

const args = process.argv.slice(2);

function readArg(flag) {
  const index = args.indexOf(flag);
  if (index === -1) return undefined;
  return args[index + 1];
}

const secret = process.env.QUESTION_CACHE_REVALIDATE_SECRET?.trim();
const baseUrl = (readArg('--baseUrl') ?? process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(
  /\/$/,
  '',
);
const subtopicId = readArg('--subtopicId');
const topicId = readArg('--topicId');

if (!secret) {
  console.error('Missing QUESTION_CACHE_REVALIDATE_SECRET');
  process.exit(1);
}

const body = {};
if (subtopicId) body.subtopicId = subtopicId;
if (topicId) body.topicId = topicId;

const response = await fetch(`${baseUrl}/api/admin/revalidate-question-batch`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${secret}`,
  },
  body: JSON.stringify(body),
});

const payload = await response.json().catch(() => ({}));
if (!response.ok) {
  console.error('Revalidation failed:', response.status, payload);
  process.exit(1);
}

console.log('Revalidation ok:', payload);

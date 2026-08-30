/**
 * Assert invalid catalog paths return HTTP 404 (not soft 200).
 * Usage: BASE_URL=http://127.0.0.1:3011 node scripts/verify-soft-404.mjs
 */

const base = (process.argv[2] ?? process.env.BASE_URL ?? 'http://127.0.0.1:3011').replace(/\/$/, '');

const INVALID_PATHS = [
  { path: '/subjects/not-a-real-subject-xyz', label: 'invalid-subject' },
  { path: '/subjects/indian-polity/not-a-real-topic-xyz', label: 'invalid-topic' },
  {
    path: '/subjects/indian-polity/constitutional-history-making/not-a-real-subtopic/revision',
    label: 'invalid-subtopic-revision',
  },
  {
    path: '/subjects/indian-polity/constitutional-history-making/practice/not-a-real-subtopic',
    label: 'invalid-subtopic-practice',
  },
  { path: '/exams/not-a-real-exam-xyz', label: 'invalid-exam' },
  { path: '/exams/ssc-cgl/not-a-real-subject-xyz', label: 'invalid-exam-subject' },
  {
    path: '/question/not-a-real-question-00000000-0000-4000-8000-000000000000',
    label: 'invalid-question',
  },
  { path: '/totally-unknown-route-404-test', label: 'unknown-top-level' },
];

const PERMANENTLY_REMOVED_PATHS = [
  '/economics/topics/social-security',
  '/economics/topics/growthsustainability-balance',
  '/economics/topics/first-to-twelfth-five-year-plans',
  '/economics/topics/education',
  '/economics/topics/aadhaar-enabled-delivery',
  '/economics/topics/ease-of-doing-business',
];

const VALID_PATHS = [
  { path: '/subjects/indian-polity', label: 'valid-subject' },
  {
    path: '/subjects/indian-polity/constitutional-history-making',
    label: 'valid-topic',
  },
  {
    path: '/subjects/indian-polity/constitutional-history-making/practice/company-rule-acts-1773-1853',
    label: 'valid-search-subtopic',
  },
  {
    path: '/subjects/indian-polity/constitutional-history-making/company-rule-acts-1773-1853/revision',
    label: 'valid-subtopic-revision',
  },
  { path: '/exams/ssc-cgl', label: 'valid-exam' },
];

let failed = 0;

async function check(path, expectStatus, label) {
  const res = await fetch(`${base}${path}`, { redirect: 'manual' });
  const text = await res.text();
  const ok = res.status === expectStatus;
  console.log(
    `${ok ? 'PASS' : 'FAIL'}  ${label} ${path} → HTTP ${res.status} (expected ${expectStatus})`,
  );
  if (!ok) {
    failed += 1;
    console.log(`       title snippet: ${text.match(/<title[^>]*>([^<]+)/i)?.[1]?.slice(0, 60) ?? '—'}`);
  }
  return ok;
}

console.log(`Soft-404 verification — ${base}\n`);

for (const row of INVALID_PATHS) {
  await check(row.path, 404, row.label);
}

for (const path of PERMANENTLY_REMOVED_PATHS) {
  await check(path, 410, 'removed-legacy-topic');
}

for (const row of VALID_PATHS) {
  await check(row.path, 200, row.label);
}

console.log(`\n${failed === 0 ? 'All checks passed' : `${failed} check(s) failed`}`);
process.exit(failed > 0 ? 1 : 0);

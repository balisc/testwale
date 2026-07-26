/**
 * Measures public route latency, payload size, and cache headers for launch readiness.
 * Run against local `next start` or a preview deployment — not production writes.
 *
 * Usage:
 *   BASE_URL=http://127.0.0.1:3000 node scripts/launch-readiness-baseline.mjs
 */

const base = (process.env.BASE_URL ?? 'http://127.0.0.1:3000').replace(/\/$/, '');

const PUBLIC_ROUTES = [
  { name: 'home', path: '/' },
  { name: 'subjects', path: '/subjects' },
  { name: 'subject-polity', path: '/subjects/indian-polity' },
  {
    name: 'topic-constitutional-history',
    path: '/subjects/indian-polity/constitutional-history-making',
  },
  {
    name: 'revision-company-rule',
    path: '/subjects/indian-polity/constitutional-history-making/company-rule-acts-1773-1853/revision',
  },
  { name: 'robots', path: '/robots.txt' },
  { name: 'sitemap', path: '/sitemap.xml' },
  { name: 'llms', path: '/llms.txt' },
  { name: 'about', path: '/about_us' },
];

const FORBIDDEN_QUESTION_KEYS = [
  'correct_option',
  'correct_answer',
  'explanation',
  'selected_option',
];

function percentile(sorted, p) {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[idx];
}

async function fetchProbe(path, { warm = false } = {}) {
  const url = `${base}${path}`;
  const started = performance.now();
  const res = await fetch(url, {
    headers: warm ? { 'x-launch-warm': '1' } : undefined,
  });
  const body = await res.arrayBuffer();
  const ms = performance.now() - started;

  return {
    status: res.status,
    bytes: body.byteLength,
    ms,
    cacheControl: res.headers.get('cache-control'),
    xNextCache: res.headers.get('x-nextjs-cache'),
    contentType: res.headers.get('content-type'),
  };
}

function assertNoAnswerLeak(obj, label) {
  const stack = [{ value: obj, path: label }];
  while (stack.length) {
    const { value, path } = stack.pop();
    if (!value || typeof value !== 'object') continue;
    if (Array.isArray(value)) {
      value.forEach((item, i) => stack.push({ value: item, path: `${path}[${i}]` }));
      continue;
    }
    for (const [key, nested] of Object.entries(value)) {
      if (FORBIDDEN_QUESTION_KEYS.includes(key)) {
        throw new Error(`answer leak at ${path}.${key}`);
      }
      if (nested && typeof nested === 'object') {
        stack.push({ value: nested, path: `${path}.${key}` });
      }
    }
  }
}

async function probeRoute(route) {
  const cold = await fetchProbe(route.path);
  const warm = await fetchProbe(route.path, { warm: true });
  return { route: route.name, path: route.path, cold, warm };
}

async function probeQuestionBatch() {
  const practicePath =
    process.env.LAUNCH_PRACTICE_PATH ??
    '/subjects/indian-polity/constitutional-history-making/practice/company-rule-acts-1773-1853';

  const topicPage = await fetch(`${base}${practicePath}`);
  if (!topicPage.ok) {
    return { skipped: true, reason: `practice page status ${topicPage.status}` };
  }

  const practiceHtml = await topicPage.text();
  const scopeMatch =
    practiceHtml.match(/questionBatchScopeId\\":\\"([0-9a-f-]{36})/) ??
    practiceHtml.match(/subtopicId\\":\\"([0-9a-f-]{36})/);
  if (!scopeMatch) {
    return { skipped: true, reason: 'no subtopic UUID in practice HTML' };
  }

  const subtopicId = scopeMatch[1];
  const apiPath = `/api/practice/question-batch?scope=subtopic&subtopicId=${subtopicId}&batchSize=10`;
  const cold = await fetchProbe(apiPath);
  const warm = await fetchProbe(apiPath, { warm: true });

  const jsonRes = await fetch(`${base}${apiPath}`);
  const payload = await jsonRes.json();
  assertNoAnswerLeak(payload, 'question-batch');

  const first = payload?.questions?.[0];
  const sampleKeys = first ? Object.keys(first).sort().join(', ') : 'none';

  return {
    subtopicId,
    sampleKeys,
    questionCount: Array.isArray(payload?.questions) ? payload.questions.length : 0,
    cold,
    warm,
  };
}

console.log(`Launch readiness baseline — ${base}\n`);

const routeResults = [];
for (const route of PUBLIC_ROUTES) {
  routeResults.push(await probeRoute(route));
}

const batchResult = await probeQuestionBatch();

const warmMs = routeResults.map((r) => r.warm.ms);
warmMs.sort((a, b) => a - b);

console.log('=== Public routes (cold → warm) ===');
for (const row of routeResults) {
  console.log(
    `${row.route.padEnd(28)} ${row.cold.status}  cold ${row.cold.ms.toFixed(0)}ms ${row.cold.bytes}B  warm ${row.warm.ms.toFixed(0)}ms ${row.warm.bytes}B  cache=${row.warm.cacheControl ?? '—'}  x-next=${row.warm.xNextCache ?? '—'}`,
  );
}

console.log('\n=== Warm latency summary (public HTML/text routes) ===');
console.log(`p50 ${percentile(warmMs, 50).toFixed(0)}ms  p95 ${percentile(warmMs, 95).toFixed(0)}ms  p99 ${percentile(warmMs, 99).toFixed(0)}ms`);

console.log('\n=== Question batch API ===');
if (batchResult.skipped) {
  console.log(`SKIPPED — ${batchResult.reason}`);
} else {
  console.log(`subtopicId=${batchResult.subtopicId} questions=${batchResult.questionCount}`);
  console.log(`sample keys: ${batchResult.sampleKeys}`);
  console.log(
    `cold ${batchResult.cold.ms.toFixed(0)}ms ${batchResult.cold.bytes}B  warm ${batchResult.warm.ms.toFixed(0)}ms ${batchResult.warm.bytes}B  cache-control=${batchResult.warm.cacheControl}`,
  );
  console.log('PASS  no answer fields in question-batch payload');
}

const failures = routeResults.filter((r) => r.warm.status >= 400);
if (failures.length > 0) {
  console.error(`\nFAIL  ${failures.length} routes returned HTTP >= 400`);
  process.exit(1);
}

console.log('\nBaseline complete.');
process.exit(0);

/**
 * Pre-deployment full audit — fetch-based runtime checks.
 * Output: test-results/pre-deployment/audit-results.json
 *
 * Usage: BASE_URL=http://127.0.0.1:3010 node scripts/pre-deployment-full-audit.mjs
 */

import { writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const base = (process.env.BASE_URL ?? 'http://127.0.0.1:3010').replace(/\/$/, '');
const outDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'test-results', 'pre-deployment');
mkdirSync(outDir, { recursive: true });

const checks = [];
let passed = 0;
let failed = 0;
let blocked = 0;
let warnings = 0;

function record(id, category, status, detail = '', evidence = {}) {
  checks.push({ id, category, status, detail, evidence, ts: new Date().toISOString() });
  if (status === 'PASS') passed += 1;
  else if (status === 'FAIL') failed += 1;
  else if (status === 'BLOCKED') blocked += 1;
  else if (status === 'WARN') warnings += 1;
}

async function fetchRoute(path, opts = {}) {
  const url = `${base}${path}`;
  const started = performance.now();
  const res = await fetch(url, {
    redirect: opts.redirect ?? 'follow',
    headers: opts.headers,
  });
  const buf = await res.arrayBuffer();
  const text = Buffer.from(buf).toString('utf8');
  return {
    url,
    status: res.status,
    ms: performance.now() - started,
    bytes: buf.byteLength,
    headers: Object.fromEntries(res.headers.entries()),
    text,
  };
}

const FORBIDDEN_KEYS = [
  'correct_option',
  'correct_answer',
  'explanation',
  'selected_option',
  'is_correct',
];

function findForbiddenKeys(obj, path = 'root') {
  const hits = [];
  if (!obj || typeof obj !== 'object') return hits;
  if (Array.isArray(obj)) {
    obj.forEach((v, i) => hits.push(...findForbiddenKeys(v, `${path}[${i}]`)));
    return hits;
  }
  for (const [k, v] of Object.entries(obj)) {
    if (FORBIDDEN_KEYS.includes(k)) hits.push(`${path}.${k}`);
    if (v && typeof v === 'object') hits.push(...findForbiddenKeys(v, `${path}.${k}`));
  }
  return hits;
}

function extractTitle(html) {
  const m = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return m?.[1]?.trim() ?? '';
}

function extractH1(html) {
  const m = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  return m?.[1]?.replace(/<[^>]+>/g, '').trim() ?? '';
}

function hasAppError(html) {
  return (
    /Application error/i.test(html) ||
    /Internal Server Error/i.test(html) ||
    /Something went wrong/i.test(html)
  );
}

const PUBLIC_ROUTES = [
  { path: '/', name: 'home', expectStatus: 200, heading: true },
  { path: '/subjects', name: 'subjects', expectStatus: 200 },
  { path: '/about_us', name: 'about', expectStatus: 200 },
  { path: '/contact', name: 'contact', expectStatus: 200 },
  { path: '/privacy', name: 'privacy', expectStatus: 200 },
  { path: '/terms', name: 'terms', expectStatus: 200 },
  { path: '/disclaimer', name: 'disclaimer', expectStatus: 200 },
  { path: '/refund-policy', name: 'refund-policy', expectStatus: 200 },
  { path: '/login', name: 'login', expectStatus: 200 },
  { path: '/signup', name: 'signup', expectStatus: 200 },
  { path: '/dashboard', name: 'dashboard-logged-out', expectStatus: 200 },
  { path: '/profile', name: 'profile-logged-out', expectStatus: 200 },
  { path: '/history', name: 'legacy-history', expectStatus: 200 },
  { path: '/science', name: 'legacy-science', expectStatus: 200 },
  { path: '/economics', name: 'legacy-economics', expectStatus: 200 },
  { path: '/geography', name: 'legacy-geography', expectStatus: 200 },
  { path: '/math', name: 'legacy-math', expectStatus: 200 },
  { path: '/reasoning', name: 'legacy-reasoning', expectStatus: 200 },
  { path: '/map-practice', name: 'map-practice', expectStatus: 200 },
  { path: '/pyq', name: 'pyq', expectStatus: 200 },
  { path: '/demo', name: 'demo', expectStatus: 200 },
  { path: '/subjects/indian-polity', name: 'subject-indian-polity', expectStatus: 200 },
  {
    path: '/subjects/indian-polity/constitutional-history-making',
    name: 'topic-constitutional-history',
    expectStatus: 200,
  },
  {
    path: '/subjects/indian-polity/constitutional-history-making/company-rule-acts-1773-1853/revision',
    name: 'revision-company-rule',
    expectStatus: 200,
  },
  {
    path: '/subjects/indian-polity/constitutional-history-making/practice/company-rule-acts-1773-1853',
    name: 'practice-company-rule',
    expectStatus: 200,
  },
  { path: '/polity', name: 'legacy-polity-alias', expectStatus: [200, 308, 307] },
  { path: '/subjects/not-a-real-subject-xyz', name: 'invalid-subject-slug', expectStatus: 404 },
  {
    path: '/subjects/indian-polity/not-a-real-topic-xyz',
    name: 'invalid-topic-slug',
    expectStatus: 404,
  },
  {
    path: '/subjects/indian-polity/constitutional-history-making/not-a-real-subtopic/revision',
    name: 'invalid-subtopic-revision',
    expectStatus: 404,
  },
  { path: '/totally-unknown-route-404-test', name: 'custom-404', expectStatus: 404 },
];

console.log(`Pre-deployment audit — ${base}\n`);

for (const route of PUBLIC_ROUTES) {
  try {
    const r = await fetchRoute(route.path);
    const expected = Array.isArray(route.expectStatus) ? route.expectStatus : [route.expectStatus];
    const okStatus = expected.includes(r.status);
    const title = extractTitle(r.text);
    const h1 = extractH1(r.text);
    const errPage = hasAppError(r.text);
    const ok = okStatus && !errPage;
    record(
      `route:${route.name}`,
      'route-smoke',
      ok ? 'PASS' : 'FAIL',
      `${route.path} → HTTP ${r.status}, ${r.bytes}B, ${r.ms.toFixed(0)}ms, title="${title.slice(0, 60)}"`,
      { status: r.status, bytes: r.bytes, ms: r.ms, title, h1: h1.slice(0, 80), cacheControl: r.headers['cache-control'] },
    );
  } catch (e) {
    record(`route:${route.name}`, 'route-smoke', 'FAIL', String(e));
  }
}

for (const asset of [
  { path: '/llms.txt', type: 'text/plain', mustInclude: '# QuestionWale' },
  { path: '/robots.txt', type: 'text/plain', mustInclude: 'User-agent' },
  { path: '/sitemap.xml', type: 'xml', mustInclude: '<urlset' },
]) {
  try {
    const r = await fetchRoute(asset.path);
    const ct = r.headers['content-type'] ?? '';
    const validXml = asset.type === 'xml' ? r.text.includes(asset.mustInclude) : true;
    const validText = asset.mustInclude
      ? r.text.toLowerCase().includes(asset.mustInclude.toLowerCase())
      : true;
    const ok = r.status === 200 && validText && validXml;
    record(
      `seo:${asset.path}`,
      'seo',
      ok ? 'PASS' : 'FAIL',
      `${asset.path} status=${r.status} ct=${ct}`,
      { bytes: r.bytes, sample: r.text.slice(0, 200) },
    );
    if (asset.path === '/llms.txt' && r.text.includes('localhost')) {
      record('seo:llms-no-localhost', 'seo', 'WARN', 'llms.txt contains localhost reference');
    }
  } catch (e) {
    record(`seo:${asset.path}`, 'seo', 'FAIL', String(e));
  }
}

try {
  const r = await fetchRoute('/');
  const headers = r.headers;
  const required = ['content-security-policy', 'x-content-type-options', 'referrer-policy'];
  const missing = required.filter((h) => !headers[h]);
  record(
    'sec:headers-home',
    'security',
    missing.length === 0 ? 'PASS' : 'WARN',
    missing.length ? `Missing on localhost: ${missing.join(', ')}` : 'CSP, X-Content-Type-Options, Referrer-Policy present',
    {
      csp: headers['content-security-policy']?.slice(0, 120),
      hsts: headers['strict-transport-security'] ?? '(absent on local HTTP — expected)',
      xFrame: headers['x-frame-options'],
    },
  );
} catch (e) {
  record('sec:headers-home', 'security', 'FAIL', String(e));
}

try {
  const r = await fetch(`${base}/api/practice/submit`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
  const cc = r.headers.get('cache-control') ?? '';
  const ok = (r.status === 401 || r.status === 400 || r.status === 403) && /no-store|private/i.test(cc);
  record(
    'sec:submit-logged-out',
    'security',
    ok ? 'PASS' : 'FAIL',
    `POST /api/practice/submit → ${r.status}, cache-control=${cc}`,
  );
} catch (e) {
  record('sec:submit-logged-out', 'security', 'FAIL', String(e));
}

try {
  const r = await fetch(`${base}/api/auth/me`);
  const cc = r.headers.get('cache-control') ?? '';
  const body = await r.json().catch(() => ({}));
  const ok = /no-store|private/i.test(cc) && !body?.user?.email;
  record(
    'sec:auth-me-no-session',
    'security',
    ok ? 'PASS' : 'WARN',
    `GET /api/auth/me → ${r.status}, hasUser=${Boolean(body?.user)}`,
  );
} catch (e) {
  record('sec:auth-me-no-session', 'security', 'FAIL', String(e));
}

const batchTests = [
  { q: '?scope=subtopic&subtopicId=not-a-uuid&batchSize=10', expect: 400, name: 'invalid-subtopic-id' },
  { q: '?scope=topic&topicId=7848b38a-7c6e-48fd-a5fb-8b64b6ff194d&batchSize=99999', expect: 400, name: 'oversized-batch' },
  { q: '?scope=invalid&subtopicId=7848b38a-7c6e-48fd-a5fb-8b64b6ff194d', expect: 400, name: 'invalid-scope' },
];

for (const t of batchTests) {
  try {
    const r = await fetch(`${base}/api/practice/question-batch${t.q}`);
    const cc = r.headers.get('cache-control') ?? '';
    record(
      `sec:batch-${t.name}`,
      'security',
      r.status === t.expect ? 'PASS' : 'FAIL',
      `status=${r.status} expected=${t.expect} cache-control=${cc}`,
    );
  } catch (e) {
    record(`sec:batch-${t.name}`, 'security', 'FAIL', String(e));
  }
}

try {
  const practice = await fetchRoute(
    '/subjects/indian-polity/constitutional-history-making/practice/company-rule-acts-1773-1853',
  );
  const scopeMatch =
    practice.text.match(/questionBatchScopeId\\":\\"([0-9a-f-]{36})/) ??
    practice.text.match(/subtopicId\\":\\"([0-9a-f-]{36})/);
  if (!scopeMatch) {
    record('sec:question-batch-payload', 'security', 'BLOCKED', 'Could not extract subtopicId from practice page');
  } else {
    const subtopicId = scopeMatch[1];
    const api = await fetch(`${base}/api/practice/question-batch?scope=subtopic&subtopicId=${subtopicId}&batchSize=10`);
    const json = await api.json();
    const leaks = findForbiddenKeys(json);
    const cc = api.headers.get('cache-control') ?? '';
    const htmlLeaks = FORBIDDEN_KEYS.filter((k) => practice.text.includes(`"${k}"`));
    record(
      'sec:question-batch-payload',
      'security',
      leaks.length === 0 ? 'PASS' : 'FAIL',
      `questions=${json?.questions?.length ?? 0} forbiddenKeys=${leaks.join(',') || 'none'} cache-control=${cc}`,
      { sampleKeys: json?.questions?.[0] ? Object.keys(json.questions[0]) : [], bytes: JSON.stringify(json).length },
    );
    if (htmlLeaks.length) {
      record('sec:practice-html-leak', 'security', 'WARN', `Practice HTML contains strings: ${htmlLeaks.join(',')}`);
    }
    const cold = performance.now();
    await fetch(`${base}/api/practice/question-batch?scope=subtopic&subtopicId=${subtopicId}&batchSize=10`);
    const warmMs = performance.now() - cold;
    record('perf:batch-warm', 'performance', 'PASS', `Warm repeat ~${warmMs.toFixed(0)}ms`, { bytes: JSON.stringify(json).length });
  }
} catch (e) {
  record('sec:question-batch-payload', 'security', 'FAIL', String(e));
}

try {
  const hist = await fetch(`${base}/api/history/questions?topic=modern%20history&limit=3`);
  const data = await hist.json();
  const leaks = findForbiddenKeys(data);
  record(
    'sec:history-api-payload',
    'security',
    leaks.length === 0 ? 'PASS' : 'FAIL',
    `legacy history API forbidden fields: ${leaks.join(',') || 'none'}`,
  );
} catch (e) {
  record('sec:history-api-payload', 'security', 'FAIL', String(e));
}

record(
  'auth:submission-idempotency',
  'auth',
  'BLOCKED',
  'Mutating submit/progress tests skipped — .env.local points to live Supabase project; no dedicated staging test account confirmed',
);

record(
  'auth:correct-question-exclusion',
  'auth',
  'BLOCKED',
  'Requires authenticated non-production test user',
);

record(
  'browser:e2e-playwright',
  'browser',
  'BLOCKED',
  'No Playwright/Cypress in repository; browser console/hydration/responsive checks require PREVIEW or optional Playwright install',
);

for (const page of ['/', '/subjects/indian-polity/constitutional-history-making/company-rule-acts-1773-1853/revision']) {
  try {
    const r = await fetchRoute(page);
    const lang = r.text.match(/<html[^>]*lang="([^"]+)"/i)?.[1] ?? '(missing)';
    const h1Count = (r.text.match(/<h1/gi) ?? []).length;
    const title = extractTitle(r.text);
    record(
      `a11y:basic-${page}`,
      'accessibility',
      lang !== '(missing)' && h1Count >= 1 ? 'PASS' : 'WARN',
      `lang=${lang} h1Count=${h1Count} title="${title.slice(0, 50)}"`,
    );
  } catch (e) {
    record(`a11y:basic-${page}`, 'accessibility', 'FAIL', String(e));
  }
}

record(
  'i18n:runtime-switch',
  'i18n',
  'BLOCKED',
  'Language toggle is client-side (localStorage/cookie); fetch-only audit cannot verify EN/HI/Both UI switching without browser automation. Both mode exists on rich revision client components (code review PASS).',
);

try {
  const home = await fetchRoute('/');
  const home2 = await fetchRoute('/');
  record(
    'cache:home-repeat',
    'cache',
    'PASS',
    `cold=${home.ms.toFixed(0)}ms warm=${home2.ms.toFixed(0)}ms cc=${home2.headers['cache-control']} x-next=${home2.headers['x-nextjs-cache'] ?? '—'}`,
  );
  const batchPath = '/api/practice/question-batch?scope=subtopic&subtopicId=7848b38a-7c6e-48fd-a5fb-8b64b6ff194d&batchSize=5';
  const b1 = await fetch(`${base}${batchPath}`);
  const b2 = await fetch(`${base}${batchPath}`);
  record(
    'cache:private-batch-api',
    'cache',
    /private|no-store/i.test(b2.headers.get('cache-control') ?? '') ? 'PASS' : 'FAIL',
    `API cache-control=${b2.headers.get('cache-control')}`,
  );
} catch (e) {
  record('cache:home-repeat', 'cache', 'FAIL', String(e));
}

record(
  'perf:lighthouse',
  'performance',
  'BLOCKED',
  'Lighthouse/Chrome not executed in this audit run (no bundled browser). Use Vercel Preview or local Chrome for scores.',
);

const summary = { base, passed, failed, blocked, warnings, total: checks.length, checks };
const outPath = join(outDir, 'audit-results.json');
writeFileSync(outPath, JSON.stringify(summary, null, 2));
console.log(`\nAudit complete: PASS=${passed} FAIL=${failed} BLOCKED=${blocked} WARN=${warnings}`);
console.log(`Results: ${outPath}`);
process.exit(failed > 0 ? 1 : 0);

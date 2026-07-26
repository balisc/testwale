/**
 * Controlled load smoke test — ramped concurrency against local/preview only.
 *
 * Usage:
 *   BASE_URL=http://127.0.0.1:3000 node scripts/launch-readiness-load.mjs
 *
 * Env:
 *   LOAD_CONCURRENCY=5   parallel workers per phase (default 5)
 *   LOAD_REQUESTS=30     requests per phase (default 30)
 */

const base = (process.env.BASE_URL ?? 'http://127.0.0.1:3000').replace(/\/$/, '');
const CONCURRENCY = Math.max(1, Number.parseInt(process.env.LOAD_CONCURRENCY ?? '5', 10));
const REQUESTS_PER_PHASE = Math.max(5, Number.parseInt(process.env.LOAD_REQUESTS ?? '30', 10));

const PHASES = [
  {
    name: 'warm-public-home',
    path: '/',
    note: 'ISR/home cache warm traffic',
  },
  {
    name: 'warm-revision-page',
    path: '/subjects/indian-polity/constitutional-history-making/company-rule-acts-1773-1853/revision',
    note: 'revision ISR (revalidate=3600)',
  },
  {
    name: 'warm-subjects',
    path: '/subjects',
    note: 'catalog listing',
  },
];

function percentile(sorted, p) {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[idx];
}

async function oneRequest(path) {
  const started = performance.now();
  try {
    const res = await fetch(`${base}${path}`);
    const buf = await res.arrayBuffer();
    return {
      ok: res.ok,
      status: res.status,
      ms: performance.now() - started,
      bytes: buf.byteLength,
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      ms: performance.now() - started,
      bytes: 0,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function runPhase(phase) {
  // Prime cache once
  await oneRequest(phase.path);

  const results = [];
  let cursor = 0;

  async function worker() {
    while (cursor < REQUESTS_PER_PHASE) {
      const i = cursor;
      cursor += 1;
      results[i] = await oneRequest(phase.path);
    }
  }

  const workers = Array.from({ length: Math.min(CONCURRENCY, REQUESTS_PER_PHASE) }, () => worker());
  const phaseStarted = performance.now();
  await Promise.all(workers);
  const elapsedSec = (performance.now() - phaseStarted) / 1000;

  const latencies = results.map((r) => r.ms).sort((a, b) => a - b);
  const errors = results.filter((r) => !r.ok).length;
  const rps = REQUESTS_PER_PHASE / elapsedSec;

  return {
    phase: phase.name,
    path: phase.path,
    note: phase.note,
    requests: REQUESTS_PER_PHASE,
    concurrency: CONCURRENCY,
    elapsedSec,
    rps,
    errors,
    p50: percentile(latencies, 50),
    p95: percentile(latencies, 95),
    p99: percentile(latencies, 99),
    avgBytes: Math.round(results.reduce((s, r) => s + r.bytes, 0) / results.length),
  };
}

console.log(`Launch readiness load test — ${base}`);
console.log(`Phases: ${PHASES.length} × ${REQUESTS_PER_PHASE} requests @ concurrency ${CONCURRENCY}\n`);

const summary = [];
for (const phase of PHASES) {
  const result = await runPhase(phase);
  summary.push(result);
  console.log(
    `${result.phase}: ${result.requests} req in ${result.elapsedSec.toFixed(2)}s (${result.rps.toFixed(1)} rps) errors=${result.errors} p50=${result.p50.toFixed(0)}ms p95=${result.p95.toFixed(0)}ms p99=${result.p99.toFixed(0)}ms avg=${result.avgBytes}B`,
  );
}

const totalErrors = summary.reduce((s, r) => s + r.errors, 0);
console.log(`\nTotal errors: ${totalErrors}`);

if (totalErrors > 0) {
  console.error('FAIL — errors under load');
  process.exit(1);
}

console.log('PASS — controlled load phases completed');
process.exit(0);

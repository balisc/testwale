const base = 'http://localhost:3000';

async function run(name, fn) {
  try {
    const result = await fn();
    console.log(`PASS  ${name}${result ? ` — ${result}` : ''}`);
    return true;
  } catch (error) {
    console.log(`FAIL  ${name} — ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

let passed = 0;
let failed = 0;

async function test(name, fn) {
  const ok = await run(name, fn);
  if (ok) passed += 1;
  else failed += 1;
}

await test('Homepage loads', async () => {
  const res = await fetch(`${base}/`);
  assert(res.ok, `status ${res.status}`);
  const html = await res.text();
  assert(html.includes('Practice to dominate') || html.includes('Choose Your Subject'), 'hero missing');
});

await test('Subjects page loads', async () => {
  const res = await fetch(`${base}/subjects`);
  assert(res.ok, `status ${res.status}`);
});

await test('Topic quiz page loads', async () => {
  const res = await fetch(`${base}/history/topics/modern-history`);
  assert(res.ok, `status ${res.status}`);
  const html = await res.text();
  assert(html.includes('text-xl font-semibold'), 'quiz question missing');
});

await test('History questions API returns correct_answer', async () => {
  const res = await fetch(`${base}/api/history/questions?topic=modern%20history`);
  assert(res.ok, `status ${res.status}`);
  const data = await res.json();
  assert(Array.isArray(data.questions) && data.questions.length > 0, 'no questions');
  assert(data.questions[0].correct_answer, 'correct_answer missing');
  return `${data.questions.length} questions`;
});

await test('Rate limit headers present on API', async () => {
  const res = await fetch(`${base}/api/site-stats`);
  assert(res.ok, `status ${res.status}`);
  assert(res.headers.get('x-ratelimit-limit'), 'missing rate limit header');
});

await test('Question page with quiz param loads', async () => {
  const list = await fetch(`${base}/api/history/questions?topic=modern%20history`).then((r) => r.json());
  const q = list.questions[3];
  assert(q?.id, 'missing sample question');
  const res = await fetch(`${base}/question/modern-history/sample-1247?q=3`.replace('sample-1247', `match-following-portuguese-governors-significant-actions-list-${q.id}`));
  assert(res.ok, `status ${res.status}`);
});

await test('Robots and sitemap available', async () => {
  const robots = await fetch(`${base}/robots.txt`);
  const sitemap = await fetch(`${base}/sitemap.xml`);
  assert(robots.ok, `robots status ${robots.status}`);
  assert(sitemap.ok, `sitemap status ${sitemap.status}`);
});

console.log(`\nSummary: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);

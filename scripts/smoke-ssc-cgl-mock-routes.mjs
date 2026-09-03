#!/usr/bin/env node

const base = (process.argv[2] ?? process.env.BASE_URL ?? 'http://127.0.0.1:3000').replace(/\/$/, '');
const checks = [
  { path: '/mock-tests/ssc-cgl', status: 200, csp: true },
  { path: '/mock-tests/ssc-chsl', status: 200, csp: true },
  { path: '/api/mock-tests/readiness?exam=ssc-cgl', status: 200, noStore: true },
  { path: '/api/mock-tests/readiness?exam=ssc-chsl', status: 200, noStore: true },
  { path: '/mock-tests/11111111-1111-4111-8111-111111111111', statuses: [200, 307], redirect: '/login', embeddedRedirect: '/login' },
  { path: '/api/cron/mock-tests/finalize', status: 401, noStore: true },
];

let failures = 0;
for (const check of checks) {
  const response = await fetch(`${base}${check.path}`, { redirect: 'manual' });
  const location = response.headers.get('location') ?? '';
  const cacheControl = response.headers.get('cache-control') ?? '';
  const csp = response.headers.get('content-security-policy') ?? '';
  const expectedStatuses = check.statuses ?? [check.status];
  const rawBody = expectedStatuses.includes(response.status) && !check.embeddedRedirect
    ? ''
    : await response.clone().text();
  const redirectPassed = !check.redirect
    || location.includes(check.redirect)
    || Boolean(check.embeddedRedirect && rawBody.includes(check.embeddedRedirect));
  const passed = expectedStatuses.includes(response.status)
    && redirectPassed
    && (!check.noStore || /no-store/i.test(cacheControl))
    && (!check.csp || /frame-ancestors 'none'/i.test(csp));
  console.log(`${passed ? 'PASS' : 'FAIL'} ${check.path} status=${response.status} cache=${cacheControl || '(missing)'} redirect=${location || '(none)'}`);
  if (!passed && rawBody) console.log(`  body=${rawBody.slice(0, 240).replace(/\s+/g, ' ')}`);
  if (!passed) failures += 1;
}

process.exit(failures === 0 ? 0 : 1);

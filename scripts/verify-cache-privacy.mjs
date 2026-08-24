#!/usr/bin/env node

/**
 * Guards user-aware document routes against accidental shared-cache headers.
 * Usage: node scripts/verify-cache-privacy.mjs [baseUrl]
 */
const base = (process.argv[2] ?? process.env.BASE_URL ?? 'http://127.0.0.1:3000').replace(/\/$/, '');

const USER_AWARE_ROUTES = [
  '/subjects',
  '/subjects/indian-polity',
  '/subjects/indian-polity/constitutional-history-making',
  '/subjects/indian-polity/constitutional-history-making/company-rule-acts-1773-1853/revision',
];

let failed = 0;

for (const path of USER_AWARE_ROUTES) {
  const response = await fetch(`${base}${path}`, { redirect: 'manual' });
  const cacheControl = response.headers.get('cache-control') ?? '';
  const shared = /(?:^|,)\s*(?:public|s-maxage\s*=)/i.test(cacheControl);
  const privatePolicy = /(?:private|no-store)/i.test(cacheControl);
  const ok = !shared && privatePolicy;

  console.log(
    `${ok ? 'PASS' : 'FAIL'} ${path} cache-control=${cacheControl || '(missing)'}`,
  );
  if (!ok) failed += 1;
}

process.exit(failed > 0 ? 1 : 0);

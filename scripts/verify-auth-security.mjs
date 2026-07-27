/**
 * Static + runtime checks for OAuth/token URL exposure.
 *
 * Usage:
 *   node scripts/verify-auth-security.mjs
 *   BASE_URL=http://127.0.0.1:3021 node scripts/verify-auth-security.mjs
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const base = (process.argv[2] ?? process.env.BASE_URL ?? 'http://127.0.0.1:3021').replace(/\/$/, '');

const FORBIDDEN_URL_PATTERNS = [
  /access_token/i,
  /refresh_token/i,
  /provider_token/i,
  /provider_refresh_token/i,
  /\bid_token\b/i,
  /\bsession_id\b/i,
  /signup\?error=google/i,
  /login\?error=google/i,
];

const ALLOWED_FIXTURE_PATHS = new Set([
  'lib/authSecurity.test.ts',
  'lib/safeRedirect.test.ts',
  'scripts/verify-auth-security.mjs',
]);

const ALLOWED_KEY_LIST_FILES = new Set(['lib/authSensitiveHash.ts']);

const ALLOWED_GOOGLE_VERIFY_FILES = new Set(['lib/googleAuth.ts']);

const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs']);

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === '.next' || entry === '.git') continue;
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) walk(full, files);
    else files.push(full);
  }
  return files;
}

function scanSourceTree() {
  const root = process.cwd();
  const files = walk(root);
  const findings = [];

  for (const file of files) {
    const rel = relative(root, file).replace(/\\/g, '/');
    const ext = rel.slice(rel.lastIndexOf('.'));
    if (!SOURCE_EXTENSIONS.has(ext)) continue;
    if (rel.startsWith('docs/') || rel.startsWith('test-results/')) continue;

    const text = readFileSync(file, 'utf8');
    for (const pattern of FORBIDDEN_URL_PATTERNS) {
      if (!pattern.test(text)) continue;
      if (ALLOWED_FIXTURE_PATHS.has(rel)) continue;
      if (ALLOWED_KEY_LIST_FILES.has(rel)) continue;
      if (ALLOWED_GOOGLE_VERIFY_FILES.has(rel) && pattern.source.includes('id_token')) continue;

      const line = text.split(/\r?\n/).findIndex((row) => pattern.test(row)) + 1;
      findings.push({ file: rel, line, key: pattern.source });
    }
  }

  return findings;
}

async function probeCallbackHeaders() {
  const res = await fetch(`${base}/auth/callback`, { redirect: 'manual' });
  const location = res.headers.get('location') ?? '';
  const cache = res.headers.get('cache-control') ?? '';
  const referrer = res.headers.get('referrer-policy') ?? '';

  const headerFindings = [];
  for (const pattern of FORBIDDEN_URL_PATTERNS) {
    if (pattern.test(location)) {
      headerFindings.push({ kind: 'location', key: pattern.source });
    }
  }

  return {
    status: res.status,
    location,
    cache,
    referrer,
    headerFindings,
    cacheOk: /private/i.test(cache) && /no-store/i.test(cache),
    referrerOk: referrer.toLowerCase().includes('no-referrer'),
    redirectOk: res.status >= 300 && res.status < 400 && !location.includes('?'),
  };
}

async function main() {
  let failed = 0;

  const sourceFindings = scanSourceTree();
  if (sourceFindings.length === 0) {
    console.log('PASS source scan: no forbidden auth URL patterns outside fixtures');
  } else {
    failed += sourceFindings.length;
    console.log('FAIL source scan findings:');
    for (const item of sourceFindings) {
      console.log(`  ${item.file}:${item.line} matched ${item.key}`);
    }
  }

  try {
    const runtime = await probeCallbackHeaders();
    if (runtime.redirectOk && runtime.cacheOk && runtime.headerFindings.length === 0) {
      console.log(`PASS callback runtime: HTTP ${runtime.status} → clean Location without query`);
      console.log(`PASS callback cache-control: ${runtime.cache}`);
    } else {
      failed += 1;
      console.log('FAIL callback runtime probe');
      console.log(`  status=${runtime.status} location=${runtime.location || '(empty)'}`);
      console.log(`  cache-control=${runtime.cache || '(missing)'}`);
      for (const item of runtime.headerFindings) {
        console.log(`  forbidden ${item.kind} pattern: ${item.key}`);
      }
    }
  } catch (error) {
    failed += 1;
    console.log(`BLOCKED callback runtime probe: ${error instanceof Error ? error.message : String(error)}`);
  }

  process.exit(failed > 0 ? 1 : 0);
}

main();

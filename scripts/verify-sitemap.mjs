#!/usr/bin/env node
/**
 * Validates /sitemap.xml: XML shape, unique locs, live HTTP 200, stable lastmod, topic coverage.
 * Usage: node scripts/verify-sitemap.mjs [baseUrl]
 */
const base = (process.argv[2] ?? process.env.BASE_URL ?? 'http://127.0.0.1:3000').replace(/\/$/, '');

function extractLocs(xml) {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
}

function extractLastmods(xml) {
  return [...xml.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)].map((m) => m[1].trim());
}

async function fetchText(path) {
  const res = await fetch(`${base}${path}`, { redirect: 'follow' });
  return { status: res.status, text: await res.text(), headers: Object.fromEntries(res.headers) };
}

let failed = 0;

const first = await fetchText('/sitemap.xml');
const second = await fetchText('/sitemap.xml');

if (first.status !== 200) {
  console.error(`FAIL sitemap status ${first.status}`);
  failed++;
} else if (!first.text.includes('<urlset')) {
  console.error('FAIL sitemap missing urlset');
  failed++;
} else {
  console.log('PASS valid sitemap XML');
}

const locs = extractLocs(first.text);
const dupes = locs.filter((loc, i) => locs.indexOf(loc) !== i);
if (dupes.length) {
  console.error(`FAIL duplicate locs: ${[...new Set(dupes)].join(', ')}`);
  failed++;
} else {
  console.log(`PASS ${locs.length} unique locs`);
}

const badHosts = locs.filter((loc) => /localhost|vercel\.app/i.test(loc));
if (badHosts.length) {
  console.error(`FAIL bad hosts: ${badHosts.join(', ')}`);
  failed++;
} else {
  console.log('PASS canonical questionwale.com hosts');
}

const legacyBad = locs.filter((loc) => /\/polity(\/|$)/.test(loc));
if (legacyBad.length) {
  console.error(`FAIL legacy /polity URLs in sitemap: ${legacyBad.join(', ')}`);
  failed++;
} else {
  console.log('PASS no legacy /polity URLs');
}

const topicUrls = locs.filter((loc) => /\/subjects\/indian-polity\/[^/]+$/.test(loc));
console.log(`INFO indian-polity topic URLs in sitemap: ${topicUrls.length}`);
if (topicUrls.length < 18) {
  console.error(`FAIL expected at least 18 active indian-polity topic URLs, found ${topicUrls.length}`);
  failed++;
} else {
  console.log('PASS indian-polity topic coverage');
}

if (first.text !== second.text) {
  console.error('FAIL sitemap output changed between consecutive requests');
  failed++;
} else {
  console.log('PASS stable sitemap output');
}

const lastmods = extractLastmods(first.text);
const nowish = lastmods.filter((value) => {
  const d = new Date(value);
  return Number.isFinite(d.getTime()) && Date.now() - d.getTime() < 60_000;
});
if (nowish.length > 1) {
  console.error(`FAIL ${nowish.length} lastmod values look like request-time timestamps`);
  failed++;
} else {
  console.log(`PASS lastmod policy (${lastmods.length} dated entries)`);
}

for (const loc of locs) {
  const path = loc.replace(/^https:\/\/questionwale\.com/, '');
  const res = await fetch(`${base}${path}`, { redirect: 'follow' });
  if (res.status !== 200) {
    console.error(`FAIL dead sitemap URL ${path} → HTTP ${res.status}`);
    failed++;
  }
}

if (failed === 0) {
  console.log('\nAll sitemap checks passed');
  process.exit(0);
}

console.error(`\n${failed} sitemap check(s) failed`);
process.exit(1);

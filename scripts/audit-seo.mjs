#!/usr/bin/env node

import { mkdir, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const base = new URL((process.argv[2] ?? process.env.BASE_URL ?? 'http://127.0.0.1:3000').replace(/\/$/, '') + '/');
const expectedOrigin = (process.argv[3] ?? process.env.EXPECTED_PUBLIC_ORIGIN ?? 'https://questionwale.com').replace(/\/$/, '');
const root = process.cwd();
const failures = [];
const warnings = [];

function decodeHtml(value = '') {
  return value
    .replaceAll('&amp;', '&')
    .replaceAll('&quot;', '"')
    .replaceAll('&#x27;', "'")
    .replaceAll('&#39;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)));
}

function attr(tag, name) {
  const match = tag.match(new RegExp(`\\s${name}\\s*=\\s*["']([^"']*)["']`, 'i'));
  return match ? decodeHtml(match[1].trim()) : null;
}

function tags(html, tagName) {
  return [...html.matchAll(new RegExp(`<${tagName}\\b[^>]*>`, 'gi'))].map((match) => match[0]);
}

function textContent(value = '') {
  return decodeHtml(value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim());
}

function extractTitle(html) {
  return textContent(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? '');
}

function extractMeta(html, name) {
  return tags(html, 'meta')
    .find((tag) => (attr(tag, 'name') ?? '').toLowerCase() === name.toLowerCase())
    ? attr(
        tags(html, 'meta').find(
          (tag) => (attr(tag, 'name') ?? '').toLowerCase() === name.toLowerCase(),
        ),
        'content',
      ) ?? ''
    : '';
}

function extractCanonical(html) {
  const tag = tags(html, 'link').find((candidate) => {
    const rel = (attr(candidate, 'rel') ?? '').toLowerCase().split(/\s+/);
    return rel.includes('canonical');
  });
  return tag ? attr(tag, 'href') ?? '' : '';
}

function normalizePathname(value) {
  const pathname = new URL(value, expectedOrigin).pathname;
  return pathname === '/' ? '/' : pathname.replace(/\/$/, '');
}

function localUrl(value) {
  const parsed = new URL(value, expectedOrigin);
  return new URL(`${parsed.pathname}${parsed.search}`, base);
}

async function fetchRoute(value, options = {}) {
  const response = await fetch(localUrl(value), {
    redirect: options.redirect ?? 'follow',
    headers: { 'user-agent': 'QuestionWale-SEO-Audit/1.0' },
  });
  return { response, text: await response.text() };
}

async function concurrentMap(values, limit, fn) {
  const results = new Array(values.length);
  let cursor = 0;
  async function worker() {
    while (cursor < values.length) {
      const index = cursor++;
      try {
        results[index] = await fn(values[index], index);
      } catch (error) {
        results[index] = { error: error instanceof Error ? error.message : String(error) };
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, values.length || 1) }, worker));
  return results;
}

async function walkFiles(directory, filename, output = []) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) await walkFiles(fullPath, filename, output);
    else if (entry.name === filename) output.push(fullPath);
  }
  return output;
}

function routePattern(file, filename) {
  const relative = path.relative(path.join(root, 'app'), file).replaceAll('\\', '/');
  const segments = relative
    .slice(0, -(`/${filename}`.length))
    .split('/')
    .filter((segment) => segment && !(segment.startsWith('(') && segment.endsWith(')')));
  return `/${segments.join('/')}`.replace(/\/$/, '') || '/';
}

function addFailure(scope, detail) {
  failures.push({ scope, detail });
}

const pageFiles = await walkFiles(path.join(root, 'app'), 'page.tsx');
const handlerFiles = await walkFiles(path.join(root, 'app'), 'route.ts');
const routeInventory = {
  pages: pageFiles.map((file) => routePattern(file, 'page.tsx')).sort(),
  handlers: handlerFiles.map((file) => routePattern(file, 'route.ts')).sort(),
};

const robots = await fetchRoute('/robots.txt');
if (robots.response.status !== 200) addFailure('/robots.txt', `HTTP ${robots.response.status}`);
if (!robots.text.includes(`Sitemap: ${expectedOrigin}/sitemap.xml`)) {
  addFailure('/robots.txt', 'missing production sitemap declaration');
}
if (!/Disallow:\s*\/api\//i.test(robots.text) || !/Disallow:\s*\/auth\//i.test(robots.text)) {
  addFailure('/robots.txt', 'API/auth exclusions are incomplete');
}

const manifestResult = await fetchRoute('/manifest.webmanifest');
if (manifestResult.response.status !== 200) {
  addFailure('/manifest.webmanifest', `HTTP ${manifestResult.response.status}`);
} else {
  try {
    const manifest = JSON.parse(manifestResult.text);
    if (!manifest.name || !manifest.short_name || !manifest.start_url) {
      addFailure('/manifest.webmanifest', 'required identity fields are missing');
    }
  } catch {
    addFailure('/manifest.webmanifest', 'invalid JSON');
  }
}

const sitemapResult = await fetchRoute('/sitemap.xml');
if (sitemapResult.response.status !== 200) addFailure('/sitemap.xml', `HTTP ${sitemapResult.response.status}`);
const sitemapLocs = [...sitemapResult.text.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => decodeHtml(match[1].trim()));
if (new Set(sitemapLocs).size !== sitemapLocs.length) addFailure('/sitemap.xml', 'duplicate loc entries');
for (const loc of sitemapLocs) {
  try {
    if (new URL(loc).origin !== expectedOrigin) addFailure('/sitemap.xml', `wrong origin: ${loc}`);
  } catch {
    addFailure('/sitemap.xml', `invalid loc: ${loc}`);
  }
}

const crawled = await concurrentMap(sitemapLocs, 4, async (loc) => {
  const pathname = normalizePathname(loc);
  const { response, text } = await fetchRoute(loc);
  const title = extractTitle(text);
  const description = extractMeta(text, 'description');
  const robotsMeta = extractMeta(text, 'robots').toLowerCase();
  const canonical = extractCanonical(text);
  const headings = [...text.matchAll(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi)].map((match) => ({
    level: Number(match[1]),
    text: textContent(match[2]),
  }));
  const images = tags(text, 'img');
  const anchors = tags(text, 'a').map((tag) => attr(tag, 'href')).filter(Boolean);
  const jsonLd = [];

  for (const script of [...text.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)]) {
    try {
      const parsed = JSON.parse(script[1]);
      jsonLd.push(...(Array.isArray(parsed) ? parsed : [parsed]));
    } catch {
      addFailure(pathname, 'invalid JSON-LD');
    }
  }

  if (response.status !== 200) addFailure(pathname, `sitemap URL returned HTTP ${response.status}`);
  if (!title) addFailure(pathname, 'missing title');
  else if (title.length > 90) addFailure(pathname, `title is excessively long (${title.length} characters)`);
  if (!description) addFailure(pathname, 'missing meta description');
  else if (description.length > 165) addFailure(pathname, `meta description is excessively long (${description.length} characters)`);
  if (robotsMeta.includes('noindex')) addFailure(pathname, 'sitemap URL is noindex');
  if (!canonical) addFailure(pathname, 'missing canonical');
  else {
    const canonicalUrl = new URL(canonical, expectedOrigin);
    if (canonicalUrl.origin !== expectedOrigin || normalizePathname(canonicalUrl.href) !== pathname) {
      addFailure(pathname, `non-self canonical: ${canonical}`);
    }
  }

  const h1s = headings.filter((heading) => heading.level === 1);
  if (h1s.length !== 1) addFailure(pathname, `expected one H1, found ${h1s.length}`);
  for (let index = 1; index < headings.length; index += 1) {
    if (headings[index].level > headings[index - 1].level + 1) {
      addFailure(pathname, `heading jump H${headings[index - 1].level} → H${headings[index].level}`);
      break;
    }
  }
  for (const image of images) {
    if (attr(image, 'alt') === null) addFailure(pathname, 'image missing alt attribute');
  }

  const schemaTypes = jsonLd.flatMap((entry) => {
    const graph = Array.isArray(entry?.['@graph']) ? entry['@graph'] : [entry];
    return graph.map((node) => node?.['@type']).filter(Boolean);
  });
  if (schemaTypes.includes('FAQPage')) addFailure(pathname, 'deprecated FAQPage schema is present');
  if (pathname !== '/' && (schemaTypes.includes('WebSite') || schemaTypes.includes('Organization'))) {
    addFailure(pathname, 'site identity schema must appear on the homepage only');
  }
  if (/^\/exams\/[^/]+(?:\/[^/]+){0,2}$/.test(pathname) && !schemaTypes.includes('BreadcrumbList')) {
    addFailure(pathname, 'public exam landing page is missing BreadcrumbList');
  }

  return { loc, pathname, status: response.status, title, description, canonical, robotsMeta, headings, anchors, schemaTypes };
});

const successfulPages = crawled.filter((page) => page && !page.error);
for (const field of ['title', 'description']) {
  const groups = new Map();
  for (const page of successfulPages) {
    const value = page[field]?.trim().toLowerCase();
    if (!value) continue;
    groups.set(value, [...(groups.get(value) ?? []), page.pathname]);
  }
  for (const paths of groups.values()) {
    if (paths.length > 1) addFailure('duplicates', `${field}: ${paths.join(', ')}`);
  }
}

const sitemapPaths = new Set(successfulPages.map((page) => page.pathname));
const incoming = new Map([...sitemapPaths].map((pathname) => [pathname, 0]));
const internalLinks = new Set();
for (const page of successfulPages) {
  for (const href of page.anchors) {
    if (/^(#|mailto:|tel:|javascript:)/i.test(href)) continue;
    let parsed;
    try {
      parsed = new URL(href, expectedOrigin);
    } catch {
      addFailure(page.pathname, `invalid href: ${href}`);
      continue;
    }
    if (parsed.origin !== expectedOrigin || parsed.pathname.startsWith('/api/')) continue;
    const targetPath = normalizePathname(parsed.href);
    internalLinks.add(`${parsed.pathname}${parsed.search}`);
    if (sitemapPaths.has(targetPath) && targetPath !== page.pathname) {
      incoming.set(targetPath, (incoming.get(targetPath) ?? 0) + 1);
    }
  }
}

const structuralLinkChecks = [];
const linksToFetch = [];
for (const href of internalLinks) {
  const parsed = new URL(href, expectedOrigin);
  const pathname = normalizePathname(parsed.href);
  const isDeepPractice = /^\/subjects\/[^/]+\/[^/]+\/practice(?:\/[^/]+)?$/.test(pathname);
  const isPublicExamSubtopic = /^\/exams\/[^/]+\/[^/]+\/[^/]+\/[^/]+$/.test(pathname);
  const isLegacyQuiz = /^\/[^/]+\/topics\/[^/]+$/.test(pathname);
  if (sitemapPaths.has(pathname) || isDeepPractice || isPublicExamSubtopic || isLegacyQuiz) {
    structuralLinkChecks.push({
      href,
      status: sitemapPaths.has(pathname) ? 200 : 'structural',
      mode: sitemapPaths.has(pathname) ? 'sitemap-crawl' : 'route-structure',
    });
  } else {
    linksToFetch.push(href);
  }
}

const fetchedLinkChecks = await concurrentMap(linksToFetch, 6, async (href) => {
  const { response } = await fetchRoute(href);
  if (response.status >= 400) addFailure('internal-links', `${href} → HTTP ${response.status}`);
  return { href, status: response.status, mode: 'http' };
});
const linkChecks = [...structuralLinkChecks, ...fetchedLinkChecks];
const orphans = [...incoming.entries()]
  .filter(([pathname, count]) => pathname !== '/' && count === 0)
  .map(([pathname]) => pathname);
if (orphans.length) warnings.push({ scope: 'orphans', detail: orphans.join(', ') });

const noindexPaths = ['/classic', '/demo', '/examples/seo-example', '/loading-test'];
const noindexChecks = await concurrentMap(noindexPaths, 4, async (pathname) => {
  const { response, text } = await fetchRoute(pathname);
  const robotsMeta = extractMeta(text, 'robots').toLowerCase();
  if (response.status !== 200) addFailure(pathname, `expected HTTP 200, found ${response.status}`);
  if (!robotsMeta.includes('noindex')) addFailure(pathname, 'expected noindex');
  return { pathname, status: response.status, robotsMeta };
});

const redirectExpectations = new Map([
  ['/pcb_page', '/science'],
  ['/pyq', '/subjects'],
]);
const redirectChecks = [];
for (const [pathname, expectedLocation] of redirectExpectations) {
  const { response } = await fetchRoute(pathname, { redirect: 'manual' });
  const location = response.headers.get('location') ?? '';
  if (![301, 308].includes(response.status) || normalizePathname(location) !== expectedLocation) {
    addFailure(pathname, `expected permanent redirect to ${expectedLocation}, found ${response.status} ${location}`);
  }
  redirectChecks.push({ pathname, status: response.status, location });
}

const queryCanonicalResult = await fetchRoute('/exams/ssc-cgl?stage=TIER_I');
const queryCanonical = extractCanonical(queryCanonicalResult.text);
if (normalizePathname(queryCanonical) !== '/exams/ssc-cgl') {
  addFailure('query-canonical', `stage variant canonical is ${queryCanonical || 'missing'}`);
}

const searchResponse = await fetchRoute('/api/home/search');
let searchItems = [];
try {
  const parsed = JSON.parse(searchResponse.text);
  searchItems = Array.isArray(parsed.items) ? parsed.items : [];
} catch {
  addFailure('/api/home/search', 'invalid JSON');
}
if (!searchItems.length) addFailure('/api/home/search', 'empty search catalog');
const seenSearchIds = new Set();
const seenSearchHrefs = new Set();
const catalogChecks = searchItems.map((item) => {
  const href = typeof item.href === 'string' ? item.href : '';
  const parsed = new URL(href || '/', expectedOrigin);
  const segments = parsed.pathname.split('/').filter(Boolean);
  const structurallyValid =
    parsed.origin === expectedOrigin &&
    segments[0] === 'subjects' &&
    ((item.type === 'subject' && segments.length === 2) ||
      (item.type === 'topic' && segments.length === 3) ||
      (item.type === 'subtopic' && segments.length === 5 && segments[3] === 'practice'));
  if (!item.id || seenSearchIds.has(item.id)) {
    addFailure('search-catalog', `missing or duplicate id: ${String(item.id)}`);
  }
  if (!href || seenSearchHrefs.has(href)) {
    addFailure('search-catalog', `missing or duplicate href: ${href || '(empty)'}`);
  }
  if (!structurallyValid) {
    addFailure('search-catalog', `${item.type ?? 'unknown'} has invalid canonical path: ${href}`);
  }
  seenSearchIds.add(item.id);
  seenSearchHrefs.add(href);
  return { id: item.id, type: item.type, href, structurallyValid };
});

const report = {
  generatedAt: new Date().toISOString(),
  base: base.origin,
  expectedOrigin,
  routeInventory,
  counts: {
    pagePatterns: routeInventory.pages.length,
    handlerPatterns: routeInventory.handlers.length,
    sitemapUrls: sitemapLocs.length,
    crawledSitemapUrls: successfulPages.length,
    internalLinksChecked: linkChecks.length,
    internalLinksFetched: fetchedLinkChecks.length,
    searchItems: searchItems.length,
    catalogPathsChecked: catalogChecks.length,
    orphanSitemapPages: orphans.length,
    failures: failures.length,
    warnings: warnings.length,
  },
  robots: { status: robots.response.status, body: robots.text },
  sitemap: { status: sitemapResult.response.status, locs: sitemapLocs },
  pages: successfulPages,
  internalLinks: linkChecks,
  noindexChecks,
  redirectChecks,
  searchCatalog: { items: searchItems.length, checks: catalogChecks },
  orphans,
  failures,
  warnings,
};

const outputDirectory = path.join(root, 'test-results', 'seo');
await mkdir(outputDirectory, { recursive: true });
await writeFile(path.join(outputDirectory, 'audit-results.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');

console.log(`INFO routes: ${routeInventory.pages.length} pages + ${routeInventory.handlers.length} handlers`);
console.log(`INFO sitemap: ${sitemapLocs.length} URLs; links: ${linkChecks.length}; search items: ${searchItems.length}`);
console.log(`INFO orphan sitemap pages: ${orphans.length}`);
for (const warning of warnings) console.warn(`WARN ${warning.scope}: ${warning.detail}`);
for (const failure of failures) console.error(`FAIL ${failure.scope}: ${failure.detail}`);

if (failures.length) {
  console.error(`\nSEO audit failed with ${failures.length} issue(s).`);
  process.exit(1);
}

console.log('\nSEO audit passed.');

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { contentCanStartPractice, derivePublicContentStatus } from './contentStatus.ts';
import { serializeJsonLd } from './jsonLd.ts';
import { absoluteUrl, buildCatalogTopicMetadata, buildPageMetadata } from './seo.ts';
import { meaningfulCatalogDescription } from './catalogDescription.ts';
import {
  isPermanentlyRemovedLegacyTopicPath,
  permanentlyRemovedLegacyTopicPaths,
} from './legacyRouteTombstones.ts';

test('only active content with published questions can start practice', () => {
  assert.equal(derivePublicContentStatus({ isActive: true, questionCount: 12 }), 'active');
  assert.equal(derivePublicContentStatus({ isActive: true, questionCount: 0 }), 'coming_soon');
  assert.equal(derivePublicContentStatus({ isActive: false, questionCount: 12 }), 'archived');
  assert.equal(derivePublicContentStatus({ isListed: false, isActive: true, questionCount: 12 }), 'hidden');
  assert.equal(contentCanStartPractice('active'), true);
  assert.equal(contentCanStartPractice('coming_soon'), false);
  assert.equal(contentCanStartPractice('archived'), false);
  assert.equal(contentCanStartPractice('hidden'), false);
});

test('generic import descriptions are suppressed but authored copy is preserved', () => {
  assert.equal(meaningfulCatalogDescription('MCQ course module'), null);
  assert.equal(meaningfulCatalogDescription('Monetary Policy MCQ course module.'), null);
  assert.equal(
    meaningfulCatalogDescription('Covers monetary policy tools and their published subtopics.'),
    'Covers monetary policy tools and their published subtopics.',
  );
});

test('filter parameters never enter canonical or social URLs', () => {
  const metadata = buildPageMetadata({
    title: 'Indian Polity Topics',
    description: 'Published Indian Polity topics and MCQ practice.',
    path: '/subjects/indian-polity',
  });
  assert.equal(metadata.alternates?.canonical, absoluteUrl('/subjects/indian-polity'));
  assert.equal(metadata.openGraph?.url, absoluteUrl('/subjects/indian-polity'));
  assert.doesNotMatch(String(metadata.alternates?.canonical), /[?&](exam|stage|utm_)/i);
});

test('JSON-LD remains valid and cannot close its script element', () => {
  const serialized = serializeJsonLd({
    '@context': 'https://schema.org',
    name: '</script><script>alert(1)</script>',
  });
  assert.deepEqual(JSON.parse(serialized), {
    '@context': 'https://schema.org',
    name: '</script><script>alert(1)</script>',
  });
  assert.doesNotMatch(serialized, /</);
});

test('sitemap source excludes legacy and practice-state URLs', () => {
  const sitemap = readFileSync('app/sitemap.ts', 'utf8');
  const catalog = readFileSync('lib/sitemapCatalog.ts', 'utf8');
  assert.doesNotMatch(sitemap, /LEGACY_SUBJECTS|\?exam=|\/practice/);
  assert.doesNotMatch(catalog, /\?exam=/);
  assert.match(catalog, /Practice sessions stay noindex/);
  assert.match(catalog, /getPublicExamSyllabusStrict/, 'temporary syllabus failures cannot masquerade as an empty sitemap');
  assert.match(sitemap, /Number\.isFinite\(parsed\.getTime\(\)\)/, 'unparseable lastmod values are omitted');
});

test('legacy SSC CGL URLs preserve hierarchy and redirect to the public canonical', () => {
  const config = readFileSync('next.config.mjs', 'utf8');
  assert.match(config, /source: '\/exams\/ssc-combined-graduate-level-examination'[\s\S]*destination: '\/exams\/ssc-cgl'/);
  assert.match(config, /source: '\/exams\/ssc-combined-graduate-level-examination\/:path\*'[\s\S]*destination: '\/exams\/ssc-cgl\/:path\*'/);
  assert.doesNotMatch(config, /source: '\/bali\/:path\*'/);
});

test('legacy empty quizzes use exact replacements or a real not-found response', () => {
  const source = readFileSync('app/[subject]/topics/[topicSlug]/page.tsx', 'utf8');
  assert.match(source, /findLegacyTopicReplacement/);
  assert.match(source, /permanentRedirect\(resolved\.destination\)/);
  assert.match(source, /generateMetadata[\s\S]*resolveLegacyTopicRoute[\s\S]*notFound\(\)/);
  assert.match(source, /cache\(async \(subjectKey/, 'metadata and page share one legacy lookup');
  assert.match(source, /if \(unavailable\)/, 'temporary question-store failures become server errors, not false 404s');
  assert.match(source, /if \(!questions\.length\) notFound\(\)/);
});

test('verified permanently empty legacy quizzes return a request-boundary tombstone', () => {
  assert.equal(permanentlyRemovedLegacyTopicPaths().length, 6);
  assert.equal(
    isPermanentlyRemovedLegacyTopicPath('/economics/topics/social-security'),
    true,
  );
  assert.equal(
    isPermanentlyRemovedLegacyTopicPath('/economics/topics/a-real-future-topic'),
    false,
  );
  const proxy = readFileSync('proxy.ts', 'utf8');
  assert.match(proxy, /isPermanentlyRemovedLegacyTopicPath[\s\S]*goneResponse\(\)/);
  assert.match(proxy, /status: 410/);
  assert.match(proxy, /X-Robots-Tag': 'noindex, follow'/);
});

test('homepage statuses and CTAs come from published catalogue counts', () => {
  const subjects = readFileSync('app/home/components/HomeSubjects.tsx', 'utf8');
  const examExplorer = readFileSync('app/home/components/PublicExamExplorer.tsx', 'utf8');
  assert.match(subjects, /derivePublicContentStatus/);
  assert.doesNotMatch(subjects, /state="active"|18 Topics|Notify Me/);
  assert.match(examExplorer, /PublicExamExplorerOption/);
  assert.doesNotMatch(examExplorer, /AVAILABLE_EXAMS|UPCOMING_EXAMS/);
});

test('page metadata leaves the site-name suffix to the root title template', () => {
  const metadata = buildPageMetadata({
    title: 'SSC CGL Syllabus and MCQ Practice',
    description: 'Published SSC CGL subjects, topics, subtopics and available question counts.',
    path: '/exams/ssc-cgl',
  });
  assert.equal(metadata.title, 'SSC CGL Syllabus and MCQ Practice');
  assert.doesNotMatch(String(metadata.title), /QuestionWale/i);
});

test('long reasoning topic names remain distinguishable in search titles', () => {
  const symbolic = buildCatalogTopicMetadata(
    'Coding, Decoding and Symbolic Operations',
    'Reasoning and General Intelligence',
    'reasoning',
    'coding-decoding-symbolic-operations',
  );
  const operations = buildCatalogTopicMetadata(
    'Coding, Decoding and Operations',
    'Reasoning and General Intelligence',
    'reasoning',
    'coding-decoding-operations',
  );
  assert.notEqual(symbolic.title, operations.title);
  assert.match(String(symbolic.title), /Symbolic Operations/);
});

test('invalid public exam slugs fail before metadata streaming can create a soft 404', () => {
  const publicExamPage = readFileSync('app/exams/[examSlug]/page.tsx', 'utf8');
  const metadataBody = publicExamPage.match(
    /export async function generateMetadata[\s\S]*?\n\}/,
  )?.[0] ?? '';
  assert.match(metadataBody, /if \(!snapshot[\s\S]*?notFound\(\)/);
  assert.doesNotMatch(metadataBody, /Exam syllabus not found/);
});

test('exam subject descriptions are scoped to the exam and cannot duplicate catalog metadata', () => {
  const subjectPage = readFileSync('app/exams/[examSlug]/[subjectSlug]/page.tsx', 'utf8');
  assert.match(subjectPage, /in the published \$\{examName\} syllabus/);
  assert.match(subjectPage, /if \(!snapshot \|\| !subject\) notFound\(\)/);
});

test('invalid public exam descendants fail during metadata generation', () => {
  const topicPage = readFileSync('app/exams/[examSlug]/[subjectSlug]/[topicSlug]/page.tsx', 'utf8');
  const subtopicPage = readFileSync(
    'app/exams/[examSlug]/[subjectSlug]/[topicSlug]/[subtopicSlug]/page.tsx',
    'utf8',
  );
  assert.match(topicPage, /if \(!snapshot \|\| !subject \|\| !topic\) notFound\(\)/);
  assert.match(subtopicPage, /if \(!resolved\) notFound\(\)/);
});

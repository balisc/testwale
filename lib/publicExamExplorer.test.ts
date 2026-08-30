import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const loader = readFileSync('lib/publicExamExplorer.ts', 'utf8');
const catalogue = readFileSync('lib/examCatalogueServer.ts', 'utf8');
assert.match(loader, /const PUBLIC_CGL_SLUG = 'ssc-cgl'/);
assert.match(catalogue, /from\('exam_selector_options'\)[\s\S]*eq\('can_select', true\)[\s\S]*eq\('is_coming_soon', false\)/);
assert.match(catalogue, /__questionWaleReadyExamSelectorInFlight/, 'concurrent routes share one selector readiness read');
assert.match(loader, /getReadyExamSelectorOptions/, 'public explorer shares the authoritative cached selector query');
assert.match(loader, /getPublicExamSelectorOptionsStrict/, 'sitemap can distinguish an outage from zero exams');
assert.match(loader, /getPublicExamSyllabusStrict/, 'sitemap propagates syllabus infrastructure failures');
assert.match(loader, /getPublicExamPathIndexStrict/, '404 preflight has a lightweight published-node index');
assert.match(loader, /public-exam-path-index-v1/);
assert.doesNotMatch(
  readFileSync('app/api/catalog/path-exists/route.ts', 'utf8'),
  /getPublicExamSyllabusStrict/,
  'path existence never triggers exact question-count scans',
);
assert.match(loader, /function publicExamHref[\s\S]*'\/exams\/ssc-cgl'/);
assert.doesNotMatch(loader, /href: option\.exam_code === 'SSC_CGL' \? '\/ssc-cgl'/);
assert.doesNotMatch(loader, /FALLBACK|SSC_OPTION_FALLBACK_LABELS|PREFERRED_SSC_CODES/);
assert.match(loader, /public-exam-syllabus-v1/);
assert.match(loader, /publicExamSyllabusInFlight/, 'concurrent route crawls share one syllabus load');
assert.match(loader, /normalizedSlug[\s\S]*normalizedStageCode \?\? 'all-stages'/, 'public syllabus cache keys separate every exam and stage');
assert.match(loader, /catch \(error\)[\s\S]*\[public-exam-syllabus\]/, 'transient public syllabus failures are handled outside unstable_cache');

const explorer = readFileSync('app/home/components/PublicExamExplorer.tsx', 'utf8');
assert.match(explorer, /Choose Your SSC Exam/);
assert.match(explorer, /PublicExamExplorerOption/);
assert.match(explorer, /exam\.isAvailable && exam\.href/);
assert.match(explorer, /exam\.code\.startsWith\('SSC_'\)/);
assert.match(explorer, /View subjects/);
assert.doesNotMatch(explorer, /<ExamSubjectsGrid|snapshot=|Choose SSC CGL Tier|href="\/ssc-cgl"/, 'homepage shows exam cards only and never exposes Tier selection');
assert.doesNotMatch(explorer, /AVAILABLE_EXAMS|UPCOMING_EXAMS|Locked · Coming soon/, 'exam state is never hardcoded in homepage copy');

const homepage = readFileSync('app/page.tsx', 'utf8');
assert.match(homepage, /Promise\.all\([\s\S]*getHomeData\(\)[\s\S]*getPublicExamSelectorOptions\(\)/, 'homepage loads cached aggregates in parallel');
assert.match(homepage, /<PublicExamExplorer options=\{publicExamOptions\} \/>/);
assert.match(homepage, /<HomeSubjects subjectCounts=\{homeData\.subjectCounts\} \/>/, 'homepage availability uses authoritative published counts');
assert.doesNotMatch(homepage, /HomeExamStrip/, 'homepage exam area uses only the four requested exam cards');

const catalogCache = readFileSync('lib/catalogCache.ts', 'utf8');
assert.match(catalogCache, /collectCatalogRows/);
assert.match(catalogCache, /\.range\(from, to\)/, 'catalog pagination loads content beyond Supabase\'s first 1,000 rows');
assert.match(catalogCache, /catalog-snapshot-v5/, 'the previously incomplete catalog cache is invalidated');
assert.match(catalogCache, /Incomplete catalog snapshot/, 'partial catalog responses cannot be cached as valid empty data');
assert.match(catalogCache, /attempt <= 2/, 'transient catalog failures receive one immediate retry');
assert.doesNotMatch(
  catalogCache,
  /catch[\s\S]{0,500}return EMPTY_SNAPSHOT/,
  'configured Supabase failures must throw instead of poisoning the shared cache with an empty snapshot',
);

const publicExamPage = readFileSync('app/exams/[examSlug]/page.tsx', 'utf8');
assert.match(publicExamPage, /getPublicExamSyllabusStrict\(examSlug, stageCode\)/);
assert.match(publicExamPage, /<ExamSubjectsGrid[\s\S]*snapshot=\{snapshot\}[\s\S]*publicExamHref=\{canonicalPath\}[\s\S]*stageCode=\{stageCode\}/);
assert.match(publicExamPage, /Available questions[\s\S]*questionCount/, 'public exam page labels its exam-scoped total precisely');

console.log('publicExamExplorer tests passed');

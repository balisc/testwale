import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const loader = readFileSync('lib/publicExamExplorer.ts', 'utf8');
const catalogue = readFileSync('lib/examCatalogueServer.ts', 'utf8');
assert.match(loader, /const PUBLIC_CGL_SLUG = 'ssc-cgl'/);
assert.match(catalogue, /from\('exam_selector_options'\)[\s\S]*eq\('can_select', true\)[\s\S]*eq\('is_coming_soon', false\)/);
assert.match(loader, /getReadyExamSelectorOptions/, 'public explorer shares the authoritative cached selector query');
assert.match(loader, /option\.exam_code === 'SSC_CGL' \? '\/ssc-cgl' : `\/exams\/\$\{option\.exam_slug\}`/);
assert.doesNotMatch(loader, /FALLBACK|SSC_OPTION_FALLBACK_LABELS|PREFERRED_SSC_CODES/);

const explorer = readFileSync('app/home/components/PublicExamExplorer.tsx', 'utf8');
assert.match(explorer, /Choose Your SSC Exam/);
assert.match(explorer, /SSC CGL/);
assert.match(explorer, /SSC CHSL/);
assert.match(explorer, /SSC MTS/);
assert.match(explorer, /SSC GD Constable/);
assert.match(explorer, /href="\/exams\/ssc-cgl"/);
assert.match(explorer, /View subjects/);
assert.doesNotMatch(explorer, /<ExamSubjectsGrid|snapshot=|Choose SSC CGL Tier|href="\/ssc-cgl"/, 'homepage shows exam cards only and never exposes Tier selection');
assert.match(explorer, /aria-disabled="true"/);
assert.match(explorer, /Locked · Coming soon/);
assert.doesNotMatch(explorer, /FALLBACK_OPTIONS/);

const homepage = readFileSync('app/page.tsx', 'utf8');
assert.match(homepage, /<PublicExamExplorer \/>/);
assert.match(homepage, /<HomeSubjects subjectCounts=\{\{\}\} \/>/, 'guest homepage restores the subject section without a blocking count query');
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
assert.match(publicExamPage, /getPublicExamSyllabus\(examSlug, stageCode\)/);
assert.match(publicExamPage, /<ExamSubjectsGrid snapshot=\{snapshot\} publicExamHref=[\s\S]*stageCode=\{stageCode\}/);

console.log('publicExamExplorer tests passed');

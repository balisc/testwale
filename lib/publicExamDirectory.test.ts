import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import type { ExamSelectorOption } from './examSelector.ts';
import type { PublicMockExamSummary } from './mockTests/showcase.ts';
import {
  PUBLIC_EXAM_NAV_LIMIT,
  buildPublicExamDirectory,
  isCurrentExamPath,
  isExamNavigationPath,
  publicExamCanonicalPath,
  toPublicExamNavigationEntries,
} from './publicExamDirectory.ts';

function option(overrides: Partial<ExamSelectorOption> = {}): ExamSelectorOption {
  return {
    exam_profile_id: 'profile-test-only',
    content_exam_id: 'content-test-only',
    exam_code: 'SSC_CHSL',
    exam_slug: 'ssc-combined-higher-secondary-level-examination',
    official_title: { en: 'Combined Higher Secondary Level Examination', hi: 'संयुक्त उच्चतर माध्यमिक स्तर परीक्षा' },
    short_name: 'SSC CHSL',
    display_title: { en: 'SSC CHSL', hi: 'एसएससी सीएचएसएल' },
    family_code: 'SSC',
    content_family_code: 'SSC_CHSL',
    conducting_body: 'SSC',
    profile_category: 'competitive_exam',
    product_group: 'ssc',
    recurrence_status: 'recurring',
    scope_status: 'ready',
    can_select: true,
    is_coming_soon: false,
    availability_reason: null,
    sort_order: 20,
    active_subject_count: 4,
    active_topic_count: 24,
    active_subtopic_count: 96,
    verified_question_count: 1400,
    ...overrides,
  };
}

function mock(overrides: Partial<PublicMockExamSummary> = {}): PublicMockExamSummary {
  return {
    id: 'ssc-chsl',
    examKey: 'ssc-chsl',
    examCode: 'SSC_CHSL',
    publicName: 'SSC CHSL',
    examSlug: 'ssc-combined-higher-secondary-level-examination',
    tier: 'Tier 1',
    questionCount: 100,
    maxMarks: 200,
    durationMinutes: 60,
    negativeMarking: 0.5,
    timerMode: 'global',
    timerLabel: '60 min global timer',
    sectionNames: ['Reasoning', 'General Awareness', 'Maths', 'English'],
    availability: 'available',
    destination: '/mock-tests/ssc-chsl',
    displayPriority: 20,
    ...overrides,
  };
}

test('directory includes only exact, published-ready exam options in stable priority order', () => {
  const future = option({
    exam_profile_id: 'future-profile',
    content_exam_id: 'future-content',
    exam_code: 'RRB_NTPC',
    exam_slug: 'rrb-ntpc',
    short_name: 'RRB NTPC',
    official_title: { en: 'Railway Recruitment Board NTPC' },
    sort_order: 5,
  });
  const inactive = option({ exam_code: 'DRAFT_EXAM', exam_slug: 'draft-exam', can_select: false });
  const comingSoon = option({ exam_code: 'ARCHIVED_EXAM', exam_slug: 'archived-exam', is_coming_soon: true });
  const noQuestions = option({ exam_code: 'EMPTY_EXAM', exam_slug: 'empty-exam', verified_question_count: 0 });
  const invalidSlug = option({ exam_code: 'INVALID_EXAM', exam_slug: '../admin' });

  const directory = buildPublicExamDirectory(
    [option(), inactive, comingSoon, noQuestions, invalidSlug, future],
    [mock()],
  );

  assert.deepEqual(directory.map((entry) => entry.code), ['RRB_NTPC', 'SSC_CHSL']);
  assert.equal(directory[0]?.canonicalPath, '/exams/rrb-ntpc');
  assert.equal(directory[1]?.mockAvailable, true);
  assert.equal(directory[1]?.mockPath, '/mock-tests/ssc-chsl');
});

test('mock readiness controls only the optional badge and mock link', () => {
  const directory = buildPublicExamDirectory([option()], [mock({ availability: 'coming_soon' })]);
  assert.equal(directory.length, 1, 'public syllabus remains listed while its mock is not ready');
  assert.equal(directory[0]?.mockAvailable, false);
  assert.equal(directory[0]?.mockPath, '/mock-tests/ssc-chsl');
});

test('navbar projection is capped and excludes catalogue counts from the client payload', () => {
  const directory = buildPublicExamDirectory([option()], [mock()]);
  const navEntries = toPublicExamNavigationEntries(directory);
  assert.deepEqual(Object.keys(navEntries[0]!).sort(), [
    'canonicalPath',
    'code',
    'mockAvailable',
    'mockPath',
    'publicTitle',
    'shortName',
  ]);
  assert.equal('verifiedQuestionCount' in navEntries[0]!, false);
});

test('canonical paths validate database slugs and preserve the existing CGL short URL', () => {
  assert.equal(
    publicExamCanonicalPath('SSC_CGL', 'ssc-combined-graduate-level-examination'),
    '/exams/ssc-cgl',
  );
  assert.equal(publicExamCanonicalPath('UPSC_CSE', 'upsc-civil-services'), '/exams/upsc-civil-services');
  assert.equal(publicExamCanonicalPath('UPSC_CSE', 'unsafe/path'), null);
  assert.equal(publicExamCanonicalPath('unsafe code', 'safe-slug'), null);
});

test('active route state distinguishes the exact link from its exam descendants', () => {
  const exam = buildPublicExamDirectory([option()], [mock()])[0]!;
  assert.equal(isExamNavigationPath('/exams', [exam]), true);
  assert.equal(isExamNavigationPath('/exams/example/subject', [exam]), true);
  assert.equal(isExamNavigationPath('/mock-tests/ssc-chsl', [exam]), true);
  assert.equal(isCurrentExamPath('/exams/ssc-combined-higher-secondary-level-examination/topic', exam), true);
  assert.equal(isCurrentExamPath('/subjects', exam), false);
});

test('navbar uses server-provided entries and accessible desktop/mobile controls', () => {
  const header = readFileSync('app/home/components/HomeHeader.tsx', 'utf8');
  const examNavigation = readFileSync('app/home/components/ExamNavigation.tsx', 'utf8');
  const layout = readFileSync('app/layout.tsx', 'utf8');
  assert.equal(PUBLIC_EXAM_NAV_LIMIT, 6);
  assert.match(header, /Home[\s\S]*DesktopExamNavigation[\s\S]*Subjects[\s\S]*About Us[\s\S]*Contact/);
  assert.match(examNavigation, /<Link[\s\S]*href="\/exams"[\s\S]*>\s*Exams/);
  assert.match(examNavigation, /href=\{exam\.canonicalPath\}/);
  assert.match(examNavigation, /aria-expanded=\{open\}[\s\S]*aria-controls="desktop-exams-navigation"/);
  assert.match(examNavigation, /event\.key !== 'Escape'[\s\S]*closeMenu\(true\)/);
  assert.match(examNavigation, /document\.addEventListener\('pointerdown'/);
  assert.match(examNavigation, /event\.currentTarget\.contains\(event\.relatedTarget/);
  assert.match(examNavigation, /aria-expanded=\{expanded\}[\s\S]*aria-controls="mobile-exams-navigation"/);
  assert.match(examNavigation, /min-h-11 min-w-11/, 'mobile accordion trigger is at least 44 by 44 pixels');
  assert.match(examNavigation, /break-words/, 'long Hindi titles can wrap without horizontal overflow');
  assert.match(layout, /toPublicExamNavigationEntries\(await getPublicExamDirectory\(\)\)[\s\S]*publicExams=\{publicExams\}/);
  assert.doesNotMatch(header, /SSC_CGL|SSC_CHSL|exam_profile_id|user_id/);
});

test('exam index, breadcrumbs and sitemap expose only canonical public discovery URLs', () => {
  const indexPage = readFileSync('app/exams/page.tsx', 'utf8');
  const detailPage = readFileSync('app/exams/[examSlug]/page.tsx', 'utf8');
  const footer = readFileSync('app/home/components/HomeFooter.tsx', 'utf8');
  const hero = readFileSync('app/home/components/HomeHero.tsx', 'utf8');
  const sitemap = readFileSync('app/sitemap.ts', 'utf8');
  const sitemapCatalog = readFileSync('lib/sitemapCatalog.ts', 'utf8');
  const proxy = readFileSync('proxy.ts', 'utf8');
  assert.match(indexPage, /Competitive Exams and Mock Tests/);
  assert.match(indexPage, /path: '\/exams'/);
  assert.match(indexPage, /buildBreadcrumbListSchema/);
  assert.match(indexPage, /href=\{exam\.canonicalPath\}/);
  assert.match(indexPage, /exam\.mockAvailable && exam\.mockPath/);
  assert.match(readFileSync('app/mock-tests/ssc-chsl/page.tsx', 'utf8'), /<h1[\s\S]*SSC CHSL Tier 1 Full Mock Tests/);
  assert.match(detailPage, /\{ label: 'Exams', href: '\/exams' \}/);
  assert.match(sitemap, /\{ path: '\/exams', priority: 0\.95 \}/);
  assert.match(sitemapCatalog, /getPublicExamDirectoryStrict/);
  assert.match(sitemapCatalog, /exam\.mockAvailable && exam\.mockPath/);
  assert.doesNotMatch(sitemapCatalog, /mock-tests\/\$\{.*id|user_id|attempt/i);
  assert.doesNotMatch(`${footer}\n${hero}`, /#public-exam-explorer/, 'exam-directory calls to action use the permanent URL');
  assert.match(proxy, /'subjects',[\s\S]*'exams',[\s\S]*'about_us'/, 'the permanent /exams route bypasses unknown top-level rejection');
});

console.log('public exam directory and navigation tests passed');

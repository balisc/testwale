import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  SSC_CGL_STAGES,
  buildSscCglTaxonomy,
  findSscCglRouteNodes,
  findSscCglSubject,
  findSscCglTopic,
  getSscCglLegacyRedirect,
  getSscCglQuestionsHref,
  getSscCglSubtopicsHref,
  getSscCglTopicsHref,
  isSscCglExamCode,
  normalizeSscCglSkillTests,
  parseSscCglRoute,
  type SscCglSkillTestViewRow,
  type SscCglTaxonomyViewRow,
} from './sscCglSyllabus';

const expectedStages = [
  ['TIER_I', 'SSC_CGL_TIER_1', 'ssc_cgl_tier_1_taxonomy_v2', '/ssc-cgl/tier-1/subjects'],
  ['TIER_II_PAPER_I', 'SSC_CGL_TIER_2_PAPER_1', 'ssc_cgl_tier_2_paper_1_taxonomy_v2', '/ssc-cgl/tier-2/paper-1/subjects'],
  ['TIER_II_PAPER_II', 'SSC_CGL_TIER_2_PAPER_2', 'ssc_cgl_tier_2_paper_2_taxonomy_v2', '/ssc-cgl/tier-2/paper-2/subjects'],
  ['TIER_II_PAPER_III', 'SSC_CGL_TIER_2_PAPER_3', 'ssc_cgl_tier_2_paper_3_taxonomy_v2', '/ssc-cgl/tier-2/paper-3/subjects'],
];
assert.deepEqual(
  SSC_CGL_STAGES.map((stage) => [stage.code, stage.tag, stage.view, stage.href]),
  expectedStages,
  'each stage has a dedicated audited view and canonical subjects page',
);
assert.equal(isSscCglExamCode('ssc-cgl'), true);
assert.equal(isSscCglExamCode('SSC_CGL'), true);
assert.equal(isSscCglExamCode('SSC_CHSL'), false);

function taxonomyRow(stageIndex: number, overrides: Partial<SscCglTaxonomyViewRow> = {}): SscCglTaxonomyViewRow {
  const stage = SSC_CGL_STAGES[stageIndex]!;
  return {
    exam_profile_code: 'SSC_CGL',
    syllabus_version_code: 'SSC_CGL_TEST',
    tier_code: stage.tier === 'tier-1' ? 'TIER_1' : 'TIER_2',
    tier_label: stage.tier === 'tier-1' ? { en: 'Tier 1' } : { en: 'Tier 2' },
    tier_sort_order: stage.tier === 'tier-1' ? 1 : 2,
    paper_code: stage.paper?.toUpperCase().replace('-', '_') ?? null,
    paper_label: stage.label,
    stage_code: stage.code,
    stage_tag: stage.tag,
    stage_sort_order: stageIndex + 1,
    subject_id: 'subject-1',
    subject_code: 'SUBJ_REASONING',
    subject_title: { en: 'Reasoning', hi: 'तर्कशक्ति' },
    subject_description: { en: 'Reasoning syllabus', hi: 'तर्कशक्ति पाठ्यक्रम' },
    subject_sort_order: 1,
    topic_id: 'topic-1',
    topic_code: 'REASONING_ANALOGY',
    topic_title: { en: 'Analogy', hi: 'सादृश्य' },
    topic_description: null,
    topic_sort_order: 1,
    subtopic_id: 'subtopic-1',
    subtopic_code: 'REASONING_SEMANTIC_ANALOGY',
    subtopic_title: { en: 'Semantic Analogy', hi: 'शाब्दिक सादृश्य' },
    subtopic_description: null,
    subtopic_source_locator: 'notice:test',
    subtopic_sort_order: 1,
    is_objective: true,
    is_qualifying: false,
    content_generation_allowed: true,
    navigation_visible: true,
    is_shared_between_tiers: true,
    ...overrides,
  };
}

const tierOneRows = [
  taxonomyRow(0, { subtopic_id: 'subtopic-2', subtopic_code: 'REASONING_WORD_ANALOGY', subtopic_sort_order: 2 }),
  taxonomyRow(0),
  taxonomyRow(0),
  taxonomyRow(0, {
    topic_id: 'topic-2', topic_code: 'REASONING_CLASSIFICATION', topic_title: { en: 'Classification' },
    topic_sort_order: 2, subtopic_id: 'subtopic-3', subtopic_code: 'REASONING_WORD_CLASSIFICATION',
  }),
];
const tierOne = buildSscCglTaxonomy(SSC_CGL_STAGES[0], tierOneRows);
assert.deepEqual(tierOne.counts, { subjects: 1, topics: 2, subtopics: 3 });
assert.deepEqual(tierOne.subjects[0]?.topics[0]?.subtopics.map((row) => row.id), ['subtopic-1', 'subtopic-2']);
assert.throws(
  () => buildSscCglTaxonomy(SSC_CGL_STAGES[1], [taxonomyRow(0)]),
  /ssc_cgl_stage_mismatch/,
  'Tier 2 cannot accept a Tier 1 taxonomy row',
);

const stage = SSC_CGL_STAGES[0];
assert.equal(parseSscCglRoute(['tier-1', 'subjects'])?.kind, 'subjects');
const topicsRoute = parseSscCglRoute(['tier-1', 'subjects', 'subj-reasoning', 'topics']);
assert.equal(topicsRoute?.kind, 'topics');
if (topicsRoute?.kind === 'topics') {
  assert.equal(findSscCglSubject(tierOne, topicsRoute.subjectSlug)?.id, 'subject-1');
}
const subtopicsRoute = parseSscCglRoute(['tier-1', 'subjects', 'subj-reasoning', 'topics', 'reasoning-analogy', 'subtopics']);
assert.equal(subtopicsRoute?.kind, 'subtopics');
if (subtopicsRoute?.kind === 'subtopics') {
  const subject = findSscCglSubject(tierOne, subtopicsRoute.subjectSlug);
  assert.equal(subject && findSscCglTopic(subject, subtopicsRoute.topicSlug)?.id, 'topic-1');
}
const questionsRoute = parseSscCglRoute(['tier-1', 'subjects', 'subj-reasoning', 'topics', 'reasoning-analogy', 'subtopics', 'reasoning-semantic-analogy', 'questions']);
assert.equal(questionsRoute?.kind, 'questions');
if (questionsRoute?.kind === 'questions') {
  assert.equal(findSscCglRouteNodes(tierOne, questionsRoute)?.subtopic.id, 'subtopic-1');
}
assert.equal(parseSscCglRoute(['tier-2', 'paper-1', 'subjects'])?.stage.code, 'TIER_II_PAPER_I');
assert.equal(parseSscCglRoute(['tier-2', 'paper-2', 'subjects'])?.stage.code, 'TIER_II_PAPER_II');
assert.equal(parseSscCglRoute(['tier-2', 'paper-3', 'subjects'])?.stage.code, 'TIER_II_PAPER_III');
assert.equal(parseSscCglRoute(['tier-2', 'subjects']), null, 'Tier 2 requires an explicit paper');
assert.equal(parseSscCglRoute(['tier-1']), null, 'a stage root is not a canonical hierarchy page');
assert.equal(parseSscCglRoute(['tier-1', 'subjects', 'subj-reasoning']), null, 'every hierarchy route requires its explicit terminal segment');

assert.equal(getSscCglTopicsHref(stage, 'subj-reasoning'), '/ssc-cgl/tier-1/subjects/subj-reasoning/topics');
assert.equal(getSscCglSubtopicsHref(stage, 'subj-reasoning', 'reasoning-analogy'), '/ssc-cgl/tier-1/subjects/subj-reasoning/topics/reasoning-analogy/subtopics');
assert.equal(getSscCglQuestionsHref(stage, 'subj-reasoning', 'reasoning-analogy', 'semantic-analogy'), '/ssc-cgl/tier-1/subjects/subj-reasoning/topics/reasoning-analogy/subtopics/semantic-analogy/questions');
assert.equal(getSscCglLegacyRedirect(['tier-1']), stage.href);
assert.equal(getSscCglLegacyRedirect(['tier-1', 'subj-reasoning']), getSscCglTopicsHref(stage, 'subj-reasoning'));
assert.equal(getSscCglLegacyRedirect(['tier-1', 'subj-reasoning', 'reasoning-analogy']), getSscCglSubtopicsHref(stage, 'subj-reasoning', 'reasoning-analogy'));

const staleRoute = parseSscCglRoute(['tier-1', 'subjects', 'stale-subject', 'topics']);
assert.equal(staleRoute?.kind, 'topics');
if (staleRoute?.kind === 'topics') assert.equal(findSscCglSubject(tierOne, staleRoute.subjectSlug), null);

const skillRow: SscCglSkillTestViewRow = {
  exam_profile_code: 'SSC_CGL', syllabus_version_code: 'SSC_CGL_TEST', tier_code: 'TIER_2',
  tier_label: { en: 'Tier 2' }, paper_code: 'PAPER_1', paper_label: { en: 'Paper 1' },
  stage_code: 'TIER_II_PAPER_I', stage_tag: 'SSC_CGL_TIER_2_PAPER_1', stage_sort_order: 2,
  skill_test_id: 'dest-id', skill_test_code: 'SKILL_DEST', skill_test_title: { en: 'Data Entry Speed Test (DEST)' },
  skill_test_description: null, source_locator: 'notice:dest', sort_order: 8, is_objective: false, is_qualifying: true,
};
assert.equal(normalizeSscCglSkillTests(SSC_CGL_STAGES[1], [skillRow])[0]?.code, 'SKILL_DEST');
assert.equal(tierOne.subjects.some((subject) => subject.topics.some((topic) => topic.subtopics.some((row) => row.id === 'dest-id'))), false);

const server = readFileSync('lib/sscCglSyllabusServer.ts', 'utf8');
const exactQuestionServer = readFileSync('lib/exactExamQuestionsServer.ts', 'utf8');
for (const [, , view] of expectedStages) assert.match(server, new RegExp(String(view)));
assert.match(server, /\['ssc-cgl-taxonomy', 'TIER_I'\]/, 'taxonomy cache keys include the active stage code');
assert.match(server, /'ssc-cgl-mapped-learning-hierarchy'[\s\S]*SSC_CGL_CONTENT_MAPPING_CACHE_VERSION[\s\S]*QUESTION_BATCH_CACHE_VERSION[\s\S]*taxonomy\.stage\.code/, 'content mappings refresh whenever either the mapping or question bank changes');
assert.match(server, /'ssc-cgl-question-counts-v7'[\s\S]*SSC_CGL_CONTENT_MAPPING_CACHE_VERSION[\s\S]*QUESTION_BATCH_CACHE_VERSION[\s\S]*stage\.code[\s\S]*subjectId[\s\S]*topicId/, 'scoped count cache follows the mapping, question-bank, and exact hierarchy scope');
assert.match(server, /revalidate: 60[\s\S]*ssc-cgl-question-counts/, 'question-backed cards refresh quickly after database imports');
assert.match(server, /order\('subject_sort_order'[\s\S]*order\('topic_sort_order'[\s\S]*order\('subtopic_sort_order'/);
assert.match(server, /from\('ssc_cgl_tier_skill_tests_v2'\)/, 'DEST remains available only through its dedicated view');
assert.match(server, /SSC_CGL_NODE_CONTENT_SLUGS/, 'published nodes use an explicit stable-code content map');
assert.doesNotMatch(server, /normalize[\s\S]*raw\.title|raw\.title[\s\S]*normalize/, 'runtime never infers ownership from titles');
assert.match(exactQuestionServer, /examCode\?\.trim\(\)\.toUpperCase\(\) === 'SSC_CGL'[\s\S]*getActiveExamProfileIdentity/, 'SSC CGL question pages bypass the aggregate selector view');

const contentLinks = readFileSync('lib/sscCglContentLinks.ts', 'utf8');
assert.match(contentLinks, /SSC_CGL_MAPPED_NODE_COUNT = 341/, 'all verified question-backed syllabus links are checked in');
assert.match(contentLinks, /GA_HISTORY_ANCIENT_INDIA.*ancient-india/, 'General Awareness links are part of the stable runtime map');
const generalAwarenessMappingMigration = readFileSync('scripts/migrate_ssc_cgl_general_awareness_question_mappings.sql', 'utf8');
assert.match(generalAwarenessMappingMigration, /array\['TIER_I', 'TIER_II_PAPER_I'\]::text\[\]/, 'shared General Awareness questions are mapped to both objective SSC CGL stages');
assert.match(generalAwarenessMappingMigration, /stage_codes @> array\['TIER_I', 'TIER_II_PAPER_I'\]/, 'the migration verifies both exact stage mappings after repair');

const tierPage = readFileSync('app/ssc-cgl/SscCglTierSelectionPage.tsx', 'utf8');
const subjectsPage = readFileSync('app/ssc-cgl/SscCglSubjectsPage.tsx', 'utf8');
const topicsPage = readFileSync('app/ssc-cgl/SscCglTopicsPage.tsx', 'utf8');
const subtopicsPage = readFileSync('app/ssc-cgl/SscCglSubtopicsPage.tsx', 'utf8');
const paperTabs = readFileSync('app/ssc-cgl/SscCglPaperTabs.tsx', 'utf8');
const progress = readFileSync('app/ssc-cgl/SscCglProgressSteps.tsx', 'utf8');
assert.match(tierPage, /SSC CGL through a focused, tier-wise syllabus/);
assert.doesNotMatch(tierPage, /taxonomy|subjects\.map|topics\.map|subtopics\.map|summary|counts/, 'tier page has no syllabus hierarchy or counts');
assert.match(subjectsPage, /taxonomy\.subjects\.map/);
assert.doesNotMatch(subjectsPage, /subject\.topics\.map|topic\.subtopics\.map|tier1Description|tier2Description/, 'subjects page renders no topic/subtopic lists or Tier cards');
assert.match(topicsPage, /subject\.topics\.map/);
assert.doesNotMatch(topicsPage, /taxonomy\.subjects\.map|topic\.subtopics\.map/, 'topics page renders no subject grid or subtopic list');
assert.match(subtopicsPage, /topic\.subtopics\.map/);
assert.doesNotMatch(subtopicsPage, /taxonomy\.subjects\.map|subject\.topics\.map|Objective syllabus subtopic mapped/, 'subtopics page renders no broader hierarchy or mapping text');
assert.match(subtopicsPage, /getSscCglQuestionsHref/, 'subtopic selection navigates to the questions page');
assert.match(subtopicsPage, /const isAvailable = questionCount > 0 \|\| hasPublishedQuestionMapping/, 'verified mapped subtopics stay actionable while a stale client count refreshes');
assert.match(subtopicsPage, /router\.refresh\(\)/, 'a stale all-zero client route payload self-heals without a manual hard refresh');
assert.doesNotMatch(subtopicsPage, /contentGenerationAllowed && questionCount/, 'content authoring policy never hides existing verified questions');
for (const source of [tierPage, subjectsPage, topicsPage, subtopicsPage]) {
  assert.match(source, /(?:md|lg):grid-cols-2/, 'each card page uses a mobile-first single-column to desktop two-column layout');
  assert.doesNotMatch(source, /<details/, 'no page uses an expanded accordion');
}
assert.match(paperTabs, /role="tablist"/);
assert.match(paperTabs, /role="tab"/);
assert.match(paperTabs, /ArrowRight[\s\S]*ArrowLeft[\s\S]*Home[\s\S]*End/, 'Paper tabs support keyboard navigation');
assert.match(paperTabs, /href=\{paper\.href\}/, 'Paper changes return to the selected paper subjects root');
assert.match(progress, /\['Tier', 'Subject', 'Topic', 'Subtopic', 'Questions'\]/);
assert.match(progress, /aria-current=\{current \? 'step'/);
assert.doesNotMatch(progress, /complete|Check/, 'only the current step receives active styling');

const rootPage = readFileSync('app/ssc-cgl/page.tsx', 'utf8');
assert.match(rootPage, /<SscCglTierSelectionPage/);
const routePage = readFileSync('app/ssc-cgl/[...path]/page.tsx', 'utf8');
assert.match(routePage, /route\.kind === 'subjects'[\s\S]*<SscCglSubjectsPage/);
assert.match(routePage, /route\.kind === 'topics'[\s\S]*<SscCglTopicsPage/);
assert.match(routePage, /route\.kind === 'subtopics'[\s\S]*<SscCglSubtopicsPage/);
assert.match(routePage, /SSC_CGL_NODE_CONTENT_SLUGS[\s\S]*questionBackedSubtopicIds=\{questionBackedSubtopicIds\}/, 'verified server-owned mappings are passed to the subtopic cards as an availability fallback');
assert.match(routePage, /stageCode=\{route\.stage\.code\}[\s\S]*stageTag=\{route\.stage\.tag\}/);
assert.match(routePage, /getExactExamQuestionBatchBySubtopic[\s\S]*stageCodes: \[route\.stage\.code\]/, 'SSC CGL question pages use exact profile and stage mappings');
assert.doesNotMatch(routePage, /getQuestionBatchBySubtopic/, 'SSC CGL never falls back to broad SSC tags');
assert.match(routePage, /getSscCglLegacyRedirect[\s\S]*permanentRedirect\(legacyRedirect\)/);

const questionPractice = readFileSync('components/practice/QuestionPractice.tsx', 'utf8');
assert.match(questionPractice, /url\.searchParams\.set\('stage_code', stageCode\)/);
assert.match(questionPractice, /url\.searchParams\.set\('stage_tag', stageTag\)/);
assert.match(questionPractice, /if \(total === 0 && !reviewQuestion\)/, 'answer review and explanation survive an empty replacement batch');
const submitSuccessSlice = questionPractice.match(/const result = payload;[\s\S]*?\} catch \(error\)/)?.[0] ?? '';
assert.match(submitSuccessSlice, /setReviewQuestion\(current\)/, 'correct answers retain their review question');
assert.doesNotMatch(submitSuccessSlice, /advanceToNextQuestionPage|resetQuestionState/, 'submit never navigates before the explanation is reviewed');
const questionBatchRoute = readFileSync('app/api/practice/question-batch/route.ts', 'utf8');
assert.match(questionBatchRoute, /isSscCgl[\s\S]*getSscCglStageByCode\(requestedStageCode\)/, 'SSC CGL cursor loads validate the closed stage enum without a track database round-trip');
assert.match(subtopicsPage, /prefetch=\{false\}[\s\S]*\?qb=\$\{QUESTION_BATCH_CACHE_VERSION\}/, 'question navigation bypasses stale prefetched empty route payloads');
assert.match(routePage, /getExactExamQuestionBatchBySubtopic[\s\S]*!initialBatch\?\.questions\.length[\s\S]*getFreshExactExamQuestionBatchBySubtopic/, 'an unexpectedly empty cached SSC CGL batch gets one direct database recovery read');
assert.match(exactQuestionServer, /export function getFreshExactExamQuestionBatchBySubtopic[\s\S]*fetchExactExamQuestionBatchBySubtopic\(input\)/, 'the recovery read bypasses only the stale data cache while retaining exact profile and stage filters');
const questionRecovery = readFileSync('app/ssc-cgl/SscCglQuestionRecovery.tsx', 'utf8');
assert.match(questionRecovery, /searchParams\.get\('qb'\)[\s\S]*router\.replace/, 'an already-rendered empty client route replaces its unversioned URL once');
assert.match(questionRecovery, /router\.refresh\(\)/, 'the empty-state retry button performs a live server refresh');
const questionPage = readFileSync('app/question/[...questionSlug]/page.tsx', 'utf8');
assert.match(questionPage, /getSscCglStageTaxonomy\(requestedStage\)/);
assert.match(questionPage, /getSscCglSubtopicsHref\(requestedStage, stageSubject\.slug, stageTopic\.slug\)/);

const loading = readFileSync('app/ssc-cgl/loading.tsx', 'utf8');
const error = readFileSync('app/ssc-cgl/error.tsx', 'utf8');
assert.match(loading, /animate-pulse/);
assert.match(error, /onClick=\{reset\}/);

console.log('sscCglSyllabus tests passed');

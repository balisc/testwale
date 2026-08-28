import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  SSC_CHSL_STAGES,
  getSscChslLoginHref,
  getSscChslPreferenceHref,
  getSscChslQuestionsHref,
  getSscChslSubtopicsHref,
  getSscChslTopicsHref,
  isSscChslExamCode,
  parseSscChslRoute,
} from './sscChsl';

assert.deepEqual(SSC_CHSL_STAGES.map((stage) => [stage.code, stage.tag, stage.href]), [
  ['TIER_I', 'SSC_CHSL_TIER_1', '/ssc-chsl/tier-1/subjects'],
  ['TIER_II', 'SSC_CHSL_TIER_2', '/ssc-chsl/tier-2/subjects'],
]);
assert.equal(isSscChslExamCode('ssc-chsl'), true);
assert.equal(isSscChslExamCode('SSC_CHSL'), true);
assert.equal(isSscChslExamCode('SSC_CGL'), false);

const tierOne = SSC_CHSL_STAGES[0];
assert.equal(getSscChslTopicsHref(tierOne, 'reasoning'), '/ssc-chsl/tier-1/subjects/reasoning/topics');
assert.equal(
  getSscChslSubtopicsHref(tierOne, 'reasoning', 'analogy'),
  '/ssc-chsl/tier-1/subjects/reasoning/topics/analogy/subtopics',
);
assert.equal(
  getSscChslQuestionsHref(tierOne, 'reasoning', 'analogy', 'semantic-analogy'),
  '/ssc-chsl/tier-1/subjects/reasoning/topics/analogy/subtopics/semantic-analogy/questions',
);
assert.deepEqual(parseSscChslRoute(['tier-2', 'subjects']), {
  kind: 'subjects', stage: SSC_CHSL_STAGES[1],
});
assert.equal(parseSscChslRoute(['tier-3', 'subjects']), null);
assert.equal(parseSscChslRoute(['tier-1', 'subjects', 'reasoning']), null);
assert.equal(getSscChslPreferenceHref({ stageCode: 'TIER_II' }), '/ssc-chsl/tier-2/subjects');
assert.equal(getSscChslPreferenceHref({ stageCode: 'TIER_I' }), '/ssc-chsl/tier-1/subjects');
assert.equal(getSscChslLoginHref('/subjects'), '/login');
assert.equal(getSscChslLoginHref('/ssc-chsl'), '/login?redirect=%2Fssc-chsl');
assert.equal(
  getSscChslLoginHref('/ssc-chsl/tier-1/subjects'),
  '/login?redirect=%2Fssc-chsl%2Fauth-return%3FreturnTo%3D%252Fssc-chsl%252Ftier-1%252Fsubjects',
);

const root = readFileSync('app/ssc-chsl/page.tsx', 'utf8');
assert.match(root, /if \(!session\) redirect\('\/exams\/ssc-combined-higher-secondary-level-examination'\)/);
assert.match(root, /getSscChslPreference[\s\S]*getSscChslStageAvailability/);

const deepRoute = readFileSync('app/ssc-chsl/[...path]/page.tsx', 'utf8');
assert.match(deepRoute, /getAuthUserFromCookies\(\)[\s\S]*if \(!session\) redirect/);
assert.match(deepRoute, /getSscChslStageSnapshot\(route\.stage\)/);
assert.match(deepRoute, /getExactExamQuestionBatchBySubtopic[\s\S]*stageCodes: \[route\.stage\.code\]/);
assert.match(deepRoute, /<QuestionPractice[\s\S]*examCode=\{SSC_CHSL_EXAM_CODE\}[\s\S]*stageCode=\{route\.stage\.code\}/);

const hierarchyPages = readFileSync('app/ssc-chsl/SscChslHierarchyPages.tsx', 'utf8');
assert.match(hierarchyPages, /grid-cols-\[3\.5rem_minmax\(0,1fr\)\][\s\S]*col-span-2 inline-flex[\s\S]*\{copy\.explore\}/);
assert.match(hierarchyPages, /grid-cols-\[3rem_minmax\(0,1fr\)\][\s\S]*col-span-2 inline-flex[\s\S]*\{available \? copy\.start : copy\.soon\}/);
assert.doesNotMatch(hierarchyPages, /sm:hidden/);

const preferenceApi = readFileSync('app/api/profile/ssc-chsl-preference/route.ts', 'utf8');
assert.match(preferenceApi, /getAuthUserFromCookies/);
assert.match(preferenceApi, /invalid_user_scope/);
assert.match(preferenceApi, /getSscChslStageAvailability/);
assert.match(preferenceApi, /revalidatePath\('\/dashboard'\)[\s\S]*revalidatePath\('\/ssc-chsl'\)/);

const server = readFileSync('lib/sscChslServer.ts', 'utf8');
assert.match(server, /getPublicExamSyllabus\(SSC_CHSL_EXAM_SLUG, stage\.code\)/);
assert.match(server, /overlaps\('question_exam_profile_mappings\.stage_codes', \[stage\.code\]\)/);
assert.match(server, /saveExamPreparationPreference[\s\S]*tierCode: null/);
assert.match(server, /ssc-chsl-taxonomy-v3/);
assert.match(server, /cachedStageLoaders\[stage\.code\]\(\)[\s\S]*fetchSscChslStageSnapshot\(stage\)/);

const preferenceServer = readFileSync('lib/examPreferenceServer.ts', 'utf8');
assert.match(preferenceServer, /getLegacySscChslTracks/);
assert.match(preferenceServer, /PGRST205[\s\S]*getLegacySscChslTracks/);
assert.match(preferenceServer, /saveLegacySscChslPreference/);
assert.match(preferenceServer, /preferred_stage_code: input\.stageCode === 'TIER_I' \? 'TIER_I' : 'TIER_II_PAPER_I'/);

const questionBatchApi = readFileSync('app/api/practice/question-batch/route.ts', 'utf8');
assert.match(questionBatchApi, /isSscChslExamCode[\s\S]*getSscChslStageByCode\(requestedStageCode\)/);

const questionPractice = readFileSync('components/practice/QuestionPractice.tsx', 'utf8');
assert.match(questionPractice, /Array\.from\(\{ length: navigatorQuestionTotal \}/);
assert.match(questionPractice, /flex-nowrap[\s\S]*overflow-x-auto[\s\S]*\[scrollbar-width:none\][\s\S]*\[&::-webkit-scrollbar\]:hidden/);
assert.match(questionPractice, /min-w-\[calc\(10%_-_0\.225rem\)\][\s\S]*basis-\[calc\(10%_-_0\.225rem\)\]/);
assert.match(questionPractice, /slice\(0, QUESTION_BATCH_PAGE_SIZE\)[\s\S]*map\(\(question\) => question\.id\)/);
assert.match(questionPractice, /setPageNumberOffset\(\(prev\) => prev \+ QUESTION_BATCH_PAGE_SIZE\)/);
assert.match(questionPractice, /type PrefetchedQuestionBatch[\s\S]*prefetchNextQuestionPage\(pageIds\)/);
assert.match(questionPractice, /if \(activatePrefetchedNextBatch\(0\)\) return/);
assert.match(questionPractice, /const maxUnlockedQuestionIndex = firstUnansweredQuestionIndex/);
assert.match(questionPractice, /if \(!submitted && !isQuestionAttempted\(current\.id\)\) return/);
assert.match(questionPractice, /if \(qIndex > maxUnlockedQuestionIndex\) return/);
assert.match(questionPractice, /prefetchedIndex === 0[\s\S]*currentBatchSequentiallyComplete/);
assert.match(questionPractice, /navigatorLookaheadButtonRef\.current\?\.scrollIntoView/);
assert.match(questionPractice, /const canAdvanceFromCurrentBatch =[\s\S]*hasMore[\s\S]*Boolean\(nextCursor\)[\s\S]*navigatorQuestionTotal > pageNumberOffset \+ total[\s\S]*prefetchingNextBatch/);
assert.match(questionPractice, /\) : canAdvanceFromCurrentBatch \? \([\s\S]*onClick=\{handleNextQuestion\}/);
assert.doesNotMatch(questionPractice, /disabled=\{prefetchingNextBatch\}/);
assert.doesNotMatch(questionPractice, /mb-2 flex flex-wrap gap-1\.5/);

const directQuestionPage = readFileSync('app/question/[...questionSlug]/page.tsx', 'utf8');
assert.match(directQuestionPage, /\[linkedQuestion, \.\.\.initialBatch\.questions\][\s\S]*slice\(0, QUESTION_BATCH_PAGE_SIZE\)/);

const publicExamSyllabus = readFileSync('lib/publicExamExplorer.ts', 'utf8');
assert.match(publicExamSyllabus, /getExamPreparationTracks\(option\.exam_profile_id\)/);
assert.match(publicExamSyllabus, /option\.exam_code === 'SSC_CHSL'[\s\S]*node\.is_qualifying !== true/);

const publicSubtopicPage = readFileSync('app/exams/[examSlug]/[subjectSlug]/[topicSlug]/[subtopicSlug]/page.tsx', 'utf8');
assert.match(publicSubtopicPage, /getFreshExactExamQuestionBatchBySubtopic/);
assert.match(publicSubtopicPage, /totalQuestionCount=\{subtopic\.question_count\}/);

const dashboardApi = readFileSync('app/api/learning/dashboard/route.ts', 'utf8');
assert.match(dashboardApi, /isSscChslExamCode[\s\S]*getSscChslStageSnapshot/);
assert.match(dashboardApi, /sscChslSelection/);

const onboardingClient = readFileSync('app/onboarding/OnboardingClient.tsx', 'utf8');
assert.match(onboardingClient, /SSC_CHSL_EXAM_CODE/);
assert.match(onboardingClient, /requiresChslTier[\s\S]*requiresTier/);
assert.match(onboardingClient, /requiresChslTier \? item\.stageCode === tier : item\.tierCode === tier/);
assert.match(onboardingClient, /Choose your SSC CHSL Tier/);

const publishMigration = readFileSync('scripts/publish_ssc_chsl_for_learners.sql', 'utf8');
assert.match(publishMigration, /insert into public\.exam_syllabus_node_stage_mappings/);
assert.match(publishMigration, /SSC_CHSL_TIER_1/);
assert.match(publishMigration, /SSC_CHSL_TIER_2/);
assert.match(publishMigration, /stage\.stage_code = 'TIER_II'[\s\S]*n\.is_qualifying is false/);

const genericPreferenceMigration = readFileSync('scripts/migrate_generic_exam_preparation_preferences.sql', 'utf8');
assert.match(genericPreferenceMigration, /ep\.code = 'SSC_CHSL'[\s\S]*preferred_stage_code = 'TIER_II_PAPER_I'/);

const proxy = readFileSync('proxy.ts', 'utf8');
assert.match(proxy, /'ssc-chsl'/);
assert.match(proxy, /PATH_CHECK_NEGATIVE_TTL_MS = 15_000/);
assert.match(proxy, /cache: 'no-store'/);

console.log('ssc chsl ecosystem tests passed');

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  applyAttemptHistoryToSnapshot,
  entityIsIncluded,
  progressPercent,
  snapshotToProgressDashboard,
  type ExamLearningSnapshot,
} from './examLearning';
import {
  attachCatalogContentMappings,
  buildPublishedSyllabusHierarchy,
  findPublishedSyllabusSubject,
  findPublishedSyllabusSubtopic,
  findPublishedSyllabusTopic,
} from './examSyllabus';
import type { ExamSyllabusNodeRow } from '@/types/supabase';

const snapshot: ExamLearningSnapshot = {
  exam: { id: 'exam-a', code: 'SSC', title: { en: 'SSC', hi: 'एसएससी' }, target_date: '2026-12-01' },
  overview: { total_questions: 10, attempted_count: 3, correct_count: 2, wrong_count: 1, completion_percent: 30, accuracy_percent: 66.67 },
  subjects: [{ id: 'subject-a', slug: 'indian-polity', title: { en: 'Polity' }, description: null, icon_key: 'book', hero_image_url: null, sort_order: 1, topic_count: 1, subtopic_count: 1, question_count: 10, attempted_count: 3, correct_count: 2 }],
  topics: [{ id: 'topic-a', subject_id: 'subject-a', slug: 'constitution', title: { en: 'Constitution' }, description: null, icon_key: null, sort_order: 1, priority: 1, importance: 'high', is_recommended: true, subtopic_count: 1, question_count: 10, attempted_count: 3, correct_count: 2 }],
  subtopics: [{ id: 'subtopic-a', topic_id: 'topic-a', subject_id: 'subject-a', slug: 'preamble', title: { en: 'Preamble' }, description: null, sort_order: 1, priority: 1, importance: 'high', importance_label: null, is_recommended: true, question_count: 10, attempted_count: 3, correct_count: 2 }],
  recent_activity: [{ question_id: 'question-a', subject_id: 'subject-a', topic_id: 'topic-a', subtopic_id: 'subtopic-a', is_correct: true, attempted_at: '2026-08-05T10:00:00Z', question_text: { en: 'Question' }, subject_title: { en: 'Polity' }, topic_title: { en: 'Constitution' } }],
};

assert.equal(entityIsIncluded(snapshot, 'subject', 'subject-a'), true);
assert.equal(entityIsIncluded(snapshot, 'topic', 'topic-a'), true);
assert.equal(entityIsIncluded(snapshot, 'subtopic', 'subtopic-a'), true);
assert.equal(entityIsIncluded(snapshot, 'topic', 'other-exam-topic'), false, 'unrelated deep links are unavailable');
assert.equal(progressPercent(3, 10), 30);
assert.equal(progressPercent(3, 0), 0);

const persistedProgress = applyAttemptHistoryToSnapshot(
  {
    ...snapshot,
    overview: {
      ...snapshot.overview,
      attempted_count: 0,
      correct_count: 0,
      wrong_count: 0,
      total_time_spent_seconds: 0,
      average_time_spent_seconds: 0,
    },
    subjects: snapshot.subjects.map((row) => ({
      ...row, content_id: 'content-subject', attempted_count: 0, correct_count: 0,
      wrong_count: 0, total_time_spent_seconds: 0, average_time_spent_seconds: 0,
    })),
    topics: snapshot.topics.map((row) => ({
      ...row, content_id: 'content-topic', attempted_count: 0, correct_count: 0,
      wrong_count: 0, total_time_spent_seconds: 0, average_time_spent_seconds: 0,
    })),
    subtopics: snapshot.subtopics.map((row) => ({
      ...row, content_id: 'content-subtopic', attempted_count: 0, correct_count: 0,
      wrong_count: 0, total_time_spent_seconds: 0, average_time_spent_seconds: 0,
    })),
  },
  [
    { question_id: 'q1', subject_id: 'content-subject', topic_id: 'content-topic', subtopic_id: 'content-subtopic', is_correct: false, time_spent_seconds: 10 },
    { question_id: 'q1', subject_id: 'content-subject', topic_id: 'content-topic', subtopic_id: 'content-subtopic', is_correct: true, time_spent_seconds: 6 },
    { question_id: 'q2', subject_id: 'content-subject', topic_id: 'content-topic', subtopic_id: 'content-subtopic', is_correct: false, time_spent_seconds: 8 },
  ],
);
assert.equal(persistedProgress.overview.attempted_count, 2, 'attempted questions are unique');
assert.equal(persistedProgress.overview.correct_count, 1, 'a corrected retry masters the question');
assert.equal(persistedProgress.overview.wrong_count, 1, 'unresolved questions remain wrong');
assert.equal(persistedProgress.overview.total_time_spent_seconds, 24, 'all solve time is retained');
assert.equal(persistedProgress.subtopics[0]?.average_time_spent_seconds, 8);

const dashboard = snapshotToProgressDashboard(snapshot);
assert.equal(dashboard.overview.total_attempts, 3);
assert.equal(dashboard.by_subject[0]?.attempts_count, 3);
assert.equal(dashboard.by_topic[0]?.unique_questions_count, 3);
assert.equal(dashboard.by_subtopic[0]?.accuracy_percent, 66.67);
assert.equal(dashboard.recent_attempts[0]?.question_id, 'question-a');

// Switching snapshots changes visible scope without mutating stored attempts; switching
// back reconstructs the original exam's progress from the same first-attempt source.
const otherExam: ExamLearningSnapshot = {
  ...snapshot,
  exam: { ...snapshot.exam, id: 'exam-b', code: 'RAILWAY' },
  overview: { ...snapshot.overview, attempted_count: 1, correct_count: 1, wrong_count: 0 },
  subjects: snapshot.subjects.map((row) => ({ ...row, attempted_count: 1, correct_count: 1 })),
};
assert.equal(snapshotToProgressDashboard(otherExam).overview.total_attempts, 1);
assert.equal(snapshotToProgressDashboard(snapshot).overview.total_attempts, 3);

function node(overrides: Partial<ExamSyllabusNodeRow>): ExamSyllabusNodeRow {
  return {
    id: '', syllabus_version_id: 'version-current', parent_node_id: null,
    node_code: '', node_type: 'subject', title: {}, description: null,
    sort_order: 1, is_active: true, metadata: null, ...overrides,
  };
}

const publishedNodes: ExamSyllabusNodeRow[] = [];
const topicDistribution = [9, 9, 8, 6, 4, 12, 12];
let subtopicIndex = 0;
for (let subjectIndex = 0; subjectIndex < topicDistribution.length; subjectIndex += 1) {
  const subjectId = `published-subject-${subjectIndex}`;
  publishedNodes.push(node({
    id: subjectId,
    node_code: `SUBJ_${subjectIndex}`,
    title: subjectIndex === 1
      ? { en: 'General Awareness', hi: 'सामान्य जागरूकता' }
      : { en: `Subject ${subjectIndex}`, hi: `विषय ${subjectIndex}` },
    sort_order: 7 - subjectIndex,
  }));
  for (let topicIndex = 0; topicIndex < topicDistribution[subjectIndex]!; topicIndex += 1) {
    const topicId = `published-topic-${subjectIndex}-${topicIndex}`;
    publishedNodes.push(node({
      id: topicId, parent_node_id: subjectId, node_code: `TOPIC_${subjectIndex}_${topicIndex}`,
      node_type: 'topic', title: { en: `Topic ${topicIndex}`, hi: `टॉपिक ${topicIndex}` },
      sort_order: topicIndex,
    }));
    const count = subtopicIndex < 4 ? 6 : 5;
    for (let childIndex = 0; childIndex < count; childIndex += 1) {
      publishedNodes.push(node({
        id: `published-subtopic-${subtopicIndex}-${childIndex}`,
        parent_node_id: topicId,
        node_code: `SUBTOPIC_${subtopicIndex}_${childIndex}`,
        node_type: 'subtopic',
        title: { en: `Subtopic ${childIndex}`, hi: `उप-विषय ${childIndex}` },
        sort_order: childIndex,
      }));
    }
    subtopicIndex += 1;
  }
}
publishedNodes.push(node({ id: 'inactive-subject', node_code: 'INACTIVE', is_active: false }));
publishedNodes.push(node({ id: 'cross-exam-topic', parent_node_id: 'other-exam-subject', node_code: 'LEAK', node_type: 'topic' }));

const publishedHierarchy = buildPublishedSyllabusHierarchy(publishedNodes);
assert.equal(publishedHierarchy.subjects.length, 7);
assert.equal(publishedHierarchy.topics.length, 60);
assert.equal(publishedHierarchy.subtopics.length, 304);
assert.equal(publishedHierarchy.subjects[0]?.sort_order, 1, 'database sort_order is canonical');
assert.equal(publishedHierarchy.subjects.some((row) => row.id === 'inactive-subject'), false);
assert.equal(publishedHierarchy.topics.some((row) => row.id === 'cross-exam-topic'), false, 'invalid/cross-version parents cannot leak');
const bilingualSubject = publishedHierarchy.subjects.find((row) => row.id === 'published-subject-1')!;
assert.equal(bilingualSubject.title.en, 'General Awareness');
assert.equal(bilingualSubject.title.hi, 'सामान्य जागरूकता');
const foundSubject = findPublishedSyllabusSubject(publishedHierarchy.subjects, 'subj-1')!;
const foundTopic = findPublishedSyllabusTopic(publishedHierarchy.topics, foundSubject.id, 'topic-1-0')!;
assert.ok(foundTopic);
assert.match(foundTopic.scope?.en ?? '', /Subtopic 0/, 'topic scope lists its included subtopics');
const foundSubtopic = findPublishedSyllabusSubtopic(publishedHierarchy.subtopics, foundTopic.id, 'subtopic-9-0');
assert.ok(foundSubtopic);
assert.equal(foundSubtopic.scope?.en, foundTopic.title.en, 'subtopic scope identifies its parent topic');
assert.equal(findPublishedSyllabusTopic(publishedHierarchy.topics, 'other-subject', 'topic-1-0'), null, 'cross-subject deep links fail');

const mappedHierarchy = attachCatalogContentMappings(
  buildPublishedSyllabusHierarchy([
    node({ id: 'syllabus-subject', node_code: 'REA', title: { en: 'Reasoning' } }),
    node({ id: 'syllabus-topic', parent_node_id: 'syllabus-subject', node_code: 'REA_ANALOGY', node_type: 'topic', title: { en: 'Analogy' } }),
    node({ id: 'syllabus-subtopic', parent_node_id: 'syllabus-topic', node_code: 'REA_SEMANTIC_ANALOGY', node_type: 'subtopic', title: { en: 'Semantic Analogy' }, metadata: { content_subtopic_id: 'content-subtopic' } }),
  ]),
  {
    subjects: [{ id: 'content-subject', slug: 'reasoning', title: { en: 'Reasoning' }, description: null, icon_key: null, hero_image_url: null, sort_order: 1, topic_count: 1, question_count: 20, is_active: true }],
    topics: [{ id: 'content-topic', subject_id: 'content-subject', slug: 'analogy', title: { en: 'Analogy' }, description: null, icon_key: null, sort_order: 1, subtopic_count: 1, question_count: 20, is_active: true }],
    subtopics: [{ id: 'content-subtopic', topic_id: 'content-topic', slug: 'semantic-analogy', title: { en: 'Semantic Analogy' }, description: null, sort_order: 1, question_count: 20, is_active: true }],
    exams: [],
  },
);
assert.equal(mappedHierarchy.subtopics[0]?.content_id, 'content-subtopic');
assert.equal(mappedHierarchy.subtopics[0]?.question_count, 20);
assert.equal(mappedHierarchy.topics[0]?.content_id, 'content-topic');
assert.equal(mappedHierarchy.subjects[0]?.question_count, 20);
assert.equal(entityIsIncluded({ ...snapshot, subtopics: mappedHierarchy.subtopics }, 'subtopic', 'content-subtopic'), true);

const titleOnlyHierarchy = attachCatalogContentMappings(
  buildPublishedSyllabusHierarchy([
    node({ id: 'title-subject', node_code: 'TITLE_SUBJECT', title: { en: 'Reasoning' } }),
    node({ id: 'title-topic', parent_node_id: 'title-subject', node_code: 'TITLE_TOPIC', node_type: 'topic', title: { en: 'Analogy' } }),
    node({ id: 'title-subtopic', parent_node_id: 'title-topic', node_code: 'TITLE_SUBTOPIC', node_type: 'subtopic', title: { en: 'Semantic Analogy' } }),
  ]),
  {
    subjects: [{ id: 'content-subject', slug: 'reasoning', title: { en: 'Reasoning' }, description: null, icon_key: null, hero_image_url: null, sort_order: 1, topic_count: 1, question_count: 20, is_active: true }],
    topics: [{ id: 'content-topic', subject_id: 'content-subject', slug: 'analogy', title: { en: 'Analogy' }, description: null, icon_key: null, sort_order: 1, subtopic_count: 1, question_count: 20, is_active: true }],
    subtopics: [{ id: 'content-subtopic', topic_id: 'content-topic', slug: 'semantic-analogy', title: { en: 'Semantic Analogy' }, description: null, sort_order: 1, question_count: 20, is_active: true }],
    exams: [],
  },
);
assert.equal(titleOnlyHierarchy.subtopics[0]?.content_id, undefined, 'matching titles never create a catalog mapping');
const examSyllabusSource = readFileSync('lib/examSyllabus.ts', 'utf8');
assert.match(examSyllabusSource, /content_subtopic_id[\s\S]*catalog_subtopic_id/, 'only explicit metadata IDs link the syllabus to catalog content');
assert.doesNotMatch(examSyllabusSource, /localizedLabels|normalizedLabel|candidate\.title/, 'title equality is never used as a content mapping');

const batchRoute = readFileSync('app/api/practice/question-batch/route.ts', 'utf8');
assert.match(batchRoute, /getSelectedExamContext/, 'pagination uses the lightweight signed-session exam context');
assert.match(batchRoute, /selected\.questionTag/, 'pagination uses the authoritative onboarding family tag');
assert.match(batchRoute, /selected\.examProfileId/, 'authenticated batches bind to the signed-session exact profile');
assert.match(batchRoute, /getExactExamQuestionBatchBySubtopic/, 'exam-scoped pagination uses the exact profile mapping');
assert.match(batchRoute, /getExactExamQuestionBatchByTopic/, 'topic pagination also stays inside the exact profile mapping');
assert.doesNotMatch(batchRoute, /getSelectedExamLearning/, 'question pagination never builds the full progress dashboard');

const questionRoute = readFileSync('app/api/questions/route.ts', 'utf8');
assert.match(questionRoute, /contains\('exam_tags', \[examCode\]\)/, 'question lists filter in PostgreSQL');

const homePage = readFileSync('app/page.tsx', 'utf8');
assert.match(homePage, /if \(session\) redirect\('\/dashboard'\)/, 'authenticated home opens the exam dashboard');

const dashboardClient = readFileSync('app/dashboard/ExamDashboardClient.tsx', 'utf8');
assert.match(
  dashboardClient,
  /`\/subjects\/\$\{firstSubject\.slug\}\/\$\{firstTopic\.slug\}\/practice\/\$\{firstPractice\.slug\}/,
  'dashboard start-practice action links to the canonical subtopic practice route',
);

const profileShell = readFileSync('app/profile/ProfileShell.tsx', 'utf8');
assert.match(profileShell, /edit=1&returnTo=%2Fdashboard/, 'changing exam returns to fresh scoped content');

const onboardingMigration = readFileSync('scripts/migrate_target_exam_onboarding.sql', 'utf8');
assert.match(onboardingMigration, /target_exam_id = excluded\.target_exam_id[\s\S]*exam_date = excluded\.exam_date[\s\S]*exam_onboarding_completed_at = excluded\.exam_onboarding_completed_at/i, 'exam and date update atomically');

const learningServer = readFileSync('lib/examLearningServer.ts', 'utf8');
const profileIdentityServer = readFileSync('lib/examProfileIdentityServer.ts', 'utf8');
assert.match(learningServer, /from\('user_profiles'\)[\s\S]*target_exam_profile_id[\s\S]*exam_onboarding_completed_at/, 'selected context uses one focused profile read');
assert.match(learningServer, /getCachedSelectedProfileRow\(session\.id\)[\s\S]*getActiveExamProfileIdentity\(\{[\s\S]*examProfileId: row\.target_exam_profile_id/, 'selected context uses a cached lightweight profile identity instead of the aggregate selector view');
assert.doesNotMatch(learningServer, /getReadyExamSelectorOptions/, 'practice requests never wait for the aggregate exam catalogue');
assert.match(learningServer, /identity\.contentExamId !== row\.target_exam_id/, 'profile/content identity mismatches are rejected');
assert.match(profileIdentityServer, /from\('exam_profiles'\)[\s\S]*eq\('is_active', true\)/, 'identity lookup rejects inactive profiles');
assert.match(profileIdentityServer, /from\('exam_syllabus_versions'\)[\s\S]*eq\('publication_status', 'published'\)[\s\S]*eq\('is_current', true\)/, 'identity lookup requires one current published syllabus');
assert.match(profileIdentityServer, /from\('exams'\)[\s\S]*eq\('code', profile\.legacy_exam_tag\)/, 'identity lookup validates the stored content family without the aggregate selector view');
assert.match(learningServer, /selected-exam-published-base-v1[\s\S]*revalidate: 300/, 'shared published hierarchy is cached for fast dashboard loads');
assert.doesNotMatch(learningServer.match(/type PublishedExamBaseInput[\s\S]*?};/)?.[0] ?? '', /userId|targetDate/, 'personal fields never enter the shared snapshot cache');
assert.match(learningServer, /getCachedPublishedExamBaseSnapshot[\s\S]*from\('user_question_attempts'\)/, 'personal attempts stay outside the shared cache');
assert.match(learningServer, /from\('exam_syllabus_versions'\)[\s\S]*eq\('exam_profile_id', input\.profileId\)[\s\S]*eq\('publication_status', 'published'\)[\s\S]*eq\('is_current', true\)/, 'the exact profile and explicit current-version rule resolve V5');
assert.match(learningServer, /from\('exam_syllabus_nodes'\)[\s\S]*eq\('syllabus_version_id', version\.id\)[\s\S]*eq\('is_active', true\)/, 'only active nodes from that version load');
assert.doesNotMatch(learningServer, /polity_exam_topic_priority|get_exam_learning_snapshot/, 'authenticated hierarchy never falls back to a different exam ranking');
assert.doesNotMatch(learningServer, /SSC_CGL|indian-polity/, 'no exam or subject is hardcoded in the loader');
assert.match(profileIdentityServer, /questionTag: String\(contentExam\.code \|\| profile\.family_code \|\| profile\.code\)/, 'the stored question tag follows the validated content family mapping');
assert.doesNotMatch(learningServer, /\.delete\(|delete\s+from/i, 'switching exams does not delete history');

const questionStateRoute = readFileSync('app/api/practice/question-state/route.ts', 'utf8');
assert.match(questionStateRoute, /getSelectedExamContext/, 'practice state uses the lightweight selected-exam context');
assert.match(questionStateRoute, /question_exam_profile_mappings!inner/, 'practice state validates the exact exam profile');
assert.doesNotMatch(questionStateRoute, /getSelectedExamLearning/, 'practice state cannot time out while building dashboard progress');

for (const routePath of [
  'app/api/practice/attempts/route.ts',
  'app/api/practice/correct-ids/route.ts',
  'app/api/practice/validate-question-ids/route.ts',
  'app/api/practice/submit/route.ts',
]) {
  const source = readFileSync(routePath, 'utf8');
  assert.match(source, /getSelectedExamContext/, `${routePath} uses the lightweight selected-exam context`);
  assert.doesNotMatch(source, /getSelectedExamLearning/, `${routePath} never builds dashboard progress`);
}

const practiceServer = readFileSync('lib/practiceServer.ts', 'utf8');
assert.match(practiceServer, /getSubtopicBatchQuestionState:fallback/, 'saved attempts keep questions usable when mastery state is unavailable');
assert.match(practiceServer, /eligibleQuestionIds: phase === 'unseen' \? unseen/, 'fallback preserves unseen and unresolved practice queues');

const topicPractice = readFileSync('app/subjects/[subject]/[topicSlug]/practice/page.tsx', 'utf8');
const subtopicPractice = readFileSync('app/subjects/[subject]/[topicSlug]/practice/[subtopicSlug]/page.tsx', 'utf8');
const unavailable = readFileSync('components/ExamContentUnavailable.tsx', 'utf8');
assert.match(topicPractice, /findPublishedSyllabusTopic[\s\S]*questions_coming/);
assert.match(subtopicPractice, /findPublishedSyllabusSubtopic[\s\S]*questions_coming/);
assert.match(unavailable, /Questions are being added/);
assert.match(unavailable, /प्रश्न जल्द जोड़े जा रहे हैं/);

const learningApi = readFileSync('app/api/learning/dashboard/route.ts', 'utf8');
assert.match(learningApi, /private, no-store/, 'exam dashboard responses cannot leak through shared caches');
assert.match(learningApi, /getSavedExamPreference/, 'dashboard reads the authenticated user\'s saved preparation stage');
assert.match(learningApi, /getSscCglStageTaxonomy/, 'the selected SSC CGL stage loads its exact subject hierarchy');

const selectedStageSubjects = readFileSync('app/dashboard/SscCglSelectedStageSubjects.tsx', 'utf8');
assert.match(selectedStageSubjects, /getSscCglTopicsHref/, 'dashboard subject cards open the selected stage topic page');
assert.match(selectedStageSubjects, /topics, subtopics and questions/, 'the selected-stage path is explained to the learner');
assert.match(dashboardClient, /sscCglSelection\?\.status === 'ready'/, 'a saved Tier replaces the choose-your-tier section');

const subjectsUi = readFileSync('app/subjects/ExamSubjectsGrid.tsx', 'utf8');
assert.match(subjectsUi, /sm:grid-cols-2/);
assert.match(subjectsUi, /lg:grid-cols-3/, 'hierarchy cards have mobile and desktop layouts');
assert.match(subjectsUi, /pickCatalogText\(subject\.title, 'en'\)/);
assert.match(subjectsUi, /pickCatalogText\(subject\.title, 'hi'\)/, 'both bilingual titles render');

const subjectPage = readFileSync('app/subjects/[subject]/page.tsx', 'utf8');
const topicPage = readFileSync('app/subjects/[subject]/[topicSlug]/page.tsx', 'utf8');
assert.match(subjectPage, /findPublishedSyllabusSubject/);
assert.match(topicPage, /findPublishedSyllabusTopic/);
assert.match(
  topicPage,
  /`\/subjects\/\$\{subjectSlug\}\/\$\{topicSlug\}\/practice\/\$\{subtopic\.slug\}`/,
  'public subtopic cards link to the canonical practice route',
);
assert.doesNotMatch(
  topicPage,
  /`\/subjects\/\$\{subjectSlug\}\/\$\{topicSlug\}\/\$\{subtopic\.slug\}\/practice`/,
  'public subtopic cards never generate the obsolete practice route',
);

const exactExamLayouts = [
  readFileSync('app/subjects/[subject]/layout.tsx', 'utf8'),
  readFileSync('app/subjects/[subject]/[topicSlug]/layout.tsx', 'utf8'),
  readFileSync('app/subjects/[subject]/[topicSlug]/[subtopicSlug]/layout.tsx', 'utf8'),
  readFileSync('app/subjects/[subject]/[topicSlug]/practice/[subtopicSlug]/layout.tsx', 'utf8'),
].join('\n');
assert.doesNotMatch(
  exactExamLayouts,
  /load(?:Subject|Topic|Subtopic)ByRouteSlug|notFound\(/,
  'legacy catalog layouts must not reject valid exact-exam syllabus slugs before page validation',
);

const proxySource = readFileSync('proxy.ts', 'utf8');
assert.match(proxySource, /if \(!hasAuthenticatedSession\)[\s\S]*maybeRejectUnknownCatalogPath/, 'public path cache never rejects exact user syllabus slugs');

const publicSubjects = readFileSync('app/subjects/page.tsx', 'utf8');
assert.match(publicSubjects, /selected\.status === 'ready'/);
assert.match(publicSubjects, /<SubjectGrid \/>/, 'unauthenticated public catalog rendering remains available');

const submitRoute = readFileSync('app/api/practice/submit/route.ts', 'utf8');
assert.match(submitRoute, /submitQuestionAnswerForUser/, 'existing answer submission semantics remain in place');
assert.match(submitRoute, /question_exam_profile_mappings!inner[\s\S]*selected\.examProfileId/, 'authenticated submissions reject questions outside the exact selected profile');

console.log('exam learning tests passed');

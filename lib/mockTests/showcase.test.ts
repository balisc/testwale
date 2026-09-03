import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { MOCK_BLUEPRINTS } from './blueprints';
import { normalizeTierDisplayText } from '../tierDisplay';
import {
  buildPublicMockExamSummaries,
  resolveMockShowcaseCta,
  selectInitialMockExam,
  type MockShowcaseUserState,
  type PublicMockExamSummary,
} from './showcase';

function exam(overrides: Partial<PublicMockExamSummary> = {}): PublicMockExamSummary {
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
    sectionNames: ['English', 'Reasoning', 'Maths', 'General Awareness'],
    availability: 'available',
    destination: '/mock-tests/ssc-chsl',
    displayPriority: 20,
    ...overrides,
  };
}

test('tier labels use numeric public copy and normalize legacy saved titles', () => {
  assert.equal(normalizeTierDisplayText('SSC CGL Tier-I Full Mock'), 'SSC CGL Tier 1 Full Mock');
  assert.equal(normalizeTierDisplayText('SSC CHSL Tier II Mock'), 'SSC CHSL Tier 2 Mock');
  assert.equal(normalizeTierDisplayText('SSC CHSL टियर-I पूर्ण मॉक'), 'SSC CHSL टियर 1 पूर्ण मॉक');
  assert.equal(normalizeTierDisplayText('SSC CGL Tier 1 Full Mock'), 'SSC CGL Tier 1 Full Mock');
});

test('public summaries fail closed and only active production-ready feature-enabled blueprints are available', () => {
  const configs = Object.values(MOCK_BLUEPRINTS);
  const summaries = buildPublicMockExamSummaries(
    configs,
    [
      { code: MOCK_BLUEPRINTS['ssc-cgl'].limitedBlueprintCode!, isActive: true, isProductionReady: false },
      { code: MOCK_BLUEPRINTS['ssc-chsl'].blueprintCode, isActive: true, isProductionReady: true },
    ],
    () => true,
    (config) => config.examKey === 'ssc-cgl',
  );
  assert.equal(summaries.find((item) => item.examKey === 'ssc-cgl')?.availability, 'coming_soon');
  assert.equal(summaries.find((item) => item.examKey === 'ssc-chsl')?.availability, 'available');
  assert.equal(selectInitialMockExam(summaries)?.examKey, 'ssc-chsl');
  assert.equal(summaries.find((item) => item.examKey === 'ssc-chsl')?.sectionNames.length, 4);
  assert.equal(summaries.find((item) => item.examKey === 'ssc-chsl')?.tier, 'Tier 1');
});

test('future summaries participate in selection without component-specific exam conditions', () => {
  const future = exam({
    id: 'future-exam',
    examCode: 'FUTURE_EXAM',
    publicName: 'Future Exam',
    displayPriority: 1,
  });
  assert.equal(selectInitialMockExam([future, exam({ displayPriority: 2 })])?.id, 'future-exam');
  const selectorSource = readFileSync('app/home/components/mockShowcase/ExamMockSelector.tsx', 'utf8');
  assert.match(selectorSource, /exams\.map/);
  assert.doesNotMatch(selectorSource, /examKey\s*===\s*['"]ssc-/);
});

test('CTA resolves signed-out, first, resume, and completed-user states to existing routes', () => {
  const availableExam = exam();
  assert.deepEqual(resolveMockShowcaseCta({ exam: availableExam, authenticated: false, userState: null }), {
    kind: 'explore', label: 'Explore Mock Tests', href: '/mock-tests/ssc-chsl', canGenerate: false,
  });
  const newUser: MockShowcaseUserState = { activeTests: [], hasCompletedMock: false };
  assert.equal(resolveMockShowcaseCta({ exam: availableExam, authenticated: true, userState: newUser }).kind, 'generate_first');
  assert.equal(resolveMockShowcaseCta({
    exam: availableExam,
    authenticated: true,
    userState: { activeTests: [{ id: '11111111-1111-4111-8111-111111111111', examKey: 'ssc-chsl', status: 'in_progress' }], hasCompletedMock: false },
  }).href, '/mock-tests/11111111-1111-4111-8111-111111111111');
  assert.equal(resolveMockShowcaseCta({
    exam: availableExam,
    authenticated: true,
    userState: { activeTests: [], hasCompletedMock: true },
  }).kind, 'generate_new');
});

test('coming-soon exams cannot generate a new test', () => {
  const cta = resolveMockShowcaseCta({
    exam: exam({ availability: 'coming_soon' }),
    authenticated: true,
    userState: { activeTests: [], hasCompletedMock: false },
  });
  assert.equal(cta.kind, 'coming_soon');
  assert.equal(cta.canGenerate, false);
  assert.equal(cta.href, null);
  const resumable = resolveMockShowcaseCta({
    exam: exam({ availability: 'coming_soon' }),
    authenticated: true,
    userState: { activeTests: [{ id: '22222222-2222-4222-8222-222222222222', examKey: 'ssc-chsl', status: 'not_started' }], hasCompletedMock: false },
  });
  assert.equal(resumable.kind, 'resume');
  assert.equal(resumable.href, '/mock-tests/22222222-2222-4222-8222-222222222222');
});

test('homepage placement, accessibility, mobile overflow, and payload privacy remain explicit', () => {
  const home = readFileSync('app/page.tsx', 'utf8');
  const showcase = readFileSync('app/home/components/mockShowcase/MockTestShowcaseSection.tsx', 'utf8');
  const selector = readFileSync('app/home/components/mockShowcase/ExamMockSelector.tsx', 'utf8');
  const preview = readFileSync('app/home/components/mockShowcase/CBTPreviewCard.tsx', 'utf8');
  assert.ok(home.indexOf('<PublicExamExplorer') < home.indexOf('<MockTestShowcaseSection'));
  assert.ok(home.indexOf('<MockTestShowcaseSection') < home.indexOf('<HomeSubjects'));
  assert.match(selector, /role="radiogroup"/);
  assert.match(selector, /role="radio"/);
  assert.match(selector, /aria-checked=/);
  assert.match(selector, /ArrowRight[\s\S]+ArrowDown[\s\S]+ArrowLeft[\s\S]+ArrowUp/);
  assert.match(selector, /overflow-x-auto/);
  assert.match(selector, /snap-mandatory/);
  assert.match(showcase, /max-\[479px\]:text-2xl/);
  assert.match(showcase, /setSelectedId\(exam\.id\)/);
  assert.match(showcase, /<CBTPreviewCard exam=\{selectedExam\}/);
  assert.match(showcase, /selectedExam\.durationMinutes/);
  assert.match(showcase, /selectedExam\.maxMarks/);
  assert.match(preview, /visual sample only/i);
  assert.match(preview, /aria-hidden="true"/);
  assert.doesNotMatch(showcase + preview, /correct_option|correctOption|explanation|\/api\/mock-tests\/\[testId\]|question_mock/i);
});

test('homepage generation reuses the authenticated idempotent endpoint and blocks duplicate clicks', () => {
  const showcase = readFileSync('app/home/components/mockShowcase/MockTestShowcaseSection.tsx', 'utf8');
  assert.match(showcase, /generatingRef\.current/);
  assert.match(showcase, /idempotencyKeys\.current/);
  assert.match(showcase, /fetch\('\/api\/mock-tests\/generate'/);
  assert.match(showcase, /credentials:\s*'include'/);
  assert.match(showcase, /if \(!user \|\| !cta\.canGenerate \|\| generatingRef\.current\) return/);
});

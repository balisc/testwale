import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  canContinueFromExamStep,
  canSaveExamOnboarding,
  isValidCalendarDate,
  minFutureExamDateInput,
  needsExamOnboarding,
  validateTargetExamDate,
} from './examOnboarding';
import {
  ALL_EXAM_FAMILIES,
  filterExamSelectorOptions,
  isExamOptionSelectable,
  listExamFamilies,
  normalizeExamSelectorOption,
  type ExamSelectorOption,
} from './examSelector';
import { getSafeRedirectPath } from './safeRedirect';
import { deriveExamReadiness } from './examReadiness';

const PROFILE_ID = '11111111-1111-4111-8111-111111111111';
const CONTENT_ID = '22222222-2222-4222-8222-222222222222';

function option(overrides: Partial<ExamSelectorOption> = {}): ExamSelectorOption {
  return {
    exam_profile_id: PROFILE_ID,
    content_exam_id: CONTENT_ID,
    exam_code: 'MOCK_ALPHA',
    exam_slug: 'mock-alpha',
    official_title: { en: 'Alpha Recruitment Exam', hi: 'अल्फा भर्ती परीक्षा' },
    short_name: 'Alpha',
    display_title: { en: 'Alpha — Recruitment Exam', hi: 'अल्फा — भर्ती परीक्षा' },
    family_code: 'MOCK',
    content_family_code: 'CONTENT_A',
    conducting_body: 'Mock Commission',
    profile_category: 'recruitment',
    product_group: 'government_jobs',
    recurrence_status: 'recurring',
    scope_status: 'ready',
    can_select: true,
    is_coming_soon: false,
    availability_reason: null,
    sort_order: 1,
    active_subject_count: 1,
    active_topic_count: 2,
    active_subtopic_count: 3,
    verified_question_count: 12,
    ...overrides,
  };
}

const selectable = option();
const disabled = option({
  exam_profile_id: '33333333-3333-4333-8333-333333333333',
  exam_code: 'MOCK_BETA',
  official_title: { en: 'Beta Services Exam', hi: 'बीटा सेवा परीक्षा' },
  display_title: { en: 'Beta — Services Exam', hi: 'बीटा — सेवा परीक्षा' },
  content_exam_id: null,
  content_family_code: null,
  family_code: 'BETA',
  can_select: false,
  is_coming_soon: true,
  availability_reason: 'content_family_unmapped',
  sort_order: 2,
});

// Pure selector behavior: bilingual parsing/search, ordering, families and availability.
assert.deepEqual(normalizeExamSelectorOption(selectable)?.official_title, selectable.official_title);
assert.deepEqual(filterExamSelectorOptions([selectable, disabled], 'alpha recruitment', ALL_EXAM_FAMILIES), [selectable]);
assert.deepEqual(filterExamSelectorOptions([selectable, disabled], 'अल्फा भर्ती', ALL_EXAM_FAMILIES), [selectable]);
assert.deepEqual(filterExamSelectorOptions([selectable, disabled], 'MOCK_BETA', ALL_EXAM_FAMILIES), [disabled]);
assert.deepEqual(filterExamSelectorOptions([selectable, disabled], '', 'BETA'), [disabled]);
assert.deepEqual(listExamFamilies([selectable, disabled]), ['CONTENT_A', 'BETA']);
assert.equal(isExamOptionSelectable(selectable), true, 'a future can_select row works without UI changes');
assert.equal(isExamOptionSelectable(disabled), false, 'coming-soon rows are never selectable');
assert.equal(isExamOptionSelectable(option({ can_select: true, content_exam_id: null })), false, 'content family is required');
assert.equal(isExamOptionSelectable(option({ can_select: true, is_coming_soon: true })), false, 'coming-soon flag is never ignored');

// Exact-profile readiness is data driven; a sibling never inherits another
// profile's hierarchy merely because both use the same content family.
const mappedReadiness = deriveExamReadiness({
  profileActive: true,
  administrativelyDisabled: false,
  contentExamId: CONTENT_ID,
  counts: { activeSubjectCount: 1, activeTopicCount: 18, activeSubtopicCount: 75, verifiedQuestionCount: 250 },
});
assert.equal(mappedReadiness.canSelect, true, 'a complete published exam with verified questions is selectable');
assert.equal(mappedReadiness.isComingSoon, false);
assert.equal(mappedReadiness.availabilityReason, 'ready');
assert.equal(deriveExamReadiness({
  profileActive: true,
  administrativelyDisabled: false,
  contentExamId: CONTENT_ID,
  counts: { activeSubjectCount: 0, activeTopicCount: 0, activeSubtopicCount: 0, verifiedQuestionCount: 0 },
}).canSelect, false, 'an SSC sibling with no own mappings stays disabled');
assert.equal(deriveExamReadiness({
  profileActive: true,
  administrativelyDisabled: false,
  contentExamId: CONTENT_ID,
  counts: { activeSubjectCount: 0, activeTopicCount: 0, activeSubtopicCount: 0, verifiedQuestionCount: 0 },
}).availabilityReason, 'subject_mapping_missing', 'content-family mapping alone is insufficient');
assert.equal(deriveExamReadiness({
  profileActive: true,
  administrativelyDisabled: false,
  contentExamId: CONTENT_ID,
  counts: { activeSubjectCount: 1, activeTopicCount: 2, activeSubtopicCount: 0, verifiedQuestionCount: 20 },
}).availabilityReason, 'subtopic_mapping_missing');
assert.equal(deriveExamReadiness({
  profileActive: true,
  administrativelyDisabled: false,
  contentExamId: CONTENT_ID,
  counts: { activeSubjectCount: 1, activeTopicCount: 2, activeSubtopicCount: 3, verifiedQuestionCount: 0 },
}).availabilityReason, 'verified_questions_missing');
assert.equal(deriveExamReadiness({
  profileActive: true,
  profileSelectable: false,
  administrativelyDisabled: false,
  contentExamId: CONTENT_ID,
  counts: { activeSubjectCount: 1, activeTopicCount: 2, activeSubtopicCount: 3, verifiedQuestionCount: 20 },
}).availabilityReason, 'profile_not_selectable');
assert.equal(deriveExamReadiness({
  profileActive: true,
  administrativelyDisabled: false,
  scopeReady: false,
  contentExamId: CONTENT_ID,
  counts: { activeSubjectCount: 1, activeTopicCount: 2, activeSubtopicCount: 3, verifiedQuestionCount: 20 },
}).availabilityReason, 'scope_not_ready');
assert.equal(deriveExamReadiness({
  profileActive: true,
  administrativelyDisabled: false,
  contentExamId: CONTENT_ID,
  currentPublishedVersionCount: 2,
  counts: { activeSubjectCount: 1, activeTopicCount: 2, activeSubtopicCount: 3, verifiedQuestionCount: 20 },
}).availabilityReason, 'multiple_current_published_syllabi');
assert.equal(deriveExamReadiness({
  profileActive: true,
  administrativelyDisabled: false,
  contentExamId: CONTENT_ID,
  hierarchyValid: false,
  counts: { activeSubjectCount: 1, activeTopicCount: 2, activeSubtopicCount: 3, verifiedQuestionCount: 20 },
}).availabilityReason, 'broken_hierarchy');
assert.equal(isExamOptionSelectable(option({ verified_question_count: 0 })), false, 'questions are required');

// Date and onboarding lifecycle validation.
assert.equal(isValidCalendarDate('2026-02-29'), false);
assert.equal(validateTargetExamDate('2026-08-04', '2026-08-05'), null, 'past dates are rejected');
assert.equal(validateTargetExamDate('2026-08-05', '2026-08-05'), null, 'today is not a future date');
assert.equal(validateTargetExamDate('2026-08-06', '2026-08-05'), '2026-08-06');
assert.equal(minFutureExamDateInput('2026-12-31'), '2027-01-01');
assert.equal(canContinueFromExamStep(PROFILE_ID), true);
assert.equal(canSaveExamOnboarding(PROFILE_ID, '2026-08-06', '2026-08-05'), true);
assert.equal(canSaveExamOnboarding(PROFILE_ID, 'bad-date', '2026-08-05'), false);
assert.equal(
  needsExamOnboarding({
    required: true,
    completedAt: null,
    targetExamProfileId: null,
    targetExamId: null,
    targetExamDate: null,
  }),
  true,
);
assert.equal(
  needsExamOnboarding({
    required: false,
    completedAt: '2026-08-05T10:00:00Z',
    targetExamProfileId: PROFILE_ID,
    targetExamId: CONTENT_ID,
    targetExamDate: '2026-08-06',
  }),
  false,
  'completed onboarding remains durable on refresh and new devices',
);

assert.equal(getSafeRedirectPath('/profile/activity?range=week'), '/profile/activity?range=week');
assert.equal(getSafeRedirectPath('https://evil.example', '/dashboard'), '/dashboard');
assert.equal(getSafeRedirectPath('//evil.example', '/dashboard'), '/dashboard');

const server = readFileSync('lib/examOnboardingServer.ts', 'utf8');
const catalogueServer = readFileSync('lib/examCatalogueServer.ts', 'utf8');
const route = readFileSync('app/api/onboarding/exam/route.ts', 'utf8');
const client = readFileSync('app/onboarding/OnboardingClient.tsx', 'utf8');
const proxy = readFileSync('proxy.ts', 'utf8');
const callback = readFileSync('app/auth/callback/route.ts', 'utf8');
const logout = readFileSync('app/api/auth/me/route.ts', 'utf8');
const authContext = readFileSync('lib/AuthContext.tsx', 'utf8');
const appSession = readFileSync('lib/appSession.ts', 'utf8');
const readinessMigration = readFileSync('scripts/migrate_exam_selector_content_readiness.sql', 'utf8');
const preferenceMigration = readFileSync('scripts/migrate_user_exam_preferences.sql', 'utf8');
const genericPreferenceMigration = readFileSync('scripts/migrate_generic_exam_preparation_preferences.sql', 'utf8');
const preferenceServer = readFileSync('lib/examPreferenceServer.ts', 'utf8');
const tracksRoute = readFileSync('app/api/onboarding/tracks/route.ts', 'utf8');
const profilePreferenceRoute = readFileSync('app/api/profile/exam-preference/route.ts', 'utf8');
const publicExamSyllabus = readFileSync('lib/publicExamExplorer.ts', 'utf8');
const publicSubtopicPage = readFileSync('app/exams/[examSlug]/[subjectSlug]/[topicSlug]/[subtopicSlug]/page.tsx', 'utf8');
const verificationSql = readFileSync('scripts/verify_exam_selector_and_preferences.sql', 'utf8');
const selectorViewSql = readinessMigration.slice(
  readinessMigration.indexOf('create or replace view public.exam_selector_options'),
);

// Source-of-truth and no hardcoded catalogue.
assert.match(server, /getReadyExamSelectorOptions/, 'onboarding uses the shared catalogue service');
assert.match(catalogueServer, /\.from\(['"]exam_selector_options['"]\)/, 'options come from the selector view');
assert.match(catalogueServer, /\.eq\('can_select', true\)[\s\S]*\.eq\('is_coming_soon', false\)/, 'normal selector fetches ready exams only');
assert.match(client, /SSC_CGL_EXAM_CODE/, 'the Tier prompt uses the shared stable CGL code');
assert.match(catalogueServer, /\.order\(['"]sort_order['"]/, 'canonical sort order is preserved');

// Accessible UI and controlled all-coming-soon behavior.
assert.match(client, /<fieldset/);
assert.match(client, /<legend/);
assert.match(client, /type="radio"/);
assert.match(client, /disabled=\{!selectable\}/, 'coming-soon cards disable native controls');
assert.match(client, /disabled=\{!canContinue \|\| tracksLoading\}/, 'continue is disabled without a valid selection');
assert.match(client, /selectableCount === 0/, 'zero-selectable state has controlled messaging');
assert.match(client, /sm:grid-cols-2 lg:grid-cols-3/, 'cards cover mobile, tablet and desktop');
assert.match(client, /option\.exam_profile_id !== initialProfileId\)[\s\S]*setExamDate\(''\)[\s\S]*setSelectedTier\(null\)/, 'changing exam requires a new date and Tier choice');
assert.match(client, /setStep\(2\)[\s\S]*loadTracks\(selectedOption\.exam_profile_id\)/, 'every exact exam opens a data-driven preparation scope step');
assert.match(client, /step === 2 \? \(/, 'exam and preparation scope are separate steps');
assert.match(client, /Choose your SSC CGL Tier/);
assert.match(client, /tierCode: selectedTrack\.tierCode/);
assert.match(client, /Written \/ Descriptive[\s\S]*Coming soon/, 'unsupported written content is never presented as selectable MCQ content');
assert.match(client, /payload\.savedPreference && !editMode[\s\S]*router\.replace\(getExamPreferenceHref/, 'valid returning preferences skip onboarding');
assert.match(client, /changesExistingExamOnly \? '\/api\/profile\/exam-preference' : '\/api\/onboarding\/exam'/, 'same-exam profile changes preserve date/onboarding through the change-preference API');

// SQL uses exact syllabus nodes and valid parents; it never broad-enables a
// family or makes the complete CGL exam depend on Polity-only priority tables.
assert.doesNotMatch(readinessMigration, /(?:from|join)\s+public\.polity_exam_topic_priority_v2/i);
assert.doesNotMatch(readinessMigration, /(?:from|join)\s+public\.polity_exam_subtopic_priority_v2/i);
assert.doesNotMatch(readinessMigration, /create table(?: if not exists)? public\.exam_syllabus_question_mappings/i);
assert.doesNotMatch(readinessMigration, /insert\s+into\s+public\.exam_syllabus_question_mappings/i);
assert.match(readinessMigration, /public\.question_exam_profile_mappings/i);
assert.match(readinessMigration, /from public\.question_exam_profile_mappings m[\s\S]*join public\.questions q[\s\S]*q\.id = m\.question_id/i);
assert.match(readinessMigration, /group by m\.exam_profile_id/i);
assert.match(readinessMigration, /content_subtopic_id[\s\S]*catalog_subtopic_id/i, 'operational syllabus nodes use explicit catalog IDs');
assert.match(readinessMigration, /st\.content_subtopic_id = q\.subtopic_id/i, 'only questions on explicitly linked operational subtopics count');
assert.match(readinessMigration, /operational_stage_subtopics[\s\S]*st\.stage_code = any\(coalesce\(m\.stage_codes/i, 'Tier availability agrees with exact operational stage links');
assert.doesNotMatch(readinessMigration, /lower\([^\n]*(?:title|name)|unaccent\([^\n]*(?:title|name)/i, 'titles are never normalized for ownership');
assert.match(readinessMigration, /t\.id = n\.parent_node_id[\s\S]*t\.syllabus_version_id = n\.syllabus_version_id/i);
assert.doesNotMatch(selectorViewSql, /exam_tags/i, 'selector counts only durable exact mappings');
assert.doesNotMatch(readinessMigration, /q\.exam_tags/i, 'selector migration never uses broad question tags');
assert.match(readinessMigration, /active_subject_count = 0[\s\S]*active_topic_count = 0[\s\S]*active_subtopic_count = 0[\s\S]*verified_question_count = 0/i);
assert.match(readinessMigration, /exam_syllabus_versions[\s\S]*publication_status = 'published'[\s\S]*is_current is true/i);
assert.match(readinessMigration, /to_jsonb\(ep\.metadata\) ->> 'admin_disabled'/i);
assert.doesNotMatch(readinessMigration, /metadata\s*->>\s*'admin_disabled'\)\s*::boolean/i);
assert.match(readinessMigration, /expected unique hierarchy 7\/60\/362/i);
assert.match(readinessMigration, /expected 590 node-stage placements/i);
assert.match(readinessMigration, /to_jsonb\(ep\) \? 'is_selectable'/i, 'optional is_selectable is enforced safely');
assert.match(readinessMigration, /scope_not_ready/i, 'scope readiness is enforced');
assert.doesNotMatch(readinessMigration, /insert\s+into\s+public\.(subjects|topics|subtopics)/i, 'taxonomy is not duplicated');
assert.match(verificationSql, /to_regclass\('public\.user_exam_preferences'\)/i);
assert.doesNotMatch(verificationSql, /\b(insert|update|delete|truncate|alter|create|drop)\b\s+(?:into\s+|table\s+|function\s+)?public\./i, 'verification remains read-only');

// Secure canonical save: browser supplies profile/date/Tier; server derives content family and user.
assert.match(route, /getAuthUserFromCookies\(\)/);
assert.match(route, /examProfileId:\s*typeof body\.examProfileId === 'string' \? body\.examProfileId : ''/);
assert.match(route, /tierCode:\s*body\.tierCode/);
assert.match(route, /'userId'[\s\S]*'user_id'[\s\S]*invalid_user_scope/, 'spoofed browser user IDs are rejected');
assert.doesNotMatch(route, /body\.contentExamId/i, 'browser content IDs are ignored');
assert.match(server, /if \(!option\.can_select\)/, 'disabled exams are rejected server-side');
assert.match(server, /if \(!option\) return \{ ok: false, code: 'unknown_exam' \}/, 'unknown profiles are rejected');
assert.doesNotMatch(server, /filterCompletePublishedExams|applyDatabaseReadiness/, 'server does not recreate stale readiness logic');
assert.match(catalogueServer, /READY_EXAM_SELECTOR_COLUMNS/, 'canonical view readiness reaches the browser');
assert.match(catalogueServer, /throw new ExamCatalogueDatabaseError/, 'selector database failures are not disguised as zero readiness');
assert.match(server, /option\.exam_code === SSC_CGL_EXAM_CODE && !tierCode/);
assert.match(server, /\.rpc\('complete_exam_onboarding_with_tier'/, 'exam, date and Tier save in one database transaction');
assert.doesNotMatch(server, /delete\(|\.delete\(/, 'edit mode never deletes attempts or progress');
assert.match(preferenceMigration, /create or replace function public\.complete_exam_onboarding_with_tier/i);
assert.match(preferenceMigration, /target_exam_profile_id = excluded\.target_exam_profile_id[\s\S]*target_exam_id = excluded\.target_exam_id/i);
assert.match(preferenceMigration, /if v_exam_code = 'SSC_CGL'[\s\S]*p_preferred_tier_code not in \('TIER_I', 'TIER_II'\)/i);
assert.match(preferenceMigration, /on conflict \(user_id, exam_profile_id\) do update/i);
assert.match(route, /savedPreference: preferenceResult\.status === 'ready'/, 'preference state is returned separately from the successful catalogue');
assert.match(route, /preferenceError: preferenceResult\.status === 'error'/, 'preference database failures remain explicit');

// Generic exact-stage storage and service-only validation.
assert.match(tracksRoute, /getAuthUserFromCookies\(\)/);
assert.match(tracksRoute, /Cache-Control': 'private, no-store'/);
assert.match(preferenceServer, /from\('exam_preparation_track_options'\)[\s\S]*eq\('is_available', true\)[\s\S]*gt\('verified_question_count', 0\)/);
assert.match(preferenceServer, /isMissingPreparationModeColumn[\s\S]*getLegacySscCglPreference/, 'legacy preference rows remain readable before the generic migration');
assert.match(preferenceServer, /isMissingGenericPreferenceRpc[\s\S]*saveLegacySscCglPreference/, 'missing generic RPCs use the compatible CGL save path');
assert.match(preferenceServer, /rpc\('complete_exam_onboarding_with_tier'/, 'legacy CGL onboarding still saves the exam and date');
assert.match(preferenceServer, /rpc\('update_user_exam_tier_preference'/, 'legacy CGL fallback preserves the exact selected Paper');
assert.match(preferenceServer, /submitted\.examCode !== 'SSC_CGL'/, 'legacy fallback never broadens to unsupported exams');
assert.match(profilePreferenceRoute, /'userId' in body \|\| 'user_id' in body[\s\S]*invalid_user_scope/);
assert.match(genericPreferenceMigration, /create or replace view public\.exam_preparation_track_options/i);
assert.match(genericPreferenceMigration, /stage_content_subtopics[\s\S]*st\.stage_code = s\.stage_code[\s\S]*st\.content_subtopic_id = q\.subtopic_id/i);
assert.match(genericPreferenceMigration, /create or replace function public\.complete_exam_onboarding_with_preference/i);
assert.match(genericPreferenceMigration, /create or replace function public\.update_user_exam_preparation_preference/i);
assert.match(genericPreferenceMigration, /revoke all on function[\s\S]*from public, anon, authenticated/i);
assert.doesNotMatch(genericPreferenceMigration, /\b(delete|truncate)\b/i, 'generic migration preserves users, questions, attempts and preferences');
assert.match(publicExamSyllabus, /exam_syllabus_node_stage_mappings[\s\S]*eq\('stage_code', normalizedStageCode\)/, 'generic syllabus is filtered by exact stage mappings');
assert.match(publicSubtopicPage, /stageCodes: stageCode \? \[stageCode\] : undefined/);
assert.match(publicSubtopicPage, /stageCode=\{stageCode \?\? undefined\}/, 'subsequent question batches keep the exact selected stage');

// Guard/auth safety: OAuth recovery runs first, logout is reachable, public routes are not gated.
assert.ok(
  proxy.indexOf('maybeForwardStrayOAuthCode(request)') < proxy.indexOf('maybeEnforceExamOnboarding(request)'),
  'OAuth recovery runs before onboarding enforcement',
);
assert.match(proxy, /if \(!isOnboarding && !isProtected\) return null/);
assert.match(logout, /export async function DELETE\(\)/);
assert.match(callback, /attachAuthCookie/);
assert.doesNotMatch(authContext, /registerTabCloseLogout|pagehide/, 'refresh must never trigger logout');
assert.match(authContext, /await fetch\('\/api\/auth\/logout'/, 'explicit logout clears the server cookie');
assert.match(authContext, /window\.location\.replace\('\/'\)/, 'logout immediately opens the guest homepage');
assert.doesNotMatch(
  appSession.match(/export function getSessionCookieOptions\(\)[\s\S]*?\n\}/)?.[0] ?? '',
  /maxAge/,
  'auth cookie is a browser-session cookie and survives page refresh',
);

console.log('exam onboarding tests passed');

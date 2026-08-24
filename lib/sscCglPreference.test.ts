import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  defaultSscCglStageForTier,
  getSscCglLoginHref,
  getSscCglPreferenceHref,
  isSscCglPreferenceTier,
} from './sscCglPreference';

assert.equal(defaultSscCglStageForTier('TIER_I'), 'TIER_I');
assert.equal(defaultSscCglStageForTier('TIER_II'), 'TIER_II_PAPER_I');
assert.equal(getSscCglPreferenceHref({ tierCode: 'TIER_I', stageCode: 'TIER_I' }), '/ssc-cgl/tier-1/subjects');
assert.equal(getSscCglPreferenceHref({ tierCode: 'TIER_II', stageCode: 'TIER_II_PAPER_I' }), '/ssc-cgl/tier-2/paper-1/subjects');
assert.equal(getSscCglPreferenceHref({ tierCode: 'TIER_II', stageCode: 'TIER_II_PAPER_II' }), '/ssc-cgl/tier-2/paper-2/subjects');
assert.equal(getSscCglPreferenceHref({ tierCode: 'TIER_II', stageCode: 'TIER_II_PAPER_III' }), '/ssc-cgl/tier-2/paper-3/subjects');
assert.equal(isSscCglPreferenceTier('TIER_II'), true);
assert.equal(isSscCglPreferenceTier('TIER_III'), false);
assert.equal(getSscCglLoginHref('/subjects'), '/login');
assert.equal(getSscCglLoginHref('/ssc-cgl'), '/login?redirect=%2Fssc-cgl');
assert.equal(
  getSscCglLoginHref('/ssc-cgl/tier-2/paper-1/subjects'),
  '/login?redirect=%2Fssc-cgl%2Fauth-return%3FreturnTo%3D%252Fssc-cgl%252Ftier-2%252Fpaper-1%252Fsubjects',
);

const migration = readFileSync('scripts/migrate_user_exam_preferences.sql', 'utf8');
assert.match(migration, /create table if not exists public\.user_exam_preferences/i);
assert.match(migration, /foreign key \(user_id\) references public\.users\(id\) on delete cascade/i);
assert.match(migration, /foreign key \(exam_profile_id\) references public\.exam_profiles\(id\) on delete cascade/i);
assert.match(migration, /primary key \(user_id, exam_profile_id\)/i, 'duplicate user/exam preferences are impossible');
assert.match(migration, /preferred_tier_code in \('TIER_I', 'TIER_II'\)/i);
assert.match(migration, /alter table public\.user_exam_preferences enable row level security/i);
assert.match(migration, /to anon, authenticated\s+using \(false\)\s+with check \(false\)/i, 'anonymous and direct browser access is denied');
assert.match(migration, /revoke all on table public\.user_exam_preferences from public, anon, authenticated/i);
assert.match(migration, /grant select, insert, update on table public\.user_exam_preferences to service_role/i);
assert.match(migration, /drop function if exists public\.complete_exam_onboarding_with_tier\(uuid, uuid, date\)/i);
assert.doesNotMatch(migration, /drop function if exists public\.complete_exam_onboarding_with_tier\(uuid, uuid, date, text\)/i);
assert.doesNotMatch(migration, /drop function if exists public\.update_user_exam_tier_preference\(uuid, uuid, text, text\)/i);
assert.match(migration, /create or replace function public\.update_user_exam_tier_preference/i);
assert.match(migration, /security definer[\s\S]*set search_path = public, pg_temp/i);
assert.match(migration, /grant execute on function public\.update_user_exam_tier_preference\(uuid, uuid, text, text\)\s+to service_role/i);
assert.doesNotMatch(migration, /7a1436bc-9ea3-400e-afab-32b3bb05d0c6/i, 'live exam UUID is never hardcoded');

const server = readFileSync('lib/sscCglPreferenceServer.ts', 'utf8');
const catalogueServer = readFileSync('lib/examCatalogueServer.ts', 'utf8');
assert.match(server, /^import 'server-only';/);
assert.match(server, /getActiveExamProfileIdentity\(\{ examCode: SSC_CGL_EXAM_CODE \}\)/);
assert.match(catalogueServer, /from\('exam_selector_options'\)[\s\S]*eq\('can_select', true\)[\s\S]*eq\('is_coming_soon', false\)/);
assert.match(server, /from\('user_exam_preferences'\)[\s\S]*eq\('user_id', userId\)[\s\S]*eq\('exam_profile_id', examProfileId\)/);
assert.match(server, /if \(result\.error\) return \{ row: null, error:/, 'real database errors are preserved');
assert.match(server, /if \(!result\.row\) return \{ status: 'missing' \}/, 'only an absent row is missing');
assert.match(server, /mode === 'create_if_missing'[\s\S]*readPreferenceRow/, 'initial selection preserves an existing preference');
assert.match(server, /rpc\('update_user_exam_tier_preference'/, 'all writes use the validated server-only RPC');
assert.doesNotMatch(server, /\.from\('user_exam_preferences'\)[\s\S]*\.insert\(/, 'server never bypasses the preference RPC');
assert.doesNotMatch(server, /\.upsert\(row/, 'Profile changes do not rerun onboarding or bypass the RPC');
assert.match(server, /question_exam_profile_mappings!inner[\s\S]*overlaps\('question_exam_profile_mappings\.stage_codes', stageCodes\)/, 'Tier availability comes from exact stage-coded mappings');
assert.doesNotMatch(server, /unstable_cache|revalidate:/, 'user preferences are never shared-cached');

const route = readFileSync('app/api/profile/ssc-cgl-preference/route.ts', 'utf8');
assert.match(route, /getAuthUserFromCookies\(\)/);
assert.doesNotMatch(route, /premium_required|getSscCglPreferenceAccess/, 'every authenticated CGL learner can manage the required Tier choice');
assert.match(route, /saveSscCglPreference\(session\.id, body\.tierCode, mode\)/, 'writes are bound to the signed-cookie user');
assert.match(route, /'userId'[\s\S]*'user_id'[\s\S]*invalid_user_scope/, 'client-supplied user IDs are rejected');
assert.match(route, /status: 401/, 'anonymous API access fails');
assert.match(route, /Cache-Control': 'private, no-store'/, 'preference responses cannot leak through shared caches');
assert.match(route, /revalidatePath\('\/profile'\)[\s\S]*revalidatePath\('\/ssc-cgl'\)/, 'Tier changes invalidate auth-scoped pages');

const entry = readFileSync('app/ssc-cgl/page.tsx', 'utf8');
assert.match(entry, /getAuthUserFromCookies\(\)/);
assert.match(entry, /if \(!session\) redirect\('\/exams\/ssc-cgl'\)/, 'guests see the seven-subject public syllabus instead of Tier choices');
assert.doesNotMatch(entry, /access\.premium|getSscCglPreferenceAccess/);
assert.match(entry, /if \(result\.status === 'ready'\)[\s\S]*savedTierAvailable[\s\S]*redirect\(getSscCglPreferenceHref\(result\.preference\)\)/, 'usable saved preferences redirect on the server before rendering');
assert.match(entry, /SscCglPreferenceLoadError/, 'authenticated preference lookup errors fail visibly');

const tierPage = readFileSync('app/ssc-cgl/SscCglTierSelectionPage.tsx', 'utf8');
assert.match(tierPage, /persistPreference \? \(/);
assert.match(tierPage, /saveMode = 'create_if_missing'/);
assert.match(tierPage, /mode: saveMode/);
assert.match(tierPage, /router\.push\(getSscCglPreferenceHref\(body\.preference\)\)/);
assert.match(tierPage, /disabled=\{savingTier !== null \|\| !available\}/, 'unavailable authenticated Tier is disabled');
assert.match(tierPage, /available \? \([\s\S]*<Link/, 'unavailable guest Tier never becomes a link');
assert.doesNotMatch(tierPage, /localStorage|sessionStorage|document\.cookie/, 'guest choice is not browser-persisted');

const deepRoute = readFileSync('app/ssc-cgl/[...path]/page.tsx', 'utf8');
assert.match(deepRoute, /getAuthUserFromCookies\(\)[\s\S]*if \(!session\) redirect\('\/exams\/ssc-cgl'\)/, 'Tier-specific deep routes are login-only');
assert.doesNotMatch(deepRoute, /saveSscCglPreference|user_exam_preferences/, 'deep links never overwrite preference');
const authReturn = readFileSync('app/ssc-cgl/auth-return/page.tsx', 'utf8');
assert.match(authReturn, /parseSscCglRoute\(segments\.slice\(1\)\)/, 'post-login Tier is derived from a canonical route');
assert.match(authReturn, /existing\.status === 'ready'\) redirect\(returnTo\)/, 'existing preferences are never overwritten');
assert.match(authReturn, /saveSscCglPreference\(session\.id, tierCode, 'create_if_missing'\)/);
assert.doesNotMatch(authReturn, /userId|user_id/, 'auth handoff never accepts a client user identity');

const profileCard = readFileSync('app/profile/components/SscCglPreferenceCard.tsx', 'utf8');
assert.match(profileCard, /mode: 'replace'/);
assert.match(profileCard, /role="dialog"[\s\S]*aria-modal="true"/, 'Change Tier uses an accessible modal');
assert.match(profileCard, /Target Exam|लक्ष्य परीक्षा/);
assert.match(profileCard, /Preferred Tier|पसंदीदा टियर/);
assert.match(profileCard, /Preferred Paper|पसंदीदा पेपर/);
assert.match(profileCard, /router\.push\(getSscCglPreferenceHref\(body\.preference\)\)/, 'Profile change opens the new Tier subjects page');
assert.match(profileCard, /router\.refresh\(\)/, 'Profile save refreshes server-rendered state');
assert.match(profileCard, /questionwale:clear-user-caches/);
const profileOverview = readFileSync('app/profile/ProfileOverviewPage.tsx', 'utf8');
const genericProfileCard = readFileSync('app/profile/components/ExamPreferenceCard.tsx', 'utf8');
assert.match(profileOverview, /target_exam_profile_id[\s\S]*<ExamPreferenceCard/, 'profile preference UI is bound to the exact target profile ID');
assert.doesNotMatch(profileOverview, /target_exam_title[\s\S]*SSC CGL/, 'profile behavior never depends on a translated display title');
assert.doesNotMatch(profileOverview, /is_premium \? <SscCglPreferenceCard/);
assert.match(genericProfileCard, /Selected Tier/);
assert.match(genericProfileCard, /Paper \/ stage/);
assert.match(genericProfileCard, /Preparation mode/);
assert.match(genericProfileCard, /\/onboarding\?edit=1&returnTo=%2Fprofile/, 'change action reuses onboarding validation and save APIs');
const authContext = readFileSync('lib/AuthContext.tsx', 'utf8');
assert.match(authContext, /questionwale:clear-user-caches/, 'logout clears mounted user-scoped preference state');

const updateFunction = migration.slice(
  migration.indexOf('create or replace function public.update_user_exam_tier_preference'),
  migration.indexOf('-- ---------------------------------------------------------------------------\n-- Atomic onboarding'),
);
assert.doesNotMatch(updateFunction, /exam_date|exam_onboarding_/, 'Tier change does not modify exam date or onboarding state');
assert.match(updateFunction, /tier_unavailable/, 'database rejects an unavailable Tier');

const scopedResponsiveFiles = [
  'app/profile/page.tsx',
  'app/profile/ProfileShell.tsx',
  'app/ssc-cgl/SscCglTierSelectionPage.tsx',
  'app/ssc-cgl/SscCglSubjectsPage.tsx',
  'app/ssc-cgl/SscCglTopicsPage.tsx',
  'app/ssc-cgl/SscCglSubtopicsPage.tsx',
];
for (const file of scopedResponsiveFiles) {
  const source = readFileSync(file, 'utf8');
  assert.doesNotMatch(source, /overflow-x-hidden/, `${file} must fix overflow sources instead of hiding them`);
  assert.match(source, /min-w-0/, `${file} must allow grid and flex descendants to shrink`);
}

console.log('sscCglPreference tests passed');

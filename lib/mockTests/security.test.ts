import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const migration = readFileSync('scripts/migrate_ssc_cgl_tier1_mock_tests.sql', 'utf8');
const chslMigration = readFileSync('scripts/migrate_ssc_chsl_tier1_mock_tests.sql', 'utf8');
const strictVerificationMigration = readFileSync('scripts/migrate_strict_mock_content_verification.sql', 'utf8');
const strictAtomicV2Patch = readFileSync('scripts/patch_strict_mock_atomic_gate_v2.sql', 'utf8');
const egressOptimizationMigration = readFileSync('scripts/migrate_egress_optimization_v2.sql', 'utf8');
const strictVerifier = readFileSync('scripts/strict-verify-ssc-chsl-mock-inventory.ts', 'utf8');
const server = readFileSync('lib/mockTests/server.ts', 'utf8');
const workspace = readFileSync('app/mock-tests/[testId]/MockTestWorkspace.tsx', 'utf8');
const entry = readFileSync('components/mockTests/SscMockEntry.tsx', 'utf8');

test('migration fails closed for browser roles and keeps the answer key private', () => {
  assert.match(migration, /alter table public\.mock_test_item_answers enable row level security/i);
  assert.match(migration, /revoke all on table public\.mock_test_item_answers from public, anon, authenticated/i);
  assert.match(migration, /revoke all on function public\.create_mock_test_from_selection[\s\S]+from public, anon, authenticated/i);
  assert.doesNotMatch(migration, /update\s+public\.questions[\s\S]{0,500}exam_tags|insert\s+into\s+public\.questions/i);
});

test('all security-definer mock RPCs pin their search path', () => {
  const functionPattern = new RegExp('create or replace function public\\.([a-z0-9_]+)\\([\\s\\S]*?\\n\\$function\\$;', 'gi');
  const functions = [...migration.matchAll(functionPattern)];
  const securityDefiners = functions.filter((match) => /security definer/i.test(match[0]));
  assert.ok(securityDefiners.length >= 7);
  for (const match of securityDefiners) {
    assert.match(match[0], /set search_path = pg_catalog, public/i, `${match[1]} does not pin search_path`);
  }
});

test('pre-submit shell code never queries the private answer table', () => {
  const shellStart = server.indexOf('export async function getMockTestShell');
  const resultStart = server.indexOf('export async function getMockTestResult');
  assert.ok(shellStart > 0 && resultStart > shellStart);
  const preSubmitCode = server.slice(shellStart, resultStart);
  assert.doesNotMatch(preSubmitCode, /mock_test_item_answers|correct_option|explanation_snapshot|source_snapshot/);
  assert.match(preSubmitCode, /if \(test\.status !== 'in_progress'\) return \{ \.\.\.shell, items: \[\] \}/);
});

test('generation validates idempotency, readiness, and server-created selection', () => {
  assert.match(server, /IDEMPOTENCY_PATTERN\.test\(idempotencyKey\)/);
  assert.match(server, /readiness\.generationEnabled/);
  assert.match(server, /randomBytes\(32\)/);
  assert.doesNotMatch(server, /order\([^\n]*random/i);
  assert.match(server, /limitedInventoryCanGenerate[\s\S]+selectMockItems/);
  assert.match(server, /cells: allCells\(examKey, allowLimited\)/);
});

test('strict automated review is service-only, transactional, stale-safe, and cannot launch the blueprint', () => {
  assert.match(strictVerificationMigration, /^begin;/im);
  assert.match(strictVerificationMigration, /commit;\s*$/i);
  assert.match(strictVerificationMigration, /alter table public\.mock_content_verification_runs enable row level security/i);
  assert.match(strictVerificationMigration, /revoke all on function public\.apply_strict_mock_facet_verification[\s\S]+from public, anon, authenticated/i);
  assert.match(strictVerificationMigration, /f\.updated_at = p\.facet_updated_at and q\.updated_at = p\.question_updated_at/i);
  assert.match(strictVerificationMigration, /q\.is_active is true and q\.is_verified is true and coalesce\(q\.report_count, 0\) = 0/i);
  assert.match(strictVerificationMigration, /f\.section_key = 'english'[\s\S]+template_generation' = 'deterministic_rule_and_context_checked'/i);
  assert.match(strictVerificationMigration, /c\.bucket_key <> 'atomic_comprehension'[\s\S]+g\.reviewer_status = 'verified'[\s\S]+g\.expected_item_count = 5/i);
  assert.doesNotMatch(strictVerificationMigration, /f\.section_key = 'english'\s+and c\.bucket_key <> 'atomic_comprehension'/i);
  assert.match(strictVerificationMigration, /get diagnostics v_applied = row_count/i);
  assert.doesNotMatch(strictVerificationMigration, /is_production_ready\s*=\s*true|QW_SSC_CHSL_MOCKS_ENABLED/i);
  assert.match(strictAtomicV2Patch, /^begin;/im);
  assert.match(strictAtomicV2Patch, /ssc-chsl-tier1-strict-v1[\s\S]+ssc-chsl-tier1-strict-v2/i);
  assert.match(strictAtomicV2Patch, /old_atomic_exclusion_present/i);
  assert.doesNotMatch(strictAtomicV2Patch, /update\s+public\.|delete\s+from\s+public\.|insert\s+into\s+public\./i);
});

test('generic readiness is resolved by blueprint and is not CGL-profile locked', () => {
  const readinessStart = migration.indexOf('create or replace function public.get_mock_test_readiness');
  const candidatesStart = migration.indexOf('create or replace function public.get_mock_test_candidates');
  const readiness = migration.slice(readinessStart, candidatesStart);
  assert.match(readiness, /where b\.code = p_blueprint_code/);
  assert.doesNotMatch(readiness, /ep\.code = 'SSC_CGL'|ep\.slug = 'ssc-combined-graduate-level-examination'/);
  assert.match(server, /get_mock_test_readiness/);
  assert.match(server, /getMockBlueprint\(examKey\)/);
  assert.match(server, /get_mock_test_candidates[\s\S]+\.range\(from, from \+ pageSize - 1\)/);
});

test('egress optimization aggregates in Postgres and keeps compact RPCs service-only', () => {
  assert.match(egressOptimizationMigration, /^begin;/im);
  assert.match(egressOptimizationMigration, /commit;\s*$/i);
  assert.match(egressOptimizationMigration, /get_exam_question_counts_compact[\s\S]+group by q\.subtopic_id/i);
  assert.match(egressOptimizationMigration, /get_mock_test_candidates_for_user[\s\S]+from public\.user_attempts/i);
  assert.match(egressOptimizationMigration, /revoke all on function public\.get_exam_question_counts_compact[\s\S]+from public, anon, authenticated/i);
  assert.match(egressOptimizationMigration, /revoke all on function public\.get_mock_test_candidates_for_user[\s\S]+from public, anon, authenticated/i);
  assert.match(server, /get_mock_test_candidates_for_user[\s\S]+p_recent_test_limit/);
});

test('strict verifier avoids full inventory downloads once ready and scopes deficit scans', () => {
  assert.match(strictVerifier, /inventoryReady[\s\S]+ready_inventory_short_circuit/);
  assert.match(strictVerifier, /facets_scanned:\s*0[\s\S]+questions_scanned:\s*0/);
  assert.match(strictVerifier, /\.eq\('reviewer_status', 'provisional'\)[\s\S]+\.in\('bucket_key', deficientBucketKeys\)/);
  assert.match(strictVerifier, /question_key:source_metadata->>question_key/);
});

test('CHSL freezes global timing and the save RPC only locks sectional blueprints', () => {
  assert.match(chslMigration, /"timing_strategy":"global"/);
  assert.match(chslMigration, /"standard_total_seconds":3600/);
  assert.match(chslMigration, /"scribe_total_seconds":4800/);
  assert.doesNotMatch(chslMigration, /standard_section_seconds|scribe_section_seconds/);
  assert.match(migration, /if v_timing_strategy = 'sectional' then[\s\S]+mock_section_locked/);
  assert.match(migration, /elsif v_timing_strategy <> 'global' then/);
  assert.match(workspace, /timing\?\.timingStrategy === 'sectional' \? timing\.activeSectionIndex : null/);
});

test('final scoring is derived from each test frozen rules snapshot', () => {
  assert.match(migration, /v_marks_correct := \(v_test\.rules_snapshot ->> 'marks_correct'\)::numeric/);
  assert.match(migration, /v_marks_wrong := \(v_test\.rules_snapshot ->> 'marks_wrong'\)::numeric/);
  assert.match(migration, /final_score = \(v_correct \* v_marks_correct\) - \(v_wrong \* abs\(v_marks_wrong\)\)/);
});

test('workspace exposes accessible global warnings, mobile palette, and keyboard navigation', () => {
  assert.match(workspace, /aria-live="polite"/);
  assert.match(workspace, /remaining <= 600/);
  assert.match(workspace, /<details[\s\S]+Open question palette/);
  assert.match(workspace, /event\.key === 'ArrowRight'/);
  assert.doesNotMatch(workspace, /webcam|getUserMedia|clipboard|requestFullscreen/i);
});

test('blocked readiness cannot send a signed-out user into a dead generation flow', () => {
  assert.match(entry, /if \(!readiness\?\.generationEnabled\) return;[\s\S]+if \(!user\)/);
  assert.match(entry, /disabled=\{loading \|\| generating \|\| blocked\}/);
  assert.doesNotMatch(entry, /Exact-pattern generation is disabled/);
});

test('research artifacts preserve zero-coverage honesty and a valid provisional blueprint', () => {
  const report = readFileSync('research/ssc-cgl/tier1/coverage-report.md', 'utf8');
  const manifest = readFileSync('research/ssc-cgl/tier1/corpus-manifest.csv', 'utf8').trim().split(/\r?\n/);
  const shiftCounts = readFileSync('research/ssc-cgl/tier1/shift-topic-counts.csv', 'utf8').trim().split(/\r?\n/);
  const inventory = readFileSync('research/ssc-cgl/tier1/inventory-readiness-2026-09-01.csv', 'utf8').trim().split(/\r?\n/);
  const blueprint = JSON.parse(readFileSync('research/ssc-cgl/tier1/blueprint-summary.json', 'utf8')) as {
    corpus_coverage: { classified_shifts: number; claim_every_shift_analysed: boolean };
    sections: Array<{ buckets: Array<[string, number, number, number]> }>;
  };
  assert.match(report, /does not claim that every shift was analysed/i);
  assert.equal(blueprint.corpus_coverage.classified_shifts, 0);
  assert.equal(blueprint.corpus_coverage.claim_every_shift_analysed, false);
  assert.equal(manifest.length, 21, 'header plus two trace rows for each of ten cycle years');
  assert.equal(shiftCounts.length, 1, 'no fabricated classified shift rows');
  assert.equal(inventory.length, 40, 'header plus all 39 blueprint buckets');
  assert.ok(inventory.some((row) => row.includes('reasoning,analogy,2,20,0,20')));
  assert.ok(inventory.some((row) => row.includes('quantitative_aptitude,trigonometry,3,24,0,24')));
  assert.ok(inventory.some((row) => row.includes('english,atomic_comprehension,5,40,20,20,0,0,blocked_no_verified_atomic_groups')));
  for (const section of blueprint.sections) {
    assert.equal(section.buckets.reduce((sum, bucket) => sum + bucket[1], 0), 25);
    for (const [, target, minimum, maximum] of section.buckets) assert.ok(minimum <= target && target <= maximum);
  }
});

test('CHSL research artifacts preserve honest zero coverage and all forty buckets', () => {
  const report = readFileSync('research/ssc-chsl/tier1/coverage-report.md', 'utf8');
  const manifest = readFileSync('research/ssc-chsl/tier1/corpus-manifest.csv', 'utf8').trim().split(/\r?\n/);
  const shiftCounts = readFileSync('research/ssc-chsl/tier1/shift-topic-counts.csv', 'utf8').trim().split(/\r?\n/);
  const inventory = readFileSync('research/ssc-chsl/tier1/inventory-readiness-2026-09-01.csv', 'utf8').trim().split(/\r?\n/);
  const blueprint = JSON.parse(readFileSync('research/ssc-chsl/tier1/blueprint-summary.json', 'utf8')) as {
    corpus_coverage: { classified_shifts: number; claim_every_shift_analysed: boolean };
    sections: Array<{ buckets: Array<[string, number, number, number]> }>;
  };
  assert.match(report, /does not claim that every shift was analysed/i);
  assert.equal(blueprint.corpus_coverage.classified_shifts, 0);
  assert.equal(blueprint.corpus_coverage.claim_every_shift_analysed, false);
  assert.equal(manifest.length, 21);
  assert.equal(shiftCounts.length, 1);
  assert.equal(inventory.length, 41, 'header plus all 40 CHSL blueprint buckets');
  assert.ok(inventory.some((row) => row.includes('english,atomic_comprehension,5,40')));
  for (const section of blueprint.sections) {
    assert.equal(section.buckets.reduce((sum, bucket) => sum + bucket[1], 0), 25);
    for (const [, target, minimum, maximum] of section.buckets) assert.ok(minimum <= target && target <= maximum);
  }
});

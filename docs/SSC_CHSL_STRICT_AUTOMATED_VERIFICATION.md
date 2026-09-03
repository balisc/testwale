# SSC CHSL strict automated mock-content verification

This workflow reduces manual review without converting metadata completeness
into a blanket content approval. It is deterministic, quota-aware, auditable,
stale-safe, and dry-run by default.

## What it verifies

- exact active `SSC_CHSL` Tier 1 mapping and active taxonomy ownership;
- active, base-verified, unreported question state;
- complete English and Hindi question, options and explanation;
- four distinct options in both languages;
- one answer rationale marked correct, matching `correct_option`;
- question-key and normalized English question-plus-option-set uniqueness within the blueprint;
- facet/question difficulty agreement;
- QuestionWale originality declarations and non-PYQ status;
- exact syllabus topic/subtopic/subject alignment;
- deterministic proof metadata or a resolvable source-registry entry;
- media approval, current-event date window and complete passage-group gates;
- current facet/question timestamps immediately before a transactional apply.

It does not use an LLM as an answer key, switch the blueprint to production,
enable a feature flag, or silently promote every provisional row. It selects
only enough passing candidates to fill the current readiness deficit, balanced
across difficulty and answer positions.

For egress safety, a 40/40-ready inventory stops after the compact readiness
RPC. When deficits exist, only active provisional facets in deficient buckets
receive a full content read. A separate global duplicate index transfers only
question text, options and `question_key`, not explanations or full source
metadata.

## Install the audited apply function

After the generic and CHSL mock migrations, run this in the intended Supabase
project:

```text
scripts/migrate_strict_mock_content_verification.sql
```

The migration creates service-role-only run and item audit tables plus one
transactional RPC. Browser roles cannot read or execute these capabilities.

If an existing project still rejects verifier v2 with
`strict_verification_request_invalid`, run
`scripts/patch_strict_mock_atomic_gate_v2.sql`. Its final query must return
`v2_accepted=true` and `old_atomic_exclusion_present=false`.

## Dry run

First normalize the already-present cloze families and claim-level current-event
sources. This command is dry-run by default and does not invent content:

```powershell
npm.cmd run prepare:ssc-chsl-mock-strict
```

After reviewing the counts, apply the idempotent normalization:

```powershell
npm.cmd run prepare:ssc-chsl-mock-strict -- --apply --confirm=ssc-chsl-tier1-2025-v1
```

It uses eight existing five-item cloze families and only current-event facts
matched to the official documents recorded in
`research/ssc-chsl/tier1/source-registry.json`.

```powershell
npm.cmd run audit:ssc-chsl-mock-strict -- --source-registry=research/ssc-chsl/tier1/source-registry.json
```

The report is written under `test-results/mock-tests/`. It contains IDs,
decisions, blocker codes and content hashes, but not question text or secrets.

Source-grounded questions fail closed unless a reviewed registry is supplied:

```powershell
npm.cmd run audit:ssc-chsl-mock-strict -- --source-registry=path/to/source-registry.json
```

Every accepted registry entry needs an HTTPS URL on the verifier's official
source allowlist, title, publisher, `authority: "primary"`, and a `checked_on`
date. Optional `supporting_urls` must pass the same allowlist. Supported shapes
are an object keyed by registry key, a
`{"sources": {...}}` object, or an array whose entries have a `key` field.

```json
{
  "CONSTITUTION_INDIA": {
    "url": "https://example.gov.in/authoritative-page",
    "title": "Authoritative source title",
    "publisher": "Authoritative publisher",
    "authority": "primary",
    "checked_on": "2026-09-02"
  }
}
```

The registry proves that an approved evidence locator exists; it does not make
an unsupported question true. Registry curation remains a separate reviewed
change.

## Apply

Review the dry-run summary and selected IDs first. Then run:

```powershell
npm.cmd run audit:ssc-chsl-mock-strict -- --source-registry=research/ssc-chsl/tier1/source-registry.json --apply --confirm=ssc-chsl-tier1-2025-v1
```

Apply is idempotent by plan hash. Any stale row, missing mapping, failed database
gate, count mismatch or partial update rolls back the entire run. The RPC records
the verifier version, content hash, plan hash, timestamps and item IDs.

## Remaining launch gates

Run:

```sql
select * from public.get_mock_test_readiness('ssc-chsl-tier1-2025-v1');
```

All 40 buckets must be ready. Current affairs still need resolvable evidence and
an event date inside `2024-01-01` through `2025-08-31`. Atomic comprehension
still needs verified complete five-item groups. Only a separately reviewed
migration may set `is_production_ready=true`; the application flag remains the
last independent launch switch.

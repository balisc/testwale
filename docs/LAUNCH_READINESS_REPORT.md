# QuestionWale — Production Launch Readiness Report

**Date:** 2026-07-26  
**Scope:** Safe launch for ≥10,000 monthly active users without exhausting Supabase Database Egress, Vercel Fluid Active CPU, or function quotas.  
**Environment tested:** Local production build (`next build` + `next start` on port 3004, `AUTH_SECRET` set, `.env.local` Supabase credentials).

---

## Executive summary

QuestionWale already had substantial egress and caching infrastructure (`unstable_cache` for catalog and question batches, sanitized public question columns, idempotent `submit_question_answer` RPC, API rate limiting). This pass **fixed a measurable Supabase leak**: `getQuestionBankVersion()` ran on **every** practice/batch request outside the Data Cache, causing an extra `questions` id-list query per hit.

After caching the bank fingerprint (`getQuestionBankVersionCached`), warm question-batch API calls measured **~6–23 ms** with **~13 KB** for 10 questions and **zero answer fields**. Controlled load tests passed at **211 rps** (home), **436 rps** (subjects), **48 rps** (revision) with **0 errors**.

**Launch recommendation:** **Ready for production deployment** after applying the optional SQL index migration on **staging** and configuring usage alerts in Supabase/Vercel dashboards. HTTP CDN caching for exam-filtered subject/topic pages remains a future improvement (they are dynamic due to `searchParams`).

---

## Baseline architecture

### Stack (verified from repository)

| Component | Version / model |
|-----------|-----------------|
| Next.js | 16.2.9 (App Router, Turbopack build) |
| React | 19.2.7 |
| Supabase JS | ^2.105.4 |
| Package manager | npm |
| Router | App Router (`app/`) |
| Server cache | `unstable_cache` + route `revalidate` (ISR) |
| Middleware | `proxy.ts` — rate limits **only** `/api/:path*` (120 req/min/IP) |

### Request / data flow

```mermaid
flowchart LR
  subgraph public [Public visit]
    A[Browser] --> B[Vercel / next start]
    B --> C{Data Cache hit?}
    C -->|yes| D[HTML/JSON from cache]
    C -->|no| E[Supabase PostgREST]
    E --> F[Fill unstable_cache]
    F --> D
  end

  subgraph practice [Practice session]
    P1[Practice page force-dynamic] --> P2[getCatalogSnapshot cached]
    P1 --> P3[getQuestionBankVersionCached]
    P1 --> P4[getQuestionBatchBySubtopic cached]
    P4 --> P5[Sanitized PublicQuestion]
    P6[Client] --> P7[/api/practice/submit]
    P7 --> P8[submit_question_answer RPC]
  end
```

| User action | Primary data path | Supabase reads (warm cache) |
|-------------|-------------------|----------------------------|
| Anonymous homepage | `getHomeData` + catalog snapshot | **0** (300s TTL) |
| Public revision page | Rich revision client + optional `getQuestionsBySubtopic` | **0** per subtopic batch key |
| Practice session start | Catalog cache + bank version cache + question batch cache | **0** after warm-up |
| Answer submission | `POST /api/practice/submit` → RPC | **1 RPC** (includes scoped progress snapshot) |
| Progress dashboard | `get_user_progress_dashboard` RPC | **1 RPC** |
| Login / session | `/api/auth/me` (deferred client fetch) | Auth validation only |

### Build route modes (from `next build`)

- **Static / ISR (○):** `/`, `/subjects`, `/about_us`, legacy subject landing pages, `/robots.txt`, several API routes with `revalidate=300`
- **Dynamic (ƒ):** Practice pages, auth, all `/api/practice/*`, subject/topic pages with exam `searchParams`

---

## Data classification and cache matrix

| Data type | Privacy | Consumer | Payload (measured) | Server cache | HTTP cache | TTL | Invalidation |
|-----------|---------|----------|----------------------|--------------|------------|-----|--------------|
| Catalog taxonomy | Public | All pages | ~4× parallel selects → single snapshot | `catalog` tag | ISR on home/subjects | **300s** | TTL + `revalidateTag('catalog')` |
| Question bank fingerprint | Public metadata | Batch cache keys | id list hash | scoped `question-batch:*` | none | **300s** | same tags as batch |
| Sanitized question batch | Public pre-submit | Practice | **~13 KB / 10 questions** | `question-batch:subtopic:v5:{id}` | `private, no-store` | **300s** | tag + TTL |
| Revision content | Public | Revision ISR page | **~135 KB** HTML | ISR `revalidate=3600` | dynamic shell today | 1h | deploy / ISR |
| Submit response | Private | Practice UI | compact RPC JSON | none | `no-store` | — | — |
| Attempts / progress | Private | Dashboard | RPC aggregates | none | `no-store` | — | — |
| Storage assets | Public | Images/fonts | varies | Supabase CDN | long `cacheControl` on upload | immutable | versioned paths |

**Security verified:** Initial question payload keys: `id, question_text, options, difficulty, source, source_metadata, year, pyq_exam_name, exam_tags, attempt_count, correct_count` (counters zeroed; no `correct_option` / `explanation`).

---

## Exact changes (this pass)

### Code

| File | Change |
|------|--------|
| `lib/questionBankVersion.ts` | Added `getQuestionBankVersionCached()` wrapping fingerprint query in `unstable_cache` with question-batch tags |
| `lib/polity.ts` | Switched batch functions to cached bank version |
| `lib/catalogCache.ts` | Corrected comment (300s, not 24h) |
| `docs/EGRESS_OPTIMIZATION.md` | Aligned with v5 cache keys, 300s TTL, platform egress notes |
| `package.json` | Added `test:launch-baseline`, `test:launch-load` scripts |
| `scripts/launch-readiness-baseline.mjs` | **New** — route latency, cache headers, answer-leak check |
| `scripts/launch-readiness-load.mjs` | **New** — ramped load smoke test |
| `scripts/migrate_launch_readiness_indexes.sql` | **New** — optional `idx_subjects_slug_active`, `idx_user_attempts_user_question` |

### Migrations (not auto-run)

- Existing: `scripts/migrate_performance_egress.sql` (RPCs, progress views, question indexes)
- New additive: `scripts/migrate_launch_readiness_indexes.sql`

---

## Before-and-after metrics

### Supabase calls per practice batch request (same cache key)

| Stage | Bank version query | Batch query | Total DB reads |
|-------|-------------------|-------------|----------------|
| **Before** | 1 every request | 0 on Data Cache hit | **1** |
| **After** | 0 on cache hit | 0 on Data Cache hit | **0** |

### Measured locally (port 3004, warm cache)

| Metric | Value |
|--------|-------|
| Home warm latency | **12 ms**, 136 KB, `x-nextjs-cache: HIT`, `s-maxage=300` |
| Subjects warm latency | **7 ms**, 38 KB, HIT |
| Revision warm latency | **32 ms**, 135 KB (dynamic route; server cache for questions) |
| Question batch API warm | **6 ms**, **13,089 B** / 10 questions, `Cache-Control: private, no-store` |
| Public routes warm p50 / p95 / p99 | **7 / 32 / 32 ms** |

### Load test (`test:launch-load`, 30 req × 3 phases, concurrency 5)

| Phase | RPS | p50 | p95 | p99 | Errors |
|-------|-----|-----|-----|-----|--------|
| Home (warm) | 211.6 | 21 ms | 33 ms | 33 ms | 0 |
| Revision (warm) | 47.6 | 101 ms | 143 ms | 144 ms | 0 |
| Subjects (warm) | 436.2 | 11 ms | 14 ms | 15 ms | 0 |

### Production bundle

- Build: **PASS** — 32 static segments, practice routes dynamic as expected
- Typecheck / lint / 18 source tests: **PASS**

---

## 10,000-user capacity model

**Definition used:** 10,000 **monthly active users (MAU)**, not 10,000 simultaneous.

### Assumptions (conservative)

| Parameter | Value |
|-----------|-------|
| Sessions / MAU / month | 8 |
| Public page views / session | 6 |
| Practice sessions / MAU / month | 4 |
| Questions answered / practice session | 15 |
| Peak-hour share of daily traffic | 15% |
| Peak concurrent practice users | ~250 (derived) |
| Public Data Cache hit ratio (stable routes) | 90% |
| Avg question batch payload | 13 KB |
| Avg submit RPC response | ~2 KB |

### Monthly projections (formulas)

```
Public page views     = 10,000 × 8 × 6           = 480,000
Practice sessions     = 10,000 × 4               = 40,000
Submit RPC calls      = 40,000 × 15               = 600,000

Catalog Supabase reads (miss) ≈ (480,000 × 0.1) / (300s window per edge POP*)
  → dominated by cache; budget **< 50,000** origin reads/month with 90% hit

Question batch origin reads ≈ (40,000 sessions × 1.2 pages) × 0.1 miss ≈ 4,800/month

Database egress (questions) ≈ 4,800 × 13 KB + catalog ≈ **0.06–0.15 GB/month** (sanitized batches only)

Submit + progress egress ≈ 600,000 × 2 KB ≈ **1.2 GB/month** (authenticated, unavoidable)

Vercel function invocations ≈ page views + API ≈ **550,000–700,000/month**
```

\*Data Cache is per deployment region; actual Supabase reads depend on cache cardinality and TTL.

### Plan headroom

**Do not treat these as billing facts** — verify against your Supabase and Vercel plan dashboards:

| Resource | Typical free/pro tier concern | This workload |
|----------|------------------------------|---------------|
| Supabase Database Egress | Often 5–50 GB/mo by plan | Well within range if cache hits hold |
| Supabase Cached Egress | Storage CDN only | Low unless large public Storage assets |
| Vercel function invocations | Plan-specific | Moderate; ISR/static home/subjects reduce CPU |
| Largest bottleneck | **Authenticated submit + progress RPC volume** | Scales with questions answered, not page views |

**Stress scenario (3× peak):** 750 concurrent practice users → run preview load test with higher `LOAD_CONCURRENCY` before marketing pushes.

---

## Verification checklist

| Test | Result |
|------|--------|
| `npm run typecheck` | **PASS** |
| `npm run lint` | **PASS** |
| `npm run test:sources` (18 tests) | **PASS** |
| `npm run build` | **PASS** |
| Production server smoke (public routes 200) | **PASS** |
| `/llms.txt`, `/robots.txt`, `/sitemap.xml` | **PASS** (200) |
| Public cache headers (home, subjects) | **PASS** — `s-maxage`, `x-nextjs-cache: HIT` |
| Private routes (`question-batch`, submit) | **PASS** — `private, no-store` |
| Initial question payload — no answers | **PASS** |
| Duplicate submit idempotency | **Implemented** in RPC (`ON CONFLICT DO NOTHING`) — **requires live auth test** |
| Correct-question exclusion | **Implemented** client + `/api/practice/correct-ids` — **requires live auth test** |
| Bilingual UI | **Preserved** — no code changes to i18n |
| Load test | **PASS** — 0 errors |
| Lighthouse / PageSpeed | **Not run** (no Chrome in CI environment) |

---

## Observability and budget protection

Configure manually in dashboards (values as **% of your plan quota**):

| Signal | Early warning | Urgent | Launch-blocking |
|--------|---------------|--------|-----------------|
| Supabase Database Egress | 50% monthly | 75% | 90% |
| Supabase Auth egress | 50% | 75% | 90% |
| Storage / Cached egress | 50% | 75% | 90% |
| Vercel Active CPU | 50% | 75% | 90% |
| Function invocations | 50% | 75% | 90% |
| Submit error rate (5xx) | >0.5% / 1h | >2% | >5% |
| CDN cache hit (home/subjects) | <70% | <50% | <30% |

**Supabase:** Logs → API / Postgres → watch `questions`, `user_attempts`, RPC `submit_question_answer`.  
**Vercel:** Analytics → Functions → filter `/api/practice/submit`, practice pages.

---

## Manual production steps

1. **Deploy** this branch to Vercel preview; confirm `AUTH_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, `QUESTION_CACHE_REVALIDATE_SECRET` are set (server-only).
2. **Run on staging Supabase SQL Editor:**
   - Confirm `migrate_performance_egress.sql` already applied
   - Apply `scripts/migrate_launch_readiness_indexes.sql`
   - Verify with commented queries in file
3. **After question edits in Supabase Dashboard:**
   ```bash
   QUESTION_CACHE_REVALIDATE_SECRET=... node scripts/revalidate-question-batch.mjs --subtopicId <uuid>
   ```
4. **Post-deploy smoke:**
   ```bash
   BASE_URL=https://your-preview.vercel.app npm run test:launch-baseline
   BASE_URL=https://your-preview.vercel.app npm run test:launch-load
   ```
5. **Configure Supabase + Vercel usage alerts** at thresholds above.
6. **Authenticated tests:** duplicate submit, progress counters, Hindi/English/Both modes on preview.

---

## Status summary

| Item | Status |
|------|--------|
| Bank version cache fix | **Implemented and verified** |
| Launch baseline / load scripts | **Implemented and verified** |
| Egress documentation | **Updated** |
| Optional SQL indexes | **Implemented — requires staging execution** |
| Live auth/submit/progress tests | **Requires preview with test accounts** |
| Vercel/Supabase usage alert wiring | **Manual dashboard steps documented** |
| HTTP CDN for exam-filter pages | **Recommended future improvement** |
| Supabase Storage CDN JSON snapshots | **Not implemented** — server cache is simpler and sufficient at current scale |

---

## Recommended future improvements

1. **Split exam filter from page shell:** static ISR HTML + client exam switch to enable `s-maxage` on subject/topic pages (today `searchParams` forces dynamic).
2. **Preview Lighthouse CI** with Chrome for LCP/CLS regression gates.
3. **Raise catalog TTL to 3600s** after measuring count-trigger refresh latency (counts use DB triggers; 300s is conservative).

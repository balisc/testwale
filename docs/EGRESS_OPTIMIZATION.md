# Egress optimization — public question batches

This document covers server-side caching for catalog and public question batches, plus tag-based manual invalidation.

## What is cached

| Data | Layer | TTL | Tags |
|------|-------|-----|------|
| Subjects, topics, subtopics, exams | `getCatalogSnapshot` in `lib/catalogCache.ts` | **300s** (5 min) | `catalog` |
| Question bank fingerprint | `getQuestionBankVersionCached` in `lib/questionBankVersion.ts` | **300s** | `question-batch`, scoped subtopic/topic tag |
| Public question batch (subtopic) | `getQuestionBatchBySubtopic` | **300s** | `question-batch`, `question-batch:subtopic:v5:{id}` |
| Public question batch (topic) | `getQuestionBatchByTopic` | **300s** | `question-batch`, `question-batch:topic:v5:{id}` |
| Homepage stats / suggestions | `getHomeData` in `lib/homeData.ts` | **300s** | (Data Cache key only) |
| Exam-wise subtopic ordering | `getSubtopicsByTopic` (exam filter) | **300s** | `catalog` |

Cached question payloads include: `id`, `question_text`, `options`, `difficulty`, `source`, `source_metadata`, `year`, `pyq_exam_name`, `exam_tags`. Crowd counters are zeroed in `normalizePublicQuestion` (not selectable by anon after column grants).

They **do not** include `correct_option`, `explanation`, or any user-specific fields.

## What is NOT cached (shared CDN / Data Cache)

- Authentication / session state
- User attempts, progress, bookmarks, notes
- Answer reveal (`POST /api/practice/submit`)
- Per-user subtopic attempt state (`/api/practice/subtopic-state`)
- Progress summaries (`/api/practice/progress`)
- `/api/practice/question-batch` HTTP responses (`Cache-Control: private, no-store`) — caching is **server-side only** via `unstable_cache`

Practice pages use `export const dynamic = 'force-dynamic'`. Personalized filtering (exclude correctly answered questions) happens client-side after private API calls.

## Platform note

Adding `Cache-Control` to PostgREST responses does **not** make Supabase Database egress bill as “Supabase Cached Egress”. Cached Egress applies to **Supabase Storage CDN** traffic. Next.js Data Cache / Vercel CDN reduce **Database Egress** by avoiding repeated origin reads — a separate layer.

## Invalidation strategy

### Automatic (TTL fallback)

Catalog, bank-version fingerprints, and question batches revalidate after **300 seconds** even without manual invalidation. Revision pages additionally use ISR (`revalidate = 3600`).

### Manual (required after Supabase Dashboard question edits)

There is **no in-app admin UI** for question CRUD. After Dashboard edits, call:

**Endpoint:** `POST /api/admin/revalidate-question-batch`

**Auth:** server-only secret (never `NEXT_PUBLIC_*`):

- Header: `Authorization: Bearer <QUESTION_CACHE_REVALIDATE_SECRET>`
- Or: `x-question-cache-revalidate-secret: <QUESTION_CACHE_REVALIDATE_SECRET>`

**Body (JSON):**

```json
{ "subtopicId": "<uuid>" }
```

```json
{ "topicId": "<uuid>" }
```

**Broad fallback** (only when IDs are unknown):

```json
{}
```

Prefer targeted IDs whenever possible.

### CLI helper

```bash
QUESTION_CACHE_REVALIDATE_SECRET=your-secret \
  node scripts/revalidate-question-batch.mjs \
  --subtopicId <uuid> \
  --baseUrl https://questionwale.com
```

## Environment variables

| Variable | Required | Exposure |
|----------|----------|----------|
| `QUESTION_CACHE_REVALIDATE_SECRET` | For manual invalidation in production | Server only |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Public |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Public |
| `SUPABASE_SERVICE_ROLE_KEY` | Server routes / RPC | **Server only** |
| `AUTH_SECRET` | Production dynamic routes | **Server only** |

## Cache matrix (summary)

| Data type | Privacy | HTTP cache | Server cache | Invalidation |
|-----------|---------|------------|--------------|--------------|
| Taxonomy slugs | Public | ISR / static shell | `catalog` tag, 300s | TTL + catalog tag |
| Revision MDX/HTML | Public | ISR 3600s | build + ISR | redeploy / ISR |
| Question batch JSON | Public sanitized | `private, no-store` | `question-batch:*`, 300s | tag + TTL |
| Submit response | Private | `no-store` | none | n/a |
| Progress / attempts | Private | `no-store` | none | n/a |

## Launch verification scripts

```bash
npm run build && npm run start
BASE_URL=http://127.0.0.1:3000 node scripts/launch-readiness-baseline.mjs
BASE_URL=http://127.0.0.1:3000 node scripts/launch-readiness-load.mjs
```

See `docs/LAUNCH_READINESS_REPORT.md` for capacity model and full verification checklist.

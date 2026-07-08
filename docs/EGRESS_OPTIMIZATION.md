# Egress optimization — public question batches

This document covers Phase 1 (server-side question-batch caching) and Phase 2 (tag-based manual invalidation).

## What is cached

| Data | Layer | TTL | Tags |
|------|-------|-----|------|
| Subjects, topics, subtopics, exams | `unstable_cache` in `lib/polity.ts` | 24h | `catalog` |
| Public question batch (subtopic practice) | `getQuestionsBySubtopic` | 1h | `question-batch`, `question-batch:subtopic:{id}` |
| Public question batch (mixed topic practice) | `getMixedQuestionsByTopic` | 1h | `question-batch`, `question-batch:topic:{id}` |

Cached question payloads include: `id`, `question_text`, `options`, `difficulty`, `source`, `year`, `pyq_exam_name`, `exam_tags`, `attempt_count`, `correct_count`.

They **do not** include `correct_option`, `explanation`, or any user-specific fields.

## What is NOT cached

- Authentication / session state
- User attempts, progress, bookmarks, notes
- Answer reveal (`/api/practice/submit`)
- Per-user subtopic attempt state (`/api/practice/subtopic-state`)
- Progress summaries (`/api/practice/progress`)

Practice pages use `export const dynamic = 'force-dynamic'`. Public question data is read from the **Next.js Data Cache** on the server; personalized filtering still happens client-side after hydration.

## Invalidation strategy

### Automatic (TTL fallback)

All question batches revalidate after **1 hour** even if no manual invalidation runs.

### Manual (required after Supabase Dashboard edits)

There is **no in-app admin UI** for creating, updating, publishing, or deleting questions. Edits are done directly in the Supabase Dashboard (or external tooling). Therefore invalidation is **manual** via a secure server endpoint.

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

```json
{ "subtopicId": "<uuid>", "topicId": "<uuid>" }
```

**Broad fallback** (only when IDs are unknown — revalidates every question batch):

```json
{}
```

This calls `revalidateTag('question-batch')`. Prefer targeted IDs whenever possible.

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

Set in Vercel → Project → Settings → Environment Variables (Production / Preview as needed).

## Expected egress reduction

- **Before:** every practice page view issued a live Supabase `questions` SELECT (up to 50 JSONB rows).
- **After:** identical subtopic/topic + exam combinations hit the Next.js Data Cache for up to 1 hour.
- Catalog pages were already cached; this closes the largest remaining repeated public read on practice routes.

## How to verify

### Local

1. `npm run dev`
2. Load a subtopic practice page twice.
3. First load: `[polity] getQuestionsBySubtopic` log in terminal (cache miss).
4. Second load within 1h: no new Supabase log (cache hit).
5. Set `QUESTION_CACHE_REVALIDATE_SECRET` in `.env.local`.
6. Call revalidation:

```bash
curl -X POST http://localhost:3000/api/admin/revalidate-question-batch \
  -H "Authorization: Bearer $QUESTION_CACHE_REVALIDATE_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"subtopicId":"<uuid>"}'
```

7. Reload practice page — Supabase log should appear again (cache miss after invalidation).

### Production

1. Deploy with `QUESTION_CACHE_REVALIDATE_SECRET` set.
2. After editing questions in Supabase, call the endpoint (or run the script) with the affected `subtopicId` / `topicId`.
3. Supabase Dashboard → **Settings → Usage → Egress**: practice traffic should show fewer repeated `questions` SELECTs.
4. Supabase → **Database → Query Performance**: `questions` reads should correlate with unique subtopic/exam combos per hour, not page views.

## Limitations (known, unchanged)

- Question batches are capped at **50** rows (`MAX_QUESTION_LIMIT`). No pagination or next-batch fallback exists yet.
- If a user correctly answers all questions in the cached batch but more exist in the database, the UI may show “all completed” prematurely. Caching does not introduce this; it was already true with the same fixed query.

# Supabase Egress Fix Report — QuestionWale

## Root causes found (first pass)

| File | Problem | Why it increases egress | Fix applied |
|------|---------|-------------------------|-------------|
| `app/api/questions/route.ts` | `fetchAllQuestionsFromTable` paginated 1000-row chunks; default limit 500 | Bots/crawlers could pull thousands of full MCQ rows per request | Removed full-table scan; max 50 rows; default 25; filtered query only |
| `app/api/history/questions/route.ts` | `FAST_QUERY_LIMIT=3000` + full-table fallback | Single topic request could read entire `history_questions` / `questions` | Capped at 50 rows; removed full-table fallback |
| `app/[subject]/topics/[topicSlug]/page.tsx` | `FAST_QUERY_LIMIT=3000` + while-loop full table scan | Classic quiz pages downloaded up to entire subject question bank | Single capped query (50 rows); no pagination loop |
| `app/question/[...questionSlug]/page.tsx` | `SUPABASE_FETCH_LIMIT=3000` | SEO question pages scanned huge topic slices | Capped at 50 rows |
| `lib/questionTopics.ts` | `SUPABASE_FETCH_LIMIT=10000` on `questions` table | Legacy subject pages aggregated topics by scanning 10k rows | Reduced scan to 500 rows; prefer RPC/catalog |
| `lib/polity.ts` | Practice queries already filtered but `force-dynamic` catalog pages | Repeated catalog reads on every request | Added `unstable_cache` (1h) for subjects/topics/exams/subtopics |
| `app/subjects/[subject]/page.tsx` | `force-dynamic` | Disables Next.js caching for lightweight catalog page | `revalidate = 3600` |
| `lib/profileServer.ts` | `.select('*')` on `user_profiles` | Unnecessary column transfer | Explicit column list |
| `app/api/topics/route.ts` / `app/api/history/topics/route.ts` | Unbounded `select('topic')` on `history_questions` | Every topics API call scanned full table | RPC `topic_group_counts` first; fallback capped at 500 rows |
| `app/api/map-practice/questions/route.ts` | `.limit(200)` | Up to 200 map questions per request | Capped at 50 |
| `lib/topicCounts.ts` / `lib/questionCounts.ts` | `.select('*')` for count queries | Minor; head requests still better with `id` only | `select('id', { count, head })` |

## Second pass fixes

| Area | Problem | Fix |
|------|---------|-----|
| `lib/sitemapQuestions.ts` | `while(true)` paginated **all** legacy question rows per subject on sitemap build | **Disabled by default** (`SITEMAP_LEGACY_QUESTION_CAP=0`). Single-query cap when enabled (max 500). Only `id, question, topic, created_at` — no options/explanation |
| `app/sitemap.ts` | Always scanned 9 legacy subject tables | Catalog URLs only by default; legacy per-question URLs opt-in via env |
| Legacy `/[subject]` routes | `fetchTopicsFromQuestions` scanned question tables for navigation | New `lib/catalogTopics.ts` reads `subjects` + `topics` first; question-table fallback capped at 500 with comment |
| Question list APIs | Guards duplicated per route | Shared `lib/publicQuestionApiGuards.ts` — default 25, max 50, 400 without filter |
| `/api/questions` | No catalog filters | Added `topic_id`, `subtopic_id`, `subtopic_slug` filters on `questions` table |
| Profile RPC | GROUP BY bug + `questions` join for `recent_attempts` | `scripts/migrate_profile_rpc_production.sql` — stats from attempts/progress only; no `question_text` join |

### Files changed (second pass)

- `lib/sitemapQuestions.ts`
- `lib/supabaseQueryLimits.ts` (`SITEMAP_LEGACY_QUESTION_CAP`)
- `app/sitemap.ts`
- `lib/catalogTopics.ts` (new)
- `lib/publicQuestionApiGuards.ts` (new)
- `app/[subject]/page.tsx`
- `app/[subject]/topics/page.tsx`
- `lib/questionTopics.ts` (fallback comment)
- `app/api/questions/route.ts`
- `app/api/history/questions/route.ts`
- `app/api/map-practice/questions/route.ts`
- `scripts/migrate_profile_rpc_production.sql` (new)
- `scripts/fix_profile_rpc.sql` (lightweight `recent_attempts`)

## Queries optimized

- Public question APIs: **require filter**, **default limit 25**, **max 50**
- Removed all **full-table question pagination loops** from user-facing paths and sitemap (default)
- Legacy topic aggregation capped at **500 rows** when catalog/RPC unavailable
- Catalog reads cached **1 hour** via `unstable_cache`
- Practice: filtered by `subtopic_id` / `topic_id`, max **50**

## Confirmations

- Sitemap does **not** scan unlimited questions in production (default cap = 0)
- Legacy subject routes prefer **catalog `topics` table**, not question bank
- `/api/questions` returns **400** without a filter; max **50** rows per response
- Profile stats from **`user_question_attempts`** / progress tables — not full question bank
- No public `.select('*')` on large content tables
- Frontend uses `/api/questions/[id]` (single question), not unfiltered list API

## Remaining unavoidable risks

| Risk | Mitigation |
|------|------------|
| **Practice dashboard** (`getUserProgressDashboardForUser`) still joins `question_text` for 10 recent rows per logged-in user | Acceptable per-user egress; not a public crawl vector |
| **Legacy subject fallback** (`fetchTopicsFromQuestions`) when catalog empty | Capped at 500 rows; migrate subjects to catalog |
| **Sitemap legacy URLs** if `SITEMAP_LEGACY_QUESTION_CAP>0` | Keep at 0 in production; use R2 export for bulk SEO URLs |
| **Bots on old deployments** | Redeploy Vercel after merge |
| **Profile RPC not applied in Supabase** | Run `scripts/migrate_profile_rpc_production.sql` once |

## How to verify egress after deploy

1. **Deploy** latest code to Vercel (or your host).
2. Open **Supabase Dashboard → Project Settings → Usage** (or **Reports → Database**).
3. Check **Egress** daily graph for 24–48h after deploy — should drop sharply vs spike day.
4. Under **Database → Query Performance**, confirm no queries with `limit` > 50 on `questions` from anon role.
5. Hit these manually and confirm small responses:
   - `GET /api/questions` → **400** (no filter)
   - `GET /api/questions?topic=Constitution` → ≤50 rows
   - `GET /sitemap.xml` → catalog URLs; no mass legacy question URLs unless env cap set
6. Load `/profile` logged in — should return 200 after running production SQL migration.

### Supabase dashboard sections

- **Settings → Usage → Egress** — primary metric
- **Reports → API** — request volume by route (if enabled)
- **Database → Query Performance** — top queries by time/rows

## Recommended next step

Export public questions to **pre-built JSON on Cloudflare R2 / CDN** for practice and SEO URLs. Keep Supabase for:

- Auth / users
- `user_question_attempts` writes
- Profile / progress aggregation
- Admin content edits

This removes repeated JSONB reads from Postgres on high-traffic paths and makes sitemap generation a static build step instead of a live DB scan.

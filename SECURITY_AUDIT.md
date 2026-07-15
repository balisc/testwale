# Security Audit — QuestionWale

**Date:** 2026-07-15  
**Verdict:** CODE READY (run `scripts/QUESTIONWALE_PRODUCTION_FINAL_MIGRATION.sql` before deployment)

## Scope

Application security for Next.js App Router + Supabase/PostgreSQL practice platform. Focus: secret exposure, answer leakage, auth integrity, API abuse, security headers.

## Critical findings

| ID | Finding | Status |
|----|---------|--------|
| C1 | Public anon key can `select=*` answer columns on `questions` via PostgREST if table SELECT is broad | **Fixed by final migration** — revokes PUBLIC/anon/auth table SELECT and grants display columns only |
| C2 | `next.config.mjs` previously mapped `SUPABASE_KEY` into `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Fixed** — only anon URL/key aliases |
| C3 | `AUTH_SECRET` fell back to service-role / hardcoded secret | **Fixed** — throws in production if unset; no service-role reuse |
| C4 | Public question pages put `acceptedAnswer` in JSON-LD / SSR answer block | **Fixed** — WebPage JSON-LD without key; answers stripped from props/API |
| C5 | Historical `create_users_table.sql` granted anon UPDATE | **Confirm in Dashboard** — ensure `fix_users_rls.sql` applied |

## High findings

| ID | Finding | Status |
|----|---------|--------|
| H4 | Practice proof used hardcoded secret in production fallback | **Fixed** — throws without `PRACTICE_SUBMIT_SECRET` / `SITEMAP_SECRET` |
| H5 | `/api/questions/[...slug]` could leak answers from JSON fallback | **Fixed** — strip answer fields |
| H6 | Stale practice UUIDs → 500 | **Prior work** — `STALE_QUESTION` 409 + bank version cache |
| H8 | Map-practice returns correct locations pre-submit | **Accepted product risk** — treat as separately gated surface |
| H9 | Guest submit reveals answer after option check | **Accepted product UX** — rate-limited; do not confuse with pre-submit leakage |

## Controls implemented in code

- CSP, `X-Frame-Options`, `nosniff`, Referrer-Policy, Permissions-Policy, HSTS (production)
- Scoped `connect-src` (Supabase, Google, map tiles)
- HttpOnly / Secure / SameSite=Lax / maxAge on `qw_auth`
- Open redirects blocked via `lib/safeRedirect.ts`
- Source URLs sanitized (`https:` / approved `http:`; reject `javascript:` / `data:` / `file:`)
- Production env assertion via `instrumentation.ts` + `lib/env.ts` (skips build phase)
- Production startup requires a server-only service-role key; browser code reads only explicit `NEXT_PUBLIC_*` anon values
- Next.js 16 `proxy.ts` applies the API rate-limit boundary
- `.gitignore` covers `.env.*` except `.env.example`

## Remaining / open

- Distributed rate limiting (current: in-memory per instance)
- Stricter CSRF tokens for cookie mutations (SameSite=Lax today)
- Zod adoption across all APIs
- Apply the final SQL migration and verify users RLS in Supabase Dashboard

## Manual Supabase steps

1. Review and run `scripts/QUESTIONWALE_PRODUCTION_FINAL_MIGRATION.sql`.
2. Confirm anon cannot `select correct_option from questions`.
3. Confirm `fix_users_rls.sql` applied.
4. Confirm unsigned `submit_question_answer(user_id, …)` is **not** granted to `anon`.
5. Rotate `AUTH_SECRET` and `PRACTICE_SUBMIT_SECRET` if they ever leaked.

## Do not

- Commit `.env.local` or service-role keys
- Disable RLS
- Put `SUPABASE_SERVICE_ROLE_KEY` under any `NEXT_PUBLIC_` name

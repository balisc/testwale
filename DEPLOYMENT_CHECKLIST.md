# Deployment Checklist — QuestionWale

**Release:** production-ready package — 2026-07-15  
**Code verdict:** READY. Run the single Supabase migration below before first deploy.

## Pre-deploy (local)

- [ ] `npm ci`
- [ ] `npm run verify`
- [ ] Smoke: homepage, subject → topic → subtopic practice, submit correct/incorrect, Topic 2 + Topic 3 sources, login/logout
- [ ] Confirm no `correct_option` in browser Network for question-batch / pre-submit HTML

## Environment variables (production)

| Variable | Required | Notes |
|----------|----------|-------|
| `NEXT_PUBLIC_SITE_URL` | Yes | Canonical origin, e.g. `https://questionwale.com` |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Production project only |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Anon key only — never service role |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Yes (Google login) | GIS client ID |
| `AUTH_SECRET` | **Yes** | Strong random; no fallback in production |
| `SUPABASE_SERVICE_ROLE_KEY` | **Yes** | Server-only answer checks and practice writes |
| `PRACTICE_SUBMIT_SECRET` | If signed RPC path used | Must match DB signing secret |
| `QW_FORCE_NOINDEX` | Preview only | Optional explicit noindex |

**Never** set `NEXT_PUBLIC_` + service role. Do **not** use `SUPABASE_KEY` as a public alias.

## Supabase Dashboard (manual)

- [ ] Production project URL matches frontend env
- [ ] Auth redirect URLs include production + local callback
- [ ] Run `scripts/QUESTIONWALE_PRODUCTION_FINAL_MIGRATION.sql` once
- [ ] Verify migration output: anon/auth answer columns `false`, `totals_match=true`, inconsistent relationships `0`
- [ ] Confirm `scripts/fix_users_rls.sql` applied historically
- [ ] Confirm anon cannot forge unsigned submit RPC for arbitrary `user_id`
- [ ] RLS enabled on attempts / progress / profiles / reports

## Hosting platform

- [ ] HTTPS only; redirect HTTP → HTTPS
- [ ] Apex `questionwale.com` is canonical; code redirects `www` to apex
- [ ] Preview deployments: noindex (auto via `VERCEL_ENV=preview` / `.vercel.app`)
- [ ] Production build command: `npm run build`
- [ ] Node version compatible with Next 16

## Post-deploy

- [ ] Hit `/robots.txt` and `/sitemap.xml`
- [ ] Check security headers (CSP, HSTS, nosniff)
- [ ] Submit sitemap in Google Search Console
- [ ] Test guest + authenticated answer submit
- [ ] Upload one test question and confirm homepage/card totals update (catalog cache: up to 5 minutes)

## Rollback

1. Redeploy previous Vercel/hosting deployment.
2. Redeploy the last known-good source package.
3. Do **not** roll back DB grants carelessly if app already depends on them — prefer a forward fix.

## Quality gates (must pass)

- TypeScript and ESLint clean
- Source parser tests green
- Production build succeeds
- No Critical unanswered app-layer leakage in browser for catalog practice

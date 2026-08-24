# QuestionWale SEO, Performance, Mobile and Production Audit

Audit date: 24 August 2026 (IST)  
Repository: Next.js 16.2.9 App Router  
Canonical production origin: `https://questionwale.com`  
Local release target: optimized `next build` + `next start` on `127.0.0.1:3017`

## 1. Executive Summary

The repository is a deployable SEO-correct release candidate, but the currently deployed production website is **not yet technically production-ready relative to this repository**. The release build, type checking, lint, repository tests, local rendered-HTML SEO crawler, sitemap checks, expanded true-404 tests, privacy-cache checks, responsive matrix and controlled load tests pass. The reported search-bar subject/topic/subtopic “Page not found” defect is fixed: a transient or incomplete Supabase catalog response can no longer be cached as an empty catalog. The release search feed contains 498 validated targets; the exact subject, topic and search-subtopic flow returned 200 in development and production-mode stress runs, with no false 404s.

The live deployment is stale. A real crawl of `https://questionwale.com` found 139 failures, only 43 sitemap URLs instead of the release build's 162, 94 search items instead of 498, a missing manifest, outdated metadata/schema behavior, and legacy URLs that still return 200 instead of redirecting. The code must be deployed before the live site can be signed off.

Performance improved materially on image-heavy pages, but it is not valid to claim that every mobile page meets the requested target. The stable optimized matrix had indexable Lighthouse Performance 88-100 with TBT at or below 42 ms, while exact-final repeated runs of the exam-topic mobile page varied between 71 and 78 with TBT 405-646 ms. Mobile lab LCP remains approximately 3.4-3.9 seconds. CLS is excellent. Field INP is unavailable locally and requires real-user data.

Release assessment:

- Repository SEO correctness: **PASS**
- Repository build/regression state: **PASS**
- Security and private caching: **PASS**
- Mobile layout/accessibility: **PASS**
- Consistent mobile performance target: **NOT YET PROVEN**
- Current deployed production site: **BLOCKED - deploy this release and recrawl**

## 2. Previously Untested Areas

| Previously untested area | Status | Evidence |
| --- | --- | --- |
| Real Lighthouse Mobile and Desktop | PASS, with performance risk | 24 JSON reports under `test-results/lighthouse/final`; raw repeats under `test-results/lighthouse/final-repeats` |
| LCP and CLS | PASS measured; LCP target not met on mobile | Real Lighthouse values in section 3 |
| INP | BLOCKED | Lighthouse cannot produce field INP; TBT is reported only as a lab proxy |
| JavaScript/bundle waste | FIXED where safely attributable | Catalog subject transfer about 433 KiB to 251 KiB; unused JS about 195 KiB to 64 KiB |
| Image delivery | FIXED | Large hero images moved to the Next image pipeline with responsive sizes; measurable results in section 6 |
| Font behavior | PASS | Inter and Plus Jakarta Sans variable WOFF2, about 76 KiB total, `display: swap`, both used |
| CSS/render blocking | PASS with residual opportunity | Compressed global CSS about 21 KiB; Lighthouse sees about 18-19 KiB unused per route, but it is shared Tailwind CSS used by other routes |
| Production server timing | PASS locally | Warm p50 9 ms, p95/p99 38 ms; controlled load had zero errors |
| Production robots/sitemap/metadata | BLOCKED by stale deployment | Live crawl failed 139 checks; local release passed |
| Rendered HTML/canonicals/schema | PASS locally | 162 sitemap pages crawled, zero failures |
| Mobile widths and tap targets | FIXED | 56/56 route/viewport combinations pass; zero horizontal overflow and zero sub-24px controls |
| Redirect and true-404 behavior | FIXED locally | Expanded invalid subject/topic/subtopic/exam/question suite returns real HTTP 404 |
| Search subject/topic/subtopic false 404 | FIXED | Incomplete snapshots are rejected, retried and never cached as valid empty data; exact search flow and 30-request stress pass |
| Search Console ownership/manual actions | MANUAL ACTION REQUIRED | Google account access and verification token are not available |
| Analytics | MANUAL ACTION REQUIRED | No analytics implementation or measurement ID exists; none was fabricated |
| Auth callback runtime | PASS assertions; runner exit BLOCKED | Callback redirect and private cache assertions pass, then Node 24 on Windows hits a libuv shutdown assertion |
| In-app browser inspection | BLOCKED | No in-app Browser session was available; real installed Chrome 151 and Lighthouse 13.4.1 were used instead |

## 3. Lighthouse Results

All values below are real JSON outputs. LCP, TBT and TTFB are milliseconds. INP is not available in a lab Lighthouse run. The noindex practice page's SEO 69 is expected because Lighthouse intentionally penalizes non-crawlability; that page must remain noindex.

| URL | Device | Performance | Accessibility | Best Practices | SEO | LCP | CLS | TBT/INP |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `/` | Desktop | 100 | 100 | 100 | 100 | 795 | 0.002 | 0 / unavailable |
| `/` | Mobile | 90 | 100 | 100 | 100 | 3,635 | 0.000 | 42 / unavailable |
| `/subjects` | Desktop | 100 | 100 | 100 | 100 | 765 | 0.002 | 0 / unavailable |
| `/subjects` | Mobile | 91 | 100 | 100 | 100 | 3,469 | 0.001 | 24 / unavailable |
| `/exams/ssc-cgl` | Desktop | 98 | 100 | 100 | 100 | 971 | 0.002 | 73 / unavailable |
| `/exams/ssc-cgl` | Mobile | 88 | 100 | 100 | 100 | 3,851 | 0.000 | 23 / unavailable |
| `/exams/ssc-cgl/subj-reasoning` | Desktop | 100 | 100 | 100 | 100 | 766 | 0.002 | 0 / unavailable |
| `/exams/ssc-cgl/subj-reasoning` | Mobile | 91 | 100 | 100 | 100 | 3,410 | 0.000 | 14 / unavailable |
| `/exams/ssc-cgl/subj-reasoning/rea-analogies` | Desktop | 100 | 100 | 100 | 100 | 717 | 0.002 | 0 / unavailable |
| `/exams/ssc-cgl/subj-reasoning/rea-analogies` | Mobile | 74 | 100 | 100 | 100 | 3,921 | 0.000 | 550 / unavailable |
| `/subjects/indian-polity` | Desktop | 99 | 100 | 100 | 100 | 836 | 0.002 | 0 / unavailable |
| `/subjects/indian-polity` | Mobile | 88 | 100 | 100 | 100 | 3,845 | 0.000 | 22 / unavailable |
| `/subjects/indian-polity/constitutional-history-making` | Desktop | 100 | 100 | 100 | 100 | 714 | 0.002 | 0 / unavailable |
| `/subjects/indian-polity/constitutional-history-making` | Mobile | 92 | 100 | 100 | 100 | 3,403 | 0.000 | 18 / unavailable |
| `/subjects/indian-polity/constitutional-history-making/company-rule-acts-1773-1853/revision` | Desktop | 99 | 100 | 100 | 100 | 876 | 0.002 | 0 / unavailable |
| Same revision URL | Mobile | 90 | 100 | 100 | 100 | 3,555 | 0.000 | 15 / unavailable |
| `/map-practice` | Desktop | 97 | 100 | 100 | 100 | 1,304 | 0.002 | 0 / unavailable |
| `/map-practice` | Mobile | 91 | 100 | 100 | 100 | 3,471 | 0.005 | 25 / unavailable |
| `/about_us` | Desktop | 99 | 100 | 100 | 100 | 829 | 0.002 | 0 / unavailable |
| `/about_us` | Mobile | 91 | 100 | 100 | 100 | 3,478 | 0.000 | 32 / unavailable |
| `/contact` | Desktop | 100 | 100 | 100 | 100 | 794 | 0.002 | 0 / unavailable |
| `/contact` | Mobile | 91 | 100 | 100 | 100 | 3,553 | 0.000 | 22 / unavailable |
| `/exams/ssc-cgl/subj-reasoning/rea-analogies/rea-figural-analogy` (intentional noindex) | Desktop | 100 | 100 | 100 | 69 | 753 | 0.002 | 0 / unavailable |
| Same intentional noindex URL | Mobile | 91 | 100 | 100 | 69 | 3,473 | 0.000 | 29 / unavailable |

Interpretation and variance:

- The stable optimized full matrix produced indexable Performance 88-100, average 95, with TBT max 42 ms.
- The exact-final exam-topic mobile repeat set produced Performance 71-78 and TBT 405-646 ms. The table retains the median-like 74/550 run rather than hiding it.
- A late Windows host had a 2.6 GB `next dev` worker. It was removed during control runs, but self-launched and clean-profile Chrome still showed high mobile TBT. Therefore this is recorded as both lab variance and a real main-thread risk requiring a clean CI/PageSpeed rerun after deployment.
- An exam-root desktop run briefly missed streamed metadata and scored SEO 92; four repeat captures found the description and scored SEO 100. The representative 98/100 run is retained and the anomalous raw report is preserved.

## 4. Problems Found

### A. Stale production deployment

Severity: Critical  
Affected URL/component: `https://questionwale.com`  
Root cause: The deployed build predates the audited repository changes.  
Impact: 139 production crawl failures, incomplete sitemap/search coverage, outdated metadata/schema, missing manifest, and legacy 200 URLs.  
Fix: Repository changes are complete; deploy the audited build.  
Verification: Local crawl passes; production must be recrawled after deployment.

### B. User-aware catalog HTML was marked share-cacheable

Severity: Critical  
Affected URL/component: subject, topic and revision response headers  
Root cause: `next.config.mjs` applied public `s-maxage` headers even though pages can vary by authenticated exam selection.  
Impact: A CDN could share one user's exam-scoped HTML with another user.  
Fix: Removed public shared-cache headers and added `verify-cache-privacy.mjs`.  
Verification: All four representative routes return `private, no-cache, no-store, max-age=0, must-revalidate`.

### C. Incomplete catalog snapshots were cached as “no content”

Severity: Critical  
Affected URL/component: home search subject, topic and subtopic destinations; `lib/catalogCache.ts`  
Root cause: `fetchCatalogSnapshot()` caught a transient/partial Supabase failure and returned `EMPTY_SNAPSHOT`. `unstable_cache` then stored that successful-looking empty value for five minutes, so valid slug lookups returned `null` and rendered “Page not found.”  
Impact: A real subject, topic or subtopic selected from search could intermittently become a false 404 until the poisoned cache expired.  
Fix: A complete snapshot is now required to contain subjects, topics, subtopics and exams; incomplete/error responses are retried once and then thrown so they cannot poison the data cache. The cache namespace was bumped to `catalog-snapshot-v5`. An internal existence-check backend error remains fail-open rather than being cached as a 404.  
Verification: Both search feeds return 200 (498 full search items in the release feed). The exact subject, topic, search-subtopic practice and revision URLs return 200. Development and production-mode stress each completed 30/30 repeated subject/topic/subtopic requests without a failure; regression tests assert the retry, completeness guard and new cache key.

### D. Search/catalog destinations could degrade to soft 404s

Severity: High  
Affected URL/component: subject, topic, subtopic, exam and question paths  
Root cause: Some App Router `notFound()` results streamed as HTTP 200. The proxy's internal existence probe also treated rate-limit 429 as an existing path and cached it.  
Impact: Search users could see “Page not found” behind HTTP 200; crawlers could index soft 404s.  
Fix: Extended the existence guard to public exam/question paths, added authenticated exact-syllabus bypass preservation, authenticated the internal probe, exempted only the trusted internal call from the generic API limit, and cache only true 2xx/404 outcomes.  
Verification: After a full 162-URL SEO crawl, eight invalid route classes still return true 404; valid subject/topic/search-subtopic/revision/exam paths return 200.

### E. Catalog client bundle imported a server-heavy module

Severity: High  
Affected URL/component: exam filters and subject topic grid  
Root cause: Simple exam-code helpers were imported from `lib/polity.ts`, pulling Supabase/catalog code into client chunks.  
Impact: About 433 KiB transferred and 195 KiB unused JS on the catalog subject mobile route.  
Fix: Extracted pure helpers to `lib/examCode.ts` and updated client imports.  
Verification: Transfer dropped to about 251 KiB and unused JS to about 64 KiB.

### F. Oversized unoptimized hero images

Severity: High  
Affected URL/component: catalog subject, contact, polity and history hero illustrations  
Root cause: `unoptimized` bypassed Next image resizing; true LCP images lacked explicit responsive discovery hints.  
Impact: Catalog subject image transfer about 391 KiB with 324-351 KiB potential waste; contact waste about 74 KiB.  
Fix: Enabled Next image optimization, supplied `sizes`, and used Next 16 `preload`/`fetchPriority` only for true above-the-fold LCP images.  
Verification: Catalog subject image transfer is about 47 KiB with zero to about 13 KiB residual waste; contact image waste is zero.

### G. Production-mode local audits loaded Google GSI unnecessarily

Severity: Medium  
Affected URL/component: home Google CTA  
Root cause: Localhost detection enabled the development Google Identity Services flow even under `next start`.  
Impact: About 94 KiB third-party JavaScript and extra network work contaminated production-mode measurements.  
Fix: Direct GSI is now development-only; production builds use the secured server OAuth route.  
Verification: Final production-mode home trace contains no `accounts.google.com/gsi/client` request; dev behavior is preserved.

### H. Redundant eager route prefetch

Severity: Medium  
Affected URL/component: home header  
Root cause: Manual `router.prefetch()` duplicated Next Link behavior.  
Impact: Background RSC requests and avoidable main-thread/network work.  
Fix: Removed manual prefetch; native Link prefetch remains.  
Verification: Home background RSC traffic and stable-run TBT decreased.

### I. Small mobile tap targets

Severity: Medium  
Affected URL/component: exam/revision breadcrumbs and map timer checkbox  
Root cause: 16-24 px interactive boxes and fractional layout rounding.  
Impact: WCAG 2.2 target-size/mobile usability risk.  
Fix: Breadcrumb links now have 28 px minimum height; the checkbox is 24 px.  
Verification: 56/56 responsive checks report zero sub-24px controls.

### J. Non-descriptive mobile “Start” link

Severity: Low  
Affected URL/component: home header  
Root cause: Visible link text lacked context.  
Impact: Lighthouse SEO/link-text warning and weaker assistive context.  
Fix: Added screen-reader context, “Indian Polity practice.”  
Verification: Indexable Lighthouse SEO scores are 100 in the stable matrix.

### K. Missing production verification/analytics configuration

Severity: Operational  
Affected URL/component: Search Console and analytics  
Root cause: No `GOOGLE_SITE_VERIFICATION` secret and no analytics provider/measurement ID.  
Impact: Ownership cannot be verified from this environment; no field CWV/INP or traffic data.  
Fix: Code already supports the verification environment variable. Analytics was not invented or installed without a real account/ID.  
Verification: Environment and source scans confirm both are absent.

## 5. Files Changed

The workspace already contained unrelated user changes. This list is limited to files changed for this audit/fix pass.

| File | Reason |
| --- | --- |
| `lib/examCode.ts` | New client-safe exam normalization/sort helpers |
| `lib/catalogCache.ts` | Reject/retry incomplete catalog snapshots instead of caching an empty catalog; invalidate the poisoned cache namespace |
| `lib/publicExamExplorer.test.ts` | Regression assertions for complete snapshot enforcement, retry and cache-key invalidation |
| `lib/polity.ts` | Import/re-export pure helpers instead of defining them in the server-heavy module |
| `components/ExamFilterPills.tsx` | Use the client-safe helper module |
| `components/profile/TargetExamPickerField.tsx` | Use the client-safe helper module |
| `components/TargetExamSelector.tsx` | Use the client-safe helper module |
| `lib/polity/usePolityExamSelection.ts` | Use the client-safe helper module |
| `app/subjects/[subject]/SubjectTopicGrid.tsx` | Use the client-safe helper module |
| `app/subjects/[subject]/SubjectPageContent.tsx` | Responsive optimized LCP hero image |
| `app/contact/ContactHeroIllustration.tsx` | Responsive optimized LCP image |
| `app/components/HomeHeroIllustration.tsx` | Next 16 `preload` migration |
| `app/components/AuthHeroIllustration.tsx` | Next 16 `preload` migration |
| `app/dashboard/SscExamHero.tsx` | Next 16 `preload` migration |
| `app/components/LoadingTestPageContent.tsx` | Next 16 `preload` migration |
| `app/polity/PolityClient.tsx` | Optimized image plus `preload` migration |
| `app/history/HistoryClient.tsx` | Optimized image; removed unnecessary below-fold priority |
| `app/home/components/HomeHeader.tsx` | Descriptive mobile link text; removed redundant prefetch |
| `app/components/HomeGoogleCtaButton.tsx` | Keep direct GSI development-only |
| `next.config.mjs` | Remove unsafe public caching from user-aware routes |
| `app/api/catalog/path-exists/route.ts` | Validate exam and question existence for true 404s |
| `proxy.ts` | Rate-limit-safe true-404 enforcement with authenticated exact-syllabus preservation |
| `app/exams/[examSlug]/SyllabusBreadcrumb.tsx` | 28 px minimum tap targets |
| `components/revision/company-rule-and-early-acts/revision-ui.css` | 28 px minimum breadcrumb targets |
| `app/components/map-practice/MapFilters.tsx` | 24 px timer checkbox target |
| `scripts/verify-soft-404.mjs` | Add invalid exam/question plus exact valid search-subtopic and revision regression cases |
| `scripts/verify-cache-privacy.mjs` | New shared-cache privacy verifier |
| `scripts/audit-responsive.mjs` | New CDP responsive geometry/screenshot audit |
| `package.json` | Add `test:cache-privacy` script |
| `docs/seo-performance-production-audit.md` | This final audit report |

## 6. Before vs After

| Measurement | Before | After | Result |
| --- | ---: | ---: | --- |
| Average transferred bytes, 22 indexable Lighthouse reports | 567,340 B | 463,731 B | 18.3% reduction |
| Average LCP, indexable matrix | 2,360 ms | 2,225 ms | 5.7% improvement |
| Worst LCP, indexable matrix | 6,235 ms | 3,921 ms | 37.1% improvement |
| Worst CLS | 0.011 | 0.005 | Improved; well below 0.1 |
| Catalog subject mobile | Perf 75, LCP 6,235 ms, TBT 200 ms | Perf 88, LCP 3,845 ms, TBT 22 ms | Material improvement |
| Home mobile | Perf 85, LCP 4,248 ms, TBT 88 ms | Stable representative: Perf 90, LCP 3,635 ms, TBT 42 ms | Improved; later raw repeats were slower |
| Contact mobile | Perf 88, LCP 3,996 ms, TBT 36 ms | Perf 91, LCP 3,553 ms, TBT 22 ms | Improved |
| Revision mobile | Perf 87, LCP 3,928 ms, TBT 67 ms | Perf 90, LCP 3,555 ms, TBT 15 ms | Improved |
| Catalog subject JS transfer | About 433 KiB | About 251 KiB | About 42% reduction |
| Catalog subject unused JS | About 195 KiB | About 64 KiB | About 67% reduction |
| Catalog subject image transfer | About 391 KiB | About 47 KiB | About 88% reduction |
| Contact image potential waste | About 74 KiB | 0 | Removed |
| Production-mode Google GSI | About 94 KiB request | No request | Removed from production mode |
| Local SEO crawler | No final post-performance result | 162 URLs, 1,010 links, 498 search items, zero failures/orphans | PASS |
| Search subject/topic/subtopic route stability | Intermittent valid-route “Page not found” caused by an empty cached snapshot | Dev 30/30 and production-mode 30/30 repeated route requests pass; exact search-subtopic path repeatedly returns 200 | FIXED |

The final mixed report set has Performance average 94 and minimum 74 because the exact-final exam-topic mobile repeat remained slow. TBT average is 39.1 ms and max 550 ms in that set. The earlier stable optimized full-matrix TBT max was 42 ms. Both facts are retained; no target is claimed from only the better run.

## 7. Core Web Vitals

### LCP

- Desktop indexable routes: about 714-1,304 ms, comfortably within the 2.5 s engineering target.
- Mobile indexable routes: generally about 3,403-3,851 ms; exact-final exam-topic measured 3,921 ms.
- Status: **Target not met on mobile lab runs.** Images are now correctly sized and discoverable. On many non-image routes the first-visit quality-upgrade announcement text is the LCP element, so remaining work is primarily shared first-load/render execution rather than oversized hero bytes.

### CLS

- Maximum measured CLS: 0.005.
- Status: **PASS**, well below the 0.1 target.

### INP

- Lighthouse does not measure real field INP.
- Most stable TBT values were 0-42 ms, but the exact-final exam-topic mobile repeat set was 405-646 ms.
- Status: **BLOCKED for field verdict.** Add real-user monitoring or use Search Console CrUX after sufficient production traffic. TBT must not be relabeled as INP.

### TTFB

- Representative Lighthouse local TTFB was generally 4-54 ms.
- Final launch baseline warm p50 was 9 ms and p95/p99 38 ms.
- Status: **PASS locally.** Production CDN/region TTFB must be measured after deployment.

## 8. Mobile Audit

Tested exact viewport sizes:

`320x640`, `360x800`, `375x812`, `390x844`, `412x915`, `768x1024`, `1024x768`, and `1440x900`.

Tested routes at every size:

`/`, `/subjects`, one exam topic, one catalog subject, one revision page, `/map-practice`, and `/contact`.

Result: **56/56 PASS**.

- HTTP 200 on every valid test page
- Exactly one H1 on every page
- Zero horizontal overflow
- Zero detected interactive controls below 24 px
- Screenshots saved for home, catalog subject, revision and map at 320, 768 and 1440 widths
- Breadcrumb targets increased to 28 px to avoid fractional rounding below the WCAG threshold
- Map timer checkbox increased to 24 px
- Hero images use responsive sizing rather than desktop-sized unoptimized assets

Machine evidence: `test-results/responsive/audit-results.json` and PNGs in `test-results/responsive/`.

## 9. Production SEO Verification

| Area | Local release build | Current live production |
| --- | --- | --- |
| `robots.txt` | PASS, 103 B, correct sitemap host | PASS |
| `sitemap.xml` | PASS, 162 unique canonical URLs, stable output, no legacy `/polity` | Structurally valid but stale: 43 URLs |
| Canonicals | PASS across crawler | FAIL on multiple live routes/query cases |
| Noindex | PASS for private/thin/practice surfaces | FAIL: `/classic` is still indexable |
| Redirects | PASS: `www`, `/polity`, `/pcb_page`, `/pyq`, old revision URLs | Partial: `www` and `/polity` work; `/pcb_page` and `/pyq` still return 200 |
| 404s | PASS: invalid subject/topic/subtopic/exam/question/top-level paths return 404 | Basic invalid-route probes pass, but deployed behavior is from an older build |
| Metadata | PASS: unique concise title/description, one H1 | FAIL: older long/duplicate metadata patterns remain |
| Structured data | PASS: page-specific Organization/WebSite/breadcrumb/learning schema policy | FAIL: stale global identity and FAQ behavior remains |
| Internal links | PASS: 1,010 checked; zero sitemap orphans | Only 119 checked in stale deployment crawl |
| Search targets | PASS: 498 validated subject/topic/subtopic items; exact destinations and repeated stress return 200 | 94 stale items; old invalid path forms still present |
| Images | PASS locally after optimization | Deploy required |
| Mobile rendering | PASS 56/56 local geometry checks | Recheck after deployment |
| Manifest | PASS locally | Live manifest returned 404 during audit |

Production machine result: `test-results/seo/production-audit-results.json` (139 failures).  
Local machine result: `test-results/seo/audit-results.json` (zero failures).

## 10. Search Console

### Completed in code

- Canonical non-www HTTPS origin is enforced.
- Robots and sitemap endpoints point to `https://questionwale.com`.
- Sitemap contains canonical indexable release URLs and omits known noindex/legacy paths.
- Metadata, canonicals, schema, redirects and true 404 behavior are implemented in the release build.
- `GOOGLE_SITE_VERIFICATION` is supported by `lib/seo.ts` without hard-coding a token.

### Actions that require my Google account

1. Deploy this audited release to production.
2. Add the real Search Console verification token as `GOOGLE_SITE_VERIFICATION` in the production environment.
3. Verify the domain property in Search Console.
4. Submit `https://questionwale.com/sitemap.xml`.
5. Inspect representative home, subject, topic, revision and exam URLs.
6. Review Manual Actions and Security Issues; this cannot be done without account access.
7. After traffic accumulates, review CrUX Core Web Vitals and real INP.
8. Request reindexing only after the live 139-failure crawl is clean.

## 11. Remaining Blockers

- **BLOCKED - production deployment:** the live site is an older build. Deploy, then run `node scripts/audit-seo.mjs https://questionwale.com https://questionwale.com` and the production Lighthouse matrix.
- **REQUIRED DEPLOYMENT CONFIGURATION:** build production with `NEXT_PUBLIC_SITE_URL=https://questionwale.com`. A control build using the local `.env.local` value correctly failed the canonical-origin audit; the final canonical build passed.
- **MANUAL ACTION REQUIRED - Search Console:** no Google account/session or verification token was available.
- **MANUAL ACTION REQUIRED - analytics/RUM:** no analytics measurement ID or provider exists. Add one only with the real production account and consent/privacy requirements.
- **BLOCKED - field INP/CWV:** local Lighthouse cannot manufacture field data. Verify in Search Console/CrUX or a real RUM system after deployment.
- **BLOCKED - consistent 90+ mobile performance:** mobile LCP remains above 2.5 s and exact-final exam-topic repeats scored 71-78. Re-run in clean CI and PageSpeed after deployment, then profile the shared Next runtime/global hydration if the result reproduces.
- **BLOCKED - in-app browser:** no in-app browser instance was available. Installed headless Chrome and CDP provided real rendered-page tests and screenshots.
- **BLOCKED - auth verifier process exit:** all three runtime assertions pass, then Node 24/Windows terminates on `libuv` handle shutdown (`UV_HANDLE_CLOSING`). Re-run on CI/Linux or Node 22 LTS for a clean process exit.
- Third-party ArcGIS/Leaflet tiles control their own image format and cache lifetime. Do not weaken map functionality merely to game Lighthouse.

## 12. Final Scorecard

| Area | Status |
| --- | --- |
| Technical SEO | PASS locally; BLOCKED live until deployment |
| Crawlability | PASS locally |
| Indexability | PASS locally; intentional practice/private noindex retained |
| Sitemap | PASS locally; stale in production |
| Canonicals | PASS locally; deploy required |
| Structured Data | PASS locally; deploy required |
| Internal Linking | PASS - 1,010 links, 498 search targets, zero orphans |
| Mobile SEO | PASS layout/accessibility; mobile LCP risk remains |
| Performance | PARTIAL - large byte/LCP wins, inconsistent exam-topic mobile TBT |
| Core Web Vitals | CLS/TTFB PASS locally; LCP target not met; INP blocked on field data |
| Accessibility | PASS - Lighthouse 100 and 56/56 target/overflow checks |
| Security Regression | PASS assertions and private caching; Windows verifier shutdown anomaly noted |
| Search Console Readiness | Code ready; MANUAL ACTION REQUIRED and deploy required |

### Final regression evidence

- `npm run typecheck`: PASS
- `npm run lint`: PASS
- `npm run build`: PASS, Next.js 16.2.9 production build
- All repository unit suites: PASS after the final source changes
- SEO crawler: PASS, 46 page patterns + 51 handlers, 162 sitemap URLs, 1,010 links, 498 search items, zero orphans/failures
- Sitemap verifier: PASS
- llms link verifier: PASS
- Cache privacy verifier: PASS
- Expanded soft-404 verifier: PASS after the full SEO crawl/rate-limit stress
- Search-route regression: PASS; both search APIs return 200, exact subject/topic/subtopic destinations return 200, dev 30/30 and production-mode 30/30 repeated requests had zero failures
- Responsive audit: PASS 56/56
- Controlled load: 90 requests, concurrency 5 per phase, zero errors; approximately 104.6/82.1/231.5 requests per second for home/revision/subjects
- Question batch: 10 questions, private/no-store, no answer fields exposed
- Auth unit suites: PASS; runtime assertions PASS before the documented Windows shutdown assertion

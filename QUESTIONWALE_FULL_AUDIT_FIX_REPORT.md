# QuestionWale Full Production Audit and Fix Report

Audit date: 29–30 August 2026  
Repository: `QuestionWale` (`testwale`)  
Framework verified: Next.js 16.3.3, App Router  
Production origin: <https://questionwale.com>  
Report status: implementation and local production verification complete; deployment and database migration pending

## 1. Executive Summary

The audit found material public-indexation, content-state, metadata, accessibility, performance, privacy, and authentication-security problems. The most visible production problems were confirmed rather than assumed: obsolete Economics pages returned HTTP 200 with empty content, the expired 26 August 2026 quality campaign remained searchable, and the homepage and subject directory did not apply one consistent availability rule.

The repository now has central policies for content status, canonical URLs, legacy-route disposition, campaign expiry, catalogue counts, metadata, sitemap inclusion, public exam paths, and request security. The six verified permanently obsolete Economics URLs return HTTP 410 with `X-Robots-Tag: noindex, follow`; active catalogue URLs remain crawlable; practice URLs remain functional but use a deliberate `noindex, follow` policy; query-string filters canonicalize to their clean landing URL; and sitemap output is limited to canonical, published informational routes.

The completed local production build passed lint, TypeScript, build, SEO crawl, sitemap, robots, structured-data parsing, soft-404/status, auth-security, cache-privacy, accessibility regression, and the applicable unit/regression suites. The final crawl covered 53 rendered pages, 61 handlers, 212 sitemap URLs, 1,508 internal links, and 745 search items with zero orphan sitemap pages. A 90-request concurrency smoke test recorded zero HTTP errors.

The work deliberately did not alter question IDs, slugs, attempts, profiles, progress, notes, authentication records, or other production data. No database migration was executed. The security migration must be preflighted and applied in staging and then production before the new distributed rate-limit and session lifecycle can be considered fully deployed. Live production still serves the old behavior until this repository revision is released.

### Architecture discovered

- Next.js 16.3.3 App Router with server components by default and targeted client components for interactive practice, navigation, search, contact, and authentication UI.
- Root `proxy.ts` request boundary for response headers, route policy, CSP, and verified permanent tombstones.
- Supabase-backed subject → topic → subtopic → question hierarchy, with public server-side catalogue readers and private/user-aware APIs.
- Google OAuth using Supabase PKCE plus a QuestionWale application-session layer.
- Dynamic canonical catalogue routes under `/subjects/...`, exam routes under `/exams/...`, legacy subject/topic routes, practice routes, revision routes, and authenticated profile/dashboard routes.
- Shared metadata and URL helpers in `lib/seo.ts`; generated App Router sitemap and robots endpoints; server-rendered JSON-LD.
- Cached catalogue aggregates and exam syllabus/path data using bounded Next.js caching/revalidation. Public catalogue caches are separate from private user state.
- No external page-view analytics SDK was found. Attempt/revision events use existing first-party application paths.
- Security configuration is split between Next response headers, request guards, cookie/session helpers, API handlers, Supabase SQL functions/RLS, and deployment environment variables.

## 2. Issues Found

| ID | Issue | Severity | Root Cause | Fixed? |
|---|---|---:|---|---|
| P0-1 | Legacy/empty quiz URLs returned crawlable soft-200 responses | High | Legacy resolution rendered an empty application shell; metadata-level `notFound()` could still stream a 200, and there was no permanent-removal policy | Yes: six verified obsolete URLs are 410; replacement-capable legacy paths use exact redirects; other invalid/empty paths are 404/noindex |
| P0-2 | Expired “30-DAY QUALITY UPGRADE” campaign remained visible/searchable | High | Campaign rendering did not have a server-stable expiry gate | Yes: UTC expiry is centralized, server-evaluated, and regression-tested |
| P0-3 | Homepage and `/subjects` disagreed on subject availability | High | UI-specific hardcoding and inconsistent interpretations of catalogue presence versus published-question availability | Yes: one typed status policy drives cards, CTAs, navigation, search, exam discovery, and sitemap eligibility |
| P0-4 | `?exam=` and other query parameters could create duplicate crawl targets | Medium | Canonicals were not enforced through one clean URL policy on every affected route | Yes: clean absolute canonicals ignore filter/analytics state; filters remain usable/shareable and never enter the sitemap |
| P0-5 | Public question/subject counts were stale or semantically inconsistent | Medium | Hardcoded fallback totals and multiple counting paths | Yes: cached catalogue aggregates provide exact labeled published counts; aggregate failures return 503 rather than invented data |
| P1-1 | Sitemap could include non-index-worthy or unstable URLs | High | Inclusion logic was spread across route generators and was not tied to publishability | Yes: canonical-only sitemap policy, stable trusted `lastmod`, no query/practice/private/legacy/archived entries |
| P1-2 | Robots policy did not fully express production/preview intent | Medium | Robots and environment behavior were not handled as one deploy-aware policy | Yes: production crawlability, preview noindex behavior, private-route guidance, and sitemap declaration are explicit |
| P1-3 | Metadata logic could duplicate the site name and produce inconsistent canonicals | Medium | Route-local title construction bypassed shared metadata rules | Yes: centralized concise metadata, absolute canonicals, matching Open Graph/Twitter data, and no query junk |
| P1-4 | Structured data required semantic and serialization hardening | Medium | JSON-LD entities were assembled independently and lacked consistent canonical/entity rules | Yes: server-rendered Organization/WebSite/BreadcrumbList/ItemList/LearningResource where supported; XSS-safe serialization; no fake FAQ/QAPage/reviews |
| P1-5 | SSC CGL/CHSL and reusable exam landing pages were thin | High | Exam routes exposed hierarchy with limited explanatory structure and expensive aggregate path checks | Yes: reusable factual exam landing architecture with H1, summary, counts, hierarchy, CTAs, standards, breadcrumbs, and appropriate schema; no fabricated year/syllabus |
| P1-6 | Privacy, Terms, and trust pages did not accurately cover current product behavior | Medium | Generic/incomplete copy did not match contact, account, progress, and processor behavior | Yes: accurate product-specific disclosures, effective date, retention/deletion concepts, service availability, acceptable use, and non-government disclaimer |
| P1-7 | Homepage/dialog semantics and accessible names had defects | Medium | Decorative icons leaked into names, H1 text lacked semantic spacing, custom controls lacked complete keyboard/dialog behavior, and focus/contrast coverage was inconsistent | Yes: semantic text, hidden decorative icons, native control, dialog focus management, labels, visible focus, reduced motion, and contrast corrections |
| P1-8 | Avoidable client/hydration work and catalogue query bursts affected performance | High | Auth-dependent homepage hydration, animation dependency use, duplicate public data requests, and full aggregate preflights | Yes: more server rendering, animation removal from trust pages, cached/deduplicated public data, lightweight exam path index, and bounded response caching |
| P1-9 | Public session, OAuth, recovery, mutation, rate-limit, and error hygiene required hardening | Critical | Long-lived/legacy session handling, redirect/origin ambiguity, process-local limits, broad error output, and incomplete token lifecycle | Code fixed; database migration pending before full production enforcement |
| P2-1 | Generic “MCQ course module” descriptions reduced page distinctiveness | Medium | Boilerplate was treated as meaningful stored copy | Yes: low-value boilerplate is filtered; bilingual stored descriptions are preferred; concise contextual fallback is used |
| P2-2 | Practice pages could compete with informational landing pages | Medium | Interactive state and landing content did not have a documented indexation boundary | Yes: informational hierarchy is indexable; practice state is `noindex, follow`, canonicalized, absent from sitemap, and still linked for users |
| P2-3 | Invalid exam descendants could render soft 200 responses | High | Route existence checks happened after metadata/render work and used a heavy full catalogue query | Yes: metadata-stage and render-stage preflight use a lightweight published hierarchy; invalid descendants return 404 |
| P2-4 | Internal crawl depth/orphan handling was incomplete | Medium | Some practice/revision paths lacked reciprocal HTML navigation and invalid legacy links were not centrally excluded | Yes: valid hierarchy links up/down through breadcrumbs/cards/footer; crawl found zero orphan sitemap pages |
| P2-5 | Browser-generated cache/profile files polluted the repository | Low | Chromium/Lighthouse runtime data had been tracked under `test-results` | Yes for tracked files: 2,972 artifacts (573,483,247 bytes) removed from the working tree; recoverable from Git history |

## 3. Files Changed

The table is grouped by responsibility to keep it usable; every application/configuration path changed or created by this work is named explicitly.

| Path(s) | What changed | Why |
|---|---|---|
| `lib/contentStatus.ts`, `lib/catalogDescription.ts`, `lib/catalogStats.ts`, `lib/homeData.ts`, `lib/subjectRoutes.ts` | Added authoritative content-state semantics, description quality filtering, cached counts, and shared route eligibility | Remove duplicated UI rules, fake totals, and boilerplate descriptions |
| `lib/legacyRoutePolicy.ts`, `lib/legacyRouteTombstones.ts`, `proxy.ts` | Added data-driven legacy resolution and exact permanent tombstones; proxy emits branded 410 responses and security/robots headers | Eliminate verified empty soft-200 URLs while preserving exact replacements and valid legacy behavior |
| `lib/seo.ts`, `lib/sitemapCatalog.ts`, `lib/sitemapPolicy.ts`, `app/sitemap.ts`, `public/llms.txt` | Centralized canonical/metadata rules, filtered sitemap candidates, stable dates, and machine-readable public route inventory | Keep only canonical, published, index-worthy URLs discoverable |
| `app/[subject]/page.tsx`, `app/[subject]/topics/page.tsx`, `app/[subject]/topics/[topicSlug]/page.tsx` | Applied canonical metadata, legacy resolution, empty-content handling, and non-boilerplate descriptions | Correct legacy route status/indexation and metadata |
| `app/subjects/page.tsx`, `app/subjects/[subject]/page.tsx`, `app/subjects/[subject]/[topicSlug]/page.tsx`, `app/subjects/[subject]/[topicSlug]/TopicPageContent.tsx`, `app/subjects/[subject]/SubjectTopicGrid.tsx`, `app/subjects/[subject]/SubjectTopicsClient.tsx`, `app/subjects/ExamSubjectsGrid.tsx` | Unified status/count rendering, CTA eligibility, descriptions, hierarchy links, and metadata | Ensure subject/topic pages agree with published catalogue reality |
| `app/exams/[examSlug]/page.tsx`, `app/exams/[examSlug]/[subjectSlug]/page.tsx`, `app/exams/[examSlug]/[subjectSlug]/[topicSlug]/page.tsx`, `app/exams/[examSlug]/[subjectSlug]/[topicSlug]/[subtopicSlug]/page.tsx` | Built reusable exam landing hierarchy, factual summaries, counts, breadcrumbs/schema, and strict invalid-path behavior | Improve exam usefulness/SEO without inventing syllabus facts |
| `lib/examCatalogueServer.ts`, `lib/publicExamExplorer.ts`, `lib/practiceServer.ts` | Added in-flight dedupe, lightweight public exam path index, published hierarchy filtering, and private cache boundaries | Prevent DB timeout bursts and user-state leakage |
| `app/page.tsx`, `app/HomeClientLegacy.tsx`, `app/components/SubjectGrid.tsx` | Server-provided catalogue state/counts and corrected home metadata/semantics | Remove homepage/directory inconsistency and auth-dependent status hydration |
| `app/home/components/HomeDemo.tsx`, `HomeExamStrip.tsx`, `HomeFeatures.tsx`, `HomeFinalCta.tsx`, `HomeFooter.tsx`, `HomeHeader.tsx`, `HomeHero.tsx`, `HomeHeroSearch.tsx`, `HomeHowItWorks.tsx`, `HomePracticePath.tsx`, `HomeProgress.tsx`, `HomeQuality.tsx`, `HomeSignIn.tsx`, `HomeSubjectCard.tsx`, `HomeSubjects.tsx`, `PublicExamExplorer.tsx` | Corrected H1 spacing, claims, CTAs, status labels, contrast, accessible names, dialogs/search/navigation, and client boundaries | Improve accessibility, content accuracy, mobile behavior, and hydration cost |
| `app/globals.css`, `app/lib/translations.ts` | Added global focus/reduced-motion behavior and removed stale duplicated UI translations | Provide consistent keyboard visibility/motion behavior and reduce obsolete state |
| `components/QualityUpgradeAnnouncement.tsx`, `lib/qualityUpgradeAnnouncement.ts` | Server-stable UTC campaign expiry and non-rendering of expired content | Prevent outdated campaigns from remaining visible/indexable |
| `app/about_us/AboutClient.tsx`, `app/contact/ContactClient.tsx`, `app/contact/page.tsx` | Removed animation overhead, improved form semantics, and added accurate contact-data notice | Improve performance/accessibility and privacy transparency |
| `app/privacy/page.tsx`, `app/terms/page.tsx`, `app/content-standards/page.tsx`, `app/components/Footer.tsx` | Rewrote accurate trust disclosures, added content methodology/verification page, and linked it in navigation | Align public policy pages with actual product behavior and strengthen trust/GEO clarity |
| `app/login/page.tsx`, `app/signup/page.tsx`, `app/forgot-password/page.tsx`, `app/forgot-password/ForgotPasswordClient.tsx`, `app/reset-password/page.tsx`, `app/reset-password/ResetPasswordClient.tsx`, `app/verify-email/page.tsx`, `app/verify-email/VerifyEmailClient.tsx` | Concise non-duplicated metadata and complete secure recovery/verification UI | Close account lifecycle gaps without exposing tokens |
| `lib/appSession.ts`, `lib/authCookies.ts`, `lib/sessionStore.ts`, `lib/accountSecurity.ts`, `lib/googleAuthSession.ts`, `lib/userRepository.ts` | Added opaque v2 sessions, hashed persistence, rotation/revocation, bounded secure cookies, one-use hashed verification/recovery tokens, and safer account operations | Harden authentication while preserving the current Supabase/OAuth model |
| `lib/requestSecurity.ts`, `lib/rateLimit.ts`, `lib/distributedRateLimit.ts`, `lib/env.ts`, `.env.example` | Added same-origin/JSON/body-size mutation controls, HMAC-keyed distributed limiting, safe fallback/rollout flags, and documented non-secret configuration | Prevent CSRF-style misuse, memory abuse, cross-instance limit bypass, and unsafe configuration |
| `app/api/auth/login/route.ts`, `app/api/auth/me/route.ts`, `app/api/signup/route.ts`, `app/auth/callback/route.ts` | Applied trusted origins, PKCE-safe redirects, opaque errors, and hardened session issuance | Protect login/signup/callback paths and prevent token/error leakage |
| `app/api/auth/email-verification/request/route.ts`, `app/api/auth/email-verification/confirm/route.ts`, `app/api/auth/password/change/route.ts`, `app/api/auth/recovery/request/route.ts`, `app/api/auth/recovery/confirm/route.ts`, `app/api/auth/sessions/route.ts`, `app/api/auth/sessions/revoke-all/route.ts` | Added secure account verification, recovery, password-change, session listing, and revocation endpoints | Complete account security lifecycle with one-use tokens and revocation |
| `app/api/contact/route.ts`, `app/api/onboarding/exam/route.ts`, `app/api/catalog/path-exists/route.ts`, `app/api/map-practice/questions/route.ts`, `app/api/site-stats/route.ts` | Added shared mutation guards/rate limits, opaque errors, lightweight path checks, private caching, and truthful aggregate failure responses | Harden public endpoints and reduce latency/data leakage |
| `components/UserAvatar.tsx` | Enforced HTTPS-only remote avatar use | Avoid mixed/insecure external profile resources |
| `next.config.mjs` | Added/strengthened security headers and exact legacy hierarchy redirects; removed unrelated mass-home redirect | Improve browser security and preserve URL intent |
| `app/examples/seo-example/page.tsx`, `app/login/page.tsx`, `app/signup/page.tsx` | Removed title-template duplication and aligned shared metadata output | Prevent repeated “QuestionWale” and stale metadata patterns |
| `scripts/create_users_table.sql`, `scripts/create_users_auth_functions.sql`, `scripts/migrate_subtopic_mastery_loop.sql`, `scripts/migrate_security_hardening_20260828.sql`, `scripts/security_preflight_20260829.sql` | Hardened SQL ownership/search path/RLS/grants, introduced hashed session/recovery/rate-limit functions, and added read-only production preflight | Prepare safe database rollout; no migration was executed during this audit |
| `lib/accessibilityRegression.test.ts`, `lib/seoPolicy.test.ts`, `lib/authSecurity.test.ts`, `lib/requestSecurity.test.ts`, `lib/securityRegression.test.ts`, `lib/qualityUpgradeAnnouncement.test.ts`, `lib/publicExamExplorer.test.ts`, `lib/examOnboarding.test.ts`, `lib/examLearning.test.ts` | Added/updated focused regression coverage for accessibility, SEO, expiry, auth, request security, authoritative counts, and public exam behavior | Lock in critical fixes and update stale expectations to the hardened contract |
| `scripts/test-ts-loader.mjs`, `scripts/verify-auth-security.mjs`, `scripts/verify-soft-404.mjs`, `package.json`, `.github/workflows/quality.yml` | Added test loader, runtime auth/status verification (including six 410s), scripts, and secret-safe CI tiers | Make production-quality checks repeatable without exposing deployment secrets to pull requests |
| `next-env.d.ts` | Regenerated by the Next.js production build to reference production route types | Required Next.js 16 generated type entry |
| `test-results/seo/audit-results.json` | Regenerated with the final passing local crawl | Preserve machine-readable SEO audit evidence |
| `test-results/cache-backups/fetch-cache-sandbox-poisoned-20260824/**`, `test-results/lighthouse/chrome-profile/**` | Removed 2,972 tracked generated browser/cache artifacts (573,483,247 bytes) | Keep runtime profiles/caches out of source control; files remain recoverable from Git history |
| `QUESTIONWALE_FULL_AUDIT_FIX_REPORT.md` | Added this final audit, test record, and release checklist | Provide the requested production handoff artifact |

## 4. SEO Fixes

### Legacy and empty pages

Production verification found the six supplied Economics examples returning HTTP 200 with a self-canonical and empty/no-question content. Search results also retained the expired campaign copy. The local production build now returns HTTP 410 for all six exact obsolete paths:

- `/economics/topics/social-security`
- `/economics/topics/growthsustainability-balance`
- `/economics/topics/first-to-twelfth-five-year-plans`
- `/economics/topics/education`
- `/economics/topics/aadhaar-enabled-delivery`
- `/economics/topics/ease-of-doing-business`

Each response includes `X-Robots-Tag: noindex, follow`. They are excluded from the sitemap, search inventory, and internal catalogue links. Legacy pages with a genuine exact modern equivalent use a permanent hierarchy-preserving redirect. Invalid or unpublished catalogue paths return 404. Infrastructure failures are not disguised as “no questions”; the aggregate API returns 503 when its source is unavailable.

### Canonicals and parameter policy

- Canonicals are absolute and use `https://questionwale.com` in the production build.
- `exam`, `stage`, analytics, pagination/state, and other non-content query values are omitted from canonical URLs.
- `?exam=SSC` remains usable as an interactive filter but canonicalizes to the clean landing URL.
- User-specific practice state is not encoded in indexable metadata.
- Practice pages use clean canonical URLs with `robots: noindex, follow`; their informational subject/topic/subtopic parent pages remain indexable.

### Sitemap and robots

- Final sitemap: 212 unique canonical URLs in the audited dataset.
- No legacy Economics tombstones, query URLs, practice-state URLs, auth/profile/account pages, hidden/archived/empty content, or duplicate hosts were emitted.
- Three entries had trustworthy dated `lastmod` values; dates were not fabricated on each request.
- Sitemap generation was stable across repeated requests.
- Production robots allows canonical public assets/content and declares the sitemap. Preview/non-production deployments can be forced to noindex without blocking required CSS/JS.

### Metadata and structured data

- Shared metadata provides concise titles/descriptions, canonical, Open Graph, and Twitter values.
- Site-name duplication is prevented by composing route titles through the shared title template.
- No blanket “2026” was added. Exam pages only present facts derived from stored catalogue/syllabus data.
- Organization and WebSite entities identify QuestionWale consistently. BreadcrumbList and ItemList reflect visible hierarchy; LearningResource is used only on relevant educational landing content.
- JSON-LD serialization is safe against closing-script injection and parsed successfully during the crawl.
- No ratings, reviews, unsupported FAQ markup, or QAPage markup were added.

### Content, exam pages, and internal links

- Major exam pages provide a factual opening answer, published counts, subject/topic hierarchy, practice CTAs, methodology link, breadcrumbs, and update context.
- Generic “MCQ course module” copy is not promoted as a meaningful description. Stored English/Hindi descriptions are preferred; fallback copy describes only visible hierarchy and available practice.
- Crawl path is Homepage → Exam/Subjects → Subject → Topic → Subtopic → Practice, with meaningful links both up and down the hierarchy.
- The final audit found 1,508 internal links and zero orphan URLs among sitemap pages.

## 5. Content-State Fixes

The authoritative typed semantics are:

| State | Meaning | Public behavior |
|---|---|---|
| `active` | Published catalogue node with at least one published question available through the relevant hierarchy | Indexable landing page, listed in directories/search/sitemap, “Start Practice” allowed |
| `coming_soon` | Known public subject/node without currently published questions | May be shown as a labelled roadmap item; no “Start Practice”; excluded from sitemap when it would be an empty landing page |
| `hidden` | Internal or intentionally non-public node | Excluded from navigation, search, related content, and sitemap |
| `archived` | Withdrawn historical node that is not a normal active destination | Excluded from active surfaces and sitemap; exact replacement redirect or removal response selected by legacy policy |

The repository/database catalogue remains the source of names, slugs, hierarchy, exam associations, and published question aggregates. The UI no longer invents a different subject state. In the verified local dataset, Polity (1,893 published questions) and Reasoning (3,080) are active; zero-question subjects display “Coming Soon” everywhere and cannot render a practice CTA.

Counts are labeled according to what they actually measure, such as “Published Questions.” They are cached aggregates rather than full-table scans on each request. Exam totals remain scoped to their exam filters and are not presented as a global unique-question claim when tagging could overlap.

## 6. Performance Findings

No trustworthy pre-change Lighthouse/CrUX capture existed, and the available in-app browser runtime did not expose a browser session. Therefore LCP, INP, CLS, and FCP are not fabricated. The values below are local production-build HTTP and asset measurements, not field Core Web Vitals.

### Before → after measurement table

| Metric | Before | After (local production build) |
|---|---:|---:|
| LCP | Not measured | Not measured; requires browser lab/field validation after deployment |
| INP | Not measured | Not measured; requires user interaction/field data |
| CLS | Not measured | Not measured; requires rendered browser trace |
| FCP | Not measured | Not measured; requires rendered browser trace |
| TTFB | No controlled baseline | Route-response proxy only: warm route set p50 7 ms, p95 19 ms, p99 19 ms |
| Initial linked JS transfer | No controlled baseline | Home 200,688 B; Subjects 194,982 B; SSC CGL 191,455 B (compressed transfer) |
| Request count | No controlled baseline | Initial HTML referenced 12 JavaScript assets on each sampled route; browser subresource count not measured |
| Concurrent smoke errors | No controlled baseline | 0/90 errors |

### Route timings

| Route | Cold | Warm | HTML/response bytes |
|---|---:|---:|---:|
| `/` | 37 ms | 7 ms | 150,649 |
| `/subjects` | 9 ms | 9 ms | 40,226 |
| `/subjects/polity` | 16 ms | 15 ms | 204,302 |
| Sample topic | 12 ms | 19 ms | 52,616 |
| Sample revision route | 20 ms | 16 ms | 133,074 |
| `/robots.txt` | 2 ms | 2 ms | Small text response |
| `/sitemap.xml` | 2 ms | 1 ms | Generated XML |
| `/llms.txt` | 5 ms | 3 ms | Small text response |
| `/about_us` | 3 ms | 3 ms | Static/server response |
| Question batch (10 questions) | 776 ms | 431 ms | 13,089; private/no-store; no answer fields |

The concurrency smoke test produced: home 335.2 requests/s (p50 13 ms, p95 20 ms, p99 21 ms), revision 62.7 requests/s (p50 79 ms, p95 98 ms, p99 140 ms), and subjects 160.4 requests/s (p50 27 ms, p95 49 ms, p99 56 ms), all with zero errors.

Implemented performance changes include server-rendering catalogue availability, removing Framer Motion from About/Contact, reducing client-only state, deduplicating concurrent public catalogue/syllabus requests, replacing full aggregate exam-path preflights with a lightweight published hierarchy, retaining bounded revalidation, and keeping user-aware responses private/no-store.

## 7. Accessibility

Fixed issues:

- Homepage H1 now reads “Master Every Topic. One MCQ at a Time.” as coherent semantic text.
- Decorative icons use `aria-hidden` and no longer pollute link/button names.
- Language selection uses a native labeled select.
- Mobile navigation and search use labelled dialog semantics, Escape handling, focus trapping, focus restoration, and keyboard-operable controls without timing hacks.
- No-op buttons and fake interactive controls were removed.
- Global `:focus-visible` styling provides visible keyboard focus.
- Reduced-motion preferences are respected.
- Low-contrast `#98A2B3` homepage text was replaced with `#667085` where found.
- Contact inputs retain programmatic labels and explanatory text.
- Heading/landmark and link/button usage received static regression coverage.

`npm run test:accessibility` passed 5/5 assertions. Automated browser axe and visual mobile testing were not available in this environment, so color contrast across every state, responsive overflow, touch targets, and screen-reader behavior still require post-deployment browser validation.

## 8. Security

Safely verified and fixed in code:

- New sessions use opaque random v2 tokens; only hashes are stored; rotation/revocation and bounded 30-day cookies are supported. A short legacy transition path is capped at seven days.
- Auth cookies are Secure in production, HttpOnly, and SameSite-protected.
- Google OAuth uses PKCE and trusted public-origin construction. Callback redirects are allowlisted and token-bearing errors are not placed in URLs.
- Email verification/recovery tokens are hashed, one-use, and designed for generic non-enumerating responses.
- Mutating JSON endpoints enforce same-origin requests, appropriate content type, and a 64 KB body limit.
- Rate limits use HMAC-derived identities and a database-backed cross-instance path with a deliberate fallback/required rollout flag.
- Public errors are opaque; internal IDs, SQL details, and secrets are not returned.
- HTTPS-only external avatar URLs are accepted.
- CSP, HSTS, `X-Content-Type-Options`, Referrer-Policy, Permissions-Policy, and frame protections are applied. Sensitive routes receive stricter CSP behavior.
- Question batch responses were checked to ensure correct-answer fields do not leak before answering.
- Dependency audit found zero known production dependency vulnerabilities.

The SQL migration contains transaction boundaries, preflight checks, explicit grants/revokes, RLS/search-path hardening, session/token tables and functions, distributed rate-limit RPC, and password/account helpers. It was not run because neither `psql` nor Docker was available and applying an unverified production mutation would violate the audit safety rules.

Remaining security limitations:

- Database-backed enforcement is pending the staged migration.
- The general public CSP retains `'unsafe-inline'` for current Next.js compatibility; sensitive routes use stricter handling. Removing it safely needs nonce support validated across the rendered application.
- Google login, real email delivery, authenticated profile/session revocation, and contact delivery require staging end-to-end tests with real provider configuration.

## 9. Privacy / Trust

The Privacy page now describes the categories actually used by the product: account/profile data, contact/support submissions, question attempts/progress/preferences, essential cookies/session data, and operational logs. It explains why those categories are processed, the roles of hosting/database/auth/email providers without exposing private configuration, retention concepts, deletion/account requests, contact method, and effective date.

The Contact form now provides an adjacent disclosure explaining how the submitted name, contact detail, issue category, and message are used. Terms cover account use, acceptable use, user reports/submissions, content/IP, service availability, termination, updates, and disclaimers without claiming lawyer approval. The site’s non-government affiliation statement is preserved. A Content Standards page explains bilingual storage, sourcing, verification status, corrections, and the distinction between original questions and verified PYQs.

These changes are factual product disclosures, not legal advice. Counsel review remains appropriate before release in jurisdictions with additional requirements.

## 10. Tests

### Final static/build checks

| Command/check | Exact result |
|---|---|
| `npm run lint` | PASS — ESLint, zero warnings |
| `npm run typecheck` | PASS — `tsc --noEmit` |
| `npm run build` with production origin | PASS — Next.js 16.3.3 compiled in 3.0 s, TypeScript in 2.6 s, 33/33 static pages generated in 457 ms |
| `npm audit --omit=dev --audit-level=high` | PASS — 0 vulnerabilities |

### Focused/regression suites

| Command | Result |
|---|---|
| `npm run test:sources` | PASS — 18/18 |
| `npm run test:request-security` | PASS — 8/8 |
| `npm run test:security-regression` | PASS — 5/5 |
| `npm run test:safe-redirect` | PASS — 3/3 |
| `npm run test:auth-security` | PASS — 10/10 |
| `npm run test:accessibility` | PASS — 5/5 |
| `npm run test:oauth-code-redirect` | PASS — 7/7 |
| `npm run test:public-origin` | PASS — 7/7 |
| `npm run test:profile-overview` | PASS — 8/8 |
| `npm run test:profile-insights` | PASS — 7/7 |
| `npm run test:profile-activity` | PASS — 16/16 |
| `npm run test:profile-saved` | PASS — 14/14 |
| `npm run test:profile-goals` | PASS — 15/15 |
| `npm run test:exam-onboarding` | PASS — both test files |
| `npm run test:exam-learning` | PASS |
| `npm run test:ssc-cgl` | PASS — all 3 test files |
| `npm run test:ssc-chsl` | PASS — all 3 test files |
| `npm run test:quality-upgrade` | PASS — 6/6 |
| `npm run test:seo-policy` | PASS — 14/14 |
| `lib/publicExamExplorer.test.ts` | PASS |

### Runtime production-build checks

| Check | Result |
|---|---|
| Full SEO audit | PASS — 53 pages, 61 handlers, 212 sitemap URLs, 1,508 internal links, 745 search items, 0 orphan sitemap pages |
| Sitemap verifier | PASS — 212 unique production-host canonicals, no query/practice/private/legacy pollution, stable output, 3 trustworthy dated entries |
| Soft-404/status verifier | PASS — invalid subject/topic/subtopic/practice/revision/exam/exam-subject/question/top-level paths return 404; six tombstones return 410; sampled valid routes return 200 |
| Auth runtime verifier | PASS — source invariants; callback returns clean 302; private responses are no-store |
| `llms.txt` verifier | PASS — every listed public URL returned 200; no dead/legacy route |
| Cache privacy verifier | PASS — user-aware routes are private/no-store |
| Canonical parameter check | PASS — `?exam=SSC` returned 200 with clean home canonical |
| Practice metadata check | PASS — clean canonical plus `noindex, follow` |
| Campaign content check | PASS — “26 August 2026” absent from local production HTML |
| Structured-data check | PASS — emitted JSON-LD parsed and matched visible canonical content |
| Load smoke | PASS — 90 requests, 0 errors |

Not executed/claimed: browser Lighthouse, axe browser scan, real mobile visual QA, Google OAuth provider login, email delivery, live contact delivery, authenticated cross-page session/profile flows, and database migration. Static and local route tests cover their code paths but are not substitutes for staging end-to-end verification.

## 11. Remaining Issues

1. The production database migration is pending. Run the read-only preflight and staged migration before enabling distributed-limit-required or email-verification-required flags.
2. Live production still exposes the old content until deployment. At audit time the homepage retained the old H1/status behavior and the six Economics examples still returned HTTP 200.
3. Real Google OAuth, session rotation/revocation, profile/progress, practice persistence, recovery email, and contact delivery require staging credentials and end-to-end testing. No claim is made that external delivery/provider flows were executed.
4. Lighthouse, browser axe, viewport screenshots, keyboard/screen-reader testing, and real mobile overflow/tap-target validation were unavailable because no controllable browser session or installed audit CLI was exposed. Run them against staging and production.
5. Public CSP still permits `'unsafe-inline'` for current Next.js compatibility. Moving to a full nonce-based CSP should be a separate tested change.
6. Field Core Web Vitals are unknown. Collect PageSpeed/CrUX and Search Console data after deployment; local HTTP latency is not an LCP/INP/CLS measurement.
7. The 10-question batch remained the slowest sampled request at 431 ms warm. It is correct/private and did not leak answers, but query timing should be monitored under production database load.
8. Node’s test runner emits non-failing `MODULE_TYPELESS_PACKAGE_JSON` warnings for stripped TypeScript tests. A future package/module cleanup can remove the warning.
9. Forty-eight ignored, untracked browser runtime artifacts may remain outside Git tracking because the sandbox denied their removal. They are not part of the tracked deployment diff.
10. Privacy/Terms copy should receive counsel review; this audit only aligned technical statements with observed product behavior.

## 12. Production Deployment Checklist

1. Create and verify a production database backup. Record the release commit and rollback artifact.
2. Review the diff, especially `proxy.ts`, `next.config.mjs`, auth/session helpers, API guards, and SQL. Confirm that the 2,972 deleted files are only generated cache/profile artifacts.
3. Configure production secrets without committing values:
   - `NEXT_PUBLIC_SITE_URL=https://questionwale.com`
   - a random `AUTH_SECRET` of at least 32 bytes
   - an independent random `RATE_LIMIT_KEY_SECRET`
   - Supabase URL/anon key, with the service-role key available server-side only
   - Google OAuth client configuration and allowed callback origin
   - any existing question/cache version values required by the deployment
   - keep `QW_FORCE_NOINDEX` disabled for production
4. Run `scripts/security_preflight_20260829.sql` read-only against staging. Resolve every failed prerequisite before migration.
5. Back up staging, then apply `scripts/migrate_security_hardening_20260828.sql` as a transaction. Exercise signup, Google callback, current-session lookup, revoke-one/revoke-all, password change, recovery, rate limiting, practice, progress, and profile data.
6. Apply the same preflight and migration to production during a monitored window. Do not edit/delete question or attempt records.
7. Keep `DISTRIBUTED_RATE_LIMIT_REQUIRED=false` until the RPC migration is confirmed on every production instance. Then enable it and verify fail-closed behavior. Enable `REQUIRE_EMAIL_VERIFICATION` only after HTTPS email-link delivery and expiry/one-use behavior pass staging tests.
8. Run `npm ci`, `npm run lint`, `npm run typecheck`, all listed focused tests, `npm audit --omit=dev --audit-level=high`, and `npm run build` using the production origin.
9. Deploy the immutable build. Confirm secrets remain server-only and source maps/artifacts do not expose configuration.
10. Smoke test logged-out and logged-in practice, answer submission, progress/history/retry behavior, bilingual content, notes (if enabled), contact, Google authentication/callback, profile/dashboard, recovery, mobile navigation, sitemap, and robots.
11. Monitor application/Supabase errors, auth failures, rate-limit fallback counts, database statement timeouts, 404/410 volume, question-batch latency, and contact delivery during rollout.

## 13. Post-Deployment Validation

Within minutes of release:

- Confirm `/`, `/subjects`, valid subject/topic/subtopic pages, major exam pages, `/robots.txt`, `/sitemap.xml`, and `/llms.txt` return 200 over HTTPS.
- Confirm all six listed obsolete Economics URLs return 410, include `X-Robots-Tag: noindex, follow`, and are absent from the XML sitemap and internal search.
- Test any legacy URL with a genuine modern replacement: it must return one permanent redirect directly to the closest equivalent, never the homepage.
- Verify invalid subject/topic/subtopic/exam/question paths return 404 rather than a streamed 200 shell.
- Inspect source for absolute canonical tags on home, subjects, exam, topic, subtopic, and practice pages. Confirm `/?exam=SSC&utm_source=test` canonicalizes to `https://questionwale.com/`.
- Confirm practice pages remain usable and have `noindex, follow`; confirm they are absent from the sitemap.
- Fetch sitemap twice and validate XML, unique URLs, production host/protocol, sensible URL count, and only trustworthy `lastmod` values.
- Validate Organization/WebSite, breadcrumbs, ItemList, and LearningResource JSON-LD with Schema.org and Google Rich Results tools where applicable. Ensure entities match visible text.
- Re-run a broken-link crawl and check orphan depth from home to exam/subject/topic/subtopic/practice.
- Perform Chrome Lighthouse and axe at mobile and desktop widths for home, subjects, SSC CGL/CHSL, subject, topic, subtopic, practice, login, contact, profile, and dashboard. Capture LCP, INP proxy/TBT, CLS, FCP, accessibility findings, request count, and JS transfer.
- Complete keyboard-only and screen-reader smoke tests for mobile navigation, search, language select, dialogs, contact, auth, and practice.
- In Google Search Console, submit the clean sitemap, inspect the six 410 URLs, request/validate indexing cleanup, check duplicate/canonical reports, and monitor crawl statistics.
- Monitor Search Console Core Web Vitals and real-user/CrUX data for at least 28 days. Compare field metrics instead of treating local timings as CWV.
- Verify the homepage and `/subjects` expose identical active/coming-soon states and accurate “Published Questions” counts after cache warm-up.
- Verify the expired campaign phrase/date is absent from rendered HTML and cached search snippets eventually update.
- Confirm security headers on public, auth, and 410 responses; verify OAuth callback Location never contains access/recovery tokens.

## 14. Before vs After Scorecard

Scores are engineering audit estimates, not third-party certification. “After” means the verified local production build and is capped where deployment/browser/database evidence is pending.

| Area | Before | After | Rationale |
|---|---:|---:|---|
| Technical SEO | 4/10 | 9/10 | Central canonical/status/metadata rules, correct 404/410 behavior, clean crawl; live deployment pending |
| Indexation | 3/10 | 9/10 | Empty legacy soft-200s replaced by exact 410/404/redirect policy; sitemap and practice policy aligned |
| On-page SEO | 5/10 | 8/10 | Better factual openings, hierarchy, descriptions, titles, exam pages, and trust content without invented syllabus |
| Architecture | 6/10 | 8/10 | Shared typed policies and cached server data replace duplicated UI decisions; some legacy routes remain for compatibility |
| Accessibility | 5/10 | 8/10 | Major semantic/keyboard/focus/contrast defects fixed and statically tested; browser/assistive-tech audit pending |
| Performance | 6/10 | 8/10 | Query burst removed, client work reduced, strong local response/load results; no field CWV yet |
| Security hygiene | 4/10 | 8/10 | Session/OAuth/request/rate/error/header hardening complete in code; SQL rollout and real auth E2E pending |
| Privacy/trust | 4/10 | 8/10 | Disclosures now match product collection/processing; legal review pending |
| GEO/AI readiness | 4/10 | 8/10 | Clear entity, hierarchy, methodology, bilingual/content-standard signals and valid structured data; live recrawl pending |

### Definition-of-done assessment

Repository implementation, local production build, SEO/status verification, focused tests, and this report are complete. The release is **not yet production-complete** until the database preflight/migration, deployment, provider-backed auth/contact tests, live HTTP validation, and browser performance/accessibility checks in Sections 12–13 are executed. That distinction is intentional and prevents untested production claims.

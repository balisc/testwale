# QuestionWale Technical SEO Audit and Implementation Report

Audit date: 24 August 2026  
Framework audited: Next.js 16.2.9 App Router  
Production origin used for verification: `https://questionwale.com`  
Local production server used for runtime verification: `http://127.0.0.1:3017`

## Executive summary

The repository-wide SEO remediation is complete at code level. The audit inventoried all 46 page route patterns and all 51 route-handler patterns, then production-built the application and crawled every URL emitted by the production sitemap.

The final automated result is:

| Check | Final result |
|---|---:|
| Repository page patterns inventoried | 46 / 46 |
| Repository handler patterns inventoried | 51 / 51 |
| Production sitemap URLs crawled | 162 / 162 |
| Sitemap URLs with non-200 status | 0 |
| Sitemap URLs missing a self-canonical | 0 |
| Sitemap URLs carrying `noindex` | 0 |
| Missing or multiple H1s on sitemap URLs | 0 |
| Heading-order violations on sitemap URLs | 0 |
| Exact duplicate titles/descriptions | 0 |
| Titles longer than the audit ceiling of 90 characters | 0 |
| Descriptions longer than 165 characters | 0; maximum is 160 |
| Images missing an `alt` attribute on sitemap URLs | 0 |
| Invalid JSON-LD documents | 0 |
| Internal links accounted for | 1,010 |
| Search catalog targets validated | 498 / 498 |
| Orphan sitemap pages | 0 |
| Soft-404 test failures | 0 |

This is an implementation-readiness result, not a ranking forecast. Search performance still depends on content quality, competition, backlinks, user satisfaction, crawl scheduling, and search-engine decisions. No ranking guarantee is made.

## Architecture and environment detected

| Area | Finding | SEO consequence |
|---|---|---|
| Routing | Next.js App Router only; no `pages/` router | Metadata API, metadata files, server components, route handlers, and Proxy are the controlling surfaces. |
| Domain | Canonical production origin is `https://questionwale.com` | Canonicals, Open Graph URLs, robots sitemap reference, and sitemap `loc` values use this origin. |
| Environment policy | Non-production deployments are forced to `noindex,nofollow`; production requires an HTTPS public origin | Preview/local deployments are protected from accidental indexing. |
| Authentication | Signed application session cookie; Proxy and server components enforce private flows | Dashboard, profile, onboarding, authenticated SSC CGL, and auth-return surfaces are intentionally non-indexable. |
| Content model | Global subject/topic/subtopic catalog plus a published exact-exam syllabus hierarchy | Landing pages can be indexed; question/practice state is treated as interactive and non-indexable. |
| Languages | English and Hindi share the same URL; the client updates the document language when the user switches | No `hreflang` alternates are emitted because there are no separate crawlable language URLs. |
| Analytics/Search Console | No analytics ID, Search Console ownership token, or connected property was available | No fake verification or tracking values were inserted. Conditional Google verification support was added for a real token. |

The implementation follows current [Next.js Metadata API guidance](https://nextjs.org/docs/app/api-reference/functions/generate-metadata), [Next.js metadata-file conventions](https://nextjs.org/docs/app/api-reference/file-conventions/metadata), and Google guidance for [canonical URLs](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls), [sitemaps](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap), [crawlable links](https://developers.google.com/search/docs/crawling-indexing/links-crawlable), [robots directives](https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag), and [structured data](https://developers.google.com/search/docs/appearance/structured-data/sd-policies).

## Indexing strategy implemented

The site now uses a consistent, helpful-content-oriented policy:

- Index substantive public landing pages: home, subject/topic directories with search value, legal/about/contact pages, map practice, published revision guides, and public exam/exam-subject/exam-topic syllabus pages.
- Do not index interactive or stateful surfaces: individual questions, quizzes, mixed practice, subtopic practice, login/signup/onboarding, dashboard/profile, authenticated SSC CGL flows, demos, loading tests, and the legacy home.
- A global catalog subject/topic is indexable only when it has questions or a published revision document. Empty active catalog nodes stay crawlable but receive `noindex` and are excluded from the sitemap.
- The public SSC CGL hierarchy contains 430 discovered paths: 1 exam, 7 subjects, 60 topics, and 362 subtopics. Only the 68 substantive exam/subject/topic landing pages are indexable and sitemapped. The 362 subtopic practice pages are `noindex`.
- Query variants such as `?stage=` and `?exam=` canonicalize to clean content paths. Faceted legacy topic queries canonicalize to their base topic-directory route.
- `robots.txt` does not block pages that need to expose a `noindex` directive. It blocks only non-document `/api/` and `/auth/` paths in production.

## Complete page-route inventory

The table below covers every repository `page.tsx` pattern.

| Route pattern | Purpose | Final index/canonical policy | Validation |
|---|---|---|---|
| `/` | Public homepage | Index; explicit `/` canonical; full social metadata; homepage identity schema | 200; one H1; crawled |
| `/[subject]` | Legacy subject landing | Index for valid supported subject; self-canonical; invalid values 404; `/polity` permanently redirects to catalog | Valid/invalid route tests pass |
| `/[subject]/topics` | Legacy topic directory | Index for valuable supported subjects; selected thin subject keys noindex; clean base canonical | Sitemap crawl passes |
| `/[subject]/topics/[topicSlug]` | Legacy interactive quiz | `noindex,follow`; self-canonical; invalid topic rejected | Policy/source verified |
| `/about_us` | About page | Index; self-canonical; concise unique title; complete OG/Twitter | 200; crawled |
| `/classic` | Previous homepage | `noindex,follow`; excluded from sitemap | Noindex check passes |
| `/contact` | Contact/support | Index; self-canonical; complete OG/Twitter | 200; crawled |
| `/dashboard` | Authenticated dashboard | `noindex`; private cache policy | Source/runtime audit |
| `/demo` | Internal visual demo | `noindex,nofollow`; excluded | Noindex check passes |
| `/disclaimer` | Legal disclaimer | Index; self-canonical | 200; crawled |
| `/economics` | Legacy subject landing | Index; self-canonical | 200; crawled |
| `/examples/seo-example` | Internal metadata example | `noindex,nofollow`; deprecated FAQ schema removed | Noindex/schema check passes |
| `/exams/[examSlug]` | Public exam syllabus landing | Index when a published snapshot exists; clean self-canonical; full social metadata; breadcrumb schema | SSC CGL instance crawled |
| `/exams/[examSlug]/[subjectSlug]` | Public exam subject landing | Index when published; self-canonical; unique metadata; breadcrumb schema | 7 SSC CGL instances crawled |
| `/exams/[examSlug]/[subjectSlug]/[topicSlug]` | Public exam topic landing | Index when published; self-canonical; unique metadata; breadcrumb schema | 60 SSC CGL instances crawled |
| `/exams/[examSlug]/[subjectSlug]/[topicSlug]/[subtopicSlug]` | Public exact-exam practice | `noindex,follow`; clean canonical; excluded from sitemap | Route family structurally verified |
| `/geography` | Legacy subject landing | Index; self-canonical | 200; crawled |
| `/history` | Legacy subject landing | Index; self-canonical | 200; crawled |
| `/loading-test` | Internal loading test | `noindex,nofollow`; excluded | Noindex check passes |
| `/login` | Sign-in | `noindex`; private cache | Source/runtime audit |
| `/map-practice` | Unique interactive map resource | Index; self-canonical; complete social metadata | 200; crawled |
| `/math` | Legacy subject landing | Index; self-canonical | 200; crawled |
| `/onboarding` | Authenticated setup | `noindex`; redirects unauthenticated users | Redirect/runtime audit |
| `/pcb_page` | Obsolete alias | HTTP 308 to `/science` | Manual redirect check passes |
| `/privacy` | Privacy policy | Index; self-canonical | 200; crawled |
| `/profile` | Private profile overview | `noindex`; private route | Source/runtime audit |
| `/profile/activity` | Private activity | `noindex`; private route | Source/runtime audit |
| `/profile/goals` | Private goals | `noindex`; private route | Source/runtime audit |
| `/profile/insights` | Private insights | `noindex`; private route | Source/runtime audit |
| `/profile/saved` | Private saved content | `noindex`; private route | Source/runtime audit |
| `/pyq` | Obsolete PYQ alias | HTTP 308 to `/subjects` | Manual redirect check passes |
| `/question/[...questionSlug]` | Individual question/quiz state | `noindex,follow`; canonical question URL; correct answer excluded from metadata/JSON-LD | Security/source audit |
| `/reasoning` | Legacy subject landing | Index; self-canonical | 200; crawled |
| `/refund-policy` | Refund policy | Index; self-canonical | 200; crawled |
| `/science` | Legacy subject landing | Index; self-canonical | 200; crawled |
| `/signup` | Registration | `noindex`; private cache | Source/runtime audit |
| `/ssc-cgl` | Authenticated SSC CGL flow | `noindex`; logged-out users redirect to public `/exams/ssc-cgl` | Source/runtime audit |
| `/ssc-cgl/[...path]` | Authenticated SSC CGL hierarchy/practice | Every metadata branch explicitly `noindex` | Source/unit tests pass |
| `/ssc-cgl/auth-return` | Authentication continuation | `noindex,nofollow` | Source audit |
| `/subjects` | Public subject directory | Index; self-canonical | 200; one H1; crawled |
| `/subjects/[subject]` | Global catalog subject | Conditional index: questions or published revision; otherwise noindex; self-canonical | All sitemapped instances crawled |
| `/subjects/[subject]/[topicSlug]` | Global catalog topic | Conditional index: questions or published revision; otherwise noindex; unique concise metadata | All sitemapped instances crawled |
| `/subjects/[subject]/[topicSlug]/[subtopicSlug]/revision` | Revision guide | Index only for a published revision; unpublished routes noindex; self-canonical; LearningResource + breadcrumb schema | 3 published URLs crawled |
| `/subjects/[subject]/[topicSlug]/practice` | Mixed topic practice | `noindex,follow`; self-canonical; excluded | Policy/source verified |
| `/subjects/[subject]/[topicSlug]/practice/[subtopicSlug]` | Subtopic practice | `noindex,follow`; self-canonical; excluded | Soft-404 and structure tests pass |
| `/terms` | Terms | Index; self-canonical | 200; crawled |

## Complete route-handler inventory

All handler patterns were inventoried. API and authentication handlers are not HTML landing pages, are excluded from the sitemap, and are disallowed in production robots where appropriate. Sitemap handlers remain public machine-readable endpoints.

| Route handler | Classification | Crawl/index policy |
|---|---|---|
| `/api/admin/revalidate-question-batch` | Admin mutation/revalidation | Robots-disallowed; never sitemapped |
| `/api/auth/flash` | Auth state | Robots-disallowed; private |
| `/api/auth/google` | OAuth | Robots-disallowed; private |
| `/api/auth/google/redirect` | OAuth redirect | Robots-disallowed; private |
| `/api/auth/google/start` | OAuth start | Robots-disallowed; no-store |
| `/api/auth/login` | Authentication | Robots-disallowed; private |
| `/api/auth/logout` | Authentication | Robots-disallowed; private |
| `/api/auth/me` | Session state | Robots-disallowed; private |
| `/api/auth/public-config` | Public auth config | Robots-disallowed; not a document |
| `/api/catalog/exams` | Catalog API | Robots-disallowed; not a document |
| `/api/catalog/path-exists` | Read-only route validator | Robots-disallowed; not a document |
| `/api/catalog/ranked-exams` | Catalog API | Robots-disallowed; not a document |
| `/api/contact` | Form endpoint | Robots-disallowed; not a document |
| `/api/history/questions` | Question API | Robots-disallowed; not a document |
| `/api/history/topics` | Topic API | Robots-disallowed; not a document |
| `/api/home/search` | Search-data API | Robots-disallowed; not a document |
| `/api/learning/dashboard` | Private learning state | Robots-disallowed; private |
| `/api/map-practice/questions` | Practice API | Robots-disallowed; not a document |
| `/api/onboarding/exam` | Onboarding mutation/state | Robots-disallowed; private |
| `/api/onboarding/status` | Onboarding state | Robots-disallowed; private |
| `/api/onboarding/tracks` | Onboarding data | Robots-disallowed; private |
| `/api/practice/advance-cycle` | Practice mutation | Robots-disallowed; private/stateful |
| `/api/practice/attempts` | Practice mutation/state | Robots-disallowed; private |
| `/api/practice/correct-ids` | Correctness-gated API | Robots-disallowed; private |
| `/api/practice/dashboard` | Practice state | Robots-disallowed; private |
| `/api/practice/progress` | Practice state | Robots-disallowed; private |
| `/api/practice/question-batch` | Question delivery | Robots-disallowed; not a landing page |
| `/api/practice/question-state` | Question state | Robots-disallowed; private |
| `/api/practice/report` | Report mutation | Robots-disallowed; private |
| `/api/practice/reset-subtopic` | Practice mutation | Robots-disallowed; private |
| `/api/practice/submit` | Answer submission | Robots-disallowed; private |
| `/api/practice/subtopic-state` | Practice state | Robots-disallowed; private |
| `/api/practice/validate-question-ids` | Validation API | Robots-disallowed; private |
| `/api/profile` | Profile API | Robots-disallowed; private |
| `/api/profile/activity` | Profile API | Robots-disallowed; private |
| `/api/profile/exam-preference` | Preference API | Robots-disallowed; private |
| `/api/profile/goals` | Profile API | Robots-disallowed; private |
| `/api/profile/insights` | Profile API | Robots-disallowed; private |
| `/api/profile/saved` | Profile API | Robots-disallowed; private |
| `/api/profile/ssc-cgl-preference` | Preference API | Robots-disallowed; private |
| `/api/questions` | Question API | Robots-disallowed; not a document |
| `/api/questions/[...slug]` | Question API | Robots-disallowed; not a document |
| `/api/search-suggestions` | Suggestions API | Robots-disallowed; not a document |
| `/api/signup` | Registration endpoint | Robots-disallowed; private |
| `/api/site-stats` | Public data API | Robots-disallowed; not a document |
| `/api/subject-counts` | Public data API | Robots-disallowed; not a document |
| `/api/topics` | Topic API | Robots-disallowed; not a document |
| `/auth/callback` | OAuth callback | `/auth/` robots-disallowed; no-store/private |
| `/sitemaps/[part]` | Legacy sitemap compatibility | Public machine endpoint; not an HTML page |
| `/sitemaps/sitemap-questions` | Legacy sitemap compatibility | Public machine endpoint; not an HTML page |
| `/sitemaps/sitemap-questions.xml` | Legacy sitemap compatibility | Public machine endpoint; not an HTML page |

## Findings and implemented fixes

| Severity | Before | Risk | Implementation | After evidence |
|---|---|---|---|---|
| Critical | Root metadata included `canonical('/')`, which Next.js shallow-merged into child routes lacking their own `alternates` | Public exam and miscellaneous child pages could declare the homepage as canonical | Removed the root canonical. Homepage keeps its explicit canonical; indexable dynamic pages build their own metadata | 162/162 sitemap pages have a self-canonical |
| High | Public exam root/subject/topic routes had partial titles only and were absent from the sitemap | Weak discoverability and inherited homepage social/canonical data | Added full metadata, concise unique titles/descriptions, clean canonicals, social metadata, breadcrumbs, and 68 useful syllabus URLs to the sitemap | 68 exam URLs crawled; 0 metadata/schema failures |
| High | Public exam subtopics and legacy quiz surfaces were indexable interactive pages | Thin/duplicate index expansion | Set exact-exam subtopic practice and legacy quiz metadata to `noindex,follow`; kept links usable | No practice URL appears in sitemap |
| High | Private SSC CGL branches did not consistently declare `noindex` | Authenticated state could be indexed by URL pattern | Added explicit robots metadata to root, every catch-all branch, and auth-return | Source audit and unit tests pass |
| High | Concurrent crawling could cause repeated stale exam-catalog revalidation and database timeouts | Published exam routes could temporarily return unavailable/404 under crawler bursts | Added a shared in-flight request guard and last-known-good fallback around public exam explorer data | Production crawl passes without revalidation stampede |
| High | `/pcb_page` and `/pyq` were static server-component redirects rendered as HTTP 200 plus meta refresh | Search engines could treat them as soft redirects | Added permanent redirects in Next config | Both return HTTP 308 with correct `Location` |
| Medium | 9 General Awareness topic pages shared the same generic description | Weak snippets and duplicate metadata | Topic metadata now combines topic + subject context and is capped cleanly | 0 exact duplicate descriptions; maximum 160 chars |
| Medium | Many generated exam/catalog titles were verbose | Truncation and weak differentiation | Added concise title construction with context preservation and subject aliases | 0 duplicate titles; maximum rendered title 82 chars |
| Medium | `EducationalOrganization` and `WebSite` schema appeared sitewide | Site-name schema was not limited to the homepage; organization type was stronger than supported evidence | Moved identity schema to home only and used `Organization` + `WebSite` | Non-home identity-schema count is 0 |
| Medium | Published revision pages emitted `FAQPage` | Google removed FAQ rich-result support in June 2026 | Removed FAQPage JSON-LD while retaining visible FAQ content; kept LearningResource and BreadcrumbList | No FAQPage schema in crawled output |
| Medium | Search results used click-handler buttons for navigation | Navigation was not expressed as crawlable anchors | Replaced result buttons with Next `<Link>` anchors | 498 live search entries have canonical route-shaped hrefs |
| Medium | `/subjects` jumped from H1 to card H3 headings | Semantic outline gap | Changed subject-card headings to H2 | 0 heading-order failures |
| Medium | Active catalog topics were added to sitemap even when they had no questions and no published revision | Thin noindex URLs could enter sitemap | Sitemap now applies the same value rule as page metadata | 0 noindex sitemap URLs |
| Medium | Manifest/icon metadata routes were not reserved in the top-level Proxy allowlist | Generated metadata assets returned a branded 404 | Added `manifest.webmanifest` and `icon.webp` to the allowlist; added `app/manifest.ts` | Manifest and app icon return 200 |
| Low | About/contact/map pages manually supplied incomplete nested social objects | Root social values could be inherited inconsistently due shallow metadata merging | Migrated them to the central metadata builder | Full OG/Twitter output verified in production HTML |
| Low | Classic homepage remained indexable | Duplicate home-like experience | Marked it `noindex,follow` and excluded it from sitemap | Noindex check passes |
| Low | Search Console verification had no safe configuration point | Manual setup friction | Added optional `GOOGLE_SITE_VERIFICATION` support; no placeholder is emitted | Token is emitted only when a real env value exists |

Google's current Search documentation lists the removal of FAQ rich results in its [Search documentation updates](https://developers.google.com/search/updates#removing-faq-rich-result). The implementation therefore avoids adding FAQ, practice-problem, course-info, review, rating, or institutional-affiliation markup without supported eligibility and visible evidence.

## Canonical and redirect strategy

- Preferred origin: `https://questionwale.com`.
- Existing host redirect: `www.questionwale.com/*` permanently redirects to the non-www production origin.
- Every indexable sitemap URL declares a self-canonical.
- Query-state variants canonicalize to their clean path.
- Legacy `/polity` routes permanently redirect to `/subjects/indian-polity`.
- Old revision slugs permanently redirect to current published revision slugs.
- `/pcb_page` permanently redirects to `/science`.
- `/pyq` permanently redirects to `/subjects`.
- Invalid subjects, topics, subtopics, and unknown top-level routes return real HTTP 404 responses.

This matches Google's guidance to use redirects and sitemap entries as supporting canonical signals while keeping one consistent canonical form.

## Sitemap and robots analysis

Final sitemap composition:

| URL class | Count |
|---|---:|
| Static/public utility pages | 9 |
| Public exam landing pages | 68 |
| Global catalog and published revision pages | 73 |
| Valuable legacy subject/topic directories | 12 |
| Total | 162 |

Sitemap policy details:

- All 162 `loc` elements use `https://questionwale.com`.
- Every `loc` is unique and returns 200.
- No redirect, noindex, practice, question, auth, dashboard, profile, demo, or invalid route is present.
- Three published revision pages use real review dates as `lastmod`.
- Request-time timestamps are not fabricated for undated URLs.
- The sitemap output is stable across consecutive requests.

Production robots behavior:

```text
User-agent: *
Allow: /
Disallow: /api/
Disallow: /auth/
Sitemap: https://questionwale.com/sitemap.xml
```

Non-production behavior intentionally disallows all crawling. Google notes that a crawler must be able to access a page to see its `noindex` directive; this is why practice/private HTML paths are not blocked in production robots.

## On-page SEO and content-quality findings

### Titles and descriptions

- Every indexable crawled page has a non-empty title and description.
- Exact duplicate title groups: 0.
- Exact duplicate description groups: 0.
- Maximum rendered title length in the audited sitemap: 82 characters.
- Titles over the audit's excessive-length ceiling of 90: 0.
- Maximum description length: 160 characters.
- Titles are produced from the visible subject/topic/exam label and retain route-specific context where needed.
- Descriptions describe the page content rather than repeating generic keyword strings.

Google does not define a fixed character limit for title links or snippets; the audit ceilings are an editorial safeguard, not a ranking rule. Google may rewrite both titles and snippets based on the query and page content. See [title-link guidance](https://developers.google.com/search/docs/appearance/title-link) and [snippet guidance](https://developers.google.com/search/docs/appearance/snippet).

### Headings and semantics

- Every indexable sitemap page renders exactly one H1.
- No audited page skips heading levels.
- Breadcrumbs use semantic `<nav aria-label="Breadcrumb">` and ordered lists.
- Cards and directory headings are ordered beneath the page H1.
- Search and directory navigation uses real anchors.

### Images and links

- No sitemap page contains an image without an `alt` attribute.
- Decorative imagery uses empty alternative text where appropriate.
- Next Image usages provide dimensions or responsive fill/sizes behavior.
- External new-tab links inspected in source use `rel="noopener noreferrer"`.
- No broken link or orphan was found in the final indexable graph.

## Structured-data strategy

Final structured-data types observed on indexable sitemap pages:

- `Organization` — homepage only.
- `WebSite` — homepage only, supporting site-name understanding.
- `BreadcrumbList` — public exam hierarchy and published revision pages.
- `LearningResource` — published revision guides where the content is visible.

No fake reviews, ratings, authors, affiliations, answer correctness, or credentials were added. The public question route remains noindex and does not reveal the correct answer in metadata or JSON-LD.

## Language and internationalization

The application offers English/Hindi UI on the same URLs and stores the selection client-side/cookie-side. Because there are no separate `/en/` and `/hi/` crawlable equivalents, emitting alternate-language `hreflang` URLs would be misleading. The server default is English; the client updates the root `lang` value when the user switches languages.

If fully indexable Hindi content is later required, create stable Hindi URLs first, ensure equivalent server-rendered content, then add reciprocal `hreflang="en"`, `hreflang="hi"`, and optional `x-default` links.

## Mobile-first, Core Web Vitals, and performance

Code-level checks found:

- Responsive Tailwind layouts and explicit mobile breakpoints across public templates.
- Below-fold home content is dynamically split.
- `next/font` uses `display: swap`.
- Image optimization is configured for AVIF/WebP and responsive sizes.
- Public exam data is cached, and concurrent cache refreshes are now deduplicated.
- Catalog snapshots avoid per-URL database scans in sitemap generation.

The in-app browser had no attached browser instance, so visual viewport inspection and Lighthouse/Core Web Vitals lab measurement could not be run in this environment. No Lighthouse score is claimed. After deployment, measure mobile LCP, INP, and CLS in PageSpeed Insights and Search Console's Core Web Vitals report. Google's current guidance recommends good Core Web Vitals but also states that good scores alone do not guarantee top rankings: [Core Web Vitals documentation](https://developers.google.com/search/docs/appearance/core-web-vitals) and [mobile-first indexing guidance](https://developers.google.com/search/docs/crawling-indexing/mobile/mobile-sites-mobile-first-indexing).

## Search Console and analytics setup

No account connection or verification token was available, so these actions remain manual:

1. Confirm the production deployment has `NEXT_PUBLIC_SITE_URL=https://questionwale.com` and does not set `QW_FORCE_NOINDEX=1`.
2. Prefer a Search Console Domain property and verify it using the DNS TXT record supplied by Google.
3. If using an HTML-tag URL-prefix verification instead, set `GOOGLE_SITE_VERIFICATION` to the real token and rebuild/deploy. The Metadata API will emit the verification tag conditionally.
4. Submit `https://questionwale.com/sitemap.xml`.
5. Inspect representative URLs: `/`, `/subjects`, a catalog topic, a published revision, `/exams/ssc-cgl`, an exam topic, and a noindex practice URL.
6. Review Search Console Pages/Indexing reports for crawled-not-indexed, duplicate canonical, soft-404, and blocked-resource patterns.
7. Analytics is currently absent. Choose a platform and consent/privacy policy before adding tracking. Do not add a placeholder ID or load an analytics script without a real operational decision.

## Verification evidence

| Command/check | Result |
|---|---|
| `npm run typecheck` | Pass |
| `npm run lint` | Pass with zero warnings |
| Production `npm run build` with production origin | Pass |
| `npm run test:ssc-cgl` | Pass: syllabus, preference, and public explorer suites |
| `npm run test:sources` | Pass: 18/18 |
| `npm run test:safe-redirect` | Pass: 3/3 |
| `npm run test:auth-security` | Pass: 8/8 |
| `npm run test:public-origin` | Pass: 7/7 |
| `npm run test:oauth-code-redirect` | Pass: 7/7 |
| `node scripts/audit-seo.mjs ...` | Pass: 0 failures, 0 warnings |
| `node scripts/verify-sitemap.mjs ...` | Pass: 162 unique live URLs |
| `node scripts/verify-soft-404.mjs ...` | Pass: all valid/invalid route expectations |
| `node scripts/verify-llms-links.mjs ...` | Pass: all listed links live |
| Pre-deployment full audit | PASS=46, FAIL=0, BLOCKED=5, WARN=0 |
| In-app browser/Lighthouse | Blocked: no browser instance attached |

The standalone auth runtime verifier completed its source, callback redirect, and no-store assertions, then hit a Windows/libuv process-shutdown assertion. The assertions themselves passed; the platform shutdown anomaly should not be represented as a clean command exit.

Generated machine-readable results are stored at `test-results/seo/audit-results.json` and `test-results/pre-deployment/audit-results.json`.

## Exact implementation file list

### Metadata, canonicals, schema, and manifest

- `lib/seo.ts`
- `app/layout.tsx`
- `app/page.tsx`
- `app/manifest.ts`
- `app/about_us/page.tsx`
- `app/contact/page.tsx`
- `app/map-practice/page.tsx`
- `app/classic/page.tsx`
- `app/examples/seo-example/page.tsx`
- `app/[subject]/topics/page.tsx`
- `app/subjects/[subject]/[topicSlug]/[subtopicSlug]/revision/page.tsx`

### Public exam SEO and crawl availability

- `app/exams/[examSlug]/page.tsx`
- `app/exams/[examSlug]/[subjectSlug]/page.tsx`
- `app/exams/[examSlug]/[subjectSlug]/[topicSlug]/page.tsx`
- `app/exams/[examSlug]/[subjectSlug]/[topicSlug]/[subtopicSlug]/page.tsx`
- `lib/publicExamExplorer.ts`
- `app/ssc-cgl/page.tsx`
- `app/ssc-cgl/[...path]/page.tsx`
- `app/ssc-cgl/auth-return/page.tsx`

### Sitemap, robots-adjacent routing, redirects, and internal links

- `app/sitemap.ts`
- `lib/sitemapCatalog.ts`
- `proxy.ts`
- `next.config.mjs`
- `app/home/components/HomeHeroSearch.tsx`
- `app/components/SubjectGrid.tsx`

### Regression tooling and documentation

- `scripts/audit-seo.mjs`
- `scripts/verify-sitemap.mjs`
- `package.json`
- `docs/seo-audit-report.md`

## Prioritized follow-up plan

### Immediate deployment checks

1. Deploy the verified build with the production origin and required secrets.
2. Confirm live `robots.txt`, `sitemap.xml`, `manifest.webmanifest`, `/pcb_page`, and `/pyq` behavior.
3. Verify Search Console ownership and submit the sitemap.
4. Use URL Inspection on representative indexable and noindex routes.

### Next 30 days

1. Monitor indexing coverage and canonical selections weekly.
2. Add or expand substantive revision guides only where first-party content is strong; do not mass-index empty practice nodes.
3. Resolve the missing legacy `reasoning_questions` database table/view if those noindex legacy quizzes are intended to remain usable. This is a content/data concern rather than an indexability blocker.
4. Run mobile Lighthouse/PageSpeed tests after deployment and address measured LCP, INP, or CLS bottlenecks rather than guessing.

### Next 60–90 days

1. Compare Search Console query/page data against the new exam and revision landing pages.
2. Improve internal contextual links between high-value revision guides and closely related syllabus topics.
3. Build separate server-rendered Hindi URLs only if Hindi organic discovery is a product priority; then implement reciprocal hreflang.
4. Add analytics only with a real measurement plan, consent decision, and documented event taxonomy.

## Final status

Code-level technical SEO is production-ready under the tested configuration. All indexable sitemap pages are reachable, canonicalized, semantically headed, uniquely described, internally linked, and free of detected schema/image errors. The remaining work is deployment verification, Search Console ownership/submission, real-user performance measurement, and ongoing content quality—not a hidden repository SEO defect.

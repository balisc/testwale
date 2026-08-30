# QuestionWale Security Audit Report

## Audit record

- Audit window: 2026-08-28 through 2026-08-29 (Asia/Calcutta)
- Audit-start revision: `a2c400f06ab218d101c0519c645d70a0c83c8b95`
- Report-time revision: `41fbfb49eb01df7888feaac38b0fe11481f5143c`
- Scope: the complete repository, relevant Git history, local builds/tests, and safe read-only inspection of the deployed website and its publicly reachable Supabase REST surface
- Production mutations: none
- Overall recommendation: **Safe after listed manual actions**

The report-time commit combines the security work with unrelated SSC CHSL work that was already in progress. This audit preserved those changes. The report and the final Windows test-runner compatibility adjustment were prepared after that commit.

## Executive summary

The audit confirmed 11 findings: 1 Critical, 3 High, 5 Medium, and 2 Low. The most important issues were an outdated Next.js security patch level, direct public access to map and legacy quiz answer data, and overly broad database/RPC permissions that allowed identity-bearing operations to reach Supabase without the intended trusted server boundary.

Repository-level fixes now keep answer keys on the server, calculate submissions server-side, route sensitive Supabase operations through the server-only service role, enforce same-origin checks for cookie-authenticated mutations, tighten validation and ownership checks, bound the in-process rate limiter, improve cache/security headers, disable obsolete Google credential endpoints, and add an idempotent database hardening migration. Next.js and affected transitive dependencies were upgraded; the final dependency audit reports zero known vulnerabilities.

The code package is not the whole production fix. The Supabase migration has deliberately **not** been applied to production because production access was restricted to read-only inspection. Public answer data remains reachable from the database until that migration is applied. The migration must be staged and then executed immediately after the matching application deployment. Tracked Lighthouse browser profiles and cache backups also remain in Git pending explicit deletion approval.

This was a comprehensive best-effort audit, not a proof that the application is immune to every future vulnerability.

## Architecture and attack surface

| Area | Observed design |
|---|---|
| Application | Next.js App Router 16.3.3, React 19, TypeScript, Node.js/npm |
| Database/API | Supabase PostgreSQL and PostgREST; server-only service-role access for sensitive operations after remediation |
| Authentication | Custom email/password users through `SECURITY DEFINER` RPCs; Google OAuth through Supabase PKCE; stateless HMAC-signed `qw_auth` cookie |
| Hosting | Vercel-compatible Next.js deployment; canonical public origin supplied by `NEXT_PUBLIC_SITE_URL` |
| Public surface | Marketing/home/search, subject/topic/question pages, legacy quizzes, map practice, sitemap/SEO assets |
| Authenticated surface | Profile, onboarding, exam preferences, saved items, practice progress, attempts, reports, dashboard |
| Administrative surface | Bearer-protected revalidation endpoint; no general-purpose admin UI was found |
| External content | Google OAuth, Google Fonts, OpenStreetMap/CARTO/Esri map resources |
| Absent from repository | Payments, uploads, webhooks, email delivery, cron/background workers, service workers, Docker/container configuration, and CI workflows |
| Sensitive data | Account email/name, password hashes, session assertions, OAuth identity metadata, profile/preferences, saved items, attempts/progress, contact/report content, answer keys, server-only keys |
| Existing controls | HttpOnly/SameSite cookies, production `Secure` cookie, PKCE OAuth, CSP and other browser headers, RLS in newer question data, input checks, proxy-based rate limiting |

### Trust boundaries

1. Untrusted browser input crosses into Next.js pages, route handlers, and the global proxy.
2. The Next.js server crosses into Supabase using either a public client or a privileged service-role client.
3. Supabase PostgREST/RPC is independently internet-reachable; database grants and RLS must remain secure even when application routes are bypassed.
4. Google/Supabase OAuth redirects cross third-party identity and browser boundaries before returning to the application.
5. Deployment environment variables cross the hosting control plane into the server process; only explicitly public values may enter browser bundles.

## Threat model

| Asset/flow | Principal abuse cases | Security objective |
|---|---|---|
| Sessions and accounts | Forged/replayed session, login CSRF, user enumeration, stale session use | Authenticate on the server, bind mutations to the intended origin, support revocation/reauthentication |
| User-owned progress and preferences | ID substitution, cross-account reset/update, duplicate counter inflation | Enforce ownership at the trusted boundary and preserve first-attempt uniqueness |
| Quiz/map answer keys | Direct PostgREST download or pre-answer API disclosure | Keep answers server-side until a submitted attempt is evaluated |
| Contact/report data | Anonymous reading, mass submission, oversized content | Restrict reads/writes, validate and limit submissions |
| Database/RPC boundary | Calling `SECURITY DEFINER` functions directly with a victim-controlled UUID | Revoke public execution and derive identity from the authenticated application session |
| Server secrets | Browser bundle, log, artifact, or Git disclosure | Use server-only variables, avoid values in reports/logs, scan source/history |
| Availability | Distributed credential guessing, unbounded limiter keys, expensive queries | Route-specific limits, bounded memory, managed distributed enforcement |
| Deployment artifacts | Browser cookies/history/local storage committed in test profiles | Exclude generated profiles and remove existing tracked copies/history |

High-risk flows reviewed first were login/registration/OAuth, profile and practice mutations, answer retrieval/submission, public Supabase grants/RLS/RPCs, and global request handling.

## Scope and methodology

- Inventoried tracked files, environment variable names, routes, server/client boundaries, SQL migrations/functions/policies, third-party calls, generated artifacts, and Git state/history.
- Manually reviewed authentication, authorization/BOLA, CSRF, CORS/browser controls, input handling, cache behavior, secrets, rate limiting, Supabase grants/RLS/RPCs, and supply-chain/deployment configuration.
- Ran dependency audit and signature checks, high-confidence secret/pattern scans, TypeScript, ESLint, existing unit suites, new security regression suites, clean installation, production build, and safe local runtime probes.
- Queried only non-mutating production pages and anonymous Supabase `SELECT` surfaces. No credentials, cookies, database values, or personal data were copied into the report.
- Used current primary guidance: [OWASP API Security Top 10](https://owasp.org/API-Security/editions/2023/en/0x11-t10/), [OWASP CSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html), [Supabase RLS guidance](https://supabase.com/docs/guides/database/postgres/row-level-security), [Supabase secure-data guidance](https://supabase.com/docs/guides/database/secure-data), [Next.js CSP guidance](https://nextjs.org/docs/app/guides/content-security-policy), and the [Next.js August 2026 security release](https://nextjs.org/blog/august-2026-security-release).

## Findings register

| ID | Title | Severity | CWE / OWASP | Affected component | Exploit scenario | Evidence | Root cause | Fix applied | Verification | Final status |
|---|---|---:|---|---|---|---|---|---|---|---|
| SEC-001 | Framework and transitive dependencies below current security patch level | Critical | CWE-1104 / OWASP A06:2021 | `package.json`, lockfile, Next.js App Router | An attacker targets a framework flaw reachable through normal application requests | Baseline used Next 16.2.9; `npm audit` reported five High dependency findings; Next's current security release identifies 16.3.3 as the patched line for two Critical issues | Security-sensitive packages were not pinned to the current patch release | Pinned `next` and `eslint-config-next` 16.3.3 and refreshed compatible transitives | Clean install, build, full tests, `npm audit` zero vulnerabilities, signature verification passed | Fixed |
| SEC-002 | Map answer coordinates exposed through public database/API data | High | CWE-200 / OWASP API3:2023, A01:2021 | `map_locations`, `map_questions`, map-practice APIs/UI | A user fetches coordinates/tolerance/explanation before answering and automates perfect results | Read-only production probe returned public map rows and exact answer properties | Public table policies and client-visible response shape treated answer material as ordinary content | Added server-only question projection, coarse region hint, and server-side Haversine submission; migration revokes direct public table access | Local GET contained no answer material; POST scored server-side; production DB exposure re-confirmed as migration pending | Application fixed; database migration required |
| SEC-003 | Legacy quiz answers and explanations publicly downloadable | High | CWE-200 / OWASP API3:2023, A01:2021 | Nine legacy subject question tables and legacy quiz routes/pages | A user queries PostgREST or page data to obtain the answer key before submitting | Read-only production probes returned rows containing `correct_answer` and `explanation` | Legacy tables were publicly selectable and server pages forwarded complete row objects | Added a strict table allow-list, pre-submit projection, server-side answer evaluation, service-role reads, and migration revokes | Local question response excluded answer fields; submit response revealed result only after submission; production exposure remains until migration | Application fixed; database migration required |
| SEC-004 | Public database/RPC permissions bypassed the trusted identity boundary | High | CWE-862, CWE-639 / OWASP API1/API5:2023, A01:2021 | Users, contact, profile, practice RPCs, migration scripts | A direct caller supplies another user's UUID to an identity-bearing RPC or writes outside the intended server checks | Migrations granted anonymous/authenticated execution or direct writes; application formerly used public clients for privileged flows | Authorization was split between caller-provided identifiers, broad grants, and optional shared proof fallbacks | Routed account/contact/practice/profile operations through server-only service-role access; removed default proof fallback; added consolidated revokes/grants migration | Static call-path review and security regression tests passed; production privilege migration intentionally not executed | Application fixed; database migration required |
| SEC-005 | Cookie-authenticated mutations lacked consistent CSRF enforcement | Medium | CWE-352 / OWASP A01:2021 | Global proxy and state-changing API routes | A malicious origin causes a signed-in browser to submit an unwanted mutation | Unsafe API methods were rate-limited but did not consistently validate Origin/Referer/Fetch Metadata | SameSite cookies were treated as the only CSRF control | Added exact canonical-origin validation with safe Referer/Fetch Metadata fallback and 64 KiB mutation limit; admin bearer route remains intentionally exempt | Six unit cases passed; local same-origin logout returned 200, cross-origin and missing-origin requests returned 403 | Fixed |
| SEC-006 | Practice reset/state endpoints had weak object scope and input bounds | Medium | CWE-639, CWE-20 / OWASP API1/API4:2023 | Reset, question-state, subtopic-state, report, validation routes | A user changes identifiers, sends malformed IDs, or requests an over-broad exam reset | Reset path did not bind every identifier to selected profile/exam scope; several inputs lacked UUID/size/count bounds | Endpoint-level validation and ownership conditions were incomplete | Added UUID validation, exact selected-exam/profile membership, exam tag scoping, 50-item dedupe/cap, 1,000-character report cap, private no-store responses, and generic production errors | Type/lint suites and practice/security regressions passed; broad direct-delete fallback removed | Fixed |
| SEC-007 | Process-local rate limiting was unbounded and not distributed | Medium | CWE-400 / OWASP API4:2023 | `lib/rateLimit.ts`, global proxy | Attackers vary forwarded IP strings or spread requests across instances to evade limits or grow memory | Baseline stored arbitrary keys indefinitely and used uniform limits; Vercel instances do not share process memory | In-memory limiter was used as if it were a global abuse-control boundary | Sanitized/capped IP keys, bounded storage to 10,000 entries with overflow/pruning, and added route-specific auth/contact/report/submit policies | Unit/static review and runtime 403/429 path checks passed; multi-instance enforcement cannot be proven locally | Partially mitigated; managed distributed limiter required |
| SEC-008 | Browser profiles and cache backups are tracked in Git | Medium | CWE-200, CWE-359 / OWASP A05:2021 | `test-results/` and Git history | A repository reader inspects browser history, cookies, login databases, or local/session storage captured during testing | 3,088 tracked generated files total about 634 MB; 2,972 files in five profile/cache paths include sensitive browser-state filename classes | Generated browser state was not ignored and cleanup was never enforced | Added `test-results/` to `.gitignore`; identified exact removal set without reading or reporting sensitive values | High-confidence secret scan found no confirmed secret; deletion was not performed because explicit approval is required | Prevention fixed; current-tree/history cleanup required |
| SEC-009 | Obsolete Google credential endpoints and provider enumeration remained reachable | Low | CWE-287, CWE-204 / OWASP A07:2021 | Google auth compatibility routes and login response | An attacker uses a secondary login path or distinguishes provider state from response details | Two credential-style compatibility endpoints existed beside the intended PKCE flow; login exposed `useGoogle` state | Legacy compatibility behavior survived the OAuth migration | Production POSTs now return 404; login response no longer exposes provider enumeration; PKCE start/callback remains | OAuth redirect, safe-redirect, auth-source and callback runtime checks passed | Fixed |
| SEC-010 | Sensitive cache coverage and mixed-content defense were incomplete | Low | CWE-525, CWE-693 / OWASP A05:2021 | Next.js headers and sensitive page families | A shared cache retains personalized pages or an insecure subresource is accepted | Cache rules covered selected APIs/pages but omitted several profile/onboarding/exam routes; CSP lacked upgrade instruction | Security headers were defined by narrow route patterns | Expanded private/no-store coverage and added `upgrade-insecure-requests` while preserving required sources | Runtime headers confirmed CSP, frame denial, nosniff, referrer/permissions policy, no production `unsafe-eval`, and private cache rules | Fixed |
| SEC-011 | Stateless long-lived sessions lack central revocation and sensitive-action reauthentication | Medium | CWE-613 / OWASP A07:2021 | `qw_auth` session design and account lifecycle | A stolen still-valid session is replayed after client logout; sensitive changes do not require renewed proof | Signed assertions can remain valid for up to 30 days; logout only clears the browser cookie; no server-side session record, password reset, or email verification flow was found | Session state is entirely stateless and account-recovery/lifecycle controls are incomplete | Cookie attributes and CSRF were verified/hardened; a safe repository-only revocation retrofit would change account/session architecture, so it was not guessed | Manual code-path review; no safe runtime exploit attempt performed | Manual architectural remediation required |

## Detailed findings

### SEC-001 — Critical dependency patch gap

Next 16.2.9 was behind the current 16.3.3 security line while the application uses the affected App Router surface. The initial package audit also reported five High dependency advisories involving Next.js and transitive packages. The fix stayed within the existing major version: Next.js and `eslint-config-next` are exactly pinned to 16.3.3 and the lockfile was regenerated. `sharp` resolved to 0.35.4 and `nanoid` to 3.3.18 through the compatible dependency graph. No broad Supabase major/minor migration was attempted because it was unrelated to an active advisory and could change behavior.

The clean reinstall audited 422 packages with zero known vulnerabilities, registry signatures/attestations verified, lint/type checks passed, and the production build completed with 32 routes. This item is fixed in the repository but production does not receive the protection until the updated build is deployed.

### SEC-002 — High map answer disclosure

The public database surface returned map locations and map question fields that reveal the expected location, tolerance, and explanation. Hiding the fields only in the UI would not solve the problem because PostgREST can be called directly.

The new design has two stages: `GET /api/map-practice/questions` returns display text and an intentionally broad region hint, while `POST /api/map-practice/submit` loads the authoritative row with the service role and computes distance on the server. Exact answer information is returned only after submission. The migration then removes anonymous/authenticated access to both underlying tables. This finding remains open in production until the migration is applied.

### SEC-003 — High legacy answer-key disclosure

Nine legacy subject tables made answer/explanation fields selectable from the browser-facing database API, and legacy server pages used complete rows. The repository now uses a strict subject-to-table allow-list, strips answers from all pre-submit objects, and evaluates option index/language on a server-only submission route. Legacy reads were moved to the privileged server client so public table grants can be removed safely.

The local GET/POST flow passed and did not disclose pre-submit answers. Read-only production probes still returned legacy answer fields, proving that deployment of code alone is insufficient.

### SEC-004 — High database/RPC authorization bypass

Several historical migrations granted anonymous/authenticated clients direct insert/update/table or `SECURITY DEFINER` function execution. Some functions accepted a user UUID supplied by the caller. That architecture allows a direct PostgREST/RPC caller to bypass the cookie identity established by the Next.js server.

Registration, login, Google upsert, contact submission, profile access, and practice progress now cross a server-only service-role boundary. The optional signed-practice fallbacks fail closed and no default proof secret remains. The consolidated migration enables RLS, revokes table privileges, drops broad policies, revokes RPC execution from `PUBLIC`, `anon`, and `authenticated`, and grants only `service_role`. It is idempotent and contains no secret. SQL static review passed, but a live PostgreSQL parser/transaction run was unavailable locally; stage it before production.

### SEC-005 — Medium CSRF gap

The session cookie uses SameSite=Lax, but that is not a complete mutation authorization mechanism. The global proxy now checks unsafe API methods against the canonical configured origin, then uses a valid Referer or Fetch Metadata signal only where appropriate. `same-site` is not accepted as `same-origin`. Invalid/missing evidence fails closed, Vercel preview hosts are supported, and local loopback is allowed outside production. Oversized mutations declared above 64 KiB are rejected before route handling.

The admin revalidation endpoint remains exempt from browser-origin enforcement because it authenticates with a bearer-style secret and is not a cookie-authenticated browser flow.

### SEC-006 — Medium BOLA/input weaknesses

Practice reset previously had a broad fallback and insufficient exam scoping. All relevant IDs now require valid UUID format and the target must belong to the signed-in user's selected profile/exam. The unsafe direct-delete fallback was removed. State/report endpoints gained count, length, dedupe, and cache limits, and production errors no longer expose database details.

These checks preserve the unique first-attempt source of truth: server submission remains the only authoritative progress mutation, and client-supplied answers/IDs cannot directly inflate stored counters.

### SEC-007 — Medium availability/abuse weakness

The in-memory limiter now protects itself from attacker-controlled key growth and gives sensitive routes stricter budgets. This is a meaningful local defense but cannot coordinate across serverless instances, regions, or restarts. Production still needs a managed edge/distributed rate limiter keyed by a trustworthy platform IP signal, with separate account/IP dimensions for login and abuse-sensitive submission routes.

### SEC-008 — Medium repository privacy exposure

The repository contains tracked Chromium profiles/cache backups, including filenames associated with cookies, login databases, history, account data, IndexedDB, and local/session storage. No secret values were printed or included in this report, and the high-confidence scan found no confirmed credential. The exact cleanup set is 2,972 tracked files across:

- `test-results/cache-backups`
- `test-results/lighthouse/chrome-profile`
- `test-results/lighthouse/chrome-profile-final`
- `test-results/lighthouse/chrome-profile-exact-final`
- `test-results/lighthouse/chrome-profile-exact-final-2`

`.gitignore` prevents future additions. Existing current-tree deletion and any Git history rewrite require explicit authorization and coordination; the user's `test-results/performance-audit-2026-08-28` directory and unrelated test evidence must be preserved.

### SEC-011 — Medium session lifecycle gap

The HMAC cookie has appropriate HttpOnly, SameSite, path, expiry, and production Secure behavior, and production requires an explicit signing secret. However, a valid copied token cannot be revoked individually before expiry because the server stores no session record. Client logout removes the cookie but cannot invalidate another copy. The application also lacks verified email/password recovery and reauthentication for sensitive changes.

A robust fix needs a session table or a per-user revocation/version mechanism, session rotation, account recovery policy, and compatibility planning. This should be implemented as a separate migration/feature with user communication rather than silently changing live account behavior during this audit.

## Areas investigated and not found vulnerable

- No high-confidence hardcoded credential, private key, bearer token, Supabase service-role value, or tracked `.env` file was found in current source or the relevant Git history. Environment **names only** were inventoried.
- The service-role key is referenced only in server code; no public-prefix service-role variable was found.
- The modern `questions` answer fields returned 401 to an anonymous production probe, so the newer question bank was not confirmed exposed.
- Anonymous production selects against `users` and `contact_us` returned no rows under RLS; no PII disclosure was confirmed.
- OAuth uses Supabase PKCE/state, callback parameters are cleaned from redirects, and redirect destinations use an allow-list.
- The two `dangerouslySetInnerHTML` uses serialize JSON-LD and escape `<` as `\u003c`; no executable user HTML sink was confirmed.
- No command execution, arbitrary server URL fetch/SSRF feature, upload handler, payment/webhook handler, service worker, or public source-map configuration was found.
- No CI, container, or infrastructure-as-code files existed to test. This is a scope absence, not a passed CI/container assessment.

## Repository changes made for security

The report-time commit also contains unrelated SSC CHSL changes. The following files/groups are the audit-owned security changes:

- Answer confidentiality: `app/api/map-practice/questions/route.ts`, `app/api/map-practice/submit/route.ts`, `app/map-practice/MapPracticePage.tsx`, `app/components/map-practice/MapQuestionPanel.tsx`, `lib/mapPractice.ts`, `app/api/legacy-practice/submit/route.ts`, `lib/legacyQuiz.ts`, `app/subjects/[subject]/[topicSlug]/ClientQuiz.tsx`, `app/[subject]/topics/[topicSlug]/page.tsx`, and `app/question/[...questionSlug]/page.tsx`.
- Server-only database boundary: `lib/userRepository.ts`, `lib/questionLookup.ts`, `lib/practiceServer.ts`, `app/api/contact/route.ts`, `app/api/questions/route.ts`, and `app/api/history/questions/route.ts`; obsolete `lib/practiceProof.ts` was removed.
- Request authorization/availability: `proxy.ts`, `lib/requestSecurity.ts`, `lib/rateLimit.ts`, and practice route handlers under `app/api/practice/` for question state, subtopic state, reset, report, and ID validation.
- Authentication cleanup: `app/api/auth/google/route.ts`, `app/api/auth/google/redirect/route.ts`, and `app/api/auth/login/route.ts`.
- Browser/cache hardening: `next.config.mjs` and `.gitignore`.
- Dependencies/tool compatibility: `package.json`, `package-lock.json`, `components/revision/company-rule-and-early-acts/act-chapters/ActChapterHeader.tsx`, and `scripts/verify-auth-security.mjs`. Next 16.3.3 also generated its version-matched `AGENTS.md` and `CLAUDE.md` developer guidance on the first development start; these files contain no application data or secret.
- Regression coverage: `lib/requestSecurity.test.ts` and `lib/securityRegression.test.ts`.
- Database hardening: `scripts/migrate_security_hardening_20260828.sql` plus the user/contact/map/practice/profile SQL scripts updated to use least-privilege defaults and generated secrets where legacy signed functions remain.

## Automated and runtime verification

| Check | Exact result |
|---|---|
| Clean install (`npm ci`) | PASS — 421 packages installed; 422 packages audited; 0 vulnerabilities |
| Dependency audit | PASS — 0 Critical, High, Moderate, or Low known vulnerabilities |
| Registry integrity | PASS — 421 registry signatures and 80 attestations verified |
| TypeScript (`npm run typecheck`) | PASS |
| ESLint (`npm run lint -- --max-warnings=0`) | PASS |
| Request-security unit tests | PASS — 6/6 |
| Security regressions | PASS — 4/4 (legacy projection/submission, map scoring/projection, migration revokes) |
| Auth/security units | PASS — 8/8 |
| Safe redirects | PASS — 3/3 |
| Public-origin units | PASS — 7/7 |
| OAuth redirect units | PASS — 7/7 |
| Question-source validation | PASS — 18/18 |
| Profile overview/insights/activity/saved/goals | PASS — 8/8, 7/7, 16/16, 14/14, 15/15 |
| Exam onboarding/preferences/learning; SSC CGL/CHSL; quality announcement | PASS — all repository suites |
| Cache privacy | PASS — 4/4 |
| Production build | PASS — 32 application routes; initial sandbox-only attempt was blocked by Google Fonts network access, network-enabled rerun passed |
| Launch baseline and soft-404 routing | PASS — public routes, sensitive cache rules, answer projection, and tested route behavior |
| Runtime auth callback | PASS — callback redirected without query leakage and returned `no-store`; source checks passed |
| Runtime CSRF | PASS — same-origin mutation 200; cross-origin and missing-origin 403 |
| Runtime map/legacy APIs | PASS — question GETs had no answer fields; submissions were evaluated server-side; responses were `no-store` |
| Runtime headers | PASS — CSP, `upgrade-insecure-requests`, frame denial, nosniff, referrer/permissions policy; no production `unsafe-eval` |
| Secret/history scan | PASS with limitation — 0 high-confidence secrets and 0 tracked env files found; generated browser-profile cleanup remains |
| Static dangerous-pattern scan | PASS — no weak fallback secret or process execution; JSON-LD sinks manually validated |
| SQL migration static review | PASS — idempotent object checks and required revokes present |
| SQL execution in local/staging PostgreSQL | NOT RUN — neither `psql` nor Supabase CLI/local database was available |
| Production database remediation | NOT RUN — production inspection was read-only by instruction |

No skipped check is represented as a pass. Runtime tests used an ephemeral process-only local signing secret; it was neither printed nor written to disk.

## Dependency and supply-chain notes

- `next` and `eslint-config-next`: 16.2.9 to exact 16.3.3. This is a same-major security patch update.
- Compatible transitive audit fixes were captured in `package-lock.json`; final audit is clean.
- `@supabase/ssr` was not blindly upgraded from 0.6.x to the newer 0.12.x line because no active advisory required it and behavior may be breaking. Plan that upgrade separately.
- Clean install emitted an npm `allowScripts` warning for `unrs-resolver`; package/signature checks passed, but postinstall policy should be explicitly reviewed before tightening lifecycle-script enforcement.
- `@react-leaflet/core` carries a Hippocratic-2.1 license in the resolved tree. This is a legal/product-policy review item, not a confirmed security vulnerability.
- The lockfile is present and `npm ci` succeeds, providing reproducible resolution for this revision.

## Database migration and exact deployment order

Migration: `scripts/migrate_security_hardening_20260828.sql`

1. In staging, confirm `AUTH_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, canonical HTTPS `NEXT_PUBLIC_SITE_URL`, Supabase URL, and public anon key are present in the correct server/public scopes. Do not log their values.
2. Take a current Supabase backup and export existing grants/policies/function definitions. Run the migration in staging and execute the smoke tests below.
3. Deploy the matching Next.js code (including Next 16.3.3 and the server-side map/legacy submission routes). Verify the deployment has the server-only service-role variable before sending traffic.
4. **Immediately in the same maintenance window**, run `scripts/migrate_security_hardening_20260828.sql` in the production Supabase SQL Editor. Code must precede the privilege revokes because the old application still relies on public clients for some flows.
5. Verify anonymous selects for `map_locations`, `map_questions`, all nine legacy question tables, `users`, and `contact_us` are denied or return no authorized data. Verify anonymous/authenticated execution of the listed identity-bearing RPCs is denied.
6. Smoke-test map question/submit, legacy question/submit, email and Google login, registration, logout, contact, onboarding/profile preferences, practice answer/progress/reset/report, and dashboard rendering with test accounts.
7. Monitor application 5xx/403/429 rates and Supabase authorization errors for at least one normal traffic cycle. If a regression appears, roll back application code only with a reviewed least-privilege database compatibility plan; do not restore broad public grants as an emergency shortcut.

## Manual actions and blockers

1. **Blocking:** stage and apply `scripts/migrate_security_hardening_20260828.sql` in the order above. Until then, the production answer-table exposure remains.
2. **Blocking for repository privacy closure:** authorize removal of the 2,972 identified tracked browser-profile/cache files while preserving other test evidence. Coordinate a history rewrite only after every collaborator clones/backups and force-push implications are accepted.
3. Configure a managed distributed edge/data-store rate limiter or WAF. Use trusted platform IP metadata and combine per-IP with per-account controls for login and submission routes.
4. Design server-side session revocation/rotation, verified email/password recovery, and reauthentication for sensitive account changes. Shorten the current session lifetime if product requirements permit.
5. Refactor CSP toward nonce/hash-based scripts to remove production `unsafe-inline`. Next.js requires careful dynamic rendering/caching validation, so this was not forced during the audit.
6. Execute the SQL migration and verification script against a staging database; local static inspection is not a PostgreSQL parser/runtime test.
7. Add CI gates for clean install, audit, signatures, typecheck, lint, security regressions, build, secret scanning, migration testing, and generated-artifact checks.

## Secret rotation guidance

No confirmed committed application secret was found, so there is **no unconditional secret-rotation requirement** from this audit.

- If any tracked Chrome profile was captured while authenticated against production, rotate `AUTH_SECRET` in the hosting dashboard and redeploy to invalidate all stateless application sessions; notify users that re-login is required. Revoke any third-party OAuth sessions shown by the provider's security console.
- Rotate `SUPABASE_SERVICE_ROLE_KEY` only if repository access review, deployment logs, or incident evidence indicates exposure. Update the server-only hosting variable and redeploy atomically; never place it under `NEXT_PUBLIC_*`.
- Independently rotate all relevant credentials and investigate access logs if compromise indicators are found. Never commit replacement values.

## Remaining risks and unverified areas

- Production retains the confirmed direct answer-table exposure until the migration is applied.
- The SQL was not executed locally or in staging/production during this audit.
- Process-local rate limiting remains bypassable across instances; forwarded-IP trust depends on the hosting platform.
- Stolen stateless sessions remain replayable until expiry or a global `AUTH_SECRET` rotation.
- Production CSP still requires `unsafe-inline` for the current Next/Google integration; `unsafe-eval` is development-only.
- Browser-profile artifacts remain in the current Git tree/history pending authorization.
- No authenticated two-user production BOLA testing was performed; repository-level ownership checks and local tests were used instead.
- No DAST scanner or destructive/adversarial production testing was run. No upload/payment/webhook/container/CI implementation existed to assess.
- Logs, alerts, backups, hosting environment separation, Supabase dashboard settings, and incident runbooks require dashboard/operator verification.

## Monitoring and incident response recommendations

- Alert on bursts of 401/403/429, repeated login failures, unusual map/legacy submit volume, report/contact spam, and Supabase permission-denied or schema errors after migration.
- Track authentication events by privacy-preserving request/account identifiers; never log passwords, cookies, authorization headers, raw OAuth codes, service keys, or full contact/report bodies.
- Monitor impossible session reuse patterns and support forced per-user/global logout once revocation exists.
- Enable Supabase and hosting audit-log retention appropriate to policy; restrict dashboard access with SSO/MFA and least privilege.
- Document owners and procedures for dependency Critical advisories, secret rotation, database grant rollback, session invalidation, and repository-history cleanup.
- Run quarterly authorization/DB-grant reviews and add regression probes that confirm answer fields remain inaccessible before submission and directly through PostgREST.

## Final release recommendation

**Safe after listed manual actions.** The repository-level build is ready for a coordinated deployment, but the website must not be declared remediated until the matching Supabase migration is staged and applied immediately after the code deployment. The tracked browser artifacts should also be removed before treating the repository privacy finding as closed. There is no confirmed secret that must be rotated unconditionally.

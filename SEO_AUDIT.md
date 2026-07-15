# SEO Audit — QuestionWale

**Date:** 2026-07-15  
**Note:** This does **not** claim or guarantee Google rankings.

## Indexation strategy

| Class | Routes | Implementation |
|-------|--------|----------------|
| INDEX | `/`, populated `/subjects/*` catalog pages, published revision/learning pages, trust pages | Default robots index |
| CONDITIONAL | Substantial public revision/learning pages | Prefer original content + citations |
| NOINDEX | `/login`, `/signup`, `/dashboard`, `/profile`, practice sessions, APIs, examples | Meta robots + robots.txt disallow where appropriate |
| PREVIEW | Vercel preview / localhost / `QW_FORCE_NOINDEX` | Site-wide noindex via `lib/seo.ts` + `app/robots.ts` |

## Critical / high SEO issues

| Issue | Status |
|-------|--------|
| `acceptedAnswer` in public JSON-LD | **Fixed** |
| Dashboard / profile indexable | **Fixed** (`noIndex: true`) |
| Login / signup only robots-disallow, still meta-indexable | **Fixed** (meta noindex) |
| Sitemap advertised noindex practice URLs | **Fixed** (removed from `lib/sitemapCatalog.ts`) |
| Preview deployments could inherit production canonical + index | **Fixed** (`isNonProductionDeployment`) |
| Fake SearchAction (`/?search=`) on homepage | **Fixed** (removed) |
| Thin/empty catalog pages in sitemap | **Fixed** (requires questions or a published revision) |
| Individual answer-gated question URLs indexable | **Fixed** (`noindex,follow`; omitted from sitemap) |
| Hard-coded homepage question totals | **Fixed** (database aggregates + automatic count triggers) |

## Canonicals & hostname

- `metadataBase` / `BASE_URL` from `NEXT_PUBLIC_SITE_URL` (default `https://questionwale.com`)
- Self-referencing canonicals via `canonical()` / `buildPageMetadata`
- Practice rewrite keeps public URL form in metadata

## Sources & crawlability

- Topic 2: URLs parsed from `questions.source` text
- Topic 3: `source_metadata.primary_sources` / `secondary_sources` preferred
- Practice explanations remain answer-gated (correct)
- Published revision pages render semantic server-side `<a href>` source links without exposing answer keys
- Practice remains `noindex`; gated explanations are intentionally not used as SEO content

## Remaining SEO work

- Consolidate dual subject hubs (`/history` vs `/subjects/...`) with permanent redirects where equivalent
- Continue publishing substantial subtopic **revision** pages (not thin MCQ copies)
- Optionally expand sitemap with carefully chosen indexable learning URLs (never dump thin MCQ shells)
- No hreflang — bilingual is same-URL UI toggle (do not invent fake alternates)

## Google Search Console (manual)

1. Verify `https://questionwale.com` (or chosen www canonical).
2. Submit `https://questionwale.com/sitemap.xml`.
3. Inspect representative subject + topic URLs.
4. Confirm practice / dashboard URLs report noindex.
5. Monitor Coverage / Enhancements; remove any structured-data warnings for Fake ratings (none should be present).

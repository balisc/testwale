/**
 * Pure, server-safe parser for `questions.source` display strings.
 * Never invents URLs. Strips internal audit metadata from student-facing output.
 */

export type DisplayQuestionSource = {
  title: string;
  url?: string;
  hostname?: string;
  kind: 'official' | 'reference';
  locator?: string;
};

const EXPLICIT_OFFICIAL_HOSTS = new Set([
  'legislative.gov.in',
  'indiacode.nic.in',
  'mha.gov.in',
  'sansad.in',
  'sci.gov.in',
  'eci.gov.in',
  'ncert.nic.in',
  'epathshala.nic.in',
  'nios.ac.in',
]);

/** Audit / internal segments — never shown to students. */
const AUDIT_SEGMENT_RE =
  /\b(?:Evidence record|Verification date|Confidence|Current-position check)\s*:\s*[^;|]*/gi;

const LEADING_PREFIX_RE =
  /^(?:QuestionWale\s+Original\s*(?:\||$)\s*)?(?:Verified\s+with\s*:|Verified\s*:|Based\s+on\s*:)?\s*/i;

/** Captures https URLs, including those wrapped in parentheses with optional labels. */
const URL_IN_TEXT_RE =
  /(?:\(\s*(?:official\s+(?:PDF|portal)\s*:?\s*)?)?(https:\/\/[^\s)<>"']+)(?:\s*\))?/gi;

const TRAILING_URL_PUNCT_RE = /[),.…;:!?]+$/g;
const PDF_PAGE_RE = /\b(?:p|pp|page|pages)\.?\s*\d+\b/gi;
const LOCATOR_RE =
  /\b((?:Article|Articles|Section|Sections|Schedule|Schedules)\s+[\dA-Za-z()./-]+(?:\s*\([^)]+\))?)/i;

function isOfficialHostname(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^www\./, '');
  if (EXPLICIT_OFFICIAL_HOSTS.has(host)) return true;
  if (host.endsWith('.gov.in') || host.endsWith('.nic.in')) return true;
  // Recognise nested official hosts listed without www
  for (const allowed of EXPLICIT_OFFICIAL_HOSTS) {
    if (host === allowed || host.endsWith(`.${allowed}`)) return true;
  }
  return false;
}

function normalizeUrlKey(url: string): string {
  try {
    const u = new URL(url);
    u.hash = '';
    let path = u.pathname;
    if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1);
    u.pathname = path;
    return u.toString().toLowerCase();
  } catch {
    return url.trim().toLowerCase();
  }
}

/**
 * Accept only safe https URLs. Rejects javascript:/data:/file: and non-https.
 */
export function sanitizeHttpsUrl(raw: string | null | undefined): string | undefined {
  if (!raw) return undefined;
  let candidate = String(raw).trim();
  candidate = candidate.replace(TRAILING_URL_PUNCT_RE, '');
  // Strip wrapping parentheses left over
  if (candidate.startsWith('(') && candidate.endsWith(')')) {
    candidate = candidate.slice(1, -1).trim();
  }
  candidate = candidate.replace(TRAILING_URL_PUNCT_RE, '');

  const lower = candidate.toLowerCase();
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('data:') ||
    lower.startsWith('file:') ||
    lower.startsWith('vbscript:')
  ) {
    return undefined;
  }

  if (!/^https:\/\//i.test(candidate)) return undefined;

  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== 'https:') return undefined;
    if (!parsed.hostname) return undefined;
    return parsed.toString();
  } catch {
    return undefined;
  }
}

function cleanTitle(raw: string): string {
  let title = raw
    .replace(URL_IN_TEXT_RE, ' ')
    .replace(/\(\s*(?:official\s+(?:PDF|portal)\s*:?\s*)?\s*\)/gi, ' ')
    .replace(/\b(?:official\s+(?:PDF|portal)|official consolidated text)\b/gi, ' ')
    .replace(PDF_PAGE_RE, ' ')
    .replace(/[|]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .replace(/^[\s,;:.\-–—]+|[\s,;:.\-–—]+$/g, '')
    .trim();

  // Drop leftover empty paren pairs
  title = title.replace(/\(\s*\)/g, '').replace(/\s{2,}/g, ' ').trim();
  return title;
}

function extractLocator(title: string): string | undefined {
  const withoutPages = title.replace(PDF_PAGE_RE, ' ').trim();
  const match = withoutPages.match(LOCATOR_RE);
  if (!match?.[1]) return undefined;
  const locator = match[1].trim();
  // Avoid echoing the entire title when the title IS only the locator
  return locator || undefined;
}

function stripAuditAndPrefixes(input: string): string {
  let text = input.replace(AUDIT_SEGMENT_RE, ' ');
  // Remove standalone "QuestionWale Original" tokens anywhere at start of pipe segments
  text = text
    .split('|')
    .map((part) => part.replace(LEADING_PREFIX_RE, '').trim())
    .filter(Boolean)
    .join('; ');
  text = text.replace(LEADING_PREFIX_RE, '').trim();
  return text.replace(/\s{2,}/g, ' ').replace(/;\s*;+/g, ';').trim();
}

type UrlHit = { url: string; index: number; length: number };

function findHttpsUrls(text: string): UrlHit[] {
  const hits: UrlHit[] = [];
  const re = /https:\/\/[^\s)<>"']+/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    const sanitized = sanitizeHttpsUrl(match[0]);
    if (!sanitized) continue;
    hits.push({ url: sanitized, index: match.index, length: match[0].length });
  }
  return hits;
}

function titleNearUrl(text: string, urlIndex: number, prevEnd: number): string {
  const before = text.slice(prevEnd, urlIndex);
  return cleanTitle(before);
}

function hostnameOf(url: string): string | undefined {
  try {
    return new URL(url).hostname.replace(/^www\./i, '');
  } catch {
    return undefined;
  }
}

function pushSource(
  list: DisplayQuestionSource[],
  seenUrls: Set<string>,
  seenTitles: Set<string>,
  partial: Omit<DisplayQuestionSource, 'kind'> & { kind?: DisplayQuestionSource['kind'] },
) {
  const title = partial.title.trim();
  if (!title && !partial.url) return;

  if (partial.url) {
    const key = normalizeUrlKey(partial.url);
    if (seenUrls.has(key)) return;
    seenUrls.add(key);
  } else {
    const titleKey = title.toLowerCase();
    if (!titleKey || seenTitles.has(titleKey)) return;
    seenTitles.add(titleKey);
  }

  const host = partial.hostname ?? (partial.url ? hostnameOf(partial.url) : undefined);
  const kind: DisplayQuestionSource['kind'] =
    partial.kind ??
    (partial.url && host && isOfficialHostname(host) ? 'official' : 'reference');

  const displayTitle =
    title ||
    (host ? host : 'Reference document');

  list.push({
    title: displayTitle,
    url: partial.url,
    hostname: host,
    kind,
    locator: partial.locator,
  });
}

/**
 * Parse a raw `questions.source` string into student-safe display sources.
 * Fail-safe: never throws; returns [] on empty/malformed input.
 */
export function parseQuestionSources(
  source: string | null | undefined,
): DisplayQuestionSource[] {
  try {
    if (source == null) return [];
    const raw = String(source).trim();
    if (!raw) return [];

    const cleaned = stripAuditAndPrefixes(raw);
    if (!cleaned) return [];

    const results: DisplayQuestionSource[] = [];
    const seenUrls = new Set<string>();
    const seenTitles = new Set<string>();

    // Work segment-by-segment on `;` (primary) with fallback commas only when no URLs in whole string
    const segments = cleaned
      .split(';')
      .map((s) => s.trim())
      .filter(Boolean);

    const workSegments = segments.length > 0 ? segments : [cleaned];

    for (const segment of workSegments) {
      const urls = findHttpsUrls(segment);
      if (urls.length === 0) {
        const title = cleanTitle(segment);
        if (!title) continue;
        // Skip leftover prefix crumbs
        if (/^(verified|based on|questionwale)/i.test(title) && title.length < 24) continue;
        const locator = extractLocator(title);
        pushSource(results, seenUrls, seenTitles, {
          title,
          kind: 'reference',
          locator,
        });
        continue;
      }

      let prevEnd = 0;
      for (const hit of urls) {
        let title = titleNearUrl(segment, hit.index, prevEnd);
        prevEnd = hit.index + hit.length;
        const host = hostnameOf(hit.url);
        if (!title) {
          title = host ? host : 'Official document';
        }
        const locator = extractLocator(title);
        pushSource(results, seenUrls, seenTitles, {
          title,
          url: hit.url,
          hostname: host,
          locator,
        });
      }

      // Trailing reference text after last URL in the segment
      const trailing = cleanTitle(segment.slice(prevEnd));
      if (trailing && trailing.length > 2) {
        pushSource(results, seenUrls, seenTitles, {
          title: trailing,
          kind: 'reference',
          locator: extractLocator(trailing),
        });
      }
    }

    // Bare-string case: entire cleaned text was one URL already handled via segments
    if (results.length === 0) {
      const onlyUrl = sanitizeHttpsUrl(cleaned);
      if (onlyUrl) {
        const host = hostnameOf(onlyUrl);
        pushSource(results, seenUrls, seenTitles, {
          title: host ?? 'Official document',
          url: onlyUrl,
          hostname: host,
        });
      }
    }

    return results;
  } catch {
    return [];
  }
}

/** True when at least one parsed source is an official https link. */
export function hasOfficialParsedSource(source: string | null | undefined): boolean {
  return parseQuestionSources(source).some((item) => item.kind === 'official' && Boolean(item.url));
}

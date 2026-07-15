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
  institution?: string;
  citation?: string | null;
  type?: 'primary' | 'secondary';
};

/** Normalized list entry combining primary_sources + secondary_sources. */
export type NormalizedVerifiedSource = {
  title: string;
  institution?: string;
  url?: string;
  citation?: string | null;
  type: 'primary' | 'secondary';
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

/** Captures http(s) URLs, including those wrapped in parentheses with optional labels. */
const URL_IN_TEXT_RE =
  /(?:\(\s*(?:official\s+(?:PDF|portal)\s*:?\s*)?)?(https?:\/\/[^\s)<>"']+)(?:\s*\))?/gi;


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
 * Accept safe http(s) URLs for source links.
 * Prefer https; allow http only for genuinely old official resources.
 * Rejects javascript:/data:/file: and other schemes.
 */
export function sanitizeSourceUrl(raw: string | null | undefined): string | undefined {
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

  if (!/^https?:\/\//i.test(candidate)) return undefined;

  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return undefined;
    if (!parsed.hostname) return undefined;
    return parsed.toString();
  } catch {
    return undefined;
  }
}

/** @deprecated Prefer sanitizeSourceUrl — kept for callers that historically expected https-only. */
export function sanitizeHttpsUrl(raw: string | null | undefined): string | undefined {
  const sanitized = sanitizeSourceUrl(raw);
  if (!sanitized) return undefined;
  try {
    const parsed = new URL(sanitized);
    if (parsed.protocol !== 'https:') return undefined;
    return sanitized;
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
  const re = /https?:\/\/[^\s)<>"']+/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    const sanitized = sanitizeSourceUrl(match[0]);
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
      const onlyUrl = sanitizeSourceUrl(cleaned);
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

/** True when at least one parsed source is an official https(s) link. */
export function hasOfficialParsedSource(source: string | null | undefined): boolean {
  return parseQuestionSources(source).some((item) => item.kind === 'official' && Boolean(item.url));
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function optionalTrimmedString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function optionalCitation(value: unknown): string | null | undefined {
  if (value === null) return null;
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function parseVerifiedSourceEntry(value: unknown): {
  title?: string;
  institution?: string;
  url?: string;
  citation?: string | null;
} | null {
  if (!isPlainRecord(value)) return null;
  return {
    title: optionalTrimmedString(value.title),
    institution: optionalTrimmedString(value.institution),
    url: optionalTrimmedString(value.url),
    citation: optionalCitation(value.citation),
  };
}

function parseVerifiedSourceList(value: unknown): Array<{
  title?: string;
  institution?: string;
  url?: string;
  citation?: string | null;
}> {
  if (!Array.isArray(value)) return [];
  const out: Array<{
    title?: string;
    institution?: string;
    url?: string;
    citation?: string | null;
  }> = [];
  for (const entry of value) {
    const parsed = parseVerifiedSourceEntry(entry);
    if (parsed) out.push(parsed);
  }
  return out;
}

/**
 * Safely parse questions.source_metadata when JSONB arrives as object, JSON string, or null.
 * Never throws; strips internal-only fields from the returned shape.
 */
export function parseSourceMetadata(raw: unknown): {
  primary_sources: Array<{
    title?: string;
    institution?: string;
    url?: string;
    citation?: string | null;
  }>;
  secondary_sources: Array<{
    title?: string;
    institution?: string;
    url?: string;
    citation?: string | null;
  }>;
  evidence_locator?: string;
} | null {
  try {
    let value: unknown = raw;
    if (value == null) return null;
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) return null;
      value = JSON.parse(trimmed) as unknown;
    }
    if (!isPlainRecord(value)) return null;

    const primary_sources = parseVerifiedSourceList(value.primary_sources);
    const secondary_sources = parseVerifiedSourceList(value.secondary_sources);
    const evidence_locator = optionalTrimmedString(value.evidence_locator);

    if (primary_sources.length === 0 && secondary_sources.length === 0 && !evidence_locator) {
      return null;
    }

    return {
      primary_sources,
      secondary_sources,
      ...(evidence_locator ? { evidence_locator } : {}),
    };
  } catch {
    return null;
  }
}

/**
 * Combine primary_sources + secondary_sources into one deduped normalized list.
 * Invalid URLs are dropped; entries without title+url are skipped.
 */
export function normalizeStructuredSources(rawMetadata: unknown): NormalizedVerifiedSource[] {
  const parsed = parseSourceMetadata(rawMetadata);
  if (!parsed) return [];

  const results: NormalizedVerifiedSource[] = [];
  const seenUrls = new Set<string>();
  const seenTitles = new Set<string>();

  const push = (
    entry: {
      title?: string;
      institution?: string;
      url?: string;
      citation?: string | null;
    },
    type: 'primary' | 'secondary',
  ) => {
    const url = sanitizeSourceUrl(entry.url);
    const title =
      (entry.title?.trim() ||
        entry.institution?.trim() ||
        (url ? hostnameOf(url) : undefined) ||
        '') ?? '';
    const institution = entry.institution?.trim() || undefined;
    const citation =
      entry.citation === null || entry.citation === undefined
        ? entry.citation
        : entry.citation.trim() || null;

    if (!title && !url) return;

    if (url) {
      const key = normalizeUrlKey(url);
      if (seenUrls.has(key)) return;
      seenUrls.add(key);
    } else {
      const titleKey = title.toLowerCase();
      if (!titleKey || seenTitles.has(titleKey)) return;
      seenTitles.add(titleKey);
    }

    results.push({
      title: title || (url ? hostnameOf(url) ?? 'Official source' : 'Reference'),
      ...(institution ? { institution } : {}),
      ...(url ? { url } : {}),
      citation: citation ?? null,
      type,
    });
  };

  for (const entry of parsed.primary_sources) push(entry, 'primary');
  for (const entry of parsed.secondary_sources) push(entry, 'secondary');

  return results;
}

function structuredToDisplay(
  sources: NormalizedVerifiedSource[],
  evidenceLocator?: string,
): DisplayQuestionSource[] {
  return sources.map((item, index) => {
    const host = item.url ? hostnameOf(item.url) : undefined;
    const kind: DisplayQuestionSource['kind'] =
      item.type === 'primary' && item.url
        ? 'official'
        : item.url && host && isOfficialHostname(host)
          ? 'official'
          : 'reference';

    return {
      title: item.title,
      url: item.url,
      hostname: host,
      kind,
      institution: item.institution,
      citation: item.citation,
      type: item.type,
      // Attach evidence_locator once on the first card when useful
      locator:
        index === 0 && evidenceLocator && evidenceLocator.trim()
          ? evidenceLocator.trim()
          : undefined,
    };
  });
}

export type ResolveDisplaySourcesResult = {
  items: DisplayQuestionSource[];
  hasSourceMetadata: boolean;
  primarySourceCount: number;
  secondarySourceCount: number;
  usedStructured: boolean;
};

/**
 * Preferred rendering:
 * A) valid structured source_metadata → primary then secondary (no legacy URL extract)
 * B) otherwise → legacy Topic 2 source-text URL extraction
 */
export function resolveDisplaySources(
  source: string | null | undefined,
  sourceMetadata: unknown,
): ResolveDisplaySourcesResult {
  const parsedMeta = parseSourceMetadata(sourceMetadata);
  const primarySourceCount = parsedMeta?.primary_sources.length ?? 0;
  const secondarySourceCount = parsedMeta?.secondary_sources.length ?? 0;
  const hasSourceMetadata = Boolean(parsedMeta);

  const structured = normalizeStructuredSources(sourceMetadata);
  if (structured.length > 0) {
    return {
      items: structuredToDisplay(structured, parsedMeta?.evidence_locator),
      hasSourceMetadata,
      primarySourceCount,
      secondarySourceCount,
      usedStructured: true,
    };
  }

  return {
    items: parseQuestionSources(source),
    hasSourceMetadata,
    primarySourceCount,
    secondarySourceCount,
    usedStructured: false,
  };
}

/** True when resolved sources include at least one official clickable link. */
export function hasOfficialDisplaySource(
  source: string | null | undefined,
  sourceMetadata?: unknown,
): boolean {
  return resolveDisplaySources(source, sourceMetadata).items.some(
    (item) => item.kind === 'official' && Boolean(item.url),
  );
}

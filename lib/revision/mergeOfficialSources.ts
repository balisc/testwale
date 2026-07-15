import {
  resolveDisplaySources,
  sanitizeSourceUrl,
} from '@/lib/questions/parseQuestionSources';
import type { RevisionOfficialSource } from '@/lib/revision/types';

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

function descriptiveTitle(source: {
  title?: string;
  institution?: string;
  url: string;
}): string {
  const title = source.title?.trim();
  if (title) {
    if (source.institution?.trim() && !title.toLowerCase().includes(source.institution.toLowerCase())) {
      return `${title} — ${source.institution.trim()}`;
    }
    return title;
  }
  if (source.institution?.trim()) return source.institution.trim();
  try {
    return new URL(source.url).hostname.replace(/^www\./i, '');
  } catch {
    return 'Official source';
  }
}

/**
 * Deduplicate curated + question-bank sources by URL.
 * Accepts only safe http/https URLs. Strips internal audit fields via parsers.
 */
export function mergeOfficialSources(options: {
  curated: RevisionOfficialSource[];
  questionRows?: Array<{ source?: string | null; source_metadata?: unknown }>;
}): RevisionOfficialSource[] {
  const out: RevisionOfficialSource[] = [];
  const seen = new Set<string>();

  const push = (partial: {
    title?: string;
    institution?: string;
    url?: string | null;
    citation?: string | null;
  }) => {
    const url = sanitizeSourceUrl(partial.url);
    if (!url) return;
    const key = normalizeUrlKey(url);
    if (seen.has(key)) return;
    seen.add(key);

    out.push({
      title: descriptiveTitle({ title: partial.title, institution: partial.institution, url }),
      url,
      ...(partial.institution?.trim() ? { institution: partial.institution.trim() } : {}),
      citation:
        partial.citation === undefined || partial.citation === null
          ? partial.citation ?? null
          : partial.citation.trim() || null,
    });
  };

  for (const item of options.curated) {
    push(item);
  }

  for (const row of options.questionRows ?? []) {
    const resolved = resolveDisplaySources(row.source, row.source_metadata);
    for (const item of resolved.items) {
      if (!item.url) continue;
      push({
        title: item.title,
        institution: item.institution,
        url: item.url,
        citation: item.citation ?? null,
      });
    }
  }

  return out;
}

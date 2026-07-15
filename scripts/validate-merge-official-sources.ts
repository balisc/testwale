/**
 * Lightweight validation for mergeOfficialSources (self-contained for node --experimental-strip-types).
 * Run: node --experimental-strip-types scripts/validate-merge-official-sources.ts
 */
import {
  resolveDisplaySources,
  sanitizeSourceUrl,
} from '../lib/questions/parseQuestionSources.ts';

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

type Official = { title: string; url: string; institution?: string; citation?: string | null };

function mergeOfficialSources(options: {
  curated: Official[];
  questionRows?: Array<{ source?: string | null; source_metadata?: unknown }>;
}): Official[] {
  const out: Official[] = [];
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
      title: partial.title?.trim() || partial.institution?.trim() || url,
      url,
      ...(partial.institution?.trim() ? { institution: partial.institution.trim() } : {}),
      citation: partial.citation ?? null,
    });
  };
  for (const item of options.curated) push(item);
  for (const row of options.questionRows ?? []) {
    for (const item of resolveDisplaySources(row.source, row.source_metadata).items) {
      if (!item.url) continue;
      push(item);
    }
  }
  return out;
}

let passed = 0;
let failed = 0;

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

function test(name: string, fn: () => void) {
  try {
    fn();
    passed += 1;
    console.log(`PASS  ${name}`);
  } catch (error) {
    failed += 1;
    console.log(`FAIL  ${name} — ${error instanceof Error ? error.message : String(error)}`);
  }
}

test('dedupes URL variants and drops unsafe schemes', () => {
  const merged = mergeOfficialSources({
    curated: [
      {
        title: 'Constitution diglot',
        url: 'https://www.legislative.gov.in/static/uploads/2025/07/example.pdf',
        institution: 'Legislative Department',
      },
      {
        title: 'Duplicate same URL with slash',
        url: 'https://www.legislative.gov.in/static/uploads/2025/07/example.pdf/',
      },
      { title: 'Bad scheme', url: 'javascript:alert(1)' },
      { title: 'Malformed', url: 'not-a-url' },
    ],
    questionRows: [
      {
        source: null,
        source_metadata: {
          originality_note: 'internal-only',
          confidence: 'high',
          primary_sources: [
            {
              title: 'Constitution diglot from bank',
              url: 'https://www.legislative.gov.in/static/uploads/2025/07/example.pdf',
            },
            {
              title: 'NCERT Class XI',
              url: 'https://ncert.nic.in/textbook/pdf/keps201.pdf',
            },
          ],
          secondary_sources: [],
        },
      },
      {
        source:
          'Verified with: NCERT portal (official PDF: https://ncert.nic.in/textbook/pdf/iess402.pdf)',
        source_metadata: null,
      },
    ],
  });

  assert(merged.length === 3, `expected 3 sources, got ${merged.length}`);
  assert(merged.every((item) => /^https?:\/\//i.test(item.url)), 'only http(s)');
  const blob = JSON.stringify(merged);
  assert(!blob.includes('originality_note'), 'no originality_note');
  assert(!blob.includes('"confidence"'), 'no confidence');
});

test('structured metadata preferred over legacy on same row', () => {
  const merged = mergeOfficialSources({
    curated: [],
    questionRows: [
      {
        source: 'Legacy only https://example.com/legacy.pdf',
        source_metadata: {
          primary_sources: [
            { title: 'Structured win', url: 'https://ncert.nic.in/textbook/pdf/keps201.pdf' },
          ],
        },
      },
    ],
  });
  assert(merged.length === 1, 'one URL');
  assert(merged[0]?.url.includes('ncert.nic.in'), 'structured wins');
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);

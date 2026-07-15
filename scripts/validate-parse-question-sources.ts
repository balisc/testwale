/**
 * Lightweight validation for parseQuestionSources (no test framework required).
 * Run: node --experimental-strip-types scripts/validate-parse-question-sources.ts
 */
import {
  hasOfficialParsedSource,
  normalizeStructuredSources,
  parseQuestionSources,
  parseSourceMetadata,
  resolveDisplaySources,
  sanitizeHttpsUrl,
  sanitizeSourceUrl,
} from '../lib/questions/parseQuestionSources.ts';

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

const NEW_DETAILED =
  'QuestionWale Original | Verified with: Ministry of Home Affairs, Citizenship Act, 1955, official consolidated text (https://www.mha.gov.in/sites/default/files/CitizenshipAct1955.pdf); India Code, Citizenship Act, 1955 (https://www.indiacode.nic.in/handle/123456789/1522); Evidence record: Citizenship Act, Section 3(1)(c), official PDF p. 3; Verification date: 2026-07-13; Confidence: high; Current-position check: still current';

const OLD_VERIFIED =
  'QuestionWale Original | Verified: NIOS Social Science, Lesson 15 (official PDF: https://www.nios.ac.in/media/documents/SecSocSciCour/English/Lesson-15.pdf); Constitution of India (official portal: https://legislative.gov.in/constitution-of-india); additional internal note';

const BASED_ON =
  'QuestionWale Original | Based on: Constitution of India; NCERT Class 11; M. Laxmikanth Indian Polity';

const TOPIC3_METADATA = {
  primary_sources: [
    {
      title: 'Constitution of India',
      institution: 'Ministry of Law and Justice',
      url: 'https://legislative.gov.in/constitution-of-india',
      citation: 'Preamble',
    },
  ],
  secondary_sources: [
    {
      title: 'NCERT Class 11',
      institution: 'NCERT',
      url: 'https://ncert.nic.in/textbook.php',
      citation: null,
    },
  ],
  evidence_locator: 'Preamble, first paragraph',
  confidence: 'high',
  relevance_note: 'internal — must not show',
};

test('1. New Verified with: two official URLs + audit stripped', () => {
  const items = parseQuestionSources(NEW_DETAILED);
  assert(items.length >= 2, `expected >=2 items, got ${items.length}`);
  assert(
    items.every((i) => !/evidence|confidence|verification date|current-position/i.test(i.title)),
    'audit fields leaked into title',
  );
  assert(items.filter((i) => i.url).length >= 2, 'expected two URLs');
  assert(items.some((i) => i.hostname?.includes('mha.gov.in')), 'mha missing');
  assert(items.some((i) => i.hostname?.includes('indiacode.nic.in')), 'indiacode missing');
  assert(items.every((i) => i.kind === 'official' || !i.url), 'non-official with url unexpected');
  assert(hasOfficialParsedSource(NEW_DETAILED), 'should detect official');
});

test('2. Old Verified: official PDF URL', () => {
  const items = parseQuestionSources(OLD_VERIFIED);
  assert(items.some((i) => i.url?.includes('nios.ac.in')), 'nios url missing');
  assert(items.some((i) => i.kind === 'official' && i.url?.includes('legislative.gov.in')), 'legislative missing');
  assert(items.every((i) => !/QuestionWale|Verified:/i.test(i.title)), 'prefix leaked');
});

test('3. Based on: book names only, no invented URLs', () => {
  const items = parseQuestionSources(BASED_ON);
  assert(items.length >= 2, `expected references, got ${items.length}`);
  assert(items.every((i) => !i.url), 'invented URL');
  assert(items.every((i) => i.kind === 'reference'), 'should be reference');
  assert(!hasOfficialParsedSource(BASED_ON), 'should not be official');
});

test('4. Single bare official URL', () => {
  const items = parseQuestionSources('https://ncert.nic.in/textbook.php');
  assert(items.length === 1, `got ${items.length}`);
  assert(items[0]?.url?.startsWith('https://'), 'url missing');
  assert(items[0]?.kind === 'official', 'should be official');
});

test('5. Deduplicate repeated URLs', () => {
  const items = parseQuestionSources(
    'Doc A (https://mha.gov.in/a.pdf); Doc B (https://mha.gov.in/a.pdf); Doc A again (https://mha.gov.in/a.pdf)',
  );
  assert(items.filter((i) => i.url).length === 1, `expected 1 unique url, got ${items.length}`);
});

test('6. Empty string', () => {
  assert(parseQuestionSources('').length === 0, 'expected empty');
});

test('7. null / undefined', () => {
  assert(parseQuestionSources(null).length === 0, 'null');
  assert(parseQuestionSources(undefined).length === 0, 'undefined');
});

test('8. Malformed URL ignored safely', () => {
  const items = parseQuestionSources('Verified: Some book (https://not a url!!!); NCERT Class 11');
  assert(Array.isArray(items), 'should return array');
  assert(items.every((i) => !i.url || i.url.startsWith('https://')), 'bad url present');
});

test('9. Unsafe javascript: rejected', () => {
  assert(sanitizeHttpsUrl('javascript:alert(1)') === undefined, 'js scheme');
  const items = parseQuestionSources('Verified: Evil (javascript:alert(1))');
  assert(items.every((i) => !i.url), 'js url accepted');
});

test('10. is_verified false with official URL — parser still returns sources; badge is UI concern', () => {
  const items = parseQuestionSources('Verified with: Act (https://legislative.gov.in/constitution-of-india)');
  assert(items.some((i) => i.kind === 'official'), 'official parse');
});

test('11. No raw QuestionWale / Evidence in titles', () => {
  for (const sample of [NEW_DETAILED, OLD_VERIFIED, BASED_ON]) {
    for (const item of parseQuestionSources(sample)) {
      assert(!/QuestionWale Original/i.test(item.title), item.title);
      assert(!/Evidence record/i.test(item.title), item.title);
      assert(!/Confidence:/i.test(item.title), item.title);
    }
  }
});

test('12. data: and file: rejected; http allowed via sanitizeSourceUrl', () => {
  assert(sanitizeHttpsUrl('data:text/html,hi') === undefined, 'data');
  assert(sanitizeHttpsUrl('file:///etc/passwd') === undefined, 'file');
  assert(sanitizeHttpsUrl('http://example.com') === undefined, 'https-only helper rejects http');
  assert(sanitizeSourceUrl('http://legislative.gov.in/old.pdf')?.startsWith('http:'), 'http allowed');
});

test('13. Topic 3 structured metadata — primary then secondary', () => {
  const resolved = resolveDisplaySources('Citation without URLs', TOPIC3_METADATA);
  assert(resolved.usedStructured, 'should use structured');
  assert(resolved.items.length === 2, `expected 2, got ${resolved.items.length}`);
  assert(resolved.items[0]?.type === 'primary', 'primary first');
  assert(resolved.items[1]?.type === 'secondary', 'secondary second');
  assert(resolved.items.every((i) => Boolean(i.url)), 'urls required');
  assert(resolved.items[0]?.locator === 'Preamble, first paragraph', 'evidence locator');
  assert(!resolved.items.some((i) => /relevance|confidence/i.test(JSON.stringify(i))), 'internal leaked');
});

test('14. Structured wins — do not also parse legacy source URLs', () => {
  const legacy =
    'Also see (https://www.mha.gov.in/sites/default/files/CitizenshipAct1955.pdf)';
  const resolved = resolveDisplaySources(legacy, TOPIC3_METADATA);
  assert(resolved.usedStructured, 'structured preferred');
  assert(
    !resolved.items.some((i) => i.url?.includes('mha.gov.in')),
    'legacy URL must not duplicate',
  );
  assert(resolved.items.length === 2, 'only structured sources');
});

test('15. Duplicate structured URLs collapsed', () => {
  const meta = {
    primary_sources: [
      { title: 'A', url: 'https://legislative.gov.in/constitution-of-india' },
      { title: 'B', url: 'https://legislative.gov.in/constitution-of-india/' },
    ],
    secondary_sources: [
      { title: 'C', url: 'https://legislative.gov.in/constitution-of-india' },
    ],
  };
  const items = normalizeStructuredSources(meta);
  assert(items.length === 1, `expected 1, got ${items.length}`);
});

test('16. Malformed structured URL dropped; title-only kept', () => {
  const items = normalizeStructuredSources({
    primary_sources: [
      { title: 'Bad link', url: 'not-a-url' },
      { title: 'Book only' },
    ],
  });
  assert(items.length === 2, `got ${items.length}`);
  assert(!items[0]?.url, 'bad url must drop');
  assert(items[0]?.title === 'Bad link', 'title kept');
});

test('17. null / JSON-string metadata', () => {
  assert(parseSourceMetadata(null) === null, 'null');
  assert(resolveDisplaySources(null, null).items.length === 0, 'both null');
  const asString = JSON.stringify(TOPIC3_METADATA);
  const parsed = parseSourceMetadata(asString);
  assert(parsed?.primary_sources.length === 1, 'string metadata');
  assert(resolveDisplaySources('plain text only', null).usedStructured === false, 'legacy fallback');
});

test('18. Single structured source', () => {
  const resolved = resolveDisplaySources('Preamble of India', {
    primary_sources: [
      {
        title: 'Constitution',
        institution: 'Legislative Department',
        url: 'https://legislative.gov.in/constitution-of-india',
      },
    ],
  });
  assert(resolved.items.length === 1, 'one source');
  assert(resolved.items[0]?.institution === 'Legislative Department', 'institution');
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);

/**
 * Lightweight validation for parseQuestionSources (no test framework required).
 * Run: node --experimental-strip-types scripts/validate-parse-question-sources.ts
 */
import {
  hasOfficialParsedSource,
  parseQuestionSources,
  sanitizeHttpsUrl,
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
  // UI must not claim verified when isVerified=false — covered by component contract
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

test('12. data: and file: rejected', () => {
  assert(sanitizeHttpsUrl('data:text/html,hi') === undefined, 'data');
  assert(sanitizeHttpsUrl('file:///etc/passwd') === undefined, 'file');
  assert(sanitizeHttpsUrl('http://example.com') === undefined, 'http not allowed');
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);

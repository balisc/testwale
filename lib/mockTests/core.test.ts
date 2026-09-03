import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildBalancedAnswerSchedule,
  createSeededRandom,
  formatUtcInTimeZone,
  getTimingState,
  sampleDifficultyTargets,
  sampleSectionTargets,
  scoreMockTest,
  selectMockItems,
  type SelectionCandidate,
} from './core.ts';
import { MOCK_BLUEPRINTS } from './blueprints.ts';
import type { BlueprintSection, DifficultyBand, MockBlueprintConfig } from './blueprintTypes.ts';

const configs = Object.values(MOCK_BLUEPRINTS);
const cellsFor = (config: MockBlueprintConfig) => config.sections.flatMap((section) => [...section.cells]);

test('CGL and CHSL constrained vectors remain in range and total 25 across forty thousand section seeds', () => {
  for (const config of configs) {
    for (const section of config.sections) {
      for (let seed = 0; seed < 5_000; seed += 1) {
        const vector = sampleSectionTargets(section.cells, `${config.examKey}:${section.key}:${seed}`);
        assert.equal(Object.values(vector).reduce((sum, value) => sum + value, 0), 25);
        for (const cell of section.cells) {
          assert.ok(vector[cell.bucketKey]! >= cell.min, `${config.examKey}:${cell.bucketKey} below min`);
          assert.ok(vector[cell.bucketKey]! <= cell.max, `${config.examKey}:${cell.bucketKey} above max`);
        }
      }
    }
  }
});

test('difficulty targets follow each exam bootstrap and total 25', () => {
  for (const config of configs) {
    for (let seed = 0; seed < 5_000; seed += 1) {
      const vector = sampleDifficultyTargets(`${config.examKey}:${seed}`, config.rules.difficultyPerSection);
      assert.equal(vector.basic + vector.intermediate + vector.advanced, 25);
      for (const band of ['basic', 'intermediate', 'advanced'] as const) {
        const range = config.rules.difficultyPerSection[band];
        assert.ok(vector[band] >= range.min && vector[band] <= range.max);
      }
    }
  }
});

function candidatesFor(config: MockBlueprintConfig, sections: readonly BlueprintSection[] = config.sections): SelectionCandidate[] {
  const difficulties: DifficultyBand[] = ['basic', 'basic', 'intermediate', 'intermediate', 'advanced'];
  return sections.flatMap((section) => section.cells).flatMap((cell) => {
    if (cell.groupSize) {
      return Array.from({ length: cell.groupSize }, (_, index): SelectionCandidate => ({
        id: `${config.examKey}:${cell.sectionKey}:${cell.bucketKey}:group:${index}`,
        sectionKey: cell.sectionKey, bucketKey: cell.bucketKey,
        difficulty: difficulties[index % difficulties.length]!,
        correctOption: OPTION_KEYS[index % 4]!, groupId: `${config.examKey}:english-passage-1`,
        groupSize: cell.groupSize, groupOrder: index + 1,
      }));
    }
    return Array.from({ length: 40 }, (_, index): SelectionCandidate => ({
      id: `${config.examKey}:${cell.sectionKey}:${cell.bucketKey}:${index}`,
      sectionKey: cell.sectionKey, bucketKey: cell.bucketKey,
      difficulty: difficulties[index % difficulties.length]!, correctOption: OPTION_KEYS[index % 4]!,
      recentlyUsed: index < 2, previouslyAttempted: index < 4,
      lastSeenAt: index < 4 ? new Date(2025, 0, index + 1).toISOString() : null,
    }));
  });
}

const OPTION_KEYS = ['A', 'B', 'C', 'D'] as const;

function select(config: MockBlueprintConfig, seed: string, candidates = candidatesFor(config)) {
  return selectMockItems({
    cells: cellsFor(config), candidates, seed,
    difficultyPerSection: config.rules.difficultyPerSection,
  });
}

test('both exam selections are deterministic, unique, section-correct, atomic, and answer-balanced', () => {
  for (const config of configs) {
    const first = select(config, 'fixed-seed');
    assert.deepEqual(first, select(config, 'fixed-seed'));
    assert.equal(first.length, 100);
    assert.equal(new Set(first.map((item) => item.id)).size, 100);
    for (const section of config.sections) {
      const items = first.filter((item) => item.sectionKey === section.key);
      assert.equal(items.length, 25);
      for (const band of ['basic', 'intermediate', 'advanced'] as const) {
        const count = items.filter((item) => item.difficulty === band).length;
        const range = config.rules.difficultyPerSection[band];
        assert.ok(count >= range.min && count <= range.max);
      }
    }
    assert.equal(first.filter((item) => item.groupId === `${config.examKey}:english-passage-1`).length, 5);
    for (const key of OPTION_KEYS) assert.equal(first.filter((item) => item.displayedCorrectOption === key).length, 25);
  }
});

test('incomplete CGL and CHSL passage groups are rejected instead of split', () => {
  for (const config of configs) {
    const candidates = candidatesFor(config).filter((item) => item.id !== `${config.examKey}:english:atomic_comprehension:group:4`);
    assert.throws(() => select(config, 'split-check', candidates), /insufficient_atomic_group/);
  }
});

test('whole-test constraints hold across two thousand seeds per exam', () => {
  for (const config of configs) {
    const candidates = candidatesFor(config);
    for (let seed = 0; seed < 2_000; seed += 1) {
      const items = select(config, `property:${seed}`, candidates);
      assert.equal(items.length, 100);
      assert.equal(new Set(items.map((item) => item.id)).size, 100);
      for (const section of config.sections) assert.equal(items.filter((item) => item.sectionKey === section.key).length, 25);
      assert.equal(items.filter((item) => item.groupId === `${config.examKey}:english-passage-1`).length, 5);
      for (const key of OPTION_KEYS) assert.equal(items.filter((item) => item.displayedCorrectOption === key).length, 25);
    }
  }
});

test('CGL limited beta remains generatable while exact-inventory gaps are isolated', () => {
  const config = MOCK_BLUEPRINTS['ssc-cgl'];
  const sections = config.limitedSections;
  assert.ok(config.limitedBlueprintCode);
  assert.ok(sections);
  const cells = sections.flatMap((section) => [...section.cells]);
  const candidates = candidatesFor(config, sections);
  for (const section of sections) {
    assert.equal(section.cells.reduce((sum, cell) => sum + cell.target, 0), 25);
  }
  for (let seed = 0; seed < 500; seed += 1) {
    const selected = selectMockItems({
      cells,
      candidates,
      seed: `limited:${seed}`,
      difficultyPerSection: config.rules.difficultyPerSection,
    });
    assert.equal(selected.length, 100);
    assert.equal(new Set(selected.map((item) => item.id)).size, 100);
    assert.equal(selected.filter((item) => item.groupId).length, 5);
  }
});

test('balanced answer schedule stays inside the 20-30 whole-test band', () => {
  const schedule = buildBalancedAnswerSchedule('answers');
  assert.equal(schedule.length, 100);
  for (const key of OPTION_KEYS) assert.ok(schedule.filter((value) => value === key).length >= 20 && schedule.filter((value) => value === key).length <= 30);
  assert.equal(createSeededRandom('same')(), createSeededRandom('same')());
});

test('score and accuracy handle zero attempts, all wrong, and mixed responses', () => {
  assert.deepEqual(scoreMockTest([null, null], ['A', 'B']), {
    total: 2, attempted: 0, correct: 0, wrong: 0, unanswered: 2,
    positiveMarks: 0, negativeMarks: 0, score: 0, accuracy: 0,
  });
  assert.equal(scoreMockTest(['B', 'A'], ['A', 'B']).score, -1);
  const mixed = scoreMockTest(['A', 'C', null, 'D'], ['A', 'B', 'C', 'D']);
  assert.equal(mixed.score, 3.5);
  assert.ok(Math.abs(mixed.accuracy - (200 / 3)) < 1e-10);
});

test('CGL sectional timing changes exactly at authoritative boundaries', () => {
  const start = Date.parse('2026-09-01T00:00:00.000Z');
  const rules = MOCK_BLUEPRINTS['ssc-cgl'].rules;
  assert.equal(getTimingState(start, 'standard', start, rules).activeSectionIndex, 0);
  assert.equal(getTimingState(start, 'standard', start + 15 * 60_000 - 1, rules).activeSectionIndex, 0);
  const boundary = getTimingState(start, 'standard', start + 15 * 60_000, rules);
  assert.equal(boundary.activeSectionIndex, 1);
  assert.deepEqual(boundary.lockedSectionIndexes, [0]);
  assert.equal(getTimingState(start, 'standard', start + 60 * 60_000, rules).expired, true);
});

test('CHSL uses one global deadline and never locks a section', () => {
  const start = Date.parse('2026-09-01T00:00:00.000Z');
  const rules = MOCK_BLUEPRINTS['ssc-chsl'].rules;
  for (const elapsed of [0, 15, 30, 59].map((minutes) => minutes * 60_000)) {
    const state = getTimingState(start, 'standard', start + elapsed, rules);
    assert.equal(state.activeSectionIndex, null);
    assert.deepEqual(state.lockedSectionIndexes, []);
    assert.equal(state.expired, false);
  }
  assert.equal(getTimingState(start, 'standard', start + 60 * 60_000, rules).expired, true);
  assert.equal(getTimingState(start, 'scribe_simulation', start + 60 * 60_000, rules).expired, false);
  assert.equal(getTimingState(start, 'scribe_simulation', start + 80 * 60_000, rules).expired, true);
});

test('UTC timestamps render in the requested profile timezone', () => {
  assert.match(formatUtcInTimeZone('2026-09-01T00:00:00.000Z', 'Asia/Kolkata'), /5:30:00\s*am/i);
});

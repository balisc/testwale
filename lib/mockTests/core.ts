import type {
  BlueprintCell,
  DifficultyBand,
  DifficultyRange,
  MockMode,
  MockRules,
  MockSectionKey,
  MockTimingStrategy,
} from './blueprintTypes';

export type RandomSource = () => number;
type OptionKey = 'A' | 'B' | 'C' | 'D';

function hashSeed(seed: string): number {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/** Small deterministic PRNG for reproducible selection; generation seeds come from server crypto. */
export function createSeededRandom(seed: string): RandomSource {
  let state = hashSeed(seed) || 0x9e3779b9;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function deterministicShuffle<T>(values: readonly T[], random: RandomSource): T[] {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex]!, result[index]!];
  }
  return result;
}

/** Sample around cell targets, then reconcile without crossing any configured bound. */
export function sampleSectionTargets(
  cells: readonly BlueprintCell[],
  seed: string,
  requiredTotal = 25,
): Record<string, number> {
  const random = createSeededRandom(seed);
  const result = Object.fromEntries(cells.map((cell) => {
    const span = cell.max - cell.min;
    if (span === 0) return [cell.bucketKey, cell.target];
    const triangular = (random() + random()) / 2;
    const sampled = Math.round(cell.min + triangular * span);
    return [cell.bucketKey, Math.max(cell.min, Math.min(cell.max, sampled))];
  }));

  let difference = requiredTotal - Object.values(result).reduce((sum, value) => sum + value, 0);
  let guard = 0;
  while (difference !== 0 && guard < 500) {
    guard += 1;
    const candidates = deterministicShuffle(cells, random)
      .filter((cell) => difference > 0
        ? result[cell.bucketKey]! < cell.max
        : result[cell.bucketKey]! > cell.min)
      .sort((left, right) => {
        const leftDistance = Math.abs(result[left.bucketKey]! - left.target);
        const rightDistance = Math.abs(result[right.bucketKey]! - right.target);
        return leftDistance - rightDistance;
      });
    const chosen = candidates[0];
    if (!chosen) throw new Error('blueprint_target_total_unsatisfiable');
    result[chosen.bucketKey] = result[chosen.bucketKey]! + Math.sign(difference);
    difference -= Math.sign(difference);
  }
  if (difference !== 0) throw new Error('blueprint_target_total_unsatisfiable');
  return result;
}

export function sampleDifficultyTargets(
  seed: string,
  difficultyPerSection: Record<DifficultyBand, DifficultyRange>,
): Record<DifficultyBand, number> {
  const cells: BlueprintCell[] = (Object.entries(difficultyPerSection) as Array<[
    DifficultyBand,
    { min: number; max: number; target: number },
  ]>).map(([bucketKey, range]) => ({
    sectionKey: 'reasoning',
    bucketKey,
    label: bucketKey,
    minimumInventory: 0,
    ...range,
  }));
  return sampleSectionTargets(cells, seed, 25) as Record<DifficultyBand, number>;
}

export type SelectionCandidate = {
  id: string;
  sectionKey: MockSectionKey;
  bucketKey: string;
  difficulty: DifficultyBand;
  correctOption: 'A' | 'B' | 'C' | 'D';
  groupId?: string | null;
  groupSize?: number | null;
  groupOrder?: number | null;
  recentlyUsed?: boolean;
  previouslyAttempted?: boolean;
  lastSeenAt?: string | null;
};

export type SelectedMockItem = SelectionCandidate & {
  sectionOrder: number;
  overallOrder: number;
  optionOrder: readonly [OptionKey, OptionKey, OptionKey, OptionKey];
  displayedCorrectOption: 'A' | 'B' | 'C' | 'D';
};

function preferenceRank(candidate: SelectionCandidate): [number, number, number] {
  const lastSeen = candidate.lastSeenAt ? Date.parse(candidate.lastSeenAt) : 0;
  return [candidate.recentlyUsed ? 1 : 0, candidate.previouslyAttempted ? 1 : 0, lastSeen || 0];
}

function compareRank(left: SelectionCandidate, right: SelectionCandidate) {
  const a = preferenceRank(left);
  const b = preferenceRank(right);
  return a[0] - b[0] || a[1] - b[1] || a[2] - b[2];
}

function compareGroupRank(left: SelectionCandidate[], right: SelectionCandidate[]) {
  const count = (members: SelectionCandidate[], field: 'recentlyUsed' | 'previouslyAttempted') => (
    members.filter((member) => member[field]).length
  );
  const oldestSeen = (members: SelectionCandidate[]) => {
    const values = members.map((member) => member.lastSeenAt ? Date.parse(member.lastSeenAt) : 0)
      .filter((value) => value > 0);
    return values.length > 0 ? Math.min(...values) : 0;
  };
  return count(left, 'recentlyUsed') - count(right, 'recentlyUsed')
    || count(left, 'previouslyAttempted') - count(right, 'previouslyAttempted')
    || oldestSeen(left) - oldestSeen(right);
}

const DIFFICULTY_BANDS: readonly DifficultyBand[] = ['basic', 'intermediate', 'advanced'];

type DifficultyAllocation = Record<string, Record<DifficultyBand, number>>;

function solveDifficultyAllocation(input: {
  cells: readonly BlueprintCell[];
  targets: Record<string, number>;
  pools: Map<string, Map<DifficultyBand, SelectionCandidate[]>>;
  remaining: Record<DifficultyBand, number>;
  random: RandomSource;
}): DifficultyAllocation | null {
  const allocation: DifficultyAllocation = {};

  function visit(cellIndex: number, remaining: Record<DifficultyBand, number>): boolean {
    if (cellIndex === input.cells.length) {
      return DIFFICULTY_BANDS.every((band) => remaining[band] === 0);
    }
    const cell = input.cells[cellIndex]!;
    const target = input.targets[cell.bucketKey] ?? 0;
    const pool = input.pools.get(cell.bucketKey);
    const combinations: Array<Record<DifficultyBand, number>> = [];
    for (let basic = 0; basic <= target; basic += 1) {
      for (let intermediate = 0; intermediate <= target - basic; intermediate += 1) {
        const advanced = target - basic - intermediate;
        const candidate = { basic, intermediate, advanced };
        if (DIFFICULTY_BANDS.every((band) => (
          candidate[band] <= remaining[band]
          && candidate[band] <= (pool?.get(band)?.length ?? 0)
        ))) combinations.push(candidate);
      }
    }
    for (const candidate of deterministicShuffle(combinations, input.random)) {
      allocation[cell.bucketKey] = candidate;
      const next = Object.fromEntries(DIFFICULTY_BANDS.map((band) => [band, remaining[band] - candidate[band]])) as Record<DifficultyBand, number>;
      if (visit(cellIndex + 1, next)) return true;
    }
    delete allocation[cell.bucketKey];
    return false;
  }

  return visit(0, { ...input.remaining }) ? allocation : null;
}

function optionPermutationForCorrect(
  originalCorrect: OptionKey,
  desiredCorrect: OptionKey,
  random: RandomSource,
): readonly [OptionKey, OptionKey, OptionKey, OptionKey] {
  const keys = ['A', 'B', 'C', 'D'] as const;
  const otherOriginal = deterministicShuffle(keys.filter((key) => key !== originalCorrect), random);
  const order = Array<'A' | 'B' | 'C' | 'D'>(4);
  order[keys.indexOf(desiredCorrect)] = originalCorrect;
  let cursor = 0;
  for (let index = 0; index < order.length; index += 1) {
    if (order[index]) continue;
    order[index] = otherOriginal[cursor++]!;
  }
  return order as unknown as readonly [OptionKey, OptionKey, OptionKey, OptionKey];
}

export function buildBalancedAnswerSchedule(seed: string, total = 100): Array<'A' | 'B' | 'C' | 'D'> {
  const keys = ['A', 'B', 'C', 'D'] as const;
  const base = Math.floor(total / keys.length);
  const remainder = total % keys.length;
  const values = keys.flatMap((key, index) => Array(base + (index < remainder ? 1 : 0)).fill(key));
  return deterministicShuffle(values, createSeededRandom(`${seed}:answer-schedule`));
}

export function selectMockItems(input: {
  cells: readonly BlueprintCell[];
  candidates: readonly SelectionCandidate[];
  seed: string;
  difficultyPerSection: Record<DifficultyBand, DifficultyRange>;
}): SelectedMockItem[] {
  const random = createSeededRandom(input.seed);
  const selected: SelectionCandidate[] = [];
  const usedIds = new Set<string>();
  const selectedGroups = new Set<string>();

  const sections = [...new Set(input.cells.map((cell) => cell.sectionKey))];
  for (const sectionKey of sections) {
    const cells = input.cells.filter((cell) => cell.sectionKey === sectionKey);
    const targets = sampleSectionTargets(cells, `${input.seed}:${sectionKey}`);
    const difficultyTargets = sampleDifficultyTargets(`${input.seed}:${sectionKey}:difficulty`, input.difficultyPerSection);
    const cellPools = new Map<string, SelectionCandidate[]>();
    for (const cell of cells) {
      cellPools.set(cell.bucketKey, deterministicShuffle(
        input.candidates.filter((candidate) => (
          candidate.sectionKey === sectionKey
          && candidate.bucketKey === cell.bucketKey
          && !usedIds.has(candidate.id)
        )),
        random,
      ).sort(compareRank));
    }

    const groupCell = cells.find((cell) => cell.groupSize);
    let groupChoices: SelectionCandidate[][] = [[]];
    if (groupCell) {
      const target = targets[groupCell.bucketKey]!;
      if (target !== groupCell.groupSize) throw new Error(`invalid_atomic_group_target:${groupCell.bucketKey}`);
      const groups = new Map<string, SelectionCandidate[]>();
      for (const candidate of cellPools.get(groupCell.bucketKey) ?? []) {
        if (!candidate.groupId) continue;
        const group = groups.get(candidate.groupId) ?? [];
        group.push(candidate);
        groups.set(candidate.groupId, group);
      }
      groupChoices = deterministicShuffle(
        [...groups.entries()]
          .filter(([groupId, members]) => !selectedGroups.has(groupId) && members.length === groupCell.groupSize)
          .map(([, members]) => members),
        random,
      ).sort(compareGroupRank);
      if (groupChoices.length === 0) throw new Error(`insufficient_atomic_group:${groupCell.bucketKey}`);
    }

    const ordinaryCells = cells.filter((cell) => !cell.groupSize);
    const difficultyPools = new Map<string, Map<DifficultyBand, SelectionCandidate[]>>();
    for (const cell of ordinaryCells) {
      difficultyPools.set(cell.bucketKey, new Map(DIFFICULTY_BANDS.map((band) => [
        band,
        (cellPools.get(cell.bucketKey) ?? []).filter((candidate) => candidate.difficulty === band),
      ])));
    }

    let sectionSelection: SelectionCandidate[] | null = null;
    for (const group of groupChoices) {
      const remaining = { ...difficultyTargets };
      for (const candidate of group) remaining[candidate.difficulty] -= 1;
      if (DIFFICULTY_BANDS.some((band) => remaining[band] < 0)) continue;
      const allocation = solveDifficultyAllocation({
        cells: ordinaryCells,
        targets,
        pools: difficultyPools,
        remaining,
        random,
      });
      if (!allocation) continue;
      const chosenByBucket = new Map<string, SelectionCandidate[]>();
      for (const cell of ordinaryCells) {
        const chosen = DIFFICULTY_BANDS.flatMap((band) => (
          difficultyPools.get(cell.bucketKey)?.get(band)?.slice(0, allocation[cell.bucketKey]![band]) ?? []
        ));
        chosenByBucket.set(cell.bucketKey, deterministicShuffle(chosen, random));
      }
      sectionSelection = cells.flatMap((cell) => (
        cell.groupSize
          ? [...group].sort((left, right) => (
            (left.groupOrder ?? Number.MAX_SAFE_INTEGER) - (right.groupOrder ?? Number.MAX_SAFE_INTEGER)
            || left.id.localeCompare(right.id)
          ))
          : chosenByBucket.get(cell.bucketKey) ?? []
      ));
      break;
    }
    if (!sectionSelection) throw new Error(`insufficient_difficulty_inventory:${sectionKey}`);
    for (const candidate of sectionSelection) {
      selected.push(candidate);
      usedIds.add(candidate.id);
      if (candidate.groupId) selectedGroups.add(candidate.groupId);
    }
  }

  const answerSchedule = buildBalancedAnswerSchedule(input.seed, selected.length);
  const sectionCounters = new Map<MockSectionKey, number>();
  return selected.map((candidate, index) => {
    const sectionOrder = (sectionCounters.get(candidate.sectionKey) ?? 0) + 1;
    sectionCounters.set(candidate.sectionKey, sectionOrder);
    const desired = answerSchedule[index]!;
    return {
      ...candidate,
      sectionOrder,
      overallOrder: index + 1,
      optionOrder: optionPermutationForCorrect(candidate.correctOption, desired, random),
      displayedCorrectOption: desired,
    };
  });
}

export function scoreMockTest(
  selectedOptions: Array<string | null | undefined>,
  correctOptions: string[],
  scoring: Pick<MockRules, 'marksCorrect' | 'marksWrong'> = { marksCorrect: 2, marksWrong: -0.5 },
) {
  if (selectedOptions.length !== correctOptions.length) throw new Error('score_length_mismatch');
  let correct = 0;
  let wrong = 0;
  for (let index = 0; index < correctOptions.length; index += 1) {
    const selected = selectedOptions[index];
    if (!selected) continue;
    if (selected === correctOptions[index]) correct += 1;
    else wrong += 1;
  }
  const attempted = correct + wrong;
  const unanswered = correctOptions.length - attempted;
  const positiveMarks = correct * scoring.marksCorrect;
  const negativeMarks = Math.abs(wrong * scoring.marksWrong);
  return {
    total: correctOptions.length,
    attempted,
    correct,
    wrong,
    unanswered,
    positiveMarks,
    negativeMarks,
    score: positiveMarks - negativeMarks,
    accuracy: attempted === 0 ? 0 : (correct / attempted) * 100,
  };
}

export type TimingRules = {
  timingStrategy: MockTimingStrategy;
  standardTotalSeconds: number;
  scribeTotalSeconds: number;
  standardSectionSeconds?: number;
  scribeSectionSeconds?: number;
};

export function getTotalDurationSeconds(mode: MockMode, rules: TimingRules) {
  return mode === 'scribe_simulation' ? rules.scribeTotalSeconds : rules.standardTotalSeconds;
}

export function getTimingState(startedAtMs: number, mode: MockMode, serverNowMs: number, rules: TimingRules) {
  const totalSeconds = getTotalDurationSeconds(mode, rules);
  const totalMs = totalSeconds * 1000;
  const elapsedMs = Math.max(0, serverNowMs - startedAtMs);
  const expired = elapsedMs >= totalMs;
  const sectionSeconds = mode === 'scribe_simulation' ? rules.scribeSectionSeconds : rules.standardSectionSeconds;
  const sectionMs = (sectionSeconds ?? totalSeconds) * 1000;
  const activeSectionIndex = rules.timingStrategy === 'sectional' && !expired
    ? Math.min(3, Math.floor(elapsedMs / sectionMs))
    : null;
  const sectionStartedAtMs = activeSectionIndex == null ? null : startedAtMs + activeSectionIndex * sectionMs;
  const sectionDeadlineMs = activeSectionIndex == null ? null : sectionStartedAtMs! + sectionMs;
  return {
    expired,
    timingStrategy: rules.timingStrategy,
    activeSectionIndex,
    lockedSectionIndexes: rules.timingStrategy === 'sectional'
      ? [0, 1, 2, 3].filter((index) => expired || index < (activeSectionIndex ?? 4))
      : [],
    elapsedSeconds: Math.min(Math.floor(elapsedMs / 1000), totalMs / 1000),
    remainingTotalSeconds: Math.max(0, Math.ceil((totalMs - elapsedMs) / 1000)),
    remainingSectionSeconds: rules.timingStrategy === 'global'
      ? Math.max(0, Math.ceil((totalMs - elapsedMs) / 1000))
      : sectionDeadlineMs == null ? 0
      : Math.max(0, Math.ceil((sectionDeadlineMs - serverNowMs) / 1000)),
    deadlineMs: startedAtMs + totalMs,
    sectionStartedAtMs,
    sectionDeadlineMs,
  };
}

export function formatUtcInTimeZone(instant: string, timeZone = 'Asia/Kolkata', locale = 'en-IN') {
  return new Intl.DateTimeFormat(locale, {
    timeZone,
    dateStyle: 'medium',
    timeStyle: 'medium',
  }).format(new Date(instant));
}

import type { LocalizedText } from '@/types/polity';
import type { MockExamKey, MockMode, MockSectionKey } from './blueprintTypes';

export type MockTestStatus = 'not_started' | 'in_progress' | 'submitted' | 'auto_submitted';
export type ReadinessState = 'ready' | 'limited' | 'blocked';
export type MockReviewFilter = 'all' | 'correct' | 'wrong' | 'unanswered' | 'marked';

export type MockReadinessBucket = {
  sectionKey: MockSectionKey;
  bucketKey: string;
  label: string;
  requiredCount: number;
  eligibleCount: number;
  provisionalCount: number;
  completeGroupCount: number;
  deficit: number;
  ready: boolean;
};

export type MockReadiness = {
  examKey: MockExamKey;
  blueprintCode: string;
  rulesVersion: string;
  patternYear: number;
  state: ReadinessState;
  generationEnabled: boolean;
  reason: 'ready' | 'feature_disabled' | 'migration_required' | 'inventory_gaps' | 'blueprint_disabled';
  auditedAt: string;
  buckets: MockReadinessBucket[];
};

export type MockHistoryRow = {
  id: string;
  testNumber: number;
  title: string;
  blueprintCode: string;
  examKey: MockExamKey;
  status: MockTestStatus;
  timingMode: MockMode | null;
  createdAt: string;
  startedAt: string | null;
  submittedAt: string | null;
  autoSubmittedAt: string | null;
  finalScore: number | null;
  maxScore: number;
  attempted: number;
  correct: number;
  wrong: number;
  unanswered: number;
  accuracy: number;
  negativeMarks: number;
  wallTimeSeconds: number;
  activeTimeSeconds: number;
};

export type MockShellItem = {
  id: string;
  sectionKey: MockSectionKey;
  bucketKey: string;
  sectionOrder: number;
  overallOrder: number;
  groupId: string | null;
  groupOrder: number | null;
  passage: LocalizedText | null;
  question: LocalizedText;
  options: Record<string, unknown>;
  optionOrder: ['A', 'B', 'C', 'D'];
  taxonomy: Record<string, unknown>;
  media: unknown[];
  response: {
    selectedOption: 'A' | 'B' | 'C' | 'D' | null;
    visited: boolean;
    markedForReview: boolean;
    eventVersion: number;
    activeTimeSeconds: number;
  } | null;
};

export type MockTestShell = {
  id: string;
  testNumber: number;
  title: string;
  blueprintCode: string;
  examKey: MockExamKey;
  status: MockTestStatus;
  timingMode: MockMode | null;
  createdAt: string;
  startedAt: string | null;
  deadlineAt: string | null;
  submittedAt: string | null;
  autoSubmittedAt: string | null;
  serverNow: string;
  rules: Record<string, unknown>;
  items: MockShellItem[];
};

export type MockResultReviewItem = MockShellItem & {
  selectedOption: 'A' | 'B' | 'C' | 'D' | null;
  correctOption: 'A' | 'B' | 'C' | 'D';
  isCorrect: boolean | null;
  explanation: LocalizedText;
  source: Record<string, unknown>;
  estimatedActiveTimeSeconds: number;
};

export type MockResult = {
  test: MockHistoryRow;
  sections: Array<{
    sectionKey: MockSectionKey;
    attempted: number;
    correct: number;
    wrong: number;
    unanswered: number;
    positiveMarks: number;
    negativeMarks: number;
    score: number;
    activeTimeSeconds: number;
  }>;
  review: MockResultReviewItem[];
  reviewTotal: number;
  reviewPage: number;
  reviewPageSize: number;
  topicInsights: Array<{
    key: string;
    label: string;
    attempted: number;
    correct: number;
    accuracy: number | null;
    insight: 'strength' | 'focus' | 'more_data_needed';
  }>;
  cohort: { status: 'insufficient_data'; percentile: null; rank: null };
};

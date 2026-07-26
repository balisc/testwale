import type { LocalizedText } from '@/types/polity';

export type PyqEvidenceMode = 'direct' | 'multi_commission_proxy' | 'limited' | string;
export type RankingBasis = 'official_clause' | string;
export type DepthLevel = 'foundation' | 'standard' | 'advanced' | 'school_civics' | string;
export type ImportanceLevel = 'high' | 'medium' | 'low' | string;
export type PyqConfidence = 'high' | 'medium' | 'low' | string;

export type PolityExamRankingEvidence = {
  ranking_basis: RankingBasis | null;
  evidence_status: string | null;
  official_ranking_status: string | null;
  effective_ranking_status: string | null;
  effective_ranking_method: string | null;
  pyq_evidence_mode: PyqEvidenceMode | null;
  pyq_confidence: PyqConfidence | null;
  basis_note: string | null;
  syllabus_clause: string | null;
  source_url: string | null;
  source_title: string | null;
  source_locator: string | null;
  match_type: string | null;
};

export type PolityRankedExamOption = {
  exam_code: string;
  family_code: string | null;
  jurisdiction_code: string | null;
  jurisdiction_name: string | null;
  exam_type: string | null;
  stage: string | null;
  paper: string | null;
  ranking_profile_code: string | null;
  title: LocalizedText;
  titleSource: 'series' | 'humanized';
  jurisdictionGroup: 'national' | 'state' | 'union_territory';
};

export type PolityTopicRankingRow = PolityExamRankingEvidence & {
  exam_code: string;
  family_code: string | null;
  topic_id: string;
  priority: number;
  importance: ImportanceLevel | null;
  is_recommended: boolean;
  topic: {
    id: string;
    title: LocalizedText;
    slug: string;
    description: LocalizedText | null;
    icon_key: string | null;
    subtopic_count: number | null;
    question_count: number | null;
  };
};

export type PolitySubtopicRankingRow = PolityExamRankingEvidence & {
  exam_code: string;
  family_code: string | null;
  topic_id: string;
  subtopic_id: string;
  priority: number;
  importance: ImportanceLevel | null;
  depth_level: DepthLevel | null;
  is_recommended: boolean;
  subtopic: {
    id: string;
    topic_id: string;
    title: LocalizedText;
    slug: string;
    description: LocalizedText | null;
    question_count: number | null;
  };
  topic: {
    id: string;
    title: LocalizedText;
    slug: string;
    icon_key: string | null;
  };
};

export type PolityExamRankingBundle = {
  examCode: string;
  exam: PolityRankedExamOption | null;
  topics: PolityTopicRankingRow[];
  subtopics: PolitySubtopicRankingRow[];
};

export type PolityProgressState = 'not_started' | 'in_progress' | 'completed';

export type PolityEntityProgress = {
  state: PolityProgressState;
  attempted: number;
  total: number | null;
  percent: number | null;
};

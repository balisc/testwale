import 'server-only';

import { createClient } from '@supabase/supabase-js';
import { unstable_cache } from 'next/cache';
import { getCatalogSnapshot } from '@/lib/catalogCache';
import { attachCatalogContentMappings } from '@/lib/examSyllabus';
import { SSC_CGL_NODE_CONTENT_SLUGS } from '@/lib/sscCglContentLinks';
import {
  getExactExamQuestionCounts,
  resolveReadyExamProfileId,
} from '@/lib/exactExamQuestionsServer';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { QUESTION_BATCH_CACHE_VERSION } from '@/lib/questionBatchCache';
import {
  SSC_CGL_STAGES,
  buildSscCglTaxonomy,
  normalizeSscCglSkillTests,
  sscCglTaxonomyToLearningHierarchy,
  type SscCglScopeSummaryViewRow,
  type SscCglSkillTest,
  type SscCglSkillTestViewRow,
  type SscCglStageCode,
  type SscCglStageDefinition,
  type SscCglStageTaxonomy,
  type SscCglTaxonomyViewRow,
} from '@/lib/sscCglSyllabus';

type ViewDefinition<Row> = { Row: Row; Insert: never; Update: never; Relationships: [] };
type SscCglPublicDatabase = {
  public: {
    Tables: Record<never, never>;
    Views: {
      ssc_cgl_tier_1_taxonomy_v2: ViewDefinition<SscCglTaxonomyViewRow>;
      ssc_cgl_tier_2_paper_1_taxonomy_v2: ViewDefinition<SscCglTaxonomyViewRow>;
      ssc_cgl_tier_2_paper_2_taxonomy_v2: ViewDefinition<SscCglTaxonomyViewRow>;
      ssc_cgl_tier_2_paper_3_taxonomy_v2: ViewDefinition<SscCglTaxonomyViewRow>;
      ssc_cgl_tier_skill_tests_v2: ViewDefinition<SscCglSkillTestViewRow>;
      ssc_cgl_tier_scope_summary_v2: ViewDefinition<SscCglScopeSummaryViewRow>;
    };
    Functions: Record<never, never>;
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
};

const TAXONOMY_COLUMNS = 'exam_profile_code, syllabus_version_code, tier_code, tier_label, tier_sort_order, paper_code, paper_label, stage_code, stage_tag, stage_sort_order, subject_id, subject_code, subject_title, subject_description, subject_sort_order, topic_id, topic_code, topic_title, topic_description, topic_sort_order, subtopic_id, subtopic_code, subtopic_title, subtopic_description, subtopic_source_locator, subtopic_sort_order, is_objective, is_qualifying, content_generation_allowed, navigation_visible, is_shared_between_tiers' as const;
const SSC_CGL_CONTENT_MAPPING_CACHE_VERSION = 'v4';

function getPublicClient() {
  const url = (
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || process.env.SUPABASE_URL?.trim() || ''
  ).replace(/\/?rest\/v1\/?$/i, '').replace(/\/$/, '');
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    process.env.SUPABASE_ANON_KEY?.trim() ||
    '';
  if (!url || !key) throw new Error('supabase_public_not_configured');
  return createClient<SscCglPublicDatabase>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function fetchStageTaxonomy(stage: SscCglStageDefinition): Promise<SscCglStageTaxonomy> {
  const client = getPublicClient();
  const result = await client
    .from(stage.view)
    .select(TAXONOMY_COLUMNS)
    .eq('stage_code', stage.code)
    .order('subject_sort_order', { ascending: true })
    .order('topic_sort_order', { ascending: true })
    .order('subtopic_sort_order', { ascending: true });
  if (result.error) throw new Error(`ssc_cgl_taxonomy_failed:${result.error.message}`);
  return buildSscCglTaxonomy(stage, result.data);
}

const cachedStageLoaders: Record<SscCglStageCode, () => Promise<SscCglStageTaxonomy>> = {
  TIER_I: unstable_cache(
    () => fetchStageTaxonomy(SSC_CGL_STAGES[0]),
    ['ssc-cgl-taxonomy', 'TIER_I'],
    { revalidate: 300, tags: ['ssc-cgl-taxonomy', 'ssc-cgl-taxonomy-TIER_I'] },
  ),
  TIER_II_PAPER_I: unstable_cache(
    () => fetchStageTaxonomy(SSC_CGL_STAGES[1]),
    ['ssc-cgl-taxonomy', 'TIER_II_PAPER_I'],
    { revalidate: 300, tags: ['ssc-cgl-taxonomy', 'ssc-cgl-taxonomy-TIER_II_PAPER_I'] },
  ),
  TIER_II_PAPER_II: unstable_cache(
    () => fetchStageTaxonomy(SSC_CGL_STAGES[2]),
    ['ssc-cgl-taxonomy', 'TIER_II_PAPER_II'],
    { revalidate: 300, tags: ['ssc-cgl-taxonomy', 'ssc-cgl-taxonomy-TIER_II_PAPER_II'] },
  ),
  TIER_II_PAPER_III: unstable_cache(
    () => fetchStageTaxonomy(SSC_CGL_STAGES[3]),
    ['ssc-cgl-taxonomy', 'TIER_II_PAPER_III'],
    { revalidate: 300, tags: ['ssc-cgl-taxonomy', 'ssc-cgl-taxonomy-TIER_II_PAPER_III'] },
  ),
};

export function getSscCglStageTaxonomy(stage: SscCglStageDefinition) {
  return cachedStageLoaders[stage.code]();
}

export const getSscCglPaperOneSkillTests = unstable_cache(
  async (): Promise<SscCglSkillTest[]> => {
    const stage = SSC_CGL_STAGES[1];
    const result = await getPublicClient()
      .from('ssc_cgl_tier_skill_tests_v2')
      .select(
        'exam_profile_code, syllabus_version_code, tier_code, tier_label, paper_code, paper_label, stage_code, stage_tag, stage_sort_order, skill_test_id, skill_test_code, skill_test_title, skill_test_description, source_locator, sort_order, is_objective, is_qualifying',
      )
      .eq('stage_code', stage.code)
      .order('sort_order', { ascending: true });
    if (result.error) throw new Error(`ssc_cgl_skill_tests_failed:${result.error.message}`);
    return normalizeSscCglSkillTests(stage, result.data);
  },
  ['ssc-cgl-skill-tests', 'TIER_II_PAPER_I'],
  { revalidate: 300, tags: ['ssc-cgl-skill-tests'] },
);

export const getSscCglScopeSummaries = unstable_cache(
  async (): Promise<SscCglScopeSummaryViewRow[]> => {
    const result = await getPublicClient()
      .from('ssc_cgl_tier_scope_summary_v2')
      .select(
        'exam_profile_code, tier_code, tier_label, tier_sort_order, paper_code, paper_label, stage_code, stage_tag, stage_sort_order, subjects, topics, subtopics, skill_tests',
      )
      .order('stage_sort_order', { ascending: true });
    if (result.error) throw new Error(`ssc_cgl_scope_summary_failed:${result.error.message}`);
    return result.data;
  },
  ['ssc-cgl-scope-summary-v2'],
  { revalidate: 300, tags: ['ssc-cgl-taxonomy'] },
);

async function buildSscCglMappedLearningHierarchy(taxonomy: SscCglStageTaxonomy) {
  const hierarchy = sscCglTaxonomyToLearningHierarchy(taxonomy);
  const admin = getSupabaseAdmin();
  if (!admin || hierarchy.subtopics.length === 0) return hierarchy;
  const [catalog, result] = await Promise.all([
    getCatalogSnapshot(),
    admin
      .from('exam_syllabus_nodes')
      .select('id, node_code, metadata')
      .in('id', hierarchy.subtopics.map((subtopic) => subtopic.id)),
  ]);
  const activeCatalogSubtopicBySlug = new Map(
    catalog.subtopics.filter((row) => row.is_active).map((row) => [row.slug, row]),
  );
  if (result.error) throw new Error(`ssc_cgl_node_metadata_failed:${result.error.code}`);
  const contentIdByNode = new Map<string, string>();
  for (const raw of result.data ?? []) {
    const metadata = raw.metadata && typeof raw.metadata === 'object'
      ? raw.metadata as Record<string, unknown>
      : null;
    const value = metadata?.content_subtopic_id ?? metadata?.catalog_subtopic_id;
    if (typeof value === 'string' && value.trim()) {
      contentIdByNode.set(String(raw.id), value.trim());
      continue;
    }

    // Compatibility for the already-published V6.1 taxonomy, whose question-backed
    // nodes predate explicit metadata links. This is still an explicit stable-code
    // mapping: titles and fuzzy matching are never used at request time.
    const contentSlug = (SSC_CGL_NODE_CONTENT_SLUGS as Readonly<Record<string, string>>)[
      String(raw.node_code)
    ];
    if (!contentSlug) continue;
    const contentSubtopic = activeCatalogSubtopicBySlug.get(contentSlug);
    if (!contentSubtopic) {
      throw new Error(`ssc_cgl_content_mapping_drift:${raw.node_code}:${contentSlug}`);
    }
    contentIdByNode.set(String(raw.id), contentSubtopic.id);
  }
  return attachCatalogContentMappings(
    {
      ...hierarchy,
      subtopics: hierarchy.subtopics.map((subtopic) => ({
        ...subtopic,
        content_id: contentIdByNode.get(subtopic.id),
      })),
    },
    catalog,
  );
}

export function getSscCglMappedLearningHierarchy(taxonomy: SscCglStageTaxonomy) {
  return unstable_cache(
    () => buildSscCglMappedLearningHierarchy(taxonomy),
    [
      'ssc-cgl-mapped-learning-hierarchy',
      SSC_CGL_CONTENT_MAPPING_CACHE_VERSION,
      QUESTION_BATCH_CACHE_VERSION,
      taxonomy.stage.code,
    ],
    {
      revalidate: 60,
      tags: ['ssc-cgl-taxonomy', `ssc-cgl-taxonomy-${taxonomy.stage.code}`, 'catalog'],
    },
  )();
}

export function getSscCglScopedQuestionCounts(
  stage: SscCglStageDefinition,
  subjectId: string,
  topicId: string,
) {
  return unstable_cache(
    async (): Promise<Record<string, number>> => {
      const taxonomy = await getSscCglStageTaxonomy(stage);
      const subject = taxonomy.subjects.find((candidate) => candidate.id === subjectId);
      const topic = subject?.topics.find((candidate) => candidate.id === topicId);
      if (!subject || !topic) return {};
      const allowedSubtopicIds = new Set(topic.subtopics.map((subtopic) => subtopic.id));
      const mapped = await getSscCglMappedLearningHierarchy(taxonomy);
      const scoped = mapped.subtopics.filter(
        (subtopic) => allowedSubtopicIds.has(subtopic.id) && subtopic.content_id,
      );
      const profileId = await resolveReadyExamProfileId({ examCode: 'SSC_CGL' });
      if (!profileId) throw new Error('ssc_cgl_ready_profile_missing');
      const exactCounts = await getExactExamQuestionCounts({
        examProfileId: profileId,
        contentSubtopicIds: scoped.map((subtopic) => subtopic.content_id!),
        stageCodes: [stage.code],
      });
      return Object.fromEntries(scoped.map((subtopic) => [
        subtopic.id,
        exactCounts[subtopic.content_id!] ?? 0,
      ]));
    },
    [
      'ssc-cgl-question-counts-v7',
      SSC_CGL_CONTENT_MAPPING_CACHE_VERSION,
      QUESTION_BATCH_CACHE_VERSION,
      stage.code,
      subjectId,
      topicId,
    ],
    {
      revalidate: 60,
      tags: ['ssc-cgl-question-counts', `ssc-cgl-question-counts-${stage.code}`],
    },
  )();
}

import 'server-only';

import { unstable_cache } from 'next/cache';
import { getCatalogSnapshot } from '@/lib/catalogCache';
import {
  attachCatalogContentMappings,
  buildPublishedSyllabusHierarchy,
} from '@/lib/examSyllabus';
import {
  normalizeExamSelectorOption,
} from '@/lib/examSelector';
import {
  getReadyExamSelectorOptions,
  READY_EXAM_SELECTOR_COLUMNS,
} from '@/lib/examCatalogueServer';
import { getExactExamQuestionCounts } from '@/lib/exactExamQuestionsServer';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import type { ExamLearningSnapshot } from '@/lib/examLearning';
import type { ExamSyllabusNodeRow, ExamSyllabusVersionRow } from '@/types/supabase';

export type PublicExamExplorerOption = {
  code: string;
  label: string;
  isAvailable: boolean;
  href: string | null;
};

export type PublicExamExplorerLink = {
  label: string;
  href: string;
  iconKey: string | null;
};

export type PublicExamExplorerPath = {
  subject: PublicExamExplorerLink;
  topic: PublicExamExplorerLink;
  subtopic: PublicExamExplorerLink;
};

export type PublicExamExplorerData = {
  examCode: string;
  examSlug: string;
  examName: string;
  examDescription: string;
  options: PublicExamExplorerOption[];
  counts: {
    subjects: number;
    topics: number;
    subtopics: number;
  };
  subjects: PublicExamExplorerLink[];
  path: PublicExamExplorerPath | null;
  ctaHref: string;
  snapshot: ExamLearningSnapshot;
};

const PUBLIC_CGL_SLUG = 'ssc-cgl';
let publicExamFetchInFlight: Promise<PublicExamExplorerData | null> | null = null;
let lastKnownPublicExamExplorerData: PublicExamExplorerData | null = null;

function title(value: { en?: string; hi?: string }, fallback: string): string {
  return value.en?.trim() || value.hi?.trim() || fallback;
}

function reportPublicExplorerFailure(scope: string, error: unknown) {
  const message = error instanceof Error ? error.message : String(error || 'unknown_error');
  // This section is optional homepage content. Keep the diagnostic in the
  // server log without triggering Next's development error overlay.
  console.warn(`${scope} ${message}`);
}

async function applyExactQuestionCounts(
  hierarchy: ReturnType<typeof buildPublishedSyllabusHierarchy>,
  examProfileId: string,
  stageCodes?: string[],
): Promise<ReturnType<typeof buildPublishedSyllabusHierarchy>> {
  const mappedSubtopics = hierarchy.subtopics.filter((subtopic) => subtopic.content_id);
  const counts = await getExactExamQuestionCounts({
    examProfileId,
    contentSubtopicIds: mappedSubtopics.map((subtopic) => subtopic.content_id!),
    stageCodes,
  });
  const subtopics = hierarchy.subtopics.map((subtopic) => ({
    ...subtopic,
    question_count: subtopic.content_id ? counts[subtopic.content_id] ?? 0 : 0,
  }));
  const topics = hierarchy.topics.map((topic) => ({
    ...topic,
    question_count: subtopics
      .filter((subtopic) => subtopic.topic_id === topic.id)
      .reduce((sum, subtopic) => sum + subtopic.question_count, 0),
  }));
  const subjects = hierarchy.subjects.map((subject) => ({
    ...subject,
    question_count: topics
      .filter((topic) => topic.subject_id === subject.id)
      .reduce((sum, topic) => sum + topic.question_count, 0),
  }));
  return { subjects, topics, subtopics };
}

async function loadPublicExamExplorerData(): Promise<PublicExamExplorerData | null> {
  const admin = getSupabaseAdmin();
  if (!admin) return null;
  const selectorOptions = await getReadyExamSelectorOptions();
  const cgl = selectorOptions.find((option) => option.exam_code === 'SSC_CGL');
  if (!cgl) return null;

  const versionsResult = await admin
    .from('exam_syllabus_versions')
    .select('id, exam_profile_id, version_code, publication_status, is_current, title')
    .in(
      'exam_profile_id',
      selectorOptions.map((option) => option.exam_profile_id),
    )
    .eq('publication_status', 'published')
    .eq('is_current', true);
  if (versionsResult.error) throw new Error(versionsResult.error.message);

  const versions = (versionsResult.data ?? []) as ExamSyllabusVersionRow[];
  const cglVersion = versions.find((version) => version.exam_profile_id === cgl.exam_profile_id);
  if (!cglVersion || !cgl.can_select || cgl.is_coming_soon) return null;

  const nodesResult = await admin
    .from('exam_syllabus_nodes')
    .select(
      'id, syllabus_version_id, parent_node_id, node_code, node_type, title, description, sort_order, is_active, metadata',
    )
    .eq('syllabus_version_id', cglVersion.id)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('node_code', { ascending: true });
  if (nodesResult.error) throw new Error(nodesResult.error.message);

  const catalog = await getCatalogSnapshot();
  const hierarchy = await applyExactQuestionCounts(
    attachCatalogContentMappings(
      buildPublishedSyllabusHierarchy((nodesResult.data ?? []) as ExamSyllabusNodeRow[]),
      catalog,
    ),
    cgl.exam_profile_id,
  );
  const examSlug = PUBLIC_CGL_SLUG;
  const examHref = `/exams/${examSlug}`;
  const subjects = hierarchy.subjects.map((subject): PublicExamExplorerLink => ({
    label: title(subject.title, subject.slug),
    href: `${examHref}/${subject.slug}`,
    iconKey: subject.icon_key,
  }));

  const pathSubject = hierarchy.subjects.find((subject) =>
    hierarchy.topics.some((topic) => topic.subject_id === subject.id),
  );
  const pathTopic = hierarchy.topics.find((topic) => topic.subject_id === pathSubject?.id);
  const pathSubtopic = hierarchy.subtopics.find(
    (subtopic) => subtopic.topic_id === pathTopic?.id,
  );
  const path: PublicExamExplorerPath | null =
    pathSubject && pathTopic && pathSubtopic
      ? {
      subject: {
        label: title(pathSubject.title, pathSubject.slug),
        href: `${examHref}/${pathSubject.slug}`,
        iconKey: pathSubject.icon_key,
      },
      topic: {
        label: title(pathTopic.title, pathTopic.slug),
        href: `${examHref}/${pathSubject.slug}/${pathTopic.slug}`,
        iconKey: pathTopic.icon_key,
      },
      subtopic: {
        label: title(pathSubtopic.title, pathSubtopic.slug),
        href: `${examHref}/${pathSubject.slug}/${pathTopic.slug}/${pathSubtopic.slug}`,
        iconKey: null,
      },
    }
      : null;

  const ctaHref = '/ssc-cgl';
  const options = selectorOptions.map((option): PublicExamExplorerOption => {
    return {
      code: option.exam_code,
      label: option.short_name ?? title(option.display_title, option.exam_code),
      isAvailable: true,
      href: option.exam_code === 'SSC_CGL' ? '/ssc-cgl' : `/exams/${option.exam_slug}`,
    };
  });

  return {
    examCode: cgl.exam_code,
    examSlug,
    examName: cgl.short_name ?? title(cgl.display_title, cgl.exam_code),
    examDescription: 'Tier I and Tier II preparation through the current published syllabus.',
    options,
    counts: {
      subjects: hierarchy.subjects.length,
      topics: hierarchy.topics.length,
      subtopics: hierarchy.subtopics.length,
    },
    subjects,
    path,
    ctaHref,
    snapshot: {
      exam: {
        id: cgl.content_exam_id ?? cgl.exam_profile_id,
        profile_id: cgl.exam_profile_id,
        syllabus_version_id: cglVersion.id,
        syllabus_version_code: cglVersion.version_code,
        code: cgl.exam_code,
        question_tag: cgl.content_family_code ?? cgl.family_code ?? cgl.exam_code,
        title: cgl.display_title,
        target_date: '',
      },
      overview: {
        total_questions: hierarchy.subtopics.reduce(
          (total, subtopic) => total + subtopic.question_count,
          0,
        ),
        attempted_count: 0,
        correct_count: 0,
        wrong_count: 0,
        total_time_spent_seconds: 0,
        average_time_spent_seconds: 0,
        completion_percent: 0,
        accuracy_percent: 0,
      },
      subjects: hierarchy.subjects,
      topics: hierarchy.topics,
      subtopics: hierarchy.subtopics,
      recent_activity: [],
    },
  };
}

async function fetchPublicExamExplorerData(): Promise<PublicExamExplorerData | null> {
  if (publicExamFetchInFlight) return publicExamFetchInFlight;

  const request = loadPublicExamExplorerData();
  publicExamFetchInFlight = request;
  try {
    return await request;
  } finally {
    if (publicExamFetchInFlight === request) publicExamFetchInFlight = null;
  }
}

const getCachedPublicExamExplorerData = unstable_cache(
  fetchPublicExamExplorerData,
  ['public-exam-explorer-v6'],
  { revalidate: 300 },
);

export async function getPublicExamExplorerData(): Promise<PublicExamExplorerData | null> {
  try {
    const data = await getCachedPublicExamExplorerData();
    if (data) lastKnownPublicExamExplorerData = data;
    return data ?? lastKnownPublicExamExplorerData;
  } catch (error) {
    reportPublicExplorerFailure('[public-exam-explorer]', error);
    return lastKnownPublicExamExplorerData;
  }
}

const getCachedPublicExamSelectorOptions = unstable_cache(
  async (): Promise<PublicExamExplorerOption[]> => {
    const options = await getReadyExamSelectorOptions();
    return options.map((option) => ({
        code: option.exam_code,
        label: option.short_name ?? title(option.display_title, option.exam_code),
        isAvailable: true,
        href: option.exam_code === 'SSC_CGL' ? '/ssc-cgl' : `/exams/${option.exam_slug}`,
      }));
  },
  ['public-exam-selector-ready-v2'],
  { revalidate: 300 },
);

export async function getPublicExamSelectorOptions(): Promise<PublicExamExplorerOption[]> {
  try {
    return await getCachedPublicExamSelectorOptions();
  } catch (error) {
    // Catching outside unstable_cache means transient failures are never cached.
    reportPublicExplorerFailure('[public-exam-selector]', error);
    return [];
  }
}

export async function getPublicExamSyllabus(
  examSlug: string,
  stageCode?: string | null,
): Promise<ExamLearningSnapshot | null> {
  const normalizedSlug = examSlug.trim().toLowerCase();
  if (!normalizedSlug) return null;
  if (normalizedSlug === PUBLIC_CGL_SLUG) {
    const data = await getPublicExamExplorerData();
    return data?.snapshot ?? null;
  }

  const admin = getSupabaseAdmin();
  if (!admin) return null;
  const selectorResult = await admin
    .from('exam_selector_options')
    .select(READY_EXAM_SELECTOR_COLUMNS)
    .eq('exam_slug', normalizedSlug)
    .eq('can_select', true)
    .eq('is_coming_soon', false)
    .gt('active_subject_count', 0)
    .gt('active_topic_count', 0)
    .gt('active_subtopic_count', 0)
    .gt('verified_question_count', 0)
    .maybeSingle();
  if (selectorResult.error) return null;
  const option = normalizeExamSelectorOption(selectorResult.data);
  if (!option || !option.content_exam_id) return null;

  const versionResult = await admin
    .from('exam_syllabus_versions')
    .select('id, exam_profile_id, version_code, publication_status, is_current, title')
    .eq('exam_profile_id', option.exam_profile_id)
    .eq('publication_status', 'published')
    .eq('is_current', true)
    .maybeSingle();
  if (versionResult.error || !versionResult.data) return null;
  const version = versionResult.data as ExamSyllabusVersionRow;

  const nodesResult = await admin
    .from('exam_syllabus_nodes')
    .select('id, syllabus_version_id, parent_node_id, node_code, node_type, title, description, sort_order, is_active, metadata')
    .eq('syllabus_version_id', version.id)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('node_code', { ascending: true });
  if (nodesResult.error) return null;
  let nodes = (nodesResult.data ?? []) as ExamSyllabusNodeRow[];
  const normalizedStageCode = stageCode?.trim() || null;
  if (normalizedStageCode) {
    const [trackResult, mappingsResult] = await Promise.all([
      admin
        .from('exam_preparation_track_options')
        .select('stage_code')
        .eq('exam_profile_id', option.exam_profile_id)
        .eq('stage_code', normalizedStageCode)
        .eq('preparation_mode', 'MCQ')
        .eq('is_available', true)
        .gt('verified_question_count', 0)
        .maybeSingle(),
      admin
        .from('exam_syllabus_node_stage_mappings')
        .select('node_id')
        .eq('exam_profile_id', option.exam_profile_id)
        .eq('syllabus_version_id', version.id)
        .eq('stage_code', normalizedStageCode)
        .eq('is_active', true),
    ]);
    if (trackResult.error || !trackResult.data || mappingsResult.error) return null;

    const includedNodeIds = new Set(
      (mappingsResult.data ?? [])
        .map((row) => typeof row.node_id === 'string' ? row.node_id : '')
        .filter(Boolean),
    );
    if (includedNodeIds.size === 0) return null;

    // Some imports map only leaf nodes. Include their active ancestors so the
    // hierarchy can still be built without admitting sibling stage content.
    const nodesById = new Map(nodes.map((node) => [node.id, node]));
    for (const nodeId of [...includedNodeIds]) {
      let parentId = nodesById.get(nodeId)?.parent_node_id ?? null;
      while (parentId) {
        includedNodeIds.add(parentId);
        parentId = nodesById.get(parentId)?.parent_node_id ?? null;
      }
    }
    nodes = nodes.filter((node) => includedNodeIds.has(node.id));
  }
  const hierarchy = await applyExactQuestionCounts(
    attachCatalogContentMappings(
      buildPublishedSyllabusHierarchy(nodes),
      await getCatalogSnapshot(),
    ),
    option.exam_profile_id,
    normalizedStageCode ? [normalizedStageCode] : undefined,
  );

  return {
    exam: {
      id: option.content_exam_id,
      profile_id: option.exam_profile_id,
      syllabus_version_id: version.id,
      syllabus_version_code: version.version_code,
      code: option.exam_code,
      question_tag: option.content_family_code ?? option.family_code ?? option.exam_code,
      title: option.display_title,
      target_date: '',
    },
    overview: {
      total_questions: hierarchy.subtopics.reduce((sum, row) => sum + row.question_count, 0),
      attempted_count: 0,
      correct_count: 0,
      wrong_count: 0,
      total_time_spent_seconds: 0,
      average_time_spent_seconds: 0,
      completion_percent: 0,
      accuracy_percent: 0,
    },
    subjects: hierarchy.subjects,
    topics: hierarchy.topics,
    subtopics: hierarchy.subtopics,
    recent_activity: [],
  };
}

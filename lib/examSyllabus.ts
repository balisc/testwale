import type {
  ExamLearningSubject,
  ExamLearningSubtopic,
  ExamLearningTopic,
} from '@/lib/examLearning';
import type { LocalizedText } from '@/types/polity';
import type { CatalogSnapshot } from '@/lib/catalogCache';
import type { ExamSyllabusNodeRow } from '@/types/supabase';

function localized(value: LocalizedText | string | null): LocalizedText {
  if (typeof value === 'string') {
    try {
      const parsed: unknown = JSON.parse(value);
      if (parsed && typeof parsed === 'object') {
        const row = parsed as Record<string, unknown>;
        return {
          en: typeof row.en === 'string' ? row.en : undefined,
          hi: typeof row.hi === 'string' ? row.hi : undefined,
        };
      }
    } catch {
      return { en: value, hi: value };
    }
    return { en: value, hi: value };
  }
  return value ?? {};
}

function optionalLocalized(value: LocalizedText | string | null): LocalizedText | null {
  const result = localized(value);
  return result.en || result.hi ? result : null;
}

function metadataString(metadata: Record<string, unknown> | null, key: string): string | null {
  const value = metadata?.[key];
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

/** Stable URL segment derived only from the database node code. */
export function syllabusNodeSlug(nodeCode: string): string {
  return nodeCode.trim().toLowerCase().replace(/_/g, '-');
}

function compareNodes(a: ExamSyllabusNodeRow, b: ExamSyllabusNodeRow): number {
  return (a.sort_order ?? Number.MAX_SAFE_INTEGER) - (b.sort_order ?? Number.MAX_SAFE_INTEGER)
    || a.node_code.localeCompare(b.node_code);
}

function joinedNodeTitles(rows: ExamSyllabusNodeRow[]): LocalizedText | null {
  const en = rows.map((row) => localized(row.title).en?.trim()).filter(Boolean).join(', ');
  const hi = rows.map((row) => localized(row.title).hi?.trim()).filter(Boolean).join(', ');
  return en || hi ? { en: en || undefined, hi: hi || undefined } : null;
}

export function buildPublishedSyllabusHierarchy(rows: ExamSyllabusNodeRow[]): {
  subjects: ExamLearningSubject[];
  topics: ExamLearningTopic[];
  subtopics: ExamLearningSubtopic[];
} {
  const active = rows.filter((row) => row.is_active);
  const subjectNodes = active
    .filter((row) => row.node_type === 'subject' && row.parent_node_id === null)
    .sort(compareNodes);
  const subjectIds = new Set(subjectNodes.map((row) => row.id));
  const topicNodes = active
    .filter((row) => row.node_type === 'topic' && row.parent_node_id != null && subjectIds.has(row.parent_node_id))
    .sort(compareNodes);
  const topicIds = new Set(topicNodes.map((row) => row.id));
  const topicSubjectId = new Map(topicNodes.map((row) => [row.id, row.parent_node_id!]));
  const topicById = new Map(topicNodes.map((row) => [row.id, row]));
  const subtopicNodes = active
    .filter((row) => row.node_type === 'subtopic' && row.parent_node_id != null && topicIds.has(row.parent_node_id))
    .sort(compareNodes);

  const subtopics: ExamLearningSubtopic[] = subtopicNodes.map((row) => ({
    id: row.id,
    topic_id: row.parent_node_id!,
    subject_id: topicSubjectId.get(row.parent_node_id!)!,
    slug: syllabusNodeSlug(row.node_code),
    title: localized(row.title),
    description: optionalLocalized(row.description),
    scope: optionalLocalized(topicById.get(row.parent_node_id!)?.title ?? null),
    sort_order: row.sort_order,
    priority: row.sort_order,
    importance: null,
    importance_label: null,
    is_recommended: false,
    question_count: 0,
    attempted_count: 0,
    correct_count: 0,
    wrong_count: 0,
    total_time_spent_seconds: 0,
    average_time_spent_seconds: 0,
    content_id:
      metadataString(row.metadata, 'content_subtopic_id') ??
      metadataString(row.metadata, 'catalog_subtopic_id') ??
      undefined,
  }));

  const topics: ExamLearningTopic[] = topicNodes.map((row) => ({
    id: row.id,
    subject_id: row.parent_node_id!,
    slug: syllabusNodeSlug(row.node_code),
    title: localized(row.title),
    description: optionalLocalized(row.description),
    scope: joinedNodeTitles(subtopicNodes.filter((item) => item.parent_node_id === row.id)),
    icon_key: metadataString(row.metadata, 'icon_key'),
    sort_order: row.sort_order,
    priority: row.sort_order,
    importance: null,
    is_recommended: false,
    subtopic_count: subtopics.filter((item) => item.topic_id === row.id).length,
    question_count: 0,
    attempted_count: 0,
    correct_count: 0,
    wrong_count: 0,
    total_time_spent_seconds: 0,
    average_time_spent_seconds: 0,
  }));

  const subjects: ExamLearningSubject[] = subjectNodes.map((row) => ({
    id: row.id,
    slug: syllabusNodeSlug(row.node_code),
    title: localized(row.title),
    description: optionalLocalized(row.description),
    icon_key: metadataString(row.metadata, 'icon_key'),
    hero_image_url: metadataString(row.metadata, 'hero_image_url'),
    sort_order: row.sort_order,
    topic_count: topics.filter((item) => item.subject_id === row.id).length,
    subtopic_count: subtopics.filter((item) => item.subject_id === row.id).length,
    question_count: 0,
    attempted_count: 0,
    correct_count: 0,
    wrong_count: 0,
    total_time_spent_seconds: 0,
    average_time_spent_seconds: 0,
  }));

  return { subjects, topics, subtopics };
}

/**
 * Connects immutable, exam-specific syllabus nodes to the shared question catalog.
 * Only an explicit catalog/content subtopic ID stored in node metadata is accepted.
 * Titles and fuzzy labels are presentation data and are never ownership evidence.
 */
export function attachCatalogContentMappings(
  hierarchy: ReturnType<typeof buildPublishedSyllabusHierarchy>,
  catalog: CatalogSnapshot,
): ReturnType<typeof buildPublishedSyllabusHierarchy> {
  const activeSubtopics = catalog.subtopics.filter((row) => row.is_active);
  const topicById = new Map(catalog.topics.filter((row) => row.is_active).map((row) => [row.id, row]));
  const subjectById = new Map(catalog.subjects.filter((row) => row.is_active).map((row) => [row.id, row]));

  const subtopics = hierarchy.subtopics.map((row) => {
    if (!row.content_id) return row;
    const content = activeSubtopics.find((candidate) => candidate.id === row.content_id);
    if (!content) return { ...row, content_id: undefined };
    const contentTopic = topicById.get(content.topic_id);
    const contentSubject = contentTopic ? subjectById.get(contentTopic.subject_id) : undefined;
    if (!contentTopic || !contentSubject) return row;
    return {
      ...row,
      content_id: content.id,
      content_topic_id: contentTopic.id,
      content_subject_id: contentSubject.id,
      question_count: content.question_count ?? 0,
    };
  });

  const topics = hierarchy.topics.map((row) => {
    const children = subtopics.filter((item) => item.topic_id === row.id && item.content_topic_id);
    const contentTopicIds = [...new Set(children.map((item) => item.content_topic_id!))];
    const contentTopic = contentTopicIds.length === 1 ? topicById.get(contentTopicIds[0]!) : undefined;
    return {
      ...row,
      ...(contentTopic
        ? { content_id: contentTopic.id, content_subject_id: contentTopic.subject_id }
        : {}),
      question_count: children.reduce((total, item) => total + item.question_count, 0),
    };
  });

  const subjects = hierarchy.subjects.map((row) => {
    const children = topics.filter((item) => item.subject_id === row.id && item.content_subject_id);
    const contentSubjectIds = [...new Set(children.map((item) => item.content_subject_id!))];
    return {
      ...row,
      ...(contentSubjectIds.length === 1 ? { content_id: contentSubjectIds[0] } : {}),
      question_count: children.reduce((total, item) => total + item.question_count, 0),
    };
  });

  return { subjects, topics, subtopics };
}

export function findPublishedSyllabusSubject(
  subjects: ExamLearningSubject[],
  routeSlug: string,
): ExamLearningSubject | null {
  return subjects.find((row) => row.slug === routeSlug.toLowerCase()) ?? null;
}

export function findPublishedSyllabusTopic(
  topics: ExamLearningTopic[],
  subjectId: string,
  routeSlug: string,
): ExamLearningTopic | null {
  return topics.find(
    (row) => row.subject_id === subjectId && row.slug === routeSlug.toLowerCase(),
  ) ?? null;
}

export function findPublishedSyllabusSubtopic(
  subtopics: ExamLearningSubtopic[],
  topicId: string,
  routeSlug: string,
): ExamLearningSubtopic | null {
  return subtopics.find(
    (row) => row.topic_id === topicId && row.slug === routeSlug.toLowerCase(),
  ) ?? null;
}

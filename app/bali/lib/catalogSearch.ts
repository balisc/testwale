import { getCatalogSnapshot } from '@/lib/catalogCache';
import { getLocalizedText } from '@/lib/localizedText';

export type BaliSearchItemType = 'subject' | 'topic' | 'subtopic';

export type BaliSearchItem = {
  id: string;
  type: BaliSearchItemType;
  label: string;
  labelHi: string;
  href: string;
  /** Breadcrumb path shown under the result, e.g. "Indian Polity › Fundamental Rights" */
  path: string;
};

export async function getBaliCatalogSearchItems(): Promise<BaliSearchItem[]> {
  const { subjects, topics, subtopics } = await getCatalogSnapshot();
  if (!subjects.length) return [];

  const activeSubjects = subjects.filter((s) => s.is_active);
  const subjectById = new Map(activeSubjects.map((s) => [s.id, s]));
  const activeTopics = topics.filter((t) => t.is_active && subjectById.has(t.subject_id));
  const topicById = new Map(activeTopics.map((t) => [t.id, t]));

  const items: BaliSearchItem[] = [];

  for (const subject of activeSubjects) {
    const label = getLocalizedText(subject.title, 'en') || getLocalizedText(subject.title, 'hi');
    const labelHi = getLocalizedText(subject.title, 'hi') || label;
    if (!label) continue;
    items.push({
      id: `subject:${subject.id}`,
      type: 'subject',
      label,
      labelHi,
      href: `/subjects/${subject.slug}`,
      path: 'Subject',
    });
  }

  for (const topic of activeTopics) {
    const subject = subjectById.get(topic.subject_id);
    if (!subject) continue;
    const label = getLocalizedText(topic.title, 'en') || getLocalizedText(topic.title, 'hi');
    const labelHi = getLocalizedText(topic.title, 'hi') || label;
    const subjectLabel =
      getLocalizedText(subject.title, 'en') || getLocalizedText(subject.title, 'hi');
    if (!label) continue;
    items.push({
      id: `topic:${topic.id}`,
      type: 'topic',
      label,
      labelHi,
      href: `/subjects/${subject.slug}/${topic.slug}`,
      path: subjectLabel,
    });
  }

  for (const subtopic of subtopics) {
    if (!subtopic.is_active) continue;
    const topic = topicById.get(subtopic.topic_id);
    if (!topic) continue;
    const subject = subjectById.get(topic.subject_id);
    if (!subject) continue;
    const label = getLocalizedText(subtopic.title, 'en') || getLocalizedText(subtopic.title, 'hi');
    const labelHi = getLocalizedText(subtopic.title, 'hi') || label;
    const topicLabel = getLocalizedText(topic.title, 'en') || getLocalizedText(topic.title, 'hi');
    const subjectLabel =
      getLocalizedText(subject.title, 'en') || getLocalizedText(subject.title, 'hi');
    if (!label) continue;
    items.push({
      id: `subtopic:${subtopic.id}`,
      type: 'subtopic',
      label,
      labelHi,
      href: `/subjects/${subject.slug}/${topic.slug}/${subtopic.slug}/practice`,
      path: `${subjectLabel} › ${topicLabel}`,
    });
  }

  return items;
}

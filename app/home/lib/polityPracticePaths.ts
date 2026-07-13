import {
  getAllExams,
  getExamWiseTopics,
  getSubjectBySlug,
  getTopicsBySubject,
  normalizeExamCode,
  resolveExamCodeFromDb,
} from '@/lib/polity';
import { getLocalizedText } from '@/lib/localizedText';
import type { TopicWithPriority } from '@/types/polity';
import { unstable_cache } from 'next/cache';

export type HomePathPriority = 'High' | 'Medium' | 'Low';

export type HomePathTopic = {
  id: string;
  name: string;
  slug: string;
  priority: HomePathPriority;
  href: string;
};

export type HomePathExamTab = {
  label: string;
  examCode: string;
  topics: HomePathTopic[];
};

const TAB_DEFS = [
  { label: 'SSC', examHint: 'SSC' },
  { label: 'Railway', examHint: 'RAILWAY' },
  { label: 'UPSC', examHint: 'UPSC' },
  { label: 'State PCS', examHint: 'STATE_PCS' },
] as const;

const MAX_TOPICS = 5;

function toPriority(importance: TopicWithPriority['importance']): HomePathPriority {
  const raw =
    typeof importance === 'string'
      ? importance
      : getLocalizedText(importance, 'en') || getLocalizedText(importance, 'hi');
  const key = raw.trim().toLowerCase();
  if (key.startsWith('high') || key === 'उच्च') return 'High';
  if (key.startsWith('low') || key === 'कम') return 'Low';
  return 'Medium';
}

function mapTopics(
  topics: TopicWithPriority[],
  subjectSlug: string,
): HomePathTopic[] {
  return topics.slice(0, MAX_TOPICS).map((topic) => ({
    id: topic.id,
    name: getLocalizedText(topic.title, 'en') || getLocalizedText(topic.title, 'hi') || 'Topic',
    slug: topic.slug,
    priority: toPriority(topic.importance),
    href: `/subjects/${subjectSlug}/${topic.slug}`,
  }));
}

async function fetchHomePolityPracticePaths(): Promise<HomePathExamTab[]> {
  const subject = await getSubjectBySlug('indian-polity');
  if (!subject) return [];

  const exams = await getAllExams();
  const fallbackTopics = await getTopicsBySubject(subject.id);
  const fallbackMapped = mapTopics(
    fallbackTopics
      .filter((topic) => topic.is_active)
      .sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999))
      .map(
        (topic) =>
          ({
            id: topic.id,
            title: topic.title,
            slug: topic.slug,
            description: topic.description,
            icon_key: topic.icon_key,
            subtopic_count: topic.subtopic_count,
            question_count: topic.question_count,
            priority: topic.sort_order ?? 999,
            importance: 'medium',
            is_recommended: true,
          }) satisfies TopicWithPriority,
      ),
    subject.slug,
  );

  const tabs: HomePathExamTab[] = [];

  for (const tab of TAB_DEFS) {
    const examCode = resolveExamCodeFromDb(exams, tab.examHint);
    const examTopics = await getExamWiseTopics(subject.id, examCode);
    const topics =
      examTopics.length > 0
        ? mapTopics(examTopics, subject.slug)
        : fallbackMapped.map((topic) => ({ ...topic }));

    tabs.push({
      label: tab.label,
      examCode: normalizeExamCode(examCode || tab.examHint),
      topics,
    });
  }

  return tabs;
}

export const getHomePolityPracticePaths = unstable_cache(
  fetchHomePolityPracticePaths,
  ['home-polity-practice-paths-v1'],
  { revalidate: 300 },
);

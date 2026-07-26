'use client';

import { useMemo, useState } from 'react';
import type { PolityRankingProgressMaps } from '@/lib/polity/examRankingProgress';
import type { PolitySubtopicRankingRow, PolityTopicRankingRow } from '@/types/polityExamRankingV2';
import TopicPriorityCard from './TopicPriorityCard';

export type TopicFilter = 'recommended' | 'all' | 'high' | 'in_progress' | 'completed';

type TopicPriorityGridProps = {
  topics: PolityTopicRankingRow[];
  subtopics: PolitySubtopicRankingRow[];
  progressMaps: PolityRankingProgressMaps;
  subjectSlug: string;
  examCode: string;
  filter: TopicFilter;
};

function matchesTopicFilter(
  row: PolityTopicRankingRow,
  filter: TopicFilter,
  progressMaps: PolityRankingProgressMaps,
): boolean {
  const progress = progressMaps.byTopicId.get(row.topic_id);
  if (filter === 'recommended') return row.is_recommended;
  if (filter === 'high') return (row.importance ?? '').toLowerCase() === 'high';
  if (filter === 'in_progress') return progress?.state === 'in_progress';
  if (filter === 'completed') return progress?.state === 'completed';
  return true;
}

export default function TopicPriorityGrid({
  topics,
  subtopics,
  progressMaps,
  subjectSlug,
  examCode,
  filter,
}: TopicPriorityGridProps) {
  const [expandedTopicId, setExpandedTopicId] = useState<string | null>(null);

  const firstSubtopicByTopic = useMemo(() => {
    const map = new Map<string, string>();
    for (const row of subtopics) {
      if (!map.has(row.topic_id)) {
        map.set(row.topic_id, row.subtopic.slug);
      }
    }
    return map;
  }, [subtopics]);

  const filteredTopics = useMemo(
    () => topics.filter((row) => matchesTopicFilter(row, filter, progressMaps)),
    [topics, filter, progressMaps],
  );

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {filteredTopics.map((row) => {
        const progress = progressMaps.byTopicId.get(row.topic_id) ?? {
          state: 'not_started' as const,
          attempted: 0,
          total: row.topic.question_count,
          percent: null,
        };

        return (
          <TopicPriorityCard
            key={row.topic_id}
            row={row}
            progress={progress}
            subjectSlug={subjectSlug}
            examCode={examCode}
            expanded={expandedTopicId === row.topic_id}
            onToggleExpand={() =>
              setExpandedTopicId((current) => (current === row.topic_id ? null : row.topic_id))
            }
            firstSubtopicSlug={firstSubtopicByTopic.get(row.topic_id) ?? null}
          />
        );
      })}
    </div>
  );
}

export * from './profileOverviewCore';

import type { ProfilePageData, ProfileTopicTag } from '@/lib/profileAnalytics';
import { buildPracticeHref, clampPercent } from './profileOverviewCore';

export type ContinueLearningItem = {
  title: string;
  href: string;
  mistakes: number;
  accuracy_percent: number;
  progress_percent: number;
  kind: 'weak_topic' | 'recent_topic' | 'fallback';
};

export function pickContinueLearning(data: ProfilePageData): ContinueLearningItem {
  const weakness = data.weaknesses.find(
    (item) => item.subject_slug && item.topic_slug,
  ) as ProfileTopicTag | undefined;

  if (weakness?.subject_slug && weakness.topic_slug) {
    const href = buildPracticeHref({
      subject_slug: weakness.subject_slug,
      topic_slug: weakness.topic_slug,
    });
    if (href) {
      const mistakes = Math.max(
        0,
        weakness.attempts_count -
          Math.round((weakness.accuracy_percent / 100) * weakness.attempts_count),
      );
      return {
        title:
          typeof weakness.topic_title === 'string'
            ? weakness.topic_title
            : (weakness.topic_title?.en ?? 'Topic'),
        href,
        mistakes,
        accuracy_percent: weakness.accuracy_percent,
        progress_percent: clampPercent(weakness.accuracy_percent),
        kind: 'weak_topic',
      };
    }
  }

  const recent = data.recent_attempts?.[0];
  if (recent?.subject_slug && recent.topic_slug) {
    const href = buildPracticeHref({
      subject_slug: recent.subject_slug,
      topic_slug: recent.topic_slug,
    });
    if (href) {
      return {
        title:
          typeof recent.topic_title === 'string'
            ? recent.topic_title
            : (recent.topic_title?.en ?? 'Practice'),
        href,
        mistakes: data.counts.mistakes,
        accuracy_percent: data.overview_metrics?.accuracy_percent ?? 0,
        progress_percent: clampPercent(data.overview_metrics?.accuracy_percent ?? 0),
        kind: 'recent_topic',
      };
    }
  }

  return {
    title: '',
    href: '/subjects',
    mistakes: 0,
    accuracy_percent: 0,
    progress_percent: 0,
    kind: 'fallback',
  };
}

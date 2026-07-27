import { getLocalizedText } from '@/lib/localizedText';
import type { InsightsTopicRow } from '@/lib/profileInsightsTypes';
import type { ProfileInsightsCopy } from '../profileInsightsCopy';
import ProfileProgressBar from './ProfileProgressBar';

type Props = {
  copy: ProfileInsightsCopy;
  subjectTitle: string;
  topics: InsightsTopicRow[];
  language: 'en' | 'hi';
};

export default function ProfileInsightsTopicProgress({ copy, subjectTitle, topics, language }: Props) {
  return (
    <section
      aria-label={copy.topicProgressTitle(subjectTitle)}
      className="rounded-2xl border border-[#E2E8F0] bg-white p-4 sm:p-6"
    >
      <div>
        <h3 className="text-base font-bold text-[#0F172A] sm:text-lg">
          {copy.topicProgressTitle(subjectTitle)}
        </h3>
        <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">{copy.topicProgressHint}</p>
      </div>

      {topics.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">{copy.noAttempts}</p>
      ) : (
        <ul className="mt-4 space-y-3.5">
          {topics.map((topic) => (
            <li key={topic.topic_id}>
              <div className="mb-1 flex items-start justify-between gap-2 text-sm">
                <span className="min-w-0 break-words font-medium text-slate-800">
                  {getLocalizedText(topic.topic_title, language)}
                </span>
                <span className="shrink-0 font-semibold text-brand">{topic.progress_percent}%</span>
              </div>
              <ProfileProgressBar
                value={topic.progress_percent}
                label={`${getLocalizedText(topic.topic_title, language)} ${copy.topicCoverage}`}
              />
              <p className="sr-only">
                {topic.unique_questions} of {topic.total_questions} questions attempted
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

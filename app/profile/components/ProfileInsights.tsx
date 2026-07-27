import { getLocalizedText } from '@/lib/localizedText';
import type { ProfileInsightsData } from '@/lib/profileInsightsTypes';
import type { ProfileInsightsCopy } from '../profileInsightsCopy';
import ProfileInsightsSubjectProgress from './ProfileInsightsSubjectProgress';
import ProfileInsightsCoverage from './ProfileInsightsCoverage';
import ProfileInsightsTopicProgress from './ProfileInsightsTopicProgress';
import { ProfileInsightsFocusNext, ProfileInsightsStrongArea } from './ProfileInsightsActionCards';
import ProfileInsightsByDifficulty from './ProfileInsightsByDifficulty';

type Props = {
  copy: ProfileInsightsCopy;
  data: ProfileInsightsData;
  language: 'en' | 'hi';
  onSetTargetExam: () => void;
};

export default function ProfileInsights({ copy, data, language, onSetTargetExam }: Props) {
  const subjectTitle = data.focus_subject
    ? getLocalizedText(data.focus_subject.subject_title, language)
    : language === 'hi'
      ? 'विषय'
      : 'Subject';

  return (
    <div className="space-y-4 sm:space-y-6">
      {!data.has_any_attempts ? (
        <p className="rounded-2xl border border-[#EDE9FE] bg-[#FAF5FF] px-4 py-3 text-center text-sm text-slate-600">
          {copy.noAttempts}
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr] lg:gap-6">
        <ProfileInsightsSubjectProgress copy={copy} subjects={data.subjects} language={language} />
        <ProfileInsightsCoverage copy={copy} coverage={data.coverage} onSetTargetExam={onSetTargetExam} />
      </div>

      {data.focus_subject ? (
        <ProfileInsightsTopicProgress
          copy={copy}
          subjectTitle={subjectTitle}
          topics={data.focus_topics}
          language={language}
        />
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <ProfileInsightsStrongArea copy={copy} area={data.strong_area} language={language} />
        <ProfileInsightsFocusNext copy={copy} focus={data.focus_next} language={language} />
        <ProfileInsightsByDifficulty copy={copy} rows={data.by_difficulty} language={language} />
      </div>
    </div>
  );
}

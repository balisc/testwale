import Link from 'next/link';
import type { ProfileSavedData } from '@/lib/profileSavedTypes';
import type { ProfileSavedCopy } from '../profileSavedCopy';
import ProfileSavedRevisionQueue from './ProfileSavedRevisionQueue';
import ProfileSavedMistakeRecovery from './ProfileSavedMistakeRecovery';
import ProfileSavedMistakesList from './ProfileSavedMistakesList';
import ProfileSavedLearning from './ProfileSavedLearning';
import ProfileSavedRecentItems from './ProfileSavedRecentItems';

type Props = {
  copy: ProfileSavedCopy;
  data: ProfileSavedData;
  language: 'en' | 'hi';
};

export default function ProfileSaved({ copy, data, language }: Props) {
  return (
    <div className="space-y-4 sm:space-y-6">
      {!data.has_any_data ? (
        <div className="rounded-2xl border border-[#EDE9FE] bg-[#FAF5FF] px-4 py-6 text-center">
          <p className="text-sm text-slate-600">{copy.newUserHint}</p>
          <Link
            href="/subjects"
            className="mt-4 inline-flex min-h-[44px] items-center text-sm font-medium text-brand underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            {copy.browseSubjects}
          </Link>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
        <ProfileSavedRevisionQueue copy={copy} queue={data.revision_queue} language={language} />
        <ProfileSavedMistakeRecovery copy={copy} recovery={data.mistake_recovery} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr] lg:gap-6">
        <ProfileSavedMistakesList
          copy={copy}
          mistakes={data.mistakes_to_review}
          caughtUp={data.caught_up}
          allRecovered={data.all_mistakes_recovered}
        />
        <ProfileSavedLearning copy={copy} counts={data.saved_learning} />
      </div>

      <ProfileSavedRecentItems copy={copy} items={data.recent_saved_items} language={language} />

      {data.caught_up && data.saved_learning.bookmarks + data.saved_learning.notes === 0 ? (
        <p className="text-center text-sm text-emerald-700">{copy.caughtUpHint}</p>
      ) : null}
    </div>
  );
}

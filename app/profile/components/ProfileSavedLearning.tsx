import { Bookmark, FileText, Flag } from 'lucide-react';
import type { SavedLearningCounts } from '@/lib/profileSavedTypes';
import type { ProfileSavedCopy } from '../profileSavedCopy';

type Props = {
  copy: ProfileSavedCopy;
  counts: SavedLearningCounts;
};

type Category = {
  key: string;
  label: string;
  count: number;
  icon: typeof Bookmark;
  hint?: string;
};

export default function ProfileSavedLearning({ copy, counts }: Props) {
  const categories: Category[] = [
    { key: 'bookmarks', label: copy.bookmarks, count: counts.bookmarks, icon: Bookmark },
    { key: 'notes', label: copy.notes, count: counts.notes, icon: FileText },
    {
      key: 'reported',
      label: copy.reportedQuestions,
      count: counts.reported_questions,
      icon: Flag,
      hint: copy.reportedHint,
    },
  ].filter((category) => category.count > 0 || category.key !== 'reported');

  const visible = categories.filter((category) => category.count > 0);

  return (
    <section
      aria-label={copy.savedLearning}
      className="flex h-full min-w-0 flex-col rounded-2xl border border-[#E2E8F0] bg-white p-4 sm:p-6"
    >
      <h3 className="text-base font-bold text-[#0F172A] sm:text-lg">{copy.savedLearning}</h3>

      {visible.length === 0 ? (
        <p className="mt-5 text-sm text-slate-500">{copy.nothingSavedHint}</p>
      ) : (
        <ul className="mt-5 grid grid-cols-2 gap-4">
          {visible.map((category) => {
            const Icon = category.icon;
            return (
              <li key={category.key} className="rounded-xl border border-[#F1F5F9] px-3 py-4 text-center">
                <Icon className="mx-auto h-5 w-5 text-brand" aria-hidden />
                <p className="mt-2 text-2xl font-bold text-brand">{category.count}</p>
                <p className="mt-1 text-xs text-slate-600 sm:text-sm">{category.label}</p>
                {category.hint ? (
                  <p className="mt-1 text-[10px] text-slate-400">{category.hint}</p>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      <p className="mt-4 text-[11px] text-slate-400">{copy.noRecentlyViewed}</p>
    </section>
  );
}

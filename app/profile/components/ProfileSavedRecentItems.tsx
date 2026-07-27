import Link from 'next/link';
import { Bookmark, FileText } from 'lucide-react';
import type { SavedRecentItem } from '@/lib/profileSavedTypes';
import type { ProfileSavedCopy } from '../profileSavedCopy';

type Props = {
  copy: ProfileSavedCopy;
  items: SavedRecentItem[];
  language: 'en' | 'hi';
};

export default function ProfileSavedRecentItems({ copy, items, language }: Props) {
  if (items.length === 0) {
    return (
      <section
        id="recent-saved"
        aria-label={copy.recentSavedItems}
        className="rounded-2xl border border-[#E2E8F0] bg-white p-4 sm:p-6"
      >
        <h3 className="text-base font-bold text-[#0F172A] sm:text-lg">{copy.recentSavedItems}</h3>
        <div className="mt-4 text-center">
          <p className="text-sm font-medium text-slate-700">{copy.nothingSaved}</p>
          <p className="mt-1 text-sm text-slate-500">{copy.nothingSavedHint}</p>
          <Link
            href="/subjects"
            className="mt-4 inline-flex min-h-[44px] items-center text-sm font-medium text-brand underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            {copy.browseSubjects}
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section
      id="recent-saved"
      aria-label={copy.recentSavedItems}
      className="rounded-2xl border border-[#E2E8F0] bg-white p-4 sm:p-6"
    >
      <h3 className="text-base font-bold text-[#0F172A] sm:text-lg">{copy.recentSavedItems}</h3>

      <ul className="mt-4 divide-y divide-[#F1F5F9]">
        {items.map((item) => {
          const Icon = item.type === 'bookmark' ? Bookmark : FileText;
          const timeLabel = language === 'hi' ? item.timestamp_label_hi : item.timestamp_label_en;
          const typeLabel = item.type === 'bookmark' ? copy.bookmarked : copy.noteUpdated;

          return (
            <li
              key={`${item.type}-${item.id}`}
              className="flex flex-wrap items-start gap-3 py-3 sm:flex-nowrap sm:items-center"
            >
              <Icon className="mt-0.5 h-5 w-5 shrink-0 text-brand sm:mt-0" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-slate-800">
                  {item.title}
                  {item.context ? (
                    <span className="font-normal text-slate-500"> — {item.context}</span>
                  ) : null}
                </p>
                <p className="text-xs text-slate-500">
                  {typeLabel} {timeLabel}
                </p>
                {item.preview ? (
                  <p className="mt-1 line-clamp-2 text-sm text-slate-600">{item.preview}</p>
                ) : null}
              </div>
              {item.href ? (
                <Link
                  href={item.href}
                  className="inline-flex min-h-[44px] shrink-0 items-center text-sm font-medium text-brand underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                >
                  {copy.open}
                </Link>
              ) : (
                <span className="text-sm text-slate-400">—</span>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

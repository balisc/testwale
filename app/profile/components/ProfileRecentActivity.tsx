import Link from 'next/link';
import { ClipboardList, PencilLine } from 'lucide-react';
import { formatRelativeTime, type GroupedActivityItem } from '@/lib/profileOverview';
import type { ProfileCopy } from '../profileCopy';

type ProfileRecentActivityProps = {
  copy: ProfileCopy;
  items: GroupedActivityItem[];
  language: 'en' | 'hi';
};

export default function ProfileRecentActivity({ copy, items, language }: ProfileRecentActivityProps) {
  return (
    <section
      aria-label={copy.recentActivity}
      className="flex h-full min-w-0 flex-col rounded-2xl border border-[#E2E8F0] bg-white p-4 sm:p-6"
    >
      <h3 className="text-base font-bold text-[#0F172A] sm:text-lg">{copy.recentActivity}</h3>

      {items.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">{copy.noActivity}</p>
      ) : (
        <ul className="mt-4 space-y-4">
          {items.map((item) => {
            const Icon = item.total > 1 ? ClipboardList : PencilLine;
            const content = (
              <>
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F5F3FF] text-brand"
                  aria-hidden
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="break-words text-sm font-medium text-slate-900">{item.title}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {item.correct}/{item.total} {copy.correct} • {formatRelativeTime(item.created_at, language)}
                  </p>
                </div>
              </>
            );

            return (
              <li key={`${item.title}-${item.created_at}`}>
                {item.href ? (
                  <Link
                    href={item.href}
                    className="flex min-h-[44px] items-start gap-3 rounded-lg transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                  >
                    {content}
                  </Link>
                ) : (
                  <div className="flex items-start gap-3">{content}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

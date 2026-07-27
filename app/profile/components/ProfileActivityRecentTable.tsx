import Link from 'next/link';
import { ClipboardList } from 'lucide-react';
import { formatAverageAnswerTime, formatStudyTime } from '@/lib/profileActivityCore';
import type { ActivityRecentItem } from '@/lib/profileActivityTypes';
import type { ProfileActivityCopy } from '../profileActivityCopy';

type Props = {
  copy: ProfileActivityCopy;
  items: ActivityRecentItem[];
};

function formatDuration(seconds: number | null, notRecorded: string): string {
  if (seconds == null || seconds <= 0) return notRecorded;
  if (seconds < 120) return formatAverageAnswerTime(seconds, notRecorded);
  return formatStudyTime(seconds);
}

export default function ProfileActivityRecentTable({ copy, items }: Props) {
  if (items.length === 0) {
    return (
      <section
        aria-label={copy.recentActivity}
        className="rounded-2xl border border-[#E2E8F0] bg-white p-4 sm:p-6"
      >
        <h3 className="text-base font-bold text-[#0F172A] sm:text-lg">{copy.recentActivity}</h3>
        <p className="mt-4 text-sm text-slate-500">{copy.noRecentActivity}</p>
      </section>
    );
  }

  return (
    <section
      aria-label={copy.recentActivity}
      className="rounded-2xl border border-[#E2E8F0] bg-white p-4 sm:p-6"
    >
      <h3 className="text-base font-bold text-[#0F172A] sm:text-lg">{copy.recentActivity}</h3>

      <div className="mt-4 hidden overflow-x-auto md:block">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead>
            <tr className="border-b border-[#E2E8F0] text-xs uppercase tracking-wide text-slate-500">
              <th scope="col" className="pb-3 pr-4 font-medium">
                {copy.session}
              </th>
              <th scope="col" className="pb-3 pr-4 font-medium">
                {copy.score}
              </th>
              <th scope="col" className="pb-3 pr-4 font-medium">
                {copy.accuracy}
              </th>
              <th scope="col" className="pb-3 pr-4 font-medium">
                {copy.time}
              </th>
              <th scope="col" className="pb-3 font-medium">
                {copy.actions}
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={`${item.title}-${item.created_at}-${index}`} className="border-b border-[#F1F5F9] last:border-0">
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-2">
                    <ClipboardList className="h-4 w-4 shrink-0 text-brand" aria-hidden />
                    <span className="font-medium text-slate-800">{item.title}</span>
                  </div>
                </td>
                <td className="py-3 pr-4 text-slate-700">
                  {item.correct}/{item.total}
                </td>
                <td className="py-3 pr-4 font-medium text-brand">{copy.percentLabel(item.accuracy_percent)}</td>
                <td className="py-3 pr-4 text-slate-600">
                  {formatDuration(item.duration_seconds, copy.notRecorded)}
                </td>
                <td className="py-3">
                  {item.href && item.action ? (
                    <Link
                      href={item.href}
                      className="inline-flex min-h-[44px] items-center text-sm font-medium text-brand underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                    >
                      {item.action === 'review' ? copy.review : copy.view}
                    </Link>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="mt-4 space-y-3 md:hidden">
        {items.map((item, index) => (
          <li
            key={`${item.title}-${item.created_at}-mobile-${index}`}
            className="rounded-xl border border-[#E2E8F0] p-4"
          >
            <div className="flex items-start gap-2">
              <ClipboardList className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-slate-800">{item.title}</p>
                <dl className="mt-2 grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <dt className="text-xs text-slate-500">{copy.score}</dt>
                    <dd>
                      {item.correct}/{item.total}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">{copy.accuracy}</dt>
                    <dd className="font-medium text-brand">{copy.percentLabel(item.accuracy_percent)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">{copy.time}</dt>
                    <dd>{formatDuration(item.duration_seconds, copy.notRecorded)}</dd>
                  </div>
                </dl>
                {item.href && item.action ? (
                  <Link
                    href={item.href}
                    className="mt-3 inline-flex min-h-[44px] items-center text-sm font-medium text-brand underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                  >
                    {item.action === 'review' ? copy.review : copy.view}
                  </Link>
                ) : null}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

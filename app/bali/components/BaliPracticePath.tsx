'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { BaliPathExamTab, BaliPathPriority } from '../lib/polityPracticePaths';

const PRIORITY_STYLE: Record<BaliPathPriority, string> = {
  High: 'bg-[#FFF7ED] text-[#C2410C]',
  Medium: 'bg-[#FFFBEB] text-[#B45309]',
  Low: 'bg-[#F8FAFC] text-[#667085]',
};

type BaliPracticePathProps = {
  tabs: BaliPathExamTab[];
};

export default function BaliPracticePath({ tabs }: BaliPracticePathProps) {
  const safeTabs = tabs.length > 0 ? tabs : [];
  const [tabLabel, setTabLabel] = useState(safeTabs[0]?.label ?? 'SSC');

  const activeTab = useMemo(
    () => safeTabs.find((tab) => tab.label === tabLabel) ?? safeTabs[0] ?? null,
    [safeTabs, tabLabel],
  );

  if (!activeTab) {
    return null;
  }

  return (
    <section className="border-y border-[#E4E7EC] bg-[#FAFAFC] py-16 sm:py-20 max-[479px]:py-10">
      <div className="bali-container w-full">
        <div className="max-w-2xl min-w-0">
          <h2 className="text-[28px] font-bold tracking-tight text-[#18181B] sm:text-[36px] sm:leading-[44px] max-[479px]:text-2xl">
            Not Sure Where to Begin?
          </h2>
          <p className="mt-3 text-base text-[#667085] max-[479px]:text-sm">
            Select your exam and get a recommended Indian Polity topic order.
          </p>
        </div>

        <div className="mt-8 inline-flex max-w-full flex-wrap gap-1 rounded-xl border border-[#E4E7EC] bg-white p-1 max-[479px]:mt-6">
          {safeTabs.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => setTabLabel(item.label)}
              className={`rounded-lg px-3.5 py-2 text-sm font-semibold transition max-[479px]:px-2.5 max-[479px]:text-xs ${
                tabLabel === item.label
                  ? 'bg-[#6D28D9] text-white'
                  : 'text-[#667085] hover:bg-[#F5F3FF] hover:text-[#18181B]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-[#E4E7EC] bg-white">
          <ol className="divide-y divide-[#E4E7EC]">
            {activeTab.topics.map((topic, index) => (
              <li key={topic.id}>
                <Link
                  href={
                    activeTab.examCode
                      ? `${topic.href}?exam=${encodeURIComponent(activeTab.examCode)}`
                      : topic.href
                  }
                  className="flex items-center gap-3 px-4 py-4 transition hover:bg-[#FAFAFC] sm:gap-4 sm:px-6 max-[479px]:px-3 max-[479px]:py-3.5"
                >
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F5F3FF] text-sm font-bold text-[#6D28D9]">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-semibold text-[#18181B] max-[479px]:text-sm max-[479px]:whitespace-normal">
                        {topic.name}
                      </p>
                      <p className="text-xs text-[#98A2B3] max-[479px]:text-[11px]">
                        Recommended for {activeTab.label}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`shrink-0 self-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${PRIORITY_STYLE[topic.priority]}`}
                  >
                    {topic.priority} Priority
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </div>

        <Link
          href={
            activeTab.examCode
              ? `/subjects/indian-polity?exam=${encodeURIComponent(activeTab.examCode)}`
              : '/subjects/indian-polity'
          }
          className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-[#6D28D9] px-5 text-[15px] font-semibold text-white transition hover:bg-[#5B21B6] max-[479px]:w-full max-[479px]:px-4 max-[479px]:text-sm"
        >
          Build My Practice Path
        </Link>
      </div>
    </section>
  );
}

'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  isProfileTabEnabled,
  profileTabHref,
  type ProfileTabId,
} from '@/lib/profileTabAccess';
import type { ProfileCopy } from '../profileCopy';

export type { ProfileTabId };

type TabDef = {
  id: ProfileTabId;
  label: string;
  href: string | null;
  available: boolean;
};

type ProfileTabsProps = {
  copy: ProfileCopy;
  activeTab: ProfileTabId;
};

export default function ProfileTabs({ copy, activeTab }: ProfileTabsProps) {
  const router = useRouter();
  const tabs: TabDef[] = [
    { id: 'overview', label: copy.tabs.overview, href: '/profile', available: isProfileTabEnabled('overview') },
    { id: 'insights', label: copy.tabs.insights, href: profileTabHref('insights'), available: isProfileTabEnabled('insights') },
    { id: 'activity', label: copy.tabs.activity, href: profileTabHref('activity'), available: isProfileTabEnabled('activity') },
    { id: 'saved', label: copy.tabs.saved, href: profileTabHref('saved'), available: isProfileTabEnabled('saved') },
    { id: 'goals', label: copy.tabs.goals, href: profileTabHref('goals'), available: isProfileTabEnabled('goals') },
  ];

  useEffect(() => {
    const paths = [
      '/profile',
      profileTabHref('insights'),
      profileTabHref('activity'),
      profileTabHref('saved'),
      profileTabHref('goals'),
    ];
    for (const path of paths) {
      if (path) router.prefetch(path);
    }
  }, [router]);

  return (
    <div
      role="tablist"
      aria-label={copy.title}
      className="flex w-full min-w-0 max-w-full gap-1 overflow-x-auto overscroll-x-contain border-b border-[#E2E8F0] pb-px [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        const baseClass =
          'shrink-0 whitespace-nowrap border-b-2 px-3 py-3 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:px-4';

        if (tab.available && tab.href) {
          return (
            <Link
              key={tab.id}
              href={tab.href}
              role="tab"
              aria-selected={isActive}
              aria-current={isActive ? 'page' : undefined}
              className={`${baseClass} ${
                isActive
                  ? 'border-brand text-brand'
                  : 'border-transparent text-slate-500 hover:border-[#DDD6FE] hover:text-slate-700'
              }`}
            >
              {tab.label}
            </Link>
          );
        }

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={false}
            aria-disabled="true"
            disabled
            title={copy.comingSoon}
            className={`${baseClass} cursor-not-allowed border-transparent text-slate-300`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

'use client';

import type { LangMode } from '@/app/demo/lib/bilingual';
import { pick } from '@/app/demo/lib/bilingual';
import { companyRuleRevisionContent } from '@/content/revision/indian-polity/company-rule-and-early-acts.v1';
import type { CompanyRuleActProgress } from './useCompanyRuleActProgress';

type Props = {
  mode: LangMode;
  progress: CompanyRuleActProgress;
};

export function HeroProgressCard({ mode, progress }: Props) {
  const { hero } = companyRuleRevisionContent;
  const isGuest = progress.kind === 'guest';
  const label = isGuest
    ? pick(hero.progressGuest, mode)
    : mode === 'hi'
      ? `${progress.total} में से ${progress.completed} अधिनियम अध्याय पूरे`
      : `${progress.completed} of ${progress.total} Act chapters revised`;

  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress.percent / 100) * circumference;

  return (
    <aside className="cr-hero-progress-card" aria-label={mode === 'hi' ? 'रिवीजन प्रगति' : 'Revision progress'}>
      <div className="cr-hero-progress-ring-wrap" aria-hidden={isGuest}>
        <svg className="cr-hero-progress-ring" viewBox="0 0 64 64" role="img">
          <title>{isGuest ? '' : `${progress.percent}%`}</title>
          <circle className="cr-hero-progress-ring-track" cx="32" cy="32" r={radius} />
          <circle
            className="cr-hero-progress-ring-fill"
            cx="32"
            cy="32"
            r={radius}
            strokeDasharray={circumference}
            strokeDashoffset={isGuest ? circumference : offset}
          />
        </svg>
        {!isGuest ? <span className="cr-hero-progress-percent">{progress.percent}%</span> : null}
      </div>
      <p className="cr-hero-progress-label">{label}</p>
    </aside>
  );
}

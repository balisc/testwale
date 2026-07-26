'use client';

import { Bookmark, Building2, Check, Scale, type LucideIcon } from 'lucide-react';
import type { LangMode } from '@/app/demo/lib/bilingual';
import { pick } from '@/app/demo/lib/bilingual';
import type { BiString } from '@/content/revision/indian-polity/company-rule-and-early-acts.v1';
import { uiLabel } from '../uiLabel';
import type { CompanyRuleActProgress } from '../useCompanyRuleActProgress';

type Props = {
  mode: LangMode;
  chapterId: string;
  headingId: string;
  chapterNumber: string;
  year: string;
  title: BiString;
  actName?: BiString;
  secondaryLabel?: BiString;
  identityBadge: BiString;
  markRevised: BiString;
  revised: BiString;
  signInToSave: BiString;
  progress: CompanyRuleActProgress;
  BadgeIcon?: LucideIcon;
};

export function ActChapterHeader({
  mode,
  chapterId,
  headingId,
  chapterNumber,
  year,
  title,
  actName,
  secondaryLabel,
  identityBadge,
  markRevised,
  revised,
  signInToSave,
  progress,
  BadgeIcon = Building2,
}: Props) {
  const isComplete = progress.completedIds.includes(chapterId);
  const isGuest = progress.kind === 'guest';

  function handleMark() {
    if (isGuest) {
      const returnTo = `${window.location.pathname}${window.location.search}`;
      window.location.href = `/login?returnTo=${encodeURIComponent(returnTo)}`;
      return;
    }
    progress.markChapterComplete(chapterId);
  }

  return (
    <header className="cr-act1773-header">
      <div className="cr-act1773-header-main">
        <div className="cr-act1773-header-id">
          <span className="cr-act1773-chapter-num" aria-hidden>
            {chapterNumber}
          </span>
          <span className="cr-act1773-year">{year}</span>
        </div>
        <div className="cr-act1773-header-copy">
          <h2 id={headingId} className="cr-act1773-title">
            {pick(title, mode)}
          </h2>
          {actName ? <p className="cr-act-ch-act-name">{pick(actName, mode)}</p> : null}
          <span className="cr-act1773-identity-badge">
            <BadgeIcon className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {pick(identityBadge, mode)}
          </span>
          {secondaryLabel ? (
            <p className="cr-act-ch-secondary-label">{pick(secondaryLabel, mode)}</p>
          ) : null}
        </div>
      </div>

      <button
        type="button"
        className={`cr-act1773-mark-btn ${isComplete ? 'cr-act1773-mark-btn--done' : ''}`}
        disabled={isComplete}
        onClick={isComplete ? undefined : handleMark}
        aria-pressed={isComplete}
        aria-label={
          isComplete
            ? pick(revised, mode)
            : isGuest
              ? pick(signInToSave, mode)
              : pick(markRevised, mode)
        }
      >
        {isComplete ? (
          <Check className="h-4 w-4 shrink-0" aria-hidden />
        ) : (
          <Bookmark className="h-4 w-4 shrink-0" aria-hidden />
        )}
        <span>{isComplete ? pick(revised, mode) : pick(markRevised, mode)}</span>
        {isComplete ? (
          <span className="sr-only">{uiLabel(mode, 'Chapter marked complete', 'अध्याय पूर्ण चिह्नित')}</span>
        ) : null}
      </button>
    </header>
  );
}

export { Scale as JudiciaryBadgeIcon };

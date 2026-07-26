'use client';

import { Check } from 'lucide-react';
import type { LangMode } from '@/app/demo/lib/bilingual';
import { pick } from '@/app/demo/lib/bilingual';
import {
  COMPANY_RULE_ACT_CHAPTERS,
  companyRuleRevisionContent,
} from '@/content/revision/indian-polity/company-rule-and-early-acts.v1';
import type { CompanyRuleActProgress } from '../useCompanyRuleActProgress';
import { IMPLEMENTED_ACT_CHAPTER_IDS } from './constants';

type Props = {
  mode: LangMode;
  progress: CompanyRuleActProgress;
  onScrollTo: (id: string) => void;
  currentChapterId: string;
  mobileChapterLabel: string;
};

export function ActChapterRail({ mode, progress, onScrollTo, currentChapterId, mobileChapterLabel }: Props) {
  const rail = companyRuleRevisionContent.regulatingAct1773Section;
  const completedSet = new Set(progress.completedIds);

  return (
    <>
      <nav className="cr-act1773-rail print:hidden" aria-label={pick(rail.chapterRailTitle, mode)}>
        <p className="cr-act1773-rail-title">{pick(rail.chapterRailTitle, mode)}</p>
        <ol className="cr-act1773-rail-list">
          {COMPANY_RULE_ACT_CHAPTERS.map((chapter) => {
            const isCurrent = chapter.id === currentChapterId;
            const isCompleted = completedSet.has(chapter.id);
            const isAvailable = IMPLEMENTED_ACT_CHAPTER_IDS.has(chapter.id);
            const statusLabel = isCurrent
              ? pick(rail.chapterRailCurrent, mode)
              : isCompleted
                ? pick({ en: 'Completed', hi: 'पूर्ण' }, mode)
                : pick(rail.chapterRailUpcoming, mode);

            if (isAvailable) {
              return (
                <li
                  key={chapter.id}
                  className={`cr-act1773-rail-item ${isCurrent ? 'cr-act1773-rail-item--current' : ''}`}
                >
                  <button
                    type="button"
                    className="cr-act1773-rail-btn"
                    onClick={() => onScrollTo(chapter.id)}
                    aria-current={isCurrent ? 'step' : undefined}
                  >
                    <span
                      className={`cr-act1773-rail-dot ${isCurrent ? 'cr-act1773-rail-dot--current' : ''} ${isCompleted && !isCurrent ? 'cr-act1773-rail-dot--done' : ''}`}
                    >
                      {isCompleted && !isCurrent ? <Check className="h-3 w-3" aria-hidden /> : null}
                    </span>
                    <span className="cr-act1773-rail-text">
                      <span className="cr-act1773-rail-year">{chapter.year}</span>
                      <span className="cr-act1773-rail-name">{pick(chapter.name, mode)}</span>
                      <span className="cr-act1773-rail-status">{statusLabel}</span>
                    </span>
                  </button>
                </li>
              );
            }

            return (
              <li key={chapter.id} className="cr-act1773-rail-item cr-act1773-rail-item--upcoming">
                <span className="cr-act1773-rail-btn cr-act1773-rail-btn--static" aria-disabled="true">
                  <span className="cr-act1773-rail-dot cr-act1773-rail-dot--upcoming" />
                  <span className="cr-act1773-rail-text">
                    <span className="cr-act1773-rail-year">{chapter.year}</span>
                    <span className="cr-act1773-rail-name">{pick(chapter.name, mode)}</span>
                    <span className="cr-act1773-rail-status">{statusLabel}</span>
                  </span>
                </span>
              </li>
            );
          })}
        </ol>
      </nav>

      <div className="cr-act1773-rail-mobile print:hidden">
        <span className="cr-act1773-rail-mobile-label">
          {pick({ en: 'Act chapter', hi: 'अधिनियम अध्याय' }, mode)}
        </span>
        <span className="cr-act1773-rail-mobile-value">{mobileChapterLabel}</span>
      </div>
    </>
  );
}

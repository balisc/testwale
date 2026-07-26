'use client';

import { Scale } from 'lucide-react';
import { actOfSettlement1781Section } from '@/content/revision/indian-polity/company-rule-act1781-section.v1';
import type { LangMode } from '@/app/demo/lib/bilingual';
import { pick } from '@/app/demo/lib/bilingual';
import { ActChapterHeader, JudiciaryBadgeIcon } from '../act-chapters/ActChapterHeader';
import { ActChapterRail } from '../act-chapters/ActChapterRail';
import { BiText } from '../shared';
import type { CompanyRuleActProgress } from '../useCompanyRuleActProgress';
import { ActExamTrapCard } from '../regulating-act-1773/ActExamTrapCard';
import { ActMemoryFormula } from '../regulating-act-1773/ActMemoryFormula';
import { AdvancedExamDisclosure } from '../regulating-act-1773/AdvancedExamDisclosure';
import { NextActTransition } from '../regulating-act-1773/NextActTransition';
import { BeforeAfterComparison } from './BeforeAfterComparison';
import { BeforeAfterStoryVisual } from './BeforeAfterStoryVisual';
import { ConflictContextDisclosure } from './ConflictContextDisclosure';
import { CorrectionStoryStrip } from './CorrectionStoryStrip';
import { JudicialRouteDiagram } from './JudicialRouteDiagram';
import { JurisdictionBoundaryVisual } from './JurisdictionBoundaryVisual';
import { KeyCorrectionList } from './KeyCorrectionList';
import { MythFactCard } from './MythFactCard';
import { PersonalLawCard } from './PersonalLawCard';
import { ResultLimitationCard } from './ResultLimitationCard';
import { SettlementIllustration } from './SettlementIllustration';

type Props = {
  mode: LangMode;
  progress: CompanyRuleActProgress;
  onScrollTo: (id: string) => void;
};

export function ActOfSettlement1781Section({ mode, progress, onScrollTo }: Props) {
  const s = actOfSettlement1781Section;

  return (
    <section
      id="act-of-settlement-1781"
      className="cr-act1773 print:hidden"
      aria-labelledby="act-of-settlement-1781-heading"
      tabIndex={-1}
    >
      <div className="cr-act1773-layout">
        <ActChapterRail
          mode={mode}
          progress={progress}
          onScrollTo={onScrollTo}
          currentChapterId="act-of-settlement-1781"
          mobileChapterLabel={`${s.chapterNumber} • ${s.year}`}
        />

        <div className="cr-act1773-main">
          <ActChapterHeader
            mode={mode}
            chapterId="act-of-settlement-1781"
            headingId="act-of-settlement-1781-heading"
            chapterNumber={s.chapterNumber}
            year={s.year}
            title={s.title}
            actName={s.actName}
            secondaryLabel={s.secondaryLabel}
            identityBadge={s.identityBadge}
            markRevised={s.markRevised}
            revised={s.revised}
            signInToSave={s.signInToSave}
            progress={progress}
            BadgeIcon={JudiciaryBadgeIcon}
          />

          <div className="cr-act1781-intro-grid">
            <div className="cr-act1781-intro-copy">
              <div className="cr-act1781-why-card">
                <h3 className="cr-act1781-why-title">
                  <Scale className="h-4 w-4 shrink-0 text-[#2563EB]" aria-hidden />
                  {pick(s.whyNeeded.heading, mode)}
                </h3>
                {mode === 'both' ? (
                  <div className="cr-act1773-why-bilingual">
                    <p className="cr-act1773-why-text">{s.whyNeeded.text.en}</p>
                    <p className="cr-act1773-why-text cr-act1773-why-text--hi">{s.whyNeeded.text.hi}</p>
                  </div>
                ) : (
                  <BiText text={s.whyNeeded.text} mode={mode} className="cr-act1773-why-text" />
                )}
              </div>

              <CorrectionStoryStrip mode={mode} stages={s.storyStrip.stages} />
              <BeforeAfterStoryVisual mode={mode} />
              <KeyCorrectionList mode={mode} heading={s.keyCorrections.heading} items={s.keyCorrections.items} />
            </div>

            <div className="cr-act1781-intro-visual">
              <SettlementIllustration mode={mode} />
              <JurisdictionBoundaryVisual mode={mode} data={s.jurisdictionVisual} />
            </div>
          </div>

          <div className="cr-act1781-compare-row">
            <BeforeAfterComparison mode={mode} heading={s.beforeAfter.heading} rows={s.beforeAfter.rows} />
            <aside className="cr-act1781-compare-aside">
              <MythFactCard mode={mode} heading={s.didNotDo.heading} items={s.didNotDo.items} />
              <ActExamTrapCard mode={mode} heading={s.examTrap.heading} text={s.examTrap.text} />
              <ActMemoryFormula mode={mode} heading={s.memoryFormula.heading} formula={s.memoryFormula.formula} />
            </aside>
          </div>

          <div className="cr-act1781-detail-grid">
            <JudicialRouteDiagram mode={mode} data={s.judicialRoute} />
            <PersonalLawCard mode={mode} data={s.personalLaw} />
          </div>

          <ConflictContextDisclosure mode={mode} data={s.conflictDisclosure} />
          <ResultLimitationCard mode={mode} data={s.resultLimitation} />
          <AdvancedExamDisclosure mode={mode} heading={s.advancedExam.heading} items={s.advancedExam.items} />

          <div className="cr-act1781-revision-strip">
            <p className="cr-act1781-revision-strip-text">{pick(s.quickRevisionStrip, mode)}</p>
          </div>

          <NextActTransition
            mode={mode}
            label={s.nextAct.label}
            title={s.nextAct.title}
            button={s.nextAct.button}
            comingSoon={s.nextAct.comingSoon}
            targetExists={false}
            onContinue={() => onScrollTo(s.nextAct.targetId)}
          />
        </div>
      </div>
    </section>
  );
}

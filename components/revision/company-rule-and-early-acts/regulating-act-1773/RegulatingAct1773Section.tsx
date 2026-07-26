'use client';

import { Target } from 'lucide-react';
import { companyRuleRevisionContent } from '@/content/revision/indian-polity/company-rule-and-early-acts.v1';
import type { LangMode } from '@/app/demo/lib/bilingual';
import { pick } from '@/app/demo/lib/bilingual';
import { ActChapterHeader } from '../act-chapters/ActChapterHeader';
import { ActChapterRail } from '../act-chapters/ActChapterRail';
import { BiText } from '../shared';
import type { CompanyRuleActProgress } from '../useCompanyRuleActProgress';
import { ActConflictCard } from './ActConflictCard';
import { ActExamTrapCard } from './ActExamTrapCard';
import { ActMemoryFormula } from './ActMemoryFormula';
import { AdministrativeStructure } from './AdministrativeStructure';
import { AdvancedExamDisclosure } from './AdvancedExamDisclosure';
import { KeyFeatureList } from './KeyFeatureList';
import { NextActTransition } from './NextActTransition';
import { RegulatingActIllustration } from './RegulatingActIllustration';
import { SupremeCourtFactCard } from './SupremeCourtFactCard';

type Props = {
  mode: LangMode;
  progress: CompanyRuleActProgress;
  onScrollTo: (id: string) => void;
};

export function RegulatingAct1773Section({ mode, progress, onScrollTo }: Props) {
  const s = companyRuleRevisionContent.regulatingAct1773Section;

  return (
    <section
      id="regulating-act-1773"
      className="cr-act1773 print:hidden"
      aria-labelledby="regulating-act-1773-heading"
      tabIndex={-1}
    >
      <div className="cr-act1773-layout">
        <ActChapterRail
          mode={mode}
          progress={progress}
          onScrollTo={onScrollTo}
          currentChapterId="regulating-act-1773"
          mobileChapterLabel={`${s.chapterNumber} • ${s.year}`}
        />

        <div className="cr-act1773-main">
          <ActChapterHeader
            mode={mode}
            chapterId="regulating-act-1773"
            headingId="regulating-act-1773-heading"
            chapterNumber={s.chapterNumber}
            year={s.year}
            title={s.title}
            identityBadge={s.identityBadge}
            markRevised={s.markRevised}
            revised={s.revised}
            signInToSave={s.signInToSave}
            progress={progress}
          />

          <div className="cr-act1773-intro-grid">
            <div className="cr-act1773-intro-copy">
              <div className="cr-act1773-why-card">
                <h3 className="cr-act1773-why-title">
                  <Target className="h-4 w-4 shrink-0 text-[#5B2BE0]" aria-hidden />
                  {pick(s.whyIntervened.heading, mode)}
                </h3>
                {mode === 'both' ? (
                  <div className="cr-act1773-why-bilingual">
                    <p className="cr-act1773-why-text">{s.whyIntervened.text.en}</p>
                    <p className="cr-act1773-why-text cr-act1773-why-text--hi">{s.whyIntervened.text.hi}</p>
                  </div>
                ) : (
                  <BiText text={s.whyIntervened.text} mode={mode} className="cr-act1773-why-text" />
                )}
              </div>

              <KeyFeatureList mode={mode} heading={s.keyFeatures.heading} items={s.keyFeatures.items} />
            </div>

            <div className="cr-act1773-intro-aside">
              <RegulatingActIllustration mode={mode} />
              <div className="cr-act1773-aside-cards">
                <ActExamTrapCard mode={mode} heading={s.examTrap.heading} text={s.examTrap.text} />
                <ActMemoryFormula mode={mode} heading={s.memoryFormula.heading} formula={s.memoryFormula.formula} />
              </div>
            </div>
          </div>

          <div className="cr-act1773-detail-grid">
            <AdministrativeStructure
              mode={mode}
              heading={s.adminStructure.heading}
              governorExisting={s.adminStructure.governorExisting}
              elevatedTo={s.adminStructure.elevatedTo}
              firstHolder={s.adminStructure.firstHolder}
              council={s.adminStructure.council}
              presidencies={s.adminStructure.presidencies}
              qualifier={s.adminStructure.qualifier}
            />
            <SupremeCourtFactCard
              mode={mode}
              heading={s.supremeCourtFacts.heading}
              actHighlight={s.supremeCourtFacts.actHighlight}
              establishedHighlight={s.supremeCourtFacts.establishedHighlight}
              rows={s.supremeCourtFacts.rows}
            />
          </div>

          <ActConflictCard
            mode={mode}
            heading={s.conflict.heading}
            points={s.conflict.points}
            bridge={s.conflict.bridge}
          />

          <AdvancedExamDisclosure mode={mode} heading={s.advancedExam.heading} items={s.advancedExam.items} />

          <NextActTransition
            mode={mode}
            label={s.nextAct.label}
            title={s.nextAct.title}
            button={s.nextAct.button}
            comingSoon={s.nextAct.comingSoon}
            targetExists
            onContinue={() => onScrollTo(s.nextAct.targetId)}
          />
        </div>
      </div>
    </section>
  );
}

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { LangMode } from '@/app/demo/lib/bilingual';
import { companyRuleRevisionContent } from '@/content/revision/indian-polity/company-rule-and-early-acts.v1';
import type { RichRevisionClientProps } from '@/lib/revision/richRevisionClients';
import { useLanguage } from '@/lib/LanguageContext';
import { trackRevisionEvent } from '@/lib/revision/trackRevisionEvent';
import { ActOfSettlement1781Section } from './act-of-settlement-1781/ActOfSettlement1781Section';
import { CompleteActTimelineSection } from './CompleteActTimelineSection';
import { RegulatingAct1773Section } from './regulating-act-1773/RegulatingAct1773Section';
import { RevisionBreadcrumb } from './RevisionBreadcrumb';
import { RevisionHero } from './RevisionHero';
import { TopicSiblingNav } from './shared';
import { useCompanyRuleActProgress } from './useCompanyRuleActProgress';
import './revision-ui.css';

type Props = RichRevisionClientProps;

export default function CompanyRuleRevisionClient({ breadcrumb, siblingNav }: Props) {
  const { language } = useLanguage();
  const actProgress = useCompanyRuleActProgress();
  const [mode, setMode] = useState<LangMode>(language);
  const openedRef = useRef(false);
  const content = companyRuleRevisionContent;

  useEffect(() => setMode(language), [language]);

  useEffect(() => {
    if (openedRef.current) return;
    openedRef.current = true;
    trackRevisionEvent('revision_opened', { version: content.version });
  }, [content.version]);

  const scrollTo = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const offset = 120;
      const top = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
      window.history.replaceState(null, '', `#${id}`);
    }
  }, []);

  return (
    <div className="cr-revision cr-revision-page mx-auto max-w-[1450px] px-4 pb-16 pt-4 sm:px-6 lg:px-12">
      <RevisionBreadcrumb
        subjectHref={breadcrumb.subjectHref}
        subjectTitle={breadcrumb.subjectTitle}
        topicHref={breadcrumb.topicHref}
        topicTitle={breadcrumb.topicTitle}
        subtopicTitle={breadcrumb.subtopicTitle}
      />

      <RevisionHero
        mode={mode}
        onStartRevision={() => scrollTo('regulating-act-1773')}
        onViewTimeline={() => scrollTo('complete-act-timeline')}
        progress={actProgress}
      />

      <CompleteActTimelineSection mode={mode} progress={actProgress} onScrollTo={scrollTo} />

      <RegulatingAct1773Section mode={mode} progress={actProgress} onScrollTo={scrollTo} />

      <ActOfSettlement1781Section mode={mode} progress={actProgress} onScrollTo={scrollTo} />

      <TopicSiblingNav topicHref={breadcrumb.topicHref} siblingNav={siblingNav} mode={mode} />
    </div>
  );
}

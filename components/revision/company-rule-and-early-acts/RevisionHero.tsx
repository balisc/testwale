'use client';

import {
  ArrowRight,
  BookOpen,
  Calendar,
  ChevronRight,
  GitCompare,
  Scale,
  Shield,
  Target,
  type LucideIcon,
} from 'lucide-react';
import { Reveal } from '@/app/demo/lib/Reveal';
import type { LangMode } from '@/app/demo/lib/bilingual';
import { pick } from '@/app/demo/lib/bilingual';
import { companyRuleRevisionContent } from '@/content/revision/indian-polity/company-rule-and-early-acts.v1';
import { HeroProgressCard } from './HeroProgressCard';
import { HeroVisualCard } from './HeroVisualCard';
import { BiText } from './shared';
import type { CompanyRuleActProgress } from './useCompanyRuleActProgress';

const CHIP_ICONS: Record<string, LucideIcon> = {
  calendar: Calendar,
  acts: Shield,
  compare: GitCompare,
  exams: Target,
};

type Props = {
  mode: LangMode;
  onStartRevision: () => void;
  onViewTimeline: () => void;
  progress: CompanyRuleActProgress;
};

export function RevisionHero({ mode, onStartRevision, onViewTimeline, progress }: Props) {
  const { hero } = companyRuleRevisionContent;

  return (
    <section className="cr-hero-ref" aria-labelledby="revision-hero-title">
      <Reveal className="cr-hero-ref-grid" eager>
        <div className="cr-hero-ref-copy">
          <p className="cr-hero-ref-eyebrow">{pick(hero.eyebrow, mode)}</p>

          <h1 id="revision-hero-title" className="cr-hero-ref-title">
            {pick(hero.title, mode)}
          </h1>

          <span className="cr-hero-ref-title-rule" aria-hidden />

          <p className="cr-hero-ref-subtitle">{pick(hero.subtitle, mode)}</p>

          <BiText text={hero.description} mode={mode} className="cr-hero-ref-desc" />

          <ul className="cr-hero-chip-list">
            {hero.chips.map((chip) => {
              const Icon = CHIP_ICONS[chip.icon] ?? Scale;
              return (
                <li key={chip.icon}>
                  <span className={`cr-hero-chip cr-hero-chip--${chip.tone}`}>
                    <Icon className="h-4 w-4 shrink-0" aria-hidden />
                    {pick(chip.label, mode)}
                  </span>
                </li>
              );
            })}
          </ul>

          <div className="cr-hero-ref-actions print:hidden">
            <button
              type="button"
              onClick={onStartRevision}
              className="cr-hero-cta cr-hero-cta--primary"
              aria-label={mode === 'hi' ? 'पहले अध्याय पर रिवीजन शुरू करें' : 'Start revision at first chapter'}
            >
              <BookOpen className="h-5 w-5" aria-hidden />
              {pick(hero.ctaPrimary, mode)}
              <ChevronRight className="h-5 w-5" aria-hidden />
            </button>
            <button
              type="button"
              onClick={onViewTimeline}
              className="cr-hero-cta cr-hero-cta--secondary"
              aria-label={mode === 'hi' ? 'पूरी समयरेखा पर जाएँ' : 'Jump to complete timeline section'}
            >
              <ArrowRight className="h-5 w-5" aria-hidden />
              {pick(hero.ctaSecondary, mode)}
            </button>
          </div>

          <HeroProgressCard mode={mode} progress={progress} />
        </div>

        <div className="cr-hero-ref-visual">
          <HeroVisualCard mode={mode} />
        </div>
      </Reveal>
    </section>
  );
}

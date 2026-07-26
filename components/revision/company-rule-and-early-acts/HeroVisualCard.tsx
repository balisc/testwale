'use client';

import type { LangMode } from '@/app/demo/lib/bilingual';
import { pick } from '@/app/demo/lib/bilingual';
import {
  COMPANY_RULE_ACT_CHAPTERS,
  companyRuleRevisionContent,
} from '@/content/revision/indian-polity/company-rule-and-early-acts.v1';

type Props = {
  mode: LangMode;
};

function ParliamentBuilding() {
  return (
    <svg viewBox="0 0 72 56" className="cr-hero-node-icon" aria-hidden>
      <rect x="8" y="24" width="56" height="28" rx="2" fill="#EEF2FF" stroke="#5B2BE0" strokeWidth="1.5" />
      <path d="M36 8 L62 24 H10 Z" fill="#F5F3FF" stroke="#5B2BE0" strokeWidth="1.5" strokeLinejoin="round" />
      <rect x="18" y="32" width="8" height="14" rx="1" fill="#C4B5FD" />
      <rect x="32" y="32" width="8" height="14" rx="1" fill="#C4B5FD" />
      <rect x="46" y="32" width="8" height="14" rx="1" fill="#C4B5FD" />
      <rect x="30" y="14" width="12" height="8" rx="1" fill="#DC2626" opacity="0.85" />
      <rect x="32" y="16" width="4" height="4" fill="#fff" />
      <rect x="36" y="16" width="4" height="4" fill="#2563EB" />
    </svg>
  );
}

function EastIndiaHouseBuilding() {
  return (
    <svg viewBox="0 0 72 56" className="cr-hero-node-icon" aria-hidden>
      <rect x="10" y="18" width="52" height="34" rx="2" fill="#F5F3FF" stroke="#5B2BE0" strokeWidth="1.5" />
      <path d="M36 10 L58 18 H14 Z" fill="#EDE9FE" stroke="#5B2BE0" strokeWidth="1.5" strokeLinejoin="round" />
      <rect x="16" y="24" width="10" height="20" rx="1" fill="#DDD6FE" />
      <rect x="31" y="24" width="10" height="20" rx="1" fill="#DDD6FE" />
      <rect x="46" y="24" width="10" height="20" rx="1" fill="#DDD6FE" />
      <rect x="30" y="12" width="12" height="8" rx="1" fill="#5B2BE0" />
    </svg>
  );
}

function CourtDirectorsBuilding() {
  return (
    <svg viewBox="0 0 72 56" className="cr-hero-node-icon" aria-hidden>
      <rect x="12" y="20" width="48" height="32" rx="2" fill="#FAFAFA" stroke="#64748B" strokeWidth="1.5" />
      <rect x="20" y="28" width="8" height="16" rx="1" fill="#E2E8F0" />
      <rect x="32" y="28" width="8" height="16" rx="1" fill="#E2E8F0" />
      <rect x="44" y="28" width="8" height="16" rx="1" fill="#E2E8F0" />
      <path d="M12 20 H60" stroke="#94A3B8" strokeWidth="2" />
      <circle cx="36" cy="14" r="4" fill="#5B2BE0" opacity="0.35" />
    </svg>
  );
}

function FortWilliamBuilding() {
  return (
    <svg viewBox="0 0 72 56" className="cr-hero-node-icon" aria-hidden>
      <rect x="14" y="22" width="44" height="28" rx="1" fill="#FEF3C7" stroke="#92400E" strokeWidth="1.5" />
      <rect x="10" y="18" width="10" height="32" rx="1" fill="#FDE68A" stroke="#92400E" strokeWidth="1.5" />
      <rect x="52" y="18" width="10" height="32" rx="1" fill="#FDE68A" stroke="#92400E" strokeWidth="1.5" />
      <rect x="28" y="30" width="16" height="20" rx="1" fill="#FBBF24" stroke="#92400E" strokeWidth="1.2" />
      <rect x="30" y="10" width="12" height="8" rx="1" fill="#FF9933" />
      <rect x="30" y="10" width="12" height="2.5" fill="#fff" opacity="0.9" />
      <rect x="30" y="12.5" width="12" height="2.5" fill="#138808" opacity="0.9" />
      <rect x="30" y="15" width="12" height="2.5" fill="#000080" opacity="0.85" />
    </svg>
  );
}

function ActDocument() {
  return (
    <svg viewBox="0 0 28 34" className="cr-hero-act-doc" aria-hidden>
      <path
        d="M4 2 H18 L24 8 V32 H4 Z"
        fill="#FFFBEB"
        stroke="#D97706"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path d="M18 2 V8 H24" fill="#FEF3C7" stroke="#D97706" strokeWidth="1.2" strokeLinejoin="round" />
      <line x1="8" y1="14" x2="20" y2="14" stroke="#D97706" strokeWidth="1" opacity="0.5" />
      <line x1="8" y1="18" x2="20" y2="18" stroke="#D97706" strokeWidth="1" opacity="0.5" />
      <circle cx="14" cy="26" r="4" fill="#DC2626" opacity="0.75" />
    </svg>
  );
}

function FlowArrow() {
  return (
    <span className="cr-hero-flow-arrow" aria-hidden>
      <svg width="24" height="12" viewBox="0 0 24 12" fill="none">
        <path d="M0 6H16M16 6L12 2M16 6L12 10" stroke="#A78BFA" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </span>
  );
}

const NODE_ICONS = {
  parliament: ParliamentBuilding,
  'east-india-house': EastIndiaHouseBuilding,
  'court-of-directors': CourtDirectorsBuilding,
  'fort-william': FortWilliamBuilding,
} as const;

export function HeroVisualCard({ mode }: Props) {
  const { hero } = companyRuleRevisionContent;
  const hierarchyAlt =
    mode === 'hi'
      ? 'British Parliament से Fort William तक शक्ति का क्रमिक केंद्रीकरण'
      : 'Gradual centralisation of authority from British Parliament to Fort William';

  return (
    <div className="cr-hero-visual-card">
      <div className="cr-hero-hierarchy" aria-label={hierarchyAlt}>
        <div className="cr-hero-hierarchy-track">
          {hero.hierarchy.nodes.map((node, index) => {
            const Icon = NODE_ICONS[node.id as keyof typeof NODE_ICONS];
            return (
              <div key={node.id} className="cr-hero-hierarchy-item">
                <div className="cr-hero-hierarchy-node">
                  {Icon ? <Icon /> : null}
                  <p className="cr-hero-hierarchy-label">{pick(node.label, mode)}</p>
                  <p className="cr-hero-hierarchy-caption">{pick(node.caption, mode)}</p>
                </div>
                {index < hero.hierarchy.nodes.length - 1 ? <FlowArrow /> : null}
              </div>
            );
          })}
        </div>
      </div>

      <div className="cr-hero-timeline-block">
        <div className="cr-hero-timeline-banner" aria-hidden>
          <span className="cr-hero-timeline-end">1773</span>
          <span className="cr-hero-timeline-banner-text">{pick(hero.hierarchy.banner, mode)}</span>
          <span className="cr-hero-timeline-end">1853</span>
        </div>

        <div
          className="cr-hero-timeline-scroll"
          role="list"
          aria-label={mode === 'hi' ? '1773–1853 अधिनियम समयरेखा' : '1773–1853 Acts timeline'}
        >
          <div className="cr-hero-timeline-rail" aria-hidden />
          <div className="cr-hero-timeline-items">
            {COMPANY_RULE_ACT_CHAPTERS.map((act, index) => (
              <div key={act.id} className="cr-hero-timeline-item" role="listitem">
                <span className="cr-hero-timeline-dot">{index + 1}</span>
                <span className="cr-hero-timeline-year">{act.year}</span>
                <ActDocument />
                <span className="cr-hero-timeline-act">{pick(act.name, mode)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

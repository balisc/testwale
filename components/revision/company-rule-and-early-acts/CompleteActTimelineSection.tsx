'use client';

import { useMemo, useState, type KeyboardEvent } from 'react';
import type { LangMode } from '@/app/demo/lib/bilingual';
import { pick } from '@/app/demo/lib/bilingual';
import { companyRuleRevisionContent } from '@/content/revision/indian-polity/company-rule-and-early-acts.v1';
import { StoryTimelineVisual } from './StoryTimelineVisual';
import { BiText } from './shared';
import { uiLabel } from './uiLabel';
import type { CompanyRuleActProgress } from './useCompanyRuleActProgress';

type Props = {
  mode: LangMode;
  progress: CompanyRuleActProgress;
  onScrollTo: (id: string) => void;
};

const STAGE_ICONS = {
  landmark: '🏛️',
  scale: '⚖️',
  ship: '⛵',
  building: '🏢',
} as const;

const CATEGORY_CLASS = {
  control: 'cr-story-cat--control',
  judiciary: 'cr-story-cat--judiciary',
  trade: 'cr-story-cat--trade',
  administration: 'cr-story-cat--administration',
  legislation: 'cr-story-cat--legislation',
} as const;

export function CompleteActTimelineSection({ mode, progress, onScrollTo }: Props) {
  const section = companyRuleRevisionContent.storyTimelineSection;
  const milestones = section.milestones;
  const [activeId, setActiveId] = useState(milestones[0]?.id ?? 'regulating-act-1773');

  const active = milestones.find((m) => m.id === activeId) ?? milestones[0];

  const completedSet = useMemo(
    () => new Set(progress.completedIds),
    [progress.completedIds],
  );

  function selectMilestone(id: string) {
    setActiveId(id);
  }

  function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next = index;
    if (event.key === 'ArrowRight') next = Math.min(index + 1, milestones.length - 1);
    else if (event.key === 'ArrowLeft') next = Math.max(index - 1, 0);
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = milestones.length - 1;
    else return;
    event.preventDefault();
    selectMilestone(milestones[next]!.id);
    document.getElementById(`story-milestone-tab-${milestones[next]!.id}`)?.focus();
  }

  function milestoneStatus(id: string): 'completed' | 'current' | 'upcoming' {
    if (id === activeId) return 'current';
    if (completedSet.has(id)) return 'completed';
    return 'upcoming';
  }

  function statusLabel(status: 'completed' | 'current' | 'upcoming') {
    return pick(section.statusLabels[status], mode);
  }

  if (!active) return null;

  return (
    <section
      id="complete-act-timeline"
      className="cr-story-timeline print:hidden"
      aria-labelledby="complete-act-timeline-heading"
    >
      <header className="cr-story-timeline-header">
        <span className="cr-story-timeline-num" aria-hidden>
          {section.sectionNumber}
        </span>
        <p className="cr-story-timeline-eyebrow">{pick(section.eyebrow, mode)}</p>
        <h2 id="complete-act-timeline-heading" className="cr-story-timeline-title">
          {pick(section.title, mode)}
        </h2>
        <BiText text={section.description} mode={mode} className="cr-story-timeline-desc" />
      </header>

      <div className="cr-story-timeline-shell">
        <div className="cr-story-overview-card">
          <div className="cr-story-overview-head">
            <h3 className="cr-story-overview-title">{pick(section.storyInOneView, mode)}</h3>
            <p className="cr-story-flow-line">{pick(section.transformationFlow, mode)}</p>
          </div>

          <div className="cr-story-overview-grid">
            <div className="cr-story-stages">
              {section.storyStages.map((stage, index) => (
                <article key={stage.id} className="cr-story-stage">
                  {index > 0 ? <span className="cr-story-stage-connector" aria-hidden /> : null}
                  <div className="cr-story-stage-icon" aria-hidden>
                    {STAGE_ICONS[stage.icon]}
                  </div>
                  <p className="cr-story-stage-date">{stage.dateRange}</p>
                  <h4 className="cr-story-stage-title">{pick(stage.title, mode)}</h4>
                  <BiText text={stage.text} mode={mode} className="cr-story-stage-text" />
                </article>
              ))}
            </div>

            <StoryTimelineVisual mode={mode} />
          </div>
        </div>

        <div className="cr-story-timeline-card">
          <div className="cr-story-timeline-card-head">
            <div>
              <h3 className="cr-story-timeline-card-title">{pick(section.timelineTitle, mode)}</h3>
              <p className="cr-story-timeline-card-hint">{pick(section.timelineHint, mode)}</p>
            </div>
            <ul className="cr-story-status-legend" aria-label={uiLabel(mode, 'Timeline status', 'समयरेखा स्थिति')}>
              <li>
                <span className="cr-story-status-dot cr-story-status-dot--completed" aria-hidden />
                {pick(section.statusLabels.completed, mode)}
              </li>
              <li>
                <span className="cr-story-status-dot cr-story-status-dot--current" aria-hidden />
                {pick(section.statusLabels.current, mode)}
              </li>
              <li>
                <span className="cr-story-status-dot cr-story-status-dot--upcoming" aria-hidden />
                {pick(section.statusLabels.upcoming, mode)}
              </li>
            </ul>
          </div>

          <div className="cr-story-milestone-rail" aria-hidden>
            <span className="cr-story-milestone-rail-line" />
            {milestones.map((milestone, index) => {
              const status = milestoneStatus(milestone.id);
              return (
                <span
                  key={milestone.id}
                  className={`cr-story-milestone-node cr-story-milestone-node--${status}`}
                  style={{ left: `${(index / (milestones.length - 1)) * 100}%` }}
                >
                  {status === 'completed' ? '✓' : index + 1}
                </span>
              );
            })}
          </div>

          <div
            className="cr-story-milestone-cards"
            role="tablist"
            aria-label={pick(section.timelineTitle, mode)}
          >
            {milestones.map((milestone, index) => {
              const status = milestoneStatus(milestone.id);
              const selected = milestone.id === activeId;
              return (
                <button
                  key={milestone.id}
                  type="button"
                  role="tab"
                  id={`story-milestone-tab-${milestone.id}`}
                  aria-selected={selected}
                  aria-controls={`story-milestone-panel-${milestone.id}`}
                  tabIndex={selected ? 0 : -1}
                  className={`cr-story-act-card cr-story-act-card--${status} ${selected ? 'cr-story-act-card--active' : ''}`}
                  onClick={() => selectMilestone(milestone.id)}
                  onKeyDown={(e) => handleTabKeyDown(e, index)}
                >
                  <span className="cr-story-act-card-year">{milestone.year}</span>
                  <span className="cr-story-act-card-name">{pick(milestone.name, mode)}</span>
                  <span className={`cr-story-act-card-status cr-story-act-card-status--${status}`}>
                    {statusLabel(status)}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="cr-story-timeline-body">
            {milestones.map((milestone) => {
              const selected = milestone.id === activeId;
              const status = milestoneStatus(milestone.id);
              return (
                <article
                  key={milestone.id}
                  id={`story-milestone-panel-${milestone.id}`}
                  role="tabpanel"
                  aria-labelledby={`story-milestone-tab-${milestone.id}`}
                  hidden={!selected}
                  className={`cr-story-milestone-panel ${selected ? 'cr-story-milestone-panel--active' : ''}`}
                >
                  <div className="cr-story-milestone-panel-head">
                    <span className={`cr-story-cat-badge ${CATEGORY_CLASS[milestone.category]}`}>
                      {pick(
                        section.legend.find((l) => l.category === milestone.category)?.label ?? {
                          en: milestone.category,
                          hi: milestone.category,
                        },
                        mode,
                      )}
                    </span>
                    <p className="cr-story-milestone-panel-year">{milestone.year}</p>
                    <h4 className="cr-story-milestone-panel-name">{pick(milestone.name, mode)}</h4>
                  </div>
                  <BiText text={milestone.summary} mode={mode} className="cr-story-milestone-panel-summary" />
                  <p className="cr-story-milestone-key">
                    <span className="cr-story-milestone-key-label">
                      {uiLabel(mode, 'Key change', 'मुख्य परिवर्तन')}:
                    </span>{' '}
                    {pick(milestone.keyChange, mode)}
                  </p>
                  <span className={`cr-story-panel-status cr-story-panel-status--${status}`}>
                    {statusLabel(status)}
                  </span>
                </article>
              );
            })}

            <aside className="cr-story-quick-recall" aria-label={uiLabel(mode, 'Quick recall', 'त्वरित स्मरण')}>
              {section.quickRecall.map((item) => (
                <div key={item.label.en} className="cr-story-quick-recall-item">
                  <span className="cr-story-quick-recall-value">{item.value}</span>
                  <span className="cr-story-quick-recall-label">{pick(item.label, mode)}</span>
                </div>
              ))}
            </aside>
          </div>
        </div>
      </div>

      <ul className="cr-story-category-legend">
        {section.legend.map((item) => (
          <li key={item.category}>
            <span className={`cr-story-cat-swatch ${CATEGORY_CLASS[item.category]}`} aria-hidden />
            {pick(item.label, mode)}
          </li>
        ))}
      </ul>

      <div className="cr-story-memory-strip">
        <p className="cr-story-memory-strip-text">{pick(section.memoryStrip, mode)}</p>
      </div>

      <p className="cr-story-tip">{pick(section.tip, mode)}</p>

      <div className="cr-story-continuation">
        <button
          type="button"
          className="cr-story-continuation-btn"
          onClick={() => onScrollTo('regulating-act-1773')}
        >
          {pick(section.continuation, mode)}
        </button>
      </div>
    </section>
  );
}

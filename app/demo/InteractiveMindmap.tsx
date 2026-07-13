'use client';

import { useId, useState } from 'react';
import type { MindmapNode } from '@/content/revision/indian-polity/sources-of-indian-constitution.v1';
import { sourcesRevisionContent } from '@/content/revision/indian-polity/sources-of-indian-constitution.v1';
import { SOURCE_VISUAL, type SourceKey } from './lib/revisionVisualTokens';
import type { LangMode } from './lib/bilingual';
import { BiText, pick } from './lib/bilingual';

const NODE_SOURCE: Record<string, SourceKey | undefined> = {
  indian: 'indian',
  colonial: 'colonial',
  foreign: 'foreign',
  adapt: 'adapt',
  'britain-node': 'britain',
  'usa-node': 'usa',
  'ireland-node': 'ireland',
  'france-node': 'france',
  'canada-node': 'canada',
};

function Outline({ node, mode, depth = 0 }: { node: MindmapNode; mode: LangMode; depth?: number }) {
  return (
    <li>
      <BiText text={node.label} mode={mode} as="span" className="text-sm text-slate-700" />
      {node.children?.length ? (
        <ul className={`mt-1 space-y-1 ${depth === 0 ? 'ml-4 list-disc' : 'ml-4 list-[circle]'}`}>
          {node.children.map((child) => (
            <Outline key={child.id} node={child} mode={mode} depth={depth + 1} />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export function InteractiveMindmap({
  mode,
  selected,
  onSelectSource,
}: {
  mode: LangMode;
  selected: SourceKey | null;
  onSelectSource: (key: SourceKey | null) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const root = sourcesRevisionContent.mindmap.root as MindmapNode;
  const titleId = useId();

  return (
    <section aria-labelledby={titleId} className="min-w-0 rounded-2xl border border-slate-200 bg-white p-3 min-[360px]:p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2 min-[360px]:gap-3">
        <h2 id={titleId} className="min-w-0 break-words text-base font-semibold text-slate-900 min-[360px]:text-lg">
          {pick(sourcesRevisionContent.mindmap.title, mode === 'both' ? 'en' : mode)}
        </h2>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
          aria-expanded={expanded}
        >
          {expanded ? (mode === 'hi' ? 'संक्षिप्त' : 'Collapse') : mode === 'hi' ? 'विस्तार' : 'Expand'}
        </button>
      </div>

      <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Legend">
        {(['indian', 'colonial', 'britain', 'usa', 'ireland', 'france', 'canada'] as SourceKey[]).map((k) => {
          const v = SOURCE_VISUAL[k];
          return (
            <li key={k}>
              <button
                type="button"
                onClick={() => onSelectSource(selected === k ? null : k)}
                className="inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[10px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
                style={{
                  borderColor: selected === k ? v.hex : v.border,
                  background: v.soft,
                  color: v.hex,
                  boxShadow: selected === k ? `0 0 0 2px ${v.hex}66` : undefined,
                }}
                aria-pressed={selected === k}
              >
                <span className="h-2 w-2 rounded-full" style={{ background: v.hex }} aria-hidden />
                {pick(v.label, mode === 'both' ? 'en' : mode)}
              </button>
            </li>
          );
        })}
      </ul>

      {expanded ? (
        <div className="mt-4 min-w-0">
          <div className="min-w-0 w-full" role="tree" aria-label={pick(sourcesRevisionContent.mindmap.title, 'en')}>
            <div className="mb-3 inline-flex max-w-full break-words rounded-xl border border-brand/25 bg-[#F5F3FF] px-2.5 py-2 text-xs font-semibold text-brand min-[360px]:px-3 min-[360px]:text-sm">
              {pick(root.label, mode)}
            </div>
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2" role="group">
              {(root.children ?? []).map((branch) => {
                const branchKey = NODE_SOURCE[branch.id];
                const accent = branchKey ? SOURCE_VISUAL[branchKey] : null;
                const branchActive =
                  branchKey &&
                  (selected === branchKey ||
                    (branchKey === 'foreign' &&
                      selected &&
                      ['britain', 'usa', 'ireland', 'france', 'canada'].includes(selected)));
                return (
                  <li
                    key={branch.id}
                    className="rounded-xl border p-3 transition"
                    style={{
                      borderColor: branchActive ? accent?.hex ?? '#E2E8F0' : accent?.border ?? '#E2E8F0',
                      background: branchActive ? accent?.soft ?? '#F8FAFC' : '#F8FAFC',
                      boxShadow: branchActive && accent ? `0 0 0 2px ${accent.hex}55` : undefined,
                    }}
                  >
                    <button
                      type="button"
                      className="w-full text-left text-sm font-semibold text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
                      onClick={() => {
                        if (!branchKey) return;
                        if (branchKey === 'foreign') {
                          onSelectSource(selected && ['britain', 'usa', 'ireland', 'france', 'canada'].includes(selected) ? null : 'britain');
                          return;
                        }
                        onSelectSource(selected === branchKey ? null : branchKey);
                      }}
                      aria-pressed={Boolean(branchActive)}
                    >
                      {pick(branch.label, mode)}
                    </button>
                    {(branch.children ?? []).length > 0 ? (
                      <ul className="mt-2 space-y-2 border-l-2 pl-3" style={{ borderColor: accent?.border ?? '#E2E8F0' }}>
                        {(branch.children ?? []).map((child) => {
                          const childKey = NODE_SOURCE[child.id];
                          const childAccent = childKey ? SOURCE_VISUAL[childKey] : null;
                          const childActive = childKey && selected === childKey;
                          return (
                            <li key={child.id}>
                              {childKey ? (
                                <button
                                  type="button"
                                  onClick={() => onSelectSource(selected === childKey ? null : childKey)}
                                  className={`w-full rounded-lg px-2 py-1.5 text-left text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 ${
                                    childActive ? 'text-white' : 'text-slate-700 hover:bg-white'
                                  }`}
                                  style={
                                    childActive
                                      ? { background: childAccent?.hex }
                                      : childAccent
                                        ? { background: childAccent.soft }
                                        : undefined
                                  }
                                  aria-pressed={Boolean(childActive)}
                                >
                                  {pick(child.label, mode)}
                                </button>
                              ) : (
                                <p className="text-xs font-semibold text-slate-700">{pick(child.label, mode)}</p>
                              )}
                              {(child.children ?? []).length > 0 ? (
                                <ul className="mt-1 space-y-0.5 pl-1">
                                  {(child.children ?? []).map((leaf) => (
                                    <li key={leaf.id} className="text-[11px] text-slate-600">
                                      · {pick(leaf.label, mode)}
                                    </li>
                                  ))}
                                </ul>
                              ) : null}
                            </li>
                          );
                        })}
                      </ul>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      ) : null}

      <details className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-3">
        <summary className="cursor-pointer text-sm font-medium text-slate-700">
          {mode === 'hi' ? 'पाठ रूपरेखा (fallback)' : 'Text outline (screen reader / fallback)'}
        </summary>
        <ul className="mt-3 list-disc space-y-1 pl-5">
          <Outline node={root} mode={mode} />
        </ul>
      </details>
    </section>
  );
}

'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { regulatingActRevisionContent } from '@/content/revision/indian-polity/regulating-act-1773.v1';
import { getSource } from '@/content/revision/indian-polity/regulating-act-1773.sources';
import { BiText, pick, type LangMode } from '@/app/demo/lib/bilingual';

type MindNode = {
  id: string;
  label: { en: string; hi: string };
  sectionId?: string;
  color?: string;
  sourceId?: string;
  children?: MindNode[];
};

function scrollToSection(sectionId: string) {
  const el = document.getElementById(sectionId);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function MindmapOutline({ node, mode, depth = 0 }: { node: MindNode; mode: LangMode; depth?: number }) {
  return (
    <li className="min-w-0">
      {node.sectionId ? (
        <button
          type="button"
          onClick={() => scrollToSection(node.sectionId!)}
          className="text-left text-sm text-slate-700 underline-offset-2 hover:text-brand hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
        >
          <BiText text={node.label} mode={mode} as="span" />
        </button>
      ) : (
        <BiText text={node.label} mode={mode} as="span" className="text-sm font-semibold text-slate-800" />
      )}
      {node.children?.length ? (
        <ul className={`mt-1 space-y-1 ${depth === 0 ? 'ml-4 list-disc' : 'ml-4 list-[circle]'}`}>
          {node.children.map((child) => (
            <MindmapOutline key={child.id} node={child} mode={mode} depth={depth + 1} />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export function RegulatingActMindMap({ mode }: { mode: LangMode }) {
  const root = regulatingActRevisionContent.mindmap.root as MindNode;
  const titleId = useId();
  const [revealed, setRevealed] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduceMotion(mq.matches);
    if (mq.matches) {
      setRevealed(true);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setRevealed(true);
          io.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const branches = root.children ?? [];

  return (
    <section
      ref={ref}
      id="mindmap"
      aria-labelledby={titleId}
      className="ra-section ra-section-block scroll-mt-28 print:break-inside-avoid"
    >
      <header>
        <h2 id={titleId} className="ra-section-title">
          {pick(regulatingActRevisionContent.mindmap.title, 'en')}
        </h2>
        <p className="ra-section-subtitle">
          {pick(regulatingActRevisionContent.mindmap.title, 'hi')}
        </p>
      </header>

      {/* Screen-reader outline */}
      <nav aria-label="Mind map text outline" className="sr-only">
        <ul>
          <MindmapOutline node={root} mode={mode} />
        </ul>
      </nav>

      {/* Desktop SVG mind map */}
      <div className="mt-6 hidden min-h-[420px] md:block print:block" aria-hidden="true">
        <svg viewBox="0 0 900 480" className="mx-auto w-full max-w-4xl">
          <circle
            cx="450"
            cy="240"
            r="52"
            fill="#7C3AED"
            className={revealed || reduceMotion ? 'opacity-100' : 'opacity-0'}
            style={{ transition: reduceMotion ? undefined : 'opacity 0.3s ease' }}
          />
          <text x="450" y="236" textAnchor="middle" fill="#FFF" fontSize="12" fontWeight="700">
            Regulating Act
          </text>
          <text x="450" y="252" textAnchor="middle" fill="#EDE9FE" fontSize="11">
            1773
          </text>
          {branches.map((branch, i) => {
            const angle = (i / branches.length) * Math.PI * 2 - Math.PI / 2;
            const bx = 450 + Math.cos(angle) * 180;
            const by = 240 + Math.sin(angle) * 160;
            const color = branch.color ?? '#7C3AED';
            return (
              <g key={branch.id}>
                <path
                  d={`M450 240 Q${(450 + bx) / 2} ${(240 + by) / 2 - 20} ${bx} ${by}`}
                  fill="none"
                  stroke={color}
                  strokeWidth="2"
                  strokeDasharray={reduceMotion ? undefined : '400'}
                  strokeDashoffset={revealed || reduceMotion ? 0 : 400}
                  style={{ transition: reduceMotion ? undefined : `stroke-dashoffset 0.6s ease ${i * 0.05}s` }}
                />
                <rect
                  x={bx - 56}
                  y={by - 18}
                  width="112"
                  height="36"
                  rx="8"
                  fill={`${color}18`}
                  stroke={color}
                  strokeWidth="1.5"
                  opacity={revealed || reduceMotion ? 1 : 0}
                  style={{ transition: reduceMotion ? undefined : `opacity 0.4s ease ${0.2 + i * 0.06}s` }}
                />
                <text
                  x={bx}
                  y={by + 4}
                  textAnchor="middle"
                  fill={color}
                  fontSize="10"
                  fontWeight="600"
                  opacity={revealed || reduceMotion ? 1 : 0}
                >
                  {pick(branch.label, mode === 'both' ? 'en' : mode).slice(0, 22)}
                </text>
                {(branch.children ?? []).slice(0, 2).map((child, ci) => {
                  const cx = bx + (ci - 0.5) * 70;
                  const cy = by + (by > 240 ? 42 : -42);
                  return (
                    <g key={child.id}>
                      <line x1={bx} y1={by + (by > 240 ? 18 : -18)} x2={cx} y2={cy} stroke={color} strokeWidth="1" opacity="0.5" />
                      <circle cx={cx} cy={cy} r="28" fill="#FFF" stroke={color} strokeWidth="1.5" />
                      <text x={cx} y={cy + 3} textAnchor="middle" fill="#475569" fontSize="7">
                        {pick(child.label, 'en').slice(0, 14)}
                      </text>
                    </g>
                  );
                })}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Mobile / collapsible tree */}
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 md:hidden print:grid print:grid-cols-2">
        {branches.map((branch) => (
          <div
            key={branch.id}
            className="ra-snapshot-card !min-h-0"
            style={{ borderColor: `${branch.color ?? '#7C3AED'}40` }}
          >
            <button
              type="button"
              onClick={() => branch.sectionId && scrollToSection(branch.sectionId)}
              className="text-left text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
              style={{ color: branch.color ?? '#7C3AED' }}
            >
              <BiText text={branch.label} mode={mode} as="span" />
            </button>
            <ul className="mt-2 space-y-1">
              {(branch.children ?? []).map((child) => (
                <li key={child.id} className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => child.sectionId && scrollToSection(child.sectionId)}
                    className="text-xs text-slate-600 hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
                  >
                    <BiText text={child.label} mode={mode} as="span" />
                  </button>
                  {child.sourceId ? (
                    <a
                      href={getSource(child.sourceId).url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand"
                      aria-label={`Source: ${getSource(child.sourceId).title}`}
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

'use client';

import type { BiString } from '@/content/revision/indian-polity/sources-of-indian-constitution.v1';

export type LangMode = 'en' | 'hi' | 'both';

type BiProps = {
  text: BiString;
  mode: LangMode;
  preferHi?: boolean;
  className?: string;
  as?: 'p' | 'span' | 'div' | 'li' | 'h2' | 'h3' | 'h4';
};

export function BiText({ text, mode, preferHi = false, className = '', as: Tag = 'p' }: BiProps) {
  const wrap = `break-words [overflow-wrap:anywhere] ${className}`.trim();
  if (mode === 'en') return <Tag className={wrap}>{text.en}</Tag>;
  if (mode === 'hi') return <Tag className={wrap}>{text.hi}</Tag>;
  const primary = preferHi ? text.hi : text.en;
  const secondary = preferHi ? text.en : text.hi;
  return (
    <Tag className={wrap}>
      <span className="block break-words [overflow-wrap:anywhere]">{primary}</span>
      <span className="mt-0.5 block break-words text-[0.92em] text-slate-500 [overflow-wrap:anywhere]">
        {secondary}
      </span>
    </Tag>
  );
}

export function pick(text: BiString, mode: LangMode, preferHi = false): string {
  if (mode === 'en') return text.en;
  if (mode === 'hi') return text.hi;
  return preferHi ? text.hi : text.en;
}

'use client';

import Link from 'next/link';
import { BiText, pick, type LangMode } from '@/app/demo/lib/bilingual';

export function TopicSiblingNav({
  topicHref,
  siblingNav,
  mode,
}: {
  topicHref: string;
  siblingNav?: { prev?: { href: string; title: string }; next?: { href: string; title: string } };
  mode: LangMode;
}) {
  if (!siblingNav?.prev && !siblingNav?.next) return null;
  return (
    <nav className="cr-topic-nav print:hidden" aria-label={mode === 'hi' ? 'अगला-पिछला विषय' : 'Topic navigation'}>
      {siblingNav.prev ? (
        <Link href={siblingNav.prev.href} className="cr-topic-nav-link cr-topic-nav-link--prev">
          <span className="cr-topic-nav-label">{mode === 'hi' ? 'पिछला विषय' : 'Previous Topic'}</span>
          <span className="cr-topic-nav-title">{siblingNav.prev.title}</span>
        </Link>
      ) : (
        <span className="cr-topic-nav-spacer" aria-hidden />
      )}
      <Link href={topicHref} className="cr-topic-nav-center">
        {mode === 'hi' ? 'अध्याय पर वापस' : 'Back to Chapter'}
      </Link>
      {siblingNav.next ? (
        <Link href={siblingNav.next.href} className="cr-topic-nav-link cr-topic-nav-link--next">
          <span className="cr-topic-nav-label">{mode === 'hi' ? 'अगला विषय' : 'Next Topic'}</span>
          <span className="cr-topic-nav-title">{siblingNav.next.title}</span>
        </Link>
      ) : (
        <span className="cr-topic-nav-spacer" aria-hidden />
      )}
    </nav>
  );
}

export { BiText, pick };
export type { LangMode };

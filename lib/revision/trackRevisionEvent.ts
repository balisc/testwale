import { trackPracticeDebug } from '@/lib/practiceDebug';

export type RevisionAnalyticsEvent =
  | 'revision_opened'
  | 'revision_cta_clicked'
  | 'revision_source_clicked'
  | 'revision_mindmap_viewed'
  | 'revision_marked_complete';

/**
 * Lightweight revision analytics via the existing practice debug channel.
 * Never send full revision content or raw source strings.
 */
export function trackRevisionEvent(
  event: RevisionAnalyticsEvent,
  detail?: { version?: string; cta?: 'primary' | 'final'; host?: string },
) {
  const parts = [
    detail?.version ? `v=${detail.version}` : '',
    detail?.cta ? `cta=${detail.cta}` : '',
    detail?.host ? `host=${detail.host}` : '',
  ].filter(Boolean);
  trackPracticeDebug(event, parts.join(' ') || undefined);
}

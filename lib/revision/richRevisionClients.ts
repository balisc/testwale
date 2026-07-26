import type { ComponentType } from 'react';
import type { LocalizedText } from '@/lib/localizedText';
import type { RichRevisionSlug } from '@/lib/revision/richRevision';

export type RichRevisionSiblingLink = {
  href: string;
  title: string;
};

export type RichRevisionClientProps = {
  practiceHref: string;
  examQuery?: string | null;
  breadcrumb: {
    subjectHref: string;
    subjectTitle: LocalizedText;
    topicHref: string;
    topicTitle: LocalizedText;
    subtopicTitle: LocalizedText;
  };
  siblingNav?: {
    prev?: RichRevisionSiblingLink;
    next?: RichRevisionSiblingLink;
  };
};

const CLIENT_LOADERS: Record<
  RichRevisionSlug,
  () => Promise<{ default: ComponentType<RichRevisionClientProps> }>
> = {
  'regulating-act-1773': () =>
    import('@/components/revision/regulating-act-1773/RegulatingAct1773RevisionClient'),
  'company-rule-early-acts': () =>
    import('@/components/revision/company-rule-and-early-acts/CompanyRuleRevisionClient'),
};

export async function loadRichRevisionClient(slug: RichRevisionSlug) {
  const mod = await CLIENT_LOADERS[slug]();
  return mod.default;
}

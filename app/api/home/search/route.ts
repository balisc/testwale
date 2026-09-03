import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { getHomeCatalogSearchItems } from '@/app/home/lib/catalogSearch';
import type { HomeSearchItem } from '@/app/home/lib/catalogSearch';
import {
  getSelectedExamContext,
  getSelectedExamLearningForContext,
} from '@/lib/examLearningServer';
import { getLocalizedText } from '@/lib/localizedText';
import { isSscCglExamCode } from '@/lib/sscCglSyllabus';
import { isSscChslExamCode } from '@/lib/sscChsl';

export const runtime = 'nodejs';
export const revalidate = 300;

const getCachedHomeSearchItems = unstable_cache(
  async () => getHomeCatalogSearchItems(),
  ['home-catalog-search-items-v1'],
  { revalidate: 300 },
);

export async function GET() {
  try {
    const context = await getSelectedExamContext();
    if (context.status === 'ready' && isSscCglExamCode(context.examCode)) {
      const items: HomeSearchItem[] = [
        { id: 'ssc-cgl-tier-1', type: 'subject', label: 'SSC CGL Tier 1', labelHi: 'SSC CGL टियर 1', href: '/ssc-cgl/tier-1/subjects', path: 'SSC CGL' },
        { id: 'ssc-cgl-tier-2-paper-1', type: 'topic', label: 'SSC CGL Tier 2 Paper 1', labelHi: 'SSC CGL टियर 2 पेपर 1', href: '/ssc-cgl/tier-2/paper-1/subjects', path: 'SSC CGL › Tier 2' },
        { id: 'ssc-cgl-tier-2-paper-2', type: 'topic', label: 'SSC CGL Tier 2 Paper 2', labelHi: 'SSC CGL टियर 2 पेपर 2', href: '/ssc-cgl/tier-2/paper-2/subjects', path: 'SSC CGL › Tier 2' },
        { id: 'ssc-cgl-tier-2-paper-3', type: 'topic', label: 'SSC CGL Tier 2 Paper 3', labelHi: 'SSC CGL टियर 2 पेपर 3', href: '/ssc-cgl/tier-2/paper-3/subjects', path: 'SSC CGL › Tier 2' },
      ];
      return NextResponse.json({ items }, { headers: { 'Cache-Control': 'private, no-store' } });
    }
    if (context.status === 'ready' && isSscChslExamCode(context.examCode)) {
      const items: HomeSearchItem[] = [
        { id: 'ssc-chsl-tier-1', type: 'subject', label: 'SSC CHSL Tier 1', labelHi: 'SSC CHSL टियर 1', href: '/ssc-chsl/tier-1/subjects', path: 'SSC CHSL' },
        { id: 'ssc-chsl-tier-2', type: 'subject', label: 'SSC CHSL Tier 2', labelHi: 'SSC CHSL टियर 2', href: '/ssc-chsl/tier-2/subjects', path: 'SSC CHSL' },
      ];
      return NextResponse.json({ items }, { headers: { 'Cache-Control': 'private, no-store' } });
    }
    if (context.status !== 'unauthenticated' && context.status !== 'ready') {
      return NextResponse.json({ items: [] }, { headers: { 'Cache-Control': 'private, no-store' } });
    }

    const selected = context.status === 'ready'
      ? await getSelectedExamLearningForContext(context)
      : context;
    if (selected.status === 'ready') {
      const { snapshot } = selected;
      const subjectById = new Map(snapshot.subjects.map((row) => [row.id, row]));
      const topicById = new Map(snapshot.topics.map((row) => [row.id, row]));
      const items: HomeSearchItem[] = [
        ...snapshot.subjects.map((subject) => ({
          id: `subject:${subject.id}` as const, type: 'subject' as const,
          label: getLocalizedText(subject.title, 'en'), labelHi: getLocalizedText(subject.title, 'hi'),
          href: `/subjects/${subject.slug}?exam=${encodeURIComponent(snapshot.exam.code)}`, path: 'Subject',
        })),
        ...snapshot.topics.flatMap((topic) => {
          const subject = subjectById.get(topic.subject_id); if (!subject) return [];
          return [{ id: `topic:${topic.id}`, type: 'topic' as const,
            label: getLocalizedText(topic.title, 'en'), labelHi: getLocalizedText(topic.title, 'hi'),
            href: `/subjects/${subject.slug}/${topic.slug}?exam=${encodeURIComponent(snapshot.exam.code)}`,
            path: getLocalizedText(subject.title, 'en') }];
        }),
        ...snapshot.subtopics.flatMap((subtopic) => {
          const topic = topicById.get(subtopic.topic_id); const subject = subjectById.get(subtopic.subject_id);
          if (!topic || !subject) return [];
          return [{ id: `subtopic:${subtopic.id}`, type: 'subtopic' as const,
            label: getLocalizedText(subtopic.title, 'en'), labelHi: getLocalizedText(subtopic.title, 'hi'),
            href: `/subjects/${subject.slug}/${topic.slug}/practice/${subtopic.slug}?exam=${encodeURIComponent(snapshot.exam.code)}`,
            path: `${getLocalizedText(subject.title, 'en')} › ${getLocalizedText(topic.title, 'en')}` }];
        }),
      ];
      return NextResponse.json({ items }, { headers: { 'Cache-Control': 'private, no-store' } });
    }
    if (selected.status !== 'unauthenticated') {
      return NextResponse.json({ items: [] }, { headers: { 'Cache-Control': 'private, no-store' } });
    }
    const items = await getCachedHomeSearchItems();
    return NextResponse.json(
      { items },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      },
    );
  } catch {
    return NextResponse.json(
      { items: [] },
      { status: 200, headers: { 'Cache-Control': 'private, no-store' } },
    );
  }
}

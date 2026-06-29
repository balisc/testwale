import { topicMatches } from '@/lib/topicMatching';
import type { StructuredTopicGroup } from '@/lib/geography/physicalGeographyData';

export function splitBilingualText(value: string) {
  const [enPart, hiPart] = String(value)
    .split('|')
    .map((part) => part.trim());
  const en = enPart || hiPart || '';
  const hi = hiPart || enPart || '';
  return { en, hi };
}

export const normalizeTopicText = (text: string) =>
  text
    .normalize('NFKC')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^\p{L}\p{N} ]/gu, '')
    .trim();

type TopicItem = { en: string; hi: string; count: number };

export function computeStructuredTopicCounts(topicGroups: StructuredTopicGroup[], topics: TopicItem[]) {
  const subtopicCounts = new Map<string, number>();
  const groupTotals = new Map<number, number>();
  const flatSubtopics: Array<{
    key: string;
    groupId: number;
    en: string;
    hi: string;
  }> = [];

  for (const topicGroup of topicGroups) {
    groupTotals.set(topicGroup.id, 0);
    topicGroup.subtopics.forEach((subtopic, index) => {
      const parsed = splitBilingualText(subtopic);
      const key = `${topicGroup.id}-${index}`;
      flatSubtopics.push({ key, groupId: topicGroup.id, en: parsed.en, hi: parsed.hi });
      subtopicCounts.set(key, 0);
    });
  }

  for (const topic of topics) {
    const sourceTexts = [topic.en, topic.hi].filter(Boolean);
    if (!sourceTexts.length) continue;

    let bestKey = '';
    let bestGroupId = 0;
    let bestScore = 0;

    for (const subtopic of flatSubtopics) {
      const targetTexts = [subtopic.en, subtopic.hi].filter(Boolean);
      if (!targetTexts.length) continue;

      let score = 0;
      for (const source of sourceTexts) {
        const sourceNorm = normalizeTopicText(source);
        for (const target of targetTexts) {
          const targetNorm = normalizeTopicText(target);
          if (!sourceNorm || !targetNorm) continue;

          if (sourceNorm === targetNorm) {
            score = Math.max(score, 1);
            continue;
          }

          if (
            topicMatches(source, target) ||
            topicMatches(target, source) ||
            sourceNorm.includes(targetNorm) ||
            targetNorm.includes(sourceNorm)
          ) {
            score = Math.max(score, 0.75);
          }
        }
      }

      if (score > bestScore) {
        bestScore = score;
        bestKey = subtopic.key;
        bestGroupId = subtopic.groupId;
      }
    }

    if (bestKey) {
      const topicCount = Number(topic.count ?? 0);
      subtopicCounts.set(bestKey, (subtopicCounts.get(bestKey) ?? 0) + topicCount);
      groupTotals.set(bestGroupId, (groupTotals.get(bestGroupId) ?? 0) + topicCount);
    }
  }

  const grandTotal = topics.reduce((sum, topic) => sum + Number(topic.count ?? 0), 0);
  return { subtopicCounts, groupTotals, grandTotal };
}

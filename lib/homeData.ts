import supabase from './supabase';
import { slugifySubject } from './slugGenerator';
import { getLocalizedText, getTopicText, isPublicQuestionRow } from './localizedText';
import { SUBJECTS } from './subjects';

export type HomeStats = {
  questions: number | null;
  subjects: number | null;
  topics: number | null;
};

export type HomeSuggestion = {
  subjectKey: string;
  topicEn: string;
  topicHi: string;
};

function normalizeSubjectKey(subject: unknown) {
  const raw = slugifySubject(getLocalizedText(subject as any));
  return raw.startsWith('indian-') ? raw.replace(/^indian-/, '') : raw;
}

const SUBJECT_DB_LABELS: Record<string, string> = {
  history: 'Indian History',
  science: 'Indian Science',
  polity: 'Indian Polity',
  economics: 'Indian Economics',
  geography: 'Indian Geography',
  'general-knowledge': 'General Knowledge',
  math: 'Math',
  'current-affairs': 'Current Affairs',
  reasoning: 'Reasoning',
};

export async function getHomeData() {
  const [stats, subjectCounts, suggestions] = await Promise.all([
    getHomeStats(),
    getHomeSubjectCounts(),
    getHomeSearchSuggestions(),
  ]);

  return { stats, subjectCounts, suggestions };
}

async function getHomeStats(): Promise<HomeStats> {
  try {
    const { data, count, error } = await supabase
      .from('questions')
      .select('subject, topic, status', { count: 'exact' })
      .eq('status', 'active')
      .range(0, 1999);

    if (error || !Array.isArray(data)) {
      throw error;
    }

    const subjects = new Set<string>();
    const topics = new Set<string>();

    for (const row of data) {
      if (!isPublicQuestionRow(row)) continue;
      const subjectKey = normalizeSubjectKey(row.subject);
      const topicText = getTopicText(row);
      if (subjectKey) subjects.add(subjectKey);
      if (topicText) topics.add(topicText.toLowerCase());
    }

    return {
      questions: typeof count === 'number' ? count : data.length,
      subjects: subjects.size,
      topics: topics.size,
    };
  } catch {
    return { questions: null, subjects: null, topics: null };
  }
}

async function getHomeSubjectCounts() {
  const counts: Record<string, number> = Object.fromEntries(SUBJECTS.map((subject) => [subject.key, 0]));

  try {
    const results = await Promise.all(
      SUBJECTS.map(async (subject) => {
        const { count, error } = await supabase
          .from('questions')
          .select('id', { count: 'exact', head: true })
          .filter('subject->>en', 'eq', SUBJECT_DB_LABELS[subject.key] ?? subject.label)
          .eq('status', 'active');

        if (error) return 0;
        return typeof count === 'number' ? count : 0;
      })
    );

    results.forEach((value, index) => {
      counts[SUBJECTS[index].key] = value;
    });
  } catch {
    // Keep zero fallbacks; client component can still retry if needed.
  }

  return counts;
}

async function getHomeSearchSuggestions(): Promise<HomeSuggestion[]> {
  try {
    const { data, error } = await supabase
      .from('questions')
      .select('subject, topic, status')
      .eq('status', 'active')
      .limit(40);

    if (error || !Array.isArray(data)) {
      throw error;
    }

    const suggestions: HomeSuggestion[] = [];
    const seen = new Set<string>();

    for (const row of data) {
      if (!isPublicQuestionRow(row)) continue;
      const subjectKey = normalizeSubjectKey(row.subject);
      const topicEn = getLocalizedText(row.topic, 'en');
      const topicHi = getLocalizedText(row.topic, 'hi');
      if (!subjectKey || (!topicEn && !topicHi)) continue;

      const key = `${subjectKey}:${topicEn.toLowerCase()}:${topicHi.toLowerCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);
      suggestions.push({ subjectKey, topicEn, topicHi });
    }

    return suggestions;
  } catch {
    return [];
  }
}

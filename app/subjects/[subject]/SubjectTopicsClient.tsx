'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { useLanguage } from '../../../lib/LanguageContext';

type TopicItem = {
  en: string;
  hi: string;
  count: number;
};

const SUBJECT_LABELS: Record<string, { en: string; hi: string }> = {
  history: { en: 'History', hi: 'इतिहास' },
  science: { en: 'Science', hi: 'विज्ञान' },
  polity: { en: 'Polity', hi: 'राजव्यवस्था' },
  economics: { en: 'Economics', hi: 'अर्थशास्त्र' },
  geography: { en: 'Geography', hi: 'भूगोल' },
  'general-knowledge': { en: 'General Knowledge', hi: 'सामान्य ज्ञान' },
  math: { en: 'Math', hi: 'गणित' },
  'current-affairs': { en: 'Current Affairs', hi: 'वर्तमान मामले' },
  reasoning: { en: 'Reasoning', hi: 'तर्क' },
};

const TEXT = {
  en: {
    masterHeader: (subject: string) => `Master ${subject} Topics`,
    subtitle:
      'Build strong subject momentum with focused topic clusters and rich question coverage.',
    pageTitle: (subject: string) => `${subject} Topics`,
    pageDescription: 'Choose a topic to start practicing questions, explanations, and progress tracking.',
    progressLabel: 'YOUR PROGRESS',
    totalQuestionsLabel: 'Total Questions',
    accuracyLabel: 'Accuracy',
    questionsAvailable: 'questions available',
    topicSubtitle: 'Tap a topic to launch the next practice session.',
    featureSoon: 'This feature will be available soon.',
  },
  hi: {
    masterHeader: (subject: string) => `मास्टर ${subject} टॉपिक`,
    subtitle:
      'केंद्रित विषय क्लस्टरों के साथ अभ्यास को मजबूत करें और प्रश्न कवरेज बढ़ाएँ।',
    pageTitle: (subject: string) => `${subject} टॉपिक्स`,
    pageDescription: 'एक विषय चुनें और प्रश्नों, व्याख्याओं और प्रगति को देखें।',
    progressLabel: 'आपकी प्रगति',
    totalQuestionsLabel: 'कुल प्रश्न',
    accuracyLabel: 'सटीकता',
    questionsAvailable: 'प्रश्न उपलब्ध',
    topicSubtitle: 'अगला अभ्यास सत्र शुरू करने के लिए एक विषय पर टैप करें।',
    featureSoon: 'यह सुविधा जल्द ही उपलब्ध होगी।',
  },
};

export default function SubjectTopicsClient({
  subjectKey,
  topics,
}: {
  subjectKey: string;
  topics: TopicItem[];
}) {
  const { language } = useLanguage();
  const lang = language;
  const labels = TEXT[lang];
  const subjectLabel = SUBJECT_LABELS[subjectKey]?.[lang] ?? SUBJECT_LABELS[subjectKey]?.en ?? subjectKey;

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-7xl mx-auto px-4 pt-28 pb-8 items-start">
        <aside className="hidden lg:block lg:col-span-4 lg:sticky lg:top-24 lg:h-[calc(100vh-7rem)] overflow-hidden">
          <div className="h-full bg-gradient-to-b from-slate-50 to-white border border-slate-200/60 p-6 rounded-3xl shadow-sm">
            <div className="space-y-4">
              <h2 className="text-2xl font-extrabold text-slate-900">
                {labels.masterHeader(subjectLabel)}
              </h2>
              <p className="text-sm text-slate-500 leading-6">
                Select a topic below to test your limits. Continuous revision leads to an elite rank.
              </p>
              <div className="rounded-3xl bg-white border border-slate-100 p-6">
                <div className="text-xs text-slate-500 uppercase tracking-[0.24em] font-semibold">
                  {labels.progressLabel}
                </div>
                <p className="mt-4 text-sm text-slate-500">{labels.featureSoon}</p>
              </div>
            </div>
          </div>
        </aside>

        <section className="lg:col-span-8 col-span-1 w-full min-h-screen pb-20">
          <div className="mb-8">
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {labels.pageTitle(subjectLabel)}
            </h2>
            <p className="mt-3 text-sm text-slate-500 max-w-2xl leading-7">
              {labels.topicSubtitle}
            </p>
          </div>

          <div className="space-y-4">
            {topics.map((topic, index) => {
              const topicLabel = lang === 'hi' ? topic.hi || topic.en : topic.en || topic.hi;
              const questionLabel = `${topic.count ?? 45} ${labels.questionsAvailable}`;
              const href = `/subjects/${subjectKey}/${encodeURIComponent(topicLabel)}`;

              return (
                <Link
                  key={`${topic.en}||${topic.hi}||${index}`}
                  href={href}
                  className="w-full bg-white border border-slate-100 p-5 rounded-2xl mb-4 shadow-sm flex justify-between items-center group cursor-pointer hover:border-purple-300 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 ease-out"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-xl bg-slate-50 text-slate-400 font-mono font-bold text-sm flex items-center justify-center mr-4 group-hover:bg-purple-50 group-hover:text-purple-600 transition-colors">
                      {index + 1}
                    </div>
                    <div>
                      <div className="text-slate-800 font-bold text-base group-hover:text-slate-900">
                        {topicLabel}
                      </div>
                      <div className="text-sm text-slate-500 mt-1">
                        {questionLabel}
                      </div>
                    </div>
                  </div>

                  <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-purple-600 transition-all duration-300 group-hover:translate-x-1" />
                </Link>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}

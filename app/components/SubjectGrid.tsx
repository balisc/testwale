'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { History, BookOpen, Globe, DollarSign, Calculator, Microscope, Newspaper, Brain } from 'lucide-react';
import { useLanguage } from '../../lib/LanguageContext';

type Language = 'en' | 'hi';

const translations: Record<Language, Record<string, string>> = {
  en: {
    exploreSubjects: 'Explore Subjects',
    exploreSubtitle: 'Click any active subject to jump straight into mock exams and start practicing immediately.',
    history: 'History',
    polity: 'Polity',
    geography: 'Geography',
    economics: 'Economics',
    math: 'Math',
    science: 'Science',
    currentAffairs: 'Current Affairs',
    reasoning: 'Reasoning',
    startPractice: 'Start Practice',
    preparingContent: 'Preparing content...',
    questions: 'questions',
  },
  hi: {
    exploreSubjects: 'विषय चुनें',
    exploreSubtitle: 'किसी भी सक्रिय विषय पर क्लिक करें और सीधे मॉक परीक्षा में जाएं और तुरंत अभ्यास शुरू करें।',
    history: 'इतिहास',
    polity: 'राजव्यवस्था',
    geography: 'भूगोल',
    economics: 'अर्थशास्त्र',
    math: 'गणित',
    science: 'विज्ञान',
    currentAffairs: 'वर्तमान मामले',
    reasoning: 'तर्क',
    startPractice: 'अभ्यास शुरू करें',
    preparingContent: 'सामग्री तैयार हो रही है...',
    questions: 'प्रश्न',
  },
};

interface SubjectConfig {
  id: string;
  titleKey: keyof typeof translations.en;
  iconName: keyof typeof iconMap;
  iconBgColor: string;
  iconColor: string;
}

const subjects: SubjectConfig[] = [
  { id: 'polity', titleKey: 'polity', iconName: 'BookOpen', iconBgColor: 'bg-blue-600', iconColor: 'text-white' },
  { id: 'history', titleKey: 'history', iconName: 'History', iconBgColor: 'bg-purple-600', iconColor: 'text-white' },
  { id: 'geography', titleKey: 'geography', iconName: 'Globe', iconBgColor: 'bg-emerald-600', iconColor: 'text-white' },
  { id: 'economics', titleKey: 'economics', iconName: 'DollarSign', iconBgColor: 'bg-amber-600', iconColor: 'text-white' },
  { id: 'math', titleKey: 'math', iconName: 'Calculator', iconBgColor: 'bg-orange-600', iconColor: 'text-white' },
  { id: 'science', titleKey: 'science', iconName: 'Microscope', iconBgColor: 'bg-indigo-600', iconColor: 'text-white' },
  { id: 'current-affairs', titleKey: 'currentAffairs', iconName: 'Newspaper', iconBgColor: 'bg-rose-600', iconColor: 'text-white' },
  { id: 'reasoning', titleKey: 'reasoning', iconName: 'Brain', iconBgColor: 'bg-cyan-600', iconColor: 'text-white' },
];

const iconMap = {
  History,
  BookOpen,
  Globe,
  DollarSign,
  Calculator,
  Microscope,
  Newspaper,
  Brain,
};

export default function SubjectGrid() {
  const { language } = useLanguage();
  const t = translations[language];
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    async function loadCounts() {
      try {
        const response = await fetch('/api/subject-counts');
        if (!response.ok) {
          return;
        }
        const data = await response.json();
        setCounts(data);
      } catch {
        // keep fallback counts if API fails
      }
    }

    loadCounts();
  }, []);

  return (
    <div className="w-full">
      {/* Subject Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto px-4">
        {subjects.map((subject) => {
          const IconComponent = iconMap[subject.iconName];
          const subjectCount = counts[subject.id];
          const isActive = subjectCount !== undefined && subjectCount > 0;
          const displayCount = subjectCount !== undefined ? subjectCount : 0;

          return isActive ? (
            <Link
              key={subject.id}
              href={`/subjects/${subject.id}`}
              className="group"
            >
              <div className="bg-white border border-slate-100 p-6 rounded-2xl relative shadow-sm hover:border-purple-300 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 ease-out cursor-pointer flex items-start gap-4 h-full">
                {/* Left Side Icon Box */}
                <div className={`${subject.iconBgColor} w-12 h-12 rounded-xl flex items-center justify-center shrink-0`}>
                  <IconComponent className={`w-6 h-6 ${subject.iconColor}`} />
                </div>

                {/* Card Body */}
                <div className="flex-1 flex flex-col">
                  <h3 className="text-slate-900 font-bold text-lg mb-0.5">
                    {t[subject.titleKey as keyof typeof t] || subject.titleKey}
                  </h3>
                  <p className="text-sm text-slate-500 mb-auto">
                    {displayCount.toLocaleString()} {t.questions}
                  </p>

                  {/* Bottom CTA Button */}
                  <button
                    className="w-full bg-slate-50 group-hover:bg-purple-600 group-hover:text-white text-slate-700 text-sm font-semibold py-2.5 rounded-xl mt-5 text-center block transition-all duration-200"
                    aria-label={`${t.startPractice} - ${t[subject.titleKey as keyof typeof t]}`}
                  >
                    {t.startPractice}
                  </button>
                </div>
              </div>
            </Link>
          ) : (
            <div
              key={subject.id}
              className="opacity-65 cursor-not-allowed select-none"
            >
              <div className="bg-white border border-slate-100 p-6 rounded-2xl relative shadow-sm flex items-start gap-4 h-full">
                {/* Disabled Status Badge */}
                <div className="absolute top-3 right-3 bg-slate-100 text-slate-400 border border-slate-200/60 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md">
                  Coming Soon
                </div>

                {/* Left Side Icon Box */}
                <div className={`${subject.iconBgColor} w-12 h-12 rounded-xl flex items-center justify-center shrink-0`}>
                  <IconComponent className={`w-6 h-6 ${subject.iconColor}`} />
                </div>

                {/* Card Body */}
                <div className="flex-1 flex flex-col">
                  <h3 className="text-slate-900 font-bold text-lg mb-0.5">
                    {t[subject.titleKey as keyof typeof t] || subject.titleKey}
                  </h3>
                  <p className="text-sm text-slate-500">
                    {t.preparingContent}
                  </p>

                  {/* Disabled Button */}
                  <button
                    disabled
                    className="w-full bg-slate-50 text-slate-400 text-sm font-semibold py-2.5 rounded-xl mt-5 text-center block cursor-not-allowed"
                  >
                    {t.startPractice}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

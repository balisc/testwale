'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { History, BookOpen, Globe, DollarSign, Calculator, Microscope, Newspaper, Brain } from 'lucide-react';
import { useLanguage } from '../../lib/LanguageContext';

type Language = 'en' | 'hi';

const translations: Record<Language, Record<string, string>> = {
  en: {
    history: 'History',
    polity: 'Polity',
    geography: 'Geography',
    economics: 'Economics',
    math: 'Math',
    science: 'Science',
    currentAffairs: 'Current Affairs',
    reasoning: 'Reasoning',
  },
  hi: {
    history: 'इतिहास',
    polity: 'राजव्यवस्था',
    geography: 'भूगोल',
    economics: 'अर्थशास्त्र',
    math: 'गणित',
    science: 'विज्ञान',
    currentAffairs: 'वर्तमान मामले',
    reasoning: 'तर्क',
  },
};

const subjects = [
  { id: 'history', titleKey: 'history', iconName: 'History', count: '1,200+ MCQs', iconColor: 'text-blue-600', bgColor: 'bg-blue-50' },
  { id: 'polity', titleKey: 'polity', iconName: 'BookOpen', count: '1,100+ MCQs', iconColor: 'text-green-600', bgColor: 'bg-green-50' },
  { id: 'geography', titleKey: 'geography', iconName: 'Globe', count: '1,000+ MCQs', iconColor: 'text-purple-600', bgColor: 'bg-purple-50' },
  { id: 'economics', titleKey: 'economics', iconName: 'DollarSign', count: '950+ MCQs', iconColor: 'text-yellow-600', bgColor: 'bg-yellow-50' },
  { id: 'math', titleKey: 'math', iconName: 'Calculator', count: '800+ MCQs', iconColor: 'text-red-600', bgColor: 'bg-red-50' },
  { id: 'science', titleKey: 'science', iconName: 'Microscope', count: '1,300+ MCQs', iconColor: 'text-indigo-600', bgColor: 'bg-indigo-50' },
  { id: 'current-affairs', titleKey: 'currentAffairs', iconName: 'Newspaper', count: '700+ MCQs', iconColor: 'text-orange-600', bgColor: 'bg-orange-50' },
  { id: 'reasoning', titleKey: 'reasoning', iconName: 'Brain', count: '900+ MCQs', iconColor: 'text-pink-600', bgColor: 'bg-pink-50' },
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
    <div className="bg-gray-50 p-8 rounded-3xl">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {subjects.map((subject) => {
          const IconComponent = iconMap[subject.iconName as keyof typeof iconMap];
          return (
            <Link
              key={subject.id}
              href={`/subjects/${subject.id}`}
              className="block group"
            >
              <div className="flex flex-col items-center justify-center text-center p-8 rounded-2xl bg-white shadow-sm border border-gray-100 transition-all duration-200 hover:shadow-md hover:ring-2 hover:ring-blue-100 hover:-translate-y-1">
                <div className={`flex items-center justify-center w-16 h-16 rounded-2xl ${subject.bgColor}`}>
                  <IconComponent className={`w-8 h-8 ${subject.iconColor}`} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mt-4 mb-3">{t[subject.titleKey]}</h3>
                <div className="flex items-center justify-center bg-gray-50 text-gray-600 rounded-full px-3 py-1 text-sm font-medium">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></div>
                  {counts[subject.id] !== undefined ? `${counts[subject.id]} Questions` : subject.count}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

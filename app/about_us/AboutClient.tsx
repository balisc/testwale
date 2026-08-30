'use client';

import Link from 'next/link';
import AboutHeroIllustration from './AboutHeroIllustration';
import {
  ArrowRight,
  Award,
  BarChart3,
  BookOpen,
  Crosshair,
  Languages,
  Layers,
  Lightbulb,
  Shield,
  ShieldCheck,
  Smartphone,
  Target,
  Trophy,
  UserRound,
} from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import type { HomeStats } from '@/lib/homeData';

type Lang = 'en' | 'hi';

const CONTENT: Record<
  Lang,
  {
    badge: string;
    heroTitle1: string;
    heroTitle2: string;
    heroSub: string;
    statQuestions: string;
    statTopics: string;
    statSubjects: string;
    missionTitle: string;
    missionText: string;
    missionFeatures: { title: string; desc: string }[];
    whyTitle: string;
    whyTitleAccent: string;
    whyFeatures: { title: string; desc: string }[];
    ctaLine1: string;
    ctaLine2: string;
    ctaButton: string;
  }
> = {
  en: {
    badge: 'About Us',
    heroTitle1: 'Empowering Aspirants.',
    heroTitle2: 'One Question at a Time.',
    heroSub:
      'QuestionWale is a dedicated platform for government exam aspirants to practice topic-wise MCQs and strengthen their preparation.',
    statQuestions: 'Published Questions',
    statTopics: 'Published Topics',
    statSubjects: 'Active Subjects',
    missionTitle: 'Our Mission',
    missionText:
      'To provide high-quality, exam-focused MCQs with published explanations where available, helping aspirants practice effectively and improve accuracy.',
    missionFeatures: [
      {
        title: 'Exam Focused',
        desc: 'Designed for UPSC, State PSC, SSC, Railway and other exams.',
      },
      {
        title: 'Quality Content',
        desc: 'Carefully curated MCQs with detailed solutions and explanations.',
      },
      {
        title: 'Smart Practice',
        desc: 'Topic-wise practice to help you learn, analyze and improve.',
      },
      {
        title: 'Bilingual Support',
        desc: 'Learn in English or Hindi – the way you are most comfortable.',
      },
    ],
    whyTitle: 'Why Choose',
    whyTitleAccent: 'QuestionWale?',
    whyFeatures: [
      {
        title: 'Topic-wise Practice',
        desc: 'Practice questions chapter by chapter and topic by topic for better clarity.',
      },
      {
        title: 'Detailed Explanations',
        desc: 'Published explanations help you review the concept behind an answer where available.',
      },
      {
        title: 'Exam-Oriented',
        desc: 'Exam directories use the published syllabus versions and content mappings available on QuestionWale.',
      },
      {
        title: 'Access Anywhere',
        desc: 'Study on any device, anytime, anywhere seamlessly.',
      },
      {
        title: 'Built for Aspirants',
        desc: 'A platform made by aspirants, for aspirants, with real exam focus.',
      },
    ],
    ctaLine1: 'Your preparation today defines your success tomorrow.',
    ctaLine2: 'Practice. Improve. Achieve.',
    ctaButton: 'Start Practicing Now',
  },
  hi: {
    badge: 'हमारे बारे में',
    heroTitle1: 'अभ्यर्थियों को सशक्त बनाना।',
    heroTitle2: 'एक समय में एक प्रश्न।',
    heroSub:
      'QuestionWale सरकारी परीक्षा के अभ्यर्थियों के लिए विषय-वार MCQs का अभ्यास करने और अपनी तैयारी को मजबूत करने हेतु एक समर्पित मंच है।',
    statQuestions: 'प्रकाशित प्रश्न',
    statTopics: 'प्रकाशित टॉपिक',
    statSubjects: 'सक्रिय विषय',
    missionTitle: 'हमारा लक्ष्य',
    missionText:
      'उच्च गुणवत्ता वाले, परीक्षा-केंद्रित MCQs और उपलब्ध होने पर प्रकाशित व्याख्याएँ प्रदान करना, जिससे अभ्यर्थी प्रभावी ढंग से अभ्यास कर सकें और सटीकता बढ़ा सकें।',
    missionFeatures: [
      {
        title: 'परीक्षा-केंद्रित',
        desc: 'UPSC, State PSC, SSC, Railway और अन्य परीक्षाओं के लिए डिज़ाइन किया गया।',
      },
      {
        title: 'गुणवत्तापूर्ण सामग्री',
        desc: 'विस्तृत समाधान और व्याख्याओं के साथ सावधानीपूर्वक तैयार MCQs।',
      },
      {
        title: 'स्मार्ट अभ्यास',
        desc: 'सीखने, विश्लेषण करने और सुधार करने के लिए विषय-वार अभ्यास।',
      },
      {
        title: 'द्विभाषी सहायता',
        desc: 'अंग्रेज़ी या हिंदी में सीखें — जिस तरह से आप सबसे अधिक सहज हों।',
      },
    ],
    whyTitle: 'QuestionWale',
    whyTitleAccent: 'क्यों चुनें?',
    whyFeatures: [
      {
        title: 'विषय-वार अभ्यास',
        desc: 'बेहतर स्पष्टता के लिए अध्याय दर अध्याय और विषय दर विषय प्रश्नों का अभ्यास करें।',
      },
      {
        title: 'विस्तृत व्याख्या',
        desc: 'जहाँ उपलब्ध हो, प्रकाशित व्याख्या उत्तर के पीछे की अवधारणा को समझने में मदद करती है।',
      },
      {
        title: 'परीक्षा-उन्मुख',
        desc: 'परीक्षा निर्देशिकाएँ QuestionWale पर उपलब्ध प्रकाशित पाठ्यक्रम संस्करणों और सामग्री मैपिंग का उपयोग करती हैं।',
      },
      {
        title: 'कहीं भी पहुँच',
        desc: 'किसी भी डिवाइस पर, कभी भी, कहीं भी निर्बाध रूप से अध्ययन करें।',
      },
      {
        title: 'अभ्यर्थियों के लिए',
        desc: 'अभ्यर्थियों द्वारा, अभ्यर्थियों के लिए बना मंच, वास्तविक परीक्षा फोकस के साथ।',
      },
    ],
    ctaLine1: 'आपकी आज की तैयारी आपकी कल की सफलता तय करती है।',
    ctaLine2: 'अभ्यास करें। सुधारें। प्राप्त करें।',
    ctaButton: 'अभी अभ्यास शुरू करें',
  },
};

const MISSION_ICONS = [Award, ShieldCheck, BarChart3, Languages] as const;
const WHY_ICONS = [Target, Lightbulb, Crosshair, Smartphone, UserRound] as const;

function formatStat(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return '—';
  return value.toLocaleString('en-IN');
}

type AboutClientProps = {
  stats?: HomeStats;
};

export default function AboutClient({ stats }: AboutClientProps) {
  const { language } = useLanguage();
  const lang = language as Lang;
  const c = CONTENT[lang];

  const statCards = [
    {
      icon: BookOpen,
      value: formatStat(stats?.questions),
      label: c.statQuestions,
    },
    {
      icon: Layers,
      value: formatStat(stats?.topics),
      label: c.statTopics,
    },
    {
      icon: Target,
      value: formatStat(stats?.subjects),
      label: c.statSubjects,
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900">
      <div className="mx-auto max-w-[1100px] px-4 pb-16 pt-10 sm:px-6 lg:px-8">
        {/* Hero */}
        <section className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
          <div>
            <span className="inline-flex rounded-full bg-[#F3E8FF] px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.28em] text-[#7C3AED]">
              {c.badge}
            </span>

            <h1 className="mt-5 text-[2rem] font-bold leading-[1.15] tracking-tight text-[#111827] sm:text-[2.35rem] lg:text-[2.75rem]">
              {c.heroTitle1}
              <br />
              <span className="text-[#7C3AED]">{c.heroTitle2}</span>
            </h1>

            <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-[#6B7280]">{c.heroSub}</p>

            <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {statCards.map(({ icon: Icon, value, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3.5 shadow-[0_4px_20px_rgba(15,23,42,0.04)]"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F3E8FF] text-[#7C3AED]">
                    <Icon className="h-5 w-5" strokeWidth={2.1} aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-lg font-bold leading-none text-[#111827]">{value}</p>
                    <p className="mt-1 text-xs font-medium text-[#6B7280]">{label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <AboutHeroIllustration />
        </section>

        {/* Mission */}
        <section className="mt-12 rounded-[28px] border border-slate-100 bg-white p-6 shadow-[0_4px_24px_rgba(15,23,42,0.05)] sm:p-8 lg:mt-14">
          <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:gap-10">
            <div>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F3E8FF] text-[#7C3AED]">
                <Target className="h-7 w-7" strokeWidth={2.1} aria-hidden="true" />
              </div>
              <h2 className="mt-5 text-2xl font-bold text-[#111827]">{c.missionTitle}</h2>
              <p className="mt-3 text-[14px] leading-7 text-[#6B7280]">{c.missionText}</p>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {c.missionFeatures.map((feature, index) => {
                const Icon = MISSION_ICONS[index] ?? Award;
                return (
                  <div key={feature.title} className="rounded-2xl border border-slate-100 bg-[#FAFAFA] p-5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F3E8FF] text-[#7C3AED]">
                      <Icon className="h-5 w-5" strokeWidth={2.1} aria-hidden="true" />
                    </div>
                    <h3 className="mt-4 text-[15px] font-bold text-[#111827]">{feature.title}</h3>
                    <p className="mt-2 text-[13px] leading-6 text-[#6B7280]">{feature.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Why Choose */}
        <section className="mt-12 lg:mt-14">
          <h2 className="text-center text-[1.65rem] font-bold tracking-tight text-[#111827] sm:text-[1.85rem]">
            {lang === 'hi' ? (
              <>
                <span className="text-[#7C3AED]">{c.whyTitle}</span> {c.whyTitleAccent}
              </>
            ) : (
              <>
                {c.whyTitle} <span className="text-[#7C3AED]">{c.whyTitleAccent}</span>
              </>
            )}
          </h2>

          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5 lg:gap-0 lg:divide-x lg:divide-slate-200">
            {c.whyFeatures.map((feature, index) => {
              const Icon = WHY_ICONS[index] ?? Shield;
              return (
                <div key={feature.title} className="px-0 text-center lg:px-5 xl:px-6">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F3E8FF] text-[#7C3AED]">
                    <Icon className="h-5 w-5" strokeWidth={2.1} aria-hidden="true" />
                  </div>
                  <h3 className="mt-4 text-[15px] font-bold text-[#111827]">{feature.title}</h3>
                  <p className="mt-2 text-[13px] leading-6 text-[#6B7280]">{feature.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* CTA */}
        <section className="mt-12 rounded-[28px] border border-[#E9D5FF] bg-[#F3E8FF]/60 p-6 sm:p-8 lg:mt-14">
          <div className="flex flex-col items-center gap-6 text-center md:flex-row md:text-left">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white text-[#7C3AED] shadow-sm">
              <Trophy className="h-8 w-8" strokeWidth={2.1} aria-hidden="true" />
            </div>

            <div className="flex-1">
              <p className="text-sm text-[#6B7280]">{c.ctaLine1}</p>
              <p className="mt-1 text-2xl font-bold text-[#7C3AED] sm:text-[1.65rem]">{c.ctaLine2}</p>
            </div>

            <Link
              href="/subjects"
              className="inline-flex items-center gap-2 rounded-full bg-[#7C3AED] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(124,58,237,0.28)] transition hover:bg-[#6D28D9]"
            >
              {c.ctaButton}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

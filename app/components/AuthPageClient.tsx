'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  BarChart3,
  Cloud,
  FileText,
  Info,
  Languages,
  Lock,
  MonitorSmartphone,
  Shield,
  Target,
} from 'lucide-react';
import AuthHeroIllustration from '@/app/components/AuthHeroIllustration';
import HomeGoogleCtaButton from '@/app/components/HomeGoogleCtaButton';
import { useLanguage } from '@/lib/LanguageContext';

type Lang = 'en' | 'hi';

const CONTENT: Record<
  Lang,
  {
    badge: string;
    heroTitle: string;
    heroSub: string;
    features: { title: string; desc: string }[];
    formTitle: string;
    formSub: string;
    cardBenefits: { title: string }[];
    infoBanner: string;
    termsPrefix: string;
    terms: string;
    and: string;
    privacy: string;
    bottomFeatures: { title: string; desc: string }[];
  }
> = {
  en: {
    badge: 'Built for Competitive Exam Aspirants',
    heroTitle: 'Your Progress Starts Here',
    heroSub: 'Sign in once to save your practice, scores, progress and rankings across every device.',
    features: [
      { title: 'Topic-wise Practice', desc: 'Practice thousands of questions by topic' },
      { title: 'Detailed Explanations', desc: 'Learn with detailed solutions and concepts' },
      { title: 'Performance Tracking', desc: 'Track your progress and improve every day' },
    ],
    formTitle: 'Welcome to QuestionWale',
    formSub: 'Continue with Google to save your learning journey.',
    cardBenefits: [
      { title: 'One-click secure sign in' },
      { title: 'Your progress stays saved' },
      { title: 'Access your account on any device' },
      { title: 'No password to remember' },
    ],
    infoBanner:
      'New user? Your account will be created automatically. Returning user? You\u2019ll be signed in instantly.',
    termsPrefix: 'By continuing, you agree to our',
    terms: 'Terms of Service',
    and: 'and',
    privacy: 'Privacy Policy',
    bottomFeatures: [
      { title: 'Topic-wise Practice', desc: 'Practice by topic to build strong concepts.' },
      { title: 'Bilingual Questions', desc: 'Questions available in English and Hindi.' },
      { title: 'Secure Progress Tracking', desc: 'Track your performance and monitor improvement.' },
      { title: 'Detailed Explanations', desc: 'Understand every solution with step-by-step explanations.' },
    ],
  },
  hi: {
    badge: 'प्रतियोगी परीक्षा अभ्यर्थियों के लिए',
    heroTitle: 'आपकी प्रगति यहीं से शुरू होती है',
    heroSub: 'एक बार साइन इन करें और हर डिवाइस पर अपना अभ्यास, स्कोर, प्रगति और रैंकिंग सहेजें।',
    features: [
      { title: 'विषय-वार अभ्यास', desc: 'विषय के अनुसार हज़ारों प्रश्नों का अभ्यास करें' },
      { title: 'विस्तृत व्याख्या', desc: 'विस्तृत समाधान और अवधारणाओं के साथ सीखें' },
      { title: 'प्रदर्शन ट्रैकिंग', desc: 'अपनी प्रगति ट्रैक करें और हर दिन सुधारें' },
    ],
    formTitle: 'QuestionWale में आपका स्वागत है',
    formSub: 'अपनी सीखने की यात्रा सहेजने के लिए Google से जारी रखें।',
    cardBenefits: [
      { title: 'एक क्लिक में सुरक्षित साइन इन' },
      { title: 'आपकी प्रगति सुरक्षित रहती है' },
      { title: 'किसी भी डिवाइस पर अपने खाते तक पहुँचें' },
      { title: 'पासवर्ड याद रखने की ज़रूरत नहीं' },
    ],
    infoBanner:
      'नया उपयोगकर्ता? आपका खाता अपने आप बन जाएगा। पुराने उपयोगकर्ता? आप तुरंत साइन इन हो जाएँगे।',
    termsPrefix: 'जारी रखकर, आप हमारी',
    terms: 'सेवा की शर्तें',
    and: 'और',
    privacy: 'गोपनीयता नीति',
    bottomFeatures: [
      { title: 'विषय-वार अभ्यास', desc: 'मजबूत अवधारणाओं के लिए विषय के अनुसार अभ्यास करें।' },
      { title: 'द्विभाषी प्रश्न', desc: 'प्रश्न अंग्रेज़ी और हिंदी में उपलब्ध।' },
      { title: 'सुरक्षित प्रगति ट्रैकिंग', desc: 'अपना प्रदर्शन ट्रैक करें और सुधार देखें।' },
      { title: 'विस्तृत व्याख्या', desc: 'हर समाधान को चरण-दर-चरण समझें।' },
    ],
  },
};

const LEFT_ICONS = [Target, FileText, BarChart3] as const;
const CARD_ICONS = [Shield, Cloud, MonitorSmartphone, Lock] as const;
const BOTTOM_ICONS = [Target, Languages, BarChart3, FileText] as const;

export default function AuthPageClient({
  googleClientId = '',
  redirectTo = '/subjects',
  initialError = '',
}: {
  googleClientId?: string;
  redirectTo?: string;
  initialError?: string;
}) {
  const { language } = useLanguage();
  const lang = language as Lang;
  const c = CONTENT[lang];

  const [formError, setFormError] = useState(initialError);

  return (
    <div className="relative flex min-h-screen min-w-0 flex-col overflow-x-hidden bg-[#F8FAFC] text-slate-900">
      <div className="pointer-events-none absolute -left-20 top-24 hidden h-72 w-72 rounded-full bg-[#EDE9FE]/70 blur-3xl min-[360px]:block" />
      <div className="pointer-events-none absolute -right-16 top-10 hidden h-80 w-80 rounded-full bg-[#F3E8FF]/80 blur-3xl min-[360px]:block" />
      <div className="pointer-events-none absolute bottom-32 left-1/4 hidden h-64 w-64 rounded-full bg-[#EDE9FE]/50 blur-3xl min-[480px]:block" />

      <motion.main
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="relative mx-auto w-full min-w-0 max-w-[1180px] flex-1 px-2 pb-8 pt-5 min-[360px]:px-4 min-[360px]:pb-10 min-[360px]:pt-8 sm:px-6 lg:px-8 lg:pb-14 lg:pt-10"
      >
        <section className="grid min-w-0 items-center gap-6 min-[360px]:gap-8 sm:gap-10 lg:min-h-[min(680px,calc(100dvh-240px))] lg:grid-cols-[1.02fr_0.98fr] lg:gap-12 xl:gap-16">
          <div className="order-2 min-w-0 lg:order-1">
            <span className="inline-flex max-w-full flex-wrap items-center gap-1.5 rounded-full bg-[#F3E8FF] px-2.5 py-1 text-[8px] font-bold uppercase leading-snug tracking-[0.08em] text-[#7C3AED] min-[360px]:gap-2 min-[360px]:px-4 min-[360px]:py-1.5 min-[360px]:text-[11px] min-[360px]:tracking-[0.18em]">
              <Shield className="h-3 w-3 shrink-0 min-[360px]:h-3.5 min-[360px]:w-3.5" strokeWidth={2.2} />
              <span className="break-words">{c.badge}</span>
            </span>

            <h1 className="mt-3 break-words text-[1.25rem] font-bold leading-[1.15] tracking-tight text-[#111827] min-[360px]:mt-5 min-[360px]:text-[1.85rem] sm:text-[2.45rem] lg:text-[2.85rem]">
              {c.heroTitle}
            </h1>

            <p className="mt-2 max-w-xl break-words text-[12px] leading-relaxed text-[#6B7280] min-[360px]:mt-4 min-[360px]:text-[14px] sm:text-[15px]">
              {c.heroSub}
            </p>

            <ul className="mt-5 space-y-3 min-[360px]:mt-7 min-[360px]:space-y-4 sm:mt-8 sm:space-y-5">
              {c.features.map((feature, index) => {
                const Icon = LEFT_ICONS[index] ?? Target;
                return (
                  <li key={feature.title} className="flex min-w-0 gap-2.5 min-[360px]:gap-3.5 sm:gap-4">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F3E8FF] text-[#7C3AED] min-[360px]:h-10 min-[360px]:w-10 sm:h-11 sm:w-11">
                      <Icon className="h-4 w-4 min-[360px]:h-[18px] min-[360px]:w-[18px] sm:h-5 sm:w-5" strokeWidth={2.1} />
                    </div>
                    <div className="min-w-0">
                      <p className="break-words text-[13px] font-bold text-[#111827] min-[360px]:text-[14px] sm:text-[15px]">
                        {feature.title}
                      </p>
                      <p className="mt-0.5 break-words text-[11px] leading-5 text-[#6B7280] min-[360px]:text-[12px] min-[360px]:leading-6 sm:mt-1 sm:text-[13px]">
                        {feature.desc}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="mt-5 hidden min-w-0 sm:mt-8 lg:block">
              <AuthHeroIllustration />
            </div>
          </div>

          <div className="order-1 flex min-w-0 flex-col justify-center lg:order-2">
            <div className="mx-auto w-full min-w-0 rounded-2xl border border-slate-100 bg-white p-3 text-left shadow-[0_8px_40px_rgba(15,23,42,0.06)] min-[360px]:rounded-[24px] min-[360px]:p-5 sm:rounded-[28px] sm:p-7 lg:p-8">
              <div className="min-w-0">
                <h2 className="break-words text-[1.05rem] font-bold leading-tight text-[#111827] min-[360px]:text-[1.25rem] sm:text-[1.35rem] lg:text-[1.5rem]">
                  {c.formTitle}
                </h2>
                <p className="mt-1.5 break-words text-[11px] leading-relaxed text-[#6B7280] min-[360px]:mt-2 min-[360px]:text-[13px] sm:text-[14px]">
                  {c.formSub}
                </p>
              </div>

              <div className="login-action-stack mt-4 w-full min-w-0 min-[360px]:mt-5 sm:mt-6">
                <div className="flex w-full min-w-0 flex-col gap-4 min-[360px]:gap-5 sm:gap-6">
                  <HomeGoogleCtaButton
                    clientId={googleClientId}
                    redirectTo={redirectTo}
                    onError={(message) => setFormError(message)}
                  />

                  <div className="flex w-full min-w-0 gap-2 rounded-lg bg-[#F5F3FF] px-2.5 py-3 text-left min-[360px]:gap-3 min-[360px]:rounded-xl min-[360px]:px-4 min-[360px]:py-3.5">
                    <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#7C3AED] min-[360px]:h-4 min-[360px]:w-4" strokeWidth={2.2} />
                    <p className="min-w-0 flex-1 break-words text-[10px] leading-5 text-[#6B7280] min-[360px]:text-[12px] min-[360px]:leading-6 sm:text-[13px]">
                      {c.infoBanner}
                    </p>
                  </div>
                </div>
              </div>

              <ul className="mt-4 flex w-full min-w-0 flex-col items-stretch gap-2.5 min-[360px]:mt-5 min-[360px]:gap-3.5 sm:mt-6 sm:gap-4">
                {c.cardBenefits.map((benefit, index) => {
                  const Icon = CARD_ICONS[index] ?? Shield;
                  return (
                    <li key={benefit.title} className="flex min-w-0 items-start gap-2.5 text-left min-[360px]:items-center min-[360px]:gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F3E8FF] text-[#7C3AED] min-[360px]:h-9 min-[360px]:w-9">
                        <Icon className="h-4 w-4 min-[360px]:h-[17px] min-[360px]:w-[17px]" strokeWidth={2.1} />
                      </div>
                      <span className="min-w-0 flex-1 break-words text-[11px] font-medium leading-snug text-[#374151] min-[360px]:text-[13px] sm:text-[14px]">
                        {benefit.title}
                      </span>
                    </li>
                  );
                })}
              </ul>

              {formError && (
                <p className="mt-3 break-words rounded-lg bg-[#FEF2F2] px-2.5 py-2.5 text-[11px] font-medium text-[#DC2626] min-[360px]:mt-4 min-[360px]:rounded-xl min-[360px]:px-4 min-[360px]:py-3 min-[360px]:text-[13px]">
                  {formError}
                </p>
              )}

              <p className="mt-4 break-words text-left text-[10px] leading-5 text-[#9CA3AF] min-[360px]:mt-5 min-[360px]:text-[12px] min-[360px]:leading-6 sm:mt-6 sm:text-[13px]">
                {c.termsPrefix}{' '}
                <Link href="/terms" className="font-semibold text-[#7C3AED] hover:underline">
                  {c.terms}
                </Link>{' '}
                {c.and}{' '}
                <Link href="/privacy" className="font-semibold text-[#7C3AED] hover:underline">
                  {c.privacy}
                </Link>
                .
              </p>
            </div>

            <div className="mt-5 min-w-0 min-[360px]:mt-6 sm:mt-8 lg:hidden">
              <AuthHeroIllustration />
            </div>
          </div>
        </section>
      </motion.main>

      <section className="relative min-w-0 border-t border-[#EDE9FE]/60 bg-[#F1F5F9]/80">
        <div className="mx-auto min-w-0 max-w-[1180px] px-2 py-6 min-[360px]:px-4 min-[360px]:py-8 sm:px-6 sm:py-10 lg:px-8">
          <div className="grid grid-cols-1 gap-5 min-[360px]:gap-8 sm:grid-cols-2 xl:grid-cols-4 xl:gap-6">
            {c.bottomFeatures.map((feature, index) => {
              const Icon = BOTTOM_ICONS[index] ?? Target;
              return (
                <div key={feature.title} className="min-w-0 text-center sm:text-left">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-2xl bg-[#F3E8FF] text-[#7C3AED] min-[360px]:h-11 min-[360px]:w-11 sm:mx-0 sm:h-12 sm:w-12">
                    <Icon className="h-4 w-4 min-[360px]:h-5 min-[360px]:w-5" strokeWidth={2.1} />
                  </div>
                  <h3 className="mt-2 break-words text-[13px] font-bold text-[#111827] min-[360px]:mt-3 min-[360px]:text-[14px] sm:mt-4 sm:text-[15px]">
                    {feature.title}
                  </h3>
                  <p className="mt-1 break-words text-[11px] leading-5 text-[#6B7280] min-[360px]:text-[12px] min-[360px]:leading-6 sm:mt-2 sm:text-[13px]">
                    {feature.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}

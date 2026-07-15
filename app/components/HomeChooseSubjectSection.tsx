'use client';

import HomeSubjectCard from '@/app/components/HomeSubjectCard';

type Lang = 'en' | 'hi';

const FEATURED_SUBJECTS = [
  {
    key: 'polity',
    labelEn: 'Indian Polity',
    labelHi: 'भारतीय राजव्यवस्था',
    imageSrc: '/polity/indian-polity.png',
    imageAltEn: 'Indian Parliament and Constitution illustration',
    imageAltHi: 'भारतीय संसद और संविधान चित्र',
  },
  {
    key: 'history',
    labelEn: 'Indian History',
    labelHi: 'भारतीय इतिहास',
    imageSrc: '/history/modern-gate.png',
    imageAltEn: 'India Gate and historical monuments illustration',
    imageAltHi: 'इंडिया गेट और ऐतिहासिक स्मारक चित्र',
  },
] as const;

type HomeChooseSubjectSectionProps = {
  lang: Lang;
  chooseSubject: string;
  chooseSubjectSub: string;
  questions: string;
  english: string;
  hindi: string;
  startPracticeCard: string;
  subjectCounts: Record<string, number>;
};

export default function HomeChooseSubjectSection({
  lang,
  chooseSubject,
  chooseSubjectSub,
  questions,
  english,
  hindi,
  startPracticeCard,
  subjectCounts,
}: HomeChooseSubjectSectionProps) {
  const formatCount = (key: string) => {
    const count = subjectCounts[key];
    if (typeof count === 'number') return count.toLocaleString();
    return '—';
  };

  return (
    <section className="bg-white px-2.5 py-8 min-[360px]:px-5 min-[360px]:py-12 md:px-6 md:py-[72px]" aria-labelledby="choose-subject-heading">
      <div className="mx-auto max-w-[1240px]">
        <div className="text-center">
          <h2
            id="choose-subject-heading"
            className="break-words text-[clamp(1.125rem,4vw+0.5rem,2rem)] font-bold tracking-tight text-[#0F172A]"
          >
            {chooseSubject}
          </h2>
          <p className="mx-auto mt-2 max-w-lg break-words text-xs text-slate-500 min-[360px]:mt-3 min-[360px]:text-sm sm:text-base">{chooseSubjectSub}</p>
        </div>

        <div className="mt-6 grid grid-cols-1 items-stretch gap-3 min-[360px]:mt-10 min-[360px]:gap-5 md:grid-cols-2 md:gap-6">
          {FEATURED_SUBJECTS.map((subject) => (
            <HomeSubjectCard
              key={subject.key}
              subjectKey={subject.key}
              title={lang === 'hi' ? subject.labelHi : subject.labelEn}
              questionCount={formatCount(subject.key)}
              questionsLabel={questions}
              imageSrc={subject.imageSrc}
              imageAlt={lang === 'hi' ? subject.imageAltHi : subject.imageAltEn}
              englishLabel={english}
              hindiLabel={hindi}
              startLabel={startPracticeCard}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

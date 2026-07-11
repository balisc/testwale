import { Star } from 'lucide-react';
import HomeHeroIllustration from '@/app/components/HomeHeroIllustration';
import HomeHeroSearch from '@/app/components/HomeHeroSearch';
import { HOME_COPY, type HomeLang } from '@/lib/homeCopy';
import type { HomeSuggestion } from '@/lib/homeData';

type HomeHeroSectionProps = {
  lang: HomeLang;
  initialSuggestions?: HomeSuggestion[];
};

export default function HomeHeroSection({ lang, initialSuggestions }: HomeHeroSectionProps) {
  const c = HOME_COPY[lang];

  return (
    <section className="relative -mt-16 overflow-hidden border-b border-slate-100 bg-white px-2.5 pb-8 pt-20 min-[360px]:px-5 min-[360px]:pb-10 md:px-6 md:pb-10 lg:pb-12">
      <div className="pointer-events-none absolute -left-16 top-8 h-48 w-48 rounded-full bg-[#EDE9FE]/40 blur-3xl md:top-10" />
      <div className="mx-auto grid min-w-0 max-w-[1240px] items-center gap-4 min-[360px]:gap-6 md:gap-8 lg:grid-cols-2 lg:gap-10">
        <div className="min-w-0">
          <span className="inline-flex max-w-full flex-wrap items-center justify-center gap-1 rounded-full bg-[#F3E8FF] px-2 py-1 text-[9px] font-semibold leading-snug tracking-wide text-brand min-[360px]:inline-flex min-[360px]:gap-2 min-[360px]:px-4 min-[360px]:py-1.5 min-[360px]:text-xs">
            <Star className="h-3 w-3 shrink-0 fill-brand/20 min-[360px]:h-3.5 min-[360px]:w-3.5" aria-hidden="true" />
            <span className="break-words">{c.badge}</span>
          </span>
          <h1 className="mt-3 break-words text-[clamp(1.125rem,4vw+0.5rem,3rem)] font-extrabold leading-tight tracking-tight text-[#0F172A] min-[360px]:mt-5">
            {lang === 'en' ? (
              <>
                Practice Smarter<span className="text-brand">.</span> Score{' '}
                <span className="text-brand">Higher</span>
                <span className="text-brand">.</span>
              </>
            ) : (
              c.heroTitle
            )}
          </h1>
          <p className="mt-2 max-w-xl break-words text-xs leading-relaxed text-slate-600 min-[360px]:mt-4 min-[360px]:text-sm sm:text-base md:text-lg">
            {c.heroSub}
          </p>
          <HomeHeroSearch lang={lang} initialSuggestions={initialSuggestions} />
        </div>
        <HomeHeroIllustration />
      </div>
    </section>
  );
}

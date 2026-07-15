import Image from 'next/image';

const EDGE_MASK = [
  'linear-gradient(to right, transparent 0%, #000 8%, #000 92%, transparent 100%)',
  'linear-gradient(to bottom, transparent 0%, #000 8%, #000 94%, transparent 100%)',
].join(', ');

export default function HomeHeroIllustration() {
  return (
    <div className="relative mx-auto w-full min-w-0 max-w-[580px] lg:mx-0 lg:max-w-none">
      <div
        className="pointer-events-none absolute -right-6 top-[8%] z-0 h-56 w-56 rounded-full bg-[#EDE9FE]/70 blur-3xl min-[360px]:-right-8 min-[360px]:h-64 min-[360px]:w-64 sm:-right-10 sm:top-[10%] sm:h-72 sm:w-72 md:h-80 md:w-80 lg:-right-8 lg:top-[12%] lg:h-96 lg:w-96"
        aria-hidden="true"
      />
      <div
        className="relative z-[1] w-full"
        style={{
          WebkitMaskImage: EDGE_MASK,
          maskImage: EDGE_MASK,
          WebkitMaskComposite: 'source-in',
          maskComposite: 'intersect',
        }}
      >
        <Image
          src="/home/home-hero-1160.webp"
          alt="Student practicing bilingual MCQs on QuestionWale"
          width={1160}
          height={773}
          priority
          fetchPriority="high"
          className="h-auto w-full object-contain"
          sizes="(max-width: 1024px) 94vw, 580px"
        />
      </div>
    </div>
  );
}

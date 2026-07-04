import Image from 'next/image';

const EDGE_MASK = [
  'linear-gradient(to right, transparent 0%, #000 8%, #000 92%, transparent 100%)',
  'linear-gradient(to bottom, transparent 0%, #000 8%, #000 94%, transparent 100%)',
].join(', ');

export default function HomeHeroIllustration() {
  return (
    <div className="relative mx-auto w-full min-w-0 max-w-[580px] lg:mx-0 lg:max-w-none">
      <div
        className="relative w-full"
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

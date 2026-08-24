'use client';

import Image from 'next/image';

export default function ContactHeroIllustration() {
  return (
    <div
      className="relative mx-auto flex w-full max-w-[420px] items-center justify-center lg:mx-0 lg:max-w-none lg:justify-end"
      aria-hidden
    >
      <Image
        src="/contact/contact-hero.png"
        alt="Contact illustration with envelope, paper plane and email symbol"
        width={640}
        height={480}
        preload
        fetchPriority="high"
        sizes="(max-width: 640px) calc(100vw - 32px), (max-width: 1023px) 420px, 400px"
        className="h-auto w-full max-w-[400px] object-contain sm:max-w-[420px]"
      />
    </div>
  );
}

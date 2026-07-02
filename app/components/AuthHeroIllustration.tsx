'use client';

import Image from 'next/image';

export default function AuthHeroIllustration() {
  return (
    <div
      className="relative mx-auto flex w-full min-w-0 max-w-[520px] items-center justify-center lg:mx-0 lg:max-w-none lg:justify-start"
      aria-hidden
    >
      <Image
        src="/login/login-hero-illustration.png"
        alt=""
        width={640}
        height={480}
        priority
        className="h-auto w-full max-w-[480px] object-contain sm:max-w-[520px] lg:max-w-[560px]"
        sizes="(max-width: 1024px) 90vw, 560px"
      />
    </div>
  );
}

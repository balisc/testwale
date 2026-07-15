import Link from 'next/link';
import QuestionWaleLogoMark from '@/components/QuestionWaleLogoMark';

export default function HomeLogo({ className = '' }: { className?: string }) {
  return (
    <Link
      href="/"
      className={`inline-flex min-w-0 max-w-full items-center gap-2.5 max-[359px]:gap-1.5 ${className}`}
      aria-label="QuestionWale home"
    >
      <QuestionWaleLogoMark size={36} className="h-9 w-9 max-[359px]:h-7 max-[359px]:w-7" />
      <span className="truncate text-[17px] font-bold tracking-tight text-[#18181B] max-[359px]:text-[13px]">
        QuestionWale
      </span>
    </Link>
  );
}

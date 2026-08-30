import Link from 'next/link';
import HomeLogo from './HomeLogo';

const COLUMNS = [
  {
    title: 'Practice',
    links: [
      { label: 'SSC Exams', href: '/#public-exam-explorer' },
      { label: 'Browse Subjects', href: '/subjects' },
      { label: 'Map Practice', href: '/map-practice' },
      { label: 'Content Standards', href: '/content-standards' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About Us', href: '/about_us' },
      { label: 'Contact', href: '/contact' },
      { label: 'Content Standards', href: '/content-standards' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Disclaimer', href: '/disclaimer' },
      { label: 'Refund Policy', href: '/refund-policy' },
    ],
  },
] as const;

export default function HomeFooter() {
  return (
    <footer className="border-t border-[#E4E7EC] bg-white">
      <div className="home-container w-full py-12 max-[479px]:py-10">
        <div className="grid gap-10 md:grid-cols-[1.2fr_2fr] max-[479px]:gap-8">
          <div className="min-w-0">
            <HomeLogo />
            <p className="mt-4 max-w-sm text-sm leading-6 text-[#667085]">
              Focused bilingual MCQ practice for Indian government exam aspirants.
            </p>
          </div>
          <div className="grid gap-8 sm:grid-cols-3">
            {COLUMNS.map((col) => (
              <div key={col.title} className="min-w-0">
                <p className="text-sm font-semibold text-[#18181B]">{col.title}</p>
                <ul className="mt-3 space-y-2">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <Link href={link.href} className="text-sm text-[#667085] transition hover:text-[#6D28D9]">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center gap-3 border-t border-[#E4E7EC] pt-6 text-center text-sm text-[#667085] max-[479px]:text-xs sm:flex-row sm:justify-between sm:text-left">
          <p>© {new Date().getFullYear()} QuestionWale. All rights reserved.</p>
          <p className="inline-flex items-center gap-1.5 text-[#667085]">
            <span aria-hidden className="text-base leading-none text-red-500">
              ♥
            </span>
            <span>Created by student</span>
          </p>
          <p>Made with care in India</p>
        </div>
      </div>
    </footer>
  );
}

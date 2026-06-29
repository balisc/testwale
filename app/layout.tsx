import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import LayoutShell from './components/LayoutShell';
import { LanguageProvider } from '../lib/LanguageContext';
import { BASE_URL, siteMetadata, SITE_NAME } from '../lib/seo';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const plusJakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-plus-jakarta-sans', display: 'swap' });

export const metadata: Metadata = {
  ...siteMetadata,
  icons: {
    icon: [{ url: '/logo/questionwale_logo.webp', type: 'image/webp' }],
    shortcut: '/logo/questionwale_logo.webp',
    apple: '/logo/questionwale_logo.webp',
  },
};

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'EducationalOrganization',
  name: SITE_NAME,
  url: BASE_URL,
  logo: `${BASE_URL}/logo/questionwale_logo.webp`,
  description: siteMetadata.description,
  areaServed: 'India',
  knowsAbout: ['UPSC', 'State PSC', 'Competitive exams', 'MCQ practice', 'General studies'],
};

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: SITE_NAME,
  url: BASE_URL,
  potentialAction: {
    '@type': 'SearchAction',
    target: `${BASE_URL}/?search={search_term_string}`,
    'query-input': 'required name=search_term_string',
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${plusJakarta.variable} scroll-auto`}>
      <body suppressHydrationWarning className="min-h-screen bg-[#F8FAFC] text-slate-900 antialiased font-body m-0 p-0 overflow-x-hidden">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <LanguageProvider>
          <LayoutShell>{children}</LayoutShell>
        </LanguageProvider>
      </body>
    </html>
  );
}

import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import LayoutShell from './components/LayoutShell';
import { LanguageProvider } from '../lib/LanguageContext';
import { AuthProvider } from '../lib/AuthContext';
import { siteMetadata } from '@/lib/seo';
import { getPublicExamDirectory } from '@/lib/publicExamDirectoryServer';
import { toPublicExamNavigationEntries } from '@/lib/publicExamDirectory';

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

export default async function RootLayout({ children }: { children: ReactNode }) {
  const publicExams = toPublicExamNavigationEntries(await getPublicExamDirectory());
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${plusJakarta.variable} scroll-smooth`}>
      <body suppressHydrationWarning className="min-h-screen bg-[#F8FAFC] text-slate-900 antialiased font-body m-0 p-0 overflow-x-hidden">
        <LanguageProvider>
          <AuthProvider>
            <LayoutShell publicExams={publicExams}>{children}</LayoutShell>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}

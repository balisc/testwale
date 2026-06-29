import SubjectGrid from '../components/SubjectGrid';
import { canonical } from '@/lib/seo';

export const metadata = {
  title: 'Subjects',
  description: 'Explore Questionwale subjects and start practicing with curated topics.',
  ...canonical('/subjects'),
  openGraph: {
    title: 'Subjects',
    description: 'Explore Questionwale subjects and start practicing with curated topics.',
    url: '/subjects',
    type: 'website',
    siteName: 'Questionwale',
  },
};

export default function SubjectsPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="mx-auto max-w-7xl px-5 pt-12 pb-20 lg:px-10">
        <div className="mb-12 text-center">
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">Choose Your Subject</h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-slate-600 sm:text-lg">
            Click any active subject to jump straight into topics and start practicing immediately.
          </p>
        </div>
        <SubjectGrid />
      </section>
    </main>
  );
}

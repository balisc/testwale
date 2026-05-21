import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SubjectGrid from '../components/SubjectGrid';

export const metadata = {
  title: 'Subjects | Questionwale',
  description: 'Explore Questionwale subjects and start practicing with curated topics.',
};

export default function SubjectsPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar />
      <section className="mx-auto max-w-7xl px-5 py-28 lg:px-10">
        <div className="mb-12 text-center">
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">Choose Your Subject</h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-slate-600 sm:text-lg">
            Click any active subject to jump straight into topics and start practicing immediately.
          </p>
        </div>
        <SubjectGrid />
      </section>
      <Footer />
    </main>
  );
}

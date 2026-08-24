import SubjectGrid from '../components/SubjectGrid';
import { buildPageMetadata } from '@/lib/seo';
import { getSelectedExamLearning } from '@/lib/examLearningServer';
import ExamSubjectsGrid from './ExamSubjectsGrid';
import ExamContentUnavailable from '@/components/ExamContentUnavailable';
import { redirect } from 'next/navigation';
import { isSscCglExamCode } from '@/lib/sscCglSyllabus';

export const dynamic = 'force-dynamic';

export const metadata = buildPageMetadata({
  title: 'Subjects — MCQ Practice',
  description: 'Explore QuestionWale subjects and start practicing with curated topics for competitive exams.',
  path: '/subjects',
});

export default async function SubjectsPage() {
  const selected = await getSelectedExamLearning();
  if (selected.status === 'ready') {
    if (isSscCglExamCode(selected.snapshot.exam.code)) redirect('/ssc-cgl');
    return (
      <main className="min-h-screen bg-slate-50 text-slate-900">
        {selected.snapshot.subjects.length > 0
          ? <ExamSubjectsGrid snapshot={selected.snapshot} />
          : <ExamContentUnavailable reason="subjects_preparing" />}
      </main>
    );
  }
  if (selected.status === 'inactive') return <ExamContentUnavailable reason="inactive_exam" />;
  if (selected.status === 'error') return <ExamContentUnavailable reason="error" />;
  if (selected.status === 'incomplete') redirect('/onboarding?returnTo=%2Fsubjects');
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

import Link from 'next/link';
import questionsData from '../../../data/questions.json';

const topicList = ['Ancient History', 'Medieval History', 'Modern History'];

type LocalizedText = string | { en: string; hi: string };

function getText(value: LocalizedText, locale: 'en' | 'hi' = 'en') {
  if (typeof value === 'string') return value;
  return value[locale] || value.en;
}

export default function SubjectPage({ params }: { params: any }) {
  const subjectKey = String(params.subject).toLowerCase();
  const questions = questionsData.filter((item) => item.subject.toLowerCase() === subjectKey);
  const header = subjectKey.replace('-', ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <main className="mx-auto max-w-7xl px-5 py-8 lg:px-10">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.35em] text-accent">{header} Practice</p>
          <h1 className="mt-3 text-4xl font-semibold text-white">{header} question bank</h1>
          <p className="mt-3 max-w-2xl text-slate-300">Browse topic cards, review exam badges, and begin practice for every selected question.</p>
        </div>
        <Link href="/" className="btn-primary">Back to Home</Link>
      </div>

      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        <aside className="sticky top-24 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-panel">
          <p className="text-sm uppercase tracking-[0.35em] text-accent">Topics</p>
          <div className="mt-6 space-y-3">
            {topicList.map((topic) => (
              <div key={topic} className="rounded-2xl border border-white/10 bg-[#071623] px-5 py-4 text-sm text-slate-200 transition hover:border-accent/40 hover:bg-hoverbg">
                {topic}
              </div>
            ))}
          </div>
        </aside>

        <section className="space-y-6">
          {questions.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-[#071623]/80 p-8 text-slate-300 shadow-panel">
              <p className="text-xl font-semibold text-white">No questions available for {header}</p>
              <p className="mt-3 text-slate-400">Try another subject from the home page or check back for more practice content.</p>
            </div>
          ) : (
            questions.map((question) => (
              <article key={question.id} className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-panel transition hover:border-accent/50 hover:bg-hoverbg">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <span className="rounded-full bg-accent/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-accent">{question.exam}</span>
                  <span className="text-xs uppercase tracking-[0.3em] text-slate-400">{getText(question.topic)}</span>
                </div>
                <h2 className="text-xl font-semibold text-white">{getText(question.question)}</h2>
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <Link href={`/quiz/${question.id}`} className="rounded-full border border-accent/20 bg-accent/10 px-4 py-2 text-sm font-semibold uppercase tracking-[0.3em] text-accent transition hover:bg-accent/15">
                    Start Practice
                  </Link>
                  <span className="text-sm text-slate-400">ID: {question.id}</span>
                </div>
              </article>
            ))
          )}
        </section>
      </div>
    </main>
  );
}

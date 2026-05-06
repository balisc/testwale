import Link from 'next/link';

const subjects = [
  { label: 'History', slug: 'history', description: 'Ancient, Medieval & Modern questions' },
  { label: 'Science', slug: 'science', description: 'Physics, Biology and more' },
  { label: 'Polity', slug: 'polity', description: 'Constitution & governance' },
  { label: 'Bihar Special', slug: 'bihar', description: 'State specific current affairs' },
  { label: 'Current Affairs', slug: 'current-affairs', description: 'Latest exam-ready facts' },
  { label: 'Economics', slug: 'economics', description: 'Budget, policy and data' },
];

const papers = [
  { year: '2024', paper: 'BPSC Prelims', subject: 'History', path: '/questions/history' },
  { year: '2023', paper: 'General Studies', subject: 'Science', path: '/questions/science' },
  { year: '2022', paper: 'Bihar Special', subject: 'Polity', path: '/questions/polity' },
];

export default function HomePage() {
  return (
    <main className="mx-auto max-w-7xl px-5 py-8 lg:px-10">
      <header className="flex flex-col gap-8 lg:gap-0 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-3 text-accent">
            <div className="h-11 w-11 rounded-2xl bg-white/10 ring-1 ring-accent/20 backdrop-blur-xl" />
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Testwale</p>
              <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">Exam Practice Hub</h1>
            </div>
          </div>
        </div>
        <nav className="flex flex-wrap items-center gap-3 text-sm text-slate-300">
          <Link className="rounded-full px-4 py-2 transition hover:bg-hoverbg" href="/questions/history">History</Link>
          <Link className="rounded-full px-4 py-2 transition hover:bg-hoverbg" href="/questions/science">Science</Link>
          <Link className="rounded-full px-4 py-2 transition hover:bg-hoverbg" href="/questions/polity">Polity</Link>
          <Link className="rounded-full px-4 py-2 transition hover:bg-hoverbg" href="/questions/bihar">Bihar Special</Link>
        </nav>
      </header>

      <section className="mt-12 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <div className="section-glass rounded-3xl border border-white/10 p-8 shadow-panel">
          <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-accent">Search practice</p>
              <h2 className="mt-2 text-3xl font-semibold text-white">Find questions by subject, topic or exam</h2>
            </div>
            <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.32em] text-slate-300">Ready in seconds</span>
          </div>
          <div className="rounded-[32px] border border-white/10 bg-white/10 p-5 shadow-glow backdrop-blur-xl">
            <label className="mb-3 block text-sm font-medium text-slate-300">Search questions</label>
            <div className="flex items-center gap-3 rounded-3xl border border-white/10 bg-[#0f2645] px-4 py-3 shadow-inner">
              <span className="text-xl text-slate-400">🔍</span>
              <input
                className="w-full bg-transparent text-white outline-none placeholder:text-slate-500"
                placeholder="Type a topic or exam name"
                aria-label="Search questions"
              />
            </div>
          </div>
        </div>

        <div className="section-glass rounded-3xl border border-white/10 p-8 shadow-panel">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-accent">Fast access</p>
              <h3 className="text-2xl font-semibold text-white">Popular subjects</h3>
            </div>
            <span className="text-sm text-slate-400">6 categories</span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {subjects.map((subject) => (
              <Link
                key={subject.slug}
                href={`/questions/${subject.slug}`}
                className="group rounded-3xl border border-white/10 bg-slate-950/70 p-6 transition hover:border-accent/50 hover:bg-hoverbg"
              >
                <p className="text-xs uppercase tracking-[0.35em] text-accent">{subject.label}</p>
                <h4 className="mt-4 text-xl font-semibold text-white">{subject.description}</h4>
                <span className="mt-5 inline-flex items-center gap-2 text-sm text-slate-300 group-hover:text-white">
                  Start Practice →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-12 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-panel">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-accent">PYQ papers</p>
            <h2 className="text-3xl font-semibold text-white">Practice from previous year papers</h2>
          </div>
          <Link href="/questions/history" className="btn-primary">Browse all papers</Link>
        </div>

        <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#071623] shadow-inner">
          <table className="min-w-full table-auto text-left text-sm text-slate-300">
            <thead className="border-b border-white/10 bg-white/5 text-slate-400">
              <tr>
                <th className="px-6 py-4">Year</th>
                <th className="px-6 py-4">Exam</th>
                <th className="px-6 py-4">Subject</th>
                <th className="px-6 py-4">Paper</th>
                <th className="px-6 py-4" />
              </tr>
            </thead>
            <tbody>
              {papers.map((paper) => (
                <tr key={paper.year} className="border-b border-white/10 transition hover:bg-white/5">
                  <td className="px-6 py-4 font-medium text-white">{paper.year}</td>
                  <td className="px-6 py-4">{paper.paper}</td>
                  <td className="px-6 py-4">{paper.subject}</td>
                  <td className="px-6 py-4">Full PYQ practice</td>
                  <td className="px-6 py-4">
                    <Link href={paper.path} className="rounded-full border border-accent/20 bg-accent/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-accent transition hover:bg-accent/15">
                      View Paper
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

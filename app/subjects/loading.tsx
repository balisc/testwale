export default function SubjectsLoading() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12 sm:px-6 lg:px-10" aria-busy="true" aria-label="Loading subjects">
      <div className="mx-auto max-w-7xl animate-pulse">
        <div className="mx-auto h-9 w-64 rounded-xl bg-purple-100" />
        <div className="mx-auto mt-4 h-4 w-96 max-w-full rounded bg-slate-200" />
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 7 }, (_, index) => (
            <div key={index} className="h-52 rounded-3xl border border-purple-100 bg-white p-6">
              <div className="h-12 w-12 rounded-2xl bg-purple-100" />
              <div className="mt-5 h-5 w-2/3 rounded bg-slate-200" />
              <div className="mt-3 h-4 w-full rounded bg-slate-100" />
              <div className="mt-2 h-4 w-4/5 rounded bg-slate-100" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

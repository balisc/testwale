export default function AppLoading() {
  return (
    <main className="min-h-[70vh] bg-[#F8FAFC] px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl animate-pulse" aria-label="Opening page">
        <div className="h-8 w-52 rounded-lg bg-slate-200" />
        <div className="mt-3 h-4 w-80 max-w-full rounded bg-slate-100" />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="h-36 rounded-2xl border border-slate-200 bg-white" />
          ))}
        </div>
      </div>
    </main>
  );
}

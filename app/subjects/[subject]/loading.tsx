export default function SubjectLoading() {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="mx-auto max-w-[1240px] animate-pulse px-4 pb-14 pt-6 sm:px-6 lg:px-8">
        <div className="mb-5 h-4 w-48 rounded bg-slate-200" />
        <div className="rounded-3xl border border-slate-100 bg-white p-8">
          <div className="h-6 w-40 rounded-full bg-slate-200" />
          <div className="mt-4 h-10 w-2/3 max-w-md rounded bg-slate-200" />
          <div className="mt-3 h-4 w-full max-w-xl rounded bg-slate-100" />
          <div className="mt-6 flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-8 w-20 rounded-full bg-slate-100" />
            ))}
          </div>
        </div>
        <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-slate-100 bg-white p-5">
              <div className="flex gap-3">
                <div className="h-11 w-11 rounded-xl bg-slate-100" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 rounded bg-slate-200" />
                  <div className="h-3 w-full rounded bg-slate-100" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

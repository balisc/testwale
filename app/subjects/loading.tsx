import DelayedRouteLoader from '../components/DelayedRouteLoader';

export default function SubjectsLoading() {
  return (
    <DelayedRouteLoader>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/95 px-6 py-10 backdrop-blur-sm">
        <div className="relative flex w-full max-w-md flex-col items-center gap-6 rounded-[2rem] border border-slate-200 bg-white shadow-[0_30px_70px_rgba(15,23,42,0.12)] px-8 py-12">
          <div className="absolute -top-5 inline-flex items-center rounded-full bg-gradient-to-r from-teal-500 via-blue-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg">
            Questionwale</div>
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-r from-teal-500 via-blue-600 to-indigo-600 text-white shadow-xl">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-white border-t-transparent"></div>
          </div>
          <div className="text-center mt-4">
            <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Loading</p>
            <h2 className="mt-3 text-2xl font-bold text-slate-900">Loading topics and questions</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Just a moment while we fetch the subject content for you.</p>
          </div>
        </div>
      </div>
    </DelayedRouteLoader>
  );
}

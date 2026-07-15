import type { RevisionOfficialSource } from '@/lib/revision/types';

type VerifiedOfficialSourcesDetailsProps = {
  sources: RevisionOfficialSource[];
  heading?: string;
};

/**
 * Native collapsed accordion. Source `<a href>` nodes exist in initial HTML
 * whether open or closed — no JS gate, no display:none, no bot-only content.
 */
export default function VerifiedOfficialSourcesDetails({
  sources,
  heading = 'Verified official sources',
}: VerifiedOfficialSourcesDetailsProps) {
  const linked = sources.filter((item) => Boolean(item.url));
  if (linked.length === 0) return null;

  return (
    <details className="group rounded-2xl border border-slate-200 bg-white open:border-brand/30 open:shadow-sm">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-semibold text-slate-900 outline-none marker:content-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 [&::-webkit-details-marker]:hidden">
        <span>
          {heading} ({linked.length})
        </span>
        <span
          className="shrink-0 text-slate-400 transition group-open:rotate-180"
          aria-hidden
        >
          ▾
        </span>
      </summary>
      <ul className="space-y-2 border-t border-slate-100 px-4 py-3">
        {linked.map((source) => (
          <li key={source.url} className="text-sm leading-relaxed text-slate-700">
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-brand underline-offset-2 hover:underline focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
            >
              {source.title}
            </a>
            {source.citation ? (
              <span className="mt-0.5 block text-xs text-slate-500">{source.citation}</span>
            ) : null}
          </li>
        ))}
      </ul>
    </details>
  );
}

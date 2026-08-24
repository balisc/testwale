import Link from 'next/link';

export type SyllabusCrumb = {
  label: string;
  href?: string;
};

export default function SyllabusBreadcrumb({ items }: { items: SyllabusCrumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6 text-sm text-slate-500">
      <ol className="flex flex-wrap items-center gap-2">
        {items.map((item, index) => (
          <li key={`${item.label}-${index}`} className="flex items-center gap-2">
            {index > 0 ? <span aria-hidden="true" className="text-slate-300">/</span> : null}
            {item.href ? (
              <Link
                href={item.href}
                className="inline-flex min-h-7 items-center rounded-sm transition hover:text-[#6D28D9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D28D9] focus-visible:ring-offset-2"
              >
                {item.label}
              </Link>
            ) : (
              <span className="font-medium text-slate-700" aria-current="page">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

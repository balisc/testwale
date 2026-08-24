import type { MetadataRoute } from 'next';
import { BASE_URL } from '@/lib/seo';
import { fetchCatalogSitemapPaths, fetchPublicExamSitemapPaths } from '@/lib/sitemapCatalog';
import { SUBJECTS } from '@/lib/subjects';
import { isLegacySitemapExcludedSubjectKey } from '@/lib/sitemapPolicy';

export const revalidate = 3600;

function absolutePath(path: string) {
  return `${BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

const STATIC_PAGES: Array<{ path: string; priority: number }> = [
  { path: '/', priority: 1 },
  { path: '/subjects', priority: 0.9 },
  { path: '/about_us', priority: 0.6 },
  { path: '/contact', priority: 0.6 },
  { path: '/privacy', priority: 0.4 },
  { path: '/terms', priority: 0.4 },
  { path: '/disclaimer', priority: 0.4 },
  { path: '/refund-policy', priority: 0.4 },
  { path: '/map-practice', priority: 0.7 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const urls = new Map<string, MetadataRoute.Sitemap[number]>();

  const addUrl = (path: string, priority = 0.7, lastModified?: string | Date) => {
    const entry: MetadataRoute.Sitemap[number] = {
      url: absolutePath(path),
      changeFrequency: 'weekly',
      priority,
    };
    if (lastModified) {
      entry.lastModified = new Date(lastModified);
    }
    urls.set(path, entry);
  };

  for (const page of STATIC_PAGES) {
    addUrl(page.path, page.priority);
  }

  try {
    const dynamicPaths = await Promise.all([
      fetchCatalogSitemapPaths(),
      fetchPublicExamSitemapPaths(),
    ]);
    for (const entry of dynamicPaths.flat()) {
      addUrl(entry.path, entry.priority, entry.lastModified);
    }
  } catch {
    // Keep sitemap available if catalog fetch fails.
  }

  for (const subject of SUBJECTS) {
    if (isLegacySitemapExcludedSubjectKey(subject.key)) continue;
    addUrl(`/${subject.key}`, 0.75);
    addUrl(`/${subject.key}/topics`, 0.75);
  }

  return Array.from(urls.values());
}

import type { MetadataRoute } from 'next';
import { BASE_URL } from '@/lib/seo';
import { collectSitemapPathsFromRows, fetchAllSitemapQuestionRows } from '@/lib/sitemapQuestions';
import { SUBJECTS } from '@/lib/subjects';

export const dynamic = 'force-dynamic';
export const revalidate = 3600;

function absolutePath(path: string) {
  return `${BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const urls = new Map<string, MetadataRoute.Sitemap[number]>();

  const addUrl = (path: string, priority = 0.7) => {
    urls.set(path, {
      url: absolutePath(path),
      lastModified: now,
      changeFrequency: 'weekly',
      priority,
    });
  };

  addUrl('/', 1);
  addUrl('/subjects', 0.8);
  addUrl('/map-practice', 0.8);

  for (const subject of SUBJECTS) {
    addUrl(`/${subject.key}`, 0.8);
    addUrl(`/${subject.key}/topics`, 0.8);

    try {
      const rows = await fetchAllSitemapQuestionRows(subject.table);
      const { topicSlugs, questionPaths } = collectSitemapPathsFromRows(rows);

      for (const [path, lastModified] of questionPaths.entries()) {
        urls.set(path, {
          url: absolutePath(path),
          lastModified,
          changeFrequency: 'weekly',
          priority: 0.7,
        });
      }

      for (const topicSlug of topicSlugs) {
        addUrl(`/${subject.key}/topics/${topicSlug}`, 0.75);
      }
    } catch {
      // Keep the sitemap available even if one subject table is temporarily unavailable.
    }
  }

  return Array.from(urls.values());
}

import type { MetadataRoute } from 'next';
import { isNonProductionDeployment } from '@/lib/env';
import { BASE_URL } from '@/lib/seo';

export default function robots(): MetadataRoute.Robots {
  if (isNonProductionDeployment()) {
    return {
      rules: {
        userAgent: '*',
        disallow: '/',
      },
    };
  }

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Pages with meta noindex remain crawlable so bots can observe that
      // directive. Only non-document server endpoints are blocked here.
      disallow: ['/api/', '/auth/'],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}

import type { MetadataRoute } from 'next';
import { BASE_URL } from '@/lib/seo';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        '/auth/',
        '/login',
        '/signup',
        '/loading-test/',
        '/examples/',
      ],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}

/** @type {import('next').NextConfig} */
import nextEnv from '@next/env';

nextEnv.loadEnvConfig(process.cwd());

const isDevelopment = process.env.NODE_ENV !== 'production';
const isProduction = process.env.NODE_ENV === 'production';

/**
 * Only map confirmed anon / browser-safe values into NEXT_PUBLIC_*.
 * Never fall back to SUPABASE_KEY (often confused with service role).
 */
const publicSupabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || process.env.SUPABASE_URL?.trim() || '';
const publicSupabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
  process.env.SUPABASE_ANON_KEY?.trim() ||
  '';

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  env: {
    NEXT_PUBLIC_SUPABASE_URL: publicSupabaseUrl,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: publicSupabaseAnonKey,
    NEXT_PUBLIC_GOOGLE_CLIENT_ID:
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() ||
      process.env.GOOGLE_CLIENT_ID?.trim() ||
      process.env.GOOGLE_CLIENT_ID_AUTH?.trim() ||
      process.env.GOOGLE_CLIEN_ID_AUTH?.trim() ||
      '',
  },
  experimental: {
    optimizeCss: true,
    scrollRestoration: true,
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [384, 580, 640, 750, 828, 1080, 1160, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.questionwale.com' }],
        destination: 'https://questionwale.com/:path*',
        permanent: true,
      },
      {
        source: '/bali',
        destination: '/',
        permanent: true,
      },
      {
        source: '/bali/:path*',
        destination: '/',
        permanent: true,
      },
      {
        source: '/subjects/:subject/:topic/company-rule-and-early-acts/:path*',
        destination: '/subjects/:subject/:topic/company-rule-acts-1773-1853/:path*',
        permanent: true,
      },
      {
        source: '/subjects/:subject/:topic/company-rule-early-acts/:path*',
        destination: '/subjects/:subject/:topic/company-rule-acts-1773-1853/:path*',
        permanent: true,
      },
      {
        source: '/polity',
        destination: '/subjects/indian-polity',
        permanent: true,
      },
      {
        source: '/polity/topics',
        destination: '/subjects/indian-polity',
        permanent: true,
      },
      {
        source: '/subjects/indian-polity/constitution-basics-salient-features/sources-of-indian-constitution/revision',
        destination:
          '/subjects/indian-polity/constitution-basics-preamble-schedules/constitution-features-sources-comparison/revision',
        permanent: true,
      },
      {
        source: '/subjects/indian-polity/preamble-union-citizenship/preamble-meaning-importance/revision',
        destination:
          '/subjects/indian-polity/constitution-basics-preamble-schedules/preamble-words-ideals-legal-status/revision',
        permanent: true,
      },
      {
        source: '/subjects/indian-polity/constitutional-history-making/regulating-act-1773/revision',
        destination:
          '/subjects/indian-polity/constitutional-history-making/company-rule-acts-1773-1853/revision',
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/subjects/:subject/:topic/:subtopic/practice',
        destination: '/subjects/:subject/:topic/practice/:subtopic',
      },
    ];
  },
  async headers() {
    const securityHeaders = [
      {
        key: 'Content-Security-Policy',
        value: [
          "default-src 'self'",
          // Google Identity Services needs inline bootstrap; avoid unsafe-eval in production.
          `script-src 'self' 'unsafe-inline' https://accounts.google.com${isDevelopment ? " 'unsafe-eval'" : ''}`,
          "style-src 'self' 'unsafe-inline' https://accounts.google.com",
          "img-src 'self' data: blob: https:",
          "font-src 'self' data: https://fonts.gstatic.com",
          "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://accounts.google.com https://oauth2.googleapis.com https://*.tile.openstreetmap.org https://*.basemaps.cartocdn.com",
          "frame-src 'self' https://accounts.google.com",
          "frame-ancestors 'none'",
          "base-uri 'self'",
          "form-action 'self'",
          "object-src 'none'",
        ].join('; '),
      },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      ...(isProduction
        ? [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' }]
        : []),
    ];

    return [
      {
        source: '/profile',
        headers: [{ key: 'Cache-Control', value: 'private, no-store' }],
      },
      {
        source: '/dashboard',
        headers: [{ key: 'Cache-Control', value: 'private, no-store' }],
      },
      {
        source: '/login',
        headers: [{ key: 'Cache-Control', value: 'private, no-store' }],
      },
      {
        source: '/signup',
        headers: [{ key: 'Cache-Control', value: 'private, no-store' }],
      },
      {
        source: '/auth/callback',
        headers: [
          { key: 'Cache-Control', value: 'private, no-store, must-revalidate' },
          { key: 'Referrer-Policy', value: 'no-referrer' },
        ],
      },
      {
        source: '/api/auth/google/start',
        headers: [
          { key: 'Cache-Control', value: 'private, no-store, must-revalidate' },
          { key: 'Referrer-Policy', value: 'no-referrer' },
        ],
      },
      {
        source: '/subjects/:subject/:topic/:subtopic/revision',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=3600, stale-while-revalidate=86400',
          },
        ],
      },
      {
        source: '/subjects/:subject/:topic',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=3600, stale-while-revalidate=86400',
          },
        ],
      },
      {
        source: '/subjects/:subject',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=3600, stale-while-revalidate=86400',
          },
        ],
      },
      {
        source: '/llms.txt',
        headers: [{ key: 'Content-Type', value: 'text/plain; charset=utf-8' }],
      },
      {
        source: '/home/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};
export default nextConfig;

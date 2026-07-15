/**
 * Production environment guards.
 * Call assertProductionEnv() from server entry points (instrumentation / root layout server path).
 */

function isProductionRuntime() {
  return process.env.NODE_ENV === 'production';
}

/** True for Vercel preview, local, or hosts that should never be indexed as production. */
export function isNonProductionDeployment(): boolean {
  if (process.env.VERCEL_ENV === 'preview' || process.env.VERCEL_ENV === 'development') {
    return true;
  }
  if (process.env.QW_FORCE_NOINDEX === '1' || process.env.QW_FORCE_NOINDEX === 'true') {
    return true;
  }
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? '').toLowerCase();
  if (
    siteUrl.includes('localhost') ||
    siteUrl.includes('127.0.0.1') ||
    siteUrl.includes('.vercel.app')
  ) {
    return true;
  }
  return false;
}

export function assertProductionEnv(): void {
  if (!isProductionRuntime()) return;
  // `next build` also sets NODE_ENV=production — do not fail static generation/collect.
  if (process.env.NEXT_PHASE === 'phase-production-build') return;
  if (process.env.npm_lifecycle_event === 'build') return;

  const missing: string[] = [];

  if (!process.env.AUTH_SECRET?.trim()) {
    missing.push('AUTH_SECRET');
  }

  const supabaseUrl = (
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    process.env.SUPABASE_URL?.trim() ||
    ''
  );
  if (!supabaseUrl) missing.push('NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL)');

  const anon =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    process.env.SUPABASE_ANON_KEY?.trim() ||
    '';
  if (!anon) missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY (or SUPABASE_ANON_KEY)');

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
    missing.push('SUPABASE_SERVICE_ROLE_KEY');
  }

  if (missing.length > 0) {
    throw new Error(
      `[QuestionWale] Missing required production environment variables: ${missing.join(', ')}. ` +
        'Set them in the deployment platform before starting.',
    );
  }
}

type GoogleTokenPayload = {
  aud?: string;
  sub?: string;
  email?: string;
  email_verified?: string | boolean;
  name?: string;
  picture?: string;
  given_name?: string;
};

export function getGoogleClientId() {
  return (
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ??
    process.env.GOOGLE_CLIENT_ID ??
    process.env.GOOGLE_CLIENT_ID_AUTH ??
    process.env.GOOGLE_CLIEN_ID_AUTH ??
    ''
  ).trim();
}

export async function verifyGoogleCredential(credential: string) {
  const clientId = getGoogleClientId();
  if (!clientId) {
    return { ok: false as const, reason: 'missing_client_id' as const };
  }

  const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    return { ok: false as const, reason: 'invalid_token' as const };
  }

  const payload = (await response.json()) as GoogleTokenPayload;

  if (payload.aud !== clientId) {
    return { ok: false as const, reason: 'invalid_audience' as const };
  }

  const emailVerified = payload.email_verified === true || payload.email_verified === 'true';
  if (!payload.email || !emailVerified || !payload.sub) {
    return { ok: false as const, reason: 'invalid_profile' as const };
  }

  return {
    ok: true as const,
    profile: {
      email: payload.email.toLowerCase(),
      fullName: String(payload.name ?? payload.given_name ?? payload.email.split('@')[0]).trim(),
      googleId: payload.sub,
      avatarUrl: typeof payload.picture === 'string' ? payload.picture : null,
    },
  };
}

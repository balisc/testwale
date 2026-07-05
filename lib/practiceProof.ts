import { createHmac } from 'crypto';

/** Dev default must match scripts/migrate_practice_signed_submit.sql */
const DEV_PRACTICE_PROOF_SECRET = 'questionwale-practice-dev-v1';

/**
 * Secret used to sign server→Supabase practice RPC calls when service role is unavailable.
 * In development we use a fixed dev secret (matches SQL migration default).
 * In production set PRACTICE_SUBMIT_SECRET (or reuse SITEMAP_SECRET) and sync DB row.
 */
export function getPracticeProofSecret(): string {
  const explicit = process.env.PRACTICE_SUBMIT_SECRET?.trim();
  if (explicit) return explicit;

  if (process.env.NODE_ENV === 'development') {
    return DEV_PRACTICE_PROOF_SECRET;
  }

  return process.env.SITEMAP_SECRET?.trim() ?? DEV_PRACTICE_PROOF_SECRET;
}

export type PracticeProof = {
  proof: string;
  expiresAt: number;
};

/** HMAC proof valid for 5 minutes; verified inside security definer RPC. */
export function createPracticeProof(scope: string, parts: string[]): PracticeProof {
  const expiresAt = Math.floor(Date.now() / 1000) + 300;
  const payload = [scope, ...parts, String(expiresAt)].join('|');
  const proof = createHmac('sha256', getPracticeProofSecret()).update(payload).digest('hex');
  return { proof, expiresAt };
}

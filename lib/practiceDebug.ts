/** Dev-only helper to count Supabase / practice API calls in the browser network tab. */

const ENABLED = process.env.NODE_ENV !== 'production';

type PracticeDebugEvent =
  | 'question_page_load'
  | 'answer_submit'
  | 'progress_fetch'
  | 'metadata_cache_hit';

const counts = new Map<PracticeDebugEvent, number>();

export function trackPracticeDebug(event: PracticeDebugEvent, detail?: string) {
  if (!ENABLED) return;
  counts.set(event, (counts.get(event) ?? 0) + 1);
  const total = counts.get(event);
  console.debug(`[practice-debug] ${event} #${total}${detail ? ` — ${detail}` : ''}`);
}

export function logPracticeDebugSummary(label: string) {
  if (!ENABLED || counts.size === 0) return;
  console.debug(`[practice-debug] ${label}`, Object.fromEntries(counts));
}

export function resetPracticeDebug() {
  counts.clear();
}

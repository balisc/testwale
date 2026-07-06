/**
 * ADMIN / MIGRATION ONLY — do not import from app routes or public runtime.
 *
 * Legacy helpers that probe old *_questions tables and schema columns (deleted, status, active).
 * Kept for one-off scripts in scripts/.
 */
import { createClient } from '@supabase/supabase-js';

const ACTIVE_COUNT_STRATEGIES = [
  { name: 'is_active', apply: (query: any) => query.eq('is_active', true) },
  { name: 'active', apply: (query: any) => query.eq('active', true) },
  { name: 'status', apply: (query: any) => query.eq('status', 'active') },
  { name: 'deleted_at', apply: (query: any) => query.is('deleted_at', null) },
  { name: 'is_deleted', apply: (query: any) => query.eq('is_deleted', false) },
  { name: 'deleted', apply: (query: any) => query.eq('deleted', false) },
];

function isUnknownColumnError(error: any) {
  const message = String(error?.message ?? '');
  return /column .* does not exist|Could not find the table|relation .* does not exist/i.test(message);
}

async function countRows(supabase: ReturnType<typeof createClient>, table: string, applyFilter?: (query: any) => any) {
  const query = supabase.from(table).select('id', { count: 'exact', head: true });
  const result = applyFilter ? await applyFilter(query) : await query;
  if (result.error) throw result.error;
  return typeof result.count === 'number' ? result.count : 0;
}

/** @internal Admin scripts only */
export async function adminGetActiveQuestionCount(
  supabase: ReturnType<typeof createClient>,
  table: string,
): Promise<number> {
  for (const strategy of ACTIVE_COUNT_STRATEGIES) {
    try {
      const count = await countRows(supabase, table, strategy.apply);
      if (count > 0) return count;
    } catch (error: any) {
      if (!isUnknownColumnError(error)) throw error;
    }
  }
  return countRows(supabase, table);
}

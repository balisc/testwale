import supabase from './supabase';
import { MAX_LEGACY_TOPIC_SCAN } from './supabaseQueryLimits';

export const SUBJECT_TABLES: Record<string, string> = {
  history: 'history_questions',
  science: 'science_questions',
  polity: 'polity_questions',
  economics: 'economics_questions',
  geography: 'geography_questions',
  'general-knowledge': 'general_knowledge_questions',
  math: 'math_questions',
  'current-affairs': 'current_affairs_questions',
  reasoning: 'reasoning_questions',
};

const ACTIVE_COUNT_STRATEGIES = [
  {
    name: 'is_active',
    apply: (query: any) => query.eq('is_active', true),
  },
  {
    name: 'active',
    apply: (query: any) => query.eq('active', true),
  },
  {
    name: 'status',
    apply: (query: any) => query.eq('status', 'active'),
  },
  {
    name: 'deleted_at',
    apply: (query: any) => query.is('deleted_at', null),
  },
  {
    name: 'is_deleted',
    apply: (query: any) => query.eq('is_deleted', false),
  },
  {
    name: 'deleted',
    apply: (query: any) => query.eq('deleted', false),
  },
];

function isUnknownColumnError(error: any) {
  const message = String(error?.message ?? '');
  const status = error?.status;

  return (
    /column (?:(?:"[^"]+")|[^ ]+) does not exist|invalid input syntax for type boolean|operator does not exist|relation (?:(?:"[^"]+")|[^ ]+) does not exist|Could not find the table/i.test(
      message.replace(/\s+/g, ' ')
    ) ||
    (status === 400 && message.trim() === '')
  );
}

async function countRows(table: string, applyFilter?: (query: any) => any) {
  const query = supabase.from(table).select('id', { count: 'exact', head: true });
  const result = applyFilter ? await applyFilter(query) : await query;

  if (result.error) {
    const error = result.error;
    if (error && typeof error === 'object') {
      error.status = result.status ?? error.status;
      error.statusText = result.statusText ?? error.statusText;
    }
    throw error;
  }

  return typeof result.count === 'number' ? result.count : 0;
}

export async function getActiveQuestionCount(table: string) {
  let sawValidActiveFilter = false;
  let sawZeroCount = false;

  for (const strategy of ACTIVE_COUNT_STRATEGIES) {
    try {
      const count = await countRows(table, strategy.apply);
      sawValidActiveFilter = true;

      if (count > 0) {
        return count;
      }

      sawZeroCount = true;
      continue;
    } catch (error: any) {
      if (!isUnknownColumnError(error)) {
        console.error(`Active row count query failed for ${table} (${strategy.name}):`, error.message ?? error);
        throw error;
      }
    }
  }

  if (sawValidActiveFilter && sawZeroCount) {
    const fallbackCount = await countRows(table);
    if (fallbackCount > 0) {
      console.warn(`Active filter returned zero for ${table}, falling back to full row count of ${fallbackCount}.`);
      return fallbackCount;
    }
  }

  return await countRows(table);
}

const TOPIC_COLUMN_GROUPS = [
  ['topic'],
  ['topic_en', 'topic_hi'],
  ['topic_en'],
  ['topic_hi'],
];

async function selectTopicColumns(table: string, columns: string[]) {
  const query = supabase.from(table).select(columns.join(', ')).limit(MAX_LEGACY_TOPIC_SCAN);
  const result = await query;
  if (result.error) {
    throw result.error;
  }
  return result.data ?? [];
}

export async function fetchActiveTopicCandidates(table: string) {
  for (const strategy of ACTIVE_COUNT_STRATEGIES) {
    for (const columns of TOPIC_COLUMN_GROUPS) {
      try {
        const query = strategy.apply(supabase.from(table).select(columns.join(', '))).limit(MAX_LEGACY_TOPIC_SCAN);
        const result = await query;
        if (result.error) {
          throw result.error;
        }
        return result.data ?? [];
      } catch (error: any) {
        if (!isUnknownColumnError(error)) {
          console.error(`Active topic query failed for ${table} (${strategy.name}):`, error.message ?? error);
          throw error;
        }
      }
    }
  }

  for (const columns of TOPIC_COLUMN_GROUPS) {
    try {
      return await selectTopicColumns(table, columns);
    } catch (error: any) {
      if (!isUnknownColumnError(error)) {
        console.error(`Topic fallback query failed for ${table}:`, error.message ?? error);
        throw error;
      }
    }
  }

  return [];
}

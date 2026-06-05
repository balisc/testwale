const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

function loadEnv(filePath) {
  return fs.readFileSync(filePath, 'utf8')
    .split(/\r?\n/)
    .filter(Boolean)
    .reduce((acc, line) => {
      const [key, ...rest] = line.split('=');
      acc[key] = rest.join('=');
      return acc;
    }, {});
}

const env = loadEnv(path.join(__dirname, '..', '.env.local'));
const url = env.SUPABASE_URL;
const key = env.SUPABASE_ANON_KEY || env.SUPABASE_KEY;
const supabase = createClient(url, key, { auth: { persistSession: false } });

const ACTIVE_COUNT_STRATEGIES = [
  { name: 'is_active', apply: (query) => query.eq('is_active', true) },
  { name: 'active', apply: (query) => query.eq('active', true) },
  { name: 'status', apply: (query) => query.eq('status', 'active') },
  { name: 'deleted_at', apply: (query) => query.is('deleted_at', null) },
  { name: 'is_deleted', apply: (query) => query.eq('is_deleted', false) },
  { name: 'deleted', apply: (query) => query.eq('deleted', false) },
];

async function countRows(table, applyFilter) {
  const query = supabase.from(table).select('*', { count: 'exact', head: true });
  const result = applyFilter ? await applyFilter(query) : await query;
  if (result.error) throw result.error;
  return result.count;
}

function isUnknownColumnError(error) {
  const message = String(error?.message ?? '');
  return /column ".*" does not exist|invalid input syntax for type boolean|operator does not exist|relation ".*" does not exist|Could not find the table/i.test(message.replace(/\s+/g, ' '));
}

async function getActiveQuestionCount(table) {
  let sawValidActiveFilter = false;
  let sawZeroCount = false;
  for (const strategy of ACTIVE_COUNT_STRATEGIES) {
    try {
      const count = await countRows(table, strategy.apply);
      console.log(table, strategy.name, 'count', count);
      sawValidActiveFilter = true;
      if (count > 0) return count;
      sawZeroCount = true;
      continue;
    } catch (error) {
      console.log(table, strategy.name, 'error', error.message, JSON.stringify(error));
      if (!isUnknownColumnError(error)) {
        console.error('Non-unknown error', table, strategy.name, error.message);
        throw error;
      }
    }
  }
  if (sawValidActiveFilter && sawZeroCount) {
    const fallbackCount = await countRows(table);
    console.log(table, 'fallback full count', fallbackCount);
    if (fallbackCount > 0) return fallbackCount;
  }
  return await countRows(table);
}

(async () => {
  for (const table of ['history_questions', 'polity_questions']) {
    try {
      const count = await getActiveQuestionCount(table);
      console.log('FINAL COUNT', table, count);
    } catch (err) {
      console.error('FINAL ERROR', table, err);
    }
    console.log('====');
  }
})();

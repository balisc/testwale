const fs = require('fs');
const path = require('path');
const util = require('util');
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

const strategy = { name: 'is_active', apply: (query) => query.eq('is_active', true) };
const table = 'history_questions';

(async () => {
  const query = supabase.from(table).select('*', { count: 'exact', head: true });
  try {
    const result = await strategy.apply(query);
    console.log('RESULT', util.inspect(result, { depth: 3 }));
  } catch (error) {
    console.log('ERROR TYPE', typeof error);
    console.log('ERROR INSPECT', util.inspect(error, { depth: 5 }));
    console.log('ERROR KEYS', Object.keys(error || {}));
    console.log('ERROR MESSAGE', error?.message);
    console.log('ERROR PROPS', error?.details, error?.hint, error?.code);
  }
})();

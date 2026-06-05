const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

function loadEnv(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  return content
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

const tables = ['history_questions', 'polity_questions'];
(async () => {
  for (const table of tables) {
    console.log('TABLE', table);
    const result1 = await supabase.from(table).select('*', { count: 'exact', head: true });
    console.log('select * head true error', result1.error);
    console.log('count', result1.count, 'data', Array.isArray(result1.data) ? result1.data.length : result1.data);
    const result2 = await supabase.from(table).select('id', { count: 'exact', head: true });
    console.log('select id head true error', result2.error);
    console.log('count', result2.count, 'data', Array.isArray(result2.data) ? result2.data.length : result2.data);
    console.log('---');
  }
})();

const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const env = fs.readFileSync('.env.local', 'utf8').split(/\r?\n/).reduce((acc, line) => {
  const idx = line.indexOf('=');
  if (idx !== -1) acc[line.slice(0, idx)] = line.slice(idx + 1);
  return acc;
}, {});
const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_KEY, { auth: { persistSession: false } });

supabase.from('history_questions').select('*').limit(2).then((result) => {
  console.log(JSON.stringify(result, null, 2));
}).catch((err) => {
  console.error(err);
});

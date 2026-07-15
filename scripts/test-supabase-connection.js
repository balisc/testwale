const fs = require('fs');
const path = require('path');

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

if (!url || !key) {
  console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY');
  process.exit(1);
}

const tables = ['history_questions', 'polity_questions'];

(async () => {
  for (const table of tables) {
    try {
      const response = await fetch(`${url}/rest/v1/${table}?select=id&limit=1`, {
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          Accept: 'application/json',
        },
      });
      const text = await response.text();
      console.log('TABLE:', table);
      console.log('STATUS:', response.status);
      console.log('BODY:', text.slice(0, 1000));
      console.log('---');
    } catch (err) {
      console.error('ERROR', table, err);
    }
  }
})();

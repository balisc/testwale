const { createClient } = require('@supabase/supabase-js');
const rawUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL)?.trim();
const url = rawUrl?.replace(/\/?rest\/v1\/?$/i, '').replace(/\/$/, '');
const key = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_KEY ?? process.env.SUPABASE_KEY ?? process.env.SUPABASE_ANON_KEY)?.trim();
if (!url || !key) {
  console.error('Missing Supabase env vars');
  process.exit(1);
}
const supabase = createClient(url, key);
(async () => {
  const q1 = await supabase.from('questions').select('id', { count: 'exact', head: false });
  console.log('select count exact status', q1.status, q1.error?.message || 'ok');
  console.log('count:', q1.count, 'rows', Array.isArray(q1.data) ? q1.data.length : 'n/a');

  const q2 = await supabase.from('questions').select('id', { count: 'exact', head: false }).eq('status','active');
  console.log('active count exact status', q2.status, q2.error?.message || 'ok');
  console.log('count:', q2.count, 'rows', Array.isArray(q2.data) ? q2.data.length : 'n/a');

  const q3 = await supabase.from('questions').select('id', { count: 'exact', head: false }).range(0, 4999);
  console.log('range 0-4999 status', q3.status, q3.error?.message || 'ok');
  console.log('rows', Array.isArray(q3.data) ? q3.data.length : 'n/a');

  const q4 = await supabase.from('questions').select('id', { count: 'exact', head: false }).neq('status','inactive');
  console.log('neq status inactive count', q4.count, q4.error?.message || 'ok');

  const q5 = await supabase.from('questions').select('id, status', { head: false, count: 'exact' }).range(0, 1999);
  const counts = {};
  if (Array.isArray(q5.data)) q5.data.forEach(r => {
    const s = r.status ?? 'null';
    counts[s] = (counts[s] || 0) + 1;
  });
  console.log('status bucket sample', counts);
})();

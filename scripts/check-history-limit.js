const fs = require('fs');
const path = require('path');

const files = [
  'app/api/history/questions/route.ts',
  'app/api/questions/route.ts',
];

const requiredPatterns = [
  '.range(0, SUPABASE_FETCH_LIMIT - 1)',
  '.range(0, 9999)',
];

let failed = false;

for (const file of files) {
  const fullPath = path.join(process.cwd(), file);
  const contents = fs.readFileSync(fullPath, 'utf8');
  const hasFullFetch = requiredPatterns.some((pattern) => contents.includes(pattern));

  console.log(`${file}: ${hasFullFetch ? 'PASS' : 'FAIL'}`);

  if (!hasFullFetch) {
    failed = true;
  }
}

if (failed) {
  console.error('Regression check failed: history/question APIs are not using a full-result range fetch.');
  process.exit(1);
}

console.log('Regression check passed.');

#!/usr/bin/env node
/** Validates every questionwale.com link inside public/llms.txt returns HTTP 200 locally. */
import fs from 'node:fs';
import path from 'node:path';

const base = (process.argv[2] ?? process.env.BASE_URL ?? 'http://127.0.0.1:3000').replace(/\/$/, '');
const llmsPath = path.join(process.cwd(), 'public', 'llms.txt');
const text = fs.readFileSync(llmsPath, 'utf8');
const urls = [...text.matchAll(/\((https:\/\/questionwale\.com[^)]+)\)/g)].map((m) => m[1]);

let failed = 0;
for (const url of urls) {
  const localPath = url.replace(/^https:\/\/questionwale\.com/, '');
  const res = await fetch(`${base}${localPath}`, { redirect: 'follow' });
  if (res.status !== 200) {
    console.error(`FAIL ${localPath} → HTTP ${res.status}`);
    failed++;
  } else {
    console.log(`PASS ${localPath} → 200`);
  }
}

if (/regulating-act-1773|sources-of-indian-constitution\/revision|preamble-meaning-importance|\/polity/.test(text)) {
  console.error('FAIL llms.txt still contains known dead/legacy URLs');
  failed++;
} else {
  console.log('PASS no known dead/legacy llms URLs');
}

process.exit(failed ? 1 : 0);

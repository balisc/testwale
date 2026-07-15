const fs = require('fs');
const path = require('path');

const BASE = 'http://127.0.0.1:3010';
const OUT = path.join('scripts', '_seo_html', 'revision-parity');
fs.mkdirSync(OUT, { recursive: true });

const ROUTES = [
  {
    id: 'topic2-sources',
    path: '/subjects/indian-polity/constitution-basics-salient-features/sources-of-indian-constitution/revision',
  },
  {
    id: 'topic3-preamble',
    path: '/subjects/indian-polity/preamble-union-citizenship/preamble-meaning-importance/revision',
  },
  {
    id: 'unpublished-thin',
    path: '/subjects/indian-polity/constitution-basics-salient-features/meaning-of-constitution/revision',
    expectStatus: 200,
    expectNoIndex: true,
    expectNoOfficialAnchors: true,
  },
];

const AGENTS = {
  normal:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  googlebot:
    'Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/W.X.Y.Z Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
};

async function fetchText(url, ua) {
  const res = await fetch(url, {
    headers: { 'User-Agent': ua, Accept: 'text/html' },
    redirect: 'follow',
  });
  const text = await res.text();
  return { status: res.status, text, headers: Object.fromEntries(res.headers.entries()) };
}

function extractSignals(html) {
  const details = (html.match(/<details\b/gi) || []).length;
  const summary = (html.match(/<summary\b/gi) || []).length;
  const anchors = [...html.matchAll(/<a\b[^>]*href="(https?:\/\/[^"]+)"[^>]*>([^<]*)/gi)].map(
    (m) => ({ href: m[1], text: m[2].trim() }),
  );
  const officialAnchors = anchors.filter((a) =>
    /legislative\.gov\.in|ncert\.nic\.in|sci\.gov\.in|api\.sci\.gov\.in/i.test(a.href),
  );
  const robots =
    html.match(/<meta[^>]+name="robots"[^>]+content="([^"]+)"/i)?.[1] ||
    html.match(/content="([^"]+)"[^>]+name="robots"/i)?.[1] ||
    null;
  const canonical =
    html.match(/<link[^>]+rel="canonical"[^>]+href="([^"]+)"/i)?.[1] ||
    html.match(/href="([^"]+)"[^>]+rel="canonical"/i)?.[1] ||
    null;
  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1]?.replace(/<[^>]+>/g, '').trim() || null;
  const hasCorrectOption = /correct_option/i.test(html);
  const hasAnswerLeak = /"correctOption"|"correct_option"|correct_option\s*:/i.test(html);
  return {
    details,
    summary,
    officialAnchorCount: officialAnchors.length,
    officialAnchors: officialAnchors.slice(0, 8),
    robots,
    canonical,
    h1,
    hasCorrectOption,
    hasAnswerLeak,
  };
}

function normalizeComparable(html) {
  return html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\bnonce="[^"]*"/g, '')
    .replace(/\bdata-react[^"]*="[^"]*"/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

(async () => {
  const report = [];

  for (const route of ROUTES) {
    const url = `${BASE}${route.path}`;
    const normal = await fetchText(url, AGENTS.normal);
    const bot = await fetchText(url, AGENTS.googlebot);

    fs.writeFileSync(path.join(OUT, `${route.id}-normal.html`), normal.text);
    fs.writeFileSync(path.join(OUT, `${route.id}-googlebot.html`), bot.text);

    const nSig = extractSignals(normal.text);
    const bSig = extractSignals(bot.text);
    const expected = route.expectStatus ?? 200;
    const statusOk = normal.status === expected && bot.status === expected;
    const bodyParity =
      normalizeComparable(normal.text) === normalizeComparable(bot.text) ||
      (nSig.h1 === bSig.h1 &&
        nSig.officialAnchorCount === bSig.officialAnchorCount &&
        nSig.details === bSig.details &&
        nSig.canonical === bSig.canonical &&
        nSig.robots === bSig.robots);

    const noIndexOk = route.expectNoIndex
      ? /noindex/i.test(String(nSig.robots || '')) && /noindex/i.test(String(bSig.robots || ''))
      : /index,\s*follow/i.test(String(nSig.robots || '')) &&
        /index,\s*follow/i.test(String(bSig.robots || ''));
    const anchorsOk = route.expectNoOfficialAnchors
      ? nSig.officialAnchorCount === 0 && bSig.officialAnchorCount === 0
      : nSig.officialAnchorCount >= 1 && bSig.officialAnchorCount >= 1;

    const entry = {
      route: route.path,
      expectedStatus: expected,
      normalStatus: normal.status,
      googlebotStatus: bot.status,
      statusOk,
      bodyParity,
      noIndexOk,
      anchorsOk,
      normal: nSig,
      googlebot: bSig,
      answerLeak: nSig.hasAnswerLeak || bSig.hasAnswerLeak || nSig.hasCorrectOption || bSig.hasCorrectOption,
    };
    report.push(entry);
    console.log(JSON.stringify(entry, null, 2));
  }

  // Sitemap check
  const sm = await fetchText(`${BASE}/sitemap.xml`, AGENTS.normal);
  const hasSources = sm.text.includes('sources-of-indian-constitution/revision');
  const hasPreamble = sm.text.includes('preamble-meaning-importance/revision');
  const hasPracticeLeak = /\/practice</.test(sm.text) && sm.text.includes('/practice</');
  console.log(
    JSON.stringify(
      {
        sitemapStatus: sm.status,
        hasSourcesRevision: hasSources,
        hasPreambleRevision: hasPreamble,
        snippetSources: (sm.text.match(/https?:\/\/[^<]*sources-of-indian-constitution\/revision[^<]*/)?.[0] || null),
      },
      null,
      2,
    ),
  );

  fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify({ report, sitemap: { hasSources, hasPreamble } }, null, 2));

  const failed = report.filter(
    (r) => !r.statusOk || !r.bodyParity || !r.noIndexOk || !r.anchorsOk || r.answerLeak,
  );
  if (failed.length) {
    console.error('FAILURES', failed.map((f) => f.route));
    process.exit(1);
  }
  console.log('ALL PARITY CHECKS PASSED');
})().catch((e) => {
  console.error(e);
  process.exit(1);
});

#!/usr/bin/env node

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const base = (process.env.BASE_URL ?? 'http://127.0.0.1:3017').replace(/\/$/, '');
const cdpBase = (process.env.CDP_URL ?? 'http://127.0.0.1:9224').replace(/\/$/, '');
const outputDir = path.join(process.cwd(), 'test-results', 'responsive');

const viewports = [
  { width: 320, height: 640 },
  { width: 360, height: 800 },
  { width: 375, height: 812 },
  { width: 390, height: 844 },
  { width: 412, height: 915 },
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
  { width: 1440, height: 900 },
];

const routes = [
  { name: 'home', path: '/' },
  { name: 'subjects', path: '/subjects' },
  { name: 'exam-topic', path: '/exams/ssc-cgl/subj-reasoning/rea-analogies' },
  { name: 'catalog-subject', path: '/subjects/indian-polity' },
  {
    name: 'revision',
    path: '/subjects/indian-polity/constitutional-history-making/company-rule-acts-1773-1853/revision',
  },
  { name: 'map-practice', path: '/map-practice' },
  { name: 'contact', path: '/contact' },
];

const screenshotRoutes = new Set(['home', 'catalog-subject', 'revision', 'map-practice']);
const screenshotWidths = new Set([320, 768, 1440]);

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function openTarget() {
  const response = await fetch(`${cdpBase}/json/new?${encodeURIComponent('about:blank')}`, {
    method: 'PUT',
  });
  if (!response.ok) throw new Error(`Could not create Chrome target: HTTP ${response.status}`);
  return response.json();
}

function connect(webSocketDebuggerUrl) {
  const socket = new WebSocket(webSocketDebuggerUrl);
  let id = 0;
  const pending = new Map();

  socket.addEventListener('message', (event) => {
    const message = JSON.parse(String(event.data));
    if (!message.id) return;
    const request = pending.get(message.id);
    if (!request) return;
    pending.delete(message.id);
    if (message.error) request.reject(new Error(message.error.message));
    else request.resolve(message.result);
  });

  const ready = new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', reject, { once: true });
  });

  return {
    ready,
    close: () => socket.close(),
    send(method, params = {}) {
      const requestId = ++id;
      return new Promise((resolve, reject) => {
        pending.set(requestId, { resolve, reject });
        socket.send(JSON.stringify({ id: requestId, method, params }));
      });
    },
  };
}

async function evaluate(client, expression) {
  const result = await client.send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text ?? 'Chrome evaluation failed');
  return result.result?.value;
}

async function waitForPage(client, expectedUrl) {
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    const ready = await evaluate(
      client,
      `location.href === ${JSON.stringify(expectedUrl)} && document.readyState === 'complete'`,
    ).catch(() => false);
    if (ready) {
      await evaluate(
        client,
        `(async () => { if (document.fonts?.ready) await document.fonts.ready; return true; })()`,
      );
      await delay(300);
      return;
    }
    await delay(100);
  }
  throw new Error(`Timed out waiting for ${expectedUrl}`);
}

const measurementExpression = `(() => {
  const viewportWidth = window.innerWidth;
  const root = document.documentElement;
  const body = document.body;
  const scrollWidth = Math.max(root.scrollWidth, body?.scrollWidth ?? 0);
  const visible = (element) => {
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
  };
  const overflowElements = scrollWidth <= viewportWidth + 1
    ? []
    : [...document.querySelectorAll('body *')]
        .filter((element) => {
          if (!visible(element)) return false;
          const rect = element.getBoundingClientRect();
          return rect.left < -1 || rect.right > viewportWidth + 1;
        })
        .slice(0, 20)
        .map((element) => {
          const rect = element.getBoundingClientRect();
          return {
            tag: element.tagName.toLowerCase(),
            id: element.id || null,
            className: typeof element.className === 'string' ? element.className.slice(0, 160) : null,
            left: Math.round(rect.left),
            right: Math.round(rect.right),
            width: Math.round(rect.width),
          };
        });
  const smallControls = [...document.querySelectorAll('a,button,input,select,textarea,[role="button"]')]
    .filter((element) => {
      if (!visible(element) || getComputedStyle(element).display === 'inline') return false;
      const rect = element.getBoundingClientRect();
      return rect.bottom >= 0 && rect.top <= window.innerHeight && (rect.width < 24 || rect.height < 24);
    })
    .slice(0, 20)
    .map((element) => {
      const rect = element.getBoundingClientRect();
      return {
        tag: element.tagName.toLowerCase(),
        label: (element.getAttribute('aria-label') || element.textContent || '').trim().slice(0, 100),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      };
    });
  return {
    innerWidth: viewportWidth,
    scrollWidth,
    horizontalOverflowPx: Math.max(0, scrollWidth - viewportWidth),
    overflowElements,
    smallControls,
    h1Count: document.querySelectorAll('h1').length,
    viewportMeta: document.querySelector('meta[name="viewport"]')?.getAttribute('content') ?? null,
    title: document.title,
  };
})()`;

await mkdir(outputDir, { recursive: true });
const target = await openTarget();
const client = connect(target.webSocketDebuggerUrl);
await client.ready;
await client.send('Page.enable');
await client.send('Runtime.enable');

const results = [];
let failed = 0;

try {
  for (const viewport of viewports) {
    await client.send('Emulation.setDeviceMetricsOverride', {
      width: viewport.width,
      height: viewport.height,
      deviceScaleFactor: 1,
      mobile: viewport.width < 768,
      screenWidth: viewport.width,
      screenHeight: viewport.height,
    });

    for (const route of routes) {
      const url = `${base}${route.path}`;
      const response = await fetch(url, { redirect: 'manual' });
      await client.send('Page.navigate', { url });
      await waitForPage(client, url);
      const metrics = await evaluate(client, measurementExpression);
      const ok = response.status === 200 && metrics.horizontalOverflowPx <= 1 && metrics.h1Count === 1;
      if (!ok) failed += 1;

      const row = {
        route: route.path,
        routeName: route.name,
        viewport,
        httpStatus: response.status,
        ok,
        ...metrics,
      };
      results.push(row);
      console.log(
        `${ok ? 'PASS' : 'FAIL'} ${viewport.width}x${viewport.height} ${route.path} ` +
          `status=${response.status} overflow=${metrics.horizontalOverflowPx}px h1=${metrics.h1Count} ` +
          `smallControls=${metrics.smallControls.length}`,
      );

      if (screenshotRoutes.has(route.name) && screenshotWidths.has(viewport.width)) {
        const shot = await client.send('Page.captureScreenshot', {
          format: 'png',
          fromSurface: true,
          captureBeyondViewport: false,
        });
        await writeFile(
          path.join(outputDir, `${route.name}-${viewport.width}.png`),
          Buffer.from(shot.data, 'base64'),
        );
      }
    }
  }
} finally {
  client.close();
  await fetch(`${cdpBase}/json/close/${target.id}`).catch(() => undefined);
}

await writeFile(
  path.join(outputDir, 'audit-results.json'),
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      baseUrl: base,
      browser: 'Chrome DevTools Protocol',
      viewports,
      routes: routes.map((route) => route.path),
      failures: failed,
      results,
    },
    null,
    2,
  ),
);

console.log(`\nResponsive audit ${failed === 0 ? 'passed' : `failed (${failed})`}.`);
process.exit(failed > 0 ? 1 : 0);

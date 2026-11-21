// One-off: mirror the published Webflow site into ./public with all CDN assets localised.
// Usage: node scripts/mirror.mjs [origin]
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join, extname } from 'node:path';
import { createHash } from 'node:crypto';

const ORIGIN = process.argv[2] || 'https://vertical-n-27.webflow.io';
const OUT = new URL('../public/', import.meta.url).pathname;
const ASSET_RE = /https:\/\/(?:cdn\.prod\.website-files\.com|assets-global\.website-files\.com|d3e54v103j8qbb\.cloudfront\.net)\/[^"'\s,>&]+/g;

const assets = new Map(); // remote url -> local path
const localFor = (u) => {
  if (!assets.has(u)) {
    const clean = decodeURIComponent(u.split('?')[0]);
    let name = clean.split('/').pop().replace(/[^\w.-]/g, '_');
    if (!extname(name)) name += '.js';
    const h = createHash('md5').update(u).digest('hex').slice(0, 6);
    assets.set(u, `/assets/${h}-${name}`);
  }
  return assets.get(u);
};
// trim a trailing ")" that belongs to CSS url(...) rather than the filename
const balance = (u) => { while (u.endsWith(')') && (u.split('(').length < u.split(')').length)) u = u.slice(0, -1); return u; };
const localise = (text) => text.replace(ASSET_RE, (m) => { const u = balance(m); return localFor(u.replace(/%2F/gi, '/')) + m.slice(u.length); });

async function save(path, body) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, body);
}

// crawl pages
const seen = new Set(), queue = ['/'];
while (queue.length) {
  const p = queue.shift();
  if (seen.has(p)) continue;
  seen.add(p);
  const res = await fetch(ORIGIN + p);
  if (!res.ok || !res.headers.get('content-type')?.includes('text/html')) { console.warn('skip', p, res.status); continue; }
  let html = await res.text();
  for (const [, href] of html.matchAll(/href="(\/[^"#?]*)/g)) if (!seen.has(href) && !/\.\w+$/.test(href)) queue.push(href);
  html = localise(html).replace(/\s(integrity|crossorigin)="[^"]*"/g, '')
    // drop the template author's Webflow review bridge (third-party script, not part of the theme)
    .replace(/<script>\s*window\.__WF_REVIEW_BRIDGE[\s\S]*?<\/script>\s*<script src="[^"]*validation-worker[^"]*"><\/script>/, '');
  await save(join(OUT, p === '/' ? 'index.html' : `${p}.html`), html);
  console.log('page', p);
}

// download assets (CSS can reference more assets, so loop until stable)
const done = new Set();
while (done.size < assets.size) {
  for (const [u, local] of [...assets]) {
    if (done.has(u)) continue;
    done.add(u);
    const res = await fetch(u);
    if (!res.ok) { console.warn('asset fail', res.status, u); continue; }
    if (/\.(css|js)$/.test(local)) await save(join(OUT, local), localise(await res.text()));
    else await save(join(OUT, local), Buffer.from(await res.arrayBuffer()));
  }
}
console.log(`${seen.size} pages, ${assets.size} assets`);

// Blog publishing for scheduled Claude runs. Posts are JSON files in tools/blog_posts/ in the GitHub repo; each commit
// triggers a Vercel build, which runs tools/build_pages.py, so a post gets the same template, sitemap and hub listing as
// hand-written ones. Keys: settings 'blog_keys' holds sha256 hashes only; the key itself is shown once in Admin → Blog.
import { createHash, randomBytes } from 'node:crypto';
import { db } from './platform.js';

export const REPO = 'aranspencerhiggins/loanleaf-site', DIR = 'tools/blog_posts';
export const LOANS = ['unsecured-business-loans', 'secured-business-loans', 'asset-finance', 'invoice-finance', 'merchant-cash-advance',
  'revolving-credit-facility', 'commercial-mortgages', 'bridging-loans', 'vat-and-tax-loans'];
export const IMGS = ['stock-home', 'stock-calc', 'stock-unsecured', 'stock-invoice', 'stock-rcf', 'stock-tax', 'stock-secured', 'stock-commercial',
  'stock-mca', 'stock-about', 'stock-asset', 'stock-bridging', 'stock-broker-desk', 'stock-broker-call'];
const sha = (s) => createHash('sha256').update(String(s)).digest('hex');

export const ghReady = () => !!process.env.BLOG_GITHUB_TOKEN;
export async function gh(path, opts = {}) {
  const r = await fetch(`https://api.github.com/repos/${REPO}/contents/${path}`, { method: opts.method || 'GET',
    headers: { Authorization: `Bearer ${process.env.BLOG_GITHUB_TOKEN}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'loanleaf-blog' },
    body: opts.body ? JSON.stringify(opts.body) : undefined });
  return { ok: r.ok, status: r.status, data: await r.json().catch(() => null) };
}

// ---------------------------------------------------------------- keys
export async function listKeys() { const [r] = await db('settings?key=eq.blog_keys&select=value').catch(() => []); return r?.value?.keys || []; }
const saveKeys = (keys) => db('settings', { method: 'POST', prefer: 'resolution=merge-duplicates', body: { key: 'blog_keys', value: { keys } } });
export async function createKey(name) {
  const key = 'llb_' + randomBytes(24).toString('base64url'), keys = await listKeys();
  keys.push({ id: randomBytes(4).toString('hex'), name: String(name || 'Scheduled run').slice(0, 60), hash: sha(key), created_at: new Date().toISOString(), last_used: null, posts: 0 });
  await saveKeys(keys);
  return key;
}
export async function revokeKey(id) { await saveKeys((await listKeys()).filter((k) => k.id !== id)); }
export async function checkKey(raw) {
  if (!/^llb_[\w-]{20,64}$/.test(raw || '')) return null;
  const h = sha(raw), keys = await listKeys(), k = keys.find((x) => x.hash === h);
  return k ? { k, keys, save: () => saveKeys(keys) } : null;
}

// ---------------------------------------------------------------- post validation
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
// Plain text in, safe HTML out. Allowed markup: **bold** and [link text](https://… or /path). Everything else is escaped.
export const inline = (s) => esc(String(s ?? '').replace(/\s+/g, ' ').trim())
  .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  .replace(/\[([^\]]{1,120})\]\((https:\/\/[^\s()]+|\/[\w\-/#]*)\)/g, (_, t, u) => `<a href="${u}"${u.startsWith('/') ? '' : ' rel="noopener" target="_blank"'}>${t}</a>`);
const plain = (s) => esc(String(s ?? '').replace(/\s+/g, ' ').trim());
export const slugify = (s) => String(s || '').toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 70).replace(/-[^-]*$/, (m) => (s.length > 70 ? '' : m));

export function buildPost(b) {
  const bad = (m) => ({ error: m });
  const len = (v, lo, hi, name) => { const n = String(v || '').trim().length; return n < lo || n > hi ? `${name} must be ${lo}–${hi} characters (it is ${n})` : ''; };
  const err = len(b.title, 15, 110, 'title') || len(b.description, 70, 170, 'description') || len(b.summary, 40, 220, 'summary') || len(b.category, 3, 30, 'category');
  if (err) return bad(err);
  if (!Array.isArray(b.body) || b.body.length < 4 || b.body.length > 60) return bad('body must be an array of 4–60 blocks');
  const body = [];
  for (const [i, x] of b.body.entries()) {
    if (x?.type === 'h2' && String(x.text || '').trim().length >= 3 && String(x.text).length <= 120) body.push(['h2', plain(x.text)]);
    else if (x?.type === 'p' && String(x.text || '').trim().length >= 20 && String(x.text).length <= 2500) body.push(['p', inline(x.text)]);
    else if (x?.type === 'ul' && Array.isArray(x.items) && x.items.length >= 2 && x.items.length <= 12 && x.items.every((t) => String(t || '').trim().length >= 3 && String(t).length <= 500)) body.push(['ul', x.items.map(inline)]);
    else return bad(`body[${i}] is not valid: use {"type":"h2","text"}, {"type":"p","text"} (20+ chars) or {"type":"ul","items":[2–12 strings]}`);
  }
  if (body[0][0] !== 'p') return bad('body must start with an introduction paragraph');
  if (body.filter((x) => x[0] === 'h2').length < 2) return bad('body needs at least 2 h2 subheadings');
  const words = body.flatMap((x) => [].concat(x[1])).join(' ').replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
  if (words < 400 || words > 2500) return bad(`body must be 400–2500 words (it is ${words})`);
  const related = [...new Set([].concat(b.related_loans || []))];
  if (related.length > 3 || related.some((s) => !LOANS.includes(s))) return bad(`related_loans: up to 3 of ${LOANS.join(', ')}`);
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/London' });
  const slug = slugify(b.slug || b.title);
  if (slug.length < 8) return bad('slug is too short');
  const title = plain(b.title);
  return { post: { slug, title, meta_title: plain(b.meta_title || `${String(b.title).trim()} | Loanleaf`).slice(0, 90), desc: plain(b.description), category: plain(b.category),
    date: today, read_mins: Math.max(2, Math.round(words / 220)), summary: plain(b.summary), body, related_loans: related,
    img: `/assets/${IMGS[parseInt(sha(slug).slice(0, 6), 16) % IMGS.length]}.webp`, source: 'api' } };
}

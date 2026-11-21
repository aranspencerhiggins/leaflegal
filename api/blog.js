// POST /api/blog: publish a blog post from a scheduled Claude run. Auth: Authorization: Bearer llb_… (Admin → Blog).
// The post is committed to tools/blog_posts/<slug>.json; Vercel rebuilds and it goes live at /blog/<slug> in ~2 minutes.
import { db, allow } from './_lib/platform.js';
import { gh, ghReady, checkKey, buildPost, LOANS, DIR } from './_lib/blog.js';

const SPEC = {
  how: 'POST JSON to this URL with header Authorization: Bearer <your key>. Existing posts: https://loanleaf.co/blog-posts.json',
  fields: { title: '15–110 chars', description: 'meta description, 70–170 chars', summary: 'card summary, 40–220 chars', category: '3–30 chars, e.g. Cash flow',
    body: 'array of blocks, intro paragraph first, 2+ h2, 400–2500 words: {"type":"p","text"} | {"type":"h2","text"} | {"type":"ul","items":[...]}',
    related_loans: `optional, up to 3 of: ${LOANS.join(', ')}`, slug: 'optional, made from the title', replace: 'optional true to update a post this API published' },
  formatting: 'plain text; **bold** and [text](https://… or /path) only',
};

export default async function handler(req, res) {
  if (req.method === 'GET') return res.json(SPEC);
  if (req.method !== 'POST') return res.status(405).json({ error: 'GET or POST only' });
  const auth = await checkKey(String(req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim());
  if (!auth) return res.status(401).json({ error: 'Missing or unknown key' });
  if (!ghReady()) return res.status(503).json({ error: 'Publishing is not set up yet (BLOG_GITHUB_TOKEN missing)' });
  if (!(await allow(`blog:${auth.k.id}`, 86400, 10))) return res.status(429).json({ error: 'Limit is 10 posts a day per key' });
  let b = req.body;
  try { if (typeof b === 'string' || Buffer.isBuffer(b)) b = JSON.parse(String(b) || '{}'); } catch { return res.status(400).json({ error: 'Body must be JSON' }); }
  const { post, error } = buildPost(b || {});
  if (error) return res.status(400).json({ error, spec: SPEC });

  const path = `${DIR}/${post.slug}.json`;
  const [cur, html] = await Promise.all([gh(path), gh(`public/blog/${post.slug}.html`)]);
  if (html.ok && !cur.ok) return res.status(409).json({ error: `A hand-written post already uses /blog/${post.slug}. Pick another title or slug.` });
  if (cur.ok && b.replace !== true) return res.status(409).json({ error: `/blog/${post.slug} already exists. Send "replace": true to update it, or pick another title.` });
  if (cur.ok) post.date = JSON.parse(Buffer.from(cur.data.content, 'base64').toString('utf8')).date || post.date; // updates keep the first publish date

  const put = await gh(path, { method: 'PUT', body: { message: `Blog: ${cur.ok ? 'update' : 'publish'} ${post.title}`, branch: 'main',
    content: Buffer.from(JSON.stringify(post, null, 1) + '\n').toString('base64'), ...(cur.ok ? { sha: cur.data.sha } : {}) } });
  if (!put.ok) { console.error('blog put', put.status, JSON.stringify(put.data).slice(0, 300)); return res.status(502).json({ error: `GitHub refused the commit (${put.status})` }); }

  auth.k.last_used = new Date().toISOString(); auth.k.posts = (auth.k.posts || 0) + 1;
  await auth.save().catch(() => {});
  await db('audit_log', { method: 'POST', body: { admin: null, action: cur.ok ? 'blog-update' : 'blog-publish', target: post.slug, detail: { key: auth.k.name, title: post.title } } }).catch(() => {});
  return res.status(cur.ok ? 200 : 201).json({ ok: true, slug: post.slug, url: `https://loanleaf.co/blog/${post.slug}`, live_in: 'about 2 minutes' });
}

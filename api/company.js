import { configured as platformOn, allow } from './_lib/platform.js';
import { chGet as get, person } from './_lib/ch.js';

// GET /api/company?q=<name>      → up to 8 matching companies (Companies House search)
// GET /api/company?number=<no>   → current directors / LLP members of that company
// Env COMPANIESHOUSE_API = a Companies House REST API key (basic auth, key as username, blank password).
// Public register data only; the key never leaves the server.
const ROLES = new Set(['director', 'llp-member', 'llp-designated-member', 'secretary']); // people, not corporate officers

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET only' });
  const key = process.env.COMPANIESHOUSE_API;
  if (!key) return res.status(503).json({ error: 'Company search unavailable' });
  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  if (platformOn() && !(await allow(`ch:${ip}`, 600, 120))) return res.status(429).json({ error: 'Too many searches. Please try again shortly.' });

  const url = new URL(req.url, 'http://x');
  const q = String(url.searchParams.get('q') || '').trim().slice(0, 100);
  const number = String(url.searchParams.get('number') || '').trim().toUpperCase();
  try {
    if (/^[A-Z0-9]{8}$/.test(number)) {
      const d = await get(`/company/${number}/officers?items_per_page=100`);
      const officers = (d.items || []).filter((o) => !o.resigned_on && ROLES.has(o.officer_role))
        .map((o) => ({ name: person(o.name), role: o.officer_role === 'director' ? 'Director' : o.officer_role === 'secretary' ? 'Secretary' : 'Member', appointed: o.appointed_on || null }));
      res.setHeader('Cache-Control', 'public, s-maxage=3600');
      return res.json({ officers });
    }
    if (q.length >= 2) {
      const d = await get(`/search/companies?items_per_page=8&q=${encodeURIComponent(q)}`);
      const items = (d.items || []).map((c) => ({
        title: c.title, number: c.company_number, status: c.company_status || null, type: c.company_type || null,
        created: c.date_of_creation || null, address: c.address_snippet || null,
      }));
      res.setHeader('Cache-Control', 'public, s-maxage=3600');
      return res.json({ items });
    }
    return res.status(400).json({ error: 'Search for at least 2 characters' });
  } catch (e) {
    console.error('company', e.message);
    return res.status(502).json({ error: 'Company search unavailable' });
  }
}

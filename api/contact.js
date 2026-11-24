// POST /api/contact: emails a message from /contact via Resend. Same env as api/enquiry.js.
import { teamNotice } from './_lib/email-layout.js';
import { configured as platformOn, allow, clientIp } from './_lib/platform.js';
import { human } from './_lib/turnstile.js';
export const contactEmailHtml = (rows) => teamNotice({ heading: 'New message from leaflegal.co', rows });
const esc = (s) => String(s ?? '').slice(0, 4000).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const EMAIL = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)*\.[a-z]{2,}$/i;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  let b = req.body;
  try { if (typeof b === 'string') b = JSON.parse(b || '{}'); } catch { b = {}; }
  b = b || {};
  if (!String(b.name || '').trim() || !EMAIL.test(b.email || '') || String(b.message || '').trim().length < 5)
    return res.status(400).json({ error: 'Missing or invalid fields' });
  if (b.hp) return res.status(200).json({ ok: true }); // bot: pretend success
  if (!(await human(b.turnstile, clientIp(req)))) return res.status(400).json({ error: 'Please confirm you’re not a robot, then try again.' });
  if (platformOn() && !(await allow(`contact:${clientIp(req)}`, 3600, 5))) return res.status(429).json({ error: 'Too many messages from this connection. Please try again later or email hello@leaflegal.co.' });
  const key = process.env.RESEND_API_KEY;
  if (!key) return res.status(503).json({ error: 'Email not configured' });
  const rows = [['Name', b.name], ['Email', b.email], ['Phone', b.phone], ['Topic', b.topic], ['Message', b.message], ['Page', b.page]].map(([l, v]) => [l, String(v ?? '').slice(0, 4000)]);
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: `Leaflegal <${process.env.ENQUIRY_FROM || 'hello@leaflegal.co'}>`,
      to: (process.env.ENQUIRY_TO || 'aran@verticalbrands.co').split(','), reply_to: b.email,
      subject: `Contact form: ${String(b.topic || 'General').slice(0, 60)} from ${String(b.name).slice(0, 80)}`,
      html: contactEmailHtml(rows),
    }),
  });
  if (!r.ok) { console.error('resend contact', r.status, await r.text()); return res.status(502).json({ error: 'Send failed' }); }
  return res.status(200).json({ ok: true });
}

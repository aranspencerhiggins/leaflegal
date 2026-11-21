// POST /api/contact: emails a message from /contact via Resend. Same env as api/enquiry.js.
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
  const key = process.env.RESEND_API_KEY;
  if (!key) return res.status(503).json({ error: 'Email not configured' });
  const rows = [['Name', b.name], ['Email', b.email], ['Phone', b.phone], ['Topic', b.topic], ['Message', b.message], ['Page', b.page]]
    .map(([l, v]) => `<tr><td style="padding:6px 12px;color:#579e84;vertical-align:top">${l}</td><td style="padding:6px 12px;font-weight:700;color:#244237;white-space:pre-wrap">${esc(v) || '–'}</td></tr>`).join('');
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: `Leaflegal <${process.env.ENQUIRY_FROM || 'onboarding@resend.dev'}>`,
      to: (process.env.ENQUIRY_TO || 'aran@verticalbrands.co').split(','), reply_to: b.email,
      subject: `Contact form: ${String(b.topic || 'General').slice(0, 60)} from ${String(b.name).slice(0, 80)}`,
      html: `<div style="font-family:Arial,sans-serif"><h2 style="color:#244237">New message from leaflegal.co</h2><table style="border-collapse:collapse">${rows}</table></div>`,
    }),
  });
  if (!r.ok) { console.error('resend contact', r.status, await r.text()); return res.status(502).json({ error: 'Send failed' }); }
  return res.status(200).json({ ok: true });
}

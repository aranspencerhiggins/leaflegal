// POST /api/track: forwards funnel events from the site to Meta's Conversions API (server-side copy of pixel events).
// No contact details here - only IP, browser and ad click IDs. Lead / SubmitApplication are sent by enquiry.js / partner.js.
const EVENTS = new Set(['ViewContent', 'FormStart', 'FormStep', 'FormDisqualified', 'CalculatorUsed']);
const KEYS = ['form', 'step', 'step_name', 'reason', 'content_name', 'loan_amount', 'term_months', 'rate'];

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  let b = req.body;
  try { if (typeof b === 'string') b = JSON.parse(b); } catch { b = {}; }
  b = b || {};
  if (!EVENTS.has(b.event)) return res.status(400).json({ error: 'Unknown event' });
  const token = process.env.META_CAPI_TOKEN;
  if (!token) return res.status(204).end();

  const custom = {};
  for (const k of KEYS) if (b.data && b.data[k] != null) custom[k] = String(b.data[k]).slice(0, 100);
  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || undefined;
  const page = String(b.page || '').slice(0, 500);
  if (!/^https:\/\/(www\.)?loanleaf\.co\/|^https:\/\/loanleaf-site\.vercel\.app\//.test(page)) return res.status(204).end(); // only our own pages
  const payload = {
    data: [{
      event_name: b.event, event_time: Math.floor(Date.now() / 1000), event_id: String(b.eventId || '').slice(0, 100) || undefined,
      action_source: 'website', event_source_url: page,
      user_data: { client_ip_address: ip, client_user_agent: req.headers['user-agent'], ...(b.fbc ? { fbc: String(b.fbc).slice(0, 300) } : {}), ...(b.fbp ? { fbp: String(b.fbp).slice(0, 100) } : {}) },
      custom_data: custom,
    }],
    ...(process.env.META_TEST_EVENT_CODE ? { test_event_code: process.env.META_TEST_EVENT_CODE } : {}),
  };
  try {
    const r = await fetch(`https://graph.facebook.com/v21.0/${process.env.META_PIXEL_ID || '658905286613269'}/events?access_token=${encodeURIComponent(token)}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal: AbortSignal.timeout(3000),
    });
    if (!r.ok) console.error('meta track', b.event, r.status, await r.text());
  } catch (err) { console.error('meta track', err.message); }
  return res.status(204).end();
}

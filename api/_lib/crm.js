// Broker CRM: contacts, pipeline, timeline, email (Resend), SMS (Bird) and stage-based email flows.
// Tables: crm_contacts, crm_activities, crm_flow_sends (see tools/platform-schema-7.sql). Admin UI: public/assets/crm.js.
import { createHmac } from 'node:crypto';
import { db, esc, secretKey, PLATFORM_URL, resendSlot, suppressedSet, birdMsgKey } from './platform.js';

export const STAGES = [
  ['new', 'New enquiry'], ['contacted', 'Contacted'], ['call_booked', 'Call booked'], ['proposal', 'Proposal sent'],
  ['onboarding', 'Signing up'], ['won', 'Customer'], ['nurture', 'Nurture'], ['lost', 'Lost'],
];
export const STAGE_KEYS = STAGES.map(([k]) => k);
// Forward order. Automatic updates only ever move a contact forwards (nurture/lost re-open to "new" on a fresh enquiry).
const RANK = { new: 1, contacted: 2, call_booked: 3, proposal: 4, onboarding: 5, won: 6 };
export const SOURCES = ['Website enquiry', 'Booked a call', 'Platform sign-up', 'Google search', 'Google Ads', 'Meta ads', 'LinkedIn', 'LinkedIn outreach', 'Cold email', 'Cold call',
  'Referral', 'Event', 'Invited to platform', 'Other'];

const SITE = 'https://leaflegal.co';
export const LINKS = {
  signup_link: `${PLATFORM_URL}/register`,
  calculator_link: `${SITE}/partners/cost-per-lead-calculator`,
  booking_link: `${SITE}/partners/apply`,
  partners_link: `${SITE}/partners`,
};
const SENDER = () => 'The Leaflegal team'; // no personal name on emails
const REPLY_TO = () => process.env.CRM_REPLY_TO || (process.env.ENQUIRY_TO || 'aran@verticalbrands.co').split(',')[0].trim();

// ---------------------------------------------------------------- where did they come from
// First-touch data from the site (nav.js: utm_*, gclid, fbclid, external referrer) → a readable source.
export function sourceFrom(src = {}, fallback = 'Website enquiry') {
  const s = String(src.utm_source || '').toLowerCase(), m = String(src.utm_medium || '').toLowerCase(), ref = String(src.referrer || '').toLowerCase();
  if (src.gclid || (s === 'google' && /cpc|ppc|paid/.test(m))) return 'Google Ads';
  if (src.fbclid || /facebook|instagram|meta|fb|ig/.test(s)) return 'Meta ads';
  if (src.li_fat_id || /linkedin/.test(s) || /linkedin\./.test(ref)) return 'LinkedIn';
  if (/email|newsletter/.test(m) || /lemlist|outreach/.test(s)) return 'Cold email';
  if (/referral|partner/.test(m)) return 'Referral';
  if (/google\./.test(ref) || /bing\.|duckduckgo|ecosia|yahoo\./.test(ref)) return 'Google search';
  return fallback;
}
export const describeSource = (src = {}) => [src.utm_source && `utm_source=${src.utm_source}`, src.utm_medium && `utm_medium=${src.utm_medium}`, src.utm_campaign && `campaign=${src.utm_campaign}`,
  src.referrer && `from ${src.referrer.replace(/^https?:\/\//, '').slice(0, 80)}`, src.landing && `landed on ${src.landing}`].filter(Boolean).join(' · ') || null;

// ---------------------------------------------------------------- contacts
const clean = (v, n = 200) => (v == null ? null : String(v).trim().slice(0, n) || null);
export const normEmail = (e) => clean(e, 200)?.toLowerCase() || null;
// UK numbers to E.164 (07… → +447…). Anything else is kept as typed.
export function e164(p) {
  const d = String(p || '').replace(/[^\d+]/g, '');
  if (!d) return null;
  if (d.startsWith('+')) return d;
  if (d.startsWith('00')) return `+${d.slice(2)}`;
  if (d.startsWith('44')) return `+${d}`;
  if (d.startsWith('0')) return `+44${d.slice(1)}`;
  return d;
}
export const isMobile = (p) => /^\+447\d{9}$/.test(e164(p) || '');

export async function activity(contactId, kind, { subject = null, body = null, meta = null, by = null } = {}) {
  await db('crm_activities', { method: 'POST', body: { contact_id: contactId, kind, subject: clean(subject, 300), body: body == null ? null : String(body).slice(0, 20000), meta, by_id: by } });
}

export async function setStage(c, stage, by = null, why = '') {
  if (!STAGE_KEYS.includes(stage) || c.stage === stage) return c;
  const [u] = await db(`crm_contacts?id=eq.${c.id}`, { method: 'PATCH', body: { stage, stage_changed_at: new Date().toISOString(), updated_at: new Date().toISOString() }, prefer: 'return=representation' });
  await activity(c.id, 'stage', { body: `${stageName(c.stage)} → ${stageName(stage)}${why ? ` (${why})` : ''}`, meta: { from: c.stage, to: stage }, by });
  return u || { ...c, stage };
}
export const stageName = (k) => STAGES.find(([x]) => x === k)?.[1] || k;

// Create or update a contact from an automatic touchpoint (enquiry, platform sign-up, payment).
// Never overwrites what's already there with blanks, and only moves the stage forwards.
export async function capture({ email, name, company, phone, position, website, source, sourceDetail, utm, leadsPerMonth, budget, stage, brokerId, note, tags = [], flowsPaused = false }) {
  email = normEmail(email);
  if (!email) return null;
  const [cur] = (await db(`crm_contacts?email=eq.${encodeURIComponent(email)}&select=*&limit=1`)) || [];
  const fields = { name: clean(name), company: clean(company), phone: clean(phone, 40), position: clean(position), website: clean(website),
    leads_per_month: clean(leadsPerMonth, 40), budget: clean(budget, 60), broker_id: brokerId || null };
  if (!cur) {
    const [c] = (await db('crm_contacts', { method: 'POST', prefer: 'return=representation', body: {
      ...Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, v ?? (k === 'name' || k === 'company' ? '' : null)])),
      email, source: source || 'Other', source_detail: clean(sourceDetail, 400), utm: utm || null, stage: stage || 'new', tags, flows_paused: !!flowsPaused } })) || [];
    if (!c) return null;
    await activity(c.id, 'system', { body: note || `Added from ${source || 'an automatic touchpoint'}` });
    return { contact: c, created: true };
  }
  const patch = Object.fromEntries(Object.entries(fields).filter(([k, v]) => v && !cur[k]));
  if (tags.length) patch.tags = [...new Set([...(cur.tags || []), ...tags])];
  if (Object.keys(patch).length) await db(`crm_contacts?id=eq.${cur.id}`, { method: 'PATCH', body: { ...patch, updated_at: new Date().toISOString() } });
  let c = { ...cur, ...patch };
  if (note) await activity(c.id, 'system', { body: note });
  if (stage) {
    const reopen = ['nurture', 'lost'].includes(c.stage) && stage === 'new';
    if (reopen || (RANK[stage] || 0) > (RANK[c.stage] || 0)) c = await setStage(c, stage, null, reopen ? 'enquired again' : 'automatic');
  }
  return { contact: c, created: false };
}

// Someone unsubscribed from an invite: mark them Not interested in the CRM (stage Lost, tag, flows off, unsubscribed).
export async function markNotInterested(email, why = 'Unsubscribed from the invite') {
  const e = normEmail(email); if (!e) return null;
  const [c] = (await db(`crm_contacts?email=eq.${encodeURIComponent(e)}&select=*&limit=1`)) || [];
  if (!c) return null;
  const now = new Date().toISOString();
  await db(`crm_contacts?id=eq.${c.id}`, { method: 'PATCH', body: { tags: [...new Set([...(c.tags || []), 'Not interested'])], flows_paused: true, unsubscribed_at: c.unsubscribed_at || now, updated_at: now } });
  if (!['won', 'onboarding'].includes(c.stage)) await setStage(c, 'lost', null, `Not interested: ${why.toLowerCase()}`);
  else await activity(c.id, 'system', { body: why });
  return c.id;
}

// ---------------------------------------------------------------- message rendering
// Bodies are plain text: blank lines split paragraphs, [label](url) makes a link, {merge_tags} fill in per contact.
export const firstName = (c) => String(c.name || '').trim().split(/\s+/)[0] || '';
export function merge(text, c) {
  const vars = { first_name: firstName(c) || 'there', name: c.name || '', company: c.company || 'your firm', sender_name: SENDER(), ...LINKS };
  return String(text || '').replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m));
}
const linkify = (escaped) => escaped.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, (m, label, url) => `<a href="${url}" style="color:#244237;font-weight:bold">${label}</a>`);
export function renderEmail(body, c, unsubUrl) {
  const text = merge(body, c);
  const paras = text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const F = 'font-family:Arial,Helvetica,sans-serif;';
  const html = `<!doctype html><html><body style="margin:0;padding:0;background:#ffffff"><div style="${F}max-width:560px;padding:24px 20px;font-size:15px;line-height:1.6;color:#1f3029">
${paras.map((p) => `<p style="margin:0 0 16px">${linkify(esc(p)).replace(/\n/g, '<br>')}</p>`).join('\n')}
<p style="margin:24px 0 0">${esc(SENDER())}<br><span style="color:#62786f">Leaflegal · <a href="${SITE}/partners" style="color:#62786f">leaflegal.co/partners</a></span></p>
<p style="margin:32px 0 0;padding-top:14px;border-top:1px solid #e3eae6;font-size:12px;line-height:1.5;color:#86998f">Leaflegal is a trading name of Vertical Brands Ltd, company number 14254961, 20-22 Wenlock Road, London N1 7GU.${unsubUrl ? ` Don't want these emails? <a href="${unsubUrl}" style="color:#86998f">Unsubscribe</a>.` : ''}</p>
</div></body></html>`;
  const plain = `${text.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '$1 ($2)')}\n\n${SENDER()}\nLeaflegal · leaflegal.co/partners${unsubUrl ? `\n\nUnsubscribe: ${unsubUrl}` : ''}`;
  return { html, text: plain };
}

// ---------------------------------------------------------------- sending
const sig = (id, exp) => createHmac('sha256', secretKey()).update(`crm-unsub:${id}:${exp}`).digest('hex').slice(0, 40);
export const unsubUrl = (id) => { const exp = Date.now() + 730 * 864e5; return `${PLATFORM_URL}/api/crm?action=unsub&id=${id}&exp=${exp}&sig=${sig(id, exp)}`; };
export const unsubOk = (id, exp, s) => Number(exp) > Date.now() && typeof s === 'string' && s === sig(id, exp);

export async function sendCrmEmail(c, subject, body, { by = null, flowStep = null } = {}) {
  if (!process.env.RESEND_API_KEY) throw new Error('Email isn’t set up (RESEND_API_KEY missing)');
  if (!c.email) throw new Error('This contact has no email address');
  if ((await suppressedSet([c.email])).size) throw new Error(`${c.email} has unsubscribed from Leaflegal emails`);
  const unsub = unsubUrl(c.id), subj = merge(subject, c).slice(0, 200);
  const { html, text } = renderEmail(body, c, unsub);
  await resendSlot();
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST', headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(8000),
    body: JSON.stringify({ from: `Leaflegal <${process.env.CRM_FROM || process.env.ENQUIRY_FROM || 'onboarding@resend.dev'}>`, to: [c.email], reply_to: REPLY_TO(), subject: subj, html, text,
      headers: { 'List-Unsubscribe': `<${unsub}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' }, tags: [{ name: 'kind', value: flowStep ? 'crm_flow' : 'crm' }] }),
  }).catch((e) => ({ ok: false, text: async () => e.message }));
  if (!r.ok) { const t = await r.text(); console.error('crm resend', r.status, t); throw new Error('The email couldn’t be sent. Please try again.'); }
  const id = (await r.json().catch(() => ({}))).id || null;
  await activity(c.id, flowStep ? 'flow' : 'email', { subject: subj, body: merge(body, c), meta: { email_id: id, to: c.email, ...(flowStep ? { step: flowStep } : {}) }, by });
  await db(`crm_contacts?id=eq.${c.id}`, { method: 'PATCH', body: { last_contacted_at: new Date().toISOString(), updated_at: new Date().toISOString() } });
  return id;
}

// SMS through Bird (bird.com). Env: BIRD_API_KEY (workspace key, bk_<region>_…) and BIRD_SMS_FROM (approved sender: number or alphanumeric ID).
export const smsReady = () => !!(birdMsgKey() && process.env.BIRD_SMS_FROM);
export async function sendCrmSms(c, text, { by = null } = {}) {
  const to = e164(c.phone);
  if (!to) throw new Error('This contact has no phone number');
  const body = merge(text, c).slice(0, 640);
  if (!smsReady()) throw new Error('SMS isn’t set up yet');
  const region = (String(birdMsgKey()).match(/^b[km]_([a-z]+\d)_/) || [])[1] || process.env.BIRD_REGION || 'eu1';
  const r = await fetch(`https://${region}.platform.bird.com/v1/sms/messages`, {
    method: 'POST', headers: { Authorization: `Bearer ${birdMsgKey()}`, 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(8000),
    body: JSON.stringify({ to, from: process.env.BIRD_SMS_FROM, text: body, category: 'marketing' }),
  }).catch((e) => ({ ok: false, text: async () => e.message }));
  if (!r.ok) { const t = await r.text(); console.error('crm bird', r.status, t); throw new Error('The text couldn’t be sent. Please check the number and try again.'); }
  const id = (await r.json().catch(() => ({}))).id || null;
  await activity(c.id, 'sms', { body, meta: { sms_id: id, to }, by });
  await db(`crm_contacts?id=eq.${c.id}`, { method: 'PATCH', body: { last_contacted_at: new Date().toISOString(), updated_at: new Date().toISOString() } });
  return id;
}

// ---------------------------------------------------------------- stage email flows
// Each step: sent `day` days after the contact entered `stage`, if they're still in it. Edit copy in the CRM (Flows tab);
// edits are stored in settings.crm_flows and override these defaults per step id.
export const FLOW_DEFAULTS = [
  { id: 'new:0', stage: 'new', day: 0, subject: 'Thanks for getting in touch, {first_name}',
    body: `Hi {first_name},

Thanks for your interest in Leaflegal.

In short: UK limited companies and LLPs tell us what funding they need, and we pass each enquiry to one broker only. You see the business's revenue, time trading, loan size and credit history before you buy, and leads arrive in your inbox or CRM the moment they come in.

If you'd like to look around first, you can [create an account here]({signup_link}). We approve new accounts within one working day, and then you can see live leads straight away.

Or just reply to this email with any questions.` },
  { id: 'new:3', stage: 'new', day: 3, subject: 'What a Leaflegal lead costs',
    body: `Hi {first_name},

A quick follow-up. Brokers usually ask what a lead will cost them, so we've put the pricing out in the open.

Each lead is priced on how fundable it is: loan size, the business's revenue, how long it's been trading and its credit history. You can [try a few examples here]({calculator_link}).

You see every price before you buy, and you can set a maximum so auto-buy never goes over it.

Happy to talk it through if useful. Just reply with a good time.` },

  { id: 'contacted:3', stage: 'contacted', day: 3, subject: 'Re: business loan leads for {company}',
    body: `Hi {first_name},

Just following up on our last message. Are you taking on new commercial finance clients at the moment?

We send exclusive enquiries from UK limited companies and LLPs, each one to a single broker, with revenue, time trading and credit history checked before it reaches you.

Worth a quick chat?` },
  { id: 'contacted:8', stage: 'contacted', day: 8, subject: 'What’s in a Leaflegal lead',
    body: `Hi {first_name},

In case it's useful, here's what you'd get with every lead:

The amount, what it's for and how soon they need it. Annual revenue and time trading. Missed payments, defaults or CCJs in the last 6 years. Any existing finance. A verified UK mobile and email. And the exact consent wording they agreed to.

Prices depend on how fundable the business is. You can [see how pricing works here]({calculator_link}).` },
  { id: 'contacted:16', stage: 'contacted', day: 16, subject: 'Should we close your file?',
    body: `Hi {first_name},

We haven't heard back, so we'll assume now isn't the right time and stop following up.

If that changes, you can [set up an account here]({signup_link}) whenever suits you, or just reply to this email.

All the best.` },

  { id: 'proposal:2', stage: 'proposal', day: 2, subject: 'Any questions about the plans?',
    body: `Hi {first_name},

Following up on the plans we sent over. Did you have any questions?

As a reminder, your first month can be £1,000 + VAT instead of £2,500, so you can see the lead quality for yourself before committing. You can cancel at any time.

When you're ready, you can [set up your account here]({signup_link}).` },
  { id: 'proposal:6', stage: 'proposal', day: 6, subject: 'Working out your cost per lead',
    body: `Hi {first_name},

If it helps with the numbers, our [cost per lead calculator]({calculator_link}) shows what a lead would cost you based on loan size, revenue, time trading and credit history.

Let us know if you'd like to go through it together.` },

  { id: 'onboarding:1', stage: 'onboarding', day: 1, subject: 'Finishing your Leaflegal setup',
    body: `Hi {first_name},

Thanks for signing up to Leaflegal Platform. There are three things to do before you can start buying leads:

1. Tell us what you fund: loan sizes, purposes and the businesses you work with.
2. Choose a monthly plan. Your first month can be £1,000 + VAT.
3. Accept the partner agreement online.

It takes about five minutes. [Continue setup here]({signup_link}).` },
  { id: 'onboarding:4', stage: 'onboarding', day: 4, subject: 'Need a hand getting set up?',
    body: `Hi {first_name},

We noticed your account isn't fully set up yet. If anything's unclear, or you'd rather go through it on a call, just reply and we'll take you through it.

It usually takes 10 minutes together.` },

  { id: 'won:30', stage: 'won', day: 30, subject: 'How are the leads going?',
    body: `Hi {first_name},

You've been with us for a month now, so we wanted to check in. How are you finding the leads?

If there's anything we could do better, such as lead types, volumes or how they're delivered, we'd really like to hear it. Just reply to this email.` },

  { id: 'nurture:30', stage: 'nurture', day: 30, subject: 'Checking in from Leaflegal',
    body: `Hi {first_name},

It's been a little while, so we thought we'd check in. We're seeing steady demand from businesses looking for funding, and there are leads live on the platform now.

If the timing's better now, you can [have a look here]({signup_link}).` },
  { id: 'nurture:90', stage: 'nurture', day: 90, subject: 'Still looking for business loan leads?',
    body: `Hi {first_name},

Just a quick note to say the offer of a first month for £1,000 + VAT still stands, if you'd like to try Leaflegal.

Reply here if you'd like to talk it through.` },
];

export async function getFlows() {
  let over = {};
  try { const [r] = await db('settings?key=eq.crm_flows&select=value'); over = r?.value || {}; } catch {}
  return FLOW_DEFAULTS.map((s) => ({ ...s, on: true, ...(over[s.id] || {}), id: s.id, stage: s.stage, default: s }));
}

// The flow step due for this contact now, if any (one per contact per run, at least 2 days after the last message).
export function dueStep(c, flows, sentSteps, now = Date.now()) {
  if (c.flows_paused || c.unsubscribed_at || !c.email) return null;
  if (c.last_contacted_at && now - Date.parse(c.last_contacted_at) < 2 * 864e5 && !(c.stage === 'new' && !sentSteps.size)) return null;
  const inStage = (now - Date.parse(c.stage_changed_at)) / 864e5;
  return flows.filter((s) => s.on && s.stage === c.stage && s.day <= inStage && !sentSteps.has(s.id)).sort((a, b) => a.day - b.day)[0] || null;
}

// Sends any due flow email. Used by the daily cron and right after an enquiry comes in.
export async function runFlows({ contactIds = null, limit = 200 } = {}) {
  const flows = await getFlows();
  const stages = [...new Set(flows.filter((s) => s.on).map((s) => s.stage))];
  if (!stages.length) return { checked: 0, sent: 0 };
  const filter = contactIds ? `id=in.(${contactIds.join(',')})` : `stage=in.(${stages.join(',')})`;
  const list = await db(`crm_contacts?${filter}&flows_paused=is.false&unsubscribed_at=is.null&email=not.is.null&select=*&limit=${limit}`);
  if (!list.length) return { checked: 0, sent: 0 };
  const sends = await db(`crm_flow_sends?contact_id=in.(${list.map((c) => c.id).join(',')})&select=contact_id,step`);
  let sent = 0;
  for (const c of list) {
    const done = new Set(sends.filter((s) => s.contact_id === c.id).map((s) => s.step));
    const step = dueStep(c, flows, done);
    if (!step) continue;
    // Claim the step first (primary key), so two overlapping runs can never send it twice.
    const claimed = await db('crm_flow_sends', { method: 'POST', body: { contact_id: c.id, step: step.id }, prefer: 'return=representation,resolution=ignore-duplicates' }).catch(() => []);
    if (!claimed?.length) continue;
    try {
      const id = await sendCrmEmail(c, step.subject, step.body, { flowStep: step.id });
      await db(`crm_flow_sends?contact_id=eq.${c.id}&step=eq.${encodeURIComponent(step.id)}`, { method: 'PATCH', body: { email_id: id } });
      sent++;
    } catch (e) {
      console.error('crm flow', c.id, step.id, e.message);
      await db(`crm_flow_sends?contact_id=eq.${c.id}&step=eq.${encodeURIComponent(step.id)}`, { method: 'DELETE' }).catch(() => {}); // retry next run
    }
  }
  return { checked: list.length, sent };
}

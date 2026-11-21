// Broker CRM API (admin only, except the unsubscribe link and the daily flow cron). UI: public/assets/crm.js.
import { db, esc, configured, SUPABASE_URL, PUBLISHABLE_KEY, suppress, birdMsgKey } from './_lib/platform.js';
import { STAGES, STAGE_KEYS, SOURCES, LINKS, FLOW_DEFAULTS, capture, activity, setStage, sendCrmEmail, sendCrmSms, smsReady, getFlows, runFlows, renderEmail, merge,
  unsubOk, normEmail, e164, isMobile } from './_lib/crm.js';

const fail = (res, status, error) => res.status(status).json({ error });
const clean = (v, n = 200) => (v == null || v === '' ? null : String(v).trim().slice(0, n) || null);
const FIELDS = { name: 200, company: 200, email: 200, phone: 40, position: 120, website: 200, source: 60, source_detail: 400, leads_per_month: 40, budget: 60, next_action: 300, lost_reason: 300 };

async function admin(req) {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) return { status: 401 };
  const r = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: { apikey: PUBLISHABLE_KEY, Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(5000) }).catch(() => null);
  if (!r?.ok) return { status: 401 };
  const u = await r.json();
  const [b] = await db(`brokers?id=eq.${u.id}&select=id,is_admin,email,company`);
  return b?.is_admin ? b : { status: 403 };
}

const page = (res, title, msg) => res.status(200).setHeader('Content-Type', 'text/html; charset=utf-8').setHeader('X-Robots-Tag', 'noindex').send(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)} | Loanleaf</title>
<style>body{margin:0;background:#eef3f1;font:16px/1.55 Arial,Helvetica,sans-serif;color:#1b3329}.c{max-width:520px;margin:48px auto;background:#fff;border-radius:18px;padding:32px}h1{margin:0 0 12px;font-size:22px}</style></head><body><div class="c"><h1>${esc(title)}</h1><p>${msg}</p></div></body></html>`);

// The contact list carries enough for the board, table and filters; the full record (timeline etc.) loads per contact.
const LIST = 'id,created_at,updated_at,name,company,email,phone,position,source,stage,stage_changed_at,value,leads_per_month,budget,tags,next_action,next_action_at,last_contacted_at,broker_id,flows_paused,unsubscribed_at,lost_reason';

export default async function handler(req, res) {
  if (!configured()) return fail(res, 503, 'Not configured');
  const url = new URL(req.url, 'http://x'), q = Object.fromEntries(url.searchParams), action = q.action || '';
  let b = {};
  if (req.method === 'POST') { try { b = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {}; } catch { return fail(res, 400, 'Bad JSON'); } }
  try {
    // ------------------------------------------------ public
    if (action === 'unsub') {
      if (!unsubOk(q.id, q.exp, q.sig)) return page(res, 'Link expired', 'This unsubscribe link has expired. Reply to any of our emails and we’ll take you off the list.');
      const [c] = await db(`crm_contacts?id=eq.${Number(q.id)}&select=id,email,unsubscribed_at`);
      if (c?.email) await suppress(c.email, req.method === 'POST' ? 'One-click unsubscribe' : 'Unsubscribe link', 'crm');
      if (c && !c.unsubscribed_at) {
        await db(`crm_contacts?id=eq.${c.id}`, { method: 'PATCH', body: { unsubscribed_at: new Date().toISOString() } });
        await activity(c.id, 'system', { body: `Unsubscribed from emails${req.method === 'POST' ? ' (one-click)' : ''}` });
      }
      return page(res, 'You’re unsubscribed', 'We won’t send you any more emails like this. If you have a Loanleaf Platform account, you’ll still get emails about your account and the leads you buy.');
    }
    // Daily (vercel.json crons). Each step is claimed in crm_flow_sends before sending, so reruns never double-send.
    if (action === 'cron') {
      if (process.env.CRON_SECRET && req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) return fail(res, 401, 'Unauthorised');
      const day = new Date().getUTCDay();
      if (day === 0 || day === 6) return res.json({ ok: true, skipped: 'weekend' }); // flow emails go out on weekdays only
      return res.json({ ok: true, ...(await runFlows()) });
    }

    // ------------------------------------------------ admin
    const me = await admin(req);
    if (me.status) return fail(res, me.status, me.status === 401 ? 'Please sign in again' : 'Admins only');
    const id = Number(b.id || q.id);
    const one = async () => { const [c] = await db(`crm_contacts?id=eq.${id}&select=*`); if (!c) throw Object.assign(new Error('Contact not found'), { status: 404 }); return c; };

    if (action === 'list') {
      const [contacts, recent] = await Promise.all([
        db(`crm_contacts?select=${LIST}&order=updated_at.desc,id.desc&limit=20000`),
        db('crm_activities?select=id,contact_id,created_at,kind,subject,body&kind=in.(email,sms,flow,note,call)&order=created_at.desc&limit=40'),
      ]);
      return res.json({ contacts, recent, stages: STAGES, sources: SOURCES, sms: smsReady(), wa: !!(birdMsgKey() && process.env.BIRD_WA_FROM), links: LINKS });
    }

    if (action === 'contact') {
      const c = await one();
      const [acts, sends, flows, [broker]] = await Promise.all([
        db(`crm_activities?contact_id=eq.${id}&select=*&order=created_at.desc&limit=300`),
        db(`crm_flow_sends?contact_id=eq.${id}&select=step,sent_at`),
        getFlows(),
        c.broker_id ? db(`brokers?id=eq.${c.broker_id}&select=id,company,credits,approved,suspended_at,mode,created_at,stripe_customer`) : [[]],
      ]);
      const done = new Set(sends.map((s) => s.step));
      const inStage = (Date.now() - Date.parse(c.stage_changed_at)) / 864e5;
      const upcoming = flows.filter((s) => s.on && s.stage === c.stage && !done.has(s.id)).map((s) => ({ id: s.id, subject: s.subject, day: s.day, due: new Date(Date.parse(c.stage_changed_at) + s.day * 864e5).toISOString(), overdue: s.day <= inStage }));
      return res.json({ contact: c, activities: acts, sent: sends, upcoming, broker: broker || null, mobile: isMobile(c.phone), e164: e164(c.phone) });
    }

    if (action === 'save' && req.method === 'POST') {
      const patch = {};
      for (const [k, n] of Object.entries(FIELDS)) if (k in b) patch[k] = clean(b[k], n);
      if ('email' in b) patch.email = normEmail(b.email);
      if ('value' in b) patch.value = b.value === '' || b.value == null ? null : Math.max(0, Math.round(Number(b.value) || 0));
      if ('tags' in b) patch.tags = (Array.isArray(b.tags) ? b.tags : String(b.tags || '').split(',')).map((t) => String(t).trim().slice(0, 40)).filter(Boolean).slice(0, 20);
      if ('next_action_at' in b) patch.next_action_at = b.next_action_at ? new Date(b.next_action_at).toISOString() : null;
      if ('flows_paused' in b) patch.flows_paused = !!b.flows_paused;
      if ('resubscribe' in b && b.resubscribe) patch.unsubscribed_at = null;
      if (patch.source && !SOURCES.includes(patch.source)) patch.source = 'Other';
      if (!id) {
        if (!patch.name && !patch.company && !patch.email) return fail(res, 400, 'Add at least a name, company or email');
        if (patch.email) { const [dupe] = await db(`crm_contacts?email=eq.${encodeURIComponent(patch.email)}&select=id,name,company`); if (dupe) return fail(res, 409, `${dupe.name || dupe.company || patch.email} is already in the CRM`); }
        const stage = STAGE_KEYS.includes(b.stage) ? b.stage : 'contacted';
        const [c] = await db('crm_contacts', { method: 'POST', prefer: 'return=representation', body: { name: '', company: '', source: 'Other', ...patch, stage } });
        await activity(c.id, 'system', { body: `Added by ${me.company || 'an admin'}`, by: me.id });
        if (b.note) await activity(c.id, 'note', { body: String(b.note).slice(0, 5000), by: me.id });
        return res.json({ ok: true, contact: c });
      }
      let c = await one();
      if (patch.email && patch.email !== c.email) { const [dupe] = await db(`crm_contacts?email=eq.${encodeURIComponent(patch.email)}&id=neq.${id}&select=id`); if (dupe) return fail(res, 409, 'Another contact already has that email'); }
      if (Object.keys(patch).length) [c] = await db(`crm_contacts?id=eq.${id}`, { method: 'PATCH', body: { ...patch, updated_at: new Date().toISOString() }, prefer: 'return=representation' });
      if (b.stage && STAGE_KEYS.includes(b.stage) && b.stage !== c.stage) c = await setStage(c, b.stage, me.id);
      return res.json({ ok: true, contact: c });
    }

    if (action === 'stage' && req.method === 'POST') {
      if (!STAGE_KEYS.includes(b.stage)) return fail(res, 400, 'Unknown stage');
      const c = await setStage(await one(), b.stage, me.id);
      if (b.stage === 'lost' && b.reason) await db(`crm_contacts?id=eq.${id}`, { method: 'PATCH', body: { lost_reason: clean(b.reason, 300) } });
      return res.json({ ok: true, contact: c });
    }

    if (action === 'note' && req.method === 'POST') {
      const kind = b.kind === 'call' ? 'call' : 'note', text = String(b.body || '').trim();
      if (!text) return fail(res, 400, 'Write something first');
      const c = await one();
      await activity(c.id, kind, { body: text.slice(0, 10000), meta: b.outcome ? { outcome: clean(b.outcome, 60) } : null, by: me.id });
      await db(`crm_contacts?id=eq.${id}`, { method: 'PATCH', body: { updated_at: new Date().toISOString(), ...(kind === 'call' ? { last_contacted_at: new Date().toISOString() } : {}) } });
      return res.json({ ok: true });
    }

    if (action === 'note-delete' && req.method === 'POST') {
      await db(`crm_activities?id=eq.${Number(b.activity)}&contact_id=eq.${id}&kind=in.(note,call)`, { method: 'DELETE' });
      return res.json({ ok: true });
    }

    if (action === 'email' && req.method === 'POST') {
      const c = await one();
      if (c.unsubscribed_at && !b.force) return fail(res, 409, `${c.name || c.email} unsubscribed on ${new Date(c.unsubscribed_at).toLocaleDateString('en-GB')}.`);
      if (!String(b.subject || '').trim() || !String(b.body || '').trim()) return fail(res, 400, 'Add a subject and a message');
      const emailId = await sendCrmEmail(c, b.subject, b.body, { by: me.id });
      if (b.stage && STAGE_KEYS.includes(b.stage)) await setStage(c, b.stage, me.id);
      return res.json({ ok: true, id: emailId });
    }

    if (action === 'sms' && req.method === 'POST') {
      const c = await one(), text = String(b.body || '').trim();
      if (!text) return fail(res, 400, 'Write a message first');
      if (b.logOnly) { // sent from the admin's own phone: just record it
        await activity(c.id, 'sms', { body: merge(text, c), meta: { to: e164(c.phone), via: 'phone' }, by: me.id });
        await db(`crm_contacts?id=eq.${id}`, { method: 'PATCH', body: { last_contacted_at: new Date().toISOString(), updated_at: new Date().toISOString() } });
        return res.json({ ok: true });
      }
      return res.json({ ok: true, id: await sendCrmSms(c, text, { by: me.id }) });
    }

    if (action === 'preview' && req.method === 'POST') {
      const c = id ? await one() : { id: 0, name: 'Sam Taylor', company: 'Taylor Finance Ltd' };
      return res.json({ subject: merge(b.subject, c), html: renderEmail(b.body, c, '#').html });
    }

    if (action === 'delete' && req.method === 'POST') {
      await one();
      await db(`crm_contacts?id=eq.${id}`, { method: 'DELETE' });
      return res.json({ ok: true });
    }

    // Bulk add from a pasted CSV (name, company, email, phone, ...). Skips emails already in the CRM.
    if (action === 'import' && req.method === 'POST') {
      const rows = Array.isArray(b.rows) ? b.rows.slice(0, 1000) : [];
      const source = SOURCES.includes(b.source) ? b.source : 'Other', stage = STAGE_KEYS.includes(b.stage) ? b.stage : 'contacted';
      const tags = String(b.tags || '').split(',').map((t) => t.trim()).filter(Boolean).slice(0, 10);
      const emails = rows.map((r) => normEmail(r.email)).filter(Boolean);
      const have = new Set(emails.length ? (await db(`crm_contacts?email=in.(${emails.map((e) => `"${e.replace(/"/g, '')}"`).join(',')})&select=email`)).map((x) => x.email) : []);
      const seen = new Set(), add = [];
      for (const r of rows) {
        const email = normEmail(r.email);
        if (email && (have.has(email) || seen.has(email))) continue;
        if (!email && !clean(r.name) && !clean(r.company)) continue;
        if (email) seen.add(email);
        add.push({ name: clean(r.name) || '', company: clean(r.company) || '', email, phone: clean(r.phone, 40), position: clean(r.position, 120), website: clean(r.website),
          source, stage, tags, flows_paused: !!b.flowsPaused, source_detail: clean(b.detail, 400) });
      }
      const made = add.length ? await db('crm_contacts', { method: 'POST', body: add, prefer: 'return=representation' }) : [];
      if (made.length) await db('crm_activities', { method: 'POST', body: made.map((c) => ({ contact_id: c.id, kind: 'system', body: `Imported by ${me.company || 'an admin'}`, by_id: me.id })) });
      return res.json({ ok: true, added: made.length, skipped: rows.length - made.length });
    }

    if (action === 'flows') {
      if (req.method === 'POST') {
        const over = {};
        for (const s of Array.isArray(b.flows) ? b.flows : []) {
          const d = FLOW_DEFAULTS.find((x) => x.id === s.id);
          if (!d) continue;
          const o = {};
          if (s.on === false) o.on = false;
          const day = Math.max(0, Math.min(365, Math.round(Number(s.day))));
          if (Number.isFinite(day) && day !== d.day) o.day = day;
          if (s.subject && s.subject.trim() !== d.subject) o.subject = String(s.subject).trim().slice(0, 200);
          if (s.body && s.body.trim() !== d.body.trim()) o.body = String(s.body).slice(0, 8000);
          if (Object.keys(o).length) over[s.id] = o;
        }
        await db('settings', { method: 'POST', body: { key: 'crm_flows', value: over, updated_at: new Date().toISOString() }, prefer: 'resolution=merge-duplicates' });
      }
      const [flows, sends] = await Promise.all([getFlows(), db('crm_flow_sends?select=step&limit=20000')]);
      const counts = sends.reduce((a, s) => ((a[s.step] = (a[s.step] || 0) + 1), a), {});
      return res.json({ flows: flows.map(({ default: d, ...s }) => ({ ...s, sent: counts[s.id] || 0, edited: s.subject !== d.subject || s.body !== d.body || s.day !== d.day })), stages: STAGES });
    }

    if (action === 'run-flows' && req.method === 'POST') return res.json({ ok: true, ...(await runFlows(id ? { contactIds: [id] } : {})) });

    // Invite a CRM contact to the platform (reuses the platform's own invite).
    if (action === 'link-broker' && req.method === 'POST') {
      const c = await one();
      const [br] = c.email ? await db(`brokers?email=eq.${encodeURIComponent(c.email)}&select=id`) : [];
      if (!br) return fail(res, 404, 'No platform account uses this email yet');
      await db(`crm_contacts?id=eq.${id}`, { method: 'PATCH', body: { broker_id: br.id } });
      return res.json({ ok: true });
    }

    return fail(res, 404, 'Not found');
  } catch (e) {
    console.error('crm', action, e.message);
    return fail(res, e.status || 500, e.status ? e.message : e.message?.startsWith('db ') ? 'Something went wrong. Please try again.' : e.message);
  }
}

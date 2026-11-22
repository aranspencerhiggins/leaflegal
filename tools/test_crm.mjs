// CRM logic checks: node tools/test_crm.mjs
import assert from 'node:assert/strict';
import { sourceFrom, describeSource, e164, isMobile, merge, renderEmail, dueStep, FLOW_DEFAULTS, STAGE_KEYS } from '../api/_lib/crm.js';

// how they found us
assert.equal(sourceFrom({ gclid: 'x' }), 'Google Ads');
assert.equal(sourceFrom({ utm_source: 'google', utm_medium: 'cpc' }), 'Google Ads');
assert.equal(sourceFrom({ fbclid: 'x' }), 'Meta ads');
assert.equal(sourceFrom({ referrer: 'https://www.linkedin.com/feed/' }), 'LinkedIn');
assert.equal(sourceFrom({ referrer: 'https://www.google.co.uk/' }), 'Google search');
assert.equal(sourceFrom({ utm_source: 'lemlist', utm_medium: 'email' }), 'Cold email');
assert.equal(sourceFrom({}), 'Website enquiry');
assert.match(describeSource({ utm_source: 'linkedin', landing: '/partners' }), /utm_source=linkedin · landed on \/partners/);

// phones
assert.equal(e164('07700 900123'), '+447700900123');
assert.equal(e164('+44 7700 900123'), '+447700900123');
assert.equal(e164('0044 20 7946 0000'), '+442079460000');
assert.ok(isMobile('07700900123') && !isMobile('020 7946 0000'));

// merge tags + rendering (escaped, real anchors, unsubscribe link)
const c = { id: 1, name: 'Sam Taylor', company: 'Taylor & Co' };
assert.equal(merge('Hi {first_name} at {company}, {unknown}', c), 'Hi Sam at Taylor & Co, {unknown}');
assert.equal(merge('Hi {first_name}', { name: '' }), 'Hi there');
const r = renderEmail('Hi {first_name},\n\n[Sign up here]({signup_link}) <b>x</b>', c, 'https://u.example/unsub');
assert.match(r.html, /<a href="https:\/\/leaflegal\.co\/platform\/register"[^>]*>Sign up here<\/a>/);
assert.match(r.html, /&lt;b&gt;x&lt;\/b&gt;/, 'body HTML is escaped');
assert.match(r.html, /https:\/\/u\.example\/unsub/);
assert.match(r.text, /Sign up here \(https:\/\/leaflegal\.co\/platform\/register\)/);

// flows: every step points at a real stage, ids are unique, bodies have no unknown tags
assert.equal(new Set(FLOW_DEFAULTS.map((s) => s.id)).size, FLOW_DEFAULTS.length);
for (const s of FLOW_DEFAULTS) {
  assert.ok(STAGE_KEYS.includes(s.stage), s.id);
  assert.doesNotMatch(merge(`${s.subject} ${s.body}`, c), /\{\w+\}/, `${s.id} has an unknown merge tag`);
  assert.doesNotMatch(s.body, /application/i, `${s.id}: avoid "application"`);
}

// flow timing
const flows = FLOW_DEFAULTS.map((s) => ({ ...s, on: true })), day = 864e5, now = Date.parse('2026-11-10T08:00:00Z');
const base = { email: 'a@b.co', stage: 'contacted', flows_paused: false, unsubscribed_at: null, last_contacted_at: null };
const at = (d) => new Date(now - d * day).toISOString();
assert.equal(dueStep({ ...base, stage_changed_at: at(1) }, flows, new Set(), now), null, 'nothing due on day 1 of contacted');
assert.equal(dueStep({ ...base, stage_changed_at: at(3) }, flows, new Set(), now).id, 'contacted:3');
assert.equal(dueStep({ ...base, stage_changed_at: at(20) }, flows, new Set(['contacted:3']), now).id, 'contacted:8', 'one step at a time, oldest first');
assert.equal(dueStep({ ...base, stage_changed_at: at(20), last_contacted_at: at(1) }, flows, new Set(), now), null, 'waits 2 days after the last message');
assert.equal(dueStep({ ...base, stage_changed_at: at(20), flows_paused: true }, flows, new Set(), now), null);
assert.equal(dueStep({ ...base, stage_changed_at: at(20), unsubscribed_at: at(2) }, flows, new Set(), now), null);
assert.equal(dueStep({ ...base, stage: 'new', stage_changed_at: at(0), last_contacted_at: at(0) }, flows, new Set(), now).id, 'new:0', 'new enquiry gets its welcome straight away');
assert.equal(dueStep({ ...base, stage: 'lost', stage_changed_at: at(50) }, flows, new Set(), now), null, 'lost contacts get nothing');
assert.equal(dueStep({ ...base, stage_changed_at: at(5) }, flows.map((s) => (s.id === 'contacted:3' ? { ...s, on: false } : s)), new Set(), now), null, 'switched-off steps are skipped');
console.log('crm ok');

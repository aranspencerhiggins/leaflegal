// Checks every qualifying form in public/assets/form-options.js: copy rules, structure, and that random walks through
// each form either hit an exit or build a valid lead on the server.  Run: node tools/test_forms.mjs
import assert from 'node:assert/strict';
import { FORMS, AREAS, MATTERS, SHARED_STEPS, SHARED_EXITS, NOTES, TAGS, VALUE_BANDS, pathOf, exitOf, regionOf } from '../public/assets/form-options.js';
import { buildLead, finishLead } from '../api/_lib/lead-schema.js';

const ICONS = 'home globe family invoice car badge key other person office bolt month clock look heart pound shield gavel building child ring doc'.split(' ');
const TYPES = ['single', 'multi', 'text', 'date', 'company'];
const bad = (s) => /[:;–—]/.test(s) ? 'colon, semicolon or dash' : /\b\w+'\w+/.test(s) ? 'straight apostrophe' : '';
const copy = [];
const say = (where, s) => { if (typeof s === 'string') { const b = bad(s.replace(/https?:\/\/\S+/g, '')); if (b) copy.push(`${where}: ${b} in "${s}"`); } };

for (const ex of Object.values(SHARED_EXITS)) { say('shared exit', ex.reason); ex.links.forEach(([, t]) => say('shared link', t)); }
for (const s of Object.values(SHARED_STEPS)) { say(s.id, s.q); (s.options || []).forEach((o) => { say(s.id, o.label); say(s.id, o.sub); }); }

for (const [area, f] of Object.entries(FORMS)) {
  const ids = new Set(), slugs = new Set((MATTERS[area] || []).map(([s]) => s));
  assert.ok(AREAS.find((a) => a.slug === area), area);
  for (const s of f.steps) {
    assert.ok(!ids.has(s.id), `${area}: duplicate step ${s.id}`); ids.add(s.id);
    assert.ok(!SHARED_STEPS[s.id], `${area}: step id ${s.id} clashes with a shared step`);
    assert.ok(TYPES.includes(s.type), `${area}.${s.id}: type ${s.type}`);
    for (const k of Object.keys(s.when || {})) { const r = k.replace(/^!/, ''); assert.ok(r.startsWith('$') || ids.has(r), `${area}.${s.id}: when ${k} refers to a later or unknown step`); }
    if (s.note) assert.ok(NOTES[s.note], `${area}.${s.id}: note ${s.note}`);
    say(`${area}.${s.id}`, s.q);
    if (['single', 'multi'].includes(s.type)) assert.ok(s.options?.length >= 2, `${area}.${s.id}: options`);
    for (const o of s.options || []) {
      say(`${area}.${s.id}`, o.label); say(`${area}.${s.id}`, o.sub);
      if (o.ico) assert.ok(ICONS.includes(o.ico), `${area}.${s.id}: icon ${o.ico}`);
      if (o.matter) assert.ok(slugs.has(o.matter), `${area}.${s.id}: matter ${o.matter}`);
      if (o.exit) assert.ok(f.exits?.[o.exit] || SHARED_EXITS[o.exit], `${area}.${s.id}: exit ${o.exit}`);
      (o.tags || []).forEach((t) => assert.match(t, /^[a-z0-9]+(-[a-z0-9]+)*$/, `${area}.${s.id}: tag ${t}`));
      if (o.value) assert.ok(o.value.min >= 0 && o.value.max >= o.value.min, `${area}.${s.id}: value`);
    }
  }
  for (const [k, ex] of Object.entries(f.exits || {})) { say(`${area} exit ${k}`, ex.reason); (ex.links || []).forEach(([h, t]) => { assert.match(h, /^https:\/\//); say(`${area} exit ${k}`, t); }); }
  if (f.urgency?.q) say(`${area} urgency`, f.urgency.q);
}
assert.deepEqual(copy, [], 'copy rules:\n' + copy.join('\n'));

// Random walks: answer every step at random. Each walk either exits or builds a lead with a matter.
const rnd = (n) => Math.floor(Math.random() * n);
const PC = { ew: 'M1 1AE', uk: 'EH1 1AA' };
const stats = {};
for (const [area, f] of Object.entries(FORMS)) {
  const info = AREAS.find((a) => a.slug === area), st = stats[area] = { leads: 0, exits: 0, matters: new Set(), maxSteps: 0 };
  for (let w = 0; w < 400; w++) {
    const ans = {}; let exited = null, company = '';
    for (let guard = 0; guard < 80 && !exited; guard++) {
      const s = pathOf(area, ans).find((x) => !(x.id in ans) && !SHARED_STEPS[x.id]);
      if (!s) break;
      if (s.type === 'single') { const o = s.options[rnd(s.options.length)]; ans[s.id] = o.v; if (o.exit) exited = o.exit; }
      else if (s.type === 'multi') { const pick = s.options.filter(() => rnd(3) === 0); const v = pick.length ? pick : [s.options[0]]; ans[s.id] = v.map((o) => o.v); const x = v.find((o) => o.exit); if (x) exited = x.exit; }
      else if (s.type === 'date') ans[s.id] = rnd(3) ? '2027-03-01' : 'none';
      else { ans[s.id] = 'Acme Trading Ltd'; if (s.type === 'company') company = ans[s.id]; }
    }
    if (exited) { st.exits++; assert.ok(exitOf(area, exited).reason, `${area}: exit ${exited}`); continue; }
    st.maxSteps = Math.max(st.maxSteps, pathOf(area, ans).length);
    const r = buildLead({ area, ans, urgency: 'Within a month', privatePay: 'Yes', postcode: PC[info.scope], business: 'Acme Trading Ltd',
      fullName: 'Jane Smith', email: 'jane@example.com', phone: '+447700900123', consentTerms: true, consentShare: true, summary: '' });
    assert.ok(!r.error, `${area}: ${r.error} ${JSON.stringify(ans)}`);
    const lead = finishLead(r.lead, {});
    assert.ok(lead.matter, `${area}: no matter for ${JSON.stringify(ans)}`);
    assert.ok(lead.answers.length >= 2, `${area}: answers`);
    assert.ok(['A', 'B', 'C'].includes(lead.quality.grade));
    if (info.businessOnly) assert.equal(lead.audience, 'business');
    st.leads++; st.matters.add(lead.matter);
  }
}
// Server refuses tampered answers: an exit answer, and Scotland for an England and Wales area.
const imm = buildLead({ area: 'immigration', ans: { who: 'seeker' }, urgency: 'Urgently', privatePay: 'Yes', postcode: 'M1 1AE' });
assert.ok(imm.error, 'exit answer refused');
assert.equal(regionOf('EH1 1AA'), 'Scotland');

for (const [k, v] of Object.entries(stats)) console.log(`${k.padEnd(18)} leads ${String(v.leads).padStart(3)}  exits ${String(v.exits).padStart(3)}  longest path ${v.maxSteps}  matters ${v.matters.size}/${MATTERS[k].length}`);
console.log('tags', Object.fromEntries(Object.entries(TAGS).map(([k, v]) => [k, v.length])));
console.log('value bands', Object.fromEntries(Object.entries(VALUE_BANDS).map(([k, v]) => [k, v ? `${v.label} (${v.bands.length})` : 'none'])));
console.log('forms ok');

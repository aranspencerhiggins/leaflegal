// Runs Admin → Finance with sample data (commission client, per-lead ad cost) and fails on any error or NaN. Run: node tools/test_admin_finance.cjs public/assets/platform.js [period]
const s = require('fs').readFileSync(process.argv[2], 'utf8');
const grab = (n) => { const i = s.indexOf('function ' + n + '('); let d = 0; for (let k = s.indexOf('{', i); ; k++) { if (s[k] == '{') d++; if (s[k] == '}' && --d == 0) return s.slice(s.lastIndexOf('\n', i), k + 1); } };
const line = (start) => { const i = s.indexOf(start); return s.slice(i, s.indexOf(';\n', i) + 1); };
const stub = () => new Proxy(function () {}, { get: (t, k) => (k === 'hidden' ? false : k === 'value' ? 'month' : stub()), set: () => true, apply: () => stub() });
const box = { set innerHTML(v) { box.html = v; }, get innerHTML() { return box.html; }, querySelector: () => stub(), querySelectorAll: () => [] };
const code = [line('const money2 ='), line('const PERIODS ='), grab('periodRange'), line('const isoDay ='), grab('finance')].join('\n');
const h = (x) => String(x ?? ''), num = (n) => Number(n || 0).toLocaleString('en-GB'), I = new Proxy({}, { get: () => '' }), clientDrawer = () => {};
let finPeriod = process.argv[3] || 'month', finCustom = null;
const today = new Date().toISOString().slice(0, 10), B = 'b1', C = 'b2';
let finData = { since: '2025-12-01T00:00:00Z', meta: 'ok', topups: [{ broker: B, delta: 2000, ref: 'x', invoiced: 2000 }], returned: [], invoices: [], fees: [], refunds: [],
  spend: [{ date: today, spend: 500, clicks: 9 }], manual: [{ date: today, broker: B, exVat: 2000 }],
  leads: [{ id: 1, created_at: today + 'T09:00:00Z', price: 80, buyer: B, bought_at: today + 'T10:00:00Z', ad_cost: 200, ad_by: 'campaign' }, { id: 2, created_at: today + 'T09:00:00Z', price: 60, buyer: C, bought_at: today + 'T10:00:00Z', ad_cost: 150, ad_by: 'week' }, { id: 3, created_at: today + 'T11:00:00Z', price: 50, buyer: null, ad_cost: 150, ad_by: 'week' }],
  brokers: [{ id: B, company: 'Paying Ltd', email: 'a@x', credits: 100 }, { id: C, company: 'Comm Ltd', email: 'c@x', credits: 900, plan: { commission: true } }],
  commission: [{ id: 1, broker: C, kind: 'commission', amount: 3000, date: today }, { id: 2, broker: C, kind: 'spend', amount: 100, date: today }] };
const api = async () => finData;
eval(code);
finance(box).then(() => { const t = box.html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' '); if (/NaN|undefined/.test(t)) throw new Error('NaN/undefined in output'); console.log(t.slice(t.indexOf('Revenue'), t.indexOf('Revenue') + 420)); console.log('...', t.slice(t.indexOf('Profit by client'), t.indexOf('Profit by client') + 400)); }).catch((e) => { console.error('FAIL', e); process.exit(1); });

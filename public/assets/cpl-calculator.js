// Lead price calculator (/partners/cost-per-lead-calculator).
// leadPrice() mirrors price()/priceParts() in api/_lib/platform.js — tools/test_platform.mjs checks they agree.
// Live pricing settings come from /api/platform?action=pricing; DEFAULTS is the fallback (same as DEFAULT_PRICING).
(() => {
  const DEFAULTS = {
    pricing: {
      min: 20, max: 300,
      age: { 'Under 6 months': 0.3, '6 to 12 months': 0.5, '1 to 2 years': 0.75, '2 to 5 years': 1, '5+ years': 1 },
      revenue: { 'Under £50k': 0.25, '£50k to £100k': 0.33, '£100k to £250k': 0.7, '£250k to £500k': 0.8, '£500k to £1m': 0.9, '£1m to £5m': 1, '£5m+': 1 },
      adverse: 0.75, unsure: 1, floor100k: 40, sizeFrom: 50000, sizeFloor: 0.4, floorPrime: 0,
    },
    revenueMid: { 'Under £50k': 35000, '£50k to £100k': 75000, '£100k to £250k': 175000, '£250k to £500k': 375000, '£500k to £1m': 750000, '£1m to £5m': 2500000, '£5m+': 10000000 },
  };
  const AFF_FULL = 1 + Math.pow(0.5, 2.2);
  function leadPrice(l, P = DEFAULTS.pricing, MID = DEFAULTS.revenueMid) {
    const amount = Math.max(1000, l.amount || 0), ratio = amount / (MID[l.turnover] || 100000);
    let size = Math.min(1, Math.max(0, (Math.log10(amount) - 4) / 2.2)); // £10k or less scores 0 on size (user, 18 Nov 2026: a £5k loan at £50k–£100k revenue should be about 20)
    const from = P.sizeFrom ?? 50000, sf = P.sizeFloor ?? 0.4; // loan size matters less from £50k up
    if (amount >= from) size = Math.max(size, sf + (1 - sf) * Math.min(1, (Math.log10(amount) - Math.log10(from)) / (Math.log10(2e6) - Math.log10(from))));
    const affordability = Math.min(1, AFF_FULL / (1 + Math.pow(ratio, 2.2)));
    const age = P.age[l.trading] ?? 0.6, revenue = P.revenue[l.turnover] ?? 0.7;
    const credit = l.credit === 'Yes' ? P.adverse : l.credit === 'Not sure' ? P.unsure : 1;
    const p = P.min + (P.max - P.min) * size * affordability * age * revenue * credit;
    const rv = MID[l.turnover] || 0, prime = rv >= 750000 && l.trading === '5+ years' && l.credit !== 'Yes'; // £500k+, 5+ years, clean: optional minimum (0 = off)
    const floor = Math.max(P.min, rv >= 100000 ? P.floor100k ?? 40 : 0, prime ? P.floorPrime ?? 0 : 0);
    return Math.min(P.max, Math.max(floor, Math.round(p / 5) * 5));
  }
  if (typeof window === 'undefined') { globalThis.leadPrice = leadPrice; return; } // test hook

  const root = document.getElementById('cpl');
  if (!root) return;
  const AMOUNTS = [5e3, 1e4, 15e3, 2e4, 25e3, 3e4, 4e4, 5e4, 6e4, 75e3, 1e5, 125e3, 15e4, 2e5, 25e4, 3e5, 4e5, 5e5, 75e4, 1e6, 15e5, 2e6];
  const gbp = (n) => '£' + Math.round(n).toLocaleString('en-GB');
  const $ = (s) => root.querySelector(s);
  let cfg = DEFAULTS;
  const lead = { amount: 1e5, turnover: '£250k to £500k', trading: '2 to 5 years', credit: 'No' };
  const range = $('#cpl-amount');

  function render() {
    const p = leadPrice(lead, cfg.pricing, cfg.revenueMid);
    $('[data-out=price]').textContent = gbp(p);
    $('[data-out=credits]').textContent = `${p} credits per lead`;
    $('[data-out=starter]').textContent = Math.floor(2500 / p);
    $('[data-out=growth]').textContent = Math.floor(5000 / p);
    $('[data-out=range]').textContent = `${gbp(cfg.pricing.min)} to ${gbp(cfg.pricing.max)}`;
  }

  range.addEventListener('input', () => {
    lead.amount = AMOUNTS[range.value];
    $('#cpl-amount-o').textContent = gbp(lead.amount);
    range.style.setProperty('--p', `${(range.value / (AMOUNTS.length - 1)) * 100}%`);
    render();
  });
  root.addEventListener('click', (e) => {
    const b = e.target.closest('[data-k]');
    if (!b) return;
    lead[b.dataset.k] = b.dataset.v;
    root.querySelectorAll(`[data-k="${b.dataset.k}"]`).forEach((x) => x.setAttribute('aria-pressed', x === b));
    render();
  });
  Object.assign(range, { min: 0, max: AMOUNTS.length - 1, step: 1, value: AMOUNTS.indexOf(lead.amount) });
  root.querySelectorAll('[data-k]').forEach((x) => x.setAttribute('aria-pressed', lead[x.dataset.k] === x.dataset.v));
  range.dispatchEvent(new Event('input'));
  fetch('/api/platform?action=pricing').then((r) => r.json()).then((d) => { if (d.pricing?.age) { cfg = d; render(); } }).catch(() => {});
})();

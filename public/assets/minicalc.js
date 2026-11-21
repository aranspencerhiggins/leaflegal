// Compact repayment calculator on business-needs / industries pages. Maths from loan-math.js.
document.querySelectorAll('[data-minicalc]').forEach((box) => {
  const f = (n) => '£' + Math.round(n).toLocaleString('en-GB');
  const num = (el) => parseFloat(el.value.replace(/[^0-9.]/g, '')) || 0;
  const [amt, term, rate] = ['amount', 'term', 'rate'].map((n) => box.querySelector(`[name=${n}]`));
  const out = (k) => box.querySelector(`[data-o=${k}]`);
  const run = () => {
    const P = Math.min(num(amt), 5e6), n = +term.value, r = Math.min(num(rate), 99);
    const s = loanMath.summary(P, r, n);
    out('monthly').textContent = f(s.monthly);
    out('amount').textContent = f(P);
    out('interest').textContent = f(s.interest);
    out('total').textContent = f(s.total);
    const q = new URLSearchParams({ amount: Math.round(P) });
    if (box.dataset.purpose) q.set('purpose', box.dataset.purpose);
    if (!out('cta').getAttribute('href').startsWith('#')) out('cta').href = '/apply?' + q;
  };
  amt.addEventListener('input', run);
  amt.addEventListener('blur', () => { amt.value = Math.round(num(amt)).toLocaleString('en-GB'); });
  term.addEventListener('change', run);
  rate.addEventListener('input', run);
  run();
});

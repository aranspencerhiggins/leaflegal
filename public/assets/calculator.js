// Business loan calculator UI (/business-loan-calculator). Maths lives in assets/loan-math.js.
(() => {
  const root = document.getElementById('calc');
  if (!root || !window.loanMath) return;
  const AMOUNTS = [5e3, 1e4, 15e3, 2e4, 25e3, 3e4, 4e4, 5e4, 6e4, 75e3, 1e5, 125e3, 15e4, 2e5, 25e4, 3e5, 4e5, 5e5, 75e4, 1e6, 15e5, 2e6];
  const TERMS = [3, 6, 9, 12, 18, 24, 36, 48, 60, 72, 84, 96, 108, 120];
  const gbp = (n, dp = 0) => '£' + n.toLocaleString('en-GB', { minimumFractionDigits: dp, maximumFractionDigits: dp });
  const termText = (m) => (m % 12 === 0 ? `${m / 12} year${m === 12 ? '' : 's'}` : `${m} months`);
  const nearest = (arr, v) => arr.reduce((b, x, i) => (Math.abs(x - v) < Math.abs(arr[b] - v) ? i : b), 0);
  const $ = (s) => root.querySelector(s);
  const amtR = $('#calc-amount-r'), amtI = $('#calc-amount'), termR = $('#calc-term-r'), termO = $('#calc-term-o'), rateR = $('#calc-rate-r'), rateI = $('#calc-rate');
  const fill = (r) => r.style.setProperty('--p', `${((r.value - r.min) / (r.max - r.min)) * 100}%`);

  let P = 1e5, n = 60, rate = 9.9, used = false;
  const T = (...x) => (window.llTrack ? window.llTrack(...x) : (window.__llq = window.__llq || []).push(x));
  const markUsed = () => { if (!used) { used = true; T('CalculatorUsed', { loan_amount: Math.round(P), term_months: n, rate }); } };

  function render() {
    const s = loanMath.summary(P, rate, n);
    $('[data-out=monthly]').textContent = gbp(s.monthly, 2);
    $('[data-out=total]').textContent = gbp(s.total, 2);
    $('[data-out=interest]').textContent = gbp(s.interest, 2);
    $('[data-out=perpound]').textContent = '£' + s.perPound.toFixed(2);
    $('[data-out=term]').textContent = termText(n);
    const pct = s.total ? (P / s.total) * 100 : 100;
    $('.ll-split-p').style.width = pct + '%';
    $('[data-out=split]').textContent = `${Math.round(pct)}% loan · ${100 - Math.round(pct)}% interest`;
    $('[data-cta]').href = `/apply?amount=${Math.round(P)}`;
    $('[data-cta] div').textContent = `Get matched for ${gbp(P)}`;
    const rows = loanMath.schedule(P, rate, n);
    document.querySelector('#calc-sched tbody').innerHTML = rows.map((r) => `<tr><td>Year ${r.year}</td><td>${gbp(r.paid)}</td><td>${gbp(r.principal)}</td><td>${gbp(r.interest)}</td><td>${gbp(r.balance)}</td></tr>`).join('');
  }

  // amount: slider snaps to common sizes; the box accepts any value from £1,000 to £5m
  amtR.addEventListener('input', () => { P = AMOUNTS[amtR.value]; amtI.value = P.toLocaleString('en-GB'); fill(amtR); render(); });
  amtI.addEventListener('input', () => {
    const v = +amtI.value.replace(/[^\d.]/g, '');
    if (v >= 1000 && v <= 5e6) { P = v; amtR.value = nearest(AMOUNTS, v); fill(amtR); amtI.removeAttribute('aria-invalid'); render(); }
    else amtI.setAttribute('aria-invalid', 'true');
  });
  amtI.addEventListener('blur', () => { amtI.value = P.toLocaleString('en-GB'); amtI.removeAttribute('aria-invalid'); });

  termR.addEventListener('input', () => { n = TERMS[termR.value]; termO.textContent = termText(n); fill(termR); render(); });

  rateR.addEventListener('input', () => { rate = +rateR.value; rateI.value = rate.toFixed(1); fill(rateR); render(); });
  rateI.addEventListener('input', () => {
    const v = +rateI.value;
    if (rateI.value !== '' && v >= 0 && v <= 60) { rate = v; rateR.value = Math.min(Math.max(v, +rateR.min), +rateR.max); fill(rateR); rateI.removeAttribute('aria-invalid'); render(); }
    else rateI.setAttribute('aria-invalid', 'true');
  });
  rateI.addEventListener('blur', () => { rateI.value = rate.toFixed(1); rateI.removeAttribute('aria-invalid'); });

  [amtR, amtI, termR, rateR, rateI].forEach((el) => el.addEventListener('change', markUsed));
  amtR.value = nearest(AMOUNTS, P); termR.value = TERMS.indexOf(n); rateR.value = rate;
  amtI.value = P.toLocaleString('en-GB'); termO.textContent = termText(n); rateI.value = rate.toFixed(1);
  [amtR, termR, rateR].forEach(fill);
  render();
})();

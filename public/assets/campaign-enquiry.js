// /partners/bespoke-campaigns enquiry form -> /api/partner (kind: campaign)
(() => {
  const f = document.getElementById('bc-form');
  if (!f) return;
  const t0 = Date.now(), out = f.querySelector('.ll-cf-msg'), btn = f.querySelector('button[type=submit]');
  const fail = (msg) => { out.className = 'll-cf-msg on'; out.innerHTML = msg; };
  f.addEventListener('submit', async (e) => {
    e.preventDefault();
    out.className = 'll-cf-msg';
    if (!f.reportValidity()) return;
    const fd = new FormData(f), data = Object.fromEntries(fd);
    data.areas = fd.getAll('areas');
    if (!data.areas.length) return fail('Please choose at least one practice area.');
    Object.assign(data, { kind: 'campaign', page: location.href, referrer: document.referrer, _ms: Date.now() - t0,
      consentText: f.querySelector('.ll-cf-note').textContent.trim() });
    btn.disabled = true; btn.textContent = 'Sending…';
    try {
      const r = await fetch('/api/partner', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      if (!r.ok) throw new Error(r.status);
      f.innerHTML = '<div class="ll-cf-done" role="status"><h2>Thanks, we have your enquiry.</h2><p>We will be in touch within one working day to talk through your campaign.</p></div>';
      try { window.gtag && gtag('event', 'generate_lead', { form: 'bespoke_campaign' }); } catch {}
    } catch {
      btn.disabled = false; btn.textContent = 'Send campaign enquiry';
      fail('Sorry, that didn’t send. Please try again or email <a href="mailto:hello@leaflegal.co">hello@leaflegal.co</a>.');
    }
  });
})();

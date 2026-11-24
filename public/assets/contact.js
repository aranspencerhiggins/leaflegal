// /contact form -> /api/contact
(() => {
  const f = document.getElementById('ll-contact');
  if (!f) return;
  // Cloudflare Turnstile (bot check). Off until the site key is set on the server (/api/platform?action=config).
  const ts = { key: undefined, id: null, box: null, wait: null };
  const humanToken = async (form) => {
    if (ts.key === undefined) ts.key = await fetch('/api/platform?action=config').then((r) => r.json()).then((d) => d.turnstile || null).catch(() => null);
    if (!ts.key || !form) return '';
    let box = form.querySelector('.ts-box');
    if (!box) { box = Object.assign(document.createElement('div'), { className: 'ts-box' }); form.appendChild(box); }
    if (!window.turnstile) await new Promise((ok) => { const sc = Object.assign(document.createElement('script'), { src: 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit', async: true, onload: ok, onerror: ok }); document.head.appendChild(sc); });
    if (!window.turnstile) return '';
    return new Promise((done) => {
      const t = setTimeout(() => done(''), 15000);
      ts.wait = (v) => { clearTimeout(t); done(v || ''); };
      if (ts.id !== null && ts.box === box && box.isConnected) { window.turnstile.reset(ts.id); window.turnstile.execute(ts.id); return; }
      if (ts.id !== null) try { window.turnstile.remove(ts.id); } catch {}
      ts.box = box;
      ts.id = window.turnstile.render(box, { sitekey: ts.key, appearance: 'interaction-only', execution: 'execute', callback: (v) => ts.wait?.(v), 'error-callback': () => ts.wait?.(''), 'expired-callback': () => {} });
      window.turnstile.execute(ts.id);
    });
  };
  const out = f.querySelector('.ll-cf-msg'), btn = f.querySelector('button[type=submit]');
  f.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!f.reportValidity()) return;
    const data = Object.fromEntries(new FormData(f)); data.page = location.href;
    btn.disabled = true; btn.textContent = 'Sending…'; out.className = 'll-cf-msg';
    try {
      data.turnstile = await humanToken(f);
      const r = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      if (!r.ok) throw new Error(r.status);
      f.innerHTML = '<div class="ll-cf-done" role="status"><h2>Thanks, message sent.</h2><p>We reply to every message within one working day.</p></div>';
    } catch {
      btn.disabled = false; btn.textContent = 'Send message';
      out.className = 'll-cf-msg on'; out.innerHTML = 'Sorry, that didn’t send. Please try again or email <a href="mailto:hello@leaflegal.co">hello@leaflegal.co</a>.';
    }
  });
})();

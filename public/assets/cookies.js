// Cookie consent banner. Nothing non-essential runs until the visitor opts in.
// Choice lives in localStorage 'll-cookies' = {v, analytics, marketing, at}.
// To add a tracker later, gate it:  leaflegalCookies.on('analytics', () => { /* load script */ })
(() => {
  const KEY = 'll-cookies', V = 1;
  let c = null;
  try { c = JSON.parse(localStorage.getItem(KEY)); if (c?.v !== V) c = null; } catch {}
  const waiting = [];
  const run = () => waiting.forEach((w) => { if (!w.done && c?.[w.cat]) { w.done = true; w.fn(); } });
  window.leaflegalCookies = { get: () => c, on: (cat, fn) => { waiting.push({ cat, fn }); run(); }, open: () => show(true) };

  const css = `
.llc{position:fixed;z-index:9999;left:16px;bottom:16px;max-width:420px;background:#1f3a30;color:#fff;border:1px solid rgba(255,255,255,.14);border-radius:18px;padding:20px;box-shadow:0 20px 50px -20px rgba(0,0,0,.6);font-family:"LINE Seed Sans",sans-serif;font-size:14px;line-height:1.5}
.llc h2{margin:0 0 6px;font-size:17px;font-weight:700;color:#fff;line-height:1.3}
.llc p{margin:0;color:#d6e8e1}
.llc a{color:#fff;text-decoration:underline}
.llc-row{display:flex;gap:8px;margin-top:16px;flex-wrap:wrap}
.llc button{flex:1;min-width:110px;font:inherit;font-weight:700;font-size:14px;border-radius:999px;padding:11px 16px;cursor:pointer;border:1.5px solid #ffa630;background:#ffa630;color:#1f3a30}
.llc button.llc-alt{background:transparent;color:#fff;border-color:rgba(255,255,255,.55)}
.llc button:focus-visible{outline:3px solid #ffdcad;outline-offset:2px}
.llc-opts{margin:14px 0 0;display:grid;gap:10px}
.llc-opt{display:flex;gap:12px;align-items:flex-start;background:rgba(255,255,255,.06);border-radius:12px;padding:12px}
.llc-opt input{margin-top:3px;width:18px;height:18px;accent-color:#ffa630;flex:none}
.llc-opt b{display:block;color:#fff}
.llc-opt small{display:block;color:#bddbd0;font-size:13px}
@media (max-width:767px){.llc{left:8px;right:8px;bottom:8px;max-width:none;padding:12px 14px;border-radius:14px;font-size:12.5px;line-height:1.4}
  .llc h2{display:none}.llc-row{margin-top:10px;flex-wrap:nowrap;gap:6px}.llc button{min-width:0;padding:8px 10px;font-size:13px}}`;

  function show(manage) {
    document.querySelector('.llc')?.remove();
    if (!document.getElementById('llc-css')) { const s = document.createElement('style'); s.id = 'llc-css'; s.textContent = css; document.head.appendChild(s); }
    const el = document.createElement('div');
    el.className = 'llc'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-labelledby', 'llc-t'); el.setAttribute('aria-live', 'polite');
    const opt = (k, t, d) => `<label class="llc-opt"><input type="checkbox" name="${k}" ${c?.[k] ? 'checked' : ''}><span><b>${t}</b><small>${d}</small></span></label>`;
    el.innerHTML = `<h2 id="llc-t">Cookies on Leaflegal</h2>
      <p>We use essential cookies to make this site work. With your permission we'd also like to use analytics and marketing cookies. <a href="https://leaflegal.co/cookie-policy">Cookie Policy</a></p>
      ${manage ? `<div class="llc-opts">
        <label class="llc-opt"><input type="checkbox" checked disabled><span><b>Essential</b><small>Needed for the site and form to work. Always on.</small></span></label>
        ${opt('analytics', 'Analytics', 'Help us understand how the site is used so we can improve it.')}
        ${opt('marketing', 'Marketing', 'Help us measure our adverts and show you relevant ones.')}</div>
        <div class="llc-row"><button type="button" data-a="save">Save choices</button><button type="button" class="llc-alt" data-a="reject">Reject all</button></div>`
      : `<div class="llc-row"><button type="button" data-a="accept">Accept all</button><button type="button" data-a="reject">Reject all</button><button type="button" class="llc-alt" data-a="manage">Manage</button></div>`}`;
    el.addEventListener('click', (e) => {
      const a = e.target.closest('[data-a]')?.dataset.a; if (!a) return;
      if (a === 'manage') return show(true);
      const pick = (k) => a === 'accept' || (a === 'save' && el.querySelector(`[name=${k}]`).checked);
      c = { v: V, analytics: pick('analytics'), marketing: pick('marketing'), at: new Date().toISOString() };
      try { localStorage.setItem(KEY, JSON.stringify(c)); } catch {}
      el.remove(); run();
    });
    document.body.appendChild(el);
    el.querySelector('button').focus({ preventScroll: true });
  }

  document.addEventListener('click', (e) => { if (e.target.closest('[data-cookie-settings]')) { e.preventDefault(); show(true); } });
  const start = () => (c ? run() : show(false));
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', start) : start();
})();

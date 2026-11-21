// "Become a partner" opens the partner form in a pop-up instead of going to /partners/apply. Loads the form on first use.
// The apply page itself has the form inline, so nothing happens there. Falls back to the page if anything fails.
(() => {
  if (document.getElementById('pe')) return;
  let dlg, loaded;
  const load = () => loaded ||= new Promise((ok, no) => {
    const css = document.createElement('link'); css.rel = 'stylesheet'; css.href = '/assets/partner-enquiry.css?v=1'; document.head.append(css);
    const s = document.createElement('script'); s.src = '/assets/partner-enquiry.js?v=1'; s.onload = ok; s.onerror = no; document.head.append(s);
  });
  async function open() {
    await load();
    if (!dlg) {
      dlg = document.createElement('dialog'); dlg.className = 'pe-modal'; dlg.setAttribute('aria-label', 'Get law firm leads from Leaflegal');
      dlg.innerHTML = '<button type="button" class="pe-x" aria-label="Close"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button><div class="pe-pop"></div>';
      document.body.append(dlg);
      dlg.querySelector('.pe-x').onclick = () => dlg.close();
      dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); }); // click outside the card
      window.LLPartner.mount(dlg.querySelector('.pe-pop'), { modal: true });
    }
    dlg.showModal();
    dlg.querySelector('input')?.focus();
  }
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]'); if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
    const u = new URL(a.href, location.href);
    if (u.pathname !== '/partners/apply' || u.search || u.origin !== location.origin) return;
    e.preventDefault();
    open().catch(() => { location.href = a.href; });
  });
})();

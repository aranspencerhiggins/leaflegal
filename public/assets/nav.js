// Sitewide nav: mobile menu toggle + smooth in-page anchor scrolling (respects scroll-margin under the sticky nav).
(() => {
  document.querySelectorAll('.ll-nav-toggle').forEach((b) => b.addEventListener('click', () => {
    const open = b.closest('.ll-nav').classList.toggle('open');
    b.setAttribute('aria-expanded', open);
  }));
  document.querySelectorAll('.ll-nav-links a').forEach((a) => a.addEventListener('click', () => a.closest('.ll-nav').classList.remove('open')));
  // Capture phase so no other (slower, offset-unaware) anchor handler runs first.
  window.addEventListener('click', (e) => {
    const l = e.target.closest('a[href*="#"]');
    if (!l || l.pathname !== location.pathname || !l.hash) return;
    const t = document.getElementById(l.hash.slice(1));
    if (!t) return;
    e.preventDefault(); e.stopPropagation();
    t.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    history.replaceState(null, '', l.hash);
  }, true);
})();
// First-touch source for this visit (UTM tags + the external referrer), kept for the session so the
// broker enquiry form can tell the CRM how someone found us even after they've clicked around the site.
(() => {
  try {
    if (sessionStorage.getItem('ll_src')) return;
    const q = new URLSearchParams(location.search), utm = {};
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_id', 'utm_term', 'utm_content', 'gclid', 'fbclid', 'li_fat_id'].forEach((k) => q.get(k) && (utm[k] = q.get(k).slice(0, 120)));
    const ref = document.referrer && !document.referrer.startsWith(location.origin) ? document.referrer.slice(0, 300) : '';
    sessionStorage.setItem('ll_src', JSON.stringify({ ...utm, ...(ref ? { referrer: ref } : {}), landing: location.pathname }));
  } catch {}
})();

// /index-b header: dropdowns (click/tap, Escape, outside click; hover on desktop) and the mobile menu.
(() => {
  const head = document.querySelector('.llb-head');
  if (!head) return;
  const dds = [...head.querySelectorAll('.llb-dd')];
  const set = (dd, open) => { dd.classList.toggle('open', open); dd.querySelector('.llb-dd-btn').setAttribute('aria-expanded', open); };
  const closeAll = (except) => dds.forEach((d) => d !== except && set(d, false));
  const desktop = matchMedia('(min-width: 1025px) and (hover: hover)');
  dds.forEach((dd) => {
    dd.querySelector('.llb-dd-btn').addEventListener('click', () => { closeAll(dd); set(dd, !dd.classList.contains('open')); });
    let t;
    dd.addEventListener('mouseenter', () => { if (!desktop.matches) return; clearTimeout(t); closeAll(dd); set(dd, true); });
    dd.addEventListener('mouseleave', () => { if (!desktop.matches) return; t = setTimeout(() => set(dd, false), 150); });
  });
  document.addEventListener('click', (e) => { if (!e.target.closest('.llb-dd')) closeAll(); });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const open = dds.find((d) => d.classList.contains('open'));
    if (open) { set(open, false); open.querySelector('.llb-dd-btn').focus(); }
  });
  // mega menus: the middle column follows the hovered / focused item on the left
  head.querySelectorAll('.llb-mega').forEach((m) => {
    const show = (k) => { m.querySelectorAll('.llb-msub').forEach((d) => d.classList.toggle('on', d.dataset.k === k)); };
    m.querySelectorAll('.llb-mi').forEach((a) => {
      a.addEventListener('mouseenter', () => { show(a.dataset.k); m.querySelectorAll('.llb-mi').forEach((x) => x.classList.toggle('on', x === a)); });
      a.addEventListener('focus', () => { show(a.dataset.k); m.querySelectorAll('.llb-mi').forEach((x) => x.classList.toggle('on', x === a)); });
    });
  });
  const tog = head.querySelector('.llb-toggle');
  tog?.addEventListener('click', () => { const o = head.classList.toggle('open'); tog.setAttribute('aria-expanded', o); });
})();

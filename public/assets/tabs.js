// Accessible tabs for [data-tabs] blocks. All panels are in the HTML (readable without JS and by search engines);
// this script hides the inactive ones and wires up click + arrow-key navigation.
document.querySelectorAll('[data-tabs]').forEach((box) => {
  const tabs = [...box.querySelectorAll('[role=tab]')];
  const panels = tabs.map((t) => document.getElementById(t.getAttribute('aria-controls')));
  const select = (i, focus) => {
    tabs.forEach((t, k) => {
      const on = k === i;
      t.setAttribute('aria-selected', on);
      t.tabIndex = on ? 0 : -1;
      panels[k].hidden = !on;
    });
    if (focus) tabs[i].focus({ preventScroll: true });
    // Only scroll the tab bar sideways (mobile) - never the page, or page load would jump to the last tab group.
    const list = tabs[i].parentElement, t = tabs[i];
    if (list.scrollWidth > list.clientWidth) list.scrollTo({ left: t.offsetLeft - (list.clientWidth - t.offsetWidth) / 2, behavior: focus ? 'smooth' : 'auto' });
  };
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => select(i));
    t.addEventListener('keydown', (e) => {
      const d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
      if (d) { e.preventDefault(); select((i + d + tabs.length) % tabs.length, true); }
      else if (e.key === 'Home') { e.preventDefault(); select(0, true); }
      else if (e.key === 'End') { e.preventDefault(); select(tabs.length - 1, true); }
    });
  });
  box.classList.add('js');
  select(0);
});

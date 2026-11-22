// Leaflegal enquiry form engine. One card (#ap) runs every area's qualifying form from assets/form-options.js.
// <div id="ap" data-area="immigration" data-matter="sponsor-licences"> starts inside that area (and matter). Without
// data-area it opens on "What do you need help with?". ?area= and ?matter= in the URL do the same on /apply.
// Answers we can't help with end on a "sorry" screen with useful links, and nothing is sent.
// Matter details are special category or criminal offence data. They go only to /api/enquiry, never to ad platforms.
import { AREAS, FORMS, NOTES, SHARED_STEPS, FORM_VERSION, POSTCODE_RE, NOT_EW, areaOf, matterOf, pathOf, derive, exitOf, shows } from './form-options.js';
import { LISTS } from './lists.js';

const root = document.getElementById('ap');
if (root) init();

function init() {
  const body = root.querySelector('.ap-body'), bar = root.querySelector('.ap-bar'), count = root.querySelector('.ap-count'), backBtn = root.querySelector('.ap-back');
  const KEY = 'll-enquire-v3:' + (root.dataset.area || 'all') + ':' + (root.dataset.matter || '');
  const I = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
  const ICON = {
    home: I('<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>'),
    globe: I('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>'),
    family: I('<circle cx="8" cy="7" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M2 21a6 6 0 0 1 12 0M14 21a4 4 0 0 1 8 0"/>'),
    invoice: I('<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M9 13h6M9 17h4"/>'),
    doc: I('<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M9 13h6M9 17h4"/>'),
    car: I('<path d="M5 17h14M3 17v-4l2-5h14l2 5v4"/><circle cx="7.5" cy="17.5" r="1.5"/><circle cx="16.5" cy="17.5" r="1.5"/>'),
    badge: I('<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>'),
    key: I('<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M17 6l3 3"/>'),
    other: I('<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.7M12 17h.01"/>'),
    person: I('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'),
    office: I('<path d="M3 21h18M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16"/><path d="M10 7h4M10 11h4M10 15h4"/>'),
    building: I('<path d="M3 21h18M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16"/><path d="M10 7h4M10 11h4M10 15h4"/>'),
    bolt: I('<path d="M13 2L3 14h9l-1 8 10-12h-9z"/>'),
    month: I('<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>'),
    clock: I('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
    look: I('<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>'),
    heart: I('<path d="M12 20s-7-4.4-9-9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-2 4.6-9 9-9 9z"/>'),
    pound: I('<path d="M17 20H7c2-2 2.5-4 2.5-7V9a3.5 3.5 0 0 1 6.5-1.8M6 13h8"/>'),
    shield: I('<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>'),
    gavel: I('<path d="M14 4l6 6M11 7l6 6M8 10l3-3 6 6-3 3zM9 15l-6 6"/>'),
    child: I('<circle cx="12" cy="6" r="3"/><path d="M8 21v-5l-2-3 6-3 6 3-2 3v5"/>'),
    ring: I('<circle cx="12" cy="14" r="6"/><path d="M9 4h6l-3 4z"/>'),
  };
  const TICK = I('<path d="M5 12l5 5 9-10" stroke-width="3"/>');
  const ARROW = I('<path d="M5 12h14M13 6l6 6-6 6"/>');
  const CROSS = I('<path d="M18 6L6 18M6 6l12 12" stroke-width="3"/>');
  const listOf = (s) => LISTS[s.list] || null;
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // "Not sure" has no qualifying questions of its own: they tell us in a sentence or two.
  const UNSURE = 'not-sure';
  const AREA_STEP = { id: 'area', q: 'What do you need help with?', type: 'single', grid: true, icons: true,
    options: AREAS.map((x) => ({ v: x.slug, label: x.label === 'Conveyancing' ? 'Buying or selling a home' : x.label, sub: x.short, ico: x.icon }))
      .concat({ v: UNSURE, label: 'Not sure', sub: 'Tell us what is happening', ico: 'other' }) };
  const UNSURE_STEPS = [{ ...SHARED_STEPS.summary, q: 'What do you need help with?', optional: false }, SHARED_STEPS.urgency,
    { ...SHARED_STEPS.pay, note: 'fees' }, SHARED_STEPS.details];

  // ---------- state: answers live in `a`, saved so a refresh keeps progress ----------
  let a = { ans: {} }, hist = [];
  try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && s.ans && s.v === FORM_VERSION) ({ a, hist } = s); } catch {}
  const qp = new URLSearchParams(location.search);
  const fixedArea = areaOf(root.dataset.area || '')?.slug || null;
  const startArea = fixedArea || areaOf(qp.get('area') || '')?.slug || (qp.get('area') === UNSURE ? UNSURE : null);
  const startMatter = root.dataset.matter || qp.get('matter') || '';
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify({ a, hist, v: FORM_VERSION })); } catch {} };

  // Fill in the answers that lead to a matter, so a matter page starts on its first real question.
  function prefillMatter(area, slug) {
    const f = FORMS[area];
    if (!f || !matterOf(area, slug)) return;
    for (const s of f.steps) {
      const o = (s.options || []).find((x) => x.matter === slug && !x.exit);
      if (!o) continue;
      for (const [k, allowed] of Object.entries(s.when || {})) if (!k.startsWith('!') && !k.startsWith('$') && !allowed.includes(a.ans[k])) a.ans[k] = allowed[0];
      a.ans[s.id] = s.type === 'multi' ? [o.v] : o.v;
      return;
    }
  }
  function setArea(area) {
    if (a.area === area) return;
    a = { ans: {}, area, contact: a.contact };
    if (area !== UNSURE && startMatter && area === startArea) prefillMatter(area, startMatter);
  }
  // ---------- path ----------
  const steps = () => (a.area === UNSURE ? UNSURE_STEPS : a.area ? pathOf(a.area, a.ans) : []);
  const full = () => (fixedArea ? [] : [AREA_STEP]).concat(steps());
  const stepById = (id) => full().find((s) => s.id === id) || (id === 'area' ? AREA_STEP : null);
  function firstOpen() { const p = steps(); return (p.find((s) => a.ans[s.id] == null && s.type !== 'details') || p[p.length - 1] || { id: 'details' }).id; }
  const DONE = '//done'; // screen ids for the end screens, never a step id (exits are 'x_<key>')
  const top = () => hist[hist.length - 1];
  const next = (id) => { const p = full(); const i = p.findIndex((s) => s.id === id); return (p[i + 1] || p[p.length - 1]).id; };
  const qOf = (s) => (s.id === 'postcode' && derive(a.area, a.ans).audience === 'business' && s.qBusiness) || s.q;
  const areaInfo = () => AREAS.find((x) => x.slug === a.area);

  const stale = !hist.length || hist.includes(DONE) || (startArea && a.area !== startArea) || (fixedArea && hist.includes('area'));
  if (stale) {
    a = { ans: {}, contact: a.contact }; hist = [];
    if (startArea) { setArea(startArea); const p = steps().map((x) => x.id), f = firstOpen(); hist = (fixedArea ? [] : ['area']).concat(p.slice(0, p.indexOf(f) + 1)); } else hist = ['area'];
  }

  // Funnel tracking (assets/track.js). Step names only, never the answers.
  const T = (...x) => (window.llTrack ? window.llTrack(...x) : (window.__llq = window.__llq || []).push(x));
  const seen = new Set(); let started = false;
  const t0 = Date.now();

  function go(id) {
    if (!started) { started = true; T('FormStart', { form: 'legal', area: a.area || '' }); }
    hist.push(id); save(); show(1);
  }
  function back() { if (hist.length > 1) { hist.pop(); save(); show(-1); } }
  function exit(key, stepId) { T('FormDisqualified', { form: 'legal', step_name: stepId }); go('x_' + key); }

  // ---------- screens ----------
  const optBtn = (o, on, multi) => `<button type="button" class="ap-opt${on ? ' sel' : ''}${o.wide ? ' wide' : ''}" role="${multi ? 'checkbox' : 'radio'}" aria-checked="${on}" data-v="${esc(o.v)}">${o.ico && ICON[o.ico] ? `<span class="ap-ico">${ICON[o.ico]}</span>` : ''}<span><b>${esc(o.label)}</b>${o.sub ? `<small>${esc(o.sub)}</small>` : ''}</span><span class="ap-tick">${TICK}</span></button>`;
  const nextBtn = (label = 'Continue', type = 'button') => `<div class="ap-actions"><button type="${type}" class="button ap-next" data-next>${label} ${ARROW}</button></div>`;
  const noteHTML = (k) => (k && NOTES[k] ? `<div class="im-note">${NOTES[k]}</div>` : '');
  const CONSENT_VERSION = '2026-11-22';
  // No tick boxes. Sending the form is the request to be introduced, and this notice sits right under the button.
  const NOTICE = 'By sending this enquiry you agree to our <a href="/terms-conditions" target="_blank">Terms</a> and <a href="/privacy-policy" target="_blank">Privacy Policy</a>, and to us passing your details and answers to one regulated law firm who may contact you by phone, email or text about it. Free to use, with no obligation. Leaflegal is not a law firm and does not give legal advice.';
  const plain = (s) => s.replace(/<[^>]+>/g, '');
  const today = () => { const t = new Date(); t.setHours(0, 0, 0, 0); return t; };
  const iso = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);

  function render(s) {
    const q = qOf(s), v = s.id === 'area' ? a.area : a.ans[s.id];
    let h = `<h2 class="ap-q" tabindex="-1">${esc(q)}</h2>` + noteHTML(s.note);
    if (s.type === 'single') {
      const opts = s.options;
      h += `<div class="ap-opts${s.icons && !s.grid ? ' one' : s.grid ? '' : ' one'}" role="radiogroup" aria-label="${esc(q)}">${opts.map((o) => optBtn(o, v === o.v)).join('')}</div>`;
      if (opts.some((o) => o.v === v && !o.exit)) h += nextBtn();
      if (s.id === 'area') h += '<p class="ap-quick">Takes about two minutes</p>';
    } else if (s.type === 'multi') {
      const cur = [].concat(v || []);
      h += `<p class="ap-multi-hint">Choose all that apply</p><div class="ap-opts one" role="group" aria-label="${esc(q)}">${s.options.map((o) => optBtn(o, cur.includes(o.v), true)).join('')}</div>${nextBtn()}`;
    } else if (s.type === 'company' && !a.coManual) {
      h += `<div class="ap-field ap-text-step"><label class="ap-sr" for="ap-co">Search for your company</label>
        <input id="ap-co" type="search" autocomplete="off" placeholder="Start typing your company name" value="${esc(v || '')}">
        <span class="ap-err" id="ap-co-err"></span><div class="ap-opts one ap-co-list" role="radiogroup" aria-label="Matching companies" aria-live="polite"></div>
        <p class="ap-note"><button type="button" class="ap-link" data-manual>Can’t find it, or not a limited company? Enter the name yourself</button></p></div>${a.companyNumber ? nextBtn() : ''}`;
    } else if (s.type === 'text' || s.type === 'company') {
      h += `<form novalidate><div class="ap-field ap-text-step"><label class="ap-sr" for="ap-in">${esc(q)}</label><input id="ap-in" type="text" ${listOf(s) ? 'role="combobox" aria-autocomplete="list" aria-controls="ap-sugg" aria-expanded="false"' : ''} autocomplete="${s.type === 'company' || s.id === 'business' ? 'organization' : 'off'}" placeholder="${esc(s.placeholder || '')}" value="${esc(v || '')}"><span class="ap-err" id="ap-in-err"></span>${listOf(s) ? '<div class="ap-opts one ap-co-list ap-sugg" id="ap-sugg" role="listbox" aria-label="Suggestions"></div>' : ''}${s.hint ? `<p class="ap-note">${esc(s.hint)}</p>` : ''}</div>${nextBtn(s.optional && !v ? 'Skip' : 'Continue', 'submit')}</form>`;
    } else if (s.type === 'date') {
      const max = new Date(); max.setFullYear(max.getFullYear() + 5);
      h += `<form novalidate><div class="ap-field ap-text-step"><label class="ap-sr" for="ap-in">${esc(q)}</label><input id="ap-in" type="date" value="${v && v !== 'none' ? esc(v) : ''}" max="${iso(max)}"><span class="ap-err" id="ap-in-err"></span></div>
        ${s.optional ? '<button type="button" class="ap-exempt" data-nodate>I’m not sure of the date</button>' : ''}${nextBtn('Continue', 'submit')}</form>`;
    } else if (s.type === 'postcode') {
      const uk = areaInfo()?.scope === 'uk';
      h += `<form novalidate><div class="ap-field ap-text-step"><label class="ap-sr" for="ap-in">${esc(q)}</label><input id="ap-in" type="text" autocomplete="postal-code" placeholder="${esc(s.placeholder)}" value="${v && v !== 'outside' ? esc(v) : ''}"><span class="ap-err" id="ap-in-err"></span><p class="ap-note">${esc(s.hint)}</p></div>
        ${uk ? '<button type="button" class="ap-exempt" data-outside>I live outside the UK</button>' : ''}${nextBtn('Continue', 'submit')}</form>`;
    } else if (s.type === 'summary') {
      const opt = s.optional;
      h += `<div class="ap-field ap-text-step"><label class="ap-sr" for="ap-in">${esc(q)}</label><textarea id="ap-in" rows="4" maxlength="500" placeholder="${opt ? 'Optional. ' : ''}A sentence or two is plenty">${esc(v || '')}</textarea><span class="ap-err" id="ap-in-err"></span>
        <p class="ap-note">Keep it short. The firm will ask for the full details when they call, so leave out anything you would rather say in person.</p></div>${nextBtn(opt && !(v || '').trim() ? 'Skip' : 'Continue')}`;
    } else {
      const c = a.contact || {};
      const f = (n, l, type, ac, full, extra = '') => `<div class="ap-field${full ? ' full' : ''}"><label for="ap-${n}">${l}</label><input id="ap-${n}" name="${n}" type="${type}" autocomplete="${ac}" value="${esc(c[n] || '')}" ${extra}><span class="ap-err" id="ap-${n}-err"></span></div>`;
      h += `<form novalidate><div class="ap-grid">${f('fullName', 'Full name', 'text', 'name', true)}${f('email', 'Email address', 'email', 'email', false, 'inputmode="email"')}${f('phone', 'Mobile number', 'tel', 'tel', false, 'inputmode="tel" placeholder="07700 900123"')}</div>
        <p class="ap-note im-mobile">The firm will usually call you, so please give a mobile number.</p>
        <div class="ap-hp" aria-hidden="true"><label>Website<input name="website" tabindex="-1" autocomplete="off"></label></div>
        <div class="ap-ts" id="ap-ts"></div>
        <div class="ap-actions ap-send"><button type="submit" class="button ap-next">Get matched ${ARROW}</button></div>
        <p class="ap-agree">${NOTICE}</p>
        <div class="ap-formerr" role="alert"></div></form>`;
    }
    return h;
  }

  function wire(s, step) {
    const err = (m, k = 'in') => { const e = step.querySelector(`#ap-${k}-err`), i = step.querySelector(`#ap-${k}`); if (e) e.innerHTML = m; if (i) i.setAttribute('aria-invalid', !!m); return !m; };
    const set = (val) => { if (s.id === 'area') setArea(val); else a.ans[s.id] = val; save(); };
    if (s.type === 'single') {
      let busy = false;
      step.querySelectorAll('.ap-opt').forEach((b) => b.addEventListener('click', () => {
        if (busy) return; busy = true;
        step.querySelectorAll('.ap-opt').forEach((x) => { x.classList.toggle('sel', x === b); x.setAttribute('aria-checked', x === b); });
        const o = s.options.find((y) => y.v === b.dataset.v);
        set(o.v);
        setTimeout(() => { busy = false; if (o.exit) exit(o.exit, s.id); else go(s.id === 'area' ? firstOpen() : next(s.id)); }, 220);
      }));
      step.querySelector('[data-next]')?.addEventListener('click', () => go(s.id === 'area' ? firstOpen() : next(s.id)));
    } else if (s.type === 'multi') {
      const btn = step.querySelector('[data-next]'), allowed = s.options.map((o) => o.v);
      let cur = [].concat(a.ans[s.id] || []).filter((v) => allowed.includes(v));
      const sync = () => { btn.disabled = !cur.length; }; sync();
      step.querySelectorAll('.ap-opt').forEach((b) => b.addEventListener('click', () => {
        const v = b.dataset.v, on = !cur.includes(v);
        cur = on ? [...cur, v] : cur.filter((x) => x !== v); set(cur);
        b.classList.toggle('sel', on); b.setAttribute('aria-checked', on); sync();
      }));
      btn.addEventListener('click', () => { const x = s.options.find((o) => o.exit && cur.includes(o.v)); if (x) exit(x.exit, s.id); else go(next(s.id)); });
    } else if (s.type === 'company' && !a.coManual) {
      wireCompany(s, step);
    } else if (s.type === 'text' || s.type === 'company') {
      const f = step.querySelector('form'), inp = f.querySelector('input');
      f.addEventListener('submit', (e) => { e.preventDefault(); const v = inp.value.trim().replace(/\s+/g, ' ');
        if (!v && s.optional) { set(''); save(); return go(next(s.id)); }
        const m = !v ? 'Please fill this in' : s.validate === 'nationality' && !/^[\p{L}][\p{L} .'()\-]{2,40}$/u.test(v) ? 'Please enter a nationality, for example Indian or Nigerian' : v.length < 2 ? 'Please check this' : '';
        if (err(m)) { set(v); if (s.type === 'company') a.companyNumber = ''; save(); go(next(s.id)); } });
      inp.addEventListener('input', () => err(''));
      const list = listOf(s), box = f.querySelector('#ap-sugg');
      if (list && box) {
        // Type-ahead: names that start with what was typed come first, then names containing it. Free text is still allowed.
        const show = () => {
          const t = inp.value.trim().toLowerCase();
          const hits = !t ? [] : list.filter((x) => x.toLowerCase().startsWith(t)).concat(list.filter((x) => !x.toLowerCase().startsWith(t) && x.toLowerCase().includes(t))).slice(0, 6);
          const exact = hits.length === 1 && hits[0].toLowerCase() === t;
          box.innerHTML = exact ? '' : hits.map((x) => `<button type="button" class="ap-opt" role="option" data-v="${esc(x)}"><span><b>${esc(x)}</b></span></button>`).join('');
          inp.setAttribute('aria-expanded', String(!!box.children.length));
        };
        inp.addEventListener('input', show);
        inp.addEventListener('keydown', (e) => { if (e.key === 'ArrowDown' && box.firstElementChild) { e.preventDefault(); box.firstElementChild.focus(); } });
        box.addEventListener('keydown', (e) => {
          const b = e.target.closest('button'); if (!b) return;
          if (e.key === 'ArrowDown') { e.preventDefault(); (b.nextElementSibling || b).focus(); }
          if (e.key === 'ArrowUp') { e.preventDefault(); (b.previousElementSibling || inp).focus(); }
        });
        box.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; inp.value = b.dataset.v; set(b.dataset.v); save(); go(next(s.id)); });
      }
      if (s.optional) inp.addEventListener('input', () => { const nb = f.querySelector('[data-next]'); if (nb) nb.firstChild.nodeValue = inp.value.trim() ? 'Continue ' : 'Skip '; });
      setTimeout(() => inp.focus({ preventScroll: true }), 50);
    } else if (s.type === 'date') {
      const f = step.querySelector('form'), inp = f.querySelector('input');
      const pastOk = s.past === true || (s.past && typeof s.past === 'object' && shows({ when: s.past }, a.ans));
      f.addEventListener('submit', (e) => { e.preventDefault(); let m = '';
        const days = inp.value ? Math.round((new Date(inp.value + 'T00:00:00') - today()) / 864e5) : null;
        if (!inp.value) m = s.optional ? 'Please choose a date, or tap ‘I’m not sure of the date’' : 'Please choose a date';
        else if (days < 0 && !pastOk) m = 'That date has passed. Please check it, or go back and update your answer';
        else if (days < -3650) m = 'Please check the year';
        else if (inp.value > inp.max) m = 'Please choose a date within the next five years';
        if (err(m)) { set(inp.value); go(next(s.id)); } });
      f.querySelector('[data-nodate]')?.addEventListener('click', () => { set('none'); go(next(s.id)); });
    } else if (s.type === 'postcode') {
      const f = step.querySelector('form'), inp = f.querySelector('input');
      f.addEventListener('submit', (e) => { e.preventDefault();
        const v = inp.value.trim().toUpperCase().replace(/\s+/g, '').replace(/(\d[A-Z]{2})$/, ' $1');
        if (!err(POSTCODE_RE.test(v) ? '' : 'Please enter a full UK postcode')) return inp.focus();
        set(v);
        if (areaInfo()?.scope === 'ew' && NOT_EW.test(v)) return exit('scope', s.id);
        go(next(s.id)); });
      f.querySelector('[data-outside]')?.addEventListener('click', () => { set('outside'); go(next(s.id)); });
      inp.addEventListener('input', () => err(''));
      const list = listOf(s), box = f.querySelector('#ap-sugg');
      if (list && box) {
        // Type-ahead: names that start with what was typed come first, then names containing it. Free text is still allowed.
        const show = () => {
          const t = inp.value.trim().toLowerCase();
          const hits = !t ? [] : list.filter((x) => x.toLowerCase().startsWith(t)).concat(list.filter((x) => !x.toLowerCase().startsWith(t) && x.toLowerCase().includes(t))).slice(0, 6);
          const exact = hits.length === 1 && hits[0].toLowerCase() === t;
          box.innerHTML = exact ? '' : hits.map((x) => `<button type="button" class="ap-opt" role="option" data-v="${esc(x)}"><span><b>${esc(x)}</b></span></button>`).join('');
          inp.setAttribute('aria-expanded', String(!!box.children.length));
        };
        inp.addEventListener('input', show);
        inp.addEventListener('keydown', (e) => { if (e.key === 'ArrowDown' && box.firstElementChild) { e.preventDefault(); box.firstElementChild.focus(); } });
        box.addEventListener('keydown', (e) => {
          const b = e.target.closest('button'); if (!b) return;
          if (e.key === 'ArrowDown') { e.preventDefault(); (b.nextElementSibling || b).focus(); }
          if (e.key === 'ArrowUp') { e.preventDefault(); (b.previousElementSibling || inp).focus(); }
        });
        box.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; inp.value = b.dataset.v; set(b.dataset.v); save(); go(next(s.id)); });
      }
      if (s.optional) inp.addEventListener('input', () => { const nb = f.querySelector('[data-next]'); if (nb) nb.firstChild.nodeValue = inp.value.trim() ? 'Continue ' : 'Skip '; });
      setTimeout(() => inp.focus({ preventScroll: true }), 50);
    } else if (s.type === 'summary') {
      const inp = step.querySelector('textarea'), btn = step.querySelector('[data-next]');
      inp.addEventListener('input', () => { set(inp.value); err(''); if (s.optional) btn.firstChild.textContent = inp.value.trim() ? 'Continue ' : 'Skip '; });
      btn.addEventListener('click', () => { const v = inp.value.trim(); if (!v && !s.optional) { err('Please tell us briefly what you need help with'); return inp.focus(); } set(v); go(next(s.id)); });
    } else wireDetails(step);
  }

  // Companies House search via /api/company. Dissolved companies can't be picked. Falls back to a plain name field.
  const CO_STATUS = { dissolved: 'Dissolved', liquidation: 'In liquidation', administration: 'In administration', receivership: 'In receivership', 'converted-closed': 'Closed', 'insolvency-proceedings': 'Insolvency proceedings' };
  function wireCompany(s, step) {
    const inp = step.querySelector('#ap-co'), list = step.querySelector('.ap-co-list');
    let timer, seq = 0, items = [];
    const manual = () => { a.coManual = true; a.companyNumber = ''; save(); show(0); };
    const pick = (c) => { a.ans[s.id] = c.title; a.companyNumber = c.number; save(); go(next(s.id)); };
    const run = async () => {
      const q = inp.value.trim(), my = ++seq;
      if (q.length < 2) { list.innerHTML = ''; return; }
      list.innerHTML = '<p class="ap-note">Searching Companies House…</p>';
      try {
        const r = await fetch(`/api/company?q=${encodeURIComponent(q)}`);
        if (!r.ok) throw new Error(r.status);
        ({ items } = await r.json());
        if (my !== seq) return;
        list.innerHTML = items.length ? items.map((c, i) => {
          const live = c.status === 'active';
          const meta = [c.number, live ? (c.created ? `Incorporated ${c.created.slice(0, 4)}` : '') : (CO_STATUS[c.status] || c.status || ''), c.address].filter(Boolean).join(' · ');
          return `<button type="button" class="ap-opt${a.companyNumber === c.number ? ' sel' : ''}" role="radio" aria-checked="${a.companyNumber === c.number}" data-i="${i}"${live ? '' : ' disabled'}><span><b>${esc(c.title)}</b><small>${esc(meta)}</small></span><span class="ap-tick">${TICK}</span></button>`;
        }).join('') : '<p class="ap-note">No companies found. Check the spelling, or enter the name yourself below.</p>';
        list.querySelectorAll('[data-i]').forEach((b) => b.addEventListener('click', () => pick(items[+b.dataset.i])));
      } catch { if (my === seq && !a.companyNumber) manual(); }
    };
    inp.addEventListener('input', () => { a.ans[s.id] = inp.value; a.companyNumber = ''; step.querySelector('.ap-actions')?.remove(); clearTimeout(timer); timer = setTimeout(run, 300); });
    inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); clearTimeout(timer); run(); } });
    step.querySelector('[data-manual]').addEventListener('click', manual);
    step.querySelector('[data-next]')?.addEventListener('click', () => go(next(s.id)));
    if (inp.value.trim().length >= 2) run();
    setTimeout(() => inp.focus({ preventScroll: true }), 50);
  }

  // ---------- contact details, checks and sending ----------
  const mobile = (v) => {
    let d = String(v).replace(/[^\d+]/g, '').replace(/^\+/, '00');
    if (d.startsWith('0044')) d = '0' + d.slice(4); else if (d.startsWith('44')) d = '0' + d.slice(2);
    return /^07\d{9}$/.test(d) && !/(\d)\1{6,}/.test(d) ? '+44' + d.slice(1) : '';
  };
  const DOMAINS = ['gmail.com', 'googlemail.com', 'hotmail.com', 'hotmail.co.uk', 'outlook.com', 'live.co.uk', 'yahoo.com', 'yahoo.co.uk', 'icloud.com', 'me.com', 'aol.com', 'btinternet.com', 'sky.com', 'virginmedia.com', 'protonmail.com'];
  const DISPOSABLE = ['mailinator.com', 'tempmail.com', 'temp-mail.org', '10minutemail.com', 'guerrillamail.com', 'yopmail.com', 'trashmail.com', 'sharklasers.com', 'getnada.com', 'throwawaymail.com', 'dispostable.com', 'maildrop.cc'];
  const lev = (s, t) => { const d = [...Array(t.length + 1).keys()]; for (let i = 1; i <= s.length; i++) { let p = d[0]; d[0] = i; for (let k = 1; k <= t.length; k++) { const q = d[k]; d[k] = Math.min(d[k] + 1, d[k - 1] + 1, p + (s[i - 1] === t[k - 1] ? 0 : 1)); p = q; } } return d[t.length]; };
  const suggest = (v) => {
    const [u, dom] = v.trim().toLowerCase().split('@');
    if (!u || !dom || DOMAINS.includes(dom)) return '';
    const best = DOMAINS.map((x) => [lev(dom, x), x]).sort((p, q) => p[0] - q[0])[0];
    return best[0] <= 2 ? `${u}@${best[1]}` : '';
  };
  const fixHTML = (s) => `Did you mean <button type="button" class="ap-fix" data-fix="${esc(s)}">${esc(s)}</button>?`;
  let nudged = '';
  const confirmed = { phone: '', email: '' };
  const RULES = {
    fullName: (v) => { v = v.trim().replace(/\s+/g, ' ');
      if (!/^[\p{L}][\p{L}'’.\- ]+$/u.test(v)) return 'Please enter your name using letters only';
      if (v.split(' ').length < 2) return 'Please enter your first and last name';
      if (/^(test|asdf|qwerty|aaa+|abc)\b/i.test(v)) return 'Please enter your real name';
      return ''; },
    email: (v) => !/^[^\s@]+@[^\s@.]+(\.[^\s@.]+)*\.[a-z]{2,}$/i.test(v.trim()) ? 'Please enter a valid email address'
      : DISPOSABLE.includes(v.trim().toLowerCase().split('@')[1]) ? 'Please use an email address you check regularly, not a temporary one' : '',
    phone: (v) => { const d = String(v).replace(/[^\d]/g, ''); if (/^0?[123]\d{8,9}$/.test(d)) return 'That looks like a landline. Please give a mobile so the firm can reach you'; return mobile(v) ? '' : 'Please enter a UK mobile number, for example 07700 900123'; },
  };

  function wireDetails(step) {
    const form = step.querySelector('form');
    const keep = () => { a.contact = { fullName: form.elements.fullName.value, email: form.elements.email.value, phone: form.elements.phone.value }; save(); };
    form.addEventListener('input', (e) => { const el = e.target; if (el.name !== 'website') keep(); el.removeAttribute('aria-invalid'); form.querySelector('.ap-formerr').classList.remove('on'); });
    form.addEventListener('focusout', (e) => {
      const el = e.target, rule = RULES[el.name];
      if (!rule || !el.value.trim()) return;
      const sg = el.name === 'email' && suggest(el.value), msg = rule(el.value) || (sg ? fixHTML(sg) : '');
      if (sg) nudged = el.value;
      form.querySelector(`#ap-${el.name}-err`).innerHTML = msg;
      el.toggleAttribute('aria-invalid', !!msg);
    });
    form.addEventListener('click', (e) => {
      const fix = e.target.closest('[data-fix]'); if (!fix) return;
      form.elements.email.value = fix.dataset.fix; keep();
      form.querySelector('#ap-email-err').innerHTML = ''; form.elements.email.removeAttribute('aria-invalid');
    });
    form.addEventListener('submit', (e) => { e.preventDefault(); submit(form); });
  }

  // Cloudflare Turnstile (bot check). Off until the site key is set on the server (/api/platform?action=config).
  const ts = { key: undefined, id: null, box: null, wait: null };
  const humanToken = async (box) => {
    if (ts.key === undefined) ts.key = await fetch('/api/platform?action=config').then((r) => r.json()).then((d) => d.turnstile || null).catch(() => null);
    if (!ts.key || !box) return '';
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
  const FBC_KEY = 'll-fbc';
  try { const fb = qp.get('fbclid'); if (fb) sessionStorage.setItem(FBC_KEY, `fb.1.${Date.now()}.${fb}`); } catch {}
  const getFbc = () => { try { return sessionStorage.getItem(FBC_KEY) || ''; } catch { return ''; } };
  const getFbp = () => (document.cookie.match(/(?:^|; )_fbp=([^;]+)/) || [])[1] || '';

  // Readable question and answer list, in order, for the firm (the server rebuilds it from the same data).
  function answerList() {
    const out = [];
    for (const s of steps()) {
      if (['postcode', 'urgency', 'pay', 'business', 'summary', 'details'].includes(s.id)) continue;
      const v = a.ans[s.id]; if (v == null || v === '') continue;
      const lab = s.options ? [].concat(v).map((x) => s.options.find((o) => o.v === x)?.label).filter(Boolean).join(', ')
        : s.type === 'date' ? (v === 'none' ? 'Not sure' : new Date(v + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })) : String(v);
      if (lab) out.push({ id: s.id, q: s.q, a: lab.slice(0, 300) });
    }
    return out.slice(0, 40);
  }

  async function submit(form) {
    let first = null;
    for (const [n, rule] of Object.entries(RULES)) {
      const el = form.elements[n], msg = rule(el.value);
      form.querySelector(`#ap-${n}-err`).innerHTML = msg; el.toggleAttribute('aria-invalid', !!msg);
      if (msg && !first) first = el;
    }
    const sg = !first && suggest(form.elements.email.value);
    if (sg && nudged !== form.elements.email.value) { nudged = form.elements.email.value; form.querySelector('#ap-email-err').innerHTML = fixHTML(sg); first = form.elements.email; }
    if (first) return first.focus();

    const btn = form.querySelector('button[type=submit]'), errBox = form.querySelector('.ap-formerr');
    const reset = () => { btn.disabled = false; btn.firstChild.textContent = 'Get matched '; };
    btn.disabled = true; btn.firstChild.textContent = 'Sending… '; errBox.classList.remove('on');
    const area = a.area, d = area === UNSURE ? { audience: 'individual', tags: [] } : derive(area, a.ans);
    const m = d.matter ? matterOf(area, d.matter) : null;
    const name = form.elements.fullName.value.trim().replace(/\s+/g, ' ');
    const payload = {
      formVersion: FORM_VERSION, area, areaLabel: areaInfo()?.label || 'Not sure yet', matter: m?.label || null, matterSlug: m?.page ? m.slug : null, matterKey: m?.slug || null,
      audience: d.audience, ans: a.ans, answers: area === UNSURE ? [] : answerList(), tags: [...new Set(d.tags || [])],
      value: d.value || null, valueLabel: d.valueLabel || null, deadline: d.deadline || null,
      urgency: a.ans.urgency, postcode: a.ans.postcode === 'outside' ? '' : a.ans.postcode, outsideUK: a.ans.postcode === 'outside',
      privatePay: a.ans.pay, business: d.audience === 'business' ? (a.ans.business || Object.entries(a.ans).find(([k]) => steps().find((s) => s.id === k)?.type === 'company')?.[1] || '') : '',
      companyNumber: a.companyNumber || '', summary: String(a.ans.summary || '').trim().slice(0, 500),
      fullName: name, firstName: name.split(' ')[0], lastName: name.split(' ').slice(1).join(' '),
      email: form.elements.email.value.trim(), phone: mobile(form.elements.phone.value),
      phoneConfirmed: !!confirmed.phone && confirmed.phone === mobile(form.elements.phone.value), emailConfirmed: !!confirmed.email && confirmed.email === form.elements.email.value.trim(),
      consentTerms: true, consentShare: true,
      consentVersion: CONSENT_VERSION, consentAt: new Date().toISOString(), consentText: plain(NOTICE),
      marketing: !!window.leaflegalCookies?.get()?.marketing, fbc: getFbc(), fbp: getFbp(),
      eventId: (crypto.randomUUID && crypto.randomUUID()) || String(Date.now()),
      website: form.elements.website.value, _ms: Date.now() - t0,
      page: location.href, referrer: document.referrer, utm: Object.fromEntries(qp), first: (() => { try { return JSON.parse(sessionStorage.getItem('ll_src') || 'null'); } catch { return null; } })(),
    };
    try {
      payload.turnstile = await humanToken(form.querySelector('#ap-ts'));
      const res = await fetch('/api/enquiry', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (res.status === 400) {
        const e = await res.json().catch(() => ({}));
        if (e.field && form.elements[e.field]) {
          reset();
          const box = form.querySelector(`#ap-${e.field}-err`), el = form.elements[e.field];
          box.innerHTML = esc(e.error) + (e.suggest ? ' ' + fixHTML(e.suggest) : '') + (e.confirm ? ' <button type="button" class="ap-fix" data-ok>It’s correct, continue</button>' : '');
          box.querySelector('[data-ok]')?.addEventListener('click', () => {
            confirmed[e.field] = e.field === 'phone' ? mobile(el.value) : el.value.trim();
            box.innerHTML = ''; el.removeAttribute('aria-invalid'); form.requestSubmit();
          });
          el.setAttribute('aria-invalid', 'true'); return el.focus();
        }
        if (e.error) { reset(); errBox.textContent = e.error; errBox.classList.add('on'); return; }
      }
      if (!res.ok) throw new Error(res.status);
      const r = await res.json().catch(() => ({}));
      done(payload, r.meta);
    } catch {
      reset();
      errBox.innerHTML = 'Sorry, something went wrong sending your details. Please try again, or email <a href="mailto:hello@leaflegal.co">hello@leaflegal.co</a>.';
      errBox.classList.add('on');
    }
  }

  function done(p, meta = {}) {
    if (meta.lead !== false) T('Lead', { content_name: 'Enquiry' }, { eventId: p.eventId, server: false });
    a.sent = { firstName: p.firstName, area: p.areaLabel, matter: p.matter, urgency: p.urgency, postcode: p.postcode, imm: p.area === 'immigration' };
    hist.push(DONE); save(); show(1);
    try { localStorage.removeItem(KEY); } catch {}
  }

  function exitScreen(key) {
    const x = exitOf(a.area, key);
    return `<div class="ap-step on ap-done"><div class="ap-badge ap-badge-no">${CROSS}</div>
      <h2 class="ap-q" tabindex="-1">Sorry, we can’t help with this one</h2><p class="ap-stop">${esc(x.reason)}</p>
      ${x.links?.length ? `<ul class="im-links">${x.links.map(([href, t]) => `<li><a href="${esc(href)}" target="_blank" rel="noopener">${esc(t)}</a></li>`).join('')}</ul>` : ''}
      <div class="ap-actions"><button type="button" class="button ap-next" data-change>Change my answer</button></div></div>`;
  }
  function doneScreen() {
    const p = a.sent || {}, who = p.imm ? 'regulated adviser' : 'law firm';
    const rows = [['Help with', p.area], ['Matter', p.matter], ['Urgency', p.urgency], ['Postcode', p.postcode]].filter(([, v]) => v);
    return `<div class="ap-step on ap-done"><div class="ap-badge">${TICK}</div>
      <h2 class="ap-q" tabindex="-1">Thanks${p.firstName ? ', ' + esc(p.firstName) : ''}. We’ve got your enquiry.</h2>
      <p class="ap-done-lead">We’ll introduce you to one regulated ${who} that handles this kind of matter. We’ve sent a confirmation to your email.</p>
      <dl class="ap-summary">${rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
      <ol class="ap-steps-next"><li>The ${who} reads your answers</li><li>They contact you, usually by phone, to see if they can help</li><li>They explain their fees before you agree to anything</li></ol></div>`;
  }

  function show(dir) {
    const id = top(), isExit = id.startsWith('x_'), isDone = id === DONE;
    if (isExit) body.innerHTML = exitScreen(id.slice(2));
    else if (isDone) body.innerHTML = doneScreen();
    else {
      const s = stepById(id);
      if (!s) { hist = hist.slice(0, -1); if (!hist.length) hist = [fixedArea ? firstOpen() : 'area']; return show(0); }
      body.innerHTML = `<div class="ap-step on${dir < 0 ? ' back' : ''}${dir === 0 ? ' still' : ''}">${render(s)}</div>`;
      wire(s, body.firstElementChild);
      if (!seen.has(id)) { seen.add(id); T(seen.size === 1 ? 'ViewContent' : 'FormStep', seen.size === 1 ? { form: 'legal', content_name: 'Legal enquiry form' } : { form: 'legal', step_name: id }); }
    }
    body.querySelector('[data-change]')?.addEventListener('click', back);
    const p = full(), i = p.findIndex((s) => s.id === id);
    bar.innerHTML = `<i class="ap-fill" style="width:${isDone ? 100 : isExit ? 0 : Math.round(((Math.max(i, 0) + 1) / Math.max(p.length, 1)) * 100)}%"></i>`;
    count.textContent = isDone ? 'Complete' : isExit || i < 0 || !a.area ? '' : `Step ${i + 1} of ${p.length}`;
    backBtn.classList.toggle('on', hist.length > 1 && !isDone && !isExit);
    root.closest('.ap-lp')?.classList.toggle('ap-going', hist.length > 1);
    if (dir) { body.querySelector('.ap-q')?.focus({ preventScroll: true }); if (root.getBoundingClientRect().top < 0) root.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  }

  backBtn.addEventListener('click', back);
  // Area cards elsewhere on the page (data-area="Family law" or a slug): start that area's form, then scroll up to it.
  if (!fixedArea) window.addEventListener('click', (e) => {
    const card = e.target.closest('[data-area]');
    if (!card || card === root) return;
    const ar = areaOf(card.dataset.area)?.slug || (card.dataset.area === UNSURE ? UNSURE : null);
    if (!ar) return;
    setArea(ar); hist = ['area', firstOpen()]; save(); show(0);
  }, true);
  root.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' || e.target.closest('form') || e.target.matches('button, textarea')) return;
    const n = body.querySelector('[data-next]'); if (n) { e.preventDefault(); n.click(); }
  });
  show(0);
}

// Law firm partner enquiry (/partners/apply, and the pop-up from partner-popup.js). Step 1: name, firm, email, phone and consent,
// emailed to the team by api/partner.js. Step 2: book a call with Aran (Google Calendar slots from api/partner.js).
(() => {
 // mount(root, { modal }) renders the flow into any element: the /partners/apply page, or the pop-up (partner-popup.js).
 function mount(root, opts = {}) {
  const KEY = 'lg-partner-enquiry-v1', FORM = 'legal', NAME = 'Law firm partner application';
  const I = (d, w = 1.8) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const TICK = I('<path d="M5 12l5 5 9-10"/>', 3), ARROW = I('<path d="M5 12h14M13 6l6 6-6 6"/>'), BACK = I('<path d="M19 12H5M11 6l-6 6 6 6"/>');
  const ICON = {
    mail: I('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>'),
    cal: I('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>'),
    video: I('<rect x="3" y="6" width="13" height="12" rx="2"/><path d="M16 10l5-3v10l-5-3"/>'),
    bolt: I('<path d="M13 3L5 14h6l-1 7 8-11h-6l1-7z"/>'),
    clock: I('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
    phone: I('<path d="M22 16.9v3a2 2 0 0 1-2.2 2A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>'),
  };
  const PATHS = { start: [['details', 'Your details'], ['time', 'Book a call']] };
  const CONSENT = 'I agree to Leaflegal contacting me about my enquiry and to the <a href="/privacy-policy" target="_blank">Privacy Policy</a>.';

  let a = {}; try { a = JSON.parse(localStorage.getItem(KEY)) || {}; } catch {}
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(a)); } catch {} };
  const t0 = Date.now(); let how = 'phone', path = 'start', stage = 0, sent = null, slots = null, day = null, pick = null, started = false;
  const T = (...x) => (window.llTrack ? window.llTrack(...x) : (window.__llq = window.__llq || []).push(x));
  const seen = new Set();
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const UK = (iso, o) => new Date(iso).toLocaleString('en-GB', { timeZone: 'Europe/London', ...o });
  const hm = (iso) => UK(iso, { hour: 'numeric', minute: '2-digit', hour12: true }).replace(' ', '');
  const dayKey = (iso) => UK(iso, { year: 'numeric', month: '2-digit', day: '2-digit' });
  const stages = () => PATHS[path] || [];
  const at = () => stages()[stage]?.[0] || 'details';

  const field = (n, label, type, ac) => `<div class="pe-field"><label for="pe-${n}">${label}</label><input id="pe-${n}" name="${n}" type="${type}" autocomplete="${ac}" value="${esc(a[n] || '')}"><span class="pe-err" id="pe-${n}-err"></span></div>`;
  const back = (label = 'Back') => `<button type="button" class="pe-back" data-back>${BACK}${label}</button>`;

  function view() {
    const s = at();
    if (s === 'time') return timeView();
    return `<h2 class="pe-h" tabindex="-1">${opts.modal ? 'Get law firm leads' : 'Get started'}</h2>
      <p class="pe-lead">Tell us who you are, then pick a time for a 30-minute call with Aran, our founder.</p>
      <form novalidate><div class="pe-grid pe-grid-1">
        ${field('fullName', 'Full name', 'text', 'name')}${field('company', 'Firm name', 'text', 'organization')}
        ${field('email', 'Work email', 'email', 'email')}${field('phone', 'Phone number', 'tel', 'tel')}
      </div>
      <div class="ap-hp" aria-hidden="true"><label>Leave blank<input name="hp" tabindex="-1" autocomplete="off"></label></div>
      <label class="pe-consent"><input type="checkbox" name="consent"><span>${CONSENT}</span></label><span class="pe-err" id="pe-consent-err"></span>
      <button type="submit" class="button pe-next pe-wide">Next: book a call ${ARROW}</button>
      <div class="pe-formerr" role="alert"></div></form>`;
  }

  function timeView() {
    const opt = (k, ic, t, d) => `<button type="button" class="pe-how${how === k ? ' on' : ''}" role="radio" aria-checked="${how === k}" data-how="${k}"><span class="pe-ic">${ic}</span><span><b>${t}</b><small>${d}</small></span></button>`;
    const head = `<h2 class="pe-h" tabindex="-1">Book a call with Aran</h2><p class="pe-lead">30 minutes to go through your practice areas, lead volumes, pricing and any questions.</p>
      <div class="pe-hows" role="radiogroup" aria-label="Type of call">${opt('phone', ICON.phone, 'Phone call', `We call you on ${esc(sent?.phone || 'your number')}`)}${opt('meet', ICON.video, 'Google Meet', 'Video call, link in your invite')}</div>`;
    if (slots === null) return `${head}<div class="pe-cal-load" aria-busy="true"><span></span><span></span><span></span></div>`;
    if (!slots.length) return `${head}<div class="pe-note"><b>Online booking isn't available right now.</b> We have your details, so Aran will call you within one working day to find a time.</div>`;
    const days = [...new Map(slots.map((x) => [dayKey(x), x])).values()];
    if (!days.some((x) => dayKey(x) === day)) day = dayKey(days[0]);
    return `${head}
      <div class="pe-days" role="tablist" aria-label="Day">${days.map((x) => { const k = dayKey(x); return `<button type="button" role="tab" aria-selected="${k === day}" class="pe-day${k === day ? ' on' : ''}" data-day="${k}"><small>${UK(x, { weekday: 'short' })}</small><b>${UK(x, { day: 'numeric' })}</b><small>${UK(x, { month: 'short' })}</small></button>`; }).join('')}</div>
      <div class="pe-times" role="radiogroup" aria-label="Time">${slots.filter((x) => dayKey(x) === day).map((x) => `<button type="button" role="radio" aria-checked="${x === pick}" class="pe-time${x === pick ? ' on' : ''}" data-t="${x}">${hm(x)}</button>`).join('')}</div>
      <p class="pe-tz">Times are UK time.</p><div class="pe-formerr" role="alert"></div>
      <div class="pe-nav pe-nav-call"><span></span><button type="button" class="button pe-next" data-book${pick ? '' : ' disabled'}>${pick ? `Book ${UK(pick, { weekday: 'short', day: 'numeric', month: 'short' })}, ${hm(pick)}` : 'Pick a time'} ${ARROW}</button></div>`;
  }

  function show(dir = 1) {
    const bar = root.querySelector('.pe-stages'); bar.hidden = stages().length < 2;
    bar.innerHTML = stages().map(([, n], i) => `<li class="${i < stage ? 'done' : i === stage ? 'on' : ''}"${i === stage ? ' aria-current="step"' : ''}><span>${i < stage ? TICK : i + 1}</span>${n}</li>`).join('');
    const body = root.querySelector('.pe-body');
    body.innerHTML = `<div class="pe-step${dir < 0 ? ' back' : ''}">${view()}</div>`;
    const id = `${path || ''}:${at()}`;
    if (!seen.has(id)) { seen.add(id); T(seen.size === 1 ? 'ViewContent' : 'FormStep', seen.size === 1 ? { form: FORM, content_name: NAME } : { form: FORM, step: seen.size, step_name: id }); }
    wire();
    if (dir !== 0) { body.querySelector('.pe-h')?.focus({ preventScroll: true }); if (root.getBoundingClientRect().top < 0) root.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  }
  const go = (d) => { stage += d; show(d); };

  function wire() {
    root.querySelector('[data-back]')?.addEventListener('click', () => go(-1));
    root.querySelector('[data-book]')?.addEventListener('click', (e) => { if (!e.currentTarget.disabled) book(e.currentTarget); });
    root.querySelectorAll('[data-how]').forEach((b) => b.addEventListener('click', () => { how = b.dataset.how; show(0); }));
    root.querySelectorAll('[data-day]').forEach((b) => b.addEventListener('click', () => { day = b.dataset.day; pick = null; show(0); }));
    root.querySelectorAll('[data-t]').forEach((b) => b.addEventListener('click', () => { pick = b.dataset.t; show(0); root.querySelector('[data-book]')?.focus(); }));
    const form = root.querySelector('form');
    if (!form) return;
    form.addEventListener('input', (e) => { const el = e.target; if (el.name === 'hp') return; if (!started) { started = true; T('FormStart', { form: FORM }); } a[el.name] = el.type === 'checkbox' ? el.checked : el.value; save(); el.removeAttribute('aria-invalid'); });
    form.addEventListener('focusout', (e) => { const el = e.target, rule = RULES[el.name]; if (!rule || !el.value.trim()) return; const m = rule(el.value); form.querySelector(`#pe-${el.name}-err`).textContent = m; m ? el.setAttribute('aria-invalid', 'true') : el.removeAttribute('aria-invalid'); });
    form.addEventListener('submit', (e) => { e.preventDefault(); submit(form); });
  }

  const RULES = {
    fullName: (v) => v.trim().split(/\s+/).length >= 2 ? '' : 'Please enter a first and last name',
    company: (v) => v.trim() ? '' : 'Please enter your firm name',
    email: (v) => /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)*\.[a-z]{2,}$/i.test(v.trim()) ? '' : 'Please enter a valid email address',
    phone: (v) => /^(?:0|\+?44)\d{9,10}$/.test(v.replace(/[\s()-]/g, '')) ? '' : 'Please enter a UK phone number, e.g. 020 7946 0123',
  };

  async function submit(form) {
    let first = null;
    for (const [n, rule] of Object.entries(RULES)) {
      const el = form.elements[n], m = rule(el.value); form.querySelector(`#pe-${n}-err`).textContent = m;
      if (m) { el.setAttribute('aria-invalid', 'true'); first ||= el; } else el.removeAttribute('aria-invalid');
    }
    const c = form.elements.consent; form.querySelector('#pe-consent-err').textContent = c.checked ? '' : 'Please tick this box to continue'; if (!c.checked) first ||= c;
    if (first) return first.focus();

    const btn = form.querySelector('button[type=submit]'), err = form.querySelector('.pe-formerr');
    const fail = (msg) => { btn.disabled = false; btn.classList.remove('busy'); err.innerHTML = msg; err.classList.add('on'); };
    btn.disabled = true; btn.classList.add('busy'); err.classList.remove('on');
    const [firstName, ...rest] = String(a.fullName).trim().split(/\s+/);
    const p = { form: FORM, route: 'Book a call', firstName, lastName: rest.join(' '), company: a.company.trim(), email: a.email.trim(), phone: a.phone.trim(),
      consent: true, consentText: CONSENT.replace(/<[^>]+>/g, ''), eventId: (crypto.randomUUID && crypto.randomUUID()) || String(Date.now()),
      fbc: window.llTrackIds?.fbc() || '', fbp: window.llTrackIds?.fbp() || '', hp: form.elements.hp.value, _ms: Date.now() - t0, page: location.href, referrer: document.referrer, source: (() => { try { return JSON.parse(sessionStorage.getItem('ll_src') || 'null'); } catch { return null; } })() };
    try {
      const r = await fetch('/api/partner', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(p) }), j = await r.json().catch(() => ({}));
      if (!r.ok) return fail(esc(j.error && r.status === 400 ? j.error : 'Sorry, something went wrong sending these details.') + ' Please try again, or email <a href="mailto:hello@leaflegal.co">hello@leaflegal.co</a>.');
    } catch { return fail('Sorry, something went wrong sending these details. Please try again, or email <a href="mailto:hello@leaflegal.co">hello@leaflegal.co</a>.'); }
    T('SubmitApplication', { content_name: NAME }, { eventId: p.eventId, server: false });
    sent = p; try { localStorage.removeItem(KEY); } catch {}
    stage = 1; loadSlots(); show(1);
  }

  async function book(btn) {
    const err = root.querySelector('.pe-formerr'); btn.disabled = true; btn.classList.add('busy'); err.classList.remove('on');
    try {
      const r = await fetch('/api/partner?action=book', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...sent, slot: pick, how }) });
      const j = await r.json().catch(() => ({}));
      if (r.ok) { T('Schedule', { content_name: 'Partner call' }); if (sent.eventId) T('PartnerCallBooked', { content_name: how === 'meet' ? 'Google Meet call' : 'Phone call' }, { eventId: `${sent.eventId}-cb`, server: false }); return done(j); }
      if (r.status === 409 || r.status === 400) { slots = (slots || []).filter((x) => x !== pick); pick = null; show(0); }
      const e2 = root.querySelector('.pe-formerr'); e2.textContent = j.error || 'We couldn’t book that time. Please try another.'; e2.classList.add('on');
      const b2 = root.querySelector('[data-book]'); if (b2 && pick) { b2.disabled = false; b2.classList.remove('busy'); }
    } catch { err.textContent = 'We couldn’t book that time. Please try again.'; err.classList.add('on'); btn.disabled = false; btn.classList.remove('busy'); }
  }

  async function loadSlots() {
    try { const j = await fetch('/api/partner?action=slots').then((r) => r.json()); slots = j.configured ? j.slots : []; } catch { slots = []; }
    if (at() === 'time') show(0);
  }

  function done(b) {
    const bar = root.querySelector('.pe-stages'); bar.innerHTML = stages().map(([, n]) => `<li class="done"><span>${TICK}</span>${n}</li>`).join('');
    const phone = b.how !== 'meet';
    const row = (ic, k, v) => `<li><span class="pe-ic">${ic}</span><div><small>${k}</small><b>${v}</b></div></li>`;
    root.querySelector('.pe-body').innerHTML = `<div class="pe-step pe-done"><div class="ap-badge">${TICK}</div>
      <h2 class="pe-h" tabindex="-1">Your call is booked</h2>
      <p class="pe-lead">${phone ? `Aran will call you on ${esc(sent.phone)}.` : 'Join from the Google Meet link in your calendar invite.'}</p>
      <ul class="pe-booked">
        ${row(ICON.cal, 'When', `${UK(b.start, { weekday: 'long', day: 'numeric', month: 'long' })}, ${hm(b.start)} UK time`)}
        ${row(phone ? ICON.phone : ICON.video, 'How', phone ? `Phone call to ${esc(sent.phone)}` : 'Google Meet video call')}
        ${row(ICON.mail, 'Calendar invite', `Sent to ${esc(sent.email)}`)}
      </ul>
      <p class="pe-small">Need a different time? Reply to the calendar invite.</p></div>`;
    root.querySelector('.pe-h').focus();
  }

  root.innerHTML = `<ol class="pe-stages" aria-label="Progress"></ol><div class="pe-body"></div>`;
  show(0);
 }
 window.LLPartner = { mount };
 const pe = document.getElementById('pe'); if (pe) mount(pe);
})();

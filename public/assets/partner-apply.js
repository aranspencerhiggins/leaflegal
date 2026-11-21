// "Apply to become a partner" multi-step form for brokers (/partners/apply) and law firms (/partners/legal/apply,
// data-form="legal"). Same UI classes as the business
// form (assets/apply.css). ponytail: kept separate from apply.js so edits here can't break the live lead form;
// merge into one configurable script only if a third form appears.
(() => {
  const root = document.getElementById('ap');
  if (!root) return;
  const LEGAL = root.dataset.form === 'legal';
  const KEY = LEGAL ? 'll-legal-apply-v1' : 'll-partner-apply-v3';
  const FORM = LEGAL ? 'legal' : 'partner', NAME = LEGAL ? 'Law firm partner application' : 'Broker partner application';
  const I = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
  const ICON = {
    mail: I('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>'),
    crm: I('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M8 14h3M8 17h6"/>'),
    plan: I('<circle cx="9" cy="9" r="6"/><path d="M15.5 9.6A6 6 0 1 1 9.6 15.5"/><path d="M9 7v4h2"/>'),
    unsure: I('<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6V14M12 17h.01"/>'),
  };
  const TICK = I('<path d="M5 12l5 5 9-10" stroke-width="3"/>');
  const ARROW = I('<path d="M5 12h14M13 6l6 6-6 6"/>');

  // Leads per month slider: brokers start at 50 (minimum 25); law firms start at 25 (minimum 10).
  const VOLUMES = LEGAL ? [5, 10, 15, 20, 25, 30, 40, 50, 75, 100, 150, 200] : [5, 10, 15, 20, 25, 30, 40, 50, 60, 75, 100, 125, 150, 200, 250, 300, 400, 500];
  const MIN_LEADS = LEGAL ? 10 : 25, DEFAULT_IDX = VOLUMES.indexOf(LEGAL ? 25 : 50);
  const volLabel = (n) => `${n}${n === VOLUMES[VOLUMES.length - 1] ? '+' : ''}`;

  const VOLUME_STEP = { id: 'volume', q: 'How many leads are you looking for each month?', type: 'slider' };
  const BROKER_STEPS = [
    VOLUME_STEP,
    { id: 'funds', q: 'What types of finance do you arrange?', type: 'multi', opts: [
      'Unsecured business loans', 'Secured business loans', 'Asset and equipment finance', 'Invoice finance',
      'Merchant cash advance', 'Commercial mortgages', 'Bridging and development', 'Refinancing', 'VAT and tax loans', 'Other',
    ]},
    { id: 'sizes', q: 'Which loan sizes do you work with?', type: 'multi', opts: ['Under £25k', '£25k to £100k', '£100k to £500k', '£500k to £2m', '£2m+'] },
    { id: 'fca', q: 'What is your FCA status?', type: 'chips', opts: ['FCA authorised', 'Appointed representative', 'Not FCA authorised', 'Applying for authorisation'] },
    { id: 'delivery', q: 'How would you like to receive leads?', type: 'cards', one: true, opts: [
      ['mail', 'By email', 'Straight to an inbox your team monitors'],
      ['crm', 'Into our CRM', 'Via webhook or your CRM’s lead email address'],
      ['unsure', 'Not sure yet', 'We can talk it through'],
    ]},
    { id: 'start', q: 'When would you like to start?', type: 'chips', opts: ['As soon as possible', 'Within a month', 'Just exploring for now'] },
    { id: 'details', q: 'Tell us about you', type: 'details' },
  ];
  const LEGAL_STEPS = [
    VOLUME_STEP,
    { id: 'areas', q: 'Which practice areas would you like leads for?', type: 'multi', opts: [
      'Immigration', 'Family and divorce', 'Wills, probate and LPAs', 'Employment', 'Motoring offences',
      'Inheritance disputes', 'Landlord and possession', 'Business disputes',
    ]},
    { id: 'regulator', q: 'How is your firm regulated?', type: 'chips', opts: ['SRA', 'CILEx Regulation', 'OISC (immigration)', 'Other'] },
    { id: 'coverage', q: 'Where do you take on clients?', type: 'chips', opts: ['Anywhere in England and Wales', 'Specific towns or regions'] },
    ...BROKER_STEPS.slice(-3), // delivery, start, details
  ];
  const STEPS = LEGAL ? LEGAL_STEPS : BROKER_STEPS;

  let a = {};
  try { a = JSON.parse(localStorage.getItem(KEY)) || {}; } catch {}
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(a)); } catch {} };
  const t0 = Date.now();
  let idx = 0;
  // Funnel tracking (assets/track.js). Queued if track.js hasn't loaded yet.
  const T = (...x) => (window.llTrack ? window.llTrack(...x) : (window.__llq = window.__llq || []).push(x));
  const seen = new Set(); let started = false;
  const body = root.querySelector('.ap-body'), bar = root.querySelector('.ap-bar'), count = root.querySelector('.ap-count'), back = root.querySelector('.ap-back');
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const nextBtn = (disabled) => `<div class="ap-actions"><button type="button" class="button ap-next" data-next${disabled ? ' disabled' : ''}>Continue ${ARROW}</button></div>`;
  const opt = (s, t, sel, role, inner) => `<button type="button" class="ap-opt${sel ? ' sel' : ''}" role="${role}" aria-checked="${sel}" data-v="${esc(t)}">${inner}<span class="ap-tick">${TICK}</span></button>`;
  const CONSENT = 'I agree to Loanleaf contacting me about becoming a partner and to the <a href="/terms-conditions" target="_blank">Terms of Service</a> and <a href="/privacy-policy" target="_blank">Privacy Policy</a>.';

  function render(s) {
    let h = `<h2 class="ap-q" tabindex="-1">${s.q}</h2>`;
    if (s.type === 'cards') {
      h += `<div class="ap-opts${s.one ? ' one' : ''}" role="radiogroup" aria-label="${esc(s.q)}">${s.opts.map(([ic, t, d]) =>
        opt(s, t, a[s.id] === t, 'radio', `<span class="ap-ico">${ICON[ic]}</span><span><b>${t}</b>${d ? `<small>${d}</small>` : ''}</span>`)).join('')}</div>${a[s.id] ? nextBtn(false) : ''}`;
    } else if (s.type === 'chips') {
      h += `<div class="ap-opts one" role="radiogroup" aria-label="${esc(s.q)}">${s.opts.map((t) => opt(s, t, a[s.id] === t, 'radio', `<span><b>${t}</b></span>`)).join('')}</div>${a[s.id] ? nextBtn(false) : ''}`;
    } else if (s.type === 'slider') {
      const i = a.volumeIdx ?? DEFAULT_IDX;
      h += `<div class="ap-amount" aria-live="polite"><span data-vol>${volLabel(VOLUMES[i])}</span> <small class="ap-unit">leads a month</small></div>
        <input class="ap-range" type="range" min="0" max="${VOLUMES.length - 1}" step="1" value="${i}" aria-label="Leads per month" aria-describedby="ap-min">
        <div class="ap-scale"><span>${VOLUMES[0]}</span><span>${volLabel(VOLUMES[VOLUMES.length - 1])}</span></div>
        <p class="ap-min" id="ap-min" role="status"></p>${nextBtn(false)}`;
    } else if (s.type === 'multi') {
      const cur = a[s.id] || [];
      h += `<p class="ap-multi-hint">Choose all that apply.</p><div class="ap-opts" role="group" aria-label="${esc(s.q)}">${s.opts.map((t) => opt(s, t, cur.includes(t), 'checkbox', `<span><b>${t}</b></span>`)).join('')}</div>${nextBtn(!cur.length)}`;
    } else {
      const showFca = LEGAL ? ['SRA', 'CILEx Regulation', 'OISC (immigration)'].includes(a.regulator) : a.fca === 'FCA authorised' || a.fca === 'Appointed representative';
      const regLabel = LEGAL ? `${a.regulator === 'OISC (immigration)' ? 'OISC' : a.regulator === 'CILEx Regulation' ? 'CILEx' : 'SRA'} number` : 'FCA firm reference number';
      const f = (n, l, type, ac, opts = {}) => `<div class="ap-field${opts.full ? ' full' : ''}"><label for="ap-${n}">${l}${opts.optional ? ' <small class="ap-opt-label">Optional</small>' : ''}</label><input id="ap-${n}" name="${n}" type="${type}" autocomplete="${ac}" value="${esc(a[n] || '')}"${opts.optional ? '' : ' required'}${opts.inputmode ? ` inputmode="${opts.inputmode}"` : ''}><span class="ap-err" id="ap-${n}-err"></span></div>`;
      h += `<form novalidate><div class="ap-grid">
        ${f('firstName', 'First name', 'text', 'given-name')}${f('lastName', 'Last name', 'text', 'family-name')}
        ${f('company', LEGAL ? 'Firm name' : 'Company name', 'text', 'organization')}${f('role', 'Your role', 'text', 'organization-title', { optional: true })}
        ${f('email', 'Work email', 'email', 'email')}${f('phone', 'Phone number', 'tel', 'tel')}
        ${f('site', 'Website', 'url', 'url', { optional: true })}${showFca ? f('fcaRef', regLabel, 'text', 'off', { optional: true, inputmode: 'numeric' }) : '<div></div>'}
        <div class="ap-field full"><label for="ap-notes">Anything else we should know? <small class="ap-opt-label">Optional</small></label><textarea id="ap-notes" name="notes" rows="3" placeholder="${LEGAL ? 'Towns or regions you cover, matter types you want or don’t want' : 'Sectors, regions or criteria you focus on'}">${esc(a.notes || '')}</textarea></div>
        </div>
        <div class="ap-hp" aria-hidden="true"><label>Leave blank<input name="hp" tabindex="-1" autocomplete="off"></label></div>
        <label class="ap-consent"><input type="checkbox" name="consent" ${a.consent ? 'checked' : ''} required><span>${CONSENT}</span></label><span class="ap-err" id="ap-consent-err"></span>
        <div class="ap-actions"><button type="submit" class="button ap-next">Send application ${ARROW}</button></div>
        <div class="ap-formerr" role="alert"></div></form>`;
    }
    return h;
  }

  function show(dir = 1) {
    idx = Math.max(0, Math.min(idx, STEPS.length - 1));
    const s = STEPS[idx];
    body.innerHTML = `<div class="ap-step on${dir < 0 ? ' back' : ''}">${render(s)}</div>`;
    if (!seen.has(s.id)) { seen.add(s.id); T(seen.size === 1 ? 'ViewContent' : 'FormStep', seen.size === 1 ? { form: FORM, content_name: NAME } : { form: FORM, step: idx + 1, step_name: s.id }); }
    bar.innerHTML = STEPS.map((_, i) => `<span${i <= idx ? ' class="on"' : ''}></span>`).join('');
    count.textContent = `Step ${idx + 1} of ${STEPS.length}`;
    back.classList.toggle('on', idx > 0);
    wire(s);
    if (dir !== 0) body.querySelector('.ap-q').focus({ preventScroll: true });
    if (dir !== 0 && root.getBoundingClientRect().top < 0) root.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  const go = (d) => { if (d > 0 && !started) { started = true; T('FormStart', { form: FORM }); } idx += d; save(); show(d); };

  function wire(s) {
    const step = body.firstElementChild;
    if (s.type === 'slider') {
      const r = step.querySelector('.ap-range'), out = step.querySelector('[data-vol]'), note = step.querySelector('.ap-min'), next = step.querySelector('[data-next]');
      const set = (i) => {
        const n = VOLUMES[i], low = n < MIN_LEADS;
        a.volumeIdx = +i; a.volume = volLabel(n); out.textContent = volLabel(n);
        r.style.setProperty('--p', `${(i / (VOLUMES.length - 1)) * 100}%`);
        note.textContent = low ? `Minimum ${MIN_LEADS} leads per month` : '';
        note.classList.toggle('on', low); next.disabled = low; save();
      };
      set(a.volumeIdx ?? DEFAULT_IDX);
      r.addEventListener('input', () => set(r.value));
      next.addEventListener('click', () => { if (!next.disabled) go(1); });
    } else if (s.type === 'cards' || s.type === 'chips') {
      step.querySelectorAll('.ap-opt').forEach((b) => b.addEventListener('click', () => {
        a[s.id] = b.dataset.v;
        step.querySelectorAll('.ap-opt').forEach((o) => { o.classList.toggle('sel', o === b); o.setAttribute('aria-checked', o === b); });
        setTimeout(() => go(1), 260);
      }));
      step.querySelector('[data-next]')?.addEventListener('click', () => go(1));
    } else if (s.type === 'multi') {
      const next = step.querySelector('[data-next]');
      step.querySelectorAll('.ap-opt').forEach((b) => b.addEventListener('click', () => {
        const cur = new Set(a[s.id] || []), v = b.dataset.v;
        cur.has(v) ? cur.delete(v) : cur.add(v);
        a[s.id] = s.opts.filter((t) => cur.has(t)); save();
        b.classList.toggle('sel', cur.has(v)); b.setAttribute('aria-checked', cur.has(v));
        next.disabled = !cur.size;
      }));
      next.addEventListener('click', () => { if (!next.disabled) go(1); });
    } else {
      const form = step.querySelector('form');
      form.addEventListener('input', (e) => { const el = e.target; if (el.name === 'hp') return; a[el.name] = el.type === 'checkbox' ? el.checked : el.value; save(); el.removeAttribute('aria-invalid'); });
      form.addEventListener('focusout', (e) => {
        const el = e.target, rule = RULES[el.name];
        if (!rule || !el.value.trim()) return;
        const msg = rule(el.value); form.querySelector(`#ap-${el.name}-err`).textContent = msg;
        if (msg) el.setAttribute('aria-invalid', 'true'); else el.removeAttribute('aria-invalid');
      });
      form.addEventListener('submit', (e) => { e.preventDefault(); submit(form); });
    }
  }

  const RULES = {
    firstName: (v) => v.trim() ? '' : 'Please enter your first name',
    lastName: (v) => v.trim() ? '' : 'Please enter your last name',
    company: (v) => v.trim() ? '' : 'Please enter your company name',
    email: (v) => /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)*\.[a-z]{2,}$/i.test(v.trim()) ? '' : 'Please enter a valid email address',
    phone: (v) => /^(?:0|\+?44)\d{9,10}$/.test(v.replace(/[\s()-]/g, '')) ? '' : 'Please enter a UK phone number',
  };

  async function submit(form) {
    let first = null;
    for (const [n, rule] of Object.entries(RULES)) {
      const el = form.elements[n], msg = rule(el.value);
      form.querySelector(`#ap-${n}-err`).textContent = msg;
      if (msg) { el.setAttribute('aria-invalid', 'true'); first ||= el; } else el.removeAttribute('aria-invalid');
    }
    const c = form.elements.consent;
    form.querySelector('#ap-consent-err').textContent = c.checked ? '' : 'Please tick this box to continue';
    if (!c.checked) first ||= c;
    if (first) return first.focus();

    const btn = form.querySelector('button[type=submit]'), err = form.querySelector('.ap-formerr');
    btn.disabled = true; btn.firstChild.textContent = 'Sending… '; err.classList.remove('on');
    const payload = {
      form: FORM, areas: a.areas, regulator: a.regulator, coverage: a.coverage, funds: a.funds, sizes: a.sizes, fca: a.fca, volume: a.volume, delivery: a.delivery, start: a.start,
      firstName: a.firstName, lastName: a.lastName, company: a.company, role: a.role || '', email: (a.email || '').trim(), phone: a.phone,
      site: a.site || '', fcaRef: a.fcaRef || '', notes: a.notes || '', consent: true, consentText: CONSENT.replace(/<[^>]+>/g, ''),
      eventId: (crypto.randomUUID && crypto.randomUUID()) || String(Date.now()), fbc: window.llTrackIds?.fbc() || '', fbp: window.llTrackIds?.fbp() || '',
      hp: form.elements.hp.value, _ms: Date.now() - t0, page: location.href, referrer: document.referrer,
    };
    try {
      const r = await fetch('/api/partner', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!r.ok) throw new Error(r.status);
      done(payload);
    } catch {
      btn.disabled = false; btn.firstChild.textContent = 'Send application ';
      err.innerHTML = 'Sorry, something went wrong sending your application. Please try again, or email <a href="mailto:hello@loanleaf.co">hello@loanleaf.co</a>.';
      err.classList.add('on');
    }
  }

  function done(p) {
    T('SubmitApplication', { content_name: NAME }, { eventId: p.eventId, server: false });
    try { localStorage.removeItem(KEY); } catch {}
    bar.querySelectorAll('span').forEach((s) => s.classList.add('on')); count.textContent = 'Complete'; back.classList.remove('on');
    const rows = LEGAL ? [['Firm', p.company], ['Practice areas', (p.areas || []).join(', ')], ['Regulator', p.regulator], ['Leads per month', p.volume]]
      : [['Firm', p.company], ['Leads per month', p.volume], ['Finance types', (p.funds || []).join(', ')], ['Loan sizes', (p.sizes || []).join(', ')]];
    body.innerHTML = `<div class="ap-step on ap-done"><div class="ap-badge">${TICK}</div>
      <h2 class="ap-q" tabindex="-1">Thanks, ${esc(p.firstName)}. Application received.</h2>
      <dl class="ap-summary">${rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v || '–')}</dd></div>`).join('')}</dl>
      ${LEGAL ? '<ol class="ap-steps-next"><li>We review your application and criteria</li><li>We call you to agree volumes, delivery and pricing</li><li>You start receiving matched leads</li></ol>'
        : `<p class="ap-done-lead">Someone from our partnerships team will be in touch shortly.</p>
          <div class="ap-selfserve"><b>Rather get started now?</b><span>Set up your account on Loanleaf Platform in a few minutes. Choose a plan, set your lead criteria and start buying leads. We've filled in the details you just gave us.</span>
          <a class="button ap-selfserve-btn" href="https://platform.loanleaf.co/register?from=apply"><div>Sign up on the platform</div></a></div>`}</div>`;
    // Hand the answers to the self-serve platform (same site, so it can read them). Kept in this browser only.
    if (!LEGAL) try {
      localStorage.setItem('llp-prefill', JSON.stringify({ company: p.company, contactName: `${p.firstName} ${p.lastName}`.trim(), email: p.email, phone: p.phone, role: p.role, fca: p.fca, sizes: p.sizes, volume: p.volume, at: Date.now() }));
    } catch {}
    body.querySelector('.ap-q').focus();
  }

  back.addEventListener('click', () => go(-1));
  root.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' || e.target.closest('form') || e.target.matches('button')) return;
    const n = body.querySelector('[data-next]:not([disabled])');
    if (n) { e.preventDefault(); n.click(); }
  });
  show(0);
})();

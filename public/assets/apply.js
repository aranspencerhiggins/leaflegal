// Legal enquiry multi-step form. Answers live in `a`, saved to localStorage so a refresh keeps progress.
// Matter details are special category or criminal offence data: they go only to /api/enquiry, never to ad platforms.
(() => {
  const root = document.getElementById('ap');
  if (!root) return;
  const KEY = 'll-apply-v2';
  const I = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
  const ICON = {
    home: I('<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>'),
    globe: I('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>'),
    family: I('<circle cx="8" cy="7" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M2 21a6 6 0 0 1 12 0M14 21a4 4 0 0 1 8 0"/>'),
    invoice: I('<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M9 13h6M9 17h4"/>'),
    car: I('<path d="M5 17h14M3 17v-4l2-5h14l2 5v4"/><circle cx="7.5" cy="17.5" r="1.5"/><circle cx="16.5" cy="17.5" r="1.5"/>'),
    badge: I('<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>'),
    key: I('<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M17 6l3 3"/>'),
    other: I('<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.7M12 17h.01"/>'),
    person: I('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'),
    office: I('<path d="M3 21h18M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16"/><path d="M10 7h4M10 11h4M10 15h4"/>'),
    bolt: I('<path d="M13 2L3 14h9l-1 8 10-12h-9z"/>'),
    month: I('<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>'),
    clock: I('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
    look: I('<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>'),
  };
  const TICK = I('<path d="M5 12l5 5 9-10" stroke-width="3"/>');
  const ARROW = I('<path d="M5 12h14M13 6l6 6-6 6"/>');

  // Area labels must match the `form` labels in tools/areas_content.py (the build adds them to page links as ?area=).
  const AREA = {
    conv: 'Buying or selling a home', imm: 'Immigration', fam: 'Family law', debt: 'Recovering a business debt',
    motor: 'A motoring offence', lic: 'Licensing', lease: 'Extending a lease', unsure: 'Not sure yet',
  };
  const MATTERS = {
    [AREA.conv]: ['Buying a home', 'Selling a home', 'Buying and selling', 'Remortgaging', 'Transferring ownership', 'Something else'],
    [AREA.imm]: ['A visa application', 'A partner or family application', 'Settlement or citizenship', 'A sponsor licence (employers)', 'A refusal or appeal', 'Something else'],
    [AREA.fam]: ['Divorce or dissolution', 'Finances after a separation', 'Arrangements for children', 'Separating from a partner (not married)', 'A prenuptial agreement', 'Something else'],
    [AREA.debt]: ['Unpaid invoices', 'A letter before action', 'Starting a court claim', 'Enforcing a court judgment', 'A statutory demand', 'Something else'],
    [AREA.motor]: ['Speeding', 'Drink or drug driving', 'Using a phone while driving', 'Careless or dangerous driving', 'Facing a ban (totting up)', 'Something else'],
    [AREA.lic]: ['A new premises licence', 'Changing a premises licence', 'A personal licence', 'A licence review or objection', 'Taxi or private hire', 'Something else'],
    [AREA.lease]: ['Extending my flat lease', 'Buying the freehold with neighbours', 'Selling a flat with a short lease', 'Something else'],
  };
  // Matters under English and Welsh law only (immigration is UK-wide).
  const EW_ONLY = [AREA.conv, AREA.fam, AREA.debt, AREA.motor, AREA.lic, AREA.lease];
  const isBusiness = (a) => a.area === AREA.debt || a.audience === 'A business';

  const STEPS = [
    { id: 'area', q: 'What do you need help with?', type: 'cards', opts: [
      ['home', AREA.conv, 'Conveyancing'],
      ['family', AREA.fam, 'Divorce, finances, children'],
      ['globe', AREA.imm, 'Visas, settlement, sponsor licences'],
      ['car', AREA.motor, 'Speeding, drink driving, bans'],
      ['invoice', AREA.debt, 'For businesses owed money'],
      ['badge', AREA.lic, 'Premises, personal, taxi'],
      ['key', AREA.lease, 'Flats and freeholds'],
      ['other', AREA.unsure, 'Tell us what is happening'],
    ]},
    { id: 'matter', q: 'Which of these best describes it?', type: 'chips', opts: (a) => MATTERS[a.area] || [], skipIf: (a) => !MATTERS[a.area] },
    { id: 'debtor', q: 'Who owes the money?', type: 'chips', opts: ['Another business', 'A private individual'], skipIf: (a) => a.area !== AREA.debt },
    { id: 'audience', q: 'Is this for you or for a business?', type: 'cards', one: true, skipIf: (a) => a.area === AREA.debt, opts: [
      ['person', 'Me personally', 'Or someone in my family'],
      ['office', 'A business', 'A company, partnership or sole trader'],
    ]},
    { id: 'urgency', q: 'How soon do you need help?', type: 'cards', one: true, opts: [
      ['bolt', 'Urgently', 'I have a court date or deadline in the next 2 weeks'],
      ['month', 'Within a month', ''],
      ['clock', 'In the next few months', ''],
      ['look', 'Just looking into it', 'No deadline yet'],
    ]},
    { id: 'postcode', q: 'What’s your postcode?', type: 'text', placeholder: 'e.g. SW1A 1AA', autocomplete: 'postal-code', error: 'Please enter a UK postcode',
      note: 'So we can find a firm that covers your area', check: (v) => (POSTCODE.test(v.trim()) ? '' : 'Please enter a full UK postcode') },
    { id: 'pay', q: 'Are you able to pay privately for legal help?', type: 'chips', skipIf: isBusiness,
      opts: ['Yes', 'Yes, if the cost is right', 'No, I’m looking for legal aid'],
      tip: ['Why we ask', 'The firms we work with charge for their work. They will explain their fees before you agree to anything.'] },
    { id: 'business', q: 'What’s the name of the business?', type: 'text', placeholder: 'e.g. Acme Trading Ltd', autocomplete: 'organization', error: 'Please enter the business name', skipIf: (a) => !isBusiness(a) },
    { id: 'summary', q: 'Anything the firm should know?', type: 'summary', optional: (a) => a.area !== AREA.unsure },
    { id: 'details', q: 'Where should the firm contact you?', type: 'details' },
  ];
  const POSTCODE = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i;
  // Scottish and Northern Irish postcode areas. TD is left out because part of it (Berwick) is in England.
  const NOT_EW = /^(AB|DD|DG|EH|FK|G|HS|IV|KA|KW|KY|ML|PA|PH|ZE|BT)\d/i;

  let a = {};
  try { a = JSON.parse(localStorage.getItem(KEY)) || {}; } catch {}
  // Links like /apply?area=Family%20law preselect the area.
  const qp = new URLSearchParams(location.search).get('area');
  if (qp && STEPS[0].opts.some(([, t]) => t === qp)) a.area = qp;
  // Meta click ID: if the visitor arrived from a Facebook/Instagram ad (?fbclid=), keep it for this visit so the
  // Lead event can be attributed. Only sent to Meta if they accept marketing cookies.
  const FBC_KEY = 'll-fbc';
  try {
    const fbclid = new URLSearchParams(location.search).get('fbclid');
    if (fbclid) sessionStorage.setItem(FBC_KEY, `fb.1.${Date.now()}.${fbclid}`);
  } catch {}
  const getFbc = () => { try { return sessionStorage.getItem(FBC_KEY) || ''; } catch { return ''; } };
  const getFbp = () => (document.cookie.match(/(?:^|; )_fbp=([^;]+)/) || [])[1] || '';
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(a)); } catch {} };
  const t0 = Date.now();
  const visible = () => STEPS.filter((s) => !s.skipIf?.(a));
  const optsOf = (s) => (typeof s.opts === 'function' ? s.opts(a) : s.opts);
  let idx = 0;

  // Funnel tracking (assets/track.js). Step names only: never the answers.
  const T = (...x) => (window.llTrack ? window.llTrack(...x) : (window.__llq = window.__llq || []).push(x));
  const seen = new Set(); let started = false;
  const body = root.querySelector('.ap-body');
  const bar = root.querySelector('.ap-bar');
  const count = root.querySelector('.ap-count');
  const back = root.querySelector('.ap-back');

  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const nextBtn = (label = 'Continue') => `<div class="ap-actions"><button type="button" class="button ap-next" data-next>${label} ${ARROW}</button></div>`;
  const SUMMARY_MAX = 500;

  // Agreement: two separate, unticked boxes. The exact wording is sent with the enquiry as the consent record.
  const CONSENT_VERSION = '2026-11-21';
  const CONSENTS = [
    ['consentTerms', 'I agree to the Leaflegal <a href="/terms-conditions" target="_blank">Terms</a> and <a href="/privacy-policy" target="_blank">Privacy Policy</a>.'],
    ['consentShare', 'I agree to Leaflegal sharing my details and enquiry with one regulated law firm, who may contact me by phone, email or text about it.'],
  ];
  const plain = (s) => s.replace(/<[^>]+>/g, '');

  function render(s) {
    let h = `<h2 class="ap-q" tabindex="-1">${s.q}</h2>`;
    if (s.type === 'text') {
      h += `<div class="ap-field ap-text-step"><label class="ap-sr" for="ap-${s.id}">${s.q}</label><input id="ap-${s.id}" name="${s.id}" type="text" autocomplete="${s.autocomplete || 'off'}" placeholder="${esc(s.placeholder || '')}" value="${esc(a[s.id] || '')}"><span class="ap-err" id="ap-${s.id}-err"></span>${s.note ? `<p class="ap-note">${s.note}</p>` : ''}</div>${nextBtn()}`;
    } else if (s.type === 'summary') {
      const opt = s.optional(a);
      h += `<div class="ap-field ap-text-step"><label class="ap-sr" for="ap-summary">${s.q}</label><textarea id="ap-summary" name="summary" rows="4" maxlength="${SUMMARY_MAX}" placeholder="${opt ? 'Optional. ' : ''}A sentence or two is plenty">${esc(a.summary || '')}</textarea><span class="ap-err" id="ap-summary-err"></span>
        <p class="ap-note">Keep it short. The firm will ask for the full details when they call, so please leave out anything you would rather say in person.</p></div>${nextBtn(opt && !(a.summary || '').trim() ? 'Skip' : 'Continue')}`;
    } else if (s.type === 'cards') {
      const opts = optsOf(s);
      h += `<div class="ap-opts${s.one ? ' one' : ''}" role="radiogroup" aria-label="${esc(s.q)}">${opts.map(([ic, t, d]) =>
        `<button type="button" class="ap-opt${a[s.id] === t ? ' sel' : ''}" role="radio" aria-checked="${a[s.id] === t}" data-v="${esc(t)}"><span class="ap-ico">${ICON[ic]}</span><span><b>${t}</b>${d ? `<small>${d}</small>` : ''}</span><span class="ap-tick">${TICK}</span></button>`).join('')}</div>${opts.some(([, t]) => t === a[s.id]) ? nextBtn() : ''}`;
      if (s.id === 'area') h += `<p class="ap-quick"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2M10 2h4M12 2v3"/></svg>Takes about two minutes</p>`;
    } else if (s.type === 'chips') {
      const opts = optsOf(s);
      h += `<div class="ap-opts one" role="radiogroup" aria-label="${esc(s.q)}">${opts.map((t) =>
        `<button type="button" class="ap-opt${a[s.id] === t ? ' sel' : ''}" role="radio" aria-checked="${a[s.id] === t}" data-v="${esc(t)}"><span><b>${t}</b></span><span class="ap-tick">${TICK}</span></button>`).join('')}</div>${s.tip ? `<div class="ap-tip">${I('<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>')}<p><b>${s.tip[0]}</b>${s.tip[1]}</p></div>` : ''}${opts.includes(a[s.id]) ? nextBtn() : ''}`;
    } else {
      const f = (n, l, type, ac, full) => `<div class="ap-field${full ? ' full' : ''}"><label for="ap-${n}">${l}</label><input id="ap-${n}" name="${n}" type="${type}" autocomplete="${ac}" value="${esc(a[n] || '')}" required><span class="ap-err" id="ap-${n}-err"></span></div>`;
      h += `<form novalidate><div class="ap-grid">
        ${f('fullName', 'Full name', 'text', 'name', true)}
        ${f('email', 'Email address', 'email', 'email')}${f('phone', 'Mobile number', 'tel', 'tel')}
        </div>
        <div class="ap-consents">${CONSENTS.map(([n, html]) => `<label class="ap-check"><input type="checkbox" name="${n}"><span>${html}</span></label><span class="ap-err" id="ap-${n}-err"></span>`).join('')}</div>
        <div class="ap-hp" aria-hidden="true"><label>Website<input name="website" tabindex="-1" autocomplete="off"></label></div>
        <div class="ap-ts" id="ap-ts"></div>
        <div class="ap-actions ap-send"><button type="submit" class="button ap-next">Get matched ${ARROW}</button></div>
        <p class="ap-agree">Free to use, with no obligation. Leaflegal is not a law firm and does not give legal advice.</p>
        <div class="ap-formerr" role="alert"></div></form>`;
    }
    return h;
  }

  function show(dir = 1) {
    const steps = visible();
    idx = Math.max(0, Math.min(idx, steps.length - 1));
    const s = steps[idx];
    body.innerHTML = `<div class="ap-step on${dir < 0 ? ' back' : ''}${dir === 0 ? ' still' : ''}">${render(s)}</div>`;
    if (!seen.has(s.id)) { seen.add(s.id); T(seen.size === 1 ? 'ViewContent' : 'FormStep', seen.size === 1 ? { form: 'legal', content_name: 'Legal enquiry form' } : { form: 'legal', step: idx + 1, step_name: s.id }); }
    bar.innerHTML = `<i class="ap-fill" style="width:${Math.round(((idx + 1) / steps.length) * 100)}%"></i>`;
    count.textContent = '';
    back.classList.toggle('on', idx > 0);
    root.closest('.ap-lp')?.classList.toggle('ap-going', idx > 0); // phones: headline and ticks hide once they're past the first question (CSS)
    wire(s);
    const focus = body.querySelector('.ap-q');
    if (dir !== 0) focus.focus({ preventScroll: true });
    if (dir !== 0 && root.getBoundingClientRect().top < 0) root.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // Answers we can't help with: stop with a short explanation (and somewhere to go) instead of advancing.
  const LEGAL_AID = 'Firms we work with charge privately. You can <a href="https://www.gov.uk/check-legal-aid" target="_blank" rel="noopener">check if you can get legal aid on GOV.UK</a>, or get free help from <a href="https://www.citizensadvice.org.uk" target="_blank" rel="noopener">Citizens Advice</a>.';
  const stopReason = (s) => {
    if (s.id === 'debtor' && a.debtor === 'A private individual') return 'We can only help businesses recover money owed by other businesses. <a href="https://www.citizensadvice.org.uk" target="_blank" rel="noopener">Citizens Advice</a> has free guidance on other debts.';
    if (s.id === 'postcode' && EW_ONLY.includes(a.area) && NOT_EW.test(a.postcode.trim())) return 'For this area of law we can only help with matters in England and Wales at the moment. The <a href="https://www.lawscot.org.uk/find-a-solicitor/" target="_blank" rel="noopener">Law Society of Scotland</a> and the <a href="https://www.lawsoc-ni.org/solicitors-directory" target="_blank" rel="noopener">Law Society of Northern Ireland</a> can help you find a solicitor.';
    if (s.id === 'pay' && /legal aid/.test(a.pay)) return LEGAL_AID;
    return '';
  };
  function stop(reason) {
    save();
    count.textContent = ''; back.classList.add('on');
    body.innerHTML = `<div class="ap-step on ap-done"><div class="ap-badge ap-badge-no">${I('<path d="M18 6L6 18M6 6l12 12" stroke-width="3"/>')}</div>
      <h2 class="ap-q" tabindex="-1">Sorry, we can’t help with this one</h2><p class="ap-stop">${reason}</p>
      <div class="ap-actions"><a href="/" class="button ap-next">Back to home</a></div></div>`;
    body.querySelector('.ap-q').focus();
  }
  const go = (d) => {
    if (d > 0 && !started) { started = true; T('FormStart', { form: 'legal' }); }
    if (d > 0) { const s = visible()[idx], r = stopReason(s); if (r) { T('FormDisqualified', { form: 'legal', step_name: s.id }); return stop(r); } }
    idx += d; save();
    show(d);
  };

  function wire(s) {
    const step = body.firstElementChild;
    if (s.type === 'text' || s.type === 'summary') {
      const inp = step.querySelector('input, textarea'), err = step.querySelector('.ap-err'), btn = step.querySelector('[data-next]');
      inp.addEventListener('input', () => {
        a[s.id] = inp.value; save(); err.textContent = ''; inp.removeAttribute('aria-invalid');
        if (s.type === 'summary' && s.optional(a)) btn.firstChild.textContent = inp.value.trim() ? 'Continue ' : 'Skip ';
      });
      const next = () => {
        const v = inp.value.trim();
        const msg = !v ? (s.type === 'summary' ? (s.optional(a) ? '' : 'Please tell us briefly what you need help with') : s.error) : (s.check ? s.check(v) : '');
        if (msg) { err.textContent = msg; inp.setAttribute('aria-invalid', 'true'); return inp.focus(); }
        a[s.id] = s.id === 'postcode' ? v.toUpperCase().replace(/\s+/g, '').replace(/(\d[A-Z]{2})$/, ' $1') : v;
        go(1);
      };
      btn.addEventListener('click', next);
      if (s.type === 'text') inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); next(); } });
      setTimeout(() => inp.focus({ preventScroll: true }), 50);
    } else if (s.type === 'cards' || s.type === 'chips') {
      step.querySelectorAll('.ap-opt').forEach((b) => b.addEventListener('click', () => {
        if (s.id === 'area' && a.area !== b.dataset.v) { delete a.matter; delete a.debtor; } // a new area means new matter questions
        a[s.id] = b.dataset.v;
        step.querySelectorAll('.ap-opt').forEach((o) => { o.classList.toggle('sel', o === b); o.setAttribute('aria-checked', o === b); });
        setTimeout(() => go(1), 260); // brief pause so the tick registers before advancing
      }));
      step.querySelector('[data-next]')?.addEventListener('click', () => go(1)); // answer already chosen (going back or preselected)
    } else {
      const form = step.querySelector('form');
      form.querySelectorAll('input[type=checkbox]').forEach((c) => { c.checked = false; }); // consent is never carried over or pre-ticked
      form.addEventListener('input', (e) => {
        const el = e.target;
        if (el.type === 'checkbox') { form.querySelector(`#ap-${el.name}-err`).textContent = ''; return; }
        a[el.name] = el.value; if (el.name !== 'website') save(); el.removeAttribute('aria-invalid');
      });
      form.addEventListener('submit', (e) => { e.preventDefault(); submit(form); });
      form.addEventListener('focusout', (e) => {
        const el = e.target, rule = RULES[el.name];
        if (!rule || !el.value.trim()) return;
        const sg = el.name === 'email' && suggest(el.value);
        const msg = rule(el.value) || (sg ? fixHTML(sg) : '');
        if (sg) nudged = el.value;
        form.querySelector(`#ap-${el.name}-err`).innerHTML = msg;
        if (msg) el.setAttribute('aria-invalid', 'true'); else el.removeAttribute('aria-invalid');
      });
      form.addEventListener('click', (e) => {
        const fix = e.target.closest('[data-fix]'); if (!fix) return;
        const el = form.elements.email; el.value = a.email = fix.dataset.fix; save();
        form.querySelector('#ap-email-err').innerHTML = ''; el.removeAttribute('aria-invalid');
      });
    }
  }

  // UK mobiles only: 07xxx xxxxxx, +44 7xxx xxxxxx or 0044 7xxx xxxxxx. Returns +447… or ''.
  const mobile = (v) => {
    let d = v.replace(/[^\d+]/g, '').replace(/^\+/, '00');
    if (d.startsWith('0044')) d = '0' + d.slice(4); else if (d.startsWith('44')) d = '0' + d.slice(2);
    return /^07\d{9}$/.test(d) ? '+44' + d.slice(1) : '';
  };
  // Catch common email domain typos (gmial.com, hotmial.co.uk, gmail.con…).
  const DOMAINS = ['gmail.com', 'googlemail.com', 'hotmail.com', 'hotmail.co.uk', 'outlook.com', 'live.co.uk', 'yahoo.com', 'yahoo.co.uk', 'icloud.com', 'me.com', 'aol.com', 'btinternet.com', 'sky.com', 'virginmedia.com', 'protonmail.com'];
  const lev = (s, t) => { const d = [...Array(t.length + 1).keys()]; for (let i = 1; i <= s.length; i++) { let p = d[0]; d[0] = i; for (let k = 1; k <= t.length; k++) { const q = d[k]; d[k] = Math.min(d[k] + 1, d[k - 1] + 1, p + (s[i - 1] === t[k - 1] ? 0 : 1)); p = q; } } return d[t.length]; };
  const suggest = (v) => {
    const [u, dom] = v.trim().toLowerCase().split('@');
    if (!u || !dom || DOMAINS.includes(dom)) return '';
    const best = DOMAINS.map((x) => [lev(dom, x), x]).sort((p, q) => p[0] - q[0])[0];
    return best[0] <= 2 ? `${u}@${best[1]}` : '';
  };
  const fixHTML = (s) => `Did you mean <button type="button" class="ap-fix" data-fix="${esc(s)}">${esc(s)}</button>?`;
  let nudged = ''; // email value we've already suggested a fix for; a second submit goes through
  const confirmed = { phone: '', email: '' }; // values the person says are right after our live check queried them
  const RULES = {
    fullName: (v) => v.trim().split(/\s+/).length >= 2 ? '' : 'Please enter your first and last name',
    email: (v) => /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)*\.[a-z]{2,}$/i.test(v.trim()) ? '' : 'Please enter a valid email address',
    phone: (v) => mobile(v) ? '' : 'Please enter a UK mobile number, e.g. 07700 900123',
  };
  const CONSENT_ERR = { consentTerms: 'Please agree to the Terms and Privacy Policy', consentShare: 'Please agree so we can pass your enquiry to a law firm' };

  // Cloudflare Turnstile (bot check). Off until the site key is set on the server (/api/platform?action=config).
  const ts = { key: undefined, id: null, box: null, wait: null };
  const humanToken = async (box) => {
    if (ts.key === undefined) ts.key = await fetch('/api/platform?action=config').then((r) => r.json()).then((d) => d.turnstile || null).catch(() => null);
    if (!ts.key || !box) return '';
    if (!window.turnstile) await new Promise((ok) => { const sc = Object.assign(document.createElement('script'), { src: 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit', async: true, onload: ok, onerror: ok }); document.head.appendChild(sc); });
    if (!window.turnstile) return '';
    return new Promise((done) => {
      const t = setTimeout(() => done(''), 15000);
      const fin = (v) => { clearTimeout(t); done(v || ''); };
      ts.wait = fin;
      if (ts.id !== null && ts.box === box && box.isConnected) { window.turnstile.reset(ts.id); window.turnstile.execute(ts.id); return; }
      if (ts.id !== null) try { window.turnstile.remove(ts.id); } catch {}
      ts.box = box;
      ts.id = window.turnstile.render(box, { sitekey: ts.key, appearance: 'interaction-only', execution: 'execute', callback: (v) => ts.wait?.(v), 'error-callback': () => ts.wait?.(''), 'expired-callback': () => {} });
      window.turnstile.execute(ts.id);
    });
  };

  async function submit(form) {
    let first = null;
    for (const [n, rule] of Object.entries(RULES)) {
      const el = form.elements[n], msg = rule(el.value);
      form.querySelector(`#ap-${n}-err`).innerHTML = msg;
      if (msg) el.setAttribute('aria-invalid', 'true'); else el.removeAttribute('aria-invalid');
      if (msg && !first) first = el;
    }
    for (const [n] of CONSENTS) {
      const el = form.elements[n], msg = el.checked ? '' : CONSENT_ERR[n];
      form.querySelector(`#ap-${n}-err`).textContent = msg;
      if (msg && !first) first = el;
    }
    const sg = !first && suggest(form.elements.email.value);
    if (sg && nudged !== form.elements.email.value) { nudged = form.elements.email.value; form.querySelector('#ap-email-err').innerHTML = fixHTML(sg); first = form.elements.email; }
    if (first) return first.focus();

    const btn = form.querySelector('button[type=submit]'), err = form.querySelector('.ap-formerr');
    const reset = () => { btn.disabled = false; btn.firstChild.textContent = 'Get matched '; };
    btn.disabled = true; btn.firstChild.textContent = 'Sending… '; err.classList.remove('on');
    const biz = isBusiness(a);
    const payload = {
      area: a.area, matter: MATTERS[a.area] ? a.matter : null, audience: biz ? 'business' : 'individual',
      debtor: a.area === AREA.debt ? a.debtor : null, urgency: a.urgency, postcode: a.postcode,
      privatePay: biz ? null : a.pay, summary: (a.summary || '').trim().slice(0, SUMMARY_MAX),
      fullName: a.fullName.trim().replace(/\s+/g, ' '), firstName: a.fullName.trim().split(/\s+/)[0], lastName: a.fullName.trim().split(/\s+/).slice(1).join(' '),
      business: biz ? (a.business || '').trim() : '', email: a.email.trim(), phone: mobile(a.phone),
      phoneConfirmed: !!confirmed.phone && confirmed.phone === mobile(a.phone), emailConfirmed: !!confirmed.email && confirmed.email === a.email.trim(),
      consentTerms: form.elements.consentTerms.checked, consentShare: form.elements.consentShare.checked,
      consentVersion: CONSENT_VERSION, consentAt: new Date().toISOString(), consentText: CONSENTS.map(([, t]) => plain(t)).join(' | '),
      marketing: !!window.leaflegalCookies?.get()?.marketing, fbc: getFbc(), fbp: getFbp(),
      eventId: (crypto.randomUUID && crypto.randomUUID()) || String(Date.now()),
      website: form.elements.website.value, _ms: Date.now() - t0,
      page: location.href, referrer: document.referrer, utm: Object.fromEntries(new URLSearchParams(location.search)), first: (() => { try { return JSON.parse(sessionStorage.getItem('ll_src') || 'null'); } catch { return null; } })(),
      variant: root.dataset.variant || undefined,
    };
    try {
      payload.turnstile = await humanToken(form.querySelector('#ap-ts'));
      const res = await fetch('/api/enquiry', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (res.status === 400) {
        const d = await res.json().catch(() => ({}));
        if (d.field && form.elements[d.field]) {
          reset();
          const box = form.querySelector(`#ap-${d.field}-err`), el = form.elements[d.field];
          // Live check queried it: offer the suggested fix and/or let them confirm it's right and carry on.
          box.innerHTML = esc(d.error) + (d.suggest ? ' ' + fixHTML(d.suggest) : '')
            + (d.confirm ? ` <button type="button" class="ap-fix" data-ok>It's correct, continue</button>` : '');
          box.querySelector('[data-ok]')?.addEventListener('click', () => {
            confirmed[d.field] = d.field === 'phone' ? mobile(el.value) : el.value.trim();
            box.innerHTML = ''; el.removeAttribute('aria-invalid'); form.requestSubmit();
          });
          el.setAttribute('aria-invalid', 'true'); return el.focus();
        }
        if (d.error) { reset(); err.textContent = d.error; err.classList.add('on'); return; }
      }
      if (!res.ok) throw new Error(res.status);
      const r = await res.json().catch(() => ({}));
      done(payload, r.meta);
    } catch {
      reset();
      err.innerHTML = 'Sorry, something went wrong sending your details. Please try again, or email <a href="mailto:hello@leaflegal.co">hello@leaflegal.co</a>.';
      err.classList.add('on');
    }
  }

  // The Lead event carries no area or matter details: see the privacy policy.
  function done(p, meta = {}) {
    if (meta.lead !== false) T('Lead', { content_name: 'Enquiry' }, { eventId: p.eventId, server: false });
    try { localStorage.removeItem(KEY); } catch {}
    count.textContent = 'Complete'; back.classList.remove('on');
    const rows = [['Help with', p.area], ['Matter', p.matter], ['Urgency', p.urgency], ['Postcode', p.postcode]].filter(([, v]) => v);
    body.innerHTML = `<div class="ap-step on ap-done">
      <div class="ap-badge">${TICK}</div>
      <h2 class="ap-q" tabindex="-1">Thanks, ${esc(p.firstName)}. We’ve got your enquiry.</h2>
      <p class="ap-done-lead">We’ll look for one regulated law firm that handles this kind of matter in your area. We’ve sent a confirmation to your email.</p>
      <dl class="ap-summary">${rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
      <ol class="ap-steps-next"><li>We review your enquiry and choose a specialist firm</li><li>The firm contacts you, usually by phone, to see if they can help</li><li>They explain their fees before you agree to anything</li></ol></div>`;
    body.querySelector('.ap-q').focus();
  }

  back.addEventListener('click', () => (body.querySelector('.ap-badge-no') ? show(0) : go(-1)));
  // Homepage area cards: preselect that area, then the link scrolls up to the form.
  window.addEventListener('click', (e) => {
    const card = e.target.closest('[data-area]');
    if (!card) return;
    if (a.area !== card.dataset.area) { delete a.matter; delete a.debtor; }
    a.area = card.dataset.area; save();
    if (visible()[idx]?.id === 'area') show(0);
  }, true); // capture: runs before the nav's in-page scroll handler
  root.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' || e.target.closest('form') || e.target.matches('button, textarea')) return;
    const n = body.querySelector('[data-next]');
    if (n) { e.preventDefault(); n.click(); }
  });
  show(0);
})();

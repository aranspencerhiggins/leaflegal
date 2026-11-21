// Business loan multi-step form. Answers live in `a`, saved to localStorage so a refresh keeps progress.
(() => {
  const root = document.getElementById('ap');
  if (!root) return;
  const KEY = 'll-apply-v1';
  const AMOUNTS = [5e3,1e4,15e3,2e4,25e3,3e4,4e4,5e4,6e4,75e3,1e5,125e3,15e4,2e5,25e4,3e5,4e5,5e5,75e4,1e6,15e5,2e6];
  const AMOUNT_DEFAULT = AMOUNTS.includes(+root.dataset.amount) ? AMOUNTS.indexOf(+root.dataset.amount) : 10; // £100k, or the page's data-amount (/business-finance: £250k)
  const gbp = (n) => '£' + n.toLocaleString('en-GB') + (n >= 2e6 ? '+' : '');
  const I = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
  const ICON = {
    growth: I('<path d="M3 17l6-6 4 4 8-8"/><path d="M14 7h7v7"/>'),
    cash: I('<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 12h.01M18 12h.01"/>'),
    equip: I('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'),
    stock: I('<path d="M21 8l-9-5-9 5v8l9 5 9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/>'),
    property: I('<path d="M3 21h18M5 21V7l7-4 7 4v14"/><path d="M9 21v-6h6v6M9 10h.01M15 10h.01"/>'),
    refi: I('<path d="M21 12a9 9 0 0 1-15.5 6.3L3 16"/><path d="M3 12a9 9 0 0 1 15.5-6.3L21 8"/><path d="M21 3v5h-5M3 21v-5h5"/>'),
    tax: I('<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M9 13h6M9 17h4"/>'),
    other: I('<circle cx="12" cy="12" r="9"/><path d="M8 12h.01M12 12h.01M16 12h.01"/>'),
    bolt: I('<path d="M13 2L3 14h9l-1 8 10-12h-9z"/>'),
    week: I('<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>'),
    month: I('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
    look: I('<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>'),
    ltd: I('<path d="M3 21h18M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16"/><path d="M10 7h4M10 11h4M10 15h4"/>'),
    sole: I('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'),
    partner: I('<circle cx="9" cy="8" r="3.5"/><circle cx="17" cy="9" r="2.5"/><path d="M2 21a7 7 0 0 1 14 0M16 14.5a5 5 0 0 1 6 6.5"/>'),
    seed: I('<path d="M12 21V11"/><path d="M12 11c0-4 3-7 8-7 0 5-3 7-8 7zM12 14c0-3-2.5-5.5-7-5.5 0 4 2.5 5.5 7 5.5z"/>'),
  };
  const TICK = I('<path d="M5 12l5 5 9-10" stroke-width="3"/>');
  const ARROW = I('<path d="M5 12h14M13 6l6 6-6 6"/>');


  // Legal company name: limited companies end in Ltd / Limited / PLC (Welsh Cyf / Cyfyngedig), LLPs in LLP.
  const SUFFIX = {
    'Limited company': { re: /\b(ltd\.?|limited|plc|p\.l\.c\.?|cyf\.?|cyfyngedig|ccc)\s*$/i, add: 'Ltd', words: '“Ltd” or “Limited”' },
    'Limited liability partnership (LLP)': { re: /\b(llp|l\.l\.p\.?|limited liability partnership|pac|partneriaeth atebolrwydd cyfyngedig)\s*$/i, add: 'LLP', words: '“LLP”' },
  };
  const legalNameIssue = (v) => {
    const rule = SUFFIX[a.structure];
    // Accept any registered-company ending (Ltd, Limited, PLC or LLP) whichever structure they picked: people often mix up Ltd and LLP.
    if (!rule || a.suffixExempt || Object.values(SUFFIX).some((r) => r.re.test(v.trim()))) return null;
    // swap a wrong suffix (e.g. "Ltd" on an LLP) rather than stacking a second one
    const base = v.trim().replace(/[\s.,]+$/, '').replace(/\s+(ltd\.?|limited|plc|llp|l\.l\.p\.?|limited liability partnership)$/i, '');
    return { fix: `${base} ${rule.add}`, words: rule.words };
  };

  const STEPS = [
    { id: 'amount', q: 'How much would you like to borrow?', type: 'amount' },
    { id: 'purpose', q: 'What is the business loan for?', type: 'cards', opts: [
      ['growth', 'Growth and expansion', 'Hiring, new sites, marketing'],
      ['cash', 'Cash flow', 'Working capital, bridging a gap'],
      ['equip', 'Equipment or vehicles', 'Machinery, tech, fleet'],
      ['stock', 'Stock and inventory', 'Seasonal or bulk buying'],
      ['property', 'Commercial property', 'Buy, build or refurbish'],
      ['refi', 'Refinance existing debt', 'Consolidate or lower repayments'],
      ['tax', 'Tax or VAT bill', 'Spread the cost over time'],
      ['other', 'Something else', "Tell us on the next call"],
    ]},
    { id: 'timeline', q: 'How soon do you need the business loan?', type: 'cards', one: true, opts: [
      ['bolt', 'As soon as possible', 'Within a few days'],
      ['week', 'Within 2 weeks', ''],
      ['month', 'Within a month', ''],
      ['look', 'Just exploring options', 'No rush, comparing what is available'],
    ]},
    { id: 'structure', q: 'How is your business set up?', type: 'cards', one: true, opts: [
      ['ltd', 'Limited company', 'Registered with Companies House'],
      ['sole', 'Sole trader', 'Self-employed, trading in your own name'],
      ['partner', 'Limited liability partnership (LLP)', 'Registered with Companies House'],
      ['partner', 'Partnership', 'Not registered as an LLP'],
      ['seed', 'Not trading yet', 'Start-up or pre-launch'],
    ]},
    { id: 'turnover', q: "What's your annual revenue?", type: 'chips',
      opts: ['Under £50k', '£50k to £100k', '£100k to £250k', '£250k to £500k', '£500k to £1m', '£1m to £5m', '£5m+'] },
    // Companies House search; "enter it manually" (or the search being down) falls back to a plain text box.
    { id: 'business', q: 'What’s your company name?', type: 'company', placeholder: 'e.g. Acme Trading Ltd', autocomplete: 'organization', error: 'Please enter your company name',
      note: '* Must be your full legal company name, as registered at Companies House' },
    { id: 'director', q: 'Which of these is you?', type: 'director', skipIf: (a) => !a.companyNumber },
    // Skipped when Companies House gave us the incorporation date (see pickCompany).
    { id: 'trading', q: 'How long has the business been trading?', type: 'chips', skipIf: (a) => !!(a.companyNumber && a.tradingFromCH),
      opts: ['Under 6 months', '6 to 12 months', '1 to 2 years', '2 to 5 years', '5+ years'] },
    { id: 'property', q: 'Are you a homeowner or a tenant?', type: 'chips',
      opts: ['Homeowner', 'Tenant'], tip: ['Why we ask', 'Lenders tend to ask this, as some have more options for homeowners. It helps us find the right fit.'] },
    { id: 'credit', q: 'Any missed payments, defaults or CCJs in the last 6 years?', type: 'chips',
      opts: ['No', 'Yes', 'Not sure'] },
    { id: 'debt', q: 'Does the business have any existing loans or finance?', type: 'chips',
      opts: ['No', 'Yes'] },
    { id: 'debtLeft', q: 'Roughly how much is left to repay?', type: 'chips', skipIf: (a) => a.debt !== 'Yes',
      opts: ['Under £10k', '£10k to £50k', '£50k to £100k', '£100k to £250k', '£250k+'] },
    { id: 'debtMonthly', q: 'What are the total monthly repayments?', type: 'chips', skipIf: (a) => a.debt !== 'Yes',
      opts: ['Under £500', '£500 to £1k', '£1k to £2.5k', '£2.5k to £5k', '£5k+'] },
    { id: 'details', q: 'Good news, there are options for your business', type: 'details' },
  ];

  let a = {};
  try { a = JSON.parse(localStorage.getItem(KEY)) || {}; } catch {}
  delete a.companyManual; // manual company entry is gone: only Companies House companies can enquire
  // Links like /apply?purpose=Cash%20flow preselect the purpose step.
  const qp = new URLSearchParams(location.search).get('purpose');
  if (qp && STEPS.find((s) => s.id === 'purpose').opts.some(([, t]) => t === qp)) a.purpose = qp;
  // ...and /apply?amount=150000 (from the loan calculator) preselects the nearest amount.
  const qa = +new URLSearchParams(location.search).get('amount');
  if (qa > 0) { a.amountIdx = AMOUNTS.reduce((b, x, i) => (Math.abs(x - qa) < Math.abs(AMOUNTS[b] - qa) ? i : b), 0); a.amount = gbp(AMOUNTS[a.amountIdx]); }
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
  let idx = 0;

  // Funnel tracking (assets/track.js). Queued if track.js hasn't loaded yet.
  const T = (...x) => (window.llTrack ? window.llTrack(...x) : (window.__llq = window.__llq || []).push(x));
  const seen = new Set(); let started = false, found = false;
  const body = root.querySelector('.ap-body');
  const bar = root.querySelector('.ap-bar');
  const count = root.querySelector('.ap-count');
  const back = root.querySelector('.ap-back');

  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const nextBtn = (label = 'Continue') => `<div class="ap-actions"><button type="button" class="button ap-next" data-next>${label} ${ARROW}</button></div>`;

  const asText = (s) => (s.type === 'company' && a.companyManual ? { ...s, type: 'text' } : s);
  const STATUS = { active: 'Active', dissolved: 'Dissolved', liquidation: 'In liquidation', administration: 'In administration', receivership: 'In receivership', 'voluntary-arrangement': 'Voluntary arrangement', 'converted-closed': 'Closed', 'insolvency-proceedings': 'Insolvency proceedings', open: 'Open', closed: 'Closed', registered: 'Registered', removed: 'Removed' };
  function render(s) {
    s = asText(s);
    let h = `<h2 class="ap-q" tabindex="-1">${s.q}</h2>`;
    if (s.type === 'company') {
      return h + `<div class="ap-field ap-text-step ap-co"><label class="ap-sr" for="ap-co">Search for your company</label>
        <input id="ap-co" type="search" autocomplete="off" placeholder="Start typing your company name" value="${esc(a.business || '')}">
        <span class="ap-err" id="ap-business-err"></span><div class="ap-opts one ap-co-list" role="radiogroup" aria-label="Matching companies" aria-live="polite"></div>
        <p class="ap-note"><button type="button" class="ap-link" data-manual>My business isn’t registered at Companies House</button></p></div>${a.companyNumber ? nextBtn() : ''}`;
    }
    if (s.type === 'director') {
      return h + `<p class="ap-sub">${esc(a.business || '')}</p><div class="ap-opts one ap-dir" role="radiogroup" aria-label="${esc(s.q)}"><p class="ap-note">Loading directors…</p></div>
        <div class="ap-field ap-text-step ap-dir-manual" hidden><label for="ap-dirname">Your full name</label><input id="ap-dirname" type="text" autocomplete="name" value="${esc(a.directorListed ? '' : a.fullName || '')}"><span class="ap-err" id="ap-dirname-err"></span>
        <p class="ap-note">You can still continue if you’re not listed, for example if you’re a shareholder or manager.</p>${nextBtn()}</div>`;
    }
    if (s.type === 'amount') {
      const i = a.amountIdx ?? AMOUNT_DEFAULT;
      h += `<div class="ap-amount" aria-live="polite">${gbp(AMOUNTS[i])}</div>
        <input class="ap-range" type="range" min="0" max="${AMOUNTS.length - 1}" step="1" value="${i}" aria-label="Business loan amount">
        <div class="ap-scale"><span>£5,000</span><span>£2,000,000+</span></div>
        <div class="ap-chips">${[2, 7, 10, 13, 17, 19].map((j) => `<button type="button" class="ap-chip" data-j="${j}">${gbp(AMOUNTS[j]).replace(',000,000', 'm').replace(',000', 'k')}</button>`).join('')}</div>${nextBtn()}<p class="ap-quick"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2M10 2h4M12 2v3"/></svg>Takes about a minute</p>`;
    } else if (s.type === 'text') {
      h += `<div class="ap-field ap-text-step"><label class="ap-sr" for="ap-${s.id}">${s.q}</label><input id="ap-${s.id}" name="${s.id}" type="text" autocomplete="${s.autocomplete || 'off'}" placeholder="${esc(s.placeholder || '')}" value="${esc(a[s.id] || '')}"><span class="ap-err" id="ap-${s.id}-err"></span>${s.note ? `<p class="ap-note">${s.note}</p>` : ''}${s.id === 'business' && a.companyManual ? '<p class="ap-note"><button type="button" class="ap-link" data-search>Search Companies House instead</button></p>' : ''}</div>${nextBtn()}`;
    } else if (s.type === 'cards') {
      h += `<div class="ap-opts${s.one ? ' one' : ''}" role="radiogroup" aria-label="${esc(s.q)}">${s.opts.map(([ic, t, d]) =>
        `<button type="button" class="ap-opt${a[s.id] === t ? ' sel' : ''}" role="radio" aria-checked="${a[s.id] === t}" data-v="${esc(t)}"><span class="ap-ico">${ICON[ic]}</span><span><b>${t}</b>${d ? `<small>${d}</small>` : ''}</span><span class="ap-tick">${TICK}</span></button>`).join('')}</div>${s.opts.some(([, t]) => t === a[s.id]) ? nextBtn() : ''}`;
    } else if (s.type === 'chips') {
      h += `<div class="ap-opts one" role="radiogroup" aria-label="${esc(s.q)}">${s.opts.map((t) =>
        `<button type="button" class="ap-opt${a[s.id] === t ? ' sel' : ''}" role="radio" aria-checked="${a[s.id] === t}" data-v="${esc(t)}"><span><b>${t}</b></span><span class="ap-tick">${TICK}</span></button>`).join('')}</div>${s.note ? `<p class="ap-note">${s.note}</p>` : ''}${s.tip ? `<div class="ap-tip">${I('<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>')}<p><b>${s.tip[0]}</b>${s.tip[1]}</p></div>` : ''}${s.opts.includes(a[s.id]) ? nextBtn() : ''}`;
    } else {
      const f = (n, l, type, ac, full) => `<div class="ap-field${full ? ' full' : ''}"><label for="ap-${n}">${l}</label><input id="ap-${n}" name="${n}" type="${type}" autocomplete="${ac}" value="${esc(a[n] || '')}" required><span class="ap-err" id="ap-${n}-err"></span></div>`;
      h += `<form novalidate><div class="ap-grid">
        ${f('fullName', 'Full name', 'text', 'name', true)}
        ${f('email', 'Email address', 'email', 'email')}${f('phone', 'Mobile number', 'tel', 'tel')}
        </div>
        <div class="ap-hp" aria-hidden="true"><label>Website<input name="website" tabindex="-1" autocomplete="off"></label></div>
        <div class="ap-ts" id="ap-ts"></div>
        <div class="ap-actions ap-send"><button type="submit" class="button ap-next">See my options ${ARROW}</button></div>
        ${CONSENTS.map(([, html]) => `<p class="ap-agree">${html}</p>`).join('')}
        <div class="ap-formerr" role="alert"></div></form>`;
    }
    return h;
  }

  function show(dir = 1) {
    const steps = visible();
    idx = Math.max(0, Math.min(idx, steps.length - 1));
    const s = steps[idx];
    body.innerHTML = `<div class="ap-step on${dir < 0 ? ' back' : ''}${dir === 0 ? ' still' : ''}">${render(s)}</div>`; // no slide-in on page load (the first question is already in the HTML)
    if (!seen.has(s.id)) { seen.add(s.id); T(seen.size === 1 ? 'ViewContent' : 'FormStep', seen.size === 1 ? { form: 'business', content_name: 'Business loan form' } : { form: 'business', step: idx + 1, step_name: s.id }); }
    bar.innerHTML = `<i class="ap-fill" style="width:${Math.round(((idx + 1) / steps.length) * 100)}%"></i>`; // one line that grows to the end
    count.textContent = '';
    back.classList.toggle('on', idx > 0);
    root.closest('.ap-lp')?.classList.toggle('ap-going', idx > 0); // phones: headline and ticks hide once they're past the first question (CSS)
    wire(s);
    const focus = body.querySelector('.ap-q');
    if (dir !== 0) focus.focus({ preventScroll: true });
    if (dir !== 0 && root.getBoundingClientRect().top < 0) root.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  const NOT_CH = 'We can only help limited companies and LLPs registered at Companies House.';
  // Answers we can't place with lenders: stop with a short explanation instead of advancing.
  const stopReason = (s) => {
    if (s.id === 'structure' && (a.structure === 'Sole trader' || a.structure === 'Partnership')) return 'We can only help limited companies and LLPs at the moment.';
    if (s.id === 'structure' && a.structure === 'Not trading yet') return 'We can only help businesses that are already trading.';
    return '';
  };
  function stop(reason) {
    save();
    count.textContent = ''; back.classList.remove('on');
    body.innerHTML = `<div class="ap-step on ap-done"><div class="ap-badge ap-badge-no">${I('<path d="M18 6L6 18M6 6l12 12" stroke-width="3"/>')}</div>
      <h2 class="ap-q" tabindex="-1">Sorry, we can't help with this one</h2><p class="ap-stop">${reason}</p>
      <div class="ap-actions"><a href="/" class="button ap-next">Back to home</a></div></div>`;
    body.querySelector('.ap-q').focus();
  }
  const go = (d) => {
    if (d > 0 && !started) { started = true; T('FormStart', { form: 'business' }); }
    if (d > 0) { const r = stopReason(visible()[idx]); if (r) { T('FormDisqualified', { form: 'business', step_name: visible()[idx].id, reason: r }); return stop(r); } }
    idx += d; save();
    // Before the contact step: a short "finding options" screen (once per visit), so it lands as a result, not a hurdle.
    if (d > 0 && !found && visible()[idx]?.id === 'details') { found = true; return finding(() => show(d)); }
    show(d);
  };
  function finding(then) {
    count.textContent = ''; back.classList.remove('on');
    body.innerHTML = `<div class="ap-step on ap-finding" role="status" aria-label="Finding options for your business"><div class="ap-loader" aria-hidden="true"><span class="ap-ring"></span></div></div>`;
    const ms = matchMedia('(prefers-reduced-motion: reduce)').matches ? 300 : 900;
    setTimeout(() => { body.querySelector('.ap-finding')?.classList.add('ok'); setTimeout(then, 300); }, ms);
  }

  // Incorporation date → time-trading band (same bands as the trading question; the server recalculates it).
  const tradingBand = (iso) => {
    const m = (Date.now() - Date.parse(iso)) / (30.44 * 864e5);
    if (!(m >= 0)) return '';
    return m < 6 ? 'Under 6 months' : m < 12 ? '6 to 12 months' : m < 24 ? '1 to 2 years' : m < 60 ? '2 to 5 years' : '5+ years';
  };
  // Companies House search (via /api/company). Picking a company moves on to the director step.
  function wireCompany(step) {
    const inp = step.querySelector('#ap-co'), list = step.querySelector('.ap-co-list');
    let timer, seq = 0, items = [];
    const manual = () => { T('FormDisqualified', { form: 'business', step_name: 'business', reason: 'not on Companies House' }); stop(NOT_CH); };
    const pick = (c) => {
      const band = tradingBand(c.created);
      Object.assign(a, { business: c.title, companyNumber: c.number, companyStatus: c.status, companyType: c.type, incorporated: c.created, companyAddress: c.address, director: '', directorListed: false,
        ...(band ? { trading: band, tradingFromCH: true } : { tradingFromCH: false }) });
      save();
      go(1);
    };
    const run = async () => {
      const q = inp.value.trim(), my = ++seq;
      if (q.length < 2) { list.innerHTML = ''; return; }
      list.innerHTML = '<p class="ap-note">Searching…</p>';
      try {
        const r = await fetch(`/api/company?q=${encodeURIComponent(q)}`);
        if (!r.ok) throw new Error(r.status);
        ({ items } = await r.json());
        if (my !== seq) return;
        list.innerHTML = items.length ? items.map((c, i) => {
          const live = c.status === 'active';
          const meta = [c.number, live ? (c.created ? `Incorporated ${c.created.slice(0, 4)}` : '') : (STATUS[c.status] || c.status || ''), c.address].filter(Boolean).join(' · ');
          return `<button type="button" class="ap-opt${a.companyNumber === c.number ? ' sel' : ''}" role="radio" aria-checked="${a.companyNumber === c.number}" data-i="${i}"${live ? '' : ' disabled'}><span><b>${esc(c.title)}</b><small>${esc(meta)}</small></span><span class="ap-tick">${TICK}</span></button>`;
        }).join('') : '<p class="ap-note">No companies found. Check the spelling, or search by your company number.</p>';
        list.querySelectorAll('[data-i]').forEach((b) => b.addEventListener('click', () => pick(items[+b.dataset.i])));
      } catch { if (my !== seq) return; list.innerHTML = a.companyNumber ? '' : '<p class="ap-note">We couldn’t search Companies House just now. Please try again in a moment.</p>'; } // search down: keep a pick already made
    };
    inp.addEventListener('input', () => { // typing means a new search: drop any earlier pick so name and number can't disagree
      Object.assign(a, { business: inp.value, companyNumber: '', director: '', directorListed: false }); step.querySelector('.ap-actions')?.remove();
      clearTimeout(timer); timer = setTimeout(run, 300);
    });
    inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); clearTimeout(timer); run(); } });
    step.querySelector('[data-manual]').addEventListener('click', manual);
    step.querySelector('[data-next]')?.addEventListener('click', () => go(1));
    if (inp.value.trim().length >= 2) run();
    setTimeout(() => inp.focus({ preventScroll: true }), 50);
  }

  // Current directors / LLP members of the picked company; "I'm not listed" lets them type their name.
  function wireDirector(step) {
    const list = step.querySelector('.ap-dir'), man = step.querySelector('.ap-dir-manual'), inp = man.querySelector('input'), err = man.querySelector('.ap-err');
    const openManual = () => { man.hidden = false; list.querySelectorAll('.ap-opt').forEach((o) => { o.classList.remove('sel'); o.setAttribute('aria-checked', 'false'); }); inp.focus(); };
    const pick = (o) => { Object.assign(a, { director: o.name, directorListed: true, officerRole: o.role, fullName: o.name }); save(); setTimeout(() => go(1), 260); };
    const next = () => {
      const v = inp.value.trim().replace(/\s+/g, ' ');
      if (v.split(' ').length < 2) { err.textContent = 'Please enter your first and last name'; inp.setAttribute('aria-invalid', 'true'); return inp.focus(); }
      Object.assign(a, { director: '', directorListed: false, fullName: v }); save(); go(1);
    };
    man.querySelector('[data-next]').addEventListener('click', next);
    inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); next(); } });
    inp.addEventListener('input', () => { err.textContent = ''; inp.removeAttribute('aria-invalid'); });
    fetch(`/api/company?number=${encodeURIComponent(a.companyNumber)}`).then((r) => (r.ok ? r.json() : Promise.reject())).then(({ officers }) => {
      const notListed = `<button type="button" class="ap-opt" data-none><span><b>I’m not listed</b><small>Enter your name instead</small></span></button>`;
      list.innerHTML = officers.map((o, i) => `<button type="button" class="ap-opt${a.directorListed && a.director === o.name ? ' sel' : ''}" role="radio" aria-checked="${a.directorListed && a.director === o.name}" data-i="${i}"><span><b>${esc(o.name)}</b><small>${o.role}${o.appointed ? ` since ${o.appointed.slice(0, 4)}` : ''}</small></span><span class="ap-tick">${TICK}</span></button>`).join('') + notListed;
      list.querySelectorAll('[data-i]').forEach((b) => b.addEventListener('click', () => { b.classList.add('sel'); pick(officers[+b.dataset.i]); }));
      list.querySelector('[data-none]').addEventListener('click', openManual);
      if (!officers.length || (a.fullName && !a.directorListed)) openManual();
    }).catch(() => { list.innerHTML = ''; openManual(); });
  }

  function wire(s) {
    s = asText(s);
    const step = body.firstElementChild;
    if (s.type === 'company') return wireCompany(step);
    if (s.type === 'director') return wireDirector(step);
    step.querySelector('[data-search]')?.addEventListener('click', () => { a.companyManual = false; save(); show(0); });
    if (s.type === 'amount') {
      const r = step.querySelector('.ap-range'), out = step.querySelector('.ap-amount');
      const set = (i) => {
        a.amountIdx = +i; a.amount = gbp(AMOUNTS[i]); r.value = i; out.textContent = a.amount;
        r.style.setProperty('--p', `${(i / (AMOUNTS.length - 1)) * 100}%`);
        step.querySelectorAll('.ap-chip').forEach((c) => c.classList.toggle('sel', +c.dataset.j === +i));
      };
      set(a.amountIdx ?? AMOUNT_DEFAULT);
      r.addEventListener('input', () => set(r.value));
      step.querySelectorAll('.ap-chip').forEach((c) => c.addEventListener('click', () => set(c.dataset.j)));
      step.querySelector('[data-next]').addEventListener('click', () => go(1));
    } else if (s.type === 'text') {
      const inp = step.querySelector('input'), err = step.querySelector('.ap-err');
      inp.addEventListener('input', () => { a[s.id] = inp.value; save(); err.textContent = ''; inp.removeAttribute('aria-invalid'); });
      const next = () => {
        if (!inp.value.trim()) { err.textContent = s.error; inp.setAttribute('aria-invalid', 'true'); return inp.focus(); }
        const issue = s.id === 'business' && legalNameIssue(inp.value);
        if (issue) {
          err.innerHTML = `Your legal company name should end in ${issue.words}. <button type="button" class="ap-fix" data-legal-fix>Use “${esc(issue.fix)}”</button><button type="button" class="ap-exempt" data-legal-exempt>My company is registered without it</button>`;
          inp.setAttribute('aria-invalid', 'true');
          err.querySelector('[data-legal-fix]').addEventListener('click', () => { inp.value = a[s.id] = issue.fix; save(); err.textContent = ''; inp.removeAttribute('aria-invalid'); inp.focus(); });
          err.querySelector('[data-legal-exempt]').addEventListener('click', () => { a.suffixExempt = true; save(); next(); });
          return;
        }
        a[s.id] = inp.value.trim();
        if (s.id === 'business') Object.assign(a, { companyNumber: '', director: '', directorListed: false });
        go(1);
      };
      step.querySelector('[data-next]').addEventListener('click', next);
      inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); next(); } });
      setTimeout(() => inp.focus({ preventScroll: true }), 50);
    } else if (s.type === 'cards' || s.type === 'chips') {
      step.querySelectorAll('.ap-opt').forEach((b) => b.addEventListener('click', () => {
        a[s.id] = b.dataset.v;
        step.querySelectorAll('.ap-opt').forEach((o) => { o.classList.toggle('sel', o === b); o.setAttribute('aria-checked', o === b); });
        setTimeout(() => go(1), 260); // brief pause so the tick registers before advancing
      }));
      step.querySelector('[data-next]')?.addEventListener('click', () => go(1)); // answer already chosen (going back or preselected)
    } else {
      const form = step.querySelector('form');
      form.addEventListener('input', (e) => { const el = e.target; a[el.name] = el.type === 'checkbox' ? el.checked : el.value; if (el.name !== 'website') save(); el.removeAttribute('aria-invalid'); });
      form.addEventListener('submit', (e) => { e.preventDefault(); submit(form); });
      form.addEventListener('focusout', (e) => {
        const el = e.target, rule = RULES[el.name];
        if (!rule || !el.value.trim()) return;
        const s = el.name === 'email' && suggest(el.value);
        const msg = rule(el.value) || (s ? fixHTML(s) : '');
        if (s) nudged = el.value;
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
  // Agreement is the submit button itself: one plain line beside it (terms + sharing with the matched specialist, which is the
  // point of the form). It must keep saying who gets their details. The exact wording is sent with the enquiry as the record.
  const CONSENT_VERSION = '2026-11-15';
  const CONSENTS = [
    ['consentTerms', 'By continuing, you agree to our <a href="/terms-conditions" target="_blank">Terms</a> and <a href="/privacy-policy" target="_blank">Privacy Policy</a>, and for us to share your details with a finance specialist who’ll contact you about your options.'],
  ];
  const plain = (s) => s.replace(/<[^>]+>/g, '');
  const RULES = {
    fullName: (v) => v.trim().split(/\s+/).length >= 2 ? '' : 'Please enter your first and last name',
    email: (v) => /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)*\.[a-z]{2,}$/i.test(v.trim()) ? '' : 'Please enter a valid email address',
    phone: (v) => mobile(v) ? '' : 'Please enter a UK mobile number, e.g. 07700 900123',
  };


  // Cloudflare Turnstile (bot check). Off until the site key is set on the server (/api/platform?action=config).
  // A fresh, single-use token is made at each submit; resolves '' when switched off or if Cloudflare can't load.
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
      if (ts.id !== null && ts.box === box && box.isConnected) { window.turnstile.reset(ts.id); window.turnstile.execute(ts.id); return; } // same form again (e.g. a resubmit)
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
      el.toggleAttribute('aria-invalid', !!msg); if (msg) el.setAttribute('aria-invalid', 'true');
      if (msg && !first) first = el;
    }
    const s = !first && suggest(form.elements.email.value);
    if (s && nudged !== form.elements.email.value) { nudged = form.elements.email.value; form.querySelector('#ap-email-err').innerHTML = fixHTML(s); first = form.elements.email; }
    if (first) return first.focus();
    if (!a.companyNumber) { idx = visible().findIndex((x) => x.id === 'business'); return show(0); } // must pick from Companies House

    const btn = form.querySelector('button[type=submit]'), err = form.querySelector('.ap-formerr');
    btn.disabled = true; btn.firstChild.textContent = 'Sending… '; err.classList.remove('on');
    const payload = {
      amount: a.amount, purpose: a.purpose, timeline: a.timeline, structure: a.structure,
      trading: a.trading, turnover: a.turnover, property: a.property, credit: a.credit, debt: a.debt, ...(a.debt === 'Yes' ? { debtLeft: a.debtLeft, debtMonthly: a.debtMonthly } : {}),
      fullName: a.fullName.trim().replace(/\s+/g, ' '), firstName: a.fullName.trim().split(/\s+/)[0], lastName: a.fullName.trim().split(/\s+/).slice(1).join(' '),
      business: (a.business || '').trim(), email: a.email.trim(), phone: mobile(a.phone),
      company: a.companyNumber ? { number: a.companyNumber, status: a.companyStatus || null, type: a.companyType || null, incorporated: a.incorporated || null, address: a.companyAddress || null,
        director: a.directorListed ? a.director : null, directorListed: !!a.directorListed, role: a.directorListed ? a.officerRole || null : null } : null,
      phoneConfirmed: !!confirmed.phone && confirmed.phone === mobile(a.phone), emailConfirmed: !!confirmed.email && confirmed.email === a.email.trim(),
      consentTerms: true, consentShare: true, consentVersion: CONSENT_VERSION, consentAt: new Date().toISOString(),
      consentText: CONSENTS.map(([, t]) => plain(t)).join(' | '),
      marketing: !!window.loanleafCookies?.get()?.marketing, fbc: getFbc(), fbp: getFbp(),
      eventId: (crypto.randomUUID && crypto.randomUUID()) || String(Date.now()),
      website: form.elements.website.value, _ms: Date.now() - t0,
      page: location.href, referrer: document.referrer, utm: Object.fromEntries(new URLSearchParams(location.search)), first: (() => { try { return JSON.parse(sessionStorage.getItem('ll_src') || 'null'); } catch { return null; } })(),
      variant: root.dataset.variant || undefined, // landing page variant, e.g. "500k" on /business-finance
    };
    try {
      payload.turnstile = await humanToken(form.querySelector('#ap-ts'));
      const res = await fetch('/api/enquiry', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (res.status === 400) {
        const d = await res.json().catch(() => ({}));
        if (d.field && form.elements[d.field]) {
          btn.disabled = false; btn.firstChild.textContent = 'See my options ';
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
        if (d.error) { btn.disabled = false; btn.firstChild.textContent = 'See my options '; err.textContent = d.error; err.classList.add('on'); return; } // e.g. the 6-month trading rule
      }
      if (!res.ok) throw new Error(res.status);
      const r = await res.json().catch(() => ({}));
      done(payload, r.match, r.meta, r.again ? r.rematch : null);
    } catch {
      btn.disabled = false; btn.firstChild.textContent = 'See my options ';
      err.innerHTML = 'Sorry, something went wrong sending your details. Please try again, or email <a href="mailto:hello@loanleaf.co">hello@loanleaf.co</a>.';
      err.classList.add('on');
    }
  }

  // Matched automatically: the broker's card, with tap-to-call / WhatsApp / email / website buttons.
  const svg = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  // Ready-made first message, so WhatsApp / Text / Email open with it filled in. Keep in step with matchMessage() in api/_lib/platform.js.
  const matchMessage = (m, p) => [`Hi ${String(m.person || '').split(' ')[0] || m.company}, I found you through Loanleaf and was matched with you for business finance. Here's a quick summary:`, '',
    p.business && `Business: ${p.business}`, p.amount && `Looking for: ${p.amount}${p.purpose ? ` for ${String(p.purpose).toLowerCase()}` : ''}`,
    p.timeline && `Needed: ${p.timeline}`, p.turnover && `Annual revenue: ${p.turnover}`, p.trading && `Trading for: ${p.trading}`, '', `Thanks, ${p.fullName || ''}`.trim()]
    .filter((x) => x !== false && x != null).join('\n');
  const MICON = {
    call: svg('<path d="M22 16.9v3a2 2 0 0 1-2.2 2A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>'),
    whatsapp: svg('<path d="M3 21l1.7-4.9A8.6 8.6 0 1 1 8 19.6z"/><path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1.2-1.2-1.8-.9-.8.8a4 4 0 0 1-2.3-2.3l.8-.8-.9-1.8z"/>'),
    sms: svg('<rect x="6" y="2" width="12" height="20" rx="2.5"/><path d="M10 18h4"/>'), email: svg('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>'),
    web: svg('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>') };
  function brokerCard(m, p) {
    const digits = (n) => String(n).replace(/[^\d+]/g, ''), mob = (n) => /^(\+?44\s?7|07)/.test(String(n || '').replace(/[\s()-]/g, ''));
    const msg = encodeURIComponent(matchMessage(m, p)), text = 'sms' in m ? m.sms : mob(m.whatsapp) ? m.whatsapp : mob(m.phone) ? m.phone : null;
    const acts = [m.phone && ['call', 'Call', m.phone, `tel:${digits(m.phone)}`],
      m.whatsapp && ['whatsapp', 'WhatsApp', 'Message on WhatsApp', `https://wa.me/${String(m.whatsapp).replace(/\D/g, '').replace(/^0/, '44')}?text=${msg}`, true],
      text && ['sms', 'Text', text, `sms:${digits(text)}?&body=${msg}`],
      m.email && ['email', 'Email', m.email, `mailto:${m.email}?subject=${encodeURIComponent(`Business finance enquiry from ${p.business || p.fullName} (via Loanleaf)`)}&body=${msg}`],
      m.website && ['web', 'Website', m.website.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, ''), m.website, true]].filter(Boolean);
    const btns = acts.map(([k, label, sub, href, ext]) => `<a class="ap-mb ap-mb-${k}" href="${esc(href)}"${ext ? ' target="_blank" rel="noopener"' : ''}>${MICON[k]}<span><b>${label}</b><em>${esc(sub)}</em></span></a>`);
    return `<div class="ap-match"><span class="ap-match-tag">Your broker</span>
      ${m.logo ? `<img class="ap-match-logo" src="${esc(m.logo)}" alt="${esc(m.company)}">` : ''}
      <b class="ap-match-name">${esc(m.company)}</b>${m.person ? `<span class="ap-match-who">${esc(m.person)}${m.role ? `, ${esc(m.role)}` : ''}</span>` : ''}
      ${m.about ? `<p class="ap-match-about">${esc(m.about)}</p>` : ''}${btns.length ? `<div class="ap-match-btns">${btns.join('')}</div>` : ''}</div>`;
  }

  // meta (from /api/enquiry) says which Meta events this enquiry counts as; the server sends the matching CAPI copies with the same IDs.
  function done(p, match, meta = {}, rematch = null) { // rematch: already matched before (repeat enquiry), link to a different broker
    if (meta.lead !== false) T('Lead', { currency: 'GBP', content_name: 'Business finance enquiry', content_category: p.purpose }, { eventId: p.eventId, server: false });
    if (meta.qualified) T('CompleteRegistration', { currency: 'GBP', content_name: 'Business finance enquiry', content_category: p.purpose }, { eventId: `${p.eventId}-q`, server: false });
    (meta.revenue || []).forEach((n) => { T(n, { currency: 'GBP', content_name: 'Business finance enquiry', content_category: p.purpose }, { eventId: `${p.eventId}-${n}`, server: false }); });
    try { localStorage.removeItem(KEY); } catch {}
    bar.querySelectorAll('span').forEach((s) => s.classList.add('on')); count.textContent = 'Complete'; back.classList.remove('on');
    const rows = [['Amount', p.amount], ['Purpose', p.purpose], ['Needed', p.timeline], ['Business', p.business]];
    body.innerHTML = `<div class="ap-step on ap-done">
      <div class="ap-badge">${TICK}</div>
      <h2 class="ap-q" tabindex="-1">${match ? (rematch ? `Thanks, ${esc(p.firstName)}. You've already been matched with ${esc(match.company)}.` : `Thanks, ${esc(p.firstName)}. We've matched you with ${esc(match.company)}.`) : `Thanks, ${esc(p.firstName)}. You're all set.`}</h2>
      ${match ? `<p class="ap-done-lead">${rematch ? `We've let them know you're still looking, so ${esc(match.person || 'they')} should be in touch shortly. We've emailed you their details again.` : `${esc(match.person || 'They')} will be in touch shortly, usually by phone. We've emailed you their details too.`}</p>${brokerCard(match, p)}${rematch ? `<p class="ap-done-lead"><a href="${esc(rematch)}">Match me with a different broker</a></p>` : ''}` : ''}
      <dl class="ap-summary">${rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v || '–')}</dd></div>`).join('')}</dl>
      <ol class="ap-steps-next">${match ? `<li>${esc(match.person || match.company)} calls you to talk through your options</li><li>They find the finance that fits your business</li><li>You choose whether to go ahead, with no obligation</li>`
        : '<li>A business loan specialist reviews your details</li><li>They call you to talk through your options</li><li>You choose the offer that suits you, with no obligation</li>'}</ol></div>`;
    body.querySelector('.ap-q').focus();
  }

  back.addEventListener('click', () => go(-1));
  // Homepage purpose cards: preselect that purpose, then the link scrolls up to the form.
  window.addEventListener('click', (e) => {
    const card = e.target.closest('[data-purpose]');
    if (!card) return;
    a.purpose = card.dataset.purpose; save();
    if (visible()[idx]?.id === 'purpose') show(0);
  }, true); // capture: runs before the nav's in-page scroll handler
  root.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' || e.target.closest('form') || e.target.matches('button')) return;
    const n = body.querySelector('[data-next]');
    if (n) { e.preventDefault(); n.click(); }
  });
  show(0);
})();

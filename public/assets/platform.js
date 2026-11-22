// Leaflegal Platform: law firm portal (dashboard, opportunities, lead pipeline, auto-buy, credits, account, admin).
// Auth is Supabase email + password over its REST API; everything else goes through /api/platform.
(() => {
  // Supabase project URL and publishable key come from /api/platform?action=config (these are only the fallbacks).
  let SB = 'https://qrdpvsqsfifmgkxinank.supabase.co', KEY = 'sb_publishable_vZL7kU5KjOGWKSfcAAsnbg_9p9BBTUM';
  const TK = 'llp-session';
  // Public config (Supabase, Turnstile) and the practice area taxonomy: fetched once per page load, before the first route.
  let CONFIG = {};
  const configReady = fetch('/api/platform?action=config').then((r) => r.json()).then((d) => { CONFIG = d || {}; if (d?.supabaseUrl) SB = d.supabaseUrl; if (d?.supabaseKey) KEY = d.supabaseKey; }).catch(() => {});
  const app = document.getElementById('app'), modal = document.getElementById('pf-modal'), toastEl = document.querySelector('.pf-toast');
  const h = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  // Repeatable input list (several emails or webhooks): rows of inputs with remove buttons and an Add button.
  const listVals = (v) => (Array.isArray(v) ? v : String(v || '').split(/[,;\s]+/)).filter(Boolean);
  const listRow = (name, type, v, ph) => `<div class="pf-list-row"><input name="${name}" type="${type}" value="${h(v)}" placeholder="${h(ph)}" aria-label="${type === 'url' ? 'Webhook URL' : 'Email address'}"><button type="button" class="pf-list-x" data-rm aria-label="Remove">×</button></div>`;
  const listField = (name, vals, type, ph, add, max) => { const v = listVals(vals);
    return `<div class="pf-list" data-list="${name}" data-type="${type}" data-ph="${h(ph)}" data-max="${max}">${(v.length ? v : ['']).map((x) => listRow(name, type, x, ph)).join('')}<button type="button" class="pf-btn pf-btn-sm" data-add>+ ${add}</button></div>`; };
  const wireLists = (root) => root.addEventListener('click', (e) => {
    const box = e.target.closest('.pf-list'); if (!box) return;
    if (e.target.closest('[data-add]')) {
      if (box.querySelectorAll('.pf-list-row').length >= +box.dataset.max) return toast(`You can add up to ${box.dataset.max}`, true);
      box.querySelector('[data-add]').insertAdjacentHTML('beforebegin', listRow(box.dataset.list, box.dataset.type, '', box.dataset.ph));
      box.querySelector('.pf-list-row:last-of-type input').focus();
    } else if (e.target.closest('[data-rm]')) {
      const rows = box.querySelectorAll('.pf-list-row');
      if (rows.length > 1) e.target.closest('.pf-list-row').remove(); else rows[0].querySelector('input').value = '';
      root.dispatchEvent(new Event('change'));
    }
  });
  // Same rule as pwProblem in api/platform.js.
  const pwProblem = (p) => (p = String(p || ''), p.length < 12 ? 'at least 12 characters' : p.length > 72 ? '72 characters or fewer' : !/[A-Z]/.test(p) ? 'an upper-case letter'
    : !/[a-z]/.test(p) ? 'a lower-case letter' : !/[0-9]/.test(p) ? 'a number' : !/[^A-Za-z0-9]/.test(p) ? 'a special character, like ! ? # or @' : null);
  const num = (n) => Number(n || 0).toLocaleString('en-GB');
  const gbp = (n) => '£' + num(n);
  const short = (n) => (n >= 1e6 ? '£' + +(n / 1e6).toFixed(2) + 'm' : n >= 1e3 ? '£' + Math.round(n / 1e3) + 'k' : gbp(n));
  const mins = (d) => (Date.now() - new Date(d)) / 6e4;
  const ago = (d) => { const m = mins(d); return m < 1 ? 'just now' : m < 60 ? `${m | 0} min ago` : m < 1440 ? `${(m / 60) | 0} hr ago` : `${(m / 1440) | 0} day${m < 2880 ? '' : 's'} ago`; };
  const date = (d) => new Date(d).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  const toast = (msg, bad) => { toastEl.innerHTML = `${bad ? I.x : I.check}<span>${h(msg)}</span>`; toastEl.className = 'pf-toast on' + (bad ? ' bad' : ''); clearTimeout(toast.t); toast.t = setTimeout(() => (toastEl.className = 'pf-toast'), 4200); };
  const LOGO = '<img class="pf-logo" src="/assets/Leaflegal_Logo_White.svg" alt="Leaflegal" width="120" height="24"/>';

  // ------------------------------------------------ icons (24px stroke icons)
  const ic = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const I = {
    chev: ic('<path d="m6 9 6 6 6-6"/>'),
    grid: ic('<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>'),
    doc: ic('<path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>'),
    chart: ic('<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>'),
    wa: ic('<path d="M21 11.5a8.4 8.4 0 0 1-12.3 7.4L3 21l2.1-5.6A8.4 8.4 0 1 1 21 11.5z"/><path d="M9 9.5c.3 1.8 2.2 3.9 4.2 4.6l1.3-1.2 1.8.9"/>'),
    home: ic('<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>'),
    team: ic('<circle cx="9" cy="8" r="3.2"/><path d="M3 19c.6-3.2 3-5 6-5s5.4 1.8 6 5"/><circle cx="17" cy="9" r="2.4"/><path d="M16 14.2c2.6.1 4.4 1.7 5 4.3"/>'),
    spark: ic('<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>'),
    inbox: ic('<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.5 5h13L22 12v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6z"/>'),
    layers: ic('<path d="m12 2 10 5-10 5L2 7z"/><path d="m2 17 10 5 10-5M2 12l10 5 10-5"/>'),
    coins: ic('<circle cx="9" cy="9" r="6"/><path d="M15.5 9.6A6 6 0 1 1 9.6 15.5"/><path d="M9 7v4h2"/>'),
    user: ic('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'),
    bell: ic('<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/>'),
    shield: ic('<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>'),
    phone: ic('<path d="M22 16.9v3a2 2 0 0 1-2.2 2A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>'),
    mail: ic('<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/>'),
    check: ic('<path d="M20 6 9 17l-5-5"/>'),
    x: ic('<path d="M18 6 6 18M6 6l12 12"/>'),
    arrow: ic('<path d="M5 12h14M13 6l6 6-6 6"/>'),
    clock: ic('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
    target: ic('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>'),
    star: ic('<path d="m12 2 3 6.5 7 .8-5.2 4.8 1.4 7L12 17.6 5.8 21l1.4-7L2 9.3l7-.8z"/>'),
    out: ic('<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>'),
    plus: ic('<path d="M12 5v14M5 12h14"/>'),
    undo: ic('<path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-15-6.7L3 13"/>'),
    download: ic('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>'),
    webhook: ic('<path d="M18 16.98h-5.99c-1.1 0-1.95.94-2.48 1.9A4 4 0 0 1 2 17c.01-.7.2-1.4.57-2"/><path d="m6 17 3.13-5.78c.53-.97.1-2.18-.5-3.1a4 4 0 1 1 6.89-4.06"/><path d="m12 6 3.13 5.73C15.66 12.7 16.9 13 18 13a4 4 0 0 1 0 8"/>'),
  };
  // One icon per practice area (taxonomy slugs).
  const AREA_ICON = {
    conveyancing: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    immigration: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
    'family-law': '<circle cx="8" cy="7" r="3"/><circle cx="17" cy="9" r="2.2"/><path d="M2.5 20c.5-3.6 2.8-6 5.5-6s5 2.4 5.5 6M13.5 20c.4-2.6 1.8-4.6 3.5-4.6s3.1 2 3.5 4.6"/>',
    'debt-recovery': '<path d="M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2z"/><path d="M9 8h6M9 12h6M9 16h3"/>',
    licensing: '<path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8z"/><path d="M14 3v5h5"/><circle cx="12" cy="14" r="2.5"/><path d="m10.5 16.2-1 3.3 2.5-1 2.5 1-1-3.3"/>',
    'lease-extensions': '<circle cx="8" cy="15" r="4"/><path d="m11 12 9-9M17 6l3 3M15 8l2 2"/>',
    trademarks: '<path d="M20.6 13.4l-7.2 7.2a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
    other: '<circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>',
  };
  const aIcon = (a) => ic(AREA_ICON[a] || AREA_ICON.other);

  // ------------------------------------------------ taxonomy (practice areas, matters, regions, regulators, stages)
  // From /api/platform?action=taxonomy, the same lists as api/_lib/taxonomy.js. Fetched once per page load and kept in localStorage.
  // Built-in copy (api/_lib/taxonomy.js at build time) so the pages work before the fetch lands or if it fails.
  let TX = {"areas":[{"slug":"conveyancing","label":"Conveyancing","ew":true,"matters":[["buying-a-home","Buying a home"],["selling-a-home","Selling a home"],["buying-and-selling","Buying and selling"],["first-time-buyers","First time buyer"],["buying-a-leasehold-flat","Buying a leasehold flat"],["new-build-purchases","New build purchase"],["buy-to-let","Buy to let"],["remortgaging","Remortgaging"],["transfer-of-equity","Transfer of equity"],["other","Something else"]]},{"slug":"immigration","label":"Immigration","ew":false,"matters":[["work-visas","Work visa"],["spouse-and-partner-visas","Spouse or partner visa"],["family-visas","Family visa"],["settlement","Settlement (ILR)"],["british-citizenship","British citizenship"],["eu-settlement-scheme","EU Settlement Scheme"],["sponsor-licences","Sponsor licence (employer)"],["refusals-and-appeals","Refusal or appeal"],["visitor-visas","Visitor visa"],["talent-and-founder-visas","Global Talent or Innovator Founder"],["other","Something else"]]},{"slug":"family-law","label":"Family law","ew":true,"matters":[["divorce","Divorce"],["civil-partnership-dissolution","Ending a civil partnership"],["financial-settlements","Financial settlement"],["consent-orders","Consent order"],["child-arrangements","Child arrangements"],["cohabitation-disputes","Cohabitation dispute"],["separation-agreements","Separation agreement"],["prenuptial-agreements","Prenuptial agreement"],["other","Something else"]]},{"slug":"debt-recovery","label":"Debt recovery","ew":true,"businessOnly":true,"matters":[["unpaid-invoices","Unpaid invoices"],["letters-before-action","Letter before action"],["court-claims","Court claim"],["enforcement","Enforcing a judgment"],["statutory-demands","Statutory demand"],["winding-up-petitions","Winding up petition"],["late-payment-interest","Late payment interest"],["other","Something else"]]},{"slug":"licensing","label":"Licensing","ew":true,"matters":[["premises-licence-applications","New premises licence"],["licence-variations","Licence variation"],["transfers-and-dps","Transfer or DPS change"],["personal-licences","Personal licence"],["licence-reviews","Licence review or hearing"],["taxi-and-private-hire-licences","Taxi or private hire licence"],["other-licensing","Another licence"],["other","Something else"]]},{"slug":"lease-extensions","label":"Lease extensions","ew":true,"matters":[["statutory-lease-extension","Statutory lease extension"],["informal-lease-extension","Informal lease extension"],["short-lease","Flat with a short lease"],["collective-enfranchisement","Buying the freehold"],["selling-a-leasehold-flat","Selling a leasehold flat"],["lease-variations","Lease variation"],["other","Something else"]]},{"slug":"trademarks","label":"Trademarks and IP","ew":false,"matters":[["trademark-registration","Trademark registration"],["trademark-searches","Trademark search"],["objections-and-oppositions","Objection or opposition"],["trademark-infringement","Trademark infringement"],["cease-and-desist-letters","Cease and desist letter"],["trademark-renewals","Renewal or ownership change"],["copyright","Copyright"],["design-rights","Design rights"],["other-ip","Another brand or IP matter"],["other","Something else"]]}],"regions":["London","South East","South West","East of England","East Midlands","West Midlands","Yorkshire and the Humber","North West","North East","Wales","Scotland","Northern Ireland","Channel Islands and Isle of Man","Outside the UK"],"urgency":["Urgently","Within a month","In the next few months","Just looking into it"],"audiences":[["individual","Individuals"],["business","Businesses"]],"grades":["A","B","C"],"privatePay":[["yes","Can pay privately"],["quote","Will pay if the cost is right"]],"regulators":[{"id":"SRA","label":"Solicitors Regulation Authority (SRA)","number":"SRA number","areas":["conveyancing","immigration","family-law","debt-recovery","licensing","lease-extensions","trademarks"]},{"id":"CILEX","label":"CILEx Regulation","number":"CILEx Regulation number","areas":["conveyancing","immigration","family-law","debt-recovery","licensing","lease-extensions","trademarks"]},{"id":"CLC","label":"Council for Licensed Conveyancers (CLC)","number":"CLC licence number","areas":["conveyancing","lease-extensions"]},{"id":"IAA","label":"Immigration Advice Authority (IAA)","number":"IAA reference","areas":["immigration"]},{"id":"IPREG","label":"Intellectual Property Regulation Board (IPReg)","number":"IPReg registration number","areas":["trademarks"]}],"stages":["new","contacted","consultation","instructed","lost"],"stageLabels":{"new":"New","contacted":"Contacted","consultation":"Consultation","instructed":"Instructed","lost":"Lost"}};
  let STAGES = [], STAGE_NAME = {};
  const useTx = (t) => { if (t?.areas?.length) TX = { ...TX, ...t }; STAGES = TX.stages.map((k) => [k, TX.stageLabels[k] || k]); STAGE_NAME = Object.fromEntries(STAGES); };
  try { useTx(JSON.parse(localStorage.getItem('llp-tax') || 'null')); } catch { useTx(null); }
  const taxReady = fetch('/api/platform?action=taxonomy').then((r) => (r.ok ? r.json() : null)).then((d) => { const t = d?.taxonomy || d; if (t?.areas?.length) { useTx(t); try { localStorage.setItem('llp-tax', JSON.stringify(t)); } catch {} } }).catch(() => {});
  const areaOf = (slug) => TX.areas.find((a) => a.slug === slug) || null;
  const areaName = (slug, fallback) => areaOf(slug)?.label || fallback || (slug === 'not-sure' ? 'Not sure yet' : slug || '');
  const matterName = (area, slug, fallback) => areaOf(area)?.matters.find(([s]) => s === slug)?.[1] || fallback || (slug === 'other' ? 'Something else' : slug || '');
  const regulatorOf = (id) => TX.regulators.find((r) => r.id === id) || null;
  // Same rule as allowedAreas in api/_lib/taxonomy.js: a firm only gets areas its regulators allow.
  const allowedAreas = (regs = []) => [...new Set(regs.map((r) => (typeof r === 'string' ? r : r?.id)).flatMap((id) => regulatorOf(id)?.areas || []))];
  const firmAreas = (b = me) => { const regs = b?.regulators || []; return regs.length ? allowedAreas(regs) : b?.allowedAreas?.length ? b.allowedAreas : b?.allowed_areas?.length ? b.allowed_areas : TX.areas.map((a) => a.slug); };
  const REG_LINK = { SRA: 'https://www.sra.org.uk/consumers/register/', CILEX: 'https://cilexregulation.org.uk/', CLC: 'https://www.clc-uk.org/', IAA: 'https://www.gov.uk/find-an-immigration-adviser', IPREG: 'https://ipreg.org.uk/' };
  const regShort = (id) => ({ SRA: 'SRA', CILEX: 'CILEx', CLC: 'CLC', IAA: 'IAA', IPREG: 'IPReg' }[id] || id);
  const audName = (a) => (a === 'business' ? 'Business' : a === 'individual' ? 'Individual' : '–');
  const payName = (p) => (p === 'yes' ? 'Can pay privately' : p === 'quote' ? 'Will pay if the cost is right' : 'Not asked');
  const pcArea = (l) => l.postcode_area || String(l.postcode_district || l.postcode || '').toUpperCase().match(/^[A-Z]{1,2}/)?.[0] || '';
  const where = (l) => ([l.region, l.postcode_district || (l.postcode ? String(l.postcode).split(' ')[0] : '')].filter(Boolean).join(' · ') || '–') + (l.location_source === 'ip' && l.region ? ' (approximate)' : '');
  const valueText = (l) => l.value_band ? `${l.value_label ? `${h(l.value_label)} ` : ''}${h(l.value_band)}` : '–';
  const dueText = (d) => (d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '');
  const isUrgent = (l) => l.urgency === 'Urgently' || (l.deadline && new Date(l.deadline) - Date.now() < 14 * 864e5);
  const gradeBadge = (l) => `<span class="pf-q pf-q-${l.grade === 'A' ? 'hi' : l.grade === 'B' ? 'mid' : 'lo'}" title="Lead grade and quality score">${I.star}${h(l.grade || '–')}${l.score != null ? `<small>${l.score}</small>` : ''}</span>`;
  const tagList = (tags) => (tags?.length ? `<div class="pf-tags">${tags.map((t) => `<span class="pf-tag">${h(t)}</span>`).join('')}</div>` : '');
  const answersList = (answers) => (answers?.length ? `<dl class="pf-qa">${answers.map((x) => `<div><dt>${h(x.q)}</dt><dd>${h(x.a)}</dd></div>`).join('')}</dl>` : '<p class="pf-hint">No qualifying answers on this lead.</p>');
  // Lead fields come in two shapes: the marketplace shape (area, score, full_name) and leadOut (practice_area, quality_score, contact_name).
  const L = (l) => ({ ...l, area: l.area ?? l.practice_area, area_label: l.area_label ?? l.practice_area_label, score: l.score ?? l.quality_score, contact_name: l.contact_name ?? l.full_name });
  const qClass = (q) => (q >= 80 ? 'hi' : q >= 60 ? 'mid' : 'lo');
  const qBadge = (q) => `<span class="pf-q pf-q-${qClass(q)}" title="Lead quality score">${I.star}${q}</span>`;
  const initials = (s) => String(s || '?').replace(/[^\p{L}\p{N}\s]/gu, '').split(/\s+/).filter(Boolean).map((w) => w[0]).join('').slice(0, 2).toUpperCase() || '?';

  // The app is served at platform.leaflegal.co (P = '') and also at leaflegal.co/platform/... (P = '/platform').
  // P is '' only if the app is ever served from the root of its own host.
  const P = /^\/platform(\/|$)/.test(location.pathname) ? '/platform' : '';
  const currentTab = () => location.pathname.slice(P.length).replace(/^\//, '').split('/')[0];
  function nav(tab) {
    const url = `${P}/${tab}`.replace(/(.)\/$/, '$1');
    if (location.pathname !== url) history.pushState(null, '', url);
    window.scrollTo(0, 0); route();
  }

  // ------------------------------------------------ session + API
  let session = null; try { session = JSON.parse(localStorage.getItem(TK)); } catch {}
  const saveSession = (s) => { session = s; if (typeof cache !== 'undefined') cache.clear(); try { s ? localStorage.setItem(TK, JSON.stringify(s)) : localStorage.removeItem(TK); } catch {} };
  async function auth(grant, body) {
    const r = await fetch(`${SB}/auth/v1/token?grant_type=${grant}`, { method: 'POST', headers: { apikey: KEY, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d.error_description || d.msg || 'Sign in failed');
    saveSession({ access: d.access_token, refresh: d.refresh_token });
  }
  // Short-lived cache for page data so switching tabs is instant. Any change (POST) clears it.
  const TTL = { me: 60e3, opportunities: 15e3, dashboard: 20e3 }, cache = new Map();
  const cached = (action) => { const c = cache.get(action); return c && Date.now() - c.t < (TTL[action.split('&')[0]] || 45e3) ? c.d : null; };
  // While an admin is editing a broker's pages (acting), these actions go to that broker's account (?as=).
  const ACT = new Set(['profile', 'profile-logo', 'profile-preview', 'profile-scan', 'settings']);
  async function api(action, body, retry = true) {
    if (acting && ACT.has(action)) action = `${action}&as=${acting.id}`;
    if (!body) { const c = cached(action); if (c) return c; }
    else cache.clear();
    const d = await apiFetch(action, body, retry);
    if (!body) cache.set(action, { t: Date.now(), d });
    return d;
  }
  const prefetch = () => ['dashboard', 'opportunities', 'leads', 'ledger', 'subscription'].forEach((a, i) => setTimeout(() => api(a).catch(() => {}), 300 + i * 150));
  async function apiFetch(action, body, retry = true, ep = 'platform') {
    const r = await fetch(`/api/${ep}?action=${action}`, {
      method: body ? 'POST' : 'GET',
      headers: { 'Content-Type': 'application/json', ...(session ? { Authorization: `Bearer ${session.access}` } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (r.status === 401 && retry && session?.refresh) {
      try { await auth('refresh_token', { refresh_token: session.refresh }); return apiFetch(action, body, false, ep); } catch { saveSession(null); }
    }
    const d = await r.json().catch(() => null);
    if (!d) throw Object.assign(new Error(location.hostname === 'localhost' || location.hostname === '127.0.0.1' ? 'This is the local preview, which has no server. Use https://platform.leaflegal.co instead.' : "Can't reach the platform right now. Please try again in a moment."), { status: r.status });
    if (r.status === 401) { saveSession(null); me = null; route(); throw new Error('Please sign in again'); }
    if (!r.ok) throw Object.assign(new Error(d.error || 'Something went wrong'), { status: r.status });
    return d;
  }

  // Answers handed over from the partner application form (/partners/apply), same site only; expire after 30 days.
  // Supplier invite link (/register?invite=…): prefill name, email and firm. The server checks the signature.
  const invite = (() => { const t = new URLSearchParams(location.search).get('invite'); if (!t) return null;
    try { const b = atob(t.split('.')[0].replace(/-/g, '+').replace(/_/g, '/')), p = JSON.parse(new TextDecoder().decode(Uint8Array.from(b, (c) => c.charCodeAt(0)))); return p.x > Date.now() && p.e ? { ...p, t } : null; } catch { return null; } })();
  const prefill = (() => { try { const p = JSON.parse(localStorage.getItem('llp-prefill') || 'null'); return p && Date.now() - p.at < 30 * 864e5 ? p : null; } catch { return null; } })() || {};
  // From the leaflegal.co partner form (?h=…, encrypted): fill in the sign-up form. Merged in before the first render.
  const handoff = new URLSearchParams(location.search).get('h');
  const handoffReady = handoff ? fetch(`/api/platform?action=handoff&h=${encodeURIComponent(handoff)}`).then((r) => r.json()).then((d) => { for (const [k, v] of Object.entries(d || {})) if (v && !prefill[k]) prefill[k] = v; }).catch(() => {}) : Promise.resolve();


  // Cloudflare Turnstile (bot check). Off until the site key is set on the server (/api/platform?action=config).
  // A fresh, single-use token is made at each submit; resolves '' when switched off or if Cloudflare can't load.
  const ts = { key: undefined, id: null, box: null, wait: null };
  const humanToken = async (box) => {
    if (ts.key === undefined) { await configReady; ts.key = CONFIG.turnstile || null; }
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

  // ------------------------------------------------ sign in / sign up
  function signupView() {
    const inv = invite, pre = inv ? { company: inv.c || '', contactName: inv.n || '', email: inv.e, phone: inv.m || '' } : prefill;
    obShell(`<form class="pf-onb-form" novalidate><span class="pf-eyebrow">Step 1 of ${ALL_STEPS.length}</span>
        <h1>${inv ? `You’re invited, ${h(String(inv.n || '').split(' ')[0])}` : 'Create a law firm account'}</h1>
        <p class="pf-sub">${inv?.na ? 'Your details are filled in. Choose a password to get started. We check every new firm, usually within one working day.' : inv ? 'This account is already approved as a Leaflegal partner firm. Check the details, choose a password and you’re in.' : 'It takes a minute. We review every firm before it can buy leads.'}</p>
        ${inv ? `<p class="pf-prefilled">${I.check}${inv.na ? 'Invitation' : 'Approved partner firm invitation'} for ${h(inv.e)}</p>` : pre.company ? `<p class="pf-prefilled">${I.check}We've filled this in from your partner application.</p>` : ''}
        <div class="pf-two"><label>Full name<input name="contactName" autocomplete="name" value="${h(pre.contactName || '')}" required></label>
          <label>Firm name<input name="company" autocomplete="organization" value="${h(pre.company || '')}" required></label></div>
        <div class="pf-two"><label>Mobile number<input name="phone" type="tel" autocomplete="tel" inputmode="tel" placeholder="07700 900123" value="${h(pre.phone || '')}" required><span class="pf-hint">Not shown publicly. The firm’s public phone number can be different.</span></label>
          <label>Work email<input name="email" type="email" autocomplete="email" value="${h(pre.email || '')}"${inv ? ' readonly' : ''} required></label></div>
        <label>Password <span>(12+ characters with upper and lower case, a number and a symbol)</span><input name="password" type="password" autocomplete="new-password" required></label>
        <p class="pf-err" role="alert"></p><div class="pf-ts" id="pf-ts"></div>
        <div class="pf-onb-nav"><span class="pf-onb-alt">Already have an account? <a href="${P}/signin">Sign in</a></span><button class="pf-btn pf-btn-primary pf-btn-lg" type="submit">Create account${I.arrow}</button></div></form>`,
      0, `<a href="${P}/signin" class="pf-onb-skip">Sign in</a>`, 'https://leaflegal.co');
    const form = app.querySelector('form'), err = form.querySelector('.pf-err');
    form.addEventListener('submit', async (e) => {
      e.preventDefault(); err.textContent = '';
      const v = Object.fromEntries(new FormData(form));
      if (!v.company.trim() || !v.contactName.trim() || !v.email.trim()) { err.textContent = 'Please fill in your full name, firm name and work email.'; return; }
      if (!/^(\+44|0044|0)7\d{9}$/.test(v.phone.replace(/[\s()-]/g, ''))) { err.textContent = 'Please enter a UK mobile number, such as 07700 900123.'; return; }
      const weak = pwProblem(v.password); if (weak) { err.textContent = `Your password needs ${weak}`; return; }
      const btn = form.querySelector('button[type=submit]'); btn.disabled = true; btn.classList.add('busy');
      try {
        await api('signup', { ...v, fbp: (document.cookie.match(/(?:^|; )_fbp=([^;]+)/) || [])[1] || '', ...(inv ? { invite: inv.t } : { turnstile: await humanToken(form.querySelector('#pf-ts')) }) });
        await auth('password', { email: v.email.trim(), password: v.password });
        nav('onboarding');
      } catch (ex) { err.textContent = ex.message; btn.disabled = false; btn.classList.remove('busy'); }
    });
  }

  // Team invite (/join?t=…): choose a name and password, then sign straight in.
  async function joinView() {
    const t = new URLSearchParams(location.search).get('t') || '';
    app.className = 'pf-onb pf-signin';
    const frame = (inner) => `<header class="pf-onb-top"><a href="https://leaflegal.co" class="pf-onb-logo" aria-label="Leaflegal">${LOGO}</a><a href="${P}/signin" class="pf-onb-skip">Sign in</a></header>
      <main class="pf-onb-main"><div class="pf-onb-card pf-signin-card">${inner}</div></main>`;
    let inv;
    try { const r = await fetch(`/api/platform?action=join&t=${encodeURIComponent(t)}`); inv = await r.json(); if (!r.ok) throw new Error(inv.error || 'This invite isn’t valid'); }
    catch (ex) { app.innerHTML = frame(`<div class="pf-onb-form"><h1>Invite not found</h1><p class="pf-sub">${h(ex.message)}</p><a class="pf-btn pf-btn-primary" href="${P}/signin">Go to sign in</a></div>`); return; }
    app.innerHTML = frame(`<form class="pf-onb-form" novalidate><h1>Join ${h(inv.company)}</h1><p class="pf-sub">You’ve been given a sign-in to ${h(inv.company)}’s Leaflegal Platform account.</p>
        <p class="pf-prefilled">${I.check}Invitation for ${h(inv.email)}</p>
        <label>Full name<input name="name" autocomplete="name" value="${h(inv.name || '')}" required></label>
        <label>Password <span>(12+ characters with upper and lower case, a number and a symbol)</span><input name="password" type="password" autocomplete="new-password" required></label>
        <p class="pf-err" role="alert"></p>
        <button class="pf-btn pf-btn-primary pf-btn-lg" type="submit">Join and sign in${I.arrow}</button></form>`);
    const form = app.querySelector('form'), err = form.querySelector('.pf-err');
    form.addEventListener('submit', async (e) => {
      e.preventDefault(); err.textContent = '';
      const v = Object.fromEntries(new FormData(form));
      const weak = pwProblem(v.password); if (weak) { err.textContent = `Your password needs ${weak}`; return; }
      const btn = form.querySelector('button'); btn.disabled = true; btn.classList.add('busy');
      try { await api('join', { t, name: v.name, password: v.password }); await auth('password', { email: inv.email, password: v.password }); history.replaceState(null, '', `${P}/dashboard`); route(); }
      catch (ex) { err.textContent = ex.message; btn.disabled = false; btn.classList.remove('busy'); }
    });
  }

  function authView(mode = 'in') {
    if (mode === 'up') return signupView();
    // Same frame as sign-up and onboarding: green top bar, white card on the light background.
    app.className = 'pf-onb pf-signin';
    app.innerHTML = `<header class="pf-onb-top"><a href="https://leaflegal.co" class="pf-onb-logo" aria-label="Leaflegal">${LOGO}</a>
        <a href="${P}/register" class="pf-onb-skip">Create an account</a></header>
      <main class="pf-onb-main"><div class="pf-onb-card pf-signin-card"><form class="pf-onb-form" novalidate>
        <h1>Sign in</h1><p class="pf-sub">Leaflegal Platform for law firms.</p>
        <label>Work email<input name="email" type="email" autocomplete="email" required></label>
        <label>Password<input name="password" type="password" autocomplete="current-password" required></label>
        <p class="pf-err" role="alert"></p>
        <button class="pf-btn pf-btn-primary pf-btn-lg" type="submit">Sign in${I.arrow}</button>
        <p class="pf-switch">New to Leaflegal? <a href="${P}/register">Create an account</a></p>
      </form></div>
      <ul class="pf-signin-points"><li>${I.target}Exclusive enquiries, sold to one firm only</li><li>${I.spark}Auto-buy by practice area, matter and region</li><li>${I.webhook}Delivered to inbox and case management instantly</li></ul></main>`;
    const form = app.querySelector('form'), err = form.querySelector('.pf-err');
    form.addEventListener('submit', async (e) => {
      e.preventDefault(); err.textContent = '';
      const v = Object.fromEntries(new FormData(form));
      const btn = form.querySelector('button'); btn.disabled = true; btn.classList.add('busy');
      try { await auth('password', { email: v.email.trim(), password: v.password }); nav('dashboard'); }
      catch (ex) { err.textContent = ex.message === 'Invalid login credentials' ? 'Wrong email or password.' : ex.message; btn.disabled = false; btn.classList.remove('busy'); }
    });
  }

  // ------------------------------------------------ shell
  let me = null, opts = null, packs = null, pricing = null, custom = null, trial = null, acting = null, low = 300;
  const NAV = [['dashboard', 'Dashboard', 'home'], ['opportunities', 'Opportunities', 'inbox'], ['leads', 'My leads', 'layers'], ['autobuy', 'Auto-buy', 'spark'], ['profile', 'Profile', 'star'], ['billing', 'Billing', 'coins'], ['notifications', 'Notifications', 'bell'], ['account', 'Account', 'user']];
  const TITLES = { dashboard: 'Dashboard', opportunities: 'Opportunities', leads: 'My leads', autobuy: 'Auto-buy', billing: 'Billing', credits: 'Billing', profile: 'Public profile', account: 'Account', notifications: 'Notifications', admin: 'Admin', crm: 'CRM' };
  // Team members only see what their permissions allow; the account owner (no me.member) sees everything.
  const can = (p) => !me?.member || !!me.member.perms?.[p];
  const TAB_NEED = { autobuy: 'settings', profile: 'settings', notifications: 'settings', billing: 'billing', credits: 'billing', onboarding: 'billing' };
  function shell(tab, inner = '<div class="pf-skel"></div><div class="pf-skel pf-skel-2"></div>') {
    app.className = 'pf-shell';
    const items = NAV.filter(([k]) => !TAB_NEED[k] || can(TAB_NEED[k])).concat(me.is_admin ? [['crm', 'CRM', 'team']] : []);
    let grpOpen = tab === 'admin'; try { grpOpen = grpOpen || localStorage.getItem('pf-adm-open') === '1'; } catch {}
    const admGroup = me.is_admin ? `<div class="pf-navgrp ${grpOpen ? 'open' : ''}"><a href="${P}/admin" class="pf-navgrp-h ${tab === 'admin' ? 'on' : ''}" aria-expanded="${grpOpen}" aria-controls="pf-adm-nav" data-grp>${I.shield}<span>Admin</span><i class="pf-chev">${I.chev}</i></a>
      <div class="pf-navgrp-in" id="pf-adm-nav">${ADM.map(([k, l, i]) => `<a href="${P}/admin/${k}" class="${tab === 'admin' && adminTab === k ? 'on' : ''}" ${tab === 'admin' && adminTab === k ? 'aria-current="page"' : ''}>${I[i]}<span>${l}</span></a>`).join('')}</div></div>` : '';
    app.innerHTML = `<aside class="pf-side"><a href="${P}/dashboard" class="pf-logo-link" aria-label="Leaflegal Platform dashboard">${LOGO}</a><nav>${items.map(([k, l, i]) => `<a href="${P}/${k}" class="${k === tab ? 'on' : ''}" ${k === tab ? 'aria-current="page"' : ''}>${I[i]}<span>${l}</span></a>`).join('')}${admGroup}<button class="pf-nav-out" data-out>${I.out}<span>Sign out</span></button></nav>
      <div class="pf-side-credits"><span>Credit balance</span><b>${num(me.credits)}</b><a href="${P}/billing#plans" class="pf-btn pf-btn-orange pf-btn-sm">${I.arrow}Add credits</a></div>
      <div class="pf-side-foot"><span class="pf-avatar">${initials(me.company)}</span><div><b>${h(me.company)}</b><span>${h(me.email)}</span></div><button class="pf-iconbtn" data-out title="Sign out" aria-label="Sign out">${I.out}</button></div></aside>
      <main class="pf-main"><header class="pf-top"><h1>${TITLES[tab]}</h1>
        <a href="${P}/autobuy" class="pf-mode ${me.mode}"><i></i>${me.mode === 'auto' ? 'Auto-buy on' : 'Manual mode'}</a>
        <a href="${P}/billing" class="pf-balance">${I.coins}<b>${num(me.credits)}</b><span>credits</span></a></header>
        ${acting ? `<div class="pf-banner pf-banner-warn">${I.shield}<div><b>Editing ${h(acting.company)}’s account as an admin.</b> Changes you save here go straight to their account and are recorded in the activity log. <a href="${P}/profile">Profile</a> · <a href="${P}/autobuy">Auto-buy and delivery</a> · <a href="${P}/notifications">Notifications</a></div><button class="pf-btn pf-btn-primary pf-btn-sm" data-act-done>Done</button></div>` : ''}
        ${acting || me.agreementCurrent ? '' : `<div class="pf-banner pf-banner-go">${I.arrow}<div><b>Finish setting up the account.</b> Add the firm’s details and regulator, choose a plan and sign the referral agreement to start buying leads.</div><a class="pf-btn pf-btn-primary pf-btn-sm" href="${P}/onboarding">Continue setup</a></div>`}
        ${tab === 'dashboard' && me.agreementCurrent && (!me.profile?.show || profValid(me.profile)) ? `<div class="pf-banner pf-banner-go">${I.user}<div><b>Set up the public profile.</b> When a client is matched with the firm, we show them its logo and contact details and email them a copy. Without a profile they only see the firm name.</div><a class="pf-btn pf-btn-primary pf-btn-sm" href="${P}/profile">Set up profile</a></div>` : ''}
        ${!acting && tab !== 'billing' && me.approved && !me.suspended_at && me.agreementCurrent && me.credits < low ? `<div class="pf-banner pf-banner-warn" data-upsell>${I.coins}<div><b>${me.credits > 0 ? `Only ${num(me.credits)} credits left.` : 'You’re out of credits.'}</b> Upgrade your plan to keep buying leads${me.mode === 'auto' ? ' and keep auto-buy running' : ''}. The new plan’s credits are added straight away.</div><a class="pf-btn pf-btn-primary pf-btn-sm" href="${P}/billing#plans">Upgrade plan</a></div>` : ''}
        ${me.suspended_at ? `<div class="pf-banner pf-banner-warn">${I.clock}<div><b>This account is suspended.</b> Buying, auto-buy and new-lead emails are paused. Please contact <a href="mailto:hello@leaflegal.co">hello@leaflegal.co</a>.</div></div>` : ''}
        ${me.approved || me.suspended_at ? '' : `<div class="pf-banner">${I.clock}<div><b>This account is being reviewed.</b> Look around freely. Credits and leads can be bought once we’ve checked the firm and its regulator, usually within one working day.</div></div>`}
        <div class="pf-view">${inner}</div></main>`;
    app.querySelectorAll('[data-out]').forEach((b) => (b.onclick = signOut));
    app.querySelector('[data-grp]')?.addEventListener('click', (e) => { // desktop: the Admin heading opens and closes the group; phones follow the link
      if (matchMedia('(max-width:900px)').matches) return;
      e.preventDefault(); e.stopPropagation();
      const g = e.currentTarget.parentNode, o = g.classList.toggle('open'); e.currentTarget.setAttribute('aria-expanded', o);
      try { localStorage.setItem('pf-adm-open', o ? '1' : '0'); } catch {}
    });
    app.querySelector('[data-act-done]')?.addEventListener('click', () => { acting = null; cache.clear(); nav('admin/brokers'); });
    const sn = app.querySelector('.pf-side nav'), on = sn.querySelector('.on'); // phones: keep the current tab in view in the scrolling menu
    if (on && sn.scrollWidth > sn.clientWidth) sn.scrollLeft = on.offsetLeft - sn.offsetLeft - (sn.clientWidth - on.offsetWidth) / 2;
    // First month offer: nudge them onto the full plan (replaces the low-credit banner).
    const v = view();
    const lowNow = !acting && tab !== 'billing' && me.approved && !me.suspended_at && me.agreementCurrent && me.credits < low;
    if (!acting && (me.billing || lowNow) && tab !== 'billing') api('subscription').then(({ subscription: s }) => {
      if (!v.isConnected) return;
      if (s?.trial) {
        app.querySelector('[data-upsell]')?.remove();
        v.insertAdjacentHTML('beforebegin', `<div class="pf-banner pf-banner-go" data-upsell>${I.spark}<div><b>First month offer.</b> Upgrade to ${h(s.plan)} now to get ${num(s.credits)} credits today instead of waiting for ${s.renews ? new Date(s.renews).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' }) : 'your renewal'}.</div><a class="pf-btn pf-btn-primary pf-btn-sm" href="${P}/billing#plans">Upgrade now</a></div>`);
      }
      if (!lowNow) return;
      const msg = lowMsg(s);
      if (!s?.trial) app.querySelector('[data-upsell] > div')?.replaceWith(Object.assign(document.createElement('div'), { innerHTML: `<b>${msg.title}</b> ${msg.text}` }));
      lowPopup(msg);
    }).catch(() => {});
  }
  // Low credits (under `low`): when the plan next adds credits, and an upgrade nudge. Stripe plan, invoiced plan, or none.
  function lowMsg(s) {
    const d = (x) => new Date(x).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });
    const title = me.credits > 0 ? `Only ${num(me.credits)} credits left.` : 'You’re out of credits.';
    const auto = me.mode === 'auto' ? ' Auto-buy skips any lead you can’t afford.' : '';
    let next = '';
    if (s?.renews && s.status !== 'past_due') next = s.cancelling ? ` Your plan ends on ${d(s.renews)} and won’t add more credits.` : ` Your ${h(s.plan)} plan renews on <b>${d(s.renews)}</b> and adds <b>${num(s.credits)} credits</b>.`;
    else if (s?.status === 'past_due') next = ' Your last payment failed, so no more credits are added until your card is updated.';
    else if (me.plan?.credits && me.plan.next_at) next = ` Your plan adds <b>${num(me.plan.credits)} credits</b> on <b>${d(me.plan.next_at)}</b>.`;
    else next = ' You don’t have a monthly plan, so no more credits are on the way.';
    return { title, next, text: `${next.trim()}${auto} Upgrade your plan to get more credits straight away.`, auto };
  }
  // Once per sign-in session: a pop-up with the same message.
  function lowPopup(m) {
    const k = `pf-low-${me.id}`;
    try { if (sessionStorage.getItem(k)) return; sessionStorage.setItem(k, '1'); } catch {}
    if (modal.open) return;
    modal.className = 'pf-modal'; modal.onclick = null;
    modal.innerHTML = `<form method="dialog" class="pf-modal-in pf-low-pop"><span class="pf-low-ic">${I.coins}</span><h2>${m.title}</h2>
      <p>${m.next.trim()}</p><p>Upgrade your monthly plan and the new plan’s credits are added straight away, so you don’t miss the next matching lead.${m.auto}</p>
      <div class="pf-row"><button class="pf-btn" value="cancel">Not now</button><button class="pf-btn pf-btn-primary" value="ok">Upgrade plan</button></div></form>`;
    modal.onclose = () => { modal.onclose = null; if (modal.returnValue === 'ok') nav('billing#plans'); };
    modal.returnValue = ''; modal.showModal();
  }
  const view = () => app.querySelector('.pf-view');
  function signOut() { saveSession(null); me = null; cache.clear(); nav('signin'); route(); }
  const empty = (icon, title, text, cta = '') => `<div class="pf-empty"><span class="pf-empty-ic">${I[icon]}</span><h2>${title}</h2><p>${text}</p>${cta}</div>`;

  // ------------------------------------------------ shared: opportunity card + drawers
  // Masked contact (before purchase): initial, masked phone and email, with the live-check badges.
  const maskedContact = (c) => !c ? '' : `<div class="pf-masked"><span>${I.user}${h(c.name)}</span>
    <span>${I.phone}${h(c.phone)}${c.phoneLive || c.phoneValid ? `<i class="pf-ver" title="${c.phoneLive ? 'Number live on the network' : 'Valid UK mobile'}">${I.check}</i>` : ''}</span>
    <span>${I.mail}${h(c.email)}${c.emailVerified || c.emailChecked ? `<i class="pf-ver" title="${c.emailVerified ? 'Mailbox verified' : 'Email domain verified'}">${I.check}</i>` : ''}</span></div>`;
  const leadTitle = (l) => h(l.matter_label || matterName(l.area, l.matter) || l.area_label || areaName(l.area) || 'Enquiry');
  const oppCard = (l, compact) => { l = L(l); const area = l.area_label || areaName(l.area), urgent = isUrgent(l);
    return `<article class="pf-opp ${l.match ? 'is-match' : ''} ${l.discounted ? 'is-deal' : ''}" data-open="${l.id}" tabindex="0" role="button" aria-label="${leadTitle(l)}, ${h(area)}, ${h(l.region || '')}, ${l.price} credits${l.discounted ? `, 50% off, was ${l.list_price}` : ''}">${l.discounted ? '<span class="pf-deal-flag">50% off</span>' : ''}
    <div class="pf-opp-top"><span class="pf-pic">${aIcon(l.area)}</span><div class="pf-opp-meta"><b>${h(area)}</b><span>${mins(l.created_at) < 60 ? '<i class="pf-live"></i>' : ''}${ago(l.created_at)}</span></div>${compact ? '' : gradeBadge(l)}</div>
    <h3 class="pf-matter">${leadTitle(l)}</h3>
    ${compact ? `<p class="pf-opp-line">${h(where(l))} · ${h(l.urgency || 'No timescale given')}</p>` : `<div class="pf-pills">${l.urgency ? `<span class="pf-pill ${urgent ? 'pf-pill-hot' : ''}">${I.clock}${h(l.urgency)}</span>` : ''}${l.deadline ? `<span class="pf-pill pf-pill-hot">Deadline ${dueText(l.deadline)}</span>` : ''}<span class="pf-pill">${l.audience === 'business' ? 'Business client' : 'Individual client'}</span>${l.private_pay === 'yes' ? `<span class="pf-pill pf-pill-ok">${I.check}Private pay</span>` : l.private_pay === 'quote' ? '<span class="pf-pill">Pays if the cost is right</span>' : ''}</div>
    <dl class="pf-facts"><div><dt>Location</dt><dd>${h(where(l))}</dd></div>${l.value_band ? `<div><dt>${h(l.value_label || 'Value')}</dt><dd>${h(l.value_band)}</dd></div>` : l.deadline ? `<div><dt>Deadline</dt><dd>${dueText(l.deadline)}</dd></div>` : ''}</dl>
    ${tagList(l.tags)}
    ${l.answers?.length ? `<details class="pf-answers" data-noopen><summary>${num(l.answers.length)} qualifying answer${l.answers.length === 1 ? '' : 's'}</summary>${answersList(l.answers)}</details>` : ''}
    ${l.companies_house ? `<p class="pf-chline">${I.check}Companies House ${h(l.companies_house.type || 'company')}${l.companies_house.incorporated ? ` since ${l.companies_house.incorporated.slice(0, 4)}` : ''}</p>` : ''}
    ${maskedContact(l.contact)}`}
    <div class="pf-opp-foot">${compact ? gradeBadge(l) : l.match ? `<span class="pf-matchtag">${I.target}Fits the criteria</span>` : '<span class="pf-opp-view">View details</span>'}<span class="pf-price">${l.discounted ? `<s>${l.list_price}</s>` : ''}${l.price}<small>credits</small></span></div></article>`; };
  const wireOpps = (root, list, after) => root.querySelectorAll('[data-open]').forEach((c) => {
    const go = (e) => { if (e?.target.closest('[data-noopen]')) return; oppDrawer(list.find((l) => l.id === +c.dataset.open), after); };
    c.onclick = go; c.onkeydown = (e) => (e.key === 'Enter' || e.key === ' ') && !e.target.closest('[data-noopen]') && (e.preventDefault(), go());
  });

  function drawer(html) {
    modal.className = 'pf-drawer'; modal.onclose = null;
    modal.innerHTML = `<div class="pf-drawer-in"><button class="pf-iconbtn pf-drawer-x" aria-label="Close" data-close>${I.x}</button>${html}</div>`;
    modal.querySelector('[data-close]').onclick = () => modal.close();
    modal.onclick = (e) => { if (e.target === modal) modal.close(); };
    if (!modal.open) modal.showModal();
  }
  // Price with the original struck through when the 72-hour discount applies.
  const priceTag = (l, unit = '') => l.discounted ? `<span class="pf-was">${l.list_price}</span> <b class="pf-now">${l.price}${unit}</b> <span class="pf-off">50% off</span>` : `${l.price}${unit}`;
  // Companies House block for business leads. Before purchase (full = false) the server sends no name, number or address.
  const CH_STATUS = { active: 'Active', dissolved: 'Dissolved', liquidation: 'In liquidation', administration: 'In administration', 'voluntary-arrangement': 'Voluntary arrangement', receivership: 'In receivership' };
  const monthYear = (d) => (d ? new Date(d).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }) : '–');
  const yearsSince = (d) => { const y = Math.floor((Date.now() - Date.parse(d)) / (365.25 * 864e5)); return y >= 1 ? `${y} year${y === 1 ? '' : 's'}` : 'under a year'; };
  const yn = (v, yes, no) => (v ? `<span class="pf-chwarn">${yes}</span>` : no);
  const chBlock = (c, full) => !c ? '' : `<section class="pf-ch"><div class="pf-ch-h"><b>${I.shield}Companies House</b><span>From the public register${full ? '' : ' · name and number unlock when bought'}</span></div>
    ${facts([
      ...(full ? [['Company name', h(c.name || '–')], ['Company number', h(c.number)]] : []),
      ['Company type', h(c.type || '–')], ['Status', h(CH_STATUS[c.status] || c.status || '–')],
      ['Incorporated', c.incorporated ? `${c.incorporated.length === 4 ? c.incorporated : monthYear(c.incorporated)} (${yearsSince(c.incorporated)})` : '–'],
      ...(c.checked ? [['Registered in', h(c.locality || '–')], ['Industry', h((c.industries || []).join(', ') || '–')],
        ['Filings', c.accounts_overdue || c.confirmation_overdue ? yn(true, [c.accounts_overdue && 'Accounts overdue', c.confirmation_overdue && 'Confirmation statement overdue'].filter(Boolean).join(', ')) : 'Up to date'],
        ['Insolvency history', yn(c.insolvency_history, 'Yes', 'None')]] : []),
      ...(c.director_listed != null ? [[c.listed_as === 'company secretary' ? 'Company secretary' : 'Director', c.director_listed ? (full && c.director ? `${h(c.director)}, listed ${c.listed_as || 'director'}` : `The client is a listed ${c.listed_as || 'director'}`) : 'The client isn’t listed as a director']] : []),
      ...(full && c.address ? [['Registered office', h(c.address)]] : []),
    ])}
    ${full && c.url ? `<a class="pf-btn pf-btn-sm" href="${h(c.url)}" target="_blank" rel="noopener">View on Companies House${I.arrow}</a>` : ''}</section>`;
  const facts = (rows) => `<dl class="pf-facts pf-facts-lg">${rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>`;
  // The enquiry itself, shared by the marketplace drawer, My leads and admin.
  const enquiryFacts = (l, extra = []) => facts([['Practice area', h(l.area_label || areaName(l.area))], ['Matter', leadTitle(l)], ['Client', audName(l.audience)], ['Urgency', h(l.urgency || '–')],
    ...(l.deadline ? [['Deadline', `<span class="pf-chwarn">${dueText(l.deadline)}</span>`]] : []), ['Location', h(where(l))], ...(l.value_band ? [[h(l.value_label || 'Value'), h(l.value_band)]] : []), ['Paying privately', payName(l.private_pay)], ...extra]);
  function oppDrawer(l, after) {
    if (!l) return; l = L(l);
    const shortOf = me.credits < l.price;
    drawer(`<div class="pf-dh"><span class="pf-pic pf-pic-lg">${aIcon(l.area)}</span><div><span class="pf-eyebrow">Lead #${l.id} · ${ago(l.created_at)} · ${h(l.area_label || areaName(l.area))}</span><h2>${leadTitle(l)}</h2></div></div>
      <div class="pf-dscore"><div class="pf-ring pf-q-${l.grade === 'A' ? 'hi' : l.grade === 'B' ? 'mid' : 'lo'}" style="--v:${l.score ?? 50}"><b>${h(l.grade || '–')}</b></div><div><b>Grade ${h(l.grade || '–')}${l.score != null ? ` · score ${l.score}` : ''}</b><p>Based on how complete and specific the answers are, how soon help is needed and the contact checks.</p></div></div>
      ${enquiryFacts(l)}
      ${tagList(l.tags)}
      <h3 class="pf-dsec">Qualifying answers</h3>${answersList(l.answers)}
      ${l.has_summary ? `<div class="pf-locked pf-locked-soft">${I.doc}<div><b>The client also wrote a summary in their own words.</b><span>It can identify them, so it unlocks with the contact details.</span></div></div>` : ''}
      ${chBlock(l.companies_house, false)}
      ${l.contact ? `<div class="pf-mcontact"><div class="pf-mc-h"><b>Contact details</b><span>${I.shield}Revealed in full when bought</span></div>
        <ul><li>${I.user}<span>Name</span><b>${h(l.contact.name)}</b></li>
        <li>${I.phone}<span>Mobile</span><b>${h(l.contact.phone)}</b>${l.contact.phoneLive ? `<em class="pf-verb">${I.check}Number live</em>` : l.contact.phoneValid ? `<em class="pf-verb">${I.check}Valid UK mobile</em>` : ''}</li>
        <li>${I.mail}<span>Email</span><b>${h(l.contact.email)}</b>${l.contact.emailVerified ? `<em class="pf-verb">${I.check}Mailbox verified</em>` : l.contact.emailChecked ? `<em class="pf-verb">${I.check}Domain verified</em>` : ''}</li></ul></div>` : ''}
      ${!me.approved ? '<p class="pf-hint">Masked contact details appear once the firm is approved.</p>' : ''}
      <div class="pf-locked">${I.shield}<div><b>Full name, phone, email, full postcode${l.audience === 'business' ? ', business name' : ''} and the client’s summary unlock when bought.</b><span>Exclusive. Once bought, it disappears for every other firm. Check for conflicts before discussing the matter.</span></div></div>
      ${l.discounted ? `<div class="pf-dealnote"><b>50% off</b><span>This lead has been live for over 72 hours, so it’s half price. <s>${l.list_price}</s> ${l.price} credits.</span></div>` : ''}
      <div class="pf-dfoot"><div><span>Price</span><b>${priceTag(l, ' credits')}</b><span>Balance ${num(me.credits)}</span></div>
        ${me.restricted ? '<button class="pf-btn pf-btn-primary pf-btn-lg" disabled title="Leads for this account are assigned by Leaflegal">Assigned by Leaflegal</button>'
          : !can('buy') ? '<button class="pf-btn pf-btn-primary pf-btn-lg" disabled title="Ask the account owner for buying permission">Buying not allowed</button>'
          : !me.approved ? '<button class="pf-btn pf-btn-primary pf-btn-lg" disabled>Awaiting approval</button>'
          : shortOf ? `<a class="pf-btn pf-btn-orange pf-btn-lg" href="${P}/billing">Upgrade plan to buy</a>`
          : `<button class="pf-btn pf-btn-primary pf-btn-lg" data-buy>Buy lead${I.arrow}</button>`}</div>`);
    modal.querySelector('[data-buy]')?.addEventListener('click', async (e) => {
      const b = e.currentTarget; b.disabled = true; b.classList.add('busy');
      try {
        const { lead } = await api('buy', { id: l.id });
        modal.close(); toast(`Lead bought. ${lead?.contact_name || lead?.full_name || leadTitle(l)} is in My leads.`);
        openLead = lead?.id || l.id; nav('leads');
      } catch (ex) { toast(ex.message, true); modal.close(); after?.(); }
    });
  }

  // ------------------------------------------------ dashboard
  const hello = () => { const hr = new Date().getHours(); return hr < 12 ? 'Good morning' : hr < 18 ? 'Good afternoon' : 'Good evening'; };
  function bars(days) {
    const max = Math.max(1, ...days.map((d) => d.n)), w = 100 / days.length;
    return `<div class="pf-bars-wrap"><svg class="pf-bars" viewBox="0 0 100 40" preserveAspectRatio="none" role="img" aria-label="Leads bought per day over the last 30 days">
      ${days.map((d, i) => { const ht = d.n ? Math.max(4, (d.n / max) * 38) : 1; return `<rect x="${(i * w + w * 0.2).toFixed(2)}" y="${(40 - ht).toFixed(2)}" width="${(w * 0.6).toFixed(2)}" height="${ht.toFixed(2)}" rx="0.6" class="${d.n ? 'on' : ''}"><title>${d.day}: ${d.n} lead${d.n === 1 ? '' : 's'}</title></rect>`; }).join('')}</svg>
      <div class="pf-bars-x"><span>${new Date(days[0].day).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span><span>Today</span></div></div>`;
  }
  async function dashboard() {
    shell('dashboard');
    const d = await api('dashboard');
    const capPct = d.monthly_cap ? Math.min(100, (d.auto_spend / d.monthly_cap) * 100) : 0;
    const totalStage = Math.max(1, ...Object.values(d.stages || {}));
    const first = (me.contact_name || me.company || '').split(' ')[0];
    view().innerHTML = `<div class="pf-hello"><div><h2>${hello()}${first ? `, ${h(first)}` : ''}</h2>
        <p>${d.matching ? `<b>${d.matching} live lead${d.matching === 1 ? '' : 's'}</b> match${d.matching === 1 ? 'es' : ''} the firm’s criteria right now.` : d.live ? `${d.live} live lead${d.live === 1 ? ' is' : 's are'} on the marketplace.` : 'No live leads right now. New ones arrive throughout the day.'}</p></div>
        <a href="${P}/opportunities" class="pf-btn pf-btn-primary">${I.inbox}Browse opportunities</a></div>
      <div class="pf-kpis">
        <a href="${P}/billing" class="pf-kpi pf-kpi-dark"><span>${I.coins}Credit balance</span><b>${num(d.credits)}</b><em>View billing ${I.arrow}</em></a>
        <div class="pf-kpi"><span>${I.layers}Leads this month</span><b>${d.month.leads}</b><em>${d.month.auto} auto-bought</em></div>
        <div class="pf-kpi"><span>${I.spark}Credits spent this month</span><b>${num(d.month.spent)}</b>${d.monthly_cap ? `<div class="pf-meter"><i style="width:${capPct}%"></i></div><em>${num(d.auto_spend)} of ${num(d.monthly_cap)} auto-buy limit</em>` : `<em>${d.mode === 'auto' ? 'No monthly limit set' : 'Auto-buy is off'}</em>`}</div>
        <div class="pf-kpi"><span>${I.check}Instructed</span><b>${num(d.total?.instructed ?? d.stages?.instructed ?? 0)}</b><em>${d.total?.instructed_value ? `${gbp(d.total.instructed_value)} in fees recorded` : `from ${num(d.total?.leads || 0)} lead${d.total?.leads === 1 ? '' : 's'} bought`}</em></div>
      </div>
      <div class="pf-dash">
        <section class="pf-card pf-chart"><div class="pf-card-h"><h3>Leads bought</h3><span>Last 30 days</span></div>${bars(d.days)}</section>
        <section class="pf-card"><div class="pf-card-h"><h3>Pipeline</h3><a href="${P}/leads">View all</a></div>
          <div class="pf-funnel">${STAGES.map(([k, n]) => `<a href="${P}/leads" data-stage="${k}" class="pf-fun-row"><span class="pf-dot pf-st-${k}"></span><span>${n}</span><i><b style="width:${((d.stages?.[k] || 0) / totalStage) * 100}%" class="pf-st-${k}"></b></i><em>${d.stages?.[k] || 0}</em></a>`).join('')}</div></section>
        <section class="pf-card pf-span2"><div class="pf-card-h"><h3>${d.matching ? 'Leads that fit the criteria' : 'Latest opportunities'}</h3><a href="${P}/opportunities">See all</a></div>
          ${d.top.length ? `<div class="pf-grid pf-grid-3">${d.top.map((l) => oppCard(l, true)).join('')}</div>` : empty('inbox', 'Nothing live right now', 'Turn on auto-buy and we’ll pick up matching enquiries the moment they arrive.', `<a class="pf-btn" href="${P}/autobuy">Set up auto-buy</a>`)}</section>
        <section class="pf-card"><div class="pf-card-h"><h3>Recent activity</h3><a href="${P}/billing">History</a></div>
          ${d.recent.length ? `<ul class="pf-feed">${d.recent.map((e) => `<li><span class="pf-feed-ic ${e.delta > 0 ? 'plus' : ''}">${e.delta > 0 ? I.plus : e.reason.startsWith('Auto') ? I.spark : I.layers}</span><div><b>${h(e.reason)}${e.lead_id ? ` #${e.lead_id}` : ''}</b><span>${ago(e.created_at)}</span></div><em class="${e.delta > 0 ? 'pf-plus' : ''}">${e.delta > 0 ? '+' : ''}${num(e.delta)}</em></li>`).join('')}</ul>` : '<p class="pf-hint">No activity yet.</p>'}</section>
      </div>`;
    wireOpps(view(), d.top, dashboard);
    view().querySelectorAll('[data-stage]').forEach((a) => a.addEventListener('click', () => (stageFilter = a.dataset.stage)));
  }

  // ------------------------------------------------ opportunities
  const OPP_DEFAULT = { mine: false, deal: false, sort: 'new', area: '', matter: '', region: '', urgency: '', audience: '', grade: '', value: '', pay: '', price: '', q: '' };
  let oppState = { ...OPP_DEFAULT };
  try { oppState = { ...OPP_DEFAULT, ...JSON.parse(localStorage.getItem('llp-opp-filters2') || '{}') }; } catch {}
  // Value ranges (pounds): a lead fits when its stated value overlaps the range. Leads with no value only show under "Any value".
  const VALUES = [['', 'Any value'], ['0-100000', 'Under £100k'], ['100000-250000', '£100k to £250k'], ['250000-500000', '£250k to £500k'], ['500000-1000000', '£500k to £1m'], ['1000000-', '£1m+']];
  const inValue = (k, l) => { if (!k) return true; if (l.value_min == null && l.value_max == null) return false;
    const [lo, hi] = k.split('-').map((x) => (x === '' ? null : +x)), vmin = l.value_min ?? l.value_max, vmax = l.value_max ?? l.value_min;
    return vmax >= (lo || 0) && (hi == null || vmin < hi); };
  const leadText = (l) => [l.area_label, areaName(l.area), l.matter_label, matterName(l.area, l.matter), l.region, l.postcode_district, l.urgency, l.value_band, ...(l.tags || []), ...(l.answers || []).flatMap((x) => [x.q, x.a])].join(' ').toLowerCase();
  const GRADE_TEXT = { A: 'Grade A', B: 'Grade B', C: 'Grade C' };
  const sel = (key, label, options) => `<label class="pf-select pf-fsel ${oppState[key] ? 'is-set' : ''}"><span class="pf-vh">${label}</span><select data-f="${key}" aria-label="${h(label)}">${options.map(([v, t]) => `<option value="${h(v)}" ${String(oppState[key]) === String(v) ? 'selected' : ''}>${h(t)}</option>`).join('')}</select></label>`;
  async function opportunities() {
    shell('opportunities');
    const { leads: raw } = await api('opportunities');
    const leads = raw.map(L);
    let qt;
    const draw = (focusQ) => {
      try { localStorage.setItem('llp-opp-filters2', JSON.stringify(oppState)); } catch {}
      const o = oppState, q = o.q.trim().toLowerCase(), U = TX.urgency;
      let list = leads.filter((l) => (!o.mine || l.match) && (!o.deal || l.discounted) && (!o.area || l.area === o.area) && (!o.matter || l.matter === o.matter)
        && (!o.region || l.region === o.region) && (!o.urgency || l.urgency === o.urgency) && (!o.audience || l.audience === o.audience) && (!o.grade || l.grade === o.grade)
        && inValue(o.value, l) && (!o.pay || l.private_pay === 'yes') && (!o.price || l.price <= +o.price) && (!q || q.split(/\s+/).every((w) => leadText(l).includes(w))));
      const rank = (l) => (l.deadline ? new Date(l.deadline).getTime() / 1e5 : 1e9) + (U.indexOf(l.urgency) + 1 || 9) * 1e8;
      const sorts = { urgent: (a, b) => rank(a) - rank(b), grade: (a, b) => (a.grade || 'Z').localeCompare(b.grade || 'Z') || (b.score || 0) - (a.score || 0), price: (a, b) => a.price - b.price, value: (a, b) => (b.value_min || 0) - (a.value_min || 0) };
      if (sorts[o.sort]) list = list.slice().sort(sorts[o.sort]);
      const active = ['area', 'matter', 'region', 'urgency', 'audience', 'grade', 'value', 'pay', 'price', 'deal', 'q'].filter((k) => o[k]).length;
      const deals = leads.filter((l) => l.discounted).length, area = areaOf(o.area);
      const areasHere = TX.areas.filter((a) => leads.some((l) => l.area === a.slug) || a.slug === o.area);
      view().innerHTML = `<div class="pf-toolbar">
          <div class="pf-seg" role="group" aria-label="Show"><button class="${o.mine ? '' : 'on'}" data-mine="0">All <em>${leads.length}</em></button><button class="${o.mine ? 'on' : ''}" data-mine="1">${I.target}Fits the criteria <em>${leads.filter((l) => l.match).length}</em></button></div>
          <div class="pf-tool-r">${deals ? `<button class="pf-dealbtn ${o.deal ? 'on' : ''}" data-deal aria-pressed="${!!o.deal}">50% off <em>${deals}</em></button>` : ''}${sel('sort', 'Sort', [['new', 'Newest first'], ['urgent', 'Most urgent'], ['grade', 'Best grade'], ['value', 'Highest value'], ['price', 'Lowest price']])}</div></div>
        <div class="pf-filters" role="group" aria-label="Filter opportunities">
          <label class="pf-select pf-fsel pf-fsearch ${o.q ? 'is-set' : ''}"><span class="pf-vh">Search the answers</span><input type="search" data-q value="${h(o.q)}" placeholder="Search answers, e.g. leasehold or tribunal" aria-label="Search the answers"></label>
          ${sel('area', 'Practice area', [['', 'Any practice area'], ...(areasHere.length ? areasHere : TX.areas).map((a) => [a.slug, a.label])])}
          ${area ? sel('matter', 'Matter', [['', `Any ${area.label.toLowerCase()} matter`], ...area.matters]) : ''}
          ${sel('region', 'Region', [['', 'Any region'], ...TX.regions.map((r) => [r, r])])}
          ${sel('urgency', 'Urgency', [['', 'Any urgency'], ...U.map((u) => [u, u])])}
          ${sel('audience', 'Client', [['', 'Individuals and businesses'], ['individual', 'Individuals'], ['business', 'Businesses']])}
          ${sel('grade', 'Grade', [['', 'Any grade'], ...TX.grades.map((g) => [g, GRADE_TEXT[g] || g])])}
          ${sel('value', 'Value', VALUES)}
          ${sel('pay', 'Private pay', [['', 'Any payment'], ['yes', 'Can pay privately']])}
          ${sel('price', 'Maximum price', [['', 'Any price'], ['50', 'Up to 50 credits'], ['75', 'Up to 75 credits'], ['100', 'Up to 100 credits'], ['150', 'Up to 150 credits']])}
          ${active ? `<button class="pf-btn pf-btn-sm pf-clear" data-clear>${I.x}Clear ${active} filter${active === 1 ? '' : 's'}</button>` : ''}
        </div>
        <p class="pf-count">${list.length === leads.length ? `Showing all ${leads.length} live lead${leads.length === 1 ? '' : 's'}` : `Showing <b>${list.length}</b> of ${leads.length} live leads`}</p>
        ${list.length ? `<div class="pf-grid">${list.map((l) => oppCard(l)).join('')}</div>`
          : empty('inbox', active || o.mine ? 'No leads match these filters' : 'No live leads right now', active || o.mine ? 'Try widening or clearing the filters.' : 'New enquiries appear here the moment they come in. Each lead is sold to one firm only, so turn on auto-buy to get first pick.', active || o.mine ? '<button class="pf-btn" data-clear>Clear filters</button>' : `<a class="pf-btn" href="${P}/autobuy">Set up auto-buy</a>`)}`;
      view().querySelectorAll('[data-mine]').forEach((b) => (b.onclick = () => { o.mine = b.dataset.mine === '1'; draw(); }));
      view().querySelectorAll('[data-deal]').forEach((b) => (b.onclick = () => { o.deal = !o.deal; draw(); }));
      view().querySelectorAll('[data-f]').forEach((el) => (el.onchange = () => { o[el.dataset.f] = el.value; if (el.dataset.f === 'area') o.matter = ''; draw(); }));
      const qi = view().querySelector('[data-q]');
      qi.oninput = () => { clearTimeout(qt); qt = setTimeout(() => { o.q = qi.value; draw(true); }, 250); };
      if (focusQ) { qi.focus(); qi.setSelectionRange(qi.value.length, qi.value.length); }
      view().querySelectorAll('[data-clear]').forEach((b) => (b.onclick = () => { oppState = { ...OPP_DEFAULT, sort: o.sort }; draw(); }));
      wireOpps(view(), list, opportunities);
    };
    draw();
  }

  // ------------------------------------------------ my leads (pipeline)
  let stageFilter = '', myLeads = [], openLead = null, leadPeriod = 'all', leadFrom = '', leadTo = '', leadBasis = 'bought', leadQ = '', leadArea = '', leadRegion = '';
  const LEAD_PERIODS = [['all', 'All time'], ['today', 'Today'], ['7', 'Last 7 days'], ['30', 'Last 30 days'], ['month', 'This month'], ['last', 'Last month'], ['since', 'Since last export'], ['custom', 'Custom dates']];
  // Bought-time range for My leads, in local time. "since" = after the last export (everything if never exported).
  const leadRange = () => {
    const now = new Date(), d0 = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; }, y = now.getFullYear(), m = now.getMonth();
    if (leadPeriod === 'today') return [d0(now), now];
    if (leadPeriod === '7' || leadPeriod === '30') return [new Date(d0(now) - (Number(leadPeriod) - 1) * 864e5), now];
    if (leadPeriod === 'month') return [new Date(y, m, 1), now];
    if (leadPeriod === 'last') return [new Date(y, m - 1, 1), new Date(new Date(y, m, 1) - 1)];
    if (leadPeriod === 'since') return [me.leads_exported_at ? new Date(new Date(me.leads_exported_at).getTime() + 1) : new Date(0), now];
    if (leadPeriod === 'custom' && leadFrom && leadTo) return [new Date(`${leadFrom}T00:00:00`), new Date(`${leadTo}T23:59:59.999`)];
    return [new Date(0), new Date(8.64e15)];
  };
  async function leads() {
    shell('leads');
    ({ leads: myLeads } = await api('leads'));
    myLeads = myLeads.map(L);
    const draw = () => {
      const [from, to] = leadRange(), q = leadQ.toLowerCase();
      const inRange = myLeads.filter((l) => { const t = new Date(leadBasis === 'generated' ? l.received_at : l.purchased_at); return t >= from && t <= to; })
        .filter((l) => (!leadArea || l.area === leadArea) && (!leadRegion || l.region === leadRegion)
          && (!q || [l.contact_name, l.business_name, l.email, l.phone, l.postcode, l.matter_label, `#${l.id}`].join(' ').toLowerCase().includes(q)));
      const live = inRange.filter((l) => !l.archived_at), archived = inRange.filter((l) => l.archived_at);
      const counts = Object.fromEntries(STAGES.map(([k]) => [k, live.filter((l) => l.stage === k).length]));
      const list = stageFilter === 'archived' ? archived : live.filter((l) => !stageFilter || l.stage === stageFilter);
      const areas = TX.areas.filter((a) => myLeads.some((l) => l.area === a.slug)).map((a) => [a.slug, a.label]);
      const regions = TX.regions.filter((r) => myLeads.some((l) => l.region === r)).map((r) => [r, r]);
      const fsel = (attr, val, any, opts) => `<label class="pf-select"><select ${attr} aria-label="${any}"><option value="">${any}</option>${opts.map(([v, t]) => `<option value="${h(v)}" ${v === val ? 'selected' : ''}>${h(t)}</option>`).join('')}</select></label>`;
      const lastExp = me.leads_exported_at ? new Date(me.leads_exported_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'never';
      view().innerHTML = myLeads.length ? `<div class="pf-toolbar"><div class="pf-period">
          <label class="pf-select"><select data-lb aria-label="Date"><option value="bought" ${leadBasis === 'bought' ? 'selected' : ''}>Date bought</option><option value="generated" ${leadBasis === 'generated' ? 'selected' : ''}>Date enquired</option></select></label>
          <label class="pf-select"><select data-lp aria-label="Period">${LEAD_PERIODS.map(([k, n]) => `<option value="${k}" ${leadPeriod === k ? 'selected' : ''}>${k === 'since' ? `Since last export (${lastExp})` : n}</option>`).join('')}</select></label>
          ${leadPeriod === 'custom' ? `<input type="date" data-lf value="${leadFrom}" aria-label="From"><span>to</span><input type="date" data-lt value="${leadTo}" aria-label="To">` : ''}</div>
          <button class="pf-btn" data-csv ${list.length ? '' : 'disabled'} title="Exports the leads shown, using the dates, stage and filters picked">${I.download}Export ${num(list.length)} lead${list.length === 1 ? '' : 's'} (CSV)</button></div>
        <div class="pf-toolbar pf-lfilters"><label class="pf-select pf-lsearch"><input type="search" data-lq placeholder="Search name, phone, email or postcode" value="${h(leadQ)}" aria-label="Search leads"></label>
          ${fsel('data-larea', leadArea, 'Any practice area', areas)}${fsel('data-lreg', leadRegion, 'Any region', regions)}
          ${leadQ || leadArea || leadRegion ? `<button class="pf-btn pf-btn-sm" data-lclr>${I.x}Clear</button>` : ''}</div>
        <div class="pf-toolbar"><div class="pf-seg pf-seg-scroll" role="group" aria-label="Stage">
          <button class="${stageFilter ? '' : 'on'}" data-st="">All <em>${live.length}</em></button>${STAGES.map(([k, n]) => `<button class="${stageFilter === k ? 'on' : ''}" data-st="${k}"><span class="pf-dot pf-st-${k}"></span>${n} <em>${counts[k]}</em></button>`).join('')}<button class="${stageFilter === 'archived' ? 'on' : ''}" data-st="archived">Archived <em>${archived.length}</em></button></div>
          <span class="pf-hint">Last export ${lastExp}</span></div>
        <div class="pf-card pf-flush"><table class="pf-table pf-table-click"><thead><tr><th>Client</th><th>Matter</th><th class="pf-hide-s">Location</th><th>Stage</th><th class="pf-hide-s">${leadBasis === 'generated' ? 'Enquired' : 'Bought'}</th></tr></thead><tbody>
        ${list.map((l) => `<tr data-lead="${l.id}" tabindex="0"><td><div class="pf-biz"><span class="pf-avatar pf-avatar-s">${initials(l.contact_name)}</span><div><b>${h(l.contact_name)}</b><span>${h(l.business_name || l.phone || l.email || '')}</span></div></div></td>
          <td><b>${leadTitle(l)}</b><span>${h(l.area_label || areaName(l.area))}${l.urgency === 'Urgently' ? ' · urgent' : ''}</span></td><td class="pf-hide-s"><span class="pf-strong">${h(l.region || '–')}</span><span>${h(l.postcode || '')}</span></td>
          <td><span class="pf-stage pf-st-${l.stage}">${STAGE_NAME[l.stage] || h(l.stage)}</span>${l.stage === 'instructed' && l.instructed_value ? `<span>${gbp(l.instructed_value)}</span>` : ''}${l.refund ? `<span class="pf-refund-tag ${l.refund.status}">${l.refund.status === 'rejected' ? 'Not refunded' : `Refund ${l.refund.status}`}</span>` : ''}</td>
          <td class="pf-hide-s"><span class="pf-strong">${date(leadBasis === 'generated' ? l.received_at : l.purchased_at)}</span>${l.auto_bought ? `<span class="pf-auto">${I.spark}Auto-bought</span>` : ''}</td></tr>`).join('') || `<tr><td colspan="5" class="pf-hint pf-pad">${stageFilter === 'archived' ? 'No archived leads. Archive a lead from its panel to tidy it away.' : 'No leads match.'}</td></tr>`}
        </tbody></table></div>`
        : empty('layers', 'No leads yet', 'Leads bought by hand or by auto-buy land here with full contact details. Track each one from first call to instructed.', `<a class="pf-btn pf-btn-primary" href="${P}/opportunities">Browse opportunities</a>`);
      view().querySelectorAll('[data-st]').forEach((b) => (b.onclick = () => { stageFilter = b.dataset.st; draw(); }));
      const vq = (sel) => view().querySelector(sel);
      if (vq('[data-lb]')) vq('[data-lb]').onchange = (e) => { leadBasis = e.target.value; draw(); };
      if (vq('[data-lq]')) vq('[data-lq]').onchange = (e) => { leadQ = e.target.value.trim(); draw(); };
      if (vq('[data-larea]')) vq('[data-larea]').onchange = (e) => { leadArea = e.target.value; draw(); };
      if (vq('[data-lreg]')) vq('[data-lreg]').onchange = (e) => { leadRegion = e.target.value; draw(); };
      if (vq('[data-lclr]')) vq('[data-lclr]').onclick = () => { leadQ = leadArea = leadRegion = ''; draw(); };
      const lp = view().querySelector('[data-lp]');
      if (lp) lp.onchange = () => { leadPeriod = lp.value; if (leadPeriod === 'custom' && !leadFrom) { leadTo = isoDay(new Date()); leadFrom = isoDay(new Date(Date.now() - 29 * 864e5)); } draw(); };
      view().querySelectorAll('[data-lf],[data-lt]').forEach((x) => (x.onchange = () => { if (x.dataset.lf !== undefined) leadFrom = x.value; else leadTo = x.value; if (leadFrom > leadTo) [leadFrom, leadTo] = [leadTo, leadFrom]; draw(); }));
      view().querySelectorAll('[data-lead]').forEach((r) => {
        const go = () => leadDrawer(myLeads.find((l) => l.id === +r.dataset.lead), draw);
        r.onclick = go; r.onkeydown = (e) => e.key === 'Enter' && go();
      });
      view().querySelector('[data-csv]')?.addEventListener('click', () => {
        // Same columns as leadOut on the server (webhooks, HubSpot, Pipedrive); answers become one "question = answer" line each.
        const skip = ['notes', 'refund', 'refundable', 'area', 'area_label', 'score', 'companies_house'];
        const cols = [...new Set(list.flatMap((l) => Object.keys(l)))].filter((c) => !skip.includes(c));
        const flat = (v, c) => (c === 'answers' && Array.isArray(v) ? v.map((x) => `${x.q} = ${x.a}`).join('\n') : Array.isArray(v) && v.every((x) => typeof x !== 'object') ? v.join(', ') : v && typeof v === 'object' ? JSON.stringify(v) : v);
        const cell = (v, c) => { const t = String(flat(v, c) ?? ''); return `"${(/^[=+\-@\t\r]/.test(t) ? `'${t}` : t).replace(/"/g, '""')}"`; }; // no spreadsheet formulas from form input
        const csv = [cols.map((c) => cell(c)), ...list.map((l) => cols.map((c) => cell(l[c], c)))].map((r) => r.join(',')).join('\n');
        const tag = (leadPeriod === 'all' ? '' : `-${leadBasis}-${isoDay(from)}-to-${isoDay(to)}`) + (stageFilter ? `-${stageFilter}` : '');
        Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv' })), download: `leaflegal-leads${tag}.csv` }).click();
        api('leads-exported', {}).then((r) => { me.leads_exported_at = r.at; draw(); }).catch(() => {});
      });
    };
    draw();
    if (openLead) { const l = myLeads.find((x) => x.id === openLead); openLead = null; if (l) leadDrawer(l, draw); }
  }

  // Pre-filled first messages from the firm to the client (WhatsApp and email buttons).
  const firstName = (n) => String(n || '').trim().split(/\s+/)[0] || '';
  const areaWords = (l) => String(l.area_label || areaName(l.area) || 'legal').toLowerCase();
  const firstMsg = (l) => `Hi ${firstName(l.contact_name) || 'there'}, it’s ${firstName(me.contact_name) || 'the team'} from ${me.company}. You got in touch through Leaflegal about a ${areaWords(l)} matter and we’d be glad to help. When is a good time for a quick call?`;
  const waNum = (p) => { const d = String(p || '').replace(/[^\d+]/g, ''); return /^\+\d{8,15}$/.test(d) ? d.slice(1) : /^0\d{9,10}$/.test(d) ? '44' + d.slice(1) : /^44\d{9,10}$/.test(d) ? d : ''; };
  const waHref = (l) => (waNum(l.phone) ? `https://wa.me/${waNum(l.phone)}?text=${encodeURIComponent(firstMsg(l))}` : '');
  const mailHref = (l) => `mailto:${l.email}?subject=${encodeURIComponent(`Your ${areaWords(l)} enquiry`)}&body=${encodeURIComponent(firstMsg(l))}`;
  // Refund reasons (spec). The server's list in /me options wins when it sends one.
  const RETURN_REASONS = [{ reason: 'Phone number not in service', kind: 'auto' }, { reason: 'Phone number belongs to someone else', kind: 'auto' }, { reason: 'Email address bounces', kind: 'auto' },
    { reason: 'Outside the practice area or region stated', kind: 'review', note: 'We check what the client told us against the lead before refunding.' }, { reason: 'Duplicate of a lead already bought', kind: 'review', note: 'Tell us the earlier lead number if you have it.' }];
  const returnReasons = () => (opts?.returnReasons?.length ? opts.returnReasons.map((r) => (typeof r === 'string' ? { reason: r } : r)) : RETURN_REASONS);
  function leadDrawer(l, redraw) {
    if (!l) return;
    l.notes ||= []; l.stage ||= 'new';
    const render = () => {
      const at = STAGES.findIndex(([x]) => x === l.stage);
      drawer(`<div class="pf-dh"><span class="pf-avatar pf-avatar-lg">${initials(l.contact_name)}</span><div><span class="pf-eyebrow">Lead #${l.id} · bought ${ago(l.purchased_at)}${l.auto_bought ? ' · auto' : ''}</span><h2>${h(l.contact_name)}</h2><p class="pf-dsub">${leadTitle(l)} · ${h(l.area_label || areaName(l.area))}</p></div></div>
        <div class="pf-contact"><div><b>${h(l.contact_name)}</b><span>${h(l.phone)}</span><span>${h(l.email)}</span>${l.postcode ? `<span>${h(l.postcode)}${l.region ? `, ${h(l.region)}` : ''}</span>` : ''}${l.business_name ? `<span>${h(l.business_name)}${l.company_number ? ` (${h(l.company_number)})` : ''}</span>` : ''}</div>
          <div class="pf-row-l"><a class="pf-btn pf-btn-primary" href="tel:${h(l.phone)}">${I.phone}Call</a>${waHref(l) ? `<a class="pf-btn" href="${waHref(l)}" target="_blank" rel="noopener">${I.wa}WhatsApp</a>` : ''}<a class="pf-btn" href="${mailHref(l)}">${I.mail}Email</a></div></div>
        <ul class="pf-tips"><li>${I.phone}Call quickly. Enquiries go cold fast.</li><li>${I.shield}Check for conflicts before discussing the matter.</li><li>${I.doc}Tell the client in writing about the referral and the fee paid to Leaflegal.</li></ul>
        <h3 class="pf-dsec">Stage</h3>
        <div class="pf-stepper" role="group" aria-label="Pipeline stage">${STAGES.map(([k, n], i) => `<button data-set="${k}" aria-pressed="${l.stage === k}" class="pf-st-${k} ${l.stage === k ? 'on' : ''} ${l.stage !== 'lost' && k !== 'lost' && i < at ? 'done' : ''}">${l.stage !== 'lost' && k !== 'lost' && i < at ? I.check : ''}${n}</button>`).join('')}</div>
        ${l.stage === 'instructed' ? `<form class="pf-inline" data-instructed><label>Instructed value (fees)<div class="pf-money"><i>£</i><input name="amt" inputmode="numeric" value="${l.instructed_value ? num(l.instructed_value) : ''}" placeholder="Expected fee"></div></label><button class="pf-btn">Save</button></form>` : ''}
        <div class="pf-archrow"><span class="pf-hint">${l.archived_at ? `Archived ${date(l.archived_at)}. It’s under the Archived tab.` : 'Done with this lead? Archive it to tidy it out of the list. It can still be found and exported.'}</span><button class="pf-btn pf-btn-sm" data-arch>${l.archived_at ? 'Unarchive' : 'Archive'}</button></div>
        <h3 class="pf-dsec">Notes</h3>
        <ul class="pf-notes">${l.notes.map((n) => `<li><p>${h(n.body)}</p><span>${date(n.created_at)}</span></li>`).join('') || '<li class="pf-notes-empty">No notes yet. Log calls, conflict checks, consultations and next steps.</li>'}</ul>
        <form class="pf-noteform" data-note><textarea name="body" rows="2" placeholder="Add a note…" aria-label="Add a note"></textarea><button class="pf-btn pf-btn-primary">Add</button></form>
        <h3 class="pf-dsec">Enquiry</h3>
        ${enquiryFacts(l, [['Grade', `${gradeBadge(l)}`], ['Price paid', `${num(l.price_credits ?? l.price)} credits`], ['Enquired', date(l.received_at || l.created_at)]])}
        ${tagList(l.tags)}
        ${l.summary ? `<h3 class="pf-dsec">In the client’s words</h3><blockquote class="pf-summary">${h(l.summary)}</blockquote>` : ''}
        <h3 class="pf-dsec">Qualifying answers</h3>${answersList(l.answers)}
        ${chBlock(l.companies_house, true)}
        ${l.refund ? `<div class="pf-refundbox ${l.refund.status}">${I.undo}<div><b>${l.refund.status === 'rejected' ? 'Sorry, we can’t refund this lead' : `Refund ${l.refund.status}`}</b><span>${h(l.refund.reason)}</span>${l.refund.note ? `<span>${h(l.refund.note.replace(/^Sorry, we can’t refund this\.\s*/, ''))}</span>` : l.refund.decision && !/^Declined automatically/.test(l.refund.decision) ? `<span>${h(l.refund.decision)}</span>` : ''}</div></div>`
          : l.refundable ? `<details class="pf-refund"><summary>${I.undo}Problem with this lead?</summary>
            <form data-refund><label>Reason<select name="reason" required><option value="">Choose a reason</option>${returnReasons().map((r) => `<option>${h(r.reason)}</option>`).join('')}</select></label>
            <p class="pf-hint" data-rnote hidden></p>
            <div data-rmore><label>Details <span data-ropt>(optional)</span><textarea name="details" rows="2"></textarea></label>
            <p class="pf-hint">We review requests within one working day. Refunds can be asked for up to ${opts?.returnHours || 72} hours after purchase.</p><div><button class="pf-btn">Send request</button></div></div>
            <p class="pf-hint" data-rcontact hidden>Want to talk it through? Email <a href="mailto:hello@leaflegal.co?subject=Lead%20%23${l.id}">hello@leaflegal.co</a>.</p></form></details>` : ''}`);
      modal.querySelectorAll('[data-set]').forEach((b) => (b.onclick = async () => {
        if (b.dataset.set === l.stage) return;
        try { const r = await api('stage', { id: l.id, stage: b.dataset.set }); l.stage = r.stage || b.dataset.set; render(); redraw?.(); toast(`Moved to ${STAGE_NAME[l.stage]}`); } catch (ex) { toast(ex.message, true); }
      }));
      modal.querySelector('[data-instructed]')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const v = String(e.target.amt.value).replace(/\D/g, '');
        try { const r = await api('stage', { id: l.id, stage: 'instructed', instructed_value: v }); l.instructed_value = r.instructed_value ?? (+v || null); toast('Instructed value saved'); redraw?.(); } catch (ex) { toast(ex.message, true); }
      });
      modal.querySelector('[data-arch]').onclick = async () => {
        try { const x = await api('archive', { id: l.id, archived: !l.archived_at }); l.archived_at = x.archived_at; render(); redraw?.(); toast(l.archived_at ? 'Lead archived' : 'Lead moved back to the list'); } catch (ex) { toast(ex.message, true); }
      };
      modal.querySelector('[data-note]').addEventListener('submit', async (e) => {
        e.preventDefault(); const t = e.target.body.value.trim(); if (!t) return;
        try { const { note } = await api('note', { id: l.id, body: t }); l.notes.push(note); render(); modal.querySelector('.pf-noteform textarea').focus(); } catch (ex) { toast(ex.message, true); }
      });
      const rf = modal.querySelector('[data-refund]');
      if (rf) rf.reason.onchange = () => {
        const r = returnReasons().find((x) => x.reason === rf.reason.value), no = r?.kind === 'no';
        rf.querySelector('[data-rnote]').hidden = !r?.note; rf.querySelector('[data-rnote]').textContent = r?.note || '';
        rf.querySelector('[data-rmore]').hidden = false; rf.querySelector('[data-rcontact]').hidden = !no;
        rf.details.required = r?.kind === 'review'; rf.querySelector('[data-ropt]').textContent = r?.kind === 'review' ? '(required)' : '(optional)';
      };
      modal.querySelector('[data-refund]')?.addEventListener('submit', async (e) => {
        e.preventDefault(); const f = e.target;
        if (!f.reason.value) return toast('Choose a reason', true);
        try {
          const x = await api('refund', { id: l.id, reason: f.reason.value, details: f.details.value }); l.refundable = false;
          l.refund = x.declined ? { status: 'rejected', reason: f.reason.value, note: x.note } : { status: 'pending', reason: f.reason.value };
          render(); redraw?.(); toast(x.declined ? 'Thanks for letting us know' : 'Refund requested. We’ll review it shortly.');
        } catch (ex) { toast(ex.message, true); }
      });
    };
    render();
  }

  // ------------------------------------------------ auto-buy
  // Chip groups: an empty saved list means "any", so everything starts ticked and firms narrow down by unticking.
  // A fully ticked group saves as [] ("any"). Practice areas are different: they're required, so an empty list means none.
  const anyOf = (ticked, names) => (names.every((v) => ticked.includes(v)) ? [] : ticked);
  const chips = (name, list, sel = [], allWhenEmpty = true) => `<div class="pf-chips" data-group="${name}">${list.map((x) => { const [v, t] = Array.isArray(x) ? x : [x, x];
    return `<label class="pf-chip"><input type="checkbox" name="${name}" value="${h(v)}" ${sel?.includes(v) || (allWhenEmpty && !sel?.length) ? 'checked' : ''}><span>${h(t)}</span></label>`; }).join('')}</div>`;
  const csvList = (v, up) => [...new Set(String(v || '').split(/[,;\s]+/).map((x) => (up ? x.toUpperCase().replace(/[^A-Z]/g, '') : x.trim().toLowerCase())).filter(Boolean))];
  // Practice areas with their matters: tick an area to buy it, then untick any matter in it the firm doesn't handle.
  // Only areas the firm's regulators allow are offered (same rule as allowedAreas on the server).
  function areaPicker(f, allowed, compact) {
    const on = f.areas || [], blocked = TX.areas.filter((a) => !allowed.includes(a.slug));
    return `<div class="pf-areas">${TX.areas.filter((a) => allowed.includes(a.slug)).map((a) => { const ms = f.matters?.[a.slug] || [], ticked = on.includes(a.slug);
      return `<div class="pf-area ${ticked ? 'on' : ''}" data-area="${a.slug}"><label class="pf-area-h"><input type="checkbox" name="areas" value="${a.slug}" ${ticked ? 'checked' : ''}><span class="pf-pic">${aIcon(a.slug)}</span><b>${h(a.label)}</b><em data-acount></em></label>
        <div class="pf-area-m" ${ticked ? '' : 'hidden'}>${compact ? '' : '<p class="pf-hint pf-mt-0">Untick any matter the firm doesn’t handle.</p>'}${chips(`m_${a.slug}`, a.matters, ms)}</div></div>`; }).join('')}</div>
      ${blocked.length ? `<p class="pf-hint">${blocked.map((a) => h(a.label)).join(', ')} ${blocked.length === 1 ? 'isn’t' : 'aren’t'} offered because the firm’s regulator doesn’t cover ${blocked.length === 1 ? 'it' : 'them'}. Immigration needs SRA, CILEx or IAA authorisation. CLC firms can take conveyancing and lease extensions. IPReg firms can take trademarks and IP.</p>` : ''}`;
  }
  const wireAreas = (root) => {
    const sync = () => root.querySelectorAll('[data-area]').forEach((box) => { const on = box.querySelector('[name=areas]').checked, m = box.querySelectorAll('.pf-area-m input'), n = [...m].filter((x) => x.checked).length;
      box.classList.toggle('on', on); box.querySelector('.pf-area-m').hidden = !on;
      box.querySelector('[data-acount]').textContent = on ? (n === m.length ? 'Every matter' : `${n} of ${m.length} matters`) : 'Not bought'; });
    root.addEventListener('change', sync); sync();
  };
  // Reads the area picker: areas ticked, and matters per area ([] or missing = every matter in it).
  const readAreas = (form) => { const fd = new FormData(form), areas = fd.getAll('areas'), matters = {};
    for (const a of areas) { const all = [...form.querySelectorAll(`[name="m_${a}"]`)].map((x) => x.value), t = fd.getAll(`m_${a}`); if (t.length && t.length < all.length) matters[a] = t; }
    return { areas, matters }; };
  // Client-side mirror of the server's matching, for the live preview (the server decides for real).
  function fitsCriteria(f, l, allowed) {
    const any = (list, v) => !list?.length || list.includes(v), tags = l.tags || [], vmin = l.value_min ?? l.value_max, vmax = l.value_max ?? l.value_min;
    return allowed.includes(l.area) && (f.areas || []).includes(l.area) && any(f.matters?.[l.area], l.matter) && any(f.regions, l.region) && any(f.postcodeAreas, pcArea(l))
      && any(f.audiences, l.audience) && any(f.urgencies, l.urgency) && any(f.grades, l.grade) && !(f.privatePayOnly && l.private_pay === 'quote')
      && !(f.valueMin && vmax != null && vmax < f.valueMin) && !(f.valueMax && vmin != null && vmin > f.valueMax)
      && (!f.tagsAny?.length || f.tagsAny.some((t) => tags.includes(t))) && !(f.tagsNone || []).some((t) => tags.includes(t)) && !(f.maxPrice && l.price > f.maxPrice);
  }
  async function autobuy() {
    shell('autobuy');
    const [{ leads: rawLive }, ms] = await Promise.all([api('opportunities').catch(() => ({ leads: [] })), api('missed').catch(() => null)]);
    const live = rawLive.map(L), f = me.filters || {}, allowed = firmAreas(me);
    const seenTags = [...new Set(live.flatMap((l) => l.tags || []))].sort();
    // What the saved criteria skipped over the last 30 days, each with an Allow button that changes the form below.
    const missedCard = ms?.missed ? `<section class="pf-card pf-missed"><div class="pf-card-h"><h3>${me.mode === 'auto' ? 'Missed by auto-buy' : 'Outside these criteria'}</h3><span>Last ${ms.days} days</span></div>
      <p class="pf-mt-0"><b>${num(ms.missed)} of ${num(ms.total)} leads</b> fell outside these criteria${me.mode === 'auto' ? ', so auto-buy skipped them' : ''}.${ms.sold ? ` <b>${num(ms.sold)}</b> went to other firms.` : ''}${ms.mine ? ` ${num(ms.mine)} bought by hand.` : ''}${ms.live ? ` ${num(ms.live)} still on <a href="${P}/opportunities">Opportunities</a>.` : ''}</p>
      <table class="pf-table pf-missed-t"><tbody>${(ms.groups || []).map((g, i) => `<tr><td><b>${h(g.label)}</b><span>${g.why ? h(g.why) : g.only ? `${num(g.only)} would have been bought with this allowed` : 'other criteria also held these back'}</span></td><td class="pf-num">${num(g.n)} lead${g.n === 1 ? '' : 's'}</td><td class="pf-num"><button class="pf-btn pf-btn-sm" type="button" data-allow="${i}" ${g.k === 'areas' && !allowed.includes(g.v) ? 'disabled title="Not covered by the firm’s regulator"' : ''}>Allow this</button></td></tr>`).join('')}</tbody></table>
      <p class="pf-hint">Each lead goes to one firm only, so wider criteria mean first pick of more leads. Allow this changes the criteria below. Save to apply.</p></section>` : '';
    const money = (name, v, ph) => `<div class="pf-money"><i>£</i><input name="${name}" inputmode="numeric" value="${v ? num(v) : ''}" placeholder="${ph}"></div>`;
    view().innerHTML = `<form class="pf-auto" id="pf-autoform" novalidate>
      <div class="pf-auto-main">
        <section class="pf-card"><div class="pf-card-h"><h3>Buying mode</h3></div>${modeCards(me.mode === 'auto')}</section>
        ${missedCard}
        <section class="pf-card"><div class="pf-card-h"><h3>Practice areas and matters</h3><span>Tick each area the firm takes on</span></div>${areaPicker(f, allowed)}</section>
        <section class="pf-card"><div class="pf-card-h"><h3>Lead criteria</h3><span>Everything is included. Untick what the firm doesn’t want</span></div>
          <h4>Regions</h4>${chips('regions', TX.regions, f.regions)}
          <label class="pf-mt-s">Postcode areas <span>(optional, narrows the regions above)</span><input name="postcodeAreas" value="${h((f.postcodeAreas || []).join(', '))}" placeholder="e.g. SW, SE, M, LS" autocapitalize="characters"></label>
          <p class="pf-hint">The letters at the start of a postcode, such as SW for south west London or M for Manchester. Leave blank for anywhere in the regions ticked.</p>
          <h4>Client</h4>${chips('audiences', TX.audiences, f.audiences)}
          <h4>Urgency</h4>${chips('urgencies', TX.urgency, f.urgencies)}
          <h4>Grade</h4>${chips('grades', TX.grades.map((g) => [g, { A: 'A, detailed and ready to go', B: 'B, good', C: 'C, thinner answers' }[g] || g]), f.grades)}
          <label class="pf-switchrow pf-mt-s"><input type="checkbox" role="switch" name="privatePayOnly" ${f.privatePayOnly ? 'checked' : ''}><span class="pf-toggle-ui"></span><span><b>Private pay only</b><em>Skip clients who said they’ll only pay if the cost is right</em></span></label>
          <div class="pf-two pf-mt-s"><label>Minimum value${money('valueMin', f.valueMin, 'No minimum')}</label><label>Maximum value${money('valueMax', f.valueMax, 'No maximum')}</label></div>
          <p class="pf-hint">Value is the property price, debt or similar figure the client gave. Only applied to leads that have one.</p>
          <div class="pf-two pf-mt-s"><label>Only leads tagged <span>(any of)</span><input name="tagsAny" value="${h((f.tagsAny || []).join(', '))}" placeholder="No tag needed" list="pf-tags-dl"></label>
            <label>Never leads tagged<input name="tagsNone" value="${h((f.tagsNone || []).join(', '))}" placeholder="None excluded" list="pf-tags-dl"></label></div>
          <datalist id="pf-tags-dl">${seenTags.map((t) => `<option value="${h(t)}">`).join('')}</datalist>
          ${seenTags.length ? `<p class="pf-hint">Tags on live leads now ${seenTags.slice(0, 14).map(h).join(', ')}. Separate several with commas.</p>` : ''}</section>
        <section class="pf-card"><div class="pf-card-h"><h3>Limits</h3></div>
          <label>Auto-buy limit (credits a month)<input name="monthly_cap" inputmode="numeric" value="${me.monthly_cap ? num(me.monthly_cap) : ''}" placeholder="No limit, up to the balance"></label>
          <p class="pf-hint">For example, 2,000 spends up to 2,000 credits a month on auto-bought leads. We never go over the balance.</p>
          <div class="pf-two pf-mt-s"><label>Leads per day<input name="dailyLeads" inputmode="numeric" value="${f.dailyLeads || ''}" placeholder="No limit"></label>
            <label>Credits per day<input name="dailyCredits" inputmode="numeric" value="${f.dailyCredits || ''}" placeholder="No limit"></label></div>
          <label class="pf-mt-s">Maximum credits per lead<input name="maxPrice" inputmode="numeric" value="${f.maxPrice || ''}" placeholder="No maximum (leads cost up to ${pricing?.max || 400})"></label>
          <p class="pf-hint">Lead prices change with demand and can move without notice, so this is the safety net. Leads that cost more are never auto-bought. They stay on Opportunities to buy by hand, and we email when one matches (see <a href="${P}/notifications">Notifications</a>).</p></section>
        <section class="pf-card"><div class="pf-card-h"><h3>Delivery</h3><span>Where bought leads are sent, whether bought by hand or by auto-buy</span></div>
          <div class="pf-opt"><label class="pf-switchrow pf-switchrow-top"><input type="checkbox" role="switch" name="deliver_on" ${me.deliver_on !== false ? 'checked' : ''}><span class="pf-toggle-ui"></span><span><b>Email each lead</b><em>Full contact details and answers, the moment it’s bought</em></span></label>
            ${listField('deliver_emails', me.deliver_emails, 'email', me.email, 'Add another email', 10)}
            <p class="pf-hint">Leave blank to use ${h(me.email)}.</p></div>
          <div class="pf-opt"><label class="pf-switchrow"><input type="checkbox" role="switch" name="webhook_on" ${me.webhook_on !== false ? 'checked' : ''}><span class="pf-toggle-ui"></span><span><b>Send to webhooks</b><em>Each lead is posted as JSON. Works with Zapier, Make, case management systems and any CRM that accepts webhooks</em></span></label>
            ${listField('webhook_urls', me.webhook_urls?.length ? me.webhook_urls : me.webhook_url ? [me.webhook_url] : [], 'url', 'https://hooks.zapier.com/…', 'Add another webhook', 5)}
            <label class="pf-mt-s">Signing secret (optional)<input name="webhook_secret" type="password" autocomplete="off" spellcheck="false" value="${h(me.webhook_secret || '')}" placeholder="Paste a secret, or generate one"></label>
            <div class="pf-row-l"><button type="button" class="pf-btn pf-btn-sm" data-secret-gen>Generate</button><button type="button" class="pf-btn pf-btn-sm" data-secret-show>Show</button></div>
            <p class="pf-hint">When set, each webhook carries X-Leaflegal-Timestamp and X-Leaflegal-Signature (t=timestamp,v1=HMAC-SHA256 of "timestamp.body") so the receiving end can check it came from Leaflegal.</p>
            <div class="pf-row-l"><button type="button" class="pf-btn" data-test>${I.webhook}Send a test lead</button></div></div>
          <div class="pf-opt"><label class="pf-switchrow"><input type="checkbox" role="switch" name="hubspot_on" ${me.hubspot?.on !== false ? 'checked' : ''}><span class="pf-toggle-ui"></span><span><b>Send to HubSpot</b><em>Each lead becomes a HubSpot contact through a HubSpot form. Works on every HubSpot plan, no Zapier needed</em></span></label>
            <label>HubSpot form embed code or link<textarea name="hubspot_form" rows="2" placeholder="Paste the form’s embed code or the link to its editor">${h(me.hubspot?.form ? `hbspt.forms.create({ region: "${me.hubspot.region || 'na1'}", portalId: "${me.hubspot.portal}", formId: "${me.hubspot.form}" })` : '')}</textarea></label>
            <p class="pf-hint">${me.hubspot?.form ? `Connected to HubSpot account ${h(me.hubspot.portal)}. ` : ''}The form needs Email, First name, Last name, Phone number, Company name and Message fields.</p>
            <div class="pf-row-l"><button type="button" class="pf-btn" data-test-hs>${I.webhook}Send a test lead to HubSpot</button></div></div>
          <div class="pf-opt"><label class="pf-switchrow"><input type="checkbox" role="switch" name="pipedrive_on" ${me.pipedrive?.on !== false ? 'checked' : ''}><span class="pf-toggle-ui"></span><span><b>Send to Pipedrive</b><em>Each lead becomes a person and a deal with a note of everything the client told us. No Zapier needed</em></span></label>
            <label>Pipedrive API token<input name="pipedrive_token" type="password" autocomplete="off" spellcheck="false" value="${h(me.pipedrive?.token || '')}" placeholder="40 letters and numbers"></label>
            <p class="pf-hint">${me.pipedrive?.token ? 'Connected to Pipedrive. ' : ''}In Pipedrive, open Settings, then Personal preferences, then API, and copy the token. Deals land in the default pipeline, owned by the token’s user.</p>
            <div class="pf-row-l"><button type="button" class="pf-btn" data-test-pd>${I.webhook}Send a test lead to Pipedrive</button></div></div></section>
      </div>
      <aside class="pf-auto-side"><div class="pf-card pf-preview"><span class="pf-eyebrow">Live preview</span><div class="pf-preview-n"><b data-pcount>0</b><span data-pof></span></div><p data-ptext></p><div class="pf-meter"><i data-pbar></i></div></div></aside>
</form>
      <div class="pf-savebar"><span>Changes apply to new leads as soon as they’re saved.</span><button class="pf-btn pf-btn-primary pf-btn-lg" type="submit" form="pf-autoform">Save settings</button></div>`;
    const form = view().querySelector('form');
    wireAreas(form);
    if (me.restricted && !acting) { // commission client: rules set by Leaflegal, delivery still editable
      form.querySelectorAll('.pf-auto-main > section.pf-card').forEach((sec) => { if (sec.querySelector('[name=deliver_on]')) return; sec.querySelectorAll('input,select,textarea,button').forEach((x) => (x.disabled = true)); sec.classList.add('is-locked'); });
      form.querySelector('.pf-auto-main').insertAdjacentHTML('afterbegin', `<div class="pf-banner">${I.shield}<div><b>Leaflegal manages auto-buy for this account.</b> The criteria and limits below are set by Leaflegal. To change them, email hello@leaflegal.co. Delivery settings can still be changed.</div></div>`);
    }
    const digits = (v) => +String(v || '').replace(/\D/g, '') || null;
    const read = () => {
      const fd = new FormData(form);
      const vals = (k) => fd.getAll(k).map((x) => String(x).trim()).filter(Boolean);
      const group = (k) => anyOf(fd.getAll(k), [...form.querySelectorAll(`[name=${k}]`)].map((i) => i.value));
      return { mode: fd.get('mode'), monthly_cap: String(fd.get('monthly_cap') || '').replace(/\D/g, ''),
        deliver_on: !!fd.get('deliver_on'), deliver_emails: vals('deliver_emails'), webhook_on: !!fd.get('webhook_on'), webhook_urls: vals('webhook_urls'), webhook_secret: String(fd.get('webhook_secret') || '').trim(),
        hubspot: { form: String(fd.get('hubspot_form') || ''), on: !!fd.get('hubspot_on') }, pipedrive: { token: String(fd.get('pipedrive_token') || '').trim(), on: !!fd.get('pipedrive_on') },
        filters: { ...readAreas(form), regions: group('regions'), postcodeAreas: csvList(fd.get('postcodeAreas'), true), audiences: group('audiences'), urgencies: group('urgencies'), grades: group('grades'),
          privatePayOnly: !!fd.get('privatePayOnly'), valueMin: digits(fd.get('valueMin')), valueMax: digits(fd.get('valueMax')), tagsAny: csvList(fd.get('tagsAny')), tagsNone: csvList(fd.get('tagsNone')),
          maxPrice: digits(fd.get('maxPrice')), dailyLeads: digits(fd.get('dailyLeads')), dailyCredits: digits(fd.get('dailyCredits')) } };
    };
    const preview = () => {
      const v = read(), n = live.filter((l) => fitsCriteria(v.filters, l, allowed)).length;
      form.querySelector('[data-pcount]').textContent = n;
      form.querySelector('[data-pof]').textContent = live.length ? `of ${live.length} live` : '';
      form.querySelector('[data-ptext]').textContent = !v.filters.areas.length ? 'No practice areas ticked, so no leads match. Tick at least one area.' : live.length ? `leads match these criteria. ${v.mode === 'auto' ? 'New matches will be bought automatically.' : 'Switch to Automatic to buy new matches instantly.'}` : `No live leads to compare against right now. ${v.mode === 'auto' ? 'New matches will be bought automatically.' : ''}`;
      form.querySelector('[data-pbar]').style.width = live.length ? `${(n / live.length) * 100}%` : '0';
    };
    form.addEventListener('input', preview); form.addEventListener('change', preview); preview();
    // "Allow this" on a missed-leads row: tick the value (k, v from missGroups on the server) in the form, or lift the limit.
    view().querySelectorAll('[data-allow]').forEach((btn) => btn.addEventListener('click', () => {
      const g = ms.groups[btn.dataset.allow], el = (n) => form.querySelector(`[name="${n}"]`), tick = (name, v) => { const box = [...form.querySelectorAll(`[name="${name}"]`)].find((x) => x.value === v); if (box) box.checked = true; return !!box; };
      const addTo = (n, v, up) => { const cur = csvList(el(n).value, up); if (!cur.includes(v)) el(n).value = [...cur, v].join(', '); };
      const dropFrom = (n, v, up) => { el(n).value = csvList(el(n).value, up).filter((x) => x !== String(v)).join(', '); };
      if (g.k === 'areas') tick('areas', g.v);
      else if (g.k === 'matters') { const [a, m] = String(g.v).split('/'); tick('areas', a); tick(`m_${a}`, m); }
      else if (['regions', 'audiences', 'urgencies', 'grades'].includes(g.k)) tick(g.k, g.v);
      else if (g.k === 'postcodeAreas') { if (el('postcodeAreas').value.trim()) addTo('postcodeAreas', String(g.v).toUpperCase(), true); }
      else if (g.k === 'privatePayOnly') el('privatePayOnly').checked = false;
      else if (g.k === 'valueMin' || g.k === 'valueMax') el(g.k).value = '';
      else if (g.k === 'tagsAny') el('tagsAny').value = g.v ? (addTo('tagsAny', String(g.v).toLowerCase()), el('tagsAny').value) : '';
      else if (g.k === 'tagsNone') dropFrom('tagsNone', String(g.v).toLowerCase());
      form.dispatchEvent(new Event('change'));
      btn.disabled = true; btn.textContent = 'Allowed'; preview(); toast('Allowed. Save settings to apply it.');
    }));
    wireLists(form);
    const emptyGroup = () => [...form.querySelectorAll('.pf-chips[data-group]')].find((g) => !g.closest('[hidden]') && !g.querySelector('input:checked'));
    const save = async () => {
      const g = emptyGroup(); if (g) throw new Error('Tick at least one option in each group (untick to narrow down).');
      const v = read();
      if (v.mode === 'auto' && !v.filters.areas.length) throw new Error('Tick at least one practice area for auto-buy.');
      if (v.filters.valueMin && v.filters.valueMax && v.filters.valueMin > v.filters.valueMax) throw new Error('The minimum value is higher than the maximum.');
      const r = await api('settings', v); Object.assign(me, v, { filters: r.filters || v.filters, hubspot: r.hubspot, pipedrive: r.pipedrive, webhook_secret: v.webhook_secret || null, monthly_cap: +v.monthly_cap || 0 }); };
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      try { await save(); toast(me.mode === 'auto' ? 'Saved. Auto-buy is on.' : 'Settings saved'); await autobuy(); } catch (ex) { return toast(ex.message, true); }
      if (me.mode === 'auto' && !acting) offerBacklog();
    });
    const sec = form.elements.webhook_secret;
    form.querySelector('[data-secret-gen]').onclick = () => { const b = crypto.getRandomValues(new Uint8Array(32)); sec.value = 'whsec_' + [...b].map((x) => x.toString(16).padStart(2, '0')).join(''); sec.type = 'text'; toast('Secret generated. Copy it to the receiving end, then save.'); };
    form.querySelector('[data-secret-show]').onclick = (e) => { sec.type = sec.type === 'password' ? 'text' : 'password'; e.target.textContent = sec.type === 'password' ? 'Show' : 'Hide'; };
    form.querySelector('[data-test-hs]').onclick = async () => {
      try { await save(); const { result } = await api('test-webhook', { to: 'hubspot' }); toast(result === 'ok' ? 'Test lead sent to HubSpot. Look for Sam Sample in Contacts.' : `HubSpot replied ${result}`, result !== 'ok'); } catch (ex) { toast(ex.message, true); }
    };
    form.querySelector('[data-test-pd]').onclick = async () => {
      try { await save(); const { result } = await api('test-webhook', { to: 'pipedrive' }); toast(result === 'ok' ? 'Test lead sent to Pipedrive. Look for the Sam Sample deal.' : `Pipedrive replied ${result}`, result !== 'ok'); } catch (ex) { toast(ex.message, true); }
    };
    form.querySelector('[data-test]').onclick = async () => {
      try { await save(); const { result, results = [] } = await api('test-webhook', {}); toast(result === 'ok' ? `Test lead delivered to ${results.length > 1 ? `all ${results.length} webhooks` : 'the webhook'}` : `Not accepted (${result})`, result !== 'ok'); } catch (ex) { toast(ex.message, true); }
    };
  }

  // ------------------------------------------------ credits
  // Lead pricing: mirrors price() in api/_lib/platform.js (spec), using the live weights from /api/platform?action=pricing.
  const DEFAULT_PRICING = { min: 15, max: 400,
    areas: { conveyancing: 35, immigration: 60, 'family-law': 55, 'debt-recovery': 45, licensing: 55, 'lease-extensions': 60, trademarks: 50 },
    matters: { 'immigration/sponsor-licences': 120, 'family-law/financial-settlements': 75,
      'licensing/licence-reviews': 80, 'licensing/premises-licence-applications': 70, 'lease-extensions/collective-enfranchisement': 110,
      'trademarks/trademark-infringement': 75, 'trademarks/objections-and-oppositions': 65 },
    grade: { A: 1.3, B: 1, C: 0.7 }, urgent: 1.15, business: 1.1, value: [[1000000, 1.4], [500000, 1.25], [250000, 1.1]] };
  const PR = () => ({ ...DEFAULT_PRICING, ...(pricing?.areas ? pricing : {}) });
  const round5 = (n) => Math.round(n / 5) * 5;
  // l: { area, matter, grade, urgency, audience, value_min }
  function leadPrice(l, P = PR()) {
    const base = P.matters?.[`${l.area}/${l.matter}`] ?? P.areas?.[l.area] ?? 50, g = P.grade?.[l.grade] ?? 1;
    const u = l.urgency === 'Urgently' ? P.urgent ?? 1 : 1, b = l.audience === 'business' ? P.business ?? 1 : 1;
    const v = (P.value || []).find(([min]) => (l.value_min || 0) >= min)?.[1] ?? 1;
    return { base, g, u, b, v, price: Math.min(P.max, Math.max(P.min, round5(base * g * u * b * v))) };
  }
  let pricingReady = null; // fetched once, for the Credits page and onboarding (the /me response may already carry it)
  const loadPricing = () => (pricing?.areas ? Promise.resolve() : (pricingReady ||= fetch('/api/platform?action=pricing').then((r) => r.json()).then((d) => { if (d?.pricing?.areas) pricing = { ...(pricing || {}), ...d.pricing }; }).catch(() => {})));

  // Stripe's embedded checkout, mounted in a dialog inside the platform.
  let stripeJs = null, payCheckout = null, stripeObj = null;
  // Only one embedded checkout can exist at a time: always tear the old one down once, safely.
  const killPay = () => { const c = payCheckout; payCheckout = null; try { c?.destroy(); } catch {} };
  async function mountPay(r, sel) {
    killPay(); await loadStripe();
    stripeObj ||= window.Stripe(r.publishableKey);
    const c = await stripeObj.initEmbeddedCheckout({ fetchClientSecret: async () => r.clientSecret });
    const el = document.querySelector(sel);
    if (!el || payCheckout) { try { c.destroy(); } catch {} return; } // user moved on while it loaded
    payCheckout = c; el.innerHTML = ''; c.mount(sel);
  }
  const loadStripe = () => stripeJs ||= new Promise((ok, no) => {
    const t = Object.assign(document.createElement('script'), { src: 'https://js.stripe.com/v3/', onload: ok, onerror: () => { stripeJs = null; no(new Error('Could not load the payment form. Please try again.')); } });
    document.head.appendChild(t);
  });
  async function payInline({ clientSecret, publishableKey }) {
    modal.className = 'pf-pay'; modal.onclick = null;
    modal.innerHTML = `<div class="pf-pay-in"><h2>Start the subscription</h2><button class="pf-iconbtn pf-drawer-x" aria-label="Close" data-close>${I.x}</button><div id="pf-pay-mount"><div class="pf-pay-load">Loading secure payment form…</div></div></div>`;
    modal.onclose = () => { killPay(); modal.onclose = null; };
    modal.querySelector('[data-close]').onclick = () => modal.close();
    modal.showModal();
    await loadStripe();
    await mountPay({ clientSecret, publishableKey }, '#pf-pay-mount');
  }

  // Shared lead price calculator and examples (Billing page and onboarding).
  const mult = (x) => `×${(+x).toLocaleString('en-GB', { maximumFractionDigits: 2 })}`;
  const VALUE_STEPS = [[0, 'No value given or under £250k'], [250000, '£250k to £500k'], [500000, '£500k to £1m'], [1000000, '£1m+']];
  function priceExamples() {
    const P = PR(), ex = TX.areas.map((a) => { const m = a.matters.find(([k]) => P.matters?.[`${a.slug}/${k}`]) || a.matters[0];
      return { a, m, typical: leadPrice({ area: a.slug, matter: '', grade: 'B' }, P).price, low: leadPrice({ area: a.slug, matter: '', grade: 'C' }, P).price, high: leadPrice({ area: a.slug, matter: m?.[0], grade: 'A', urgency: 'Urgently' }, P).price }; });
    return `<table class="pf-table pf-mini pf-ex"><thead><tr><th>Practice area</th><th class="pf-r">Grade C</th><th class="pf-r">Grade B</th><th class="pf-r pf-hide-s">Top end</th></tr></thead><tbody>
      ${ex.map(({ a, m, typical, low, high }) => `<tr><td><b>${h(a.label)}</b><span>Top end is an urgent grade A ${h(String(m?.[1] || '').toLowerCase())} lead</span></td><td class="pf-r">${num(low)}</td><td class="pf-r"><b>${num(typical)}</b></td><td class="pf-r pf-hide-s">${num(high)}</td></tr>`).join('')}</tbody></table>
      <p class="pf-hint">Credits per lead for an individual client with no stated value. Business clients cost ${mult(P.business)} and higher value matters up to ${mult(Math.max(1, ...(P.value || []).map((x) => x[1])))}. Every lead costs ${num(P.min)} to ${num(P.max)} credits.</p>`;
  }
  function calcSection(extra = '') {
    const P = PR(), a0 = TX.areas[0];
    const seg = (name, list, on) => `<div class="pf-seg" role="group" aria-label="${name}">${list.map(([v, t]) => `<button type="button" data-${name}="${h(v)}" class="${v === on ? 'on' : ''}">${h(t)}</button>`).join('')}</div>`;
    return `<section class="pf-card pf-calc"><div class="pf-card-h"><h3>Lead price calculator</h3><span>Every lead costs ${num(P.min)} to ${num(P.max)} credits</span></div>${extra}
        <div class="pf-calc-grid"><div class="pf-calc-in">
          <label class="pf-calc-row"><span class="pf-calc-l">Practice area</span><span class="pf-select"><select name="c_area">${TX.areas.map((a) => `<option value="${a.slug}">${h(a.label)}</option>`).join('')}</select></span></label>
          <label class="pf-calc-row"><span class="pf-calc-l">Matter</span><span class="pf-select"><select name="c_matter">${(a0?.matters || []).map(([k, t]) => `<option value="${k}">${h(t)}</option>`).join('')}</select></span></label>
          <div class="pf-calc-row"><span class="pf-calc-l">Grade</span>${seg('cgrade', [['A', 'A'], ['B', 'B'], ['C', 'C']], 'B')}</div>
          <div class="pf-calc-row"><span class="pf-calc-l">Urgency</span>${seg('curg', [['Urgently', 'Urgently'], ['', 'Not urgent']], '')}</div>
          <div class="pf-calc-row"><span class="pf-calc-l">Client</span>${seg('caud', [['individual', 'Individual'], ['business', 'Business']], 'individual')}</div>
          <label class="pf-calc-row"><span class="pf-calc-l">Value stated</span><span class="pf-select"><select name="c_value">${VALUE_STEPS.map(([v, t]) => `<option value="${v}">${h(t)}</option>`).join('')}</select></span></label>
        </div>
        <div class="pf-calc-out"><span class="pf-eyebrow">This lead costs</span><div class="pf-calc-price"><b data-cprice>0</b><span>credits</span></div>
          <ul class="pf-breakdown" data-cbreak></ul>
          <p class="pf-hint">The base price is set per practice area, with some matters priced on their own. Grade, urgency, business clients and higher values then adjust it, rounded to the nearest 5.</p></div></div>
        <h4 class="pf-mt">Typical prices</h4>${priceExamples()}</section>`;
  }
  function wireCalc(root) {
    const cf = root.querySelector('.pf-calc-in'); if (!cf) return;
    const st = { grade: 'B', urgency: '', audience: 'individual' }, el = (n) => cf.querySelector(`[name=${n}]`);
    const fillMatters = () => { const a = areaOf(el('c_area').value); el('c_matter').innerHTML = (a?.matters || []).map(([k, t]) => `<option value="${k}">${h(t)}</option>`).join(''); };
    const run = () => {
      const r = leadPrice({ area: el('c_area').value, matter: el('c_matter').value, grade: st.grade, urgency: st.urgency, audience: st.audience, value_min: +el('c_value').value });
      root.querySelector('[data-cprice]').textContent = num(r.price);
      root.querySelector('[data-cbreak]').innerHTML = [['Base price', `${num(r.base)} credits`], [`Grade ${st.grade}`, mult(r.g)], ['Urgency', mult(r.u)], ['Client', mult(r.b)], ['Value', mult(r.v)]]
        .map(([k, v]) => `<li><span>${k}</span><b>${v}</b></li>`).join('');
    };
    el('c_area').onchange = () => { fillMatters(); run(); };
    cf.addEventListener('change', run);
    [['cgrade', 'grade'], ['curg', 'urgency'], ['caud', 'audience']].forEach(([d, k]) => cf.querySelectorAll(`[data-${d}]`).forEach((b) => (b.onclick = () => { st[k] = b.dataset[d]; cf.querySelectorAll(`[data-${d}]`).forEach((x) => x.classList.toggle('on', x === b)); run(); })));
    run();
  }
  const priceCalc = (extra) => calcSection(extra);
  const wirePriceCalc = (root) => wireCalc(root);
  const howCredits = () => `<div class="pf-how"><h3>How credits work</h3><ol>
    <li><b>1 credit = £1 + VAT of lead value.</b> The plan adds credits every month.</li>
    <li><b>Each lead is priced by practice area and matter</b>, then adjusted for its grade, urgency, whether the client is a business and the value at stake. Every lead costs ${num(PR().min)} to ${num(PR().max)} credits.</li>
    <li><b>Prices move.</b> Leaflegal is a marketplace, so lead prices change with demand, at any time and without notice, including for auto-buy. Unsold leads drop to half price after 72 hours.</li>
    <li><b>The firm stays in control.</b> The price shows before buying by hand, and auto-buy never pays more than the maximum per lead that’s been set.</li>
    <li><b>Every lead is exclusive</b> to the firm that buys it.</li>
    <li><b>Unused credits roll over</b> while subscribed. Leads with a phone number that isn’t in service or belongs to someone else, or an email that bounces, can be refunded if asked within 72 hours.</li></ol></div>`;

  async function credits() {
    shell('billing');
    const [{ entries }, { subscription }] = await Promise.all([api('ledger'), api('subscription').catch(() => ({ subscription: null })), loadPricing()]);
    if (new URLSearchParams(location.search).get('paid')) { toast('Payment received. Credits arrive within a minute.'); history.replaceState(null, '', location.pathname); }
    const cur = subscription, curPence = cur ? cur.pounds * 100 : 0;
    const planBtn = (k, pence) => {
      if (!me.approved) return `<button class="pf-btn pf-btn-lg" disabled>Available once approved</button>`;
      if (!cur) return `<button class="pf-btn ${k === 'growth' ? 'pf-btn-primary' : ''} pf-btn-lg" data-pack="${k}">Subscribe</button>`;
      if (pence === curPence && cur.trial) return `<button class="pf-btn pf-btn-primary pf-btn-lg" data-pack="${k}" data-change="up">Upgrade now</button>`;
      if (pence === curPence) return `<button class="pf-btn pf-btn-lg pf-btn-current" disabled>${I.check}Current plan</button>`;
      return pence > curPence ? `<button class="pf-btn pf-btn-primary pf-btn-lg" data-pack="${k}" data-change="up">Upgrade</button>`
        : `<button class="pf-btn pf-btn-lg" data-pack="${k}" data-change="down">Switch at renewal</button>`;
    };
    const isCur = (pence) => cur && pence === curPence;
    const curCustom = cur && !Object.values(packs).some((p) => p.pence === curPence) ? cur.pounds : null;
    const startCustom = curCustom || custom.min * 2;
    view().innerHTML = `<section class="pf-hero-credits"><div><span>Current balance</span><b>${num(me.credits)}</b><em>credits · 1 credit = £1 + VAT of lead value · unused credits roll over</em></div>
        <div class="pf-curplan">${cur?.trial ? `<span class="pf-eyebrow">Current plan</span><b>First month offer · ${gbp(trial.pence / 100)}<small> + VAT</small></b>
          <em>${num(trial.credits)} credits · becomes ${h(cur.plan)} (${gbp(cur.pounds)} + VAT, ${num(cur.credits)} credits a month)${cur.renews ? ` on ${new Date(cur.renews).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}</em>`
          : cur ? `<span class="pf-eyebrow">Current plan</span><b>${h(cur.plan)} · ${gbp(cur.pounds)}<small> a month + VAT</small></b>
          <em>${num(cur.credits)} credits a month${cur.renews ? ` · ${cur.cancelling ? 'ends' : 'renews'} ${new Date(cur.renews).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}${cur.status === 'past_due' ? ' · <strong>payment overdue</strong>' : ''}</em>`
          : me.plan ? `<span class="pf-eyebrow">Current plan</span><b>${h(me.plan.name)}${me.plan.price ? ` · ${gbp(me.plan.price)}<small> a month + VAT</small>` : ''}</b>
            ${me.plan.credits ? `<em>${num(me.plan.credits)} credits a month${me.plan.price ? ' · invoiced' : ''} · next credits ${new Date(me.plan.next_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</em>` : '<em>Credits added by Leaflegal</em>'}`
          : `<span class="pf-eyebrow">Current plan</span><b>No plan yet</b><em>Choose a monthly plan below to start buying leads.</em>`}
          ${me.billing ? `<button class="pf-btn pf-btn-ghost pf-btn-sm" data-billing>Manage billing</button>` : ''}</div></section>
      ${cur?.trial ? `<div class="pf-banner pf-banner-go pf-mt">${I.spark}<div><b>Ready for the full plan?</b> Upgrade to ${h(cur.plan)} today and get ${num(cur.credits)} credits straight away. Your monthly plan starts today, and the credits you have now stay in your balance.</div><button class="pf-btn pf-btn-primary pf-btn-sm" data-pack="${Object.keys(packs).find((k) => packs[k].pence === curPence) || 'starter'}" data-change="up">Upgrade to ${h(cur.plan)}</button></div>`
        : me.credits < low && cur ? `<div class="pf-banner pf-banner-warn pf-mt">${I.coins}<div><b>${me.credits > 0 ? `Only ${num(me.credits)} credits left.` : 'You’re out of credits.'}</b> Upgrade below and the new plan’s credits are added straight away.</div></div>` : ''}
      <div class="pf-card-h pf-mt" id="plans"><h3>${cur ? 'Change plan' : 'Monthly plans'}</h3><span>Prices exclude VAT · ${cur ? 'upgrades start today, downgrades at renewal' : 'cancel any time'}</span></div>
      <div class="pf-packs pf-packs-3">${Object.entries(packs).map(([k, p]) => `<div class="pf-pack ${isCur(p.pence) ? 'pf-pack-cur' : !cur && k === 'growth' ? 'pf-pack-hi' : ''}">${isCur(p.pence) ? '<em class="pf-ribbon pf-ribbon-cur">Current</em>' : !cur && k === 'growth' ? '<em class="pf-ribbon">Most popular</em>' : ''}
          <h3>${p.name}</h3>${isCur(p.pence) && cur.trial ? '<p class="pf-hint">Your plan after the first month</p>' : ''}<div class="pf-pack-price">${gbp(p.pence / 100)}<span> a month + VAT</span></div>
          <div class="pf-pack-cr">${num(p.credits)}<span>credits every month</span></div>
          <ul><li>${I.check}${p.bonus ? `<b>${p.bonus}% bonus</b>&nbsp;credits` : 'Full credit value'}</li><li>${I.check}Unused credits roll over</li></ul>${planBtn(k, p.pence)}</div>`).join('')}
        <div class="pf-pack pf-pack-custom ${curCustom ? 'pf-pack-cur' : ''}">${curCustom ? '<em class="pf-ribbon pf-ribbon-cur">Current</em>' : ''}<h3>Custom</h3>
          <div class="pf-pack-price"><span data-cpounds></span><span> a month + VAT</span></div>
          <div class="pf-pack-cr"><span data-ccredits class="pf-cc"></span><span>credits every month</span></div>
          <label class="pf-calc-row pf-custom-range"><span class="pf-vh">Monthly spend</span><input type="range" name="custom" min="${custom.min}" max="30000" step="${custom.step}" value="${startCustom}" aria-label="Monthly spend"></label>
          <div class="pf-custom-in"><span>£</span><input name="customAmount" inputmode="numeric" value="${num(startCustom)}" aria-label="Monthly spend in pounds"><span>/month</span></div>
          <ul><li>${I.check}Full credit value</li></ul><div data-cbtn></div></div></div>
      <div class="pf-two-col pf-mb2">
        <section class="pf-card pf-form"><div class="pf-card-h"><h3>Subscription</h3></div>
          ${cur ? `<div class="pf-status ${cur.cancelling || cur.status === 'past_due' ? '' : 'ok'}">${cur.cancelling ? I.clock : cur.status === 'past_due' ? I.x : I.check}<div>
              <b>${h(cur.plan)} · ${gbp(cur.pounds)} a month + VAT</b>
              <span>${cur.cancelling ? `Cancelled. Ends on ${new Date(cur.renews).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}. Credits stay usable until then.` : cur.status === 'past_due' ? 'Your last payment failed. Update your card to keep receiving credits.' : `Renews on ${new Date(cur.renews).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}.`}</span></div></div>
            <div class="pf-row-l">${me.billing ? `<button class="pf-btn" data-billing>${I.coins}Update card or billing details</button>` : ''}
              ${cur.cancelling ? `<button class="pf-btn pf-btn-primary" data-resume>Keep the subscription</button>` : `<button class="pf-btn pf-btn-danger" data-cancel>Cancel subscription</button>`}</div>`
            : `<p class="pf-hint">No subscription yet. Choose a plan above to start receiving credits every month.</p>`}
        </section>
        <section class="pf-card pf-flush"><div class="pf-card-h pf-pad"><h3>Invoices</h3></div><div data-invoices><p class="pf-hint pf-pad">Loading…</p></div></section>
      </div>
      <div class="pf-card pf-mb2">${howCredits()}</div>
      ${priceCalc()}
      <section class="pf-card pf-flush pf-mt"><div class="pf-card-h pf-pad"><h3>History</h3></div>${entries.length ? `<table class="pf-table"><tbody>
        ${entries.map((e) => `<tr><td><b>${h(e.reason)}${e.lead_id ? ` #${e.lead_id}` : ''}</b><span>${date(e.created_at)}</span></td><td class="pf-r ${e.delta > 0 ? 'pf-plus' : ''}"><b>${e.delta > 0 ? '+' : ''}${num(e.delta)}</b></td></tr>`).join('')}</tbody></table>` : '<p class="pf-hint pf-pad">No activity yet.</p>'}</section>`;

    wirePriceCalc(view());

    // custom plan
    const cr = view().querySelector('[name=custom]'), ci = view().querySelector('[name=customAmount]'), cb = view().querySelector('[data-cbtn]');
    let customAmt = startCustom;
    const setCustom = (n, fromInput) => {
      customAmt = Math.max(custom.min, Math.round((+n || custom.min) / custom.step) * custom.step);
      const cc = Math.round(customAmt * (1 + custom.bonus / 100)), big = cc > custom.maxCredits;
      view().querySelector('[data-cpounds]').textContent = gbp(customAmt);
      view().querySelector('[data-ccredits]').textContent = num(cc);
      cr.value = Math.min(30000, customAmt); cr.style.setProperty('--p', `${((cr.value - custom.min) / (30000 - custom.min)) * 100}%`);
      if (!fromInput) ci.value = num(customAmt);
      cb.innerHTML = big ? `<a class="pf-btn pf-btn-orange pf-btn-lg" href="mailto:${custom.contact}?subject=${encodeURIComponent(`Leaflegal Platform: custom plan around ${gbp(customAmt)} a month`)}">${I.mail}Contact us</a><p class="pf-hint">Plans over ${num(custom.maxCredits)} credits a month are set up with our team.</p>`
        : planBtn('custom', customAmt * 100);
      wirePlans();
    };
    cr.addEventListener('input', () => setCustom(cr.value));
    ci.addEventListener('input', () => setCustom(ci.value.replace(/\D/g, ''), true));
    ci.addEventListener('blur', () => setCustom(ci.value.replace(/\D/g, '')));

    function wirePlans() {
      view().querySelectorAll('[data-pack]').forEach((b) => (b.onclick = async () => {
        const k = b.dataset.pack, p = k === 'custom' ? { name: 'Custom', pence: customAmt * 100, credits: Math.round(customAmt * (1 + custom.bonus / 100)) } : packs[k];
        if (b.dataset.change) return confirmChange(k, p, b.dataset.change === 'up');
        b.disabled = true; b.classList.add('busy');
        try {
          const r = await api('checkout', { pack: k, amount: customAmt, embedded: true });
          if (r.clientSecret) await payInline(r); else if (r.url) location.href = r.url; else throw new Error('Could not start checkout. Please try again.');
        } catch (ex) { toast(ex.message, true); }
        b.disabled = false; b.classList.remove('busy');
      }));
    }
    function confirmChange(k, p, up) {
      const vat = (p.pence / 100) * 1.2, when = cur.renews ? new Date(cur.renews).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' }) : 'your next renewal';
      modal.className = 'pf-modal'; modal.onclick = null;
      modal.innerHTML = `<form method="dialog" class="pf-modal-in"><h2>${up ? `Upgrade to ${h(p.name)}` : `Switch to ${h(p.name)}`}</h2>
        <p>${up ? `You'll be charged <b>${gbp(vat)}</b> (${gbp(p.pence / 100)} + VAT) today and get <b>${num(p.credits)} credits</b> straight away.${cur.trial ? ' Your first month offer ends now.' : ''} Your plan then renews monthly from today. Credits you already have stay in your balance.`
          : `Your plan changes to ${h(p.name)} (${gbp(p.pence / 100)} + VAT, ${num(p.credits)} credits a month) on ${when}. Nothing changes until then and there's no charge today.`}</p>
        <div class="pf-row"><button class="pf-btn" value="cancel">Cancel</button><button class="pf-btn pf-btn-primary" value="ok">${up ? `Upgrade and pay ${gbp(vat)}` : 'Confirm switch'}</button></div></form>`;
      modal.onclose = async () => {
        modal.onclose = null;
        if (modal.returnValue !== 'ok') return;
        try { await api('change-plan', { pack: k, amount: customAmt }); toast(up ? `Upgraded to ${p.name}. Credits arrive within a minute.` : `Switching to ${p.name} at renewal`); setTimeout(route, up ? 2500 : 0); }
        catch (ex) { toast(ex.message, true); }
      };
      modal.showModal();
    }
    setCustom(customAmt);
    wirePlans();
    if (location.hash === '#plans') view().querySelector('#plans')?.scrollIntoView({ block: 'start' });
    view().querySelectorAll('[data-billing]').forEach((b) => (b.onclick = async () => { try { location.href = (await api('billing', {})).url; } catch (ex) { toast(ex.message, true); } }));
    view().querySelector('[data-resume]')?.addEventListener('click', async () => { try { await api('resume-plan', {}); toast('Your subscription will continue'); credits(); } catch (ex) { toast(ex.message, true); } });
    view().querySelector('[data-cancel]')?.addEventListener('click', () => {
      const end = new Date(cur.renews).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
      modal.className = 'pf-modal'; modal.onclick = null;
      modal.innerHTML = `<form method="dialog" class="pf-modal-in"><h2>Cancel the subscription?</h2>
        <p>Your ${h(cur.plan)} plan stays active until <b>${end}</b>. You won't be charged again, and you can keep using your credits until then. You can change your mind any time before that date.</p>
        <fieldset class="pf-reasons"><legend>Reason for cancelling</legend>${(opts.cancelReasons || []).map((x) => `<label class="pf-check"><input type="radio" name="reason" value="${h(x)}" required>${h(x)}</label>`).join('')}</fieldset>
        <label>Anything we could have done better <span>(optional)</span><textarea name="feedback" rows="3" maxlength="2000" placeholder="Your feedback goes straight to the Leaflegal team"></textarea></label>
        <div class="pf-row"><button class="pf-btn" value="cancel" formnovalidate>Keep subscription</button><button class="pf-btn pf-btn-danger-solid" value="ok">Cancel subscription</button></div></form>`;
      modal.onclose = async () => {
        modal.onclose = null; if (modal.returnValue !== 'ok') return;
        const f = modal.querySelector('form');
        try { await api('cancel-plan', { reason: f.reason.value, feedback: f.feedback.value }); toast(`Cancelled. Your plan ends on ${end}. Thanks for the feedback.`); credits(); } catch (ex) { toast(ex.message, true); }
      };
      modal.showModal();
    });
    api('invoices').then(({ invoices }) => {
      const box = view().querySelector('[data-invoices]'); if (!box) return;
      box.innerHTML = invoices.length ? `<table class="pf-table"><tbody>${invoices.map((i) => `<tr><td><b>${new Date(i.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</b><span>${h(i.number || '')}</span></td>
        <td><b>${gbp(i.total.toFixed(2)).replace(/\.00$/, '')}</b><span class="pf-inv-${i.status}">${i.status === 'paid' ? 'Paid' : i.status === 'open' ? 'Due' : h(i.status)}</span></td>
        <td class="pf-r">${i.pdf ? `<a class="pf-btn pf-btn-sm" href="${h(i.pdf)}" target="_blank" rel="noopener">${I.download}PDF</a>` : ''}${i.status === 'open' && i.url ? ` <a class="pf-btn pf-btn-sm pf-btn-primary" href="${h(i.url)}" target="_blank" rel="noopener">Pay</a>` : ''}</td></tr>`).join('')}</tbody></table>`
        : '<p class="pf-hint pf-pad">No invoices yet.</p>';
    }).catch(() => {});

    view().querySelector('[data-billing]')?.addEventListener('click', async () => { try { location.href = (await api('billing', {})).url; } catch (ex) { toast(ex.message, true); } });
  }

  // ------------------------------------------------ account
  // ------------------------------------------------ public profile (what a matched business sees)
  const PI = { globe: ic('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>'),
    chat: ic('<path d="M21 11.5a8.4 8.4 0 0 1-12.3 7.4L3 21l2.1-5.6A8.4 8.4 0 1 1 21 11.5z"/>') };
  const profDefaults = () => ({ name: me.company || '', person: me.contact_name || '', role: me.signer_title || '', phone: me.phone || '', email: me.email || '',
    website: '', whatsapp: '', about: '', logo: '', show: { person: true, phone: true, email: true, website: true, whatsapp: true, sms: true } });
  // WhatsApp starts as their mobile number (UK 07… / +447…), so most brokers don't have to type it.
  const mobileOf = (...ns) => ns.find((n) => /^(\+?44\s?7|07)/.test(String(n || '').replace(/[\s()-]/g, ''))) || '';
  const profOf = () => { const p = me.profile && Object.keys(me.profile).length ? { ...me.profile } : profDefaults();
    if (!p.whatsapp) p.whatsapp = mobileOf(p.phone, me.phone); return p; };
  const sw = (k, title, sub, inner, p) => `<div class="pf-opt"><label class="pf-switchrow"><input type="checkbox" role="switch" name="show_${k}" ${p.show?.[k] !== false ? 'checked' : ''}><span class="pf-toggle-ui"></span><span><b>${title}</b><em>${sub}</em></span></label><div class="pf-row-l pf-prof-in">${inner}</div></div>`;
  function profEditor(p) {
    return `<div class="pf-prof"><div class="pf-form pf-prof-form" data-prof>
      <div class="pf-prof-scan"><label>Website<input name="website" value="${h(p.website || '')}" placeholder="yourfirm.co.uk" inputmode="url" autocomplete="url"></label>
        <button type="button" class="pf-btn" data-scan>${I.spark}Fill in from the website</button></div>
      <div class="pf-prof-logo"><div class="pf-prof-logobox" data-logobox>${p.logo ? `<img src="${h(p.logo)}" alt="Firm logo">` : '<span>No logo yet</span>'}</div>
        <div><b>Logo</b><span>PNG, JPG, SVG or WebP. We resize it to fit.</span><div class="pf-row-l"><label class="pf-btn pf-btn-sm">${I.plus}${p.logo ? 'Change logo' : 'Upload logo'}<input type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" data-logofile hidden></label>
          ${p.logo ? '<button type="button" class="pf-btn pf-btn-sm" data-logorm>Remove</button>' : ''}</div></div></div>
      <label>Firm name<input name="name" value="${h(p.name || '')}" required></label>
      <label>Short description <span>(optional, up to 240 characters)</span><textarea name="about" rows="2" maxlength="240" placeholder="e.g. Conveyancing and lease extension solicitors in Leeds since 2009">${h(p.about || '')}</textarea></label>
      ${sw('person', 'Show a contact person', 'Turn off to show just the firm', `<input name="person" value="${h(p.person || '')}" placeholder="Name" aria-label="Contact name"><input name="role" value="${h(p.role || '')}" placeholder="Role, e.g. Partner" aria-label="Contact role">`, p)}
      ${sw('phone', 'Phone', 'Shown with a tap-to-call button', `<input name="phone" value="${h(p.phone || '')}" type="tel" placeholder="01234 567890" aria-label="Phone">`, p)}
      ${sw('whatsapp', 'WhatsApp', 'Lets the client message the firm on WhatsApp', `<input name="whatsapp" value="${h(p.whatsapp || '')}" type="tel" placeholder="07700 900123" aria-label="WhatsApp number">`, p)}
      ${sw('sms', 'Text messages', 'Lets them text a different number. Leave blank to use the WhatsApp or phone mobile', `<input name="sms" value="${h(p.sms || '')}" type="tel" placeholder="07700 900123" aria-label="Text message number">`, p)}
      ${sw('email', 'Email', 'Shown with an email button', `<input name="email" value="${h(p.email || '')}" type="email" placeholder="you@yourfirm.co.uk" aria-label="Email">`, p)}
      ${sw('website', 'Website link', 'Uses the website address above', '', p)}
      </div><aside class="pf-prof-side"><div class="pf-row-l pf-prof-tabs"><span class="pf-eyebrow">What the client sees</span>
          <div class="pf-seg" role="group" aria-label="Preview"><button type="button" class="${profTab === 'page' ? 'on' : ''}" data-ptab="page">Confirmation page</button><button type="button" class="${profTab === 'email' ? 'on' : ''}" data-ptab="email">Email</button><button type="button" class="${profTab === 'whatsapp' ? 'on' : ''}" data-ptab="whatsapp">WhatsApp</button><button type="button" class="${profTab === 'sms' ? 'on' : ''}" data-ptab="sms">Text</button></div></div>
        <p class="pf-hint" data-psub>${PSUB[profTab]}</p>
        <div class="pf-prof-frame"><iframe title="Preview" data-pframe></iframe></div></aside></div>`;
  }
  // Read the editor into a profile object.
  const profRead = (box, p) => { const v = (n) => box.querySelector(`[name=${n}]`)?.value.trim() || '';
    return { ...p, name: v('name'), about: v('about'), person: v('person'), role: v('role'), phone: v('phone'), whatsapp: v('whatsapp'), sms: v('sms'), email: v('email'), website: v('website'),
      show: Object.fromEntries(['person', 'phone', 'whatsapp', 'sms', 'email', 'website'].map((k) => [k, !!box.querySelector(`[name=show_${k}]`)?.checked])) }; };
  // Logo clean-up, done in the browser before upload: trims empty margins (transparent or a plain background colour),
  // fits the result inside 600×240 (enlarging small logos at most 2×) and saves a PNG under the 512KB upload limit.
  async function logoPng(src, vector = /^data:image\/svg/i.test(src)) {
    const img = new Image(); img.decoding = 'async';
    await new Promise((ok, bad) => { img.onload = ok; img.onerror = () => bad(new Error('That file doesn’t look like an image we can use')); img.src = src; });
    let w0 = img.naturalWidth, h0 = img.naturalHeight; if (!w0 || !h0) { w0 = 1200; h0 = 480; } // SVGs without a size
    if (vector) { const up = Math.max(1, Math.min(1200 / w0, 480 / h0)); w0 *= up; h0 *= up; } // SVG scales cleanly: draw it big
    const k0 = Math.min(1, 1600 / Math.max(w0, h0)), W0 = Math.max(1, Math.round(w0 * k0)), H0 = Math.max(1, Math.round(h0 * k0));
    const c0 = Object.assign(document.createElement('canvas'), { width: W0, height: H0 }), g0 = c0.getContext('2d', { willReadFrequently: true });
    g0.drawImage(img, 0, 0, W0, H0);
    let box = [0, 0, W0, H0];
    try {
      const d = g0.getImageData(0, 0, W0, H0).data, px = (x, y) => d.subarray((y * W0 + x) * 4, (y * W0 + x) * 4 + 4);
      const cs = [px(0, 0), px(W0 - 1, 0), px(0, H0 - 1), px(W0 - 1, H0 - 1)], near = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]) < 40;
      const solid = cs.every((c) => c[3] > 250 && near(c, cs[0])), bg = cs[0];
      const empty = (p) => p[3] < 24 || (solid && near(p, bg));
      let x1 = W0, y1 = H0, x2 = -1, y2 = -1;
      for (let y = 0; y < H0; y++) for (let x = 0; x < W0; x++) if (!empty(px(x, y))) { if (x < x1) x1 = x; if (x > x2) x2 = x; if (y < y1) y1 = y; if (y > y2) y2 = y; }
      // A white logo made for a dark header would vanish on the white cards clients see, so recolour it dark.
      if (!solid) { let lightN = 0, all = 0; for (let i = 3; i < d.length; i += 16) if (d[i] > 128) { all++; if (d[i - 3] > 225 && d[i - 2] > 225 && d[i - 1] > 225) lightN++; }
        if (all && lightN / all > 0.9) { const im = g0.getImageData(0, 0, W0, H0); for (let i = 0; i < im.data.length; i += 4) { im.data[i] = 27; im.data[i + 1] = 51; im.data[i + 2] = 41; } g0.putImageData(im, 0, 0); } }
      if (x2 >= x1 && y2 >= y1) { const pad = Math.round(Math.max(x2 - x1, y2 - y1) * 0.03); box = [Math.max(0, x1 - pad), Math.max(0, y1 - pad), Math.min(W0, x2 + pad + 1), Math.min(H0, y2 + pad + 1)]; }
    } catch {} // a cross-origin image can't be read: skip trimming
    const bw = box[2] - box[0], bh = box[3] - box[1];
    for (const [W, H] of [[600, 240], [450, 180], [300, 120]]) {
      const k = Math.min(W / bw, H / bh, 2 / k0), c = Object.assign(document.createElement('canvas'), { width: Math.max(1, Math.round(bw * k)), height: Math.max(1, Math.round(bh * k)) });
      const g = c.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(c0, box[0], box[1], bw, bh, 0, 0, c.width, c.height);
      const data = c.toDataURL('image/png');
      if (data.length < 680000) return { data, w: c.width, h: c.height, small: bw / k0 < 160 && bh / k0 < 64 };
    }
    throw new Error('That logo is too detailed to save. Please try a simpler or smaller image.');
  }
  let profTab = 'page', prevSeq = 0;
  const PSUB = { page: 'Shown straight after the client sends the form, when auto-buy matches them with the firm.',
    email: 'Sent to the client whenever the firm gets their lead, whether bought, auto-bought or given by Leaflegal. It never repeats what they told us about their matter.',
    whatsapp: 'Sent to the client’s mobile at the same time as the email.',
    sms: 'Sent instead of the WhatsApp if their number isn’t on WhatsApp.' };
  function wireProfile(box, p, refresh) {
    // Drawn at real desktop width, then scaled down to fit the column, so the firm sees the whole page as the client does.
    const frame = box.querySelector('[data-pframe]'), wrap = frame.parentElement;
    const fit = () => { try {
      const W = Math.max(profTab === 'page' ? 860 : profTab === 'email' ? 660 : 380, wrap.clientWidth), k = wrap.clientWidth / W; // wider panel: fill it, so the content centres
      frame.style.width = `${W}px`; frame.style.height = '10px';
      const H = frame.contentDocument.documentElement.scrollHeight;
      frame.style.height = `${H}px`; frame.style.transform = `scale(${k})`; wrap.style.height = `${Math.ceil(H * k)}px`;
    } catch {} };
    frame.onload = () => { fit(); setTimeout(fit, 400); };
    new ResizeObserver(fit).observe(wrap);
    // Built by the server from the same code that sends the real email and draws the real page.
    const prev = async () => { const n = ++prevSeq;
      try { const d = await api('profile-preview', profRead(box, p)); if (n === prevSeq) frame.srcdoc = d[profTab] || d.page; } catch {} };
    let t; const later = () => { clearTimeout(t); t = setTimeout(prev, 450); };
    box.addEventListener('input', later); box.addEventListener('change', later); prev();
    const ph = box.querySelector('[name=phone]'), wa = box.querySelector('[name=whatsapp]');
    ph.addEventListener('input', () => { if (!wa.dataset.typed && mobileOf(ph.value)) wa.value = ph.value; });
    wa.addEventListener('input', () => (wa.dataset.typed = '1'));
    box.querySelectorAll('[data-ptab]').forEach((b) => (b.onclick = () => { profTab = b.dataset.ptab;
      box.querySelectorAll('[data-ptab]').forEach((x) => x.classList.toggle('on', x === b));
      box.querySelector('[data-psub]').textContent = PSUB[profTab]; prev(); }));
    const upload = async (src, vector) => { const L = await logoPng(src, vector), r = await api('profile-logo', { data: L.data }); p.logo = r.profile.logo; p.logoW = r.profile.logoW; p.logoH = r.profile.logoH; delete p.removeLogo;
      me.profile = { ...(me.profile || {}), logo: p.logo, logoW: p.logoW, logoH: p.logoH }; return L; };
    box.querySelector('[data-logofile]').onchange = async (e) => {
      const f = e.target.files[0]; if (!f) return;
      if (f.size > 8e6) return toast('Please choose an image under 8MB', true);
      const url = URL.createObjectURL(f);
      try { const L = await upload(url, f.type === 'image/svg+xml'); toast(L.small ? 'Logo saved, but it’s quite small so it may look blurry. A larger version will look sharper.' : 'Logo saved. We trimmed the spare space and sized it to fit.'); refresh(profRead(box, p)); }
      catch (ex) { toast(ex.message, true); } finally { URL.revokeObjectURL(url); }
    };
    box.querySelector('[data-logorm]')?.addEventListener('click', () => { p.logo = ''; p.removeLogo = true; refresh(profRead(box, p)); });
    box.querySelector('[data-scan]').onclick = async (e) => {
      const btn = e.currentTarget, url = box.querySelector('[name=website]').value.trim();
      if (!url) { box.querySelector('[name=website]').focus(); return toast('Enter the website address first', true); }
      btn.disabled = true; btn.lastChild.textContent = 'Reading the website…';
      try {
        const d = await api('profile-scan', { url }), cur = profRead(box, p), got = [];
        // Fill only what's empty, so nothing you've typed is overwritten.
        for (const k of ['name', 'about', 'phone', 'whatsapp', 'email']) if (d[k] && (!cur[k] || (k === 'name' && cur[k] === me.company && d.name))) { cur[k] = d[k]; got.push(k); }
        cur.website = d.website || cur.website;
        if (!cur.whatsapp && mobileOf(cur.phone)) cur.whatsapp = mobileOf(cur.phone);
        if (d.whatsapp) cur.show.whatsapp = true;
        if (d.logo && (!p.logo || confirm('We found a logo on the website. Use it instead of the current logo?'))) { try { await upload(d.logo); cur.logo = p.logo; cur.logoW = p.logoW; cur.logoH = p.logoH; got.push('logo'); } catch {} }
        refresh(cur); toast(got.length ? `Filled in ${got.length} detail${got.length === 1 ? '' : 's'} from the website. Check them over.` : 'We read the website but found nothing new to add.');
      } catch (ex) { btn.disabled = false; btn.lastChild.textContent = 'Fill in from the website'; toast(ex.message, true); }
    };
  }
  const profValid = (p) => !p.name ? 'Please enter the firm name.' : !['phone', 'whatsapp', 'sms', 'email', 'website'].some((k) => p.show?.[k] && p[k]) ? 'Switch on at least one way for the client to get in touch.' : '';

  function profile() {
    let prof = { ...profOf() };
    shell('profile', `<section class="pf-card"><div class="pf-card-h"><h3>Public profile</h3><span>Who we tell a client to expect when they’re matched with the firm</span></div>
        <div data-profbox>${profEditor(prof)}</div><div class="pf-row-l pf-mt-s"><button class="pf-btn pf-btn-primary" data-profsave>Save profile</button></div></section>`);
    const pbox = view().querySelector('[data-profbox]');
    const redraw = (p) => { prof = p; pbox.innerHTML = profEditor(p); wireProfile(pbox, prof, redraw); };
    wireProfile(pbox, prof, redraw);
    view().querySelector('[data-profsave]').onclick = async (e) => {
      const p = profRead(pbox, prof), bad = profValid(p); if (bad) return toast(bad, true);
      const b = e.currentTarget; b.disabled = true;
      try { const r = await api('profile', p); me.profile = r.profile; prof = { ...r.profile }; toast('Profile saved'); } catch (ex) { toast(ex.message, true); }
      b.disabled = false;
    };
  }

  // Buying mode choice (Auto-buy page and onboarding). Automatic first and recommended.
  const modeCards = (auto) => { const list = (xs) => `<ul class="pf-mc-list">${xs.map((x) => `<li>${I.check}<span>${x}</span></li>`).join('')}</ul>`;
    return `<div class="pf-modes">
    <label class="pf-modecard pf-modecard-rec"><em class="pf-ribbon">Recommended</em><input type="radio" name="mode" value="auto" ${auto ? 'checked' : ''}><span class="pf-mc-ic">${I.spark}</span><b>Automatic</b>
      ${list(['<b>First pick of new enquiries</b>, bought the moment they arrive', '<b>Matched instantly</b>, so the client sees the firm’s profile on their confirmation page', '<b>Emailed straight away</b>, so the client gets the firm’s details and the firm gets the lead'])}</label>
    <label class="pf-modecard"><input type="radio" name="mode" value="manual" ${auto ? '' : 'checked'}><span class="pf-mc-ic">${I.inbox}</span><b>Manual</b>
      ${list(['<b>Full control</b> over every lead bought', 'Browse and pick the leads the firm wants', 'We email when a matching lead arrives'])}</label></div>`; };

  // Account → Team: invite people, set what they can do, remove them.
  async function team(box) {
    const d = await api('team').catch((ex) => (toast(ex.message, true), null)); if (!d) return;
    const P_ = Object.entries(d.perms);
    const boxes = (pre, perms = {}) => `<div class="pf-perms">${P_.map(([k, label]) => `<label class="pf-check"><input type="checkbox" name="${pre}${k}" ${perms[k] ? 'checked' : ''}><span>${h(label)}</span></label>`).join('')}</div>`;
    const status = (m) => (m.joined_at ? 'Signed in' : m.expired ? 'Invite expired' : 'Invite sent');
    box.innerHTML = `<div class="pf-card-h"><h3>Team</h3><span>People who can sign in to this account</span></div>
      <p class="pf-hint pf-mt-0">Everyone can see opportunities and leads and update lead stages and notes. Tick what else each person can do.</p>
      <div class="pf-team-row"><div><b>${h(d.owner.name || d.owner.email)}</b><span>${h(d.owner.email)} · Account owner, can do everything</span></div></div>
      ${d.members.map((m) => `<div class="pf-team-row" data-m="${m.id}"><div><b>${h(m.name || m.email)}</b><span>${h(m.email)} · ${status(m)}</span></div>${boxes(`m${m.id}_`, m.perms)}
        <div class="pf-row-l"><button type="button" class="pf-btn pf-btn-sm" data-save="${m.id}">Save</button>${m.joined_at ? '' : `<button type="button" class="pf-btn pf-btn-sm" data-resend="${m.id}">Resend invite</button>`}<button type="button" class="pf-btn pf-btn-sm pf-btn-danger" data-remove="${m.id}">Remove</button></div></div>`).join('')}
      <form class="pf-team-add" novalidate><h4>Add a user</h4><div class="pf-two"><label>Full name<input name="name" autocomplete="off"></label><label>Email<input name="email" type="email" autocomplete="off" required></label></div>
        ${boxes('n_', { buy: true })}<div class="pf-row-l"><button class="pf-btn pf-btn-primary" type="submit">Send invite</button></div></form>`;
    const perms = (pre) => Object.fromEntries(P_.map(([k]) => [k, !!box.querySelector(`[name="${pre}${k}"]`)?.checked]));
    const run = async (fn, ok) => { try { await fn(); toast(ok); team(box); } catch (ex) { toast(ex.message, true); } };
    box.querySelector('.pf-team-add').onsubmit = (e) => { e.preventDefault(); const f = e.target; run(() => api('team-invite', { name: f.name.value, email: f.email.value, perms: perms('n_') }), `Invite sent to ${f.email.value.trim()}`); };
    box.querySelectorAll('[data-save]').forEach((b) => (b.onclick = () => run(() => api('team-update', { id: +b.dataset.save, perms: perms(`m${b.dataset.save}_`) }), 'Permissions saved')));
    box.querySelectorAll('[data-resend]').forEach((b) => (b.onclick = () => { const m = d.members.find((x) => x.id === +b.dataset.resend); run(() => api('team-invite', { name: m.name, email: m.email, perms: perms(`m${m.id}_`) }), `Invite sent again to ${m.email}`); }));
    box.querySelectorAll('[data-remove]').forEach((b) => (b.onclick = async () => { const m = d.members.find((x) => x.id === +b.dataset.remove);
      if ((await confirmBox({ title: `Remove ${h(m.name || m.email)}?`, text: 'Their sign-in stops working straight away. Leads they worked on stay on the account.', ok: 'Remove', danger: true })) === null) return;
      run(() => api('team-remove', { id: m.id }), 'User removed'); }));
  }

  function account() {
    shell('account', `<div class="pf-two-col"><form class="pf-card pf-form" novalidate><div class="pf-card-h"><h3>Firm details</h3></div>
      <label>Firm name<input name="company" value="${h(me.company)}"></label><label>Phone<input name="phone" value="${h(me.phone || '')}"></label>
      <label>Sign-in email<input value="${h(me.member?.email || me.email)}" disabled></label>
      <div class="pf-regline"><span class="pf-lbl">Regulators</span>${(me.regulators || []).length ? (me.regulators || []).map((r) => `<span class="pf-tag">${h(regShort(r.id))} ${h(r.number || '')}</span>`).join('') : '<em>None given yet</em>'}${me.regulator_checked_at ? `<span class="pf-hint">${I.check}Checked on the register ${dayOnly(me.regulator_checked_at)}</span>` : ''}</div>
      <p class="pf-hint pf-mt-0">To change regulators, email hello@leaflegal.co so we can check the register again.</p>${can('settings') ? '<div><button class="pf-btn pf-btn-primary" type="submit">Save changes</button></div>' : ''}</form>
      <form class="pf-card pf-form" data-pw novalidate><div class="pf-card-h"><h3>Change password</h3></div>
        <label>New password <span>(12+ characters with upper and lower case, a number and a symbol)</span><input name="pw" type="password" autocomplete="new-password"></label>
        <label>Confirm new password<input name="pw2" type="password" autocomplete="new-password"></label>
        <div><button class="pf-btn pf-btn-primary">Update password</button></div></form>
      ${can('team') ? '<section class="pf-card pf-form pf-team" data-team><div class="pf-card-h"><h3>Team</h3><span>People who can sign in to this account</span></div><div class="pf-skel"></div></section>' : ''}
      <section class="pf-card pf-form" ${can('billing') ? '' : 'hidden'}><div class="pf-card-h"><h3>Referral agreement</h3></div>
        ${me.agreement ? `<div class="pf-status ${me.agreementCurrent ? 'ok' : ''}">${me.agreementCurrent ? I.check : I.clock}<div><b>Signed ${new Date(me.agreement.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</b><span>Reference LL-PA-${String(me.agreement.id).padStart(5, '0')} · version ${h(me.agreement.version)}${me.agreementCurrent ? '' : ' · an updated version needs signing'}</span></div></div>
          <div class="pf-row-l"><button class="pf-btn" data-agreement>${I.download}View or download</button>${me.agreementCurrent ? '' : `<a class="pf-btn pf-btn-primary" href="${P}/onboarding" data-sign>Sign latest version</a>`}</div>`
          : `<p class="pf-hint">The referral agreement isn’t signed yet. It needs signing before subscribing or buying leads.</p><div class="pf-row-l"><a class="pf-btn pf-btn-primary" href="${P}/onboarding" data-sign>Review and sign</a></div>`}</section>
      <section class="pf-card pf-form"><div class="pf-card-h"><h3>Account status</h3></div>
        <div class="pf-status ${me.approved ? 'ok' : ''}">${me.approved ? I.check : I.clock}<div><b>${me.approved ? 'Approved' : 'Awaiting approval'}</b><span>${me.approved ? 'Credits and leads can be bought.' : 'We check every firm and its regulator before it can buy leads.'}</span></div></div>
        <p class="pf-hint">To close the account or change the sign-in email, contact hello@leaflegal.co.</p>
        <div class="pf-row-l"><a class="pf-btn" href="${P}/billing">${I.coins}Billing and subscription</a></div>
        <div><button class="pf-btn" data-out2>${I.out}Sign out</button></div></section></div>`);
    view().querySelector('[data-out2]').onclick = signOut;
    if (can('team')) team(view().querySelector('[data-team]'));
    if (!can('settings')) view().querySelectorAll('form:not([data-pw]) input').forEach((x) => (x.disabled = true));
    view().querySelector('[data-sign]')?.addEventListener('click', () => { ob.step = obAt('agreement'); });
    view().querySelector('[data-agreement]')?.addEventListener('click', async () => {
      const w = window.open('', '_blank');
      try {
        const r = await fetch('/api/platform?action=agreement', { headers: { Authorization: `Bearer ${session.access}` } });
        if (!r.ok) throw new Error('Could not load the agreement');
        const url = URL.createObjectURL(new Blob([await r.arrayBuffer()], { type: 'application/pdf' }));
        if (w) w.location = url; else location.href = url;
      } catch (ex) { w?.close(); toast(ex.message, true); }
    });
    view().querySelector('[data-pw]').onsubmit = async (e) => {
      e.preventDefault(); const f = e.target;
      const weak = pwProblem(f.pw.value); if (weak) return toast(`Your password needs ${weak}`, true);
      if (f.pw.value !== f.pw2.value) return toast('The passwords don’t match', true);
      const put = () => fetch(`${SB}/auth/v1/user`, { method: 'PUT', headers: { apikey: KEY, Authorization: `Bearer ${session.access}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ password: f.pw.value }) });
      let r = await put();
      if (r.status === 401) { try { await auth('refresh_token', { refresh_token: session.refresh }); r = await put(); } catch {} }
      const d = await r.json().catch(() => ({}));
      if (!r.ok) return toast(d.msg || d.error_description || 'Could not update your password', true);
      f.reset(); toast('Password updated');
    };
    view().querySelector('form').onsubmit = async (e) => {
      e.preventDefault(); const fd = new FormData(e.target);
      try { await api('settings', { mode: me.mode, monthly_cap: me.monthly_cap, filters: me.filters, company: fd.get('company'), phone: fd.get('phone') });
        me.company = fd.get('company'); me.phone = fd.get('phone'); toast('Saved'); account(); } catch (ex) { toast(ex.message, true); }
    };
  }

  // ------------------------------------------------ admin
  // Admin sections: sidebar group on desktop, a sticky chip row on phones. URL: /admin/<section>.
  const ADM = [['overview', 'Overview', 'grid'], ['leads', 'All leads', 'inbox'], ['brokers', 'Clients', 'user'], ['finance', 'Revenue', 'chart'], ['ads', 'Ads performance', 'target'], ['refunds', 'Refunds', 'undo'], ['invites', 'Invites', 'mail'], ['agreements', 'Agreements', 'doc'], ['forecast', 'Ad simulator', 'spark'], ['pricing', 'Pricing', 'coins'], ['emails', 'Emails', 'bell'], ['blog', 'Blog', 'star'], ['audit', 'Activity log', 'clock']];
  let adminTab = 'overview', finPeriod = 'month', finGroup = 'day', finData = null, finAt = 0, finCustom = null, cFilter = 'all', cSort = 'active';
  // Finance data is reused between views but refetched after 5 minutes, so a tab left open still picks up today's ad spend.
  const loadFin = async () => { if (!finData || Date.now() - finAt > 3e5) { finData = await apiFetch('admin-finance'); finAt = Date.now(); adsCache = {}; } return finData; };
  let lf = {}; const lsel = new Set(); // All leads: filters + selected ids
  // Collapsed sections on All leads, closed until opened; open/closed is remembered while you filter.
  const folds = {};
  const fold = (k, title, sub, html) => `<details class="pf-fold" data-fold="${k}" ${folds[k] ? 'open' : ''}><summary><b>${title}</b><span>${sub}</span></summary>${html}</details>`;
  const LAGE = { '1d': [0, 1], '3d': [0, 3], '3-7': [3, 7], '7-30': [7, 30], '30+': [30, 1e9] };
  // Date filter (lf.date; custom uses lf.from / lf.to): compares local calendar days, YYYY-MM-DD strings.
  const ymd = (t) => new Date(t).toLocaleDateString('en-CA');
  const dayOff = (n) => ymd(Date.now() - n * 864e5);
  const dateRange = (f) => ({ today: [dayOff(0), dayOff(0)], yesterday: [dayOff(1), dayOff(1)], '7d': [dayOff(6), dayOff(0)], '30d': [dayOff(29), dayOff(0)], month: [dayOff(0).slice(0, 8) + '01', dayOff(0)],
    custom: [f.from || '0000', f.to || '9999'].sort() })[f.date]; // sort: From after To still works
  // Sold lead (admin): credits actually paid. Commission clients and free leads are 0, with the list price for reference.
  const paidTag = (l) => l.paid == null ? priceTag(l) : `<b>${num(l.paid)}${l.paid ? ' cr' : ''}</b><span>${l.paid_why === 'commission' ? `commission client · list ${num(l.price)}` : l.paid_why === 'free' ? `given free · list ${num(l.price)}` : l.paid_why === 'refunded' ? `refunded · list ${num(l.price)}` : 'paid'}</span>`;
  const leadLive = (l) => !l.buyer && !l.hidden_at && (l.price_fixed || Date.now() - new Date(l.created_at) < 30 * 864e5);
  function filterLeads(d) {
    const f = lf, dr = dateRange(f);
    return d.leads.map(L).filter((l) => {
      if (dr && (ymd(l.created_at) < dr[0] || ymd(l.created_at) > dr[1])) return false;
      const days = (Date.now() - new Date(l.created_at)) / 864e5;
      if (f.status === 'hidden' ? !l.hidden_at : l.hidden_at) return false; // hidden leads only show under the Hidden filter
      return (!f.status || f.status === 'hidden' || (f.status === 'live' ? leadLive(l) : f.status === 'expired' ? !l.buyer && !leadLive(l) : f.status === 'sold' ? !!l.buyer : f.status === 'deal' ? l.discounted : f.status === 'suppressed' ? l.suppressed : !l.buyer))
        && (!f.age || (days >= LAGE[f.age][0] && days < LAGE[f.age][1]))
        && (!f.area || l.area === f.area) && (!f.region || l.region === f.region) && (!f.grade || l.grade === f.grade)
        && (!f.stage || (l.buyer && (f.stage === 'archived' ? !!l.archived_at : (l.stage || 'new') === f.stage)))
        && (!f.buyer || l.buyer === f.buyer) && (!f.src || l.channel === f.src) && (!f.camp || l.campaign_name === f.camp) && (!f.q || `#${l.id} ${l.contact_name || ''} ${l.email || ''} ${l.business_name || ''} ${l.matter_label || ''} ${l.postcode || ''}`.toLowerCase().includes(f.q.toLowerCase()));
    });
  }
  const adPath = (l) => [l.campaign_name, l.adset, l.ad].filter(Boolean).join(' › '); // admin only: brokers never receive these fields
  const pence = (n) => '£' + Number(n || 0).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  // Leads by source for the leads shown, with Meta cost per lead (Meta ad spend matched to each lead's campaign and week).
  function sourceSummary(list, adStatus) {
    const by = {};
    for (const l of list) { const c = by[l.channel || 'Direct or unknown'] ||= { n: 0, cost: 0, priced: 0 }; c.n++; if (l.ad_cost != null) { c.cost += l.ad_cost; c.priced++; } }
    const rows = Object.entries(by).sort((a, b) => b[1].n - a[1].n);
    return `<div class="pf-card"><table class="pf-table"><thead><tr><th>Source</th><th>Leads</th><th>Ad spend</th><th>Cost per lead</th></tr></thead><tbody>${rows.map(([k, c]) => `<tr><td><b>${h(k)}</b></td><td>${num(c.n)}</td><td>${c.priced ? pence(c.cost) : '–'}</td><td>${c.priced ? pence(c.cost / c.priced) : '–'}</td></tr>`).join('')}</tbody></table>
      <p class="pf-hint">${Object.entries(adStatus || {}).filter(([, v]) => v !== 'ok').map(([k, v]) => `${h(k)} spend ${v === 'no token' ? 'isn’t connected' : 'couldn’t be loaded'}, so its cost per lead isn’t shown. `).join('')}Cost per lead covers Meta and LinkedIn ads: each lead’s campaign (Meta) or ad set (LinkedIn) spend that week, shared across its leads that week. Uses the filters above.</p></div>`;
  }
  // Where each buyer has got to with the leads shown: their own stages (New to Instructed or Lost) and archived.
  function pipelineSummary(list, d) {
    const by = {};
    for (const l of list.filter((x) => x.buyer)) { const r = (by[l.buyer] ||= { n: 0, archived: 0, ...Object.fromEntries(STAGES.map(([k]) => [k, 0])) }); r.n++; r[l.stage || 'new']++; if (l.archived_at) r.archived++; }
    const name = (id) => d.brokers.find((b) => b.id === id)?.company || 'Unknown';
    const rows = Object.entries(by).sort((a, z) => z[1].n - a[1].n), tot = (k) => rows.reduce((a, [, r]) => a + r[k], 0);
    return `<div class="pf-card"><div class="pf-scroll"><table class="pf-table pf-mini pf-fin-table"><thead><tr><th>Buyer</th><th class="pf-r">Leads</th>${STAGES.map(([, n]) => `<th class="pf-r">${n}</th>`).join('')}<th class="pf-r">Archived</th></tr></thead><tbody>
      ${rows.map(([id, r]) => `<tr><td><b>${h(name(id))}</b></td><td class="pf-r">${r.n}</td>${STAGES.map(([k]) => `<td class="pf-r">${r[k] || '–'}</td>`).join('')}<td class="pf-r">${r.archived || '–'}</td></tr>`).join('')}
      <tr class="pf-fin-total"><td><b>Total</b></td><td class="pf-r">${tot('n')}</td>${STAGES.map(([k]) => `<td class="pf-r">${tot(k) || '–'}</td>`).join('')}<td class="pf-r">${tot('archived') || '–'}</td></tr></tbody></table></div>
      <p class="pf-hint">Firms move leads through these stages themselves, so untouched leads stay at New. Filter by Buyer stage above to list them.</p></div>`;
  }
  function leadsTab(d) {
    const list = filterLeads(d);
    for (const id of [...lsel]) if (!list.some((l) => l.id === id)) lsel.delete(id);
    const fs = (key, label, options) => `<label class="pf-select pf-fsel ${lf[key] ? 'is-set' : ''}"><span class="pf-vh">${label}</span><select data-lf="${key}">${options.map(([v, t]) => `<option value="${h(v)}" ${String(lf[key] || '') === String(v) ? 'selected' : ''}>${h(t)}</option>`).join('')}</select></label>`;
    const buyers = d.brokers.filter((b) => d.leads.some((l) => l.buyer === b.id));
    const active = Object.entries(lf).filter(([k, v]) => v && k !== 'from' && k !== 'to').length, all = list.length && list.every((l) => lsel.has(l.id));
    return `<div class="pf-filters" role="group" aria-label="Filter leads">
        <label class="pf-select pf-fsel ${lf.q ? 'is-set' : ''}"><span class="pf-vh">Search</span><input data-lq type="search" placeholder="Search #, name, email or postcode" value="${h(lf.q || '')}"></label>
        ${fs('status', 'Status', [['', 'Any status'], ['live', 'Live in Opportunities'], ['unsold', 'Unsold (all)'], ['expired', 'Unsold, over 30 days'], ['deal', '50% off now'], ['sold', 'Sold'], ['suppressed', 'Email suppressed'], ['hidden', 'Hidden']])}
        ${fs('date', 'Date', [['', 'Any date'], ['today', 'Today'], ['yesterday', 'Yesterday'], ['7d', 'Last 7 days'], ['30d', 'Last 30 days'], ['month', 'This month'], ['custom', 'Custom range…']])}
        ${lf.date === 'custom' ? `<label class="pf-select pf-fsel is-set"><span class="pf-vh">From</span><input type="date" data-lf="from" value="${h(lf.from || '')}" aria-label="From"></label><label class="pf-select pf-fsel is-set"><span class="pf-vh">To</span><input type="date" data-lf="to" value="${h(lf.to || '')}" aria-label="To"></label>` : ''}
        ${fs('age', 'Age', [['', 'Any age'], ['1d', 'Under 24 hours'], ['3d', 'Under 72 hours'], ['3-7', '3 to 7 days'], ['7-30', '7 to 30 days'], ['30+', 'Over 30 days']])}
        ${fs('area', 'Practice area', [['', 'Any practice area'], ...TX.areas.map((a) => [a.slug, a.label])])}
        ${fs('region', 'Region', [['', 'Any region'], ...TX.regions.map((r) => [r, r])])}
        ${fs('grade', 'Grade', [['', 'Any grade'], ...TX.grades.map((g) => [g, `Grade ${g}`])])}
        ${fs('stage', 'Buyer stage', [['', 'Any stage'], ...STAGES.map(([k, n]) => [k, n]), ['archived', 'Archived by buyer']])}
        ${fs('buyer', 'Buyer', [['', 'Any buyer'], ...buyers.map((b) => [b.id, b.contact_name ? `${b.company} (${b.contact_name})` : b.company])])}
        ${fs('src', 'Source', [['', 'Any source'], ...[...new Set(d.leads.map((l) => l.channel).filter(Boolean))].sort().map((c) => [c, c])])}
        ${fs('camp', 'Campaign', [['', 'Any campaign'], ...[...new Set(d.leads.map((l) => l.campaign_name).filter(Boolean))].sort().map((c) => [c, c])])}
        ${active ? `<button class="pf-btn pf-btn-sm pf-clear" data-lclear>${I.x}Clear ${active} filter${active === 1 ? '' : 's'}</button>` : ''}</div>
      <div class="pf-bulk ${lsel.size ? 'on' : ''}"><span>${lsel.size ? `<b>${lsel.size}</b> selected` : `${list.length} lead${list.length === 1 ? '' : 's'}${list.length !== d.leads.length ? ` of ${d.leads.length}` : ''}`}</span>
        ${lsel.size ? `<label class="pf-select pf-fsel"><span class="pf-vh">Bulk action</span><select data-bulk><option value="">Choose an action…</option>
          <optgroup label="Unsold leads"><option value="give">Give to a firm (free)</option><option value="sell">Sell to a firm (charge credits)</option><option value="half">50% off</option><option value="price">Set a price…</option><option value="full">Back to full price</option></optgroup>
          <optgroup label="Sold leads"><option value="relist">Take back and put in Opportunities</option></optgroup>
          <optgroup label="Any"><option value="suppress">Suppress email (never email again)</option><option value="unsuppress">Remove from suppression list</option><option value="hide">Hide</option><option value="unhide">Unhide</option><option value="delete">Delete</option></optgroup></select></label><button class="pf-btn pf-btn-sm" data-lnone>Clear selection</button>` : ''}</div>
      ${list.length ? fold('src', 'Leads by source', `${num(list.length)} leads · ad spend and cost per lead`, sourceSummary(list, d.adStatus)) : ''}
      ${list.some((l) => l.buyer) ? fold('pipe', 'Buyers’ pipeline', 'stages firms have set', pipelineSummary(list, d)) : ''}
      ${list.length ? `<div class="pf-card pf-flush"><table class="pf-table"><thead><tr><th class="pf-chk"><input type="checkbox" data-lall aria-label="Select all ${list.length} shown" ${all ? 'checked' : ''}></th><th>Lead</th><th>Client</th><th class="pf-hide-s">Location</th><th class="pf-hide-s">Grade</th><th class="pf-hide-s">Source</th><th class="pf-hide-s">Price</th><th>Buyer</th></tr></thead><tbody>
        ${list.map((l) => `<tr class="pf-rowlink ${lsel.has(l.id) ? 'is-sel' : ''}" data-alead="${l.id}" tabindex="0"><td class="pf-chk"><input type="checkbox" data-lsel="${l.id}" aria-label="Select lead #${l.id}" ${lsel.has(l.id) ? 'checked' : ''}></td><td><b>#${l.id} ${leadTitle(l)}</b><span>${h(l.area_label || areaName(l.area))} · ${date(l.created_at)}${l.urgency === 'Urgently' ? ' · <b>Urgent</b>' : ''}${l.suppressed ? ' · <b class="pf-neg">Email suppressed</b>' : ''}${l.hidden_at ? ' · <b>Hidden</b>' : ''}</span></td><td><b>${h(l.contact_name || '–')}</b><span>${h(l.business_name || audName(l.audience))}${l.private_pay === 'yes' ? ' · private pay' : ''}</span></td><td class="pf-hide-s"><b>${h(l.region || '–')}</b><span>${h(l.postcode || l.postcode_district || '')}</span></td><td class="pf-hide-s">${gradeBadge(l)}${l.value_band ? `<span>${h(l.value_band)}</span>` : ''}</td><td class="pf-hide-s"><b>${h(l.channel || 'Direct or unknown')}</b><span>${l.ad_cost != null ? `${pence(l.ad_cost)} ad cost${l.ad_by === 'week' ? ' (week average)' : ''}` : ''}</span>${adPath(l) ? `<span class="pf-adpath" title="${h(adPath(l))}">${h(adPath(l))}</span>` : ''}</td><td class="pf-hide-s">${l.buyer ? paidTag(l) : priceTag(l)}</td>
          <td>${l.buyer ? `<b>${h(l.brokers?.company || '')}</b><span>${l.auto ? 'Auto' : 'Manual'} · ${STAGE_NAME[l.stage || 'new']}</span>` : leadLive(l) ? '<span class="pf-stage pf-st-new">Live</span>' : '<span class="pf-stage pf-st-lost">Unsold</span>'}</td></tr>`).join('')}</tbody></table></div>`
      : empty('inbox', 'No leads match these filters', 'Try widening or clearing the filters.', '<button class="pf-btn" data-lclear>Clear filters</button>')}`;
  }
  function wireLeadsTab(d, redraw) {
    const v = view(), list = filterLeads(d);
    v.querySelectorAll('[data-fold]').forEach((f) => (f.ontoggle = () => { folds[f.dataset.fold] = f.open; }));
    v.querySelectorAll('[data-lf]').forEach((el) => (el.onchange = () => { lf[el.dataset.lf] = el.value; redraw(); }));
    const q = v.querySelector('[data-lq]'); if (q) q.onchange = () => { lf.q = q.value.trim(); redraw(); };
    v.querySelectorAll('[data-lclear]').forEach((b) => (b.onclick = () => { lf = {}; redraw(); }));
    v.querySelectorAll('.pf-chk').forEach((c) => (c.onclick = (e) => e.stopPropagation())); // ticking a box doesn't open the lead
    v.querySelectorAll('[data-lsel]').forEach((c) => (c.onchange = () => { c.checked ? lsel.add(+c.dataset.lsel) : lsel.delete(+c.dataset.lsel); redraw(); }));
    const all = v.querySelector('[data-lall]'); if (all) all.onchange = () => { list.forEach((l) => (all.checked ? lsel.add(l.id) : lsel.delete(l.id))); redraw(); };
    v.querySelector('[data-lnone]')?.addEventListener('click', () => { lsel.clear(); redraw(); });
    const b = v.querySelector('[data-bulk]'); if (b) b.onchange = () => { const op = b.value; b.value = ''; if (op) bulkLeads(d, op); };
  }
  async function bulkLeads(d, op) {
    const picked = d.leads.filter((l) => lsel.has(l.id));
    const targets = op === 'relist' ? picked.filter((l) => l.buyer) : op === 'delete' ? picked : op === 'suppress' ? picked.filter((l) => !l.suppressed) : op === 'unsuppress' ? picked.filter((l) => l.suppressed) : op === 'hide' ? picked.filter((l) => !l.hidden_at) : op === 'unhide' ? picked.filter((l) => l.hidden_at) : picked.filter((l) => !l.buyer);
    const skipped = picked.length - targets.length, n = targets.length, s = n === 1 ? '' : 's';
    if (!n) return toast(op === 'relist' ? 'None of the selected leads are sold' : op === 'suppress' ? 'All the selected leads are already suppressed' : op === 'unsuppress' ? 'None of the selected leads are suppressed' : op === 'hide' ? 'All the selected leads are already hidden' : op === 'unhide' ? 'None of the selected leads are hidden' : 'None of the selected leads are unsold', true);
    const note = skipped ? ` ${skipped} ${op === 'relist' ? 'unsold' : op === 'suppress' ? 'already suppressed' : op === 'unsuppress' ? 'unsuppressed' : op === 'hide' ? 'already hidden' : op === 'unhide' ? 'visible' : 'sold'} lead${skipped === 1 ? '' : 's'} will be skipped.` : '';
    let body;
    if (op === 'give' || op === 'sell') {
      const brokers = d.brokers.filter((x) => !x.is_admin && !x.suspended_at).sort((a, c) => (c.approved - a.approved) || a.company.localeCompare(c.company));
      modal.className = 'pf-modal'; modal.onclick = null; modal.onclose = null;
      modal.innerHTML = `<form method="dialog" class="pf-modal-in"><h2>${op === 'sell' ? 'Sell' : 'Give'} ${n} lead${s} to a firm</h2><p>${op === 'sell' ? `Each lead is charged at its current price (${num(targets.reduce((a, l) => a + l.price, 0))} credits in total). Stops if they run out of credits.` : 'No credits are charged.'} They get the usual new-lead email for each one.${note}</p>
        <label>Firm<select name="b" required><option value="">Choose a firm</option>${brokers.map((x) => `<option value="${x.id}">${h(x.company)}${x.contact_name ? ` (${h(x.contact_name)})` : ''} · ${num(x.credits)} credits${x.approved ? '' : ' · not approved'}</option>`).join('')}</select></label>
        <div class="pf-row"><button class="pf-btn" value="cancel" formnovalidate>Cancel</button><button class="pf-btn pf-btn-primary" value="ok">${op === 'sell' ? 'Sell' : 'Give'} ${n} lead${s}</button></div></form>`;
      modal.showModal();
      const broker = await new Promise((done) => (modal.onclose = () => { modal.onclose = null; done(modal.returnValue === 'ok' ? modal.querySelector('select').value : null); }));
      if (!broker) return;
      body = { op: 'assign', broker, charge: op === 'sell' };
    } else if (op === 'price') {
      const r = await confirmBox({ title: `Set the price of ${n} lead${s}`, text: `In credits (1 credit = £1). Fixed prices aren’t halved by the 72-hour discount.${note}`, ok: 'Set price', input: 'Price in credits' });
      modal.close(); if (r === null) return;
      const p = Math.round(Number(r.replace(/[^\d.]/g, '')));
      if (!(p >= 1 && p <= 1000)) return toast('Price must be between 1 and 1,000 credits', true);
      body = { op: 'relist', price: p };
    } else {
      const C = { half: [`Put ${n} lead${s} at 50% off?`, 'Half of each lead’s full price. The old price shows crossed out.', '50% off'],
        full: [`Put ${n} lead${s} back to full price?`, 'Removes any discount, including the automatic 72-hour one.', 'Full price'],
        relist: [`Take ${n} sold lead${s} back and put them in Opportunities?`, 'At full price. This doesn’t refund the firms that bought them. Approve their refunds first if they’re owed one.', 'Put back'],
        suppress: [`Suppress email for ${n} lead${s}?`, 'Adds their email addresses to the suppression list. Leaflegal and firms’ CRMs won’t email them again, including match emails. Texts and WhatsApp aren’t affected.', 'Suppress'],
        unsuppress: [`Remove ${n} lead${s} from the suppression list?`, 'They can be emailed again. Only do this if they’ve asked to hear from us.', 'Remove'],
        hide: [`Hide ${n} lead${s}?`, 'They leave this list (find them under Status → Hidden) and come off Opportunities, so firms can’t buy them. Sold leads stay with their buyer.', 'Hide'],
        unhide: [`Unhide ${n} lead${s}?`, 'They come back to this list, and unsold ones go back on Opportunities.', 'Unhide'],
        delete: [`Delete ${n} lead${s}?`, `This can’t be undone. Type <b>delete</b> to confirm.`, 'Delete'] }[op];
      const r = await confirmBox({ title: C[0], text: C[1] + note, ok: C[2], danger: op === 'delete' || op === 'relist', input: op === 'delete' ? 'Confirm' : undefined });
      modal.close(); if (r === null) return;
      if (op === 'delete' && r.toLowerCase() !== 'delete') return toast('Type delete to confirm', true);
      body = ['delete', 'suppress', 'unsuppress', 'hide', 'unhide'].includes(op) ? { op } : { op: 'relist', price: op === 'half' ? 'half' : 'full' };
    }
    toast(`Working on ${n} lead${s}…`);
    let ok = 0; const errs = [];
    for (const l of targets) { // one at a time, so credits and "already sold" checks stay right
      try { await api('admin-lead', { id: l.id, ...body, ...(op === 'delete' ? { confirm: l.id } : {}) }); ok++; lsel.delete(l.id); }
      catch (ex) { errs.push(`#${l.id}: ${ex.message}`); if (op === 'sell' && /credits/.test(ex.message)) break; }
    }
    toast(errs.length ? `${ok} done, ${errs.length} failed. ${errs[0]}` : `Done: ${ok} lead${ok === 1 ? '' : 's'}`, !!errs.length);
    admin();
  }
  // Admin overview: what needs doing, then recent leads, clients and activity.
  function overview(d, pend, kpis) {
    const cl = d.brokers.filter((b) => !b.is_admin), waiting = cl.filter((b) => !b.approved && !b.suspended_at);
    const today = d.leads.filter((l) => new Date(l.created_at).toDateString() === new Date().toDateString());
    const todo = [
      waiting.length && [`${waiting.length} client${waiting.length === 1 ? '' : 's'} awaiting approval`, waiting.slice(0, 3).map((b) => b.company).join(', '), 'brokers', 'user'],
      pend.length && [`${pend.length} refund request${pend.length === 1 ? '' : 's'}`, pend.slice(0, 3).map((r) => r.brokers?.company).filter(Boolean).join(', '), 'refunds', 'undo'],
      d.stats.for_sale.leads && [`${d.stats.for_sale.leads} lead${d.stats.for_sale.leads === 1 ? '' : 's'} for sale`, `£${num(d.stats.for_sale.credits)} unsold, last 30 days`, 'leads', 'inbox'],
    ].filter(Boolean);
    const card = (title, link, rows) => `<section class="pf-card pf-ov-card"><div class="pf-card-h"><h3>${title}</h3><a href="${P}/admin/${link}">See all${I.arrow}</a></div>${rows}</section>`;
    const leadRows = d.leads.slice(0, 8).map(L).map((l) => `<button type="button" class="pf-ov-row" data-alead="${l.id}"><span class="pf-ov-main"><b>${leadTitle(l)}</b><span>${h(l.area_label || areaName(l.area))} · ${h(l.region || '–')} · ${ago(l.created_at)}</span></span>
      <span class="pf-ov-side">${l.buyer ? `<b>${h(l.brokers?.company || '')}</b><span>${l.paid != null ? `${l.paid ? `${num(l.paid)} cr` : '£0'} · ` : ''}${STAGE_NAME[l.stage || 'new']}</span>` : leadLive(l) ? '<span class="pf-stage pf-st-new">Live</span>' : '<span class="pf-stage pf-st-lost">Unsold</span>'}</span></button>`).join('') || '<p class="pf-hint">No leads yet.</p>';
    const bought = (id) => d.leads.filter((l) => l.buyer === id).length;
    const clientRows = [...cl].sort((a, z) => (z.created_at || '').localeCompare(a.created_at || '')).slice(0, 6).map((b) => `<button type="button" class="pf-ov-row" data-client="${b.id}"><span class="pf-avatar pf-avatar-s">${initials(b.company)}</span><span class="pf-ov-main"><b>${h(b.company)}</b><span>${h(b.contact_name || b.email)} · joined ${dayOnly(b.created_at)}</span></span>
      <span class="pf-ov-side"><b>${num(b.credits)} cr</b><span>${bought(b.id)} lead${bought(b.id) === 1 ? '' : 's'}</span></span></button>`).join('') || '<p class="pf-hint">No clients yet.</p>';
    const actRows = (d.audit || []).slice(0, 6).map((x) => `<div class="pf-ov-row"><span class="pf-ov-main"><b>${h(x.action)}</b><span>${h(x.target || '')}</span></span><span class="pf-ov-side"><span>${ago(x.at)}</span></span></div>`).join('') || '<p class="pf-hint">No admin activity yet.</p>';
    return `${todo.length ? `<div class="pf-ov-todo">${todo.map(([t, s, k, i]) => `<a href="${P}/admin/${k}" class="pf-ov-task"><span class="pf-ov-ic">${I[i]}</span><span><b>${t}</b><span>${h(s)}</span></span>${I.arrow}</a>`).join('')}</div>` : ''}${kpis}
      <p class="pf-hint pf-mb">${today.length} lead${today.length === 1 ? '' : 's'} today · ${today.filter((l) => l.buyer).length} sold</p>
      <div class="pf-ov-grid">${card('Latest leads', 'leads', leadRows)}${card('Newest clients', 'brokers', clientRows)}${card('Recent activity', 'audit', actRows)}</div>`;
  }
  async function admin() {
    if (!me.is_admin) { nav('dashboard'); return; }
    const sub = location.pathname.slice(P.length).split('/')[2];
    adminTab = ADM.some(([k]) => k === sub) ? sub : 'overview';
    shell('admin');
    const d = await api('admin');
    const draw = () => {
      const pend = d.returns.filter((r) => r.status === 'pending');
      const badge = { brokers: d.stats.pending, refunds: pend.length };
      let body = '';
      // Clients: "active" = on a plan or holding credits.
      const nm = (b) => b.company || '', cr = (b) => Number(b.credits) || 0, live = (b) => !!b.plan || cr(b) > 0, cl = d.brokers.filter((b) => !b.is_admin), nLive = cl.filter(live).length;
      const SORTS = { active: ['Plan or credits first', (a, z) => live(z) - live(a) || cr(z) - cr(a) || nm(a).localeCompare(nm(z))],
        credits: ['Most credits', (a, z) => cr(z) - cr(a) || nm(a).localeCompare(nm(z))],
        name: ['Name A–Z', (a, z) => nm(a).localeCompare(nm(z))], newest: ['Newest', (a, z) => (z.created_at || '').localeCompare(a.created_at || '')] };
      const shown = cl.filter((b) => cFilter === 'all' || (cFilter === 'live') === live(b)).sort(SORTS[cSort][1]);
      if (adminTab === 'brokers') body = `<div class="pf-toolbar pf-mb"><div class="pf-row-l"><div class="pf-seg" role="tablist" aria-label="Filter clients">${[['all', 'All', cl.length], ['live', 'Plan or credits', nLive], ['none', 'No plan or credits', cl.length - nLive]].map(([k, n, c]) => `<button type="button" data-cf="${k}" class="${cFilter === k ? 'on' : ''}">${n} <em class="pf-badge">${c}</em></button>`).join('')}</div>
          <label class="pf-select"><select data-csort aria-label="Sort clients">${Object.entries(SORTS).map(([k, [n]]) => `<option value="${k}" ${cSort === k ? 'selected' : ''}>${n}</option>`).join('')}</select></label></div>
        <button class="pf-btn pf-btn-primary" data-invite>${I.mail}Invite a firm</button></div><div class="pf-card pf-flush"><table class="pf-table"><thead><tr><th>Firm</th><th class="pf-hide-s">Contact</th><th>Credits</th><th>Status</th><th></th></tr></thead><tbody>
        ${shown.map((b) => `<tr class="pf-rowlink" data-client="${b.id}" tabindex="0"><td><div class="pf-biz"><span class="pf-avatar pf-avatar-s">${initials(b.company)}</span><div><b>${h(b.company)}</b><span>${h(b.email)}</span></div></div></td>
          <td class="pf-hide-s"><span class="pf-strong">${h(b.contact_name || '–')}</span><span>${h(b.phone || '')}${(b.regulators || []).length ? ` · ${b.regulators.map((r) => `${regShort(r.id)} ${h(r.number || '')}`).join(', ')}` : ''}${b.regulator_checked_at ? ' · checked' : ''}</span></td>
          <td><b>${num(b.credits)}</b><span>${b.mode === 'auto' ? 'Auto-buy' : 'Manual'}</span></td>
          <td>${b.suspended_at ? '<span class="pf-stage pf-st-lost">Suspended</span>' : b.approved ? '<span class="pf-stage pf-st-instructed">Approved</span>' : '<span class="pf-stage pf-st-consultation">Pending</span>'}${b.plan ? `<span>${h(b.plan.name)} · ${b.plan.commission ? 'commission' : 'invoiced'}</span>` : ''}${(() => { const g = (d.agreements || []).find((x) => x.broker === b.id); return `<span>${g ? `Agreement signed ${dayOnly(g.created_at)}${g.version !== d.termsVersion ? ' (older version)' : ''}` : (d.waived || []).includes(b.id) ? 'Agreement not needed' : 'No agreement yet'}</span>`; })()}</td>
          <td class="pf-r"><div class="pf-actions">${b.approved || b.suspended_at ? '' : `<button class="pf-btn pf-btn-sm pf-btn-primary" data-approve="${b.id}" data-v="1">Approve</button>`}<button class="pf-btn pf-btn-sm" data-credit="${b.id}">${I.coins}Credits</button><button class="pf-btn pf-btn-sm" type="button">Manage</button></div></td></tr>`).join('') || '<tr><td colspan="5" class="pf-hint">No clients in this view.</td></tr>'}</tbody></table></div>
        ${d.brokers.some((b) => b.is_admin) ? `<div class="pf-card-h pf-mt"><h3>Team</h3><span>admin accounts · not counted as clients</span></div>
        <div class="pf-card pf-flush"><table class="pf-table"><tbody>${d.brokers.filter((b) => b.is_admin).map((b) => `<tr class="pf-rowlink" data-client="${b.id}" tabindex="0"><td><div class="pf-biz"><span class="pf-avatar pf-avatar-s">${initials(b.contact_name || b.company)}</span><div><b>${h(b.contact_name || b.company)}</b><span>${h(b.email)}</span></div></div></td><td class="pf-r"><span class="pf-stage pf-st-contacted">Admin</span></td></tr>`).join('')}</tbody></table></div>` : ''}
        ${d.invites?.length ? `<p class="pf-hint pf-mt">${num(d.invites.length)} invited firm${d.invites.length === 1 ? ' hasn’t' : 's haven’t'} joined yet. See the Invites tab.</p>` : ''}`;
      if (adminTab === 'agreements') body = d.agreements?.length ? `<div class="pf-card pf-flush"><table class="pf-table"><thead><tr><th>Firm</th><th class="pf-hide-s">Signed by</th><th>Signed</th><th></th></tr></thead><tbody>
        ${d.agreements.map((g) => `<tr><td><b>${h(g.company || d.brokers.find((x) => x.id === g.broker)?.company || '–')}</b><span>LL-PA-${String(g.id).padStart(5, '0')}</span></td>
          <td class="pf-hide-s"><b>${h(g.signer_name)}</b><span>${h(g.signer_title || '')}${g.signer_email ? ` · ${h(g.signer_email)}` : ''}</span></td>
          <td><b>${dayOnly(g.created_at)}</b><span>v${h(g.version)}${g.version === d.termsVersion ? ' · current' : ' · older version'}</span></td>
          <td class="pf-r"><div class="pf-actions"><button class="pf-btn pf-btn-sm" data-agv="${g.id}">View</button><button class="pf-btn pf-btn-sm" data-agd="${g.id}">${I.download}Download</button></div></td></tr>`).join('')}</tbody></table></div>`
        : empty('doc', 'No signed agreements yet', 'When a firm accepts the referral agreement, it appears here and they get a copy by email.');
      if (adminTab === 'refunds') body = d.returns.length ? `<div class="pf-card pf-flush"><table class="pf-table"><thead><tr><th>Lead</th><th class="pf-hide-s">Firm</th><th>Reason</th><th>Status</th><th></th></tr></thead><tbody>
        ${d.returns.map((r) => `<tr><td><b>#${r.lead_id} ${h(r.leads?.matter_label || r.leads?.full_name || r.leads?.business || '')}</b><span>${r.leads?.price} credits · ${ago(r.created_at)}</span></td><td class="pf-hide-s">${h(r.brokers?.company || '')}</td>
          <td><b>${h(r.reason)}</b><span>${h(r.details || '')}</span>${r.decision ? `<span>${/^Declined automatically/.test(r.decision) ? 'Told it isn’t refundable (feedback only)' : `Declined: ${h(r.decision)}`}</span>` : ''}</td><td><span class="pf-refund-tag ${r.status}">${/^Declined automatically/.test(r.decision || '') ? 'Feedback' : r.status}</span></td>
          <td class="pf-r">${r.status === 'pending' ? `<div class="pf-actions"><button class="pf-btn pf-btn-sm pf-btn-primary" data-refund="${r.id}" data-v="1">Refund</button><button class="pf-btn pf-btn-sm" data-refund="${r.id}" data-v="0">Decline</button></div>` : `<button class="pf-btn pf-btn-sm" data-alead="${r.lead_id}">Open lead</button>`}</td></tr>`).join('')}</tbody></table></div>`
        : empty('undo', 'No refund requests', 'When a firm reports a bad lead it appears here to approve or decline.');
      if (adminTab === 'leads') body = leadsTab(d);
      if (adminTab === 'pricing') {
        const P = { ...DEFAULT_PRICING, ...(d.pricing?.areas ? d.pricing : pricing?.areas ? pricing : {}) };
        const row = (name, label, v, ph = '') => `<tr><td>${label}</td><td><input name="${h(name)}" inputmode="decimal" value="${v ?? ''}" placeholder="${h(ph)}" aria-label="${h(String(label).replace(/<[^>]+>/g, ''))}"></td></tr>`;
        const vals = [...(P.value || [])].concat([[null, null], [null, null]]).slice(0, Math.max(3, (P.value || []).length + 1));
        body = `<form data-pricing><div class="pf-two-col"><section class="pf-card"><div class="pf-card-h"><h3>Base price per practice area</h3><span>Credits (1 credit = £1 + VAT)</span></div>
          <table class="pf-table pf-mini pf-inputs"><tbody>${TX.areas.map((a) => row(`area:${a.slug}`, h(a.label), P.areas?.[a.slug] ?? 50)).join('')}</tbody></table>
          <div class="pf-card-h pf-mt"><h3>Range and multipliers</h3></div>
          <table class="pf-table pf-mini pf-inputs"><tbody>${row('min', 'Minimum lead price', P.min)}${row('max', 'Maximum lead price', P.max)}
            ${TX.grades.map((g) => row(`grade:${g}`, `Grade ${g} multiplier`, P.grade?.[g] ?? 1)).join('')}
            ${row('urgent', 'Urgent (needed urgently) multiplier', P.urgent)}${row('business', 'Business client multiplier', P.business)}</tbody></table>
          <div class="pf-card-h pf-mt"><h3>Value multipliers</h3><span>First match from the top, by the lead’s minimum value</span></div>
          <table class="pf-table pf-mini pf-inputs"><thead><tr><th>Value at or above (£)</th><th>Multiplier</th></tr></thead><tbody>${vals.map(([v, m], i) => `<tr><td><input name="vmin:${i}" inputmode="numeric" value="${v != null ? num(v) : ''}" aria-label="Value threshold ${i + 1}"></td><td><input name="vmul:${i}" inputmode="decimal" value="${m ?? ''}" aria-label="Value multiplier ${i + 1}"></td></tr>`).join('')}</tbody></table>
          <p class="pf-hint">Price = base × grade × urgent × business × value, rounded to the nearest 5 and kept between the minimum and maximum. Base is the matter’s own price when it has one, otherwise the area’s. Applies to new leads.</p></section>
          <section class="pf-card"><div class="pf-card-h"><h3>Matter prices</h3><span>Leave blank to use the area’s base price</span></div>
          ${TX.areas.map((a) => `<details class="pf-fold" ${a.matters.some(([k]) => P.matters?.[`${a.slug}/${k}`] != null) ? 'open' : ''}><summary><b>${h(a.label)}</b><span>base ${num(P.areas?.[a.slug] ?? 50)} · ${a.matters.filter(([k]) => P.matters?.[`${a.slug}/${k}`] != null).length} set</span></summary>
            <table class="pf-table pf-mini pf-inputs"><tbody>${a.matters.map(([k, t]) => row(`matter:${a.slug}/${k}`, h(t), P.matters?.[`${a.slug}/${k}`], 'Area base')).join('')}</tbody></table></details>`).join('')}
          <div class="pf-card-h pf-mt"><h3>Current prices</h3><span>Grade B, individual, not urgent</span></div>
          ${priceExamples()}</section></div>
          <div class="pf-row-l pf-mt"><button class="pf-btn pf-btn-primary">Save pricing</button><button type="button" class="pf-btn" data-reset>Reset to defaults</button></div></form>`;
      }
      if (adminTab === 'audit') body = d.audit?.length ? `<div class="pf-card pf-flush"><table class="pf-table"><thead><tr><th>When</th><th>Admin</th><th>Action</th><th class="pf-hide-s">Detail</th></tr></thead><tbody>
        ${d.audit.map((x) => `<tr><td>${date(x.at)}</td><td>${h(x.brokers?.company || '–')}</td><td><b>${h(x.action)}</b><span>${h(x.target)}</span></td><td class="pf-hide-s"><span class="pf-mono">${h(JSON.stringify(x.detail || {})).slice(0, 160)}</span></td></tr>`).join('')}</tbody></table></div>`
        : empty('shield', 'No admin activity yet', 'Approvals, credit changes, refunds, pricing and plan changes made by admins are recorded here.');
      if (adminTab === 'finance') body = '<div data-finance><div class="pf-skel"></div></div>';
      if (adminTab === 'forecast') body = '<div data-forecast><div class="pf-skel"></div></div>';
      if (adminTab === 'ads') body = '<div data-ads><div class="pf-skel"></div></div>';
      if (adminTab === 'emails') body = '<div data-emails><div class="pf-skel"></div></div>';
      if (adminTab === 'invites') body = '<div data-invites></div>';
      if (adminTab === 'blog') body = '<div data-blog><div class="pf-skel"></div></div>';
      const M = d.stats.money;
      const subnav = `<nav class="pf-adm-sub" aria-label="Admin sections">${ADM.map(([k, n, i]) => `<a href="${P}/admin/${k}" class="${adminTab === k ? 'on' : ''}" ${adminTab === k ? 'aria-current="page"' : ''}>${I[i]}${n}${badge[k] ? ` <em class="pf-badge">${badge[k]}</em>` : ''}</a>`).join('')}</nav>`;
      const kpis = adminTab !== 'overview' ? '' : `<div class="pf-kpis">
          <div class="pf-kpi pf-kpi-dark"><span>${I.target}MRR</span><b>${M.mrr == null ? '–' : '£' + num(Math.round(M.mrr))}</b><em>${M.mrr == null ? 'Stripe not connected' : `${M.subs} active plan${M.subs === 1 ? '' : 's'}${M.cancelling ? ` · ${M.cancelling} cancelling` : ''} · ex VAT`}</em></div>
          <div class="pf-kpi"><span>${I.coins}Cash collected</span><b>${M.cash == null ? '–' : '£' + num(Math.round(M.cash))}</b><em>${M.cash == null ? 'Stripe not connected' : `£${num(Math.round(M.cash_ex_vat))} ex VAT${M.refunded ? ` · £${num(Math.round(M.refunded))} refunded` : ''} · all time`}</em></div>
          <div class="pf-kpi"><span>${I.spark}Credits spent</span><b>${num(M.spent)}</b><em>on leads, after refunds · all time</em></div>
          <div class="pf-kpi"><span>${I.layers}Credits left to spend</span><b>${num(M.unspent)}</b><em>across ${M.holders} firm${M.holders === 1 ? '' : 's'} · paid for, not yet used</em></div></div>
        <div class="pf-kpis">
          <div class="pf-kpi"><span>${I.user}Firms</span><b>${d.stats.brokers}</b><em>${d.stats.active ?? 0} on a plan${d.stats.commission ? ` · ${d.stats.commission} on commission` : ''} · ${d.stats.pending} awaiting approval</em></div>
          <div class="pf-kpi"><span>${I.inbox}Leads (latest 500)</span><b>${d.stats.leads}</b><em>${d.stats.sold} sold</em></div>
          <div class="pf-kpi"><span>${I.spark}Leads for sale</span><b>£${num(d.stats.for_sale.credits)}</b><em>${d.stats.for_sale.leads} unsold lead${d.stats.for_sale.leads === 1 ? '' : 's'}${d.stats.for_sale.full !== d.stats.for_sale.credits ? ` · £${num(d.stats.for_sale.full)} before discounts` : ''}</em></div>
          <div class="pf-kpi"><span>${I.undo}Refund requests</span><b>${d.stats.refunds}</b><em>pending</em></div>
</div>`;
      view().innerHTML = `<div class="pf-adm">${subnav}<h2 class="pf-adm-title">${ADM.find(([k]) => k === adminTab)[1]}</h2>${adminTab === 'overview' ? overview(d, pend, kpis) : body}</div>`;
      const sn = view().querySelector('.pf-adm-sub'), on = sn.querySelector('.on');
      if (on && sn.scrollWidth > sn.clientWidth) sn.scrollLeft = on.offsetLeft - (sn.clientWidth - on.offsetWidth) / 2;
      view().querySelectorAll('[data-cf]').forEach((b) => (b.onclick = () => { cFilter = b.dataset.cf; draw(); }));
      view().querySelector('[data-csort]')?.addEventListener('change', (e) => { cSort = e.target.value; draw(); });
      view().querySelectorAll('[data-approve]').forEach((b) => (b.onclick = async (e) => {
        e.stopPropagation(); // don't also open the client drawer from the row
        try { await api('admin-broker', { id: b.dataset.approve, approved: b.dataset.v === '1' }); toast(b.dataset.v === '1' ? 'Firm approved and emailed' : 'Firm suspended'); admin(); } catch (ex) { toast(ex.message, true); }
      }));
      view().querySelector('[data-invite]')?.addEventListener('click', inviteModal);
      view().querySelectorAll('[data-uninvite]').forEach((b) => (b.onclick = async () => {
        const v = d.invites.find((x) => x.email === b.dataset.uninvite);
        const r = await confirmBox({ title: `Cancel the invite to ${h(v.name)}?`, text: `The email due ${when(v.send_at)} won't be sent, and they won't get new-lead emails.`, ok: 'Cancel invite', danger: true });
        modal.close(); if (r === null) return;
        try { await api('admin-invite-cancel', { email: v.email }); toast(`Invite to ${v.email} cancelled`); admin(); } catch (ex) { toast(ex.message, true); }
      }));
      view().querySelectorAll('[data-credit]').forEach((b) => (b.onclick = (e) => { e.stopPropagation(); creditModal(d.brokers.find((x) => x.id === b.dataset.credit)); }));
      view().querySelectorAll('[data-client]').forEach((r) => { const go = () => clientDrawer(r.dataset.client); r.onclick = go; r.onkeydown = (e) => e.key === 'Enter' && go(); });
      view().querySelectorAll('[data-agv],[data-agd]').forEach((x) => (x.onclick = () => { const g = d.agreements.find((y) => y.id === +(x.dataset.agv || x.dataset.agd)); openAgreement(g, g.company, !!x.dataset.agd).catch((ex) => toast(ex.message, true)); }));
      view().querySelectorAll('[data-alead]').forEach((r) => { const go = () => adminLeadDrawer(+r.dataset.alead); r.onclick = go; r.onkeydown = (e) => e.key === 'Enter' && go(); });
      if (adminTab === 'leads') wireLeadsTab(d, draw);
      if (adminTab === 'finance') finance(view().querySelector('[data-finance]'));
      if (adminTab === 'forecast') forecast(view().querySelector('[data-forecast]'), d);
      if (adminTab === 'ads') adsTab(view().querySelector('[data-ads]'));
      if (adminTab === 'emails') emailsTab(view().querySelector('[data-emails]'));
      if (adminTab === 'invites') invitesTab(view().querySelector('[data-invites]'), d);
      if (adminTab === 'blog') blogTab(view().querySelector('[data-blog]'));
      view().querySelectorAll('[data-refund]').forEach((b) => (b.onclick = async () => {
        const r = d.returns.find((x) => x.id === +b.dataset.refund);
        if (b.dataset.v === '0') return declineModal(r);
        if (await confirmBox({ title: `Refund ${r.leads?.price} credits to ${h(r.brokers?.company || 'the firm')}?`, text: `For lead #${r.lead_id}. They’ll be emailed. Next the lead can go back in Opportunities or to another firm.`, ok: 'Refund' }) === null) return;
        try { await api('admin-refund', { id: r.id, approve: true }); toast('Refunded and firm emailed'); admin(); adminLeadDrawer(r.lead_id); } catch (ex) { toast(ex.message, true); }
      }));
      const pf = view().querySelector('[data-pricing]');
      if (pf) {
        const sendPricing = async (P) => { try { const r = await api('admin-pricing', P); if (r?.pricing) pricing = { ...(pricing || {}), ...r.pricing }; toast('Pricing saved'); admin(); } catch (ex) { toast(ex.message, true); } };
        pf.onsubmit = (e) => {
          e.preventDefault(); const fd = new FormData(pf), n = (k) => { const v = String(fd.get(k) ?? '').replace(/[^\d.]/g, ''); return v === '' ? null : Number(v); };
          const value = [...fd.keys()].filter((k) => k.startsWith('vmin:')).map((k) => [n(k), n(`vmul:${k.slice(5)}`)]).filter(([v, m]) => v != null && m != null).sort((x, y) => y[0] - x[0]);
          sendPricing({ min: n('min'), max: n('max'), urgent: n('urgent'), business: n('business'),
            areas: Object.fromEntries(TX.areas.map((a) => [a.slug, n(`area:${a.slug}`)]).filter(([, v]) => v != null)),
            matters: Object.fromEntries([...fd.keys()].filter((k) => k.startsWith('matter:')).map((k) => [k.slice(7), n(k)]).filter(([, v]) => v != null)),
            grade: Object.fromEntries(TX.grades.map((g) => [g, n(`grade:${g}`)]).filter(([, v]) => v != null)), value });
        };
        pf.querySelector('[data-reset]').onclick = async () => { if (await confirmBox({ title: 'Reset pricing to the defaults?', text: 'Every area, matter and multiplier goes back to the standard prices. Applies to new leads.', ok: 'Reset', danger: true }) === null) return; modal.close(); sendPricing(d.defaults || DEFAULT_PRICING); };
      }
    };
    draw();
  }

  // ------------------------------------------------ admin: finance (all figures ex VAT unless stated)
  const money2 = (n) => (n < 0 ? '−' : '') + '£' + Math.abs(n).toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  const PERIODS = [['today', 'Today'], ['yesterday', 'Yesterday'], ['7', 'Last 7 days'], ['14', 'Last 14 days'], ['28', 'Last 28 days'], ['30', 'Last 30 days'],
    ['week', 'This week'], ['lastweek', 'Last week'], ['month', 'This month'], ['last', 'Last month'], ['90', 'Last 90 days'], ['12m', 'Last 12 months'], ['max', 'All time'], ['custom', 'Custom dates']];
  // ------------------------------------------------ ad spend simulator
  // One 30-day month at a chosen daily Meta spend. Two limits decide revenue:
  //   supply: leads the ads produce (spend ÷ cost per lead), × the share brokers want,
  //           valued at the average price paid (list price, less leads that drop to half price after 72 hours);
  //   demand: credits brokers' plans add each month (Stripe plans + invoiced plans), plus any new plans you expect to sign.
  // Credits only turn into money through plans, at £1 per credit on every plan.
  // Revenue = credits actually spent (the smaller of supply and demand) × £ per credit. Profit = revenue − ads − fees.
  // Cost per lead follows a U: it falls as spend scales from today's level, bottoms out at a "cheapest at" spend, then rises
  // a set % each time spend doubles beyond it (diminishing returns). Smooth parabola (in log-spend) down to the low point.
  // ponytail: steady state (brokers' plans sized to what they use, no churn or credit build-up); add those once real sales exist.
  // Ad simulator: take a real period (today, yesterday, last 7 or 30 days), then scale it to a chosen spend at the same
  // cost per lead and revenue per lead. Revenue uses the Finance rules (finBase), so both tabs agree.
  // ponytail: linear scaling plus one "cost per lead rises" knob; no saturation curve.
  // Ads performance: Meta spend per campaign / ad set / ad, against the leads each one brought in and what those leads
  // earned when sold (Finance's ledger rules). ROAS = revenue from sold leads ÷ ad spend, for leads that came in during the period.
  let adsP = '7', adsLvl = 'ad', adsSort = 'roas', adsCamp = '', adsCache = {};
  async function adsTab(box) {
    const PER = [['today', 'Today'], ['yesterday', 'Yesterday'], ['7', 'Last 7 days'], ['30', 'Last 30 days'], ['month', 'This month'], ['90', 'Last 90 days']];
    const LVL = [['campaign', 'Campaigns', 0], ['adset', 'Ad sets', 1], ['ad', 'Ads', 2]];
    const SORT = { roas: 'Best ROAS', rev: 'Most revenue', profit: 'Most profit', spend: 'Most spend', leads: 'Most leads', cpl: 'Cheapest lead' };
    const [from, to] = periodRange(adsP, null), key = `${isoDay(from)}|${isoDay(to)}`;
    let A;
    try { [A] = await Promise.all([adsCache[key] ||= apiFetch(`admin-ads&from=${isoDay(from)}&to=${isoDay(to)}`), loadFin()]); }
    catch (ex) { delete adsCache[key]; box.innerHTML = `<p class="pf-err">${h(ex.message)}</p>`; return; }
    if (!box.isConnected) return;
    // Campaigns: every one Meta knows plus any that spent in the period. Cards show live ones, ones changed (e.g. turned off)
    // in the last 7 days and ones that spent in the period; the picker narrows the whole page to one campaign, live or not.
    const allC = [...(A.campaigns || [])];
    for (const a of A.ads) if (!allC.some((c) => c.id === a.campaign_id)) allC.push({ id: a.campaign_id, name: a.campaign, status: 'UNKNOWN' });
    const spentC = new Set(A.ads.filter((a) => a.spend > 0).map((a) => a.campaign_id)), weekAgo = Date.now() - 7 * 864e5;
    allC.sort((a, z) => (z.status === 'ACTIVE') - (a.status === 'ACTIVE') || String(z.updated || '').localeCompare(String(a.updated || '')));
    const shownC = allC.filter((c) => c.status === 'ACTIVE' || spentC.has(c.id) || (c.updated && Date.parse(c.updated) >= weekAgo));
    const pick = adsCamp && allC.find((c) => c.id === adsCamp);
    if (pick) A = { ...A, ads: A.ads.filter((a) => a.campaign_id === pick.id), attrib: Object.fromEntries(Object.entries(A.attrib).filter(([, t]) => t[0] === pick.id || t[0] === pick.name)) };
    const cardC = pick ? [pick] : shownC, cState = (c) => c.status === 'ACTIVE' ? ['Live', 'pf-st-instructed'] : c.status === 'UNKNOWN' ? ['Off', 'pf-st-lost'] : [/PAUSED/.test(c.status) ? 'Paused' : 'Off', 'pf-st-lost'];
    const B = finBase(finData), rev = {}, sold = B.paidSold, taken = new Set(finData.leads.filter((l) => l.buyer).map((l) => l.id));
    for (const m of B.L) if (m.paid && m.lead) rev[m.lead] = (rev[m.lead] || 0) + (m.kind === 'sale' ? m.val : m.kind === 'refund' ? -m.val : 0);
    // Rows for one level: Meta stats summed per campaign / ad set / ad, then our leads, sales and revenue matched on by ID (or name).
    const rowsFor = (lvl) => {
      const ix = LVL.find(([k]) => k === lvl)[2], idK = `${lvl}_id`, rows = {};
      for (const a of A.ads) { const r = (rows[a[idK]] ||= { id: a[idK], name: a[lvl], campaign: a.campaign, adset: a.adset, thumb: null, title: null, live: false, spend: 0, impressions: 0, clicks: 0, leads: 0, sold: 0, free: 0, rev: 0, ids: [] });
        r.spend += a.spend; r.impressions += a.impressions; r.clicks += a.clicks; r.live ||= !!a.live; if (!r.thumb && a.thumb) Object.assign(r, { thumb: a.thumb, title: a.title }); }
      const byName = Object.fromEntries(Object.values(rows).map((r) => [r.name, r]));
      let untracked = 0;
      for (const [id, t] of Object.entries(A.attrib)) { const r = rows[t[ix]] || byName[t[ix]]; if (!r) { untracked++; continue; } r.leads++; r.ids.push(+id); if (sold.has(+id)) r.sold++; else if (taken.has(+id)) r.free++; r.rev += rev[id] || 0; }
      const list = Object.values(rows).filter((r) => r.spend > 0 || r.leads).map((r) => ({ ...r, cpl: r.leads ? r.spend / r.leads : Infinity, roas: r.spend ? r.rev / r.spend : 0, profit: r.rev - r.spend }));
      return { list, rows, untracked };
    };
    const { list, untracked } = rowsFor(adsLvl), camps = rowsFor('campaign').rows;
    // Same period on the Finance tab: every source, commission and non-Meta spend, so the gap can be explained.
    const inP = (d) => { const t = B.at(d); return t >= from && t <= to; }, FT = B.P({ L: B.L.filter((m) => inP(m.date)), comm: B.commAll.filter((e) => inP(e.date)), spend: B.spendAll.filter((e) => inP(e.date)), leads: finData.leads.filter((l) => inP(l.created_at)) });
    const adName = Object.fromEntries(A.ads.map((a) => [a.ad_id, a.ad])), leadById = Object.fromEntries((A.leads || []).map((l) => [l.id, l]));
    const val = { roas: (r) => r.roas, rev: (r) => r.rev, profit: (r) => r.profit, spend: (r) => r.spend, leads: (r) => r.leads, cpl: (r) => -r.cpl };
    list.sort((a, z) => val[adsSort](z) - val[adsSort](a) || z.spend - a.spend);
    const T = list.reduce((t, r) => ({ spend: t.spend + r.spend, leads: t.leads + r.leads, sold: t.sold + r.sold, free: t.free + r.free, rev: t.rev + r.rev, clicks: t.clicks + r.clicks, impressions: t.impressions + r.impressions }), { spend: 0, leads: 0, sold: 0, free: 0, rev: 0, clicks: 0, impressions: 0 });
    const x2 = (v) => `${v.toFixed(2)}×`, pct = (a, b) => (b ? `${Math.round((a / b) * 100)}%` : '–');
    const thumb = (r) => r.thumb ? `<img class="pf-ads-th" src="${h(r.thumb)}" alt="" loading="lazy" referrerpolicy="no-referrer">` : `<span class="pf-ads-th pf-ads-th-0">${I.target}</span>`;
    const best = adsLvl === 'ad' ? list.filter((r) => r.sold).sort((a, z) => z.roas - a.roas).slice(0, 3) : [];
    const kpi = (label, v, sub, cls = '') => `<div class="pf-kpi ${cls}"><span>${label}</span><b>${v}</b><em>${sub}</em></div>`;
    box.innerHTML = `<div class="pf-ads-bar"><div class="pf-seg" role="tablist" aria-label="Period">${PER.map(([k, n]) => `<button type="button" data-ap="${k}" class="${adsP === k ? 'on' : ''}">${n}</button>`).join('')}</div>
        <div class="pf-seg" role="tablist" aria-label="Level">${LVL.map(([k, n]) => `<button type="button" data-al="${k}" class="${adsLvl === k ? 'on' : ''}">${n}</button>`).join('')}</div>
        <label class="pf-select"><select data-ac aria-label="Campaign"><option value="">All campaigns</option>${allC.map((c) => `<option value="${h(c.id)}" ${adsCamp === c.id ? 'selected' : ''}>${h(c.name || c.id)}${c.status === 'ACTIVE' ? '' : ` (${cState(c)[0].toLowerCase()})`}</option>`).join('')}</select></label>
        <label class="pf-select"><select data-as aria-label="Sort">${Object.entries(SORT).map(([k, n]) => `<option value="${k}" ${adsSort === k ? 'selected' : ''}>${n}</option>`).join('')}</select></label></div>
      ${A.status !== 'ok' ? `<div class="pf-banner pf-banner-warn pf-mb">${I.shield}<div><b>Couldn’t load Meta ad stats.</b> ${h(A.status)}</div></div>` : ''}
      <div class="pf-kpis">${kpi(`${I.target}Meta spend`, money2(T.spend), `${num(T.clicks)} clicks · ${pct(T.clicks, T.impressions)} CTR`)}${kpi(`${I.inbox}Leads`, num(T.leads), `${T.leads ? money2(T.spend / T.leads) : '–'} per lead${untracked ? ` · ${untracked} not tagged to an ad` : ''}`)}
        ${kpi(`${I.check}Sold (paid)`, num(T.sold), `${pct(T.sold, T.leads)} of leads${T.free ? ` · ${T.free} more given free or on commission` : ''}`)}${kpi(`${I.coins}ROAS`, T.spend ? x2(T.rev / T.spend) : '–', `${money2(T.rev)} revenue · profit ${money2(T.rev - T.spend)}`, `pf-kpi-dark ${T.rev < T.spend ? 'pf-kpi-loss' : ''}`)}</div>
      ${cardC.length ? `<h3 class="pf-dsec">${pick ? 'Campaign' : 'Campaigns · live or run in the last 7 days'}</h3><div class="pf-ads-live">${cardC.map((c) => { const r = camps[c.id] || { spend: 0, leads: 0, sold: 0, free: 0, rev: 0, clicks: 0, ids: [] };
        const ids = Object.entries(A.attrib).filter(([, t]) => t[0] === c.id || t[0] === c.name).map(([id]) => +id).sort((a, z) => z - a), roas = r.spend ? r.rev / r.spend : 0;
        return `<details class="pf-card pf-ads-camp"><summary><div class="pf-ads-camp-h"><span class="pf-stage ${cState(c)[1]}">${cState(c)[0]}</span><b>${h(c.name)}</b><span>${c.daily ? `${money2(c.daily)} a day` : c.lifetime ? `${money2(c.lifetime)} lifetime budget` : 'Budget set on ad sets'}</span></div>
          <dl class="pf-ads-camp-n"><div><dt>Spend</dt><dd>${money2(r.spend)}</dd></div><div><dt>Leads</dt><dd>${num(ids.length)}</dd></div><div><dt>Cost per lead</dt><dd>${ids.length ? money2(r.spend / ids.length) : '–'}</dd></div><div><dt>Sold (paid)</dt><dd>${num(r.sold)} · ${pct(r.sold, ids.length)}</dd>${r.free ? `<dd class="pf-ads-free">+${r.free} free / Aureum</dd>` : ''}</div><div><dt>Revenue</dt><dd>${money2(r.rev)}</dd></div><div><dt>ROAS</dt><dd class="${r.spend && roas < 1 ? 'pf-neg' : 'pf-pos'}">${r.spend ? x2(roas) : '–'}</dd></div></dl>
          <span class="pf-ads-camp-more">${ids.length ? `See ${ids.length} lead${ids.length === 1 ? '' : 's'}` : 'No leads in this period'}${I.chev}</span></summary>
          ${ids.length ? `<div class="pf-ads-leads">${ids.map((id) => { const l = leadById[id] || { id }, t = A.attrib[id]; return `<button type="button" class="pf-ov-row" data-alead="${id}"><span class="pf-ov-main"><b>#${id} ${h(l.matter_label || matterName(l.area || l.practice_area, l.matter) || '')}</b><span>${h(adName[t[2]] || t[2] || 'Ad not tagged')} · ${l.created_at ? ago(l.created_at) : ''}</span></span>
            <span class="pf-ov-side">${l.buyer ? `<b>${h(l.buyer)}</b><span>${sold.has(id) ? money2(rev[id] || 0) : 'Free · £0'} · ${STAGE_NAME[l.stage] || ''}</span>` : '<span class="pf-stage pf-st-lost">Unsold</span>'}</span></button>`; }).join('')}</div>` : ''}</details>`; }).join('')}</div>` : ''}
      ${best.length ? `<h3 class="pf-dsec">Best performing creative</h3><div class="pf-ads-best">${best.map((r, i) => `<article class="pf-card pf-ads-card">${r.thumb ? `<img src="${h(r.thumb)}" alt="" loading="lazy" referrerpolicy="no-referrer">` : `<div class="pf-ads-noimg">${I.target}</div>`}
        <div class="pf-ads-cb"><span class="pf-ads-rank">#${i + 1}${r.live ? ' · Live' : ''}</span><b>${h(r.name || 'Unnamed ad')}</b><span>${h(r.campaign || '')}</span>${r.title ? `<em>${h(r.title)}</em>` : ''}
        <dl><div><dt>ROAS</dt><dd>${x2(r.roas)}</dd></div><div><dt>Revenue</dt><dd>${money2(r.rev)}</dd></div><div><dt>Spend</dt><dd>${money2(r.spend)}</dd></div><div><dt>Paid sales</dt><dd>${r.sold} of ${r.leads}</dd></div></dl></div></article>`).join('')}</div>` : ''}
      <section class="pf-card pf-mt pf-flush"><div class="pf-card-h pf-pad"><h3>${LVL.find(([k]) => k === adsLvl)[1]}</h3><span>${list.length} with spend or leads · ${h(PER.find(([k]) => k === adsP)[1].toLowerCase())}</span></div>
        ${list.length ? `<table class="pf-table"><thead><tr><th>${LVL.find(([k]) => k === adsLvl)[1].slice(0, -1)}</th><th>Spend</th><th class="pf-hide-s">Clicks · CTR</th><th>Leads · CPL</th><th>Sold (paid)</th><th>Revenue</th><th>ROAS</th></tr></thead><tbody>
        ${list.map((r) => `<tr><td><div class="pf-biz">${adsLvl === 'ad' ? thumb(r) : ''}<div><b>${h(r.name || r.id)}${r.live ? ' <span class="pf-ads-on">Live</span>' : ''}</b><span>${h(adsLvl === 'campaign' ? '' : adsLvl === 'adset' ? r.campaign || '' : [r.campaign, r.adset].filter(Boolean).join(' › '))}</span></div></div></td>
          <td data-l="Spend"><b>${money2(r.spend)}</b></td><td class="pf-hide-s" data-l="Clicks"><b>${num(r.clicks)}</b><span>${pct(r.clicks, r.impressions)} CTR</span></td><td data-l="Leads"><b>${num(r.leads)}</b><span>${r.leads ? `${money2(r.cpl)} each` : 'no leads'}</span></td>
          <td data-l="Sold (paid)"><b>${num(r.sold)}</b><span>${pct(r.sold, r.leads)}${r.free ? ` · +${r.free} free` : ''}</span></td><td data-l="Revenue"><b>${money2(r.rev)}</b><span class="${r.profit < 0 ? 'pf-neg' : 'pf-pos'}">${money2(r.profit)} profit</span></td><td data-l="ROAS"><b class="${r.spend && r.roas < 1 ? 'pf-neg' : 'pf-pos'}">${r.spend ? x2(r.roas) : '–'}</b></td></tr>`).join('')}</tbody></table>`
        : `<p class="pf-hint pf-pad">No Meta ads with spend or leads in this period.</p>`}</section>
      <p class="pf-hint pf-mt">Leads are matched to ads by the tags on the ad link. Revenue is what clients paid for those leads (bonus and free credits £0, refunds taken off), counted for leads that came in during the period, whenever they sold. Recent leads may still sell. Ex VAT.</p>
      <p class="pf-hint">The Revenue tab for the same period shows ${num(FT.leads)} leads, ${money2(FT.rev)} revenue, ${money2(FT.ad)} ad spend. It counts every lead (LinkedIn, Google, direct and leads not tagged to a Meta ad), commission and non-Meta spend; and this page counts Meta-tagged leads and Meta spend only${FT.rev - T.rev > 0.5 ? `, so ${money2(FT.rev - T.rev)} of revenue isn’t here` : ''}.</p>`;
    box.querySelectorAll('[data-alead]').forEach((b) => (b.onclick = () => adminLeadDrawer(+b.dataset.alead)));
    box.querySelectorAll('[data-ap]').forEach((b) => (b.onclick = () => { adsP = b.dataset.ap; box.innerHTML = '<div class="pf-skel"></div>'; adsTab(box); }));
    box.querySelectorAll('[data-al]').forEach((b) => (b.onclick = () => { adsLvl = b.dataset.al; adsTab(box); }));
    box.querySelector('[data-ac]').onchange = (e) => { adsCamp = e.target.value; adsTab(box); };
    box.querySelector('[data-as]').onchange = (e) => { adsSort = e.target.value; adsTab(box); };
  }
  let simP = '7', simSpend = 10000, simRise = 0;
  async function forecast(box, d) {
    try { await loadFin(); } catch (ex) { box.innerHTML = `<p class="pf-err">${h(ex.message)}</p>`; return; }
    const F = finData, B = finBase(F), M = d.stats.money || {};
    const PER = [['today', 'Today'], ['yesterday', 'Yesterday'], ['7', 'Last 7 days'], ['30', 'Last 30 days']];
    const basis = (k) => {
      const [from, to] = periodRange(k, F.since), inP = (x) => { const t = B.at(x); return t >= from && t <= to; }, pick = (a, key = 'date') => a.filter((x) => inP(x[key]));
      const leads = pick(F.leads, 'created_at'), T = B.P({ L: pick(B.L), comm: pick(B.commAll), spend: pick(B.spendAll), fees: pick(B.feesAll), leads });
      const sold = leads.filter((l) => B.paidSold.has(l.id)).length;
      return { ...T, sold, days: Math.max(1, Math.round((Math.min(+to, Date.now()) - from) / 864e5)), cpl: T.leads && T.ad ? T.ad / T.leads : 0, sell: T.leads ? sold / T.leads : 0, perLead: T.leads ? T.rev / T.leads : 0, roas: T.ad ? T.rev / T.ad : 0 };
    };
    const at = (b, S) => { const cpl = b.cpl * (1 + simRise / 100), leads = cpl ? S / cpl : 0, rev = leads * b.perLead; return { cpl, leads, sold: leads * b.sell, rev, profit: rev - S, roas: S ? rev / S : 0 }; };
    const all = Object.fromEntries(PER.map(([k]) => [k, basis(k)]));
    const live = d.brokers.filter((b) => !b.suspended_at && !b.is_admin), monthly = Math.round(M.mrr || 0) + live.filter((b) => b.plan).reduce((a, b) => a + (Number(b.plan.credits) || 0), 0);
    const kpi = (label, val, sub, cls = '') => `<div class="pf-kpi ${cls}"><span>${label}</span><b>${val}</b><em>${sub}</em></div>`;
    const pct = (x) => `${Math.round(x * 100)}%`;
    const draw = () => {
      const b = all[simP], r = at(b, simSpend), name = PER.find(([k]) => k === simP)[1].toLowerCase();
      const young = simP === 'today' || simP === 'yesterday';
      const need = r.rev, short = need > (M.unspent || 0) + monthly;
      box.innerHTML = `<section class="pf-card"><div class="pf-sim-form">
          <div><span class="pf-sim-lab">Based on</span><div class="pf-seg" role="tablist">${PER.map(([k, n]) => `<button type="button" data-sp="${k}" class="${simP === k ? 'on' : ''}">${n}</button>`).join('')}</div></div>
          <div><span class="pf-sim-lab">If we spent</span><div class="pf-sim-spendrow"><div class="pf-money"><i>£</i><input data-ss inputmode="numeric" value="${simSpend}" aria-label="Ad spend to simulate"></div>
            ${[1000, 5000, 10000, 25000].map((v) => `<button type="button" class="pf-btn pf-btn-sm ${simSpend === v ? 'pf-btn-primary' : ''}" data-sv="${v}">£${v / 1000}k</button>`).join('')}</div></div>
          <label class="pf-sim-lab">Cost per lead rises at scale<div class="pf-money pf-np"><input data-sr inputmode="numeric" value="${simRise}" aria-label="Cost per lead rise"><b>%</b></div></label></div></section>
        <h3 class="pf-dsec">What happened · ${h(name)}</h3>
        ${b.ad ? `<div class="pf-kpis">${kpi(`${I.target}Ad spend`, money2(b.ad), `${b.days} day${b.days === 1 ? '' : 's'} · about ${money2(b.ad / b.days)} a day`)}${kpi(`${I.inbox}Leads`, num(b.leads), `${money2(b.cpl)} per lead`)}
          ${kpi(`${I.check}Sold (paid)`, `${num(b.sold)} · ${pct(b.sell)}`, `${money2(b.perLead)} revenue per lead made`)}${kpi(`${I.coins}Revenue`, money2(b.rev), `${b.roas.toFixed(2)}× ad spend · profit ${money2(b.profit)}`, b.profit < 0 ? 'pf-kpi-loss' : 'pf-kpi-win')}</div>`
          : `<p class="pf-hint">No ad spend recorded ${h(name)}, so there's nothing to scale. Pick another period.</p>`}
        ${b.ad ? `<h3 class="pf-dsec">If we spent ${money2(simSpend)} at ${h(name)}’s rates</h3>
        <div class="pf-kpis">${kpi(`${I.inbox}Leads`, num(Math.round(r.leads)), `at ${money2(r.cpl)} each`)}${kpi(`${I.check}Leads sold`, num(Math.round(r.sold)), `${pct(b.sell)} sell-through`)}
          ${kpi(`${I.coins}Revenue`, money2(r.rev), `${r.roas.toFixed(2)}× spend`)}${kpi(`${I.spark}Profit`, money2(r.profit), `revenue − ${money2(simSpend)} ads · ex VAT`, `pf-kpi-dark ${r.profit < 0 ? 'pf-kpi-loss' : ''}`)}</div>
        <p class="pf-hint">At ${h(name)}’s daily spend (${money2(b.ad / b.days)}) that’s about ${num(Math.ceil(simSpend / (b.ad / b.days)))} days of ads.${young ? ' Leads this recent may still sell, so revenue here can be understated.' : ''}</p>
        ${short ? `<div class="pf-banner pf-banner-warn pf-mt">${I.coins}<div><b>Firms would need to buy ${money2(need)} of leads.</b> They hold ${money2(M.unspent || 0)} of unspent credits and plans add about ${money2(monthly)} a month, so more plans are needed to sell this many.</div></div>` : ''}` : ''}
        <section class="pf-card pf-mt pf-flush"><div class="pf-card-h pf-pad"><h3>Every period at ${money2(simSpend)}</h3><span>same spend, each period’s rates</span></div>
          <table class="pf-table"><thead><tr><th>Based on</th><th>Spend · leads</th><th>Cost per lead</th><th>Sold</th><th>Revenue at ${money2(simSpend)}</th><th>Profit at ${money2(simSpend)}</th></tr></thead><tbody>
          ${PER.map(([k, n]) => { const x = all[k], y = at(x, simSpend); return `<tr class="${k === simP ? 'is-sel' : ''}"><td><b>${n}</b></td><td data-l="Spend"><b>${money2(x.ad)}</b><span>${num(x.leads)} leads</span></td><td data-l="Cost per lead">${x.cpl ? money2(x.cpl) : '–'}</td><td data-l="Sold">${pct(x.sell)}</td>
            <td data-l="Revenue">${x.ad ? money2(y.rev) : '–'}</td><td data-l="Profit">${x.ad ? `<b class="${y.profit < 0 ? 'pf-neg' : 'pf-pos'}">${money2(y.profit)}</b>` : '–'}</td></tr>`; }).join('')}</tbody></table></section>
        <p class="pf-hint pf-mt">Revenue counts only what clients pay (bonus and free credits are £0, refunds taken off, commission added), the same as the Revenue tab. Figures exclude VAT.</p>`;
      box.querySelectorAll('[data-sp]').forEach((x) => (x.onclick = () => { simP = x.dataset.sp; draw(); }));
      box.querySelectorAll('[data-sv]').forEach((x) => (x.onclick = () => { simSpend = +x.dataset.sv; draw(); }));
      const num0 = (v) => Math.max(0, Number(String(v).replace(/[^\d.]/g, '')) || 0);
      box.querySelector('[data-ss]').onchange = (e) => { simSpend = num0(e.target.value); draw(); };
      box.querySelector('[data-sr]').onchange = (e) => { simRise = num0(e.target.value); draw(); };
    };
    draw();
  }

  // Date ranges in local (London) time. "Last N days" are whole days up to yesterday, like Meta Ads Manager.
  function periodRange(k, since) {
    const now = new Date(), day = (d, n = 0) => { const x = new Date(d); x.setHours(0, 0, 0, 0); x.setDate(x.getDate() + n); return x; };
    const end = (d) => new Date(day(d, 1) - 1), t = day(now), eod = end(t), dow = (t.getDay() + 6) % 7, y = now.getFullYear(), m = now.getMonth();
    if (k === 'today') return [t, eod];
    if (k === 'yesterday') return [day(t, -1), end(day(t, -1))];
    if (/^\d+$/.test(k) && k !== '90') return [day(t, -Number(k)), end(day(t, -1))];
    if (k === '90') return [day(t, -90), end(day(t, -1))];
    if (k === 'week') return [day(t, -dow), eod];
    if (k === 'lastweek') return [day(t, -dow - 7), end(day(t, -dow - 1))];
    if (k === 'month') return [new Date(y, m, 1), eod];
    if (k === 'last') return [new Date(y, m - 1, 1), end(new Date(y, m, 0))];
    if (k === 'max') return [new Date(since || '2020-01-01'), eod];
    if (k === 'custom' && finCustom) return [new Date(`${finCustom.from}T00:00:00`), new Date(`${finCustom.to}T23:59:59.999`)];
    return [new Date(y, m - 11, 1), now];
  }
  const isoDay = (d) => { const x = new Date(d); x.setMinutes(x.getMinutes() - x.getTimezoneOffset()); return x.toISOString().slice(0, 10); };
  // Lead P&L (admin Finance). Revenue is what clients actually pay for leads: credits spent on paid buys (1 credit = £1 ex VAT on
  // every plan), less refunds, plus commission. Leads given free and leads taken by commission clients count £0 (their commission
  // is the revenue). Profit = revenue − ad spend (Meta, pulled daily, plus spend logged by hand such as LinkedIn).
  // Bonus credits are worth £0: each client's sales are valued at their paid share of credits added (paid = Stripe plan/offer
  // or an invoiced top-up; free = anything else added by hand; refunds just return credits, so they're left out).
  // ponytail: a blended share, not credit-by-credit tracking of which credits paid for which lead.
  const SPEND_CHANNELS = ['LinkedIn', 'Google', 'TikTok', 'Other'];
  // Shared money basis for Finance and the ad simulator (see the P&L notes above).
  function finBase(F) {
    const at = (d) => (/^\d{4}-\d{2}-\d{2}$/.test(d) ? new Date(`${d}T12:00:00`) : new Date(d));
    const sum = (a, k) => a.reduce((x, r) => x + (Number(r[k]) || 0), 0);
    const byId = Object.fromEntries(F.brokers.map((b) => [b.id, b])), isComm = (id) => !!byId[id]?.plan?.commission;
    const name = (id) => byId[id]?.company || 'Unknown client';
    // Every money movement as { date, amount, kind }: positive = revenue, negative = refund or ad spend.
    const tops = {}; for (const t of F.topups || []) { if (/^Refund/.test(t.reason || '')) continue; const x = (tops[t.broker] ||= { paid: 0, all: 0 }); x.all += t.delta; if (/^in_/.test(t.ref || '') || Number(t.invoiced) > 0) x.paid += t.delta; }
    const rate = (id) => (tops[id]?.all ? tops[id].paid / tops[id].all : 1);
    // Sales, free leads and refunds are all dated to the day the lead came in (its ad spend day), not the day bought or refunded.
    const madeAt = Object.fromEntries(F.leads.map((l) => [l.id, l.created_at]));
    const L = (F.ledger || []).map((m) => ({ ...m, date: madeAt[m.lead] || m.date, paid: m.kind !== 'free' && !isComm(m.broker), val: m.credits * rate(m.broker) }));
    const feesAll = F.fees || [];
    const E = F.commission || [], commAll = E.filter((e) => e.kind === 'commission'), otherAll = E.filter((e) => e.kind === 'spend');
    const metaAll = F.spend.filter((x) => x.spend > 0).map((x) => ({ date: x.date, amount: x.spend, channel: 'Meta' }));
    const spendAll = [...metaAll, ...otherAll.map((e) => ({ date: e.date, amount: Number(e.amount), channel: e.channel || (e.broker ? `Other (${name(e.broker)})` : 'Other'), e }))];
    const P = (rows) => { // P&L for a set of rows already limited to a period
      const sales = rows.L.filter((m) => m.kind === 'sale' && m.paid), refunds = rows.L.filter((m) => m.kind === 'refund' && m.paid);
      const free = rows.L.filter((m) => m.kind === 'free' || (m.kind === 'sale' && !m.paid));
      const s = sum(sales, 'val'), r = sum(refunds, 'val'), c = sum(rows.comm, 'amount'), ad = sum(rows.spend, 'amount'), fee = sum(rows.fees || [], 'fee'), rev = s - r + c;
      return { sales, refunds, free, s, r, c, ad, fee, rev, bonus: sum(sales, 'credits') - s, profit: rev - ad, leads: rows.leads.length };
    };
    // "Sold" = a paid sale that wasn't refunded. Free assignments and commission clients don't count.
    const paidSold = new Set(L.filter((m) => m.kind === 'sale' && m.paid).map((m) => m.lead));
    for (const m of L) if (m.kind === 'refund' && m.paid) paidSold.delete(m.lead);
    return { at, sum, byId, isComm, name, rate, madeAt, L, feesAll, commAll, otherAll, spendAll, P, paidSold };
  }
  async function finance(box) {
    try { await loadFin(); } catch (ex) { box.innerHTML = `<p class="pf-err">${h(ex.message)}</p>`; return; }
    const F = finData, [from, to] = periodRange(finPeriod, F.since);
    const { at, sum, byId, isComm, name, rate, madeAt, L, feesAll, commAll, otherAll, spendAll, P } = finBase(F);
    const inP = (d) => { const t = at(d); return t >= from && t <= to; };
    const pick = (a, k = 'date') => a.filter((x) => inP(x[k]));
    const T = P({ L: pick(L), comm: pick(commAll), spend: pick(spendAll), fees: pick(feesAll), leads: pick(F.leads, 'created_at') });
    // Buckets: day / week (Mon) / month, London time.
    const key = (d) => { const t = at(d); if (finGroup === 'month') return isoDay(t).slice(0, 7); if (finGroup === 'week') { const x = new Date(t); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return isoDay(x); } return isoDay(t); };
    const keys = []; for (let d = new Date(from); d <= to && keys.length < 400; d.setDate(d.getDate() + 1)) { const k = key(d); if (keys[keys.length - 1] !== k) keys.push(k); }
    const grp = (a, k = 'date') => { const o = {}; for (const x of a) if (inP(x[k])) (o[key(x[k])] ||= []).push(x); return o; };
    const gL = grp(L), gC = grp(commAll), gS = grp(spendAll), gF = grp(feesAll), gLd = grp(F.leads, 'created_at');
    const rows = keys.map((k) => ({ k, ...P({ L: gL[k] || [], comm: gC[k] || [], spend: gS[k] || [], fees: gF[k] || [], leads: gLd[k] || [] }) }));
    const label = (k) => finGroup === 'month' ? new Date(`${k}-01T12:00:00`).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
      : finGroup === 'week' ? `w/c ${new Date(`${k}T12:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`
      : new Date(`${k}T12:00:00`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
    // Chart: revenue (green) vs ad spend (orange) per bucket, profit as a dot.
    const max = Math.max(1, ...rows.map((r) => Math.max(r.rev, r.ad))), n = Math.max(rows.length, 1), bw = 100 / n;
    const chart = `<svg class="pf-fin-chart" viewBox="0 0 100 50" preserveAspectRatio="none" role="img" aria-label="Revenue from leads against ad spend">
      ${rows.map((r, i) => { const a = (Math.max(0, r.rev) / max) * 46, b = (r.ad / max) * 46; return `<rect x="${(i * bw + bw * 0.12).toFixed(2)}" y="${(48 - a).toFixed(2)}" width="${(bw * 0.36).toFixed(2)}" height="${Math.max(a, 0.3).toFixed(2)}" class="rev"><title>${label(r.k)}: revenue ${money2(r.rev)}</title></rect><rect x="${(i * bw + bw * 0.52).toFixed(2)}" y="${(48 - b).toFixed(2)}" width="${(bw * 0.36).toFixed(2)}" height="${Math.max(b, 0.3).toFixed(2)}" class="spend"><title>${label(r.k)}: ad spend ${money2(r.ad)}</title></rect>`; }).join('')}</svg>
      <div class="pf-fin-x" style="grid-template-columns:repeat(${n},minmax(0,1fr))">${rows.map((r, i) => `<span>${i % Math.ceil(n / 6) === 0 ? h(label(r.k).replace(/^w\/c /, '').replace(finGroup === 'day' ? /^\w{3} / : /^$/, '')) : ''}</span>`).join('')}</div>`;
    const kpi = (lbl, val, sub, cls = '') => `<div class="pf-kpi ${cls}"><span>${lbl}</span><b>${val}</b><em>${sub}</em></div>`;
    const pct = (a, b) => (b ? `${Math.round((a / b) * 100)}%` : '–');
    const auto = T.sales.filter((m) => m.auto).length, cpl = T.leads ? T.ad / T.leads : 0;
    const freeComm = T.free.filter((m) => isComm(m.broker)), freeGift = T.free.filter((m) => !isComm(m.broker));
    const cell = (v, neg) => `<td class="pf-r${neg && v ? ' pf-neg' : ''}">${v ? (neg ? '−' : '') + money2(v) : '–'}</td>`;
    const tr = (r, lbl, cls = '') => `<tr class="${cls}"><td><b>${lbl}</b></td>${cell(r.ad)}<td class="pf-r pf-hide-s">${r.leads || '–'}</td><td class="pf-r pf-hide-s">${r.sales.length || '–'}</td><td class="pf-r pf-hide-s">${r.free.length || '–'}</td>${cell(r.s)}${cell(r.r, true)}<td class="pf-r pf-hide-s">${r.c ? money2(r.c) : '–'}</td><td class="pf-r ${r.profit < 0 ? 'pf-neg' : r.profit > 0 ? 'pf-plus' : ''}"><b>${r.rev || r.ad ? money2(r.profit) : '–'}</b></td><td class="pf-r pf-hide-s">${r.ad ? `${(r.rev / r.ad).toFixed(2)}×` : '–'}</td></tr>`;
    // Per client (paid sales − refunds + commission) and per channel.
    const clientIds = [...new Set([...pick(L).map((m) => m.broker), ...pick(commAll).map((e) => e.broker)])].filter(Boolean);
    const cRows = clientIds.map((id) => { const x = P({ L: pick(L).filter((m) => m.broker === id), comm: pick(commAll).filter((e) => e.broker === id), spend: [], leads: [] }); return { id, ...x }; }).sort((a, z) => z.rev - a.rev || z.free.length - a.free.length);
    const feeKinds = {}; for (const f of pick(feesAll)) feeKinds[f.kind || 'Card processing'] = (feeKinds[f.kind || 'Card processing'] || 0) + f.fee;
    const chan = {}; for (const x of pick(spendAll)) chan[x.channel] = (chan[x.channel] || 0) + x.amount;
    const logged = pick(otherAll).sort((a, z) => z.date.localeCompare(a.date));
    // Cash (Stripe and invoices), secondary.
    const allInv = [...F.invoices, ...(F.manual || []).map((m) => ({ date: m.date, exVat: m.exVat, vat: 0 }))], inv = pick(allInv);
    const fees = sum(pick(F.fees), 'fee'), cash = sum(inv, 'exVat') + T.c, credLeft = F.brokers.filter((b) => !b.plan?.commission).reduce((a, b) => a + (b.credits || 0), 0);
    const fmt = (d) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    box.innerHTML = `<div class="pf-toolbar"><div class="pf-row-l pf-fin-range">
          <label class="pf-select"><select data-per aria-label="Date range">${PERIODS.map(([k, nm]) => `<option value="${k}" ${finPeriod === k ? 'selected' : ''}>${nm}</option>`).join('')}</select></label>
          <form class="pf-fin-custom" data-custom ${finPeriod === 'custom' ? '' : 'hidden'}><input type="date" name="from" value="${finCustom?.from || isoDay(from)}" min="${isoDay(F.since)}" max="${isoDay(new Date())}" aria-label="From"><span>to</span><input type="date" name="to" value="${finCustom?.to || isoDay(to)}" min="${isoDay(F.since)}" max="${isoDay(new Date())}" aria-label="To"><button class="pf-btn pf-btn-sm pf-btn-primary">Update</button></form>
          <b class="pf-fin-dates">${fmt(from)}${isoDay(from) === isoDay(to) ? '' : ` – ${fmt(to)}`}</b></div>
        <button class="pf-btn" data-addspend>Add ad spend</button></div>
      ${F.meta !== 'ok' ? `<div class="pf-banner pf-banner-warn">${I.clock}<div><b>Meta ad spend isn't connected.</b> ${F.meta === 'no token' ? 'Add META_ADS_TOKEN in Vercel.' : 'The Meta token needs the ads_read permission for ad account 957353369466280. Add one as META_ADS_TOKEN in Vercel.'} Until then Meta spend shows as £0 and profit is overstated.</div></div>` : ''}
      <div class="pf-kpis pf-kpis-fin">
        ${kpi('Lead sales', money2(T.s), `${num(T.sales.length)} paid lead${T.sales.length === 1 ? '' : 's'} · ${auto} auto, ${T.sales.length - auto} manual${T.bonus >= 1 ? ` · ${money2(T.bonus)} paid with bonus credits, counted as £0` : ''}`)}
        ${kpi('Refunds', T.r ? `−${money2(T.r)}` : money2(0), `${T.refunds.length} lead${T.refunds.length === 1 ? '' : 's'} refunded`, T.r ? 'pf-kpi-loss' : '')}
        ${kpi('Commission', money2(T.c), `${pick(commAll).length} payment${pick(commAll).length === 1 ? '' : 's'} from commission clients`)}
        ${kpi('Ad spend', money2(T.ad), Object.entries(chan).map(([c, v]) => `${h(c)} ${money2(v)}`).join(' · ') || 'none logged')}
        ${kpi('Profit', money2(T.profit), `${money2(T.rev)} revenue − ${money2(T.ad)} ad spend${T.rev ? ` · ${pct(T.profit, T.rev)} margin` : ''}`, `pf-kpi-dark ${T.profit < 0 ? 'pf-kpi-loss' : 'pf-kpi-win'}`)}
        ${kpi('Return on ad spend', T.ad ? `${(T.rev / T.ad).toFixed(2)}×` : '–', T.ad ? `£${(T.rev / T.ad).toFixed(2)} back for every £1 spent` : 'no ad spend this period')}
        ${kpi('Leads generated', num(T.leads), T.leads ? `${money2(cpl)} ad spend per lead` : 'none this period')}
        ${kpi('Leads given free', num(T.free.length), T.free.length ? `${num(freeComm.length)} to commission clients · ${num(freeGift.length)} free · ${num(sum(T.free, 'credits'))} credits, counted as £0` : 'none this period')}
      </div>
      <section class="pf-card"><div class="pf-card-h"><h3>Profit and loss</h3>
          <div class="pf-seg" role="tablist" aria-label="Group by">${[['day', 'Daily'], ['week', 'Weekly'], ['month', 'Monthly']].map(([k, nm]) => `<button type="button" data-grp="${k}" class="${finGroup === k ? 'on' : ''}">${nm}</button>`).join('')}</div></div>
        <p class="pf-hint"><i class="pf-key rev"></i>Revenue <i class="pf-key spend"></i>Ad spend</p>${chart}
        <div class="pf-scroll"><table class="pf-table pf-mini pf-fin-table"><thead><tr><th>${finGroup === 'day' ? 'Day' : finGroup === 'week' ? 'Week' : 'Month'}</th><th class="pf-r">Ad spend</th><th class="pf-r pf-hide-s">Leads in</th><th class="pf-r pf-hide-s">Sold</th><th class="pf-r pf-hide-s">Free</th><th class="pf-r">Sales</th><th class="pf-r">Refunds</th><th class="pf-r pf-hide-s">Commission</th><th class="pf-r">Profit</th><th class="pf-r pf-hide-s">ROAS</th></tr></thead><tbody>
          ${tr(T, 'Total', 'pf-fin-total')}${rows.slice().reverse().map((r) => tr(r, h(label(r.k)).replace(finGroup === 'day' ? /^(\w{3}) / : /^$/, '<span class="pf-hide-s">$1 </span>'))).join('')}</tbody></table></div>
        <p class="pf-hint">Sales = credits spent on paid leads (1 credit = £1 ex VAT). Sales, free leads and refunds all count on the day the lead came in, so they line up with that day's ad spend. Leads given free, leads taken by commission clients and leads paid for with bonus credits count £0; commission is counted when paid. Stripe fees are charged on invoices paid, not leads sold, so they're under Invoiced income below.</p></section>
      <div class="pf-grid-2 pf-mt">
        <section class="pf-card pf-flush"><div class="pf-card-h pf-pad"><h3>By client</h3><span>this period</span></div>
          <table class="pf-table pf-mini"><thead><tr><th>Client</th><th class="pf-r">Paid leads</th><th class="pf-r pf-hide-s">Free</th><th class="pf-r">Revenue</th></tr></thead><tbody>
          ${cRows.map((c) => `<tr class="pf-rowlink" data-client="${c.id}" tabindex="0"><td><b>${h(name(c.id))}</b><span>${isComm(c.id) ? 'Commission client' : `${money2(c.s)} sales${c.r ? ` · −${money2(c.r)} refunds` : ''}`}</span></td><td class="pf-r">${c.sales.length || '–'}</td><td class="pf-r pf-hide-s">${c.free.length || '–'}</td><td class="pf-r"><b>${money2(c.rev)}</b></td></tr>`).join('') || '<tr><td colspan="4" class="pf-hint">No client activity in this period.</td></tr>'}</tbody></table></section>
        <section class="pf-card pf-flush"><div class="pf-card-h pf-pad"><h3>Ad spend</h3><span>Meta is pulled in daily</span></div>
          <table class="pf-table pf-mini"><tbody>${Object.entries(chan).sort((a, z) => z[1] - a[1]).map(([c, v]) => `<tr><td><b>${h(c)}</b>${c === 'Meta' ? '<span>automatic</span>' : '<span>added by hand</span>'}</td><td class="pf-r"><b>${money2(v)}</b></td></tr>`).join('') || '<tr><td class="pf-hint">No ad spend in this period.</td></tr>'}</tbody></table>
          ${logged.length ? `<div class="pf-pad"><h4 class="pf-sim-h">Added by hand</h4></div><table class="pf-table pf-mini"><tbody>${logged.map((e) => `<tr><td><b>${h(e.channel || 'Other')}</b><span>${dayOnly(e.date)}${e.broker ? ` · ${h(name(e.broker))}` : ''}${e.note ? ` · ${h(e.note)}` : ''}</span></td><td class="pf-r">${money2(Number(e.amount))}</td><td class="pf-r"><button class="pf-btn pf-btn-sm" type="button" data-delspend="${e.id}">Delete</button></td></tr>`).join('')}</tbody></table>` : ''}</section>
      </div>
      <details class="pf-card pf-mt pf-fin-cash"><summary><b>Invoiced income and Stripe fees</b> <span class="pf-hint">money clients paid, separate from lead profit</span></summary>
        <div class="pf-kpis pf-kpis-fin pf-mt">
          ${kpi('Invoiced income', money2(cash), `${inv.length} paid invoice${inv.length === 1 ? '' : 's'} plus commission · VAT ${money2(sum(inv, 'vat'))} on top`)}
          ${kpi('Stripe fees', money2(T.fee), Object.entries(feeKinds).map(([k, v]) => `${h(k)} ${money2(v)}`).join(' · ') || 'none this period')}
          ${kpi('Cash flow', money2(cash - fees - T.ad), 'cash collected − fees − ad spend', cash - fees - T.ad < 0 ? 'pf-kpi-loss' : 'pf-kpi-win')}
          ${kpi('Unspent paid credits', num(credLeft), 'prepaid by clients, still owed in leads')}
        </div></details>`;
    const sel = box.querySelector('[data-per]'), cf = box.querySelector('[data-custom]');
    sel.onchange = () => { finPeriod = sel.value; if (finPeriod === 'custom') { cf.hidden = false; return cf.from.focus(); } finance(box); };
    cf.onsubmit = (e) => { e.preventDefault(); if (!cf.from.value || !cf.to.value) return; const [a, b] = [cf.from.value, cf.to.value].sort(); finCustom = { from: a, to: b }; finPeriod = 'custom'; finance(box); };
    box.querySelectorAll('[data-grp]').forEach((b) => (b.onclick = () => { finGroup = b.dataset.grp; finance(box); }));
    box.querySelectorAll('[data-client]').forEach((r) => { const go = () => clientDrawer(r.dataset.client); r.onclick = go; r.onkeydown = (e) => e.key === 'Enter' && go(); });
    box.querySelector('[data-addspend]').onclick = () => spendModal(box);
    box.querySelectorAll('[data-delspend]').forEach((b) => (b.onclick = async () => {
      const e = otherAll.find((x) => String(x.id) === b.dataset.delspend);
      if (await confirmBox({ title: 'Delete this ad spend?', text: `${money2(Number(e.amount))} ${h(e.channel || 'Other')} on ${dayOnly(e.date)}.`, ok: 'Delete', danger: true }) === null) return finance(box);
      try { await api('admin-commission', { remove: e.id }); toast('Ad spend deleted'); finData = null; } catch (ex) { toast(ex.message, true); }
      finance(box);
    }));
  }
  // Business-wide ad spend outside Meta (LinkedIn, Google…), one amount per day or per invoice.
  function spendModal(box) {
    const today = isoDay(new Date());
    modal.className = 'pf-modal'; modal.onclick = null;
    modal.innerHTML = `<form method="dialog" class="pf-modal-in"><h2>Add ad spend</h2><p>Spend outside Meta, such as LinkedIn. Meta spend is pulled in automatically, so don’t add it here. Only admins see this.</p>
      <div class="pf-two"><label>Channel<select name="channel">${SPEND_CHANNELS.map((c) => `<option>${c}</option>`).join('')}</select></label>
        <label>Amount <span>(£ ex VAT)</span><div class="pf-money"><i>£</i><input name="amount" inputmode="decimal" required></div></label></div>
      <label>Date<input name="date" type="date" value="${today}" max="${today}" required></label>
      <label>Note <span>(optional)</span><input name="note" placeholder="e.g. LinkedIn lead gen campaign"></label>
      <div class="pf-row"><button class="pf-btn" value="cancel" formnovalidate>Cancel</button><button class="pf-btn pf-btn-primary" value="ok">Save</button></div></form>`;
    modal.onclose = async () => {
      modal.onclose = null;
      if (modal.returnValue !== 'ok') return;
      const f = modal.querySelector('form');
      try { await api('admin-commission', { kind: 'spend', channel: f.channel.value, amount: f.amount.value, date: f.date.value, note: f.note.value }); toast('Ad spend added'); finData = null; } catch (ex) { toast(ex.message, true); }
      finance(box);
    };
    modal.returnValue = ''; if (!modal.open) modal.showModal();
  }

  // ------------------------------------------------ admin: client detail
  // Admin: one lead in full, with price, assign and delete.
  // Decline a refund with a reason the firm sees in the email (pick one, add to it, or write your own).
  const DECLINE = [['valid', 'Contact details are valid'], ['interest', 'They’re no longer interested'], ['brief', 'They’ve changed what they need or found another firm'],
    ['matches', 'The matter and region match what they told us'], ['attempts', 'Not enough attempts to reach them'], ['late', 'Asked after the 72-hour window'], ['', 'Other (write your own)']];
  function declineModal(r) {
    modal.className = 'pf-modal'; modal.onclick = null;
    modal.innerHTML = `<form method="dialog" class="pf-modal-in"><h2>Decline refund for lead #${r.lead_id}?</h2>
      <p>${h(r.brokers?.company || '')} asked: <b>${h(r.reason)}</b>${r.details ? `<br>“${h(r.details)}”` : ''}</p>
      <label>Reason <span>(goes in the email to them)</span><select name="why">${DECLINE.map(([k, t]) => `<option value="${k}">${h(t)}</option>`).join('')}</select></label>
      <label>Anything to add <span>(optional unless “Other”)</span><textarea name="note" rows="3" placeholder="e.g. We called the number on 12 Nov and spoke to the client."></textarea></label>
      <p class="pf-hint">They’re told they can reply if they think it’s wrong.</p>
      <div class="pf-row"><button class="pf-btn" value="cancel" formnovalidate>Cancel</button><button class="pf-btn pf-btn-danger" value="ok">Decline and email them</button></div></form>`;
    modal.onclose = async () => {
      modal.onclose = null; if (modal.returnValue !== 'ok') return;
      const f = modal.querySelector('form');
      try { await api('admin-refund', { id: r.id, approve: false, why: f.why.value, note: f.note.value }); toast('Refund declined and firm emailed'); admin(); }
      catch (ex) { toast(ex.message, true); declineModal(r); }
    };
    modal.returnValue = ''; if (!modal.open) modal.showModal();
  }

  async function adminLeadDrawer(id) {
    drawer('<div class="pf-skel"></div>');
    let d; try { d = await api(`admin-lead&id=${id}`); } catch (ex) { modal.close(); return toast(ex.message, true); }
    const l = L(d.lead), sold = !!l.buyer;
    const kv = (o) => o && typeof o === 'object' ? Object.entries(o).map(([k, v]) => [h(k), h(typeof v === 'object' ? JSON.stringify(v) : v)]) : [];
    const brokers = d.brokers.filter((b) => b.approved).concat(d.brokers.filter((b) => !b.approved));
    const firmOk = (b) => (b.can_take !== undefined ? b.can_take : !(b.regulators || []).length || allowedAreas(b.regulators).includes(l.area));
    drawer(`<div class="pf-dh"><span class="pf-pic pf-pic-lg">${aIcon(l.area)}</span><div><span class="pf-eyebrow">Lead #${l.id} · ${date(l.created_at)} · ${h(l.area_label || areaName(l.area))}</span><h2>${leadTitle(l)}</h2><p class="pf-dsub">${h(l.contact_name || 'No name')}${l.business_name ? ` · ${h(l.business_name)}` : ''}</p></div></div>
      <div class="pf-kpis pf-kpis-3"><div class="pf-kpi"><span>Grade</span><b>${h(l.grade || '–')}</b><em>score ${l.score ?? '–'}${(l.flags || []).length ? ` · flagged ${h(l.flags.join(', '))}` : ''}</em></div>
        <div class="pf-kpi"><span>${sold ? 'Price paid' : 'Price'}</span><b class="pf-kpi-sm">${sold && l.paid != null ? `${num(l.paid)} credits` : priceTag(l, ' credits')}</b><em>${sold ? (l.paid_why ? `${l.paid_why === 'commission' ? 'commission client, so no credits' : l.paid_why === 'refunded' ? 'refunded' : 'given free'} · list price ${num(l.price)}` : 'paid') : l.discounted ? 'discount live' : l.discount_at ? `50% off from ${date(l.discount_at)}` : l.price_fixed ? 'price set by hand' : 'not discounted'}</em></div>
        <div class="pf-kpi"><span>Status</span><b class="pf-kpi-sm">${sold ? h(l.brokers?.company || 'Sold') : l.hidden_at ? 'Hidden' : 'Live'}</b><em>${sold ? `${l.auto ? 'Auto' : 'Manual'} · ${date(l.bought_at)}` : 'not sold yet'}</em></div></div>
      <h3 class="pf-dsec">Contact</h3>
      ${facts([['Name', h(l.contact_name || '–')], ['Mobile', `<a href="tel:${h(l.phone)}">${h(l.phone)}</a>`], ['Email', `<a href="mailto:${h(l.email)}">${h(l.email)}</a>${l.suppressed ? ' <b class="pf-neg">Suppressed</b>' : ''}`], ['Postcode', h(l.postcode || l.postcode_district || '–')],
        ['Phone check', !l.checks?.phone ? 'Not checked' : l.checks.phone.allocated === false ? '<span class="pf-chwarn">Number doesn’t exist on any network</span>' : l.checks.phone.reachable === true ? `Live${l.checks.phone.carrier ? ` (${h(l.checks.phone.carrier)})` : ''}` : l.checks.phone.reachable === false ? 'Not reachable, client confirmed it' : 'No answer from network'],
        ['Email check', !l.checks?.email ? 'Not checked' : `${h(l.checks.email.result || '–')}${l.checks.emailConfirmed ? ', client confirmed it' : ''}`],
        ...(l.audience === 'business' ? [['Business', h(l.business_name || '–')], ['Company number', l.company_number ? `<a href="https://find-and-update.company-information.service.gov.uk/company/${h(l.company_number)}" target="_blank" rel="noopener">${h(l.company_number)}</a>` : 'Not given']] : [])])}
      ${sold ? `<h3 class="pf-dsec">${h(l.brokers?.company || 'Buyer')}’s progress</h3>
      <p><span class="pf-stage pf-st-${l.stage || 'new'}">${STAGE_NAME[l.stage || 'new']}</span>${l.stage_at ? ` <span class="pf-hint">since ${date(l.stage_at)}</span>` : ''}${l.stage === 'instructed' && l.instructed_value ? ` · <b>${gbp(l.instructed_value)} instructed</b>` : ''}${l.archived_at ? ` · <span class="pf-hint">archived ${date(l.archived_at)}</span>` : ''}</p>
      <ul class="pf-notes">${(d.notes || []).map((n) => `<li><p>${h(n.body)}</p><span>${date(n.created_at)}</span></li>`).join('') || '<li class="pf-notes-empty">No notes from the buyer yet.</li>'}</ul>
      ${(d.refunds || []).map((x) => `<div class="pf-refundbox ${x.status}">${I.undo}<div><b>Refund ${x.status === 'rejected' && /^Declined automatically/.test(x.decision || '') ? 'asked, not refundable (auto-declined)' : x.status}</b><span>${h(x.reason)}${x.brokers?.company ? ` · ${h(x.brokers.company)}` : ''} · ${date(x.created_at)}</span>${x.details ? `<span>“${h(x.details)}”</span>` : ''}${x.decision && !/^Declined automatically/.test(x.decision) ? `<span>Decision ${h(x.decision)}</span>` : ''}</div></div>`).join('')}` : ''}
      <h3 class="pf-dsec">Enquiry</h3>
      ${enquiryFacts(l, [['Country', h(l.country || '–')], ['Form version', h(l.form_version || '–')]])}
      ${tagList(l.tags)}
      ${l.summary ? `<h3 class="pf-dsec">In the client’s words</h3><blockquote class="pf-summary">${h(l.summary)}</blockquote>` : ''}
      <h3 class="pf-dsec">Qualifying answers</h3>${answersList(l.answers)}
      ${chBlock(l.companies_house || null, true)}
      ${sold ? '' : `<h3 class="pf-dsec">Price</h3>
      <form class="pf-form pf-inline" data-lprice><label>List price (credits)<input name="price" type="number" min="1" max="1000" value="${l.list_price ?? l.price}" required></label><button class="pf-btn">Save price</button></form>
      <p class="pf-hint">${l.discount_at || l.discounted ? `Unsold leads drop to half this price ${l.discounted ? 'automatically (already applied)' : `on ${date(l.discount_at)}`}.` : 'Prices set by hand aren’t discounted again automatically.'}</p>
      <h3 class="pf-dsec">Assign to a firm</h3>
      <form class="pf-form" data-lassign><label>Firm<select name="broker" required><option value="">Choose a firm</option>${brokers.map((b) => `<option value="${b.id}" ${firmOk(b) ? '' : 'disabled'}>${h(b.company)} · ${h(b.contact_name || b.email)} · ${num(b.credits)} credits${b.approved ? '' : ' (not approved)'}${firmOk(b) ? '' : ' (regulator doesn’t cover this area)'}</option>`).join('')}</select></label>
        <label class="pf-check"><input type="checkbox" name="charge" checked> Charge ${l.price} credits (untick to give it free)</label>
        <div><button class="pf-btn pf-btn-primary">Assign and send lead</button></div></form>`}
      ${relistForm(l, d, brokers)}
      ${kv(l.consent).length ? `<h3 class="pf-dsec">Consent record</h3>${facts(kv(l.consent))}` : ''}
      <h3 class="pf-dsec">Source</h3>${facts([['Came from', h(l.channel || 'Direct or unknown')], ...(l.campaign_name ? [['Campaign', h(l.campaign_name)]] : []), ...(l.adset ? [['Ad set', h(l.adset)]] : []), ...(l.ad ? [['Ad', h(l.ad)]] : []), ...kv(l.source)])}
      <h3 class="pf-dsec">Email suppression</h3><p class="pf-hint">${l.suppressed ? `On the suppression list since ${date(l.suppressed.created_at)} (${h(l.suppressed.reason || 'Unsubscribed')}). Leaflegal and firms’ CRMs won’t email them.` : 'Suppressing stops all emails to them from Leaflegal and firms’ CRMs, including match emails. Texts and WhatsApp aren’t affected.'}</p>
      <div class="pf-mb"><button class="pf-btn" data-lsup>${l.suppressed ? 'Remove from suppression list' : 'Suppress email'}</button></div>
      <h3 class="pf-dsec">Hide</h3><p class="pf-hint">${l.hidden_at ? `Hidden since ${date(l.hidden_at)}. It only shows under Status → Hidden${sold ? '' : ' and isn’t on Opportunities'}.` : `Takes it out of All leads${sold ? '' : ' and off Opportunities, so firms can’t buy it'}. It can be unhidden any time.`}</p>
      <div class="pf-mb"><button class="pf-btn" data-lhide>${l.hidden_at ? 'Unhide lead' : 'Hide lead'}</button></div>
      <h3 class="pf-dsec">Delete</h3><p class="pf-hint">Removes the lead${sold ? ', and takes it out of the buyer’s leads. Credits aren’t returned automatically' : ''}. This can’t be undone.</p>
      <div><button class="pf-btn pf-btn-danger" data-ldel>Delete lead #${l.id}</button></div>`);
    const done = (msg) => { toast(msg); modal.close(); admin(); };
    const run = async (body, msg, btn) => { btn.disabled = true; try { await api('admin-lead', { id: l.id, ...body }); done(msg); } catch (ex) { btn.disabled = false; toast(ex.message, true); } };
    modal.querySelector('[data-lprice]')?.addEventListener('submit', (e) => { e.preventDefault(); run({ op: 'price', price: +e.target.price.value }, 'Price updated', e.submitter); });
    modal.querySelector('[data-lassign]')?.addEventListener('submit', (e) => {
      e.preventDefault(); const f = e.target, b = d.brokers.find((x) => x.id === f.broker.value);
      const charge = f.charge.checked;
      confirmBox({ title: `Assign lead #${l.id} to ${h(b.company)}?`, text: `${charge ? `It costs them ${l.price} credits.` : 'Free of charge.'} They’ll be emailed the lead straight away.`, ok: 'Assign lead' })
        .then((r) => (r === null ? adminLeadDrawer(id) : run({ op: 'assign', broker: b.id, charge }, `Lead assigned to ${b.company}`, e.submitter)));
    });
    const rl = modal.querySelector('[data-lrelist]');
    if (rl) {
      const sync = () => { rl.custom.disabled = rl.price.value !== 'custom'; if (rl.dest) rl.querySelector('[data-to]').hidden = rl.dest.value !== 'broker'; };
      rl.onchange = sync; sync();
      rl.onsubmit = (e) => {
        e.preventDefault();
        const toB = rl.dest?.value === 'broker', b = toB && d.brokers.find((x) => x.id === rl.broker.value);
        if (toB && !b) return toast('Choose a firm', true);
        const pr = rl.price.value === 'custom' ? +rl.custom.value : rl.price.value;
        const what = toB ? `give it to ${h(b.company)}${rl.charge.checked ? ', charging them the new price' : ' free of charge'}` : 'put it back in Opportunities';
        confirmBox({ title: `${sold ? `Take lead #${l.id} off ${h(l.brokers?.company || 'its buyer')} and` : `Update lead #${l.id} and`} ${what}?`, text: sold ? (rl.refund?.checked ? 'They get back the credits they paid for it (less anything already refunded).' : 'This doesn’t refund them. Tick the refund box if they’re owed one.') : 'The new figures and price show in Opportunities straight away.', ok: 'Confirm' })
          .then((r) => (r === null ? adminLeadDrawer(id) : run({ op: 'relist', grade: rl.grade.value, price: pr, refund: !!rl.refund?.checked, ...(toB ? { broker: b.id, charge: rl.charge.checked } : {}) },
            (rl.refund?.checked ? 'Refunded. ' : '') + (toB ? `Lead given to ${b.company}` : 'Lead updated and back in Opportunities'), e.submitter)));
      };
    }
    modal.querySelector('[data-lsup]').onclick = (e) => {
      const btn = e.currentTarget, off = !!l.suppressed;
      confirmBox(off ? { title: `Email ${h(l.email)} again?`, text: 'Only do this if they’ve asked to hear from us.', ok: 'Remove from list' }
        : { title: `Suppress ${h(l.email)}?`, text: 'Leaflegal and firms’ CRMs won’t email them again.', ok: 'Suppress email', input: 'Reason (optional)' })
        .then((r) => (r === null ? adminLeadDrawer(id) : run(off ? { op: 'unsuppress' } : { op: 'suppress', why: r || undefined }, off ? 'Removed from the suppression list' : 'Email suppressed', btn)));
    };
    modal.querySelector('[data-lhide]').onclick = (e) => run({ op: l.hidden_at ? 'unhide' : 'hide' }, l.hidden_at ? `Lead #${l.id} unhidden` : `Lead #${l.id} hidden`, e.currentTarget);
    modal.querySelector('[data-ldel]').onclick = (e) => {
      const btn = e.currentTarget;
      confirmBox({ title: `Delete lead #${l.id}?`, text: 'This permanently deletes the lead. It can’t be undone.', ok: 'Delete lead', danger: true })
        .then((r) => (r === null ? adminLeadDrawer(id) : run({ op: 'delete', confirm: l.id }, `Lead #${l.id} deleted`, btn)));
    };
  }

  // Correct a lead's grade and price, then relist it or give it to another firm (sold leads are taken off their buyer).
  function relistForm(l, d, brokers) {
    const sold = !!l.buyer, full = l.list_price || l.price, half = Math.max(1, Math.ceil(full / 2));
    return `<h3 class="pf-dsec">${sold ? 'Relist or reassign' : 'Correct the grade'}</h3>
      <p class="pf-hint">${sold ? `Takes the lead off ${h(l.brokers?.company || 'its buyer')}. Correct the grade if it was wrong, set a price, then put it back in Opportunities or give it to another firm.` : 'If the grade was wrong, correct it here and reprice the lead.'}</p>
      <form class="pf-form" data-lrelist>
        <label>Grade<select name="grade">${TX.grades.map((g) => `<option ${g === l.grade ? 'selected' : ''}>${g}</option>`).join('')}</select></label>
        <label>Price<select name="price"><option value="full">Full price · ${full} credits</option><option value="half">50% off · ${half} credits</option>
          <option value="recalc">Work it out again from current pricing</option><option value="custom">Set a price by hand</option></select></label>
        <label>Price set by hand (credits)<input name="custom" type="number" min="1" max="1000" value="${full}"></label>
        ${sold ? `<label class="pf-check"><input type="checkbox" name="refund"> Refund ${h(l.brokers?.company || 'the buyer')} the credits they paid for it</label>
        <label>Then<select name="dest"><option value="list">Put it back in Opportunities</option><option value="broker">Give it to another firm</option></select></label>
        <div data-to hidden><label>Firm<select name="broker"><option value="">Choose a firm</option>${brokers.filter((b) => b.id !== l.buyer).map((b) => `<option value="${b.id}">${h(b.company)} · ${h(b.contact_name || b.email)} · ${num(b.credits)} credits${b.approved ? '' : ' (not approved)'}</option>`).join('')}</select></label>
          <label class="pf-check"><input type="checkbox" name="charge" checked> Charge them the new price (untick to give it free)</label></div>` : ''}
        <p class="pf-hint">Leads priced by hand aren’t discounted again automatically.</p>
        <div><button class="pf-btn pf-btn-primary">${sold ? 'Save and move lead' : 'Save and update listing'}</button></div></form>`;
  }

  // Read-only snapshot of everything a firm has set (Admin → client drawer), so admins never need to sign in as them.
  function brokerSettings(b) {
    const f = b.filters || {}, pr = b.profile || {}, show = pr.show || {};
    const list = (v, name = (x) => x) => (Array.isArray(v) && v.length ? v.map((x) => h(name(x))).join(', ') : 'Any');
    const emails = (v) => String(v).split(/[,;\s]+/).filter(Boolean).map(h).join('<br>');
    const cr = (n) => (n ? `${num(n)} credits` : 'No limit');
    const hooks = (b.webhook_urls?.length ? b.webhook_urls : b.webhook_url ? [b.webhook_url] : []);
    const row = (k, v) => `<tr><td>${k}</td><td class="pf-r"><b>${v}</b></td></tr>`;
    const contact = ['person', 'phone', 'whatsapp', 'sms', 'email', 'website'].filter((k) => pr[k]).map((k) => `${{ person: 'Contact', phone: 'Phone', whatsapp: 'WhatsApp', sms: 'Text', email: 'Email', website: 'Website' }[k]} ${h(pr[k])}${show[k] === false ? ' (hidden)' : ''}`);
    const areas = (f.areas || []).map((a) => `${h(areaName(a))}${f.matters?.[a]?.length ? ` (${f.matters[a].map((m) => h(matterName(a, m))).join(', ')})` : ''}`);
    return `<div class="pf-two-col pf-settings-view">
      <section><div class="pf-card-h"><h3>Buying</h3></div><table class="pf-table pf-mini"><tbody>
        ${row('Mode', b.mode === 'auto' ? 'Auto-buy on' : 'Manual')}
        ${row('Practice areas', areas.length ? areas.join('<br>') : 'None ticked')}
        ${row('Regions', list(f.regions))}${f.postcodeAreas?.length ? row('Postcode areas', list(f.postcodeAreas)) : ''}
        ${row('Clients', list(f.audiences, audName))}${row('Urgency', list(f.urgencies))}${row('Grades', list(f.grades))}
        ${row('Private pay only', f.privatePayOnly ? 'Yes' : 'No')}
        ${f.valueMin || f.valueMax ? row('Value', `${f.valueMin ? gbp(f.valueMin) : 'Any'} to ${f.valueMax ? gbp(f.valueMax) : 'any'}`) : ''}
        ${f.tagsAny?.length ? row('Only tags', list(f.tagsAny)) : ''}${f.tagsNone?.length ? row('Never tags', list(f.tagsNone)) : ''}
        ${row('Max price per lead', f.maxPrice ? `${num(f.maxPrice)} credits` : 'No limit')}
        ${row('Daily limit', [f.dailyLeads ? `${num(f.dailyLeads)} leads` : '', f.dailyCredits ? `${num(f.dailyCredits)} credits` : ''].filter(Boolean).join(' · ') || 'No limit')}
        ${row('Monthly auto-buy cap', cr(b.monthly_cap))}${row('Last auto-buy', b.last_auto_at ? date(b.last_auto_at) : 'Never')}
      </tbody></table></section>
      <section><div class="pf-card-h"><h3>Delivery and alerts</h3></div><table class="pf-table pf-mini"><tbody>
        ${row('Bought leads emailed', b.deliver_on === false ? 'Off' : emails(b.deliver_emails || b.email))}
        ${row('New-lead alerts', b.notify ? emails(b.notify_emails || b.email) : 'Off')}
        ${row('Leads outside criteria', { daily: 'Daily summary', off: 'Off' }[b.filters?.suggest] || 'As they arrive')}
        ${row('CRM webhooks', b.webhook_on === false || !hooks.length ? 'Off' : hooks.map((u) => h(u.replace(/^https?:\/\//, '').slice(0, 40))).join('<br>'))}
      </tbody></table>
      <div class="pf-card-h pf-mt"><h3>Public profile</h3></div><table class="pf-table pf-mini"><tbody>
        ${row('Shown to matched clients', pr.show ? 'Yes' : 'Not set up')}
        ${pr.name ? row('Name', h(pr.name)) : ''}${pr.logo ? row('Logo', `<img src="${h(pr.logo)}" alt="" style="max-height:28px;max-width:120px;vertical-align:middle">`) : ''}
        ${contact.length ? row('Contact options', contact.join('<br>')) : ''}
      </tbody></table></section></div>`;
  }
  // What a client sees when they're matched with this firm: confirmation page, email, WhatsApp and text, from the saved profile.
  async function previewMatched(b) {
    let d; try { d = await apiFetch(`profile-preview&as=${b.id}`, { ...(b.profile || {}) }); } catch (ex) { return toast(ex.message, true); }
    modal.className = 'pf-modal pf-modal-wide'; modal.onclick = (e) => { if (e.target === modal) modal.close(); }; modal.onclose = null;
    modal.innerHTML = `<div class="pf-modal-in"><h2>What clients see from ${h(b.company)}</h2>
      <div class="pf-seg" role="tablist"><button class="on" data-pv="page">Confirmation page</button><button data-pv="email">Email</button><button data-pv="whatsapp">WhatsApp</button><button data-pv="sms">Text</button></div>
      <iframe class="pf-preview-frame" title="Preview" sandbox="allow-same-origin" style="width:100%;height:62vh;border:1px solid var(--line);border-radius:14px;background:#fff"></iframe>
      <p class="pf-hint">Sample enquiry from Sam Taylor. ${b.profile?.show ? '' : 'Their public profile isn’t switched on, so clients only see the firm name.'}</p>
      <div class="pf-row"><button class="pf-btn" data-x>Close</button><button class="pf-btn pf-btn-primary" data-edit>Edit their profile</button></div></div>`;
    const fr = modal.querySelector('iframe'), show = (k) => { fr.srcdoc = d[k]; modal.querySelectorAll('[data-pv]').forEach((x) => x.classList.toggle('on', x.dataset.pv === k)); };
    modal.querySelectorAll('[data-pv]').forEach((x) => (x.onclick = () => show(x.dataset.pv)));
    modal.querySelector('[data-x]').onclick = () => modal.close();
    modal.querySelector('[data-edit]').onclick = () => { acting = { ...b }; modal.close(); nav('profile'); };
    if (!modal.open) modal.showModal();
    show('page');
  }
  // Signed referral agreement PDF (admins): opens in a new tab, or downloads.
  async function openAgreement(g, company, download) {
    const w = download ? null : window.open('', '_blank');
    const r = await fetch(`/api/platform?action=admin-agreement&id=${g.id}`, { headers: { Authorization: `Bearer ${session.access}` } });
    if (!r.ok) { w?.close(); throw new Error('Could not load the agreement'); }
    const url = URL.createObjectURL(new Blob([await r.arrayBuffer()], { type: 'application/pdf' }));
    if (download) Object.assign(document.createElement('a'), { href: url, download: `${String(company || 'firm').replace(/[^\w]+/g, '-').replace(/^-|-$/g, '').toLowerCase()}-leaflegal-referral-agreement-v${g.version}.pdf` }).click();
    else if (w) w.location = url; else location.href = url;
  }
  async function clientDrawer(id) {
    drawer('<div class="pf-skel"></div>');
    let d; try { d = await api(`admin-client&id=${encodeURIComponent(id)}`); } catch (ex) { modal.close(); return toast(ex.message, true); }
    const b = d.broker, sub = d.subscription, spent = -d.ledger.filter((x) => x.delta < 0).reduce((a, x) => a + x.delta, 0);
    const stages = Object.fromEntries(STAGES.map(([k]) => [k, d.bought.filter((l) => l.stage === k).length]));
    drawer(`<div class="pf-dh"><span class="pf-avatar pf-avatar-lg">${initials(b.company)}</span><div><span class="pf-eyebrow">Client since ${new Date(b.created_at).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}</span><h2>${h(b.company)}</h2></div></div>
      <div class="pf-kpis pf-kpis-3"><div class="pf-kpi"><span>Credits</span><b>${num(b.credits)}</b><em>${num(spent)} spent</em></div>
        <div class="pf-kpi"><span>Leads bought</span><b>${d.bought.length}</b><em>${stages.instructed || 0} instructed</em></div>
        <div class="pf-kpi"><span>Plan</span><b class="pf-kpi-sm">${sub ? `${h(sub.plan)} · ${gbp(sub.pounds)}` : b.plan ? `${h(b.plan.name)}${b.plan.price ? ` · ${gbp(b.plan.price)}` : ''}` : 'None'}</b><em>${sub ? `${sub.status}${sub.cancelling ? ', cancelling' : ''}` : b.plan ? (b.plan.commission ? 'commission client' : 'invoiced') : 'no subscription'}</em></div></div>
      ${b.suspended_at ? `<div class="pf-banner pf-banner-warn">${I.clock}<div><b>Suspended ${dayOnly(b.suspended_at)}.</b> ${h(b.suspend_reason ? b.suspend_reason.replace(/[.!?]?$/, '.') : 'No reason given.')} They can sign in but can't buy, aren't auto-bought for and get no lead emails.</div></div>` : ''}
      <div class="pf-row-l">${b.approved ? '' : `<button class="pf-btn pf-btn-primary" data-a="approve">Approve</button>`}
        <button class="pf-btn" data-a="edit-profile">${I.star}Edit profile</button>
        <button class="pf-btn" data-a="edit-autobuy">${I.spark}Edit auto-buy and delivery</button>
        <button class="pf-btn" data-a="preview">${I.mail}Preview confirmation page and email</button>
        <button class="pf-btn" data-a="credits">${I.coins}Add or remove credits</button>
        <button class="pf-btn" data-a="plan">${b.plan ? (b.plan.commission ? 'Edit commission plan' : 'Edit invoiced plan') : 'Set up invoiced or commission plan'}</button>
        ${b.id === me.id ? '' : b.suspended_at ? `<button class="pf-btn" data-a="unsuspend">Lift suspension</button>` : `<button class="pf-btn" data-a="suspend">Suspend</button>`}
        ${sub && !sub.cancelling ? `<button class="pf-btn pf-btn-danger" data-a="cancel">Cancel subscription</button>` : ''}
</div>
      ${b.plan && !b.plan.commission ? `<h3 class="pf-dsec">Invoiced plan</h3><p class="pf-hint"><b>${h(b.plan.name)}</b> · ${num(b.plan.credits)} credits a month${b.plan.price ? ` · ${gbp(b.plan.price)} a month ex VAT` : ''} · next credits ${dayOnly(b.plan.next_at)}. Raise the invoice yourself; credits are added automatically each month.</p>` : ''}
      ${b.plan?.commission || d.commission?.length ? commissionSection(b, d, stages) : ''}
      <h3 class="pf-dsec">Regulators</h3>
      ${(b.regulators || []).length ? `<table class="pf-table pf-mini"><tbody>${b.regulators.map((r) => `<tr><td><b>${h(regulatorOf(r.id)?.label || r.id)}</b><span>${h(regulatorOf(r.id)?.number || 'Number')} ${h(r.number || 'not given')}</span></td><td class="pf-r"><a class="pf-btn pf-btn-sm" href="${REG_LINK[r.id] || '#'}" target="_blank" rel="noopener">Check the register${I.arrow}</a></td></tr>`).join('')}</tbody></table>
        <p class="pf-hint">Areas the firm can buy ${allowedAreas(b.regulators).map((a) => h(areaName(a))).join(', ') || 'none'}.</p>` : '<p class="pf-hint">No regulator given yet. They add it in the Firm step of setup.</p>'}
      <div class="pf-status ${b.regulator_checked_at ? 'ok' : ''}">${b.regulator_checked_at ? I.check : I.clock}<div><b>${b.regulator_checked_at ? `Regulator checked ${dayOnly(b.regulator_checked_at)}` : 'Regulator not checked yet'}</b><span>Look the firm up on each register above before approving it.</span></div></div>
      <div class="pf-row-l"><button class="pf-btn ${b.regulator_checked_at ? '' : 'pf-btn-primary'}" data-a="reg-check">${I.shield}${b.regulator_checked_at ? 'Mark checked again today' : 'Mark regulator checked'}</button>${b.regulator_checked_at ? '<button class="pf-btn" data-a="reg-uncheck">Clear check</button>' : ''}</div>
      <h3 class="pf-dsec">Their settings</h3>${brokerSettings(b)}
      <h3 class="pf-dsec">Details</h3>
      <form class="pf-form" data-edit><div class="pf-two"><label>Firm name<input name="company" value="${h(b.company)}"></label><label>Company number <span>(optional)</span><input name="company_number" value="${h(b.company_number || '')}"></label></div>
        <div class="pf-two">${TX.regulators.map((r) => `<label>${h(regShort(r.id))} number <span>(blank if not regulated by ${h(regShort(r.id))})</span><input name="reg:${r.id}" value="${h((b.regulators || []).find((x) => x.id === r.id)?.number || '')}"></label>`).join('')}</div>
        <label>Registered address<input name="address" value="${h(b.address || '')}"></label>
        <div class="pf-two"><label>Full name<input name="contact_name" value="${h(b.contact_name || '')}"></label><label>Position<input name="signer_title" value="${h(b.signer_title || '')}"></label></div>
        <div class="pf-two"><label>Login email<input name="email" type="email" value="${h(b.email)}"></label><label>Phone<input name="phone" value="${h(b.phone || '')}"></label></div>
        <label class="pf-check"><input type="checkbox" name="is_admin" ${b.is_admin ? 'checked' : ''} ${b.id === me.id ? 'disabled' : ''}> Admin access</label>
        <div><button class="pf-btn pf-btn-primary">Save details</button></div></form>
      <h3 class="pf-dsec">Agreement</h3><p class="pf-hint">${d.agreement ? `Signed by ${h(d.agreement.signer_name)} (${h(d.agreement.signer_title)}) on ${date(d.agreement.created_at)} · v${h(d.agreement.version)}` : 'Not signed yet.'}</p>
      <label class="pf-switchrow pf-switchrow-top"><input type="checkbox" role="switch" data-waive ${d.waived ? 'checked' : ''}><span class="pf-toggle-ui"></span><span><b>Doesn’t need to sign the referral agreement</b><em>They can buy leads, use auto-buy and choose a plan without signing. Only admins see this.</em></span></label>
      ${d.agreement ? `<div class="pf-row-l"><button class="pf-btn" data-a="agreement">${I.doc || ''}View agreement</button><button class="pf-btn" data-a="agreement-dl">${I.download}Download</button></div>` : ''}
      <h3 class="pf-dsec">Credit history</h3>
      <table class="pf-table pf-mini"><tbody>${d.ledger.slice(0, 30).map((e) => `<tr><td><b>${h(e.reason)}${e.lead_id ? ` #${e.lead_id}` : ''}</b><span>${date(e.created_at)}${e.invoiced ? ` · invoiced ${gbp(e.invoiced)}` : ''}</span></td><td class="pf-r ${e.delta > 0 ? 'pf-plus' : ''}"><b>${e.delta > 0 ? '+' : ''}${num(e.delta)}</b></td></tr>`).join('') || '<tr><td class="pf-hint">No activity.</td></tr>'}</tbody></table>
      ${b.id === me.id ? '' : `<h3 class="pf-dsec">Delete account</h3><p class="pf-hint">${d.bought.length ? `${h(b.company)} has bought leads, so the account can't be deleted. Suspend it instead.` : 'Removes their login, settings and credit history for good. Only possible for accounts that have never bought a lead.'}</p>
      ${d.bought.length ? '' : `<div class="pf-row-l"><button class="pf-btn pf-btn-danger" data-a="delete">Delete account</button></div>`}`}`);
    const reopen = () => { clientDrawer(id); finData = null; };
    modal.querySelector('[data-waive]').onchange = async (e) => {
      try { await api('admin-agreement-waive', { broker: id, waive: e.target.checked }); toast(e.target.checked ? `${b.company} can continue without signing` : `${b.company} must sign the agreement again`); reopen(); }
      catch (ex) { e.target.checked = !e.target.checked; toast(ex.message, true); }
    };
    modal.querySelector('[data-edit]').onsubmit = async (e) => {
      e.preventDefault(); const fd = new FormData(e.target);
      const regulators = TX.regulators.map((r) => ({ id: r.id, number: String(fd.get(`reg:${r.id}`) || '').trim() })).filter((r) => r.number);
      try { await api('admin-update', { broker: id, ...Object.fromEntries([...fd].filter(([k]) => k !== 'is_admin' && !k.startsWith('reg:'))), regulators, is_admin: !!fd.get('is_admin') }); toast('Client updated'); reopen(); } catch (ex) { toast(ex.message, true); }
    };
    modal.querySelectorAll('[data-a]').forEach((btn) => (btn.onclick = async () => {
      const a = btn.dataset.a;
      try {
        if (a === 'approve') { await api('admin-broker', { id, approved: true }); toast('Approved and emailed'); return reopen(); }
        if (a === 'edit-profile' || a === 'edit-autobuy') { acting = { ...b }; modal.close(); return nav(a === 'edit-profile' ? 'profile' : 'autobuy'); }
        if (a === 'preview') return previewMatched(b);
        if (a === 'reg-check' || a === 'reg-uncheck') { await api('admin-regulator-check', { broker: id, checked: a === 'reg-check' }); toast(a === 'reg-check' ? 'Regulator marked as checked' : 'Check cleared'); return reopen(); }
        if (a === 'suspend') {
          const r = await confirmBox({ title: `Suspend ${h(b.company)}?`, text: 'They can still sign in, but can’t buy leads, aren’t auto-bought for and get no lead emails until you lift it.', ok: 'Suspend', input: 'Reason (for your records, optional)' });
          if (r === null) return reopen(); await api('admin-suspend', { broker: id, suspend: true, reason: r }); toast('Suspended'); return reopen();
        }
        if (a === 'unsuspend') { await api('admin-suspend', { broker: id, suspend: false }); toast('Suspension lifted'); return reopen(); }
        if (a === 'delete') {
          if (await confirmBox({ title: `Delete ${h(b.company)}?`, text: 'This permanently deletes their account, login and credit history. It can’t be undone.', ok: 'Delete account', danger: true }) === null) return reopen();
          await api('admin-delete', { broker: id, confirm: b.company }); toast(`${b.company} deleted`); modal.close(); finData = null; return admin();
        }
        if (a === 'commission' || a === 'spend') return entryModal(b, a);
        if (a === 'entry-del') {
          const e = d.commission.find((x) => x.id === +btn.dataset.id);
          if (await confirmBox({ title: `Delete this ${e.kind === 'spend' ? 'other ad spend' : 'commission payment'}?`, text: `${money2(e.amount)} on ${dayOnly(e.date)}${e.note ? ` (${h(e.note)})` : ''}.`, ok: 'Delete', danger: true }) === null) return reopen();
          await api('admin-commission', { remove: e.id }); toast('Entry deleted'); return reopen();
        }
        if (a === 'plan') return planModal(b); // swaps the drawer's content; closing first would fire a stray close event at the new form
        if (a === 'credits') return creditModal(b);
        if (a === 'cancel') {
          if (await confirmBox({ title: `Cancel ${h(b.company)}’s subscription?`, text: 'It stops at the end of their paid month. Their credits stay until then.', ok: 'Cancel subscription', danger: true }) === null) return reopen();
          await api('admin-update', { broker: id, cancel: true }); toast('Subscription set to cancel at period end'); return reopen();
        }
        if (a === 'agreement' || a === 'agreement-dl') await openAgreement(d.agreement, b.company, a === 'agreement-dl');
      } catch (ex) { toast(ex.message, true); }
    }));
  }
  function inviteModal() {
    modal.className = 'pf-modal'; modal.onclick = null;
    modal.innerHTML = `<form method="dialog" class="pf-modal-in"><h2>Invite a firm</h2><p>We'll email them an invitation. Their name and email are filled in for them, and their account is approved as soon as they create it.</p>
      <label>Their name<input name="fullname" autocomplete="off" required></label>
      <label>Email<input name="email" type="email" autocomplete="off" required></label>
      <label>Firm <span>(optional)</span><input name="company" autocomplete="off"></label>
      <label>Do they know us?<select name="kind"><option value="warm">Warm: they know us or expect this. Short invitation</option><option value="cold">Cold: first contact. Full introduction to Leaflegal, how it works and how to join</option></select></label>
      <label class="pf-switchrow pf-switchrow-top"><input type="checkbox" role="switch" name="alerts" checked><span class="pf-toggle-ui"></span><span><b>Email them new leads now</b><em>They get new-lead emails while they finish signing up, and keep getting them once they join</em></span></label>
      <label>Send at <span>(optional, leave blank to send now)</span><input name="at" type="datetime-local"></label>
      <div class="pf-row"><button class="pf-btn" value="cancel" formnovalidate>Cancel</button><button class="pf-btn pf-btn-primary" value="ok">${I.mail}Send invitation</button></div></form>`;
    modal.onclose = async () => {
      modal.onclose = null;
      if (modal.returnValue !== 'ok') return;
      const f = modal.querySelector('form');
      try { const at = f.at.value ? new Date(f.at.value).toISOString() : undefined; await api('admin-invite', { name: f.fullname.value, email: f.email.value, company: f.company.value, alerts: f.alerts.checked, kind: f.kind.value, sendAt: at }); toast(at ? `Invitation to ${f.email.value.trim()} will send ${new Date(at).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}` : `Invitation sent to ${f.email.value.trim()}`); } catch (ex) { toast(ex.message, true); }
    };
    modal.showModal();
  }

  // In-app confirm (replaces the browser's prompt/confirm). Resolves to the input text (or '' with no input), or null if cancelled.
  // After auto-buy criteria change, and in onboarding: offer the matching enquiries already waiting, not just new ones.
  async function offerBacklog() {
    const b = await api('backlog').catch(() => null);
    if (!b?.count) return;
    const n = num(b.count), one = b.count === 1;
    const yes = await confirmBox({ title: `${n} live ${one ? 'lead' : 'leads'} ready now`,
      text: `There ${one ? 'is 1 live lead' : `are ${n} live leads`} ready that ${one ? 'fits' : 'fit'} these criteria. ${one ? 'It costs' : 'Together they cost'} <b>${num(b.credits)} credits</b> at today’s prices${b.now ? ` (${num(b.have)} credits available)` : ''}.<br><br>${b.now ? 'Choose to be matched with them now, within the credits and monthly limit, or only with new enquiries from here on.' : 'Choose to be matched with them as soon as the account is approved and the plan is active (if they’re still available), or only with new enquiries.'}`,
      ok: 'Yes, match these', no: 'New enquiries only' });
    modal.close();
    const r = await api('backlog', { want: yes !== null }).catch((ex) => (toast(ex.message, true), null));
    if (r?.pending) toast('Saved. These will be matched once the account is live.');
    else if (r?.bought != null) toast(r.bought ? `Matched with ${num(r.bought)} ${r.bought === 1 ? 'enquiry' : 'enquiries'} for ${num(r.spent)} credits. They’re in My leads.` : 'None could be matched within the credits and monthly limit.', !r.bought);
  }
  function confirmBox({ title, text, ok, danger, input, no = 'Cancel' }) {
    modal.className = 'pf-modal'; modal.onclick = null; modal.onclose = null;
    modal.innerHTML = `<div class="pf-modal-in"><h2>${title}</h2><p>${text}</p>${input ? `<label>${input}<input name="v" autocomplete="off"></label>` : ''}
      <div class="pf-row"><button type="button" class="pf-btn" data-no>${no}</button><button type="button" class="pf-btn ${danger ? 'pf-btn-danger' : 'pf-btn-primary'}" data-yes>${ok}</button></div></div>`;
    if (!modal.open) modal.showModal();
    modal.querySelector(input ? 'input' : '[data-yes]').focus();
    return new Promise((done) => {
      modal.querySelector('[data-yes]').onclick = () => done(input ? modal.querySelector('input').value.trim() : '');
      modal.querySelector('[data-no]').onclick = () => done(null);
      modal.oncancel = (e) => { e.preventDefault(); modal.oncancel = null; done(null); }; // Esc
    });
  }
  const when = (d) => new Date(d).toLocaleString('en-GB', { timeZone: 'Europe/London', weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  const dayOnly = (d) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  function planModal(b) {
    const p = b.plan || {}, today = new Date().toISOString().slice(0, 10);
    modal.className = 'pf-modal'; modal.onclick = null;
    modal.innerHTML = `<form method="dialog" class="pf-modal-in"><h2>${b.plan ? 'Edit' : 'Set up'} plan</h2><p>For ${h(b.company)}. We add the credits each month on the start date. For an invoiced plan, you raise the invoice yourself.</p>
      <label>Plan name <span>(shown to them on Billing)</span><input name="name" value="${h(p.name || '')}" placeholder="e.g. Custom 10k" required></label>
      <label class="pf-switchrow pf-switchrow-top"><input type="checkbox" role="switch" name="commission" ${p.commission ? 'checked' : ''}><span class="pf-toggle-ui"></span><span><b>Commission client</b><em>They pay commission on instructed matters, not a plan price. Log payments and ad spend on their page. Only admins see this.</em></span></label>
      <div class="pf-two"><label>Credits a month <span data-opt ${p.commission ? '' : 'hidden'}>(optional, 0 = add credits by hand)</span><input name="credits" inputmode="numeric" value="${p.credits ? num(p.credits) : p.commission ? '0' : ''}" ${p.commission ? '' : 'required'}></label>
        <label data-price ${p.commission ? 'hidden' : ''}>Price a month <span>(£ ex VAT)</span><div class="pf-money"><i>£</i><input name="price" inputmode="decimal" value="${p.price ? num(p.price) : ''}" placeholder="0"></div></label></div>
      <label>${b.plan ? 'New start date <span>(optional, leave blank to keep the schedule)</span>' : 'Start date <span>(first credits are added on this day)</span>'}<input name="start" type="date" value="${b.plan ? '' : today}" min="${today}"></label>
      ${b.plan ? `<p class="pf-hint">Next credits: ${dayOnly(p.next_at)}.</p>` : ''}
      <div class="pf-row">${b.plan ? '<button class="pf-btn pf-btn-danger" value="remove" formnovalidate>End plan</button>' : ''}<button class="pf-btn" value="cancel" formnovalidate>Cancel</button><button class="pf-btn pf-btn-primary" value="ok">Save plan</button></div></form>`;
    modal.onclose = async () => {
      modal.onclose = null;
      const f = modal.querySelector('form'), v = modal.returnValue;
      try {
        if (v === 'remove') {
          if (await confirmBox({ title: `End ${h(b.company)}’s invoiced plan?`, text: 'No more monthly credits will be added. Their current balance stays.', ok: 'End plan', danger: true }) === null) return clientDrawer(b.id);
          await api('admin-plan', { broker: b.id, remove: true }); toast('Plan ended'); return clientDrawer(b.id);
        }
        if (v !== 'ok') return clientDrawer(b.id);
        const start = f.start.value ? new Date(`${f.start.value}T07:00:00`).toISOString() : undefined;
        const r = await api('admin-plan', { broker: b.id, name: f.name.value, credits: f.credits.value.replace(/[^\d]/g, '') || 0, price: f.commission.checked ? 0 : f.price.value.replace(/[^\d.]/g, ''), commission: f.commission.checked, start });
        toast(r.given ? `Plan saved and ${num(r.given)} credits added` : `Plan saved. Next credits on ${dayOnly(r.plan.next_at)}`); finData = null; clientDrawer(b.id);
      } catch (ex) { toast(ex.message, true); }
    };
    const cm = modal.querySelector('[name=commission]'); cm.onchange = () => { modal.querySelector('[data-price]').hidden = cm.checked; modal.querySelector('[data-opt]').hidden = !cm.checked; modal.querySelector('[name=credits]').required = !cm.checked; };
    modal.returnValue = ''; if (!modal.open) modal.showModal();
  }

  // Admin → Invites: everyone invited who hasn't joined. Search, select and delete (scheduled emails are cancelled), delete a whole
  // CSV upload, or upload a new CSV.
  let invQ = '', invSel = new Set(), invSort = 'next', invPage = 0, invShow = 'all';
  const INV_SHOWS = [['all', 'All invites'], ['accepted', 'Accepted'], ['notint', 'Not interested'], ['sent', 'Invite sent'], ['togo', 'Not sent yet'], ['paused', 'Paused'], ['expired', 'Link expired']];
  const INV_PER = 50, INV_SORTS = [['next', 'Next to send'], ['sent', 'Recently sent'], ['added', 'Newest added'], ['name', 'Name A–Z']];
  // Edit an invite's email, name or firm. The server re-makes the signed link and reschedules or resends as needed.
  function inviteEdit(v) {
    modal.className = 'pf-modal'; modal.onclick = null; modal.onclose = null;
    const sent = !v.queued && !v.paused && !(v.send_at && new Date(v.send_at) > Date.now());
    modal.innerHTML = `<form class="pf-modal-in" novalidate><h2>Edit invite</h2>
      <p>${sent ? 'This invite has already gone out. If you change the email, a new invite is sent to the new address straight away.' : 'It still goes out at its planned time, with a link for the new details.'}</p>
      <label>Email<input name="email" type="email" value="${h(v.email)}" required></label>
      <div class="pf-two"><label>Name<input name="name" value="${h(v.name || '')}" required></label><label>Firm<input name="company" value="${h(v.company || '')}"></label></div>
      <p class="pf-err" role="alert"></p>
      <div class="pf-row"><button type="button" class="pf-btn" data-no>Cancel</button><button type="submit" class="pf-btn pf-btn-primary">Save</button></div></form>`;
    if (!modal.open) modal.showModal();
    const f = modal.querySelector('form'), err = f.querySelector('.pf-err');
    modal.querySelector('[data-no]').onclick = () => modal.close();
    f.onsubmit = async (e) => {
      e.preventDefault(); const fd = new FormData(f), btn = f.querySelector('[type=submit]'); btn.disabled = true; err.textContent = '';
      try {
        const r = await api('admin-invite-edit', { email: v.email, newEmail: fd.get('email'), name: fd.get('name'), company: fd.get('company') });
        modal.close();
        toast(!r.changed ? 'Nothing changed' : { resent: `New invite sent to ${fd.get('email')}`, rescheduled: `Invite moved to ${fd.get('email')}, still sending ${when(r.at)}`, queued: 'Invite updated. It goes out at its planned time.' }[r.outcome] || 'Invite updated');
        if (r.changed) admin();
      } catch (ex) { err.textContent = ex.message; btn.disabled = false; }
    };
  }
  function invitesTab(box, d) {
    const now = Date.now(), S = d.suppressed || [], acc = Object.fromEntries((d.accepted || []).map((a) => [a.email, a]));
    const unsubbed = new Set(S.map((x) => x.email));
    const V = (d.invites || []).map((v) => (unsubbed.has(v.email) ? { ...v, notInterested: true } : v)).map((v) => (acc[v.email] ? { ...v, accepted: true, accepted_at: acc[v.email].at, broker: acc[v.email].broker } : v));
    for (const a of d.accepted || []) if (a.email && !V.some((v) => v.email === a.email)) { const b = (d.brokers || []).find((x) => x.id === a.broker);
      V.push({ email: a.email, name: b?.contact_name || '', company: b?.company || '', accepted: true, accepted_at: a.at, broker: a.broker, created_at: a.at, expires_at: a.at, alerts: false, kind: 'warm' }); }
    const status = (v) => (v.accepted ? ['instructed', 'Accepted'] : v.notInterested ? ['lost', 'Not interested'] : v.paused ? ['lost', 'Paused'] : v.queued ? ['new', 'Queued'] : new Date(v.expires_at) < now ? ['lost', 'Expired'] : v.send_at && new Date(v.send_at) > now ? ['application', 'Scheduled'] : ['contacted', 'Sent']);
    const leadsMode = (v) => (!v.alerts ? 'Lead emails off' : v.digest ? 'Weekly round-up' : 'Every new lead');
    const uploads = Object.values(V.filter((v) => v.batch).reduce((a, v) => { const u = (a[v.batch] ||= { batch: v.batch, n: 0, later: 0, paused: 0, joined: 0, next: null, at: v.created_at, cfg: (d.uploads || {})[v.batch] || {} }); u.n++; if (['Scheduled', 'Queued', 'Paused'].includes(status(v)[1])) { u.later++; if (!u.next || v.send_at < u.next) u.next = v.send_at; } if (v.paused) u.paused++; if (v.accepted) u.joined++; if (v.notInterested && !v.accepted) u.unsub = (u.unsub || 0) + 1; if (v.created_at < u.at) u.at = v.created_at; return a; }, {}));
    const draw = () => {
      // Show: sent = the email has actually gone out (still valid); not sent yet = queued or scheduled; expired = link ran out.
      const st = (v) => status(v)[1], show = { all: () => true, accepted: (v) => !!v.accepted, notint: (v) => !!v.notInterested && !v.accepted, sent: (v) => st(v) === 'Sent', togo: (v) => ['Queued', 'Scheduled'].includes(st(v)), paused: (v) => st(v) === 'Paused', expired: (v) => st(v) === 'Expired' };
      const q = invQ.trim().toLowerCase(), list = V.filter((v) => (show[invShow] || show.all)(v) && (!q || `${v.name} ${v.email} ${v.company || ''}`.toLowerCase().includes(q)));
      const counts = Object.fromEntries(INV_SHOWS.map(([k]) => [k, V.filter(show[k]).length]));
      // Sort: "Next to send" puts invites still to go out first (soonest first, paused at the end of those), then sent ones newest first.
      const toGo = (v) => v.queued || v.paused || (v.send_at && new Date(v.send_at) > now), sentAt = (v) => v.send_at || v.created_at;
      const by = { next: (a, b) => (toGo(b) - toGo(a)) || (toGo(a) ? (a.paused - b.paused) || String(a.send_at).localeCompare(String(b.send_at)) : String(sentAt(b)).localeCompare(String(sentAt(a)))),
        sent: (a, b) => (toGo(a) - toGo(b)) || String(sentAt(b)).localeCompare(String(sentAt(a))),
        added: (a, b) => String(b.created_at).localeCompare(String(a.created_at)),
        name: (a, b) => String(a.name || a.company || a.email).localeCompare(String(b.name || b.company || b.email), 'en-GB', { sensitivity: 'base' }) };
      list.sort(by[invSort] || by.next);
      const pages = Math.max(1, Math.ceil(list.length / INV_PER)); invPage = Math.min(invPage, pages - 1);
      const shown = list.slice(invPage * INV_PER, (invPage + 1) * INV_PER);
      const pager = pages > 1 ? `<div class="pf-pager"><button class="pf-btn pf-btn-sm" type="button" data-pg="-1" ${invPage ? '' : 'disabled'}>Previous</button>
        <span class="pf-hint">${num(invPage * INV_PER + 1)}–${num(invPage * INV_PER + shown.length)} of ${num(list.length)} · page ${invPage + 1} of ${pages}</span>
        <button class="pf-btn pf-btn-sm" type="button" data-pg="1" ${invPage < pages - 1 ? '' : 'disabled'}>Next</button></div>` : '';
      box.innerHTML = `<div class="pf-row-l pf-mb"><button class="pf-btn pf-btn-primary" data-invite1>${I.mail}Invite a firm</button><button class="pf-btn" data-bulk>${I.download}Upload a CSV</button></div>
        ${uploads.length ? `<div class="pf-card-h"><h3>CSV uploads</h3><span>sending progress and who’s joined</span></div><div class="pf-card pf-flush pf-mb"><table class="pf-table"><tbody>
          ${uploads.map((u) => { const c = u.cfg, paused = u.paused > 0, done = !u.later;
            return `<tr><td><b>${h(u.batch.replace(/^csv-\d+-?/, '') || 'CSV upload')}</b><span>Uploaded ${dayOnly(u.at)}${c.kind ? ` · ${c.kind === 'cold' ? 'Cold' : 'Warm'}` : ''}</span></td>
            <td><b>${num(u.n - u.later)} of ${num(u.n)} sent</b>${u.joined ? `<span><b class="pf-pos">${num(u.joined)} joined</b> · ${((u.joined / Math.max(1, u.n - u.later)) * 100).toFixed(1)}% of those sent</span>` : ''}${u.unsub ? `<span>${num(u.unsub)} not interested (unsubscribed)</span>` : ''}<span>${done ? 'Finished' : paused ? `<b class="pf-neg">Paused</b> · ${num(u.later)} to go` : `${c.perDay ? `${num(c.perDay)} a day · ` : ''}next ${when(u.next)}`}</span></td>
            <td class="pf-hide-s"><label class="pf-select"><select data-bleads="${h(u.batch)}" aria-label="Lead emails for this upload">${[['weekly', 'Weekly round-up'], ['instant', 'Every new lead'], ['off', 'No lead emails']].map(([k, n]) => `<option value="${k}" ${(c.leads || 'weekly') === k ? 'selected' : ''}>${n}</option>`).join('')}</select></label></td>
            <td class="pf-r"><div class="pf-actions">${done ? '' : paused ? `<button class="pf-btn pf-btn-sm pf-btn-primary" type="button" data-bpace="${h(u.batch)}" data-op="resume">Resume</button>` : `<button class="pf-btn pf-btn-sm" type="button" data-bpause="${h(u.batch)}">Pause</button><button class="pf-btn pf-btn-sm" type="button" data-bpace="${h(u.batch)}" data-op="pace">Change pace</button>`}
            <button class="pf-btn pf-btn-sm pf-btn-danger" type="button" data-delbatch="${h(u.batch)}">Delete</button></div></td></tr>`; }).join('')}</tbody></table></div>` : ''}
        <div class="pf-toolbar"><div class="pf-row-l"><label class="pf-search"><input type="search" placeholder="Search name, email or firm" value="${h(invQ)}" data-invq aria-label="Search invites"></label>
          <label class="pf-select"><select data-invshow aria-label="Show invites">${INV_SHOWS.map(([k, n]) => `<option value="${k}" ${invShow === k ? 'selected' : ''}>${n} (${num(counts[k])})</option>`).join('')}</select></label>
          <label class="pf-select"><select data-invsort aria-label="Sort invites">${INV_SORTS.map(([k, n]) => `<option value="${k}" ${invSort === k ? 'selected' : ''}>${n}</option>`).join('')}</select></label></div>
          <div class="pf-row-l"><span class="pf-hint">${num(list.length)} invite${list.length === 1 ? '' : 's'}${invSel.size ? ` · ${num(invSel.size)} selected` : ''}</span>
          <label class="pf-select"><select data-setleads aria-label="Lead emails for selected invites" ${invSel.size ? '' : 'disabled'}><option value="">Lead emails for selected…</option><option value="weekly">Weekly round-up</option><option value="instant">Every new lead</option><option value="off">No lead emails</option></select></label>
          <button class="pf-btn pf-btn-danger" type="button" data-delsel ${invSel.size ? '' : 'disabled'}>Delete selected</button></div></div>
        ${list.length ? `<div class="pf-card pf-flush"><table class="pf-table"><thead><tr><th><input type="checkbox" data-selall aria-label="Select all shown" ${shown.length && shown.every((v) => invSel.has(v.email)) ? 'checked' : ''}></th><th>Invited</th><th class="pf-hide-s">Email</th><th>Invite email</th><th class="pf-hide-s">Type</th></tr></thead><tbody>
          ${shown.map((v) => { const [k, n] = status(v); return `<tr><td><input type="checkbox" data-sel="${h(v.email)}" ${invSel.has(v.email) ? 'checked' : ''} aria-label="Select ${h(v.email)}"></td>
            <td><b>${h(v.name || v.company || v.email)}</b><span>${h(v.company || '–')}</span>${v.accepted ? '' : `<button class="pf-btn pf-btn-sm" type="button" data-invedit="${h(v.email)}">Edit</button>`}</td><td class="pf-hide-s">${h(v.email)}${(() => { const ph = v.broker && (d.brokers || []).find((x) => x.id === v.broker)?.phone; return ph ? `<span><a href="tel:${h(ph.replace(/[^\d+]/g, ''))}">${h(ph)}</a></span>` : ''; })()}</td>
            <td><span class="pf-stage pf-st-${k}">${n}</span><span>${v.accepted ? `joined ${when(v.accepted_at)}` : v.notInterested ? 'unsubscribed' : k === 'lost' ? `link expired ${dayOnly(v.expires_at)}` : when(v.send_at || v.created_at)}</span>${v.accepted && v.broker ? `<button class="pf-btn pf-btn-sm" type="button" data-client="${h(v.broker)}">Open client</button>` : ''}</td><td class="pf-hide-s"><b>${v.kind === 'cold' ? 'Cold' : 'Warm'}</b><span>${v.accepted ? 'Has an account' : leadsMode(v)}</span></td></tr>`; }).join('')}</tbody></table></div>
          ${pager}`
          : empty('mail', q ? 'No invites match' : 'No open invites', q ? 'Try a different search.' : 'Invite a firm, or upload a CSV to invite many at once. Accepted invites move to Clients.')}
        ${S.length ? `<div class="pf-card-h pf-mt"><h3>Unsubscribed</h3><span>${num(S.length)} · never emailed again unless they register an account themselves</span></div>
          <div class="pf-card pf-flush"><table class="pf-table"><tbody>${S.filter((x) => !q || x.email.includes(q)).slice(0, 200).map((x) => `<tr><td><b>${h(x.email)}</b><span>${h(x.reason || 'Unsubscribed')} · ${x.source === 'admin' ? 'added by Leaflegal' : x.source === 'resend' ? 'from email delivery' : `from ${x.source === 'crm' ? 'a CRM email' : 'an invite'}`}</span></td><td class="pf-r"><span>${dayOnly(x.created_at)}</span></td></tr>`).join('') || '<tr><td class="pf-hint">No matches.</td></tr>'}</tbody></table></div>` : ''}`;
      box.querySelectorAll('[data-client]').forEach((b) => (b.onclick = () => clientDrawer(b.dataset.client)));
      box.querySelector('[data-invsort]').onchange = (e) => { invSort = e.target.value; invPage = 0; draw(); };
      box.querySelector('[data-invshow]').onchange = (e) => { invShow = e.target.value; invPage = 0; invSel = new Set(); draw(); };
      box.querySelectorAll('[data-pg]').forEach((b) => (b.onclick = () => { invPage += Number(b.dataset.pg); draw(); box.querySelector('.pf-toolbar')?.scrollIntoView({ block: 'start' }); }));
      const qi = box.querySelector('[data-invq]'); qi.oninput = () => { invQ = qi.value; invPage = 0; const c = qi.selectionStart; draw(); const n = box.querySelector('[data-invq]'); n.focus(); n.setSelectionRange(c, c); };
      box.querySelector('[data-invite1]').onclick = inviteModal;
      box.querySelector('[data-bulk]').onclick = () => bulkModal();
      box.querySelectorAll('[data-invedit]').forEach((b) => (b.onclick = () => inviteEdit(V.find((v) => v.email === b.dataset.invedit))));
      box.querySelectorAll('[data-sel]').forEach((c) => (c.onchange = () => { c.checked ? invSel.add(c.dataset.sel) : invSel.delete(c.dataset.sel); draw(); }));
      const all = box.querySelector('[data-selall]'); if (all) all.onchange = () => { shown.forEach((v) => (all.checked ? invSel.add(v.email) : invSel.delete(v.email))); draw(); };
      box.querySelector('[data-setleads]').onchange = async (e) => {
        const leads = e.target.value, emails = [...invSel]; if (!leads) return;
        try { for (let i = 0; i < emails.length; i += 500) await api('admin-invite-leads', { emails: emails.slice(i, i + 500), leads });
          toast(`Lead emails updated for ${num(emails.length)} invite${emails.length === 1 ? '' : 's'}`); invSel = new Set(); admin(); }
        catch (ex) { toast(ex.message, true); e.target.value = ''; }
      };
      box.querySelector('[data-delsel]').onclick = async () => {
        const emails = [...invSel];
        if (await confirmBox({ title: `Delete ${num(emails.length)} invite${emails.length === 1 ? '' : 's'}?`, text: 'Scheduled invite emails are cancelled, they get no more lead emails, and their link no longer gives a pre-approved account.', ok: 'Delete', danger: true }) === null) return modal.close();
        modal.close(); await runDelete(emails.length, async (i) => api('admin-invite-delete', { emails: emails.slice(i, i + 100) }).then((r) => r.deleted), 100);
      };
      // Upload controls: pause, resume / change pace, lead emails. Big uploads take a few calls (Resend cancellations), so loop on `more`.
      const runBatch = async (payload, label) => {
        try { let r; for (let k = 0; k < 120; k++) { r = await api('admin-invite-batch', payload); if (!r.more) break; toast(`${label}…`); }
          if (r?.more) throw new Error('Still taking back scheduled invites. Try again in a minute.');
          if (payload.op !== 'pause') for (let k = 0; k < 30; k++) { const r = await api('admin-invite-flush', {}); if (!r.left || !r.handed) break; }
          toast(`${payload.op === 'pause' ? 'Upload paused. Nothing more goes out until you resume.' : payload.op === 'resume' ? 'Upload resumed' : 'Pace updated'}${r?.kept ? ` · ${num(r.kept)} already scheduled still go at their set time` : ''}`); }
        catch (ex) { toast(ex.message, true); }
        admin();
      };
      box.querySelectorAll('[data-bpause]').forEach((b) => (b.onclick = () => { b.disabled = true; runBatch({ batch: b.dataset.bpause, op: 'pause' }, 'Pausing'); }));
      box.querySelectorAll('[data-bleads]').forEach((sel) => (sel.onchange = async () => {
        try { await api('admin-invite-batch', { batch: sel.dataset.bleads, op: 'leads', leads: sel.value }); toast('Lead emails updated for this upload'); } catch (ex) { toast(ex.message, true); }
      }));
      box.querySelectorAll('[data-bpace]').forEach((b) => (b.onclick = () => {
        const u = uploads.find((x) => x.batch === b.dataset.bpace), resume = b.dataset.op === 'resume';
        const local = (d) => new Date(d - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 16), soon = new Date(Date.now() + 5 * 6e4);
        modal.className = 'pf-modal'; modal.onclick = null; modal.onclose = null;
        modal.innerHTML = `<form class="pf-modal-in" data-pf><h2>${resume ? 'Resume this upload' : 'Change the pace'}</h2><p>${num(u.later)} invite${u.later === 1 ? '' : 's'} still to go out. They’re re-timed from the start time below, sent between 8am and 5pm.</p>
          <div class="pf-two"><label>Invites a day<input name="perDay" inputmode="numeric" value="${u.cfg.perDay || 100}" required></label><label>Start from<input type="datetime-local" name="start" value="${local(soon)}" required></label></div>
          <p class="pf-hint" data-pl></p>
          <div class="pf-row"><button type="button" class="pf-btn" data-no>Cancel</button><button class="pf-btn pf-btn-primary">${resume ? 'Resume' : 'Save pace'}</button></div></form>`;
        const f = modal.querySelector('[data-pf]'), pl = modal.querySelector('[data-pl]');
        const show = () => { const n = parseInt(f.perDay.value, 10) || 0, days = n ? Math.ceil(u.later / n) : 0; pl.textContent = n ? `That’s ${days} more day${days === 1 ? '' : 's'}.` : ''; };
        f.perDay.oninput = show; show();
        modal.querySelector('[data-no]').onclick = () => modal.close();
        f.onsubmit = (e) => { e.preventDefault(); const perDay = parseInt(f.perDay.value, 10), start = new Date(f.start.value);
          if (!(perDay > 0 && perDay <= 2000)) return toast('Choose between 1 and 2,000 a day', true);
          if (isNaN(start) || start < Date.now() - 6e4) return toast('Pick a start time that isn’t in the past', true);
          modal.close(); toast('Updating…'); runBatch({ batch: u.batch, op: resume ? 'resume' : 'pace', perDay, start: start.toISOString() }, 'Updating'); };
        modal.showModal();
      }));
      box.querySelectorAll('[data-delbatch]').forEach((b) => (b.onclick = async () => {
        const u = uploads.find((x) => x.batch === b.dataset.delbatch);
        if (await confirmBox({ title: `Delete all ${num(u.n)} invites from this upload?`, text: `${u.later ? `${num(u.later)} invites that haven’t gone out yet won’t be sent. ` : ''}They get no more lead emails, and their links no longer give a pre-approved account. Anyone who already joined is unaffected.`, ok: 'Delete upload', danger: true }) === null) return modal.close();
        modal.close(); let left = 1; await runDelete(u.n, async () => { const r = await api('admin-invite-delete', { batch: u.batch }); left = r.left; return r.deleted; }, 100, () => !left);
      }));
    };
    // Deletes in chunks of 100 with a progress toast, then reloads.
    async function runDelete(total, step, size, doneEarly = () => false) {
      let n = 0;
      try { for (let i = 0; i < total; i += size) { n += await step(i); toast(`Deleting… ${num(n)} of ${num(total)}`); if (doneEarly()) break; } toast(`${num(n)} invite${n === 1 ? '' : 's'} deleted`); }
      catch (ex) { toast(`${ex.message} (${num(n)} deleted)`, true); }
      invSel = new Set(); admin();
    }
    draw();
  }

  // Upload a CSV of firms to invite: pick the file, match its columns, choose pacing, then send in small batches with progress.
  function parseCsv(text) {
    text = text.replace(/^﻿/, '');
    const head = text.split(/\r?\n/, 1)[0], sep = [',', ';', '\t'].sort((a, b) => head.split(b).length - head.split(a).length)[0];
    const rows = []; let row = [], cell = '', q = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (q) { if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (c === '"') q = false; else cell += c; continue; }
      if (c === '"') q = true; else if (c === sep) { row.push(cell); cell = ''; }
      else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(cell); cell = ''; if (row.some((x) => x.trim())) rows.push(row); row = []; }
      else cell += c;
    }
    row.push(cell); if (row.some((x) => x.trim())) rows.push(row);
    return rows;
  }
  function bulkModal() {
    const FIELDS = [['email', 'Email', true, /e-?mail/], ['name', 'Full name', false, /^(full ?name|name|contact( name)?)$/], ['first', 'First name', false, /first/], ['last', 'Last name', false, /last|surname/], ['company', 'Firm', false, /firm|company|business|organi[sz]ation/]];
    let rows = null, head = [], map = {}, fileName = '';
    modal.className = 'pf-modal pf-modal-wide'; modal.onclick = null; modal.onclose = null;
    const ok = (e) => /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(e);
    const people = () => { const seen = new Set(); return rows.map((r) => { const g = (k) => (map[k] >= 0 ? String(r[map[k]] || '').trim() : '');
      return { email: g('email').toLowerCase(), name: g('name') || [g('first'), g('last')].filter(Boolean).join(' '), company: g('company') }; })
      .filter((p) => { if (!ok(p.email) || seen.has(p.email)) return false; seen.add(p.email); return true; }); };
    const step1 = () => {
      modal.innerHTML = `<div class="pf-modal-in"><h2>Upload a CSV of firms to invite</h2><p>One firm per row, with a header row. It needs an email column; name and firm are optional. Firms that already have an account or an invite are skipped.</p>
        <label>CSV file<input type="file" accept=".csv,text/csv" data-file></label><p class="pf-err" data-err></p>
        <div class="pf-row"><button type="button" class="pf-btn" data-no>Cancel</button></div></div>`;
      modal.querySelector('[data-no]').onclick = () => modal.close();
      modal.querySelector('[data-file]').onchange = async (e) => {
        const f = e.target.files[0]; if (!f) return; fileName = f.name.replace(/\.csv$/i, '');
        const all = parseCsv(await f.text());
        if (all.length < 2) { modal.querySelector('[data-err]').textContent = 'That file has no rows under the header.'; return; }
        head = all[0].map((x) => x.trim()); rows = all.slice(1);
        map = Object.fromEntries(FIELDS.map(([k, , , re]) => [k, head.findIndex((x) => re.test(x.toLowerCase()))]));
        if (map.name >= 0) { map.first = -1; map.last = -1; }
        step2();
      };
    };
    const step2 = () => {
      const P = people(), noEmail = map.email < 0;
      const tomorrow9 = (() => { const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(9, 0, 0, 0); return d; })();
      const local = (d) => new Date(d - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 16);
      modal.innerHTML = `<form class="pf-modal-in" data-f><h2>Match the columns</h2><p><b>${h(fileName)}</b> · ${num(rows.length)} row${rows.length === 1 ? '' : 's'}. Tell us which column holds what.</p>
        <div class="pf-two">${FIELDS.map(([k, label, req]) => `<label>${label}${req ? '' : ' <span>(optional)</span>'}<select data-map="${k}"><option value="-1">${req ? 'Choose a column' : 'Not in this file'}</option>${head.map((x, i) => `<option value="${i}" ${map[k] === i ? 'selected' : ''}>${h(x || `Column ${i + 1}`)}</option>`).join('')}</select></label>`).join('')}</div>
        ${noEmail ? '<p class="pf-err">Choose the email column to continue.</p>' : `<p class="pf-hint"><b>${num(P.length)}</b> firm${P.length === 1 ? '' : 's'} with a valid email${rows.length - P.length ? ` · ${num(rows.length - P.length)} row${rows.length - P.length === 1 ? '' : 's'} skipped (no valid email or a repeat)` : ''}.</p>
        <div class="pf-card pf-flush"><table class="pf-table pf-mini"><thead><tr><th>Name</th><th>Email</th><th>Firm</th></tr></thead><tbody>${P.slice(0, 5).map((p) => `<tr><td>${h(p.name || '–')}</td><td>${h(p.email)}</td><td>${h(p.company || '–')}</td></tr>`).join('')}</tbody></table></div>
        <h3 class="pf-dsec">Sending</h3>
        <div class="pf-two"><label>Start sending<input type="datetime-local" name="start" value="${local(P.length > 200 ? tomorrow9 : new Date(Date.now() + 5 * 6e4))}"></label>
          <label>Invites a day <span>(sent 8am–5pm, spread out)</span><input name="perDay" inputmode="numeric" value="${Math.min(100, P.length)}"></label></div>
<label>Is this list warm or cold?<select name="kind"><option value="" selected disabled>Choose one</option><option value="warm">Warm: they know us or expect this. Short invitation</option><option value="cold">Cold: first contact. Full introduction to Leaflegal, how it works and how to join</option></select></label>
        <label>Lead emails while they decide<select name="leads"><option value="weekly">Weekly round-up of the best new leads (recommended for big lists)</option><option value="instant">An email for every new lead</option><option value="off">None</option></select></label>
        <p class="pf-hint" data-plan></p>`}
        <div class="pf-row"><button type="button" class="pf-btn" data-back>Choose another file</button><button class="pf-btn pf-btn-primary" ${noEmail || !P.length ? 'disabled' : ''}>Send ${num(P.length)} invite${P.length === 1 ? '' : 's'}</button></div></form>`;
      modal.querySelectorAll('[data-map]').forEach((sel) => (sel.onchange = () => { map[sel.dataset.map] = +sel.value; step2(); }));
      modal.querySelector('[data-back]').onclick = step1;
      const f = modal.querySelector('[data-f]'), plan = modal.querySelector('[data-plan]');
      const explain = () => { if (!plan) return; const n = Math.max(1, parseInt(f.perDay.value, 10) || 0), days = Math.ceil(P.length / n);
        const st = new Date(f.start.value), end = isNaN(st) ? null : new Date(+st + (days - 1) * 864e5);
        plan.innerHTML = `${num(Math.min(n, P.length))} a day, so the list goes out over <b>${days} day${days === 1 ? '' : 's'}</b>${end ? `, finishing ${end.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}` : ''}. Invites wait in a queue and go out on their day; you can delete any that haven’t gone yet.${f.leads.value === 'instant' && P.length > 100 ? ' <b>Every-lead emails to this many firms will use up your sending quota quickly; the weekly round-up is safer.</b>' : ''}`; };
      if (f.perDay) { f.perDay.oninput = explain; f.leads.onchange = explain; f.start.onchange = explain; explain(); }
      f.onsubmit = async (e) => {
        e.preventDefault();
        const perDay = parseInt(f.perDay.value, 10), start = new Date(f.start.value);
        if (!(perDay > 0 && perDay <= 2000)) return toast('Choose between 1 and 2,000 invites a day', true);
        if (!f.kind.value) return toast('Choose whether this list is warm or cold', true);
        if (isNaN(start) || start < Date.now() - 6e4) return toast('Pick a start time that isn’t in the past', true);
        step3(P, { perDay, start: start.toISOString(), leads: f.leads.value, kind: f.kind.value, batch: `csv-${Date.now()}-${fileName.slice(0, 40)}` });
      };
    };
    const step3 = async (P, o) => {
      const tot = { queued: 0, skipped: 0, unsubscribed: 0, invalid: 0 };
      modal.innerHTML = `<div class="pf-modal-in"><h2>Adding invites to the queue</h2><p>Please keep this window open.</p><div class="pf-progress"><i data-bar></i></div><p class="pf-hint" data-msg></p><div class="pf-row" data-end hidden><button type="button" class="pf-btn pf-btn-primary" data-done>Done</button></div></div>`;
      const bar = modal.querySelector('[data-bar]'), msg = modal.querySelector('[data-msg]');
      modal.oncancel = (e) => e.preventDefault(); // Esc mustn't stop it halfway
      let next = 0, stopped = '', handed = 0;
      for (let i = 0; i < P.length && !stopped; i += 200) {
        try { const r = await api('admin-invite-bulk', { ...o, rows: P.slice(i, i + 200), offset: next }); next = r.next; for (const k of Object.keys(tot)) tot[k] += r[k] || 0; }
        catch (ex) { stopped = ex.message; }
        const done = Math.min(P.length, i + 200); bar.style.width = `${(done / P.length) * 80}%`; msg.textContent = `${num(done)} of ${num(P.length)} added`;
      }
      // Invites due in the next 3 days go to Resend now; later ones are handed over by the daily job.
      for (let k = 0; k < 30 && !stopped; k++) {
        try { const r = await api('admin-invite-flush', {}); handed += r.handed; msg.textContent = `Scheduling the first few days… ${num(handed)} scheduled`; if (!r.left || !r.handed) break; }
        catch (ex) { stopped = ex.message; }
      }
      bar.style.width = '100%'; modal.oncancel = null;
      const days = Math.ceil(tot.queued / o.perDay);
      modal.querySelector('h2').textContent = stopped ? 'Stopped part way' : 'Invites queued';
      modal.querySelector('p').innerHTML = `<b>${num(tot.queued)}</b> ${o.kind} invite${tot.queued === 1 ? '' : 's'} queued, ${num(o.perDay)} a day over ${days} day${days === 1 ? '' : 's'} · ${num(tot.skipped)} skipped (already have an account or an invite)${tot.unsubscribed ? ` · ${num(tot.unsubscribed)} left out because they unsubscribed` : ''}${tot.invalid ? ` · ${num(tot.invalid)} without a valid email` : ''}.${stopped ? `<br><span class="pf-err">${h(stopped)}. Upload the same file again to carry on: firms already queued are skipped.</span>` : ''}`;
      modal.querySelector('[data-end]').hidden = false; modal.querySelector('[data-done]').onclick = () => { modal.close(); nav('admin/invites'); };
    };
    step1(); if (!modal.open) modal.showModal();
  }

  // Admin → Emails: every email the platform sends, as built by the live code with test data. Nothing here is sent.
  let mailData = null;
  // Admin → Blog: keys for scheduled runs (shown once) and the posts they published through /api/blog.
  async function blogTab(box) {
    let d; try { d = await api('admin-blog'); } catch (ex) { box.innerHTML = `<p class="pf-err">${h(ex.message)}</p>`; return; }
    box.innerHTML = `${d.ready ? '' : '<p class="pf-err pf-mb">Publishing isn’t switched on yet: add BLOG_GITHUB_TOKEN in Vercel, then redeploy.</p>'}
      <div class="pf-card-h"><h3>Publishing keys</h3><span>one per scheduled run · posts go to /api/blog</span></div>
      <div class="pf-row-l pf-mb"><button class="pf-btn pf-btn-primary" data-bkey>${I.plus}Create a key</button></div>
      ${d.keys.length ? `<div class="pf-card pf-flush"><table class="pf-table"><thead><tr><th>Name</th><th class="pf-hide-s">Created</th><th>Last used</th><th></th></tr></thead><tbody>
        ${d.keys.map((k) => `<tr><td><b>${h(k.name)}</b><span>${num(k.posts || 0)} post${k.posts === 1 ? '' : 's'}</span></td><td class="pf-hide-s">${dayOnly(k.created_at)}</td><td>${k.last_used ? ago(k.last_used) : 'Never'}</td>
          <td class="pf-r"><button class="pf-btn pf-btn-sm" data-brev="${h(k.id)}">Revoke</button></td></tr>`).join('')}</tbody></table></div>` : '<p class="pf-hint">No keys yet.</p>'}
      <div class="pf-card-h pf-mt"><h3>Published by scheduled runs</h3><span>hand-written posts aren’t listed here</span></div>
      ${d.posts.length ? `<div class="pf-card pf-flush"><table class="pf-table"><thead><tr><th>Post</th><th class="pf-hide-s">Published</th><th></th></tr></thead><tbody>
        ${d.posts.map((p) => `<tr><td><b><a href="https://leaflegal.co/blog/${h(p.slug)}" target="_blank" rel="noopener">${p.title}</a></b><span>${p.category}</span></td><td class="pf-hide-s">${dayOnly(p.date)}</td>
          <td class="pf-r"><button class="pf-btn pf-btn-sm" data-bunpub="${h(p.slug)}">Unpublish</button></td></tr>`).join('')}</tbody></table></div>` : '<p class="pf-hint">Nothing published through the API yet.</p>'}`;
    box.querySelector('[data-bkey]').onclick = async () => {
      const name = await confirmBox({ title: 'Create a publishing key', text: 'Name it after the scheduled run that will use it, so you know which one to revoke later.', ok: 'Create key', input: 'Name' });
      if (!name) { modal.close(); return; }
      try { const r = await api('admin-blog-key', { name });
        modal.innerHTML = `<div class="pf-modal-in"><h2>Copy this key now</h2><p>It won’t be shown again. Paste it into the scheduled run’s instructions where it says {{LEAFLEGAL_BLOG_KEY}}.</p>
          <label>Key<input readonly value="${h(r.key)}" class="pf-mono"></label><div class="pf-row"><button type="button" class="pf-btn" data-close>Done</button><button type="button" class="pf-btn pf-btn-primary" data-copy>Copy key</button></div></div>`;
        modal.querySelector('[data-copy]').onclick = async () => { await navigator.clipboard.writeText(r.key).catch(() => {}); toast('Key copied'); };
        modal.querySelector('[data-close]').onclick = () => { modal.close(); blogTab(box); };
      } catch (ex) { modal.close(); toast(ex.message, true); }
    };
    box.querySelectorAll('[data-brev]').forEach((b) => (b.onclick = async () => {
      const r = await confirmBox({ title: 'Revoke this key?', text: 'Any scheduled run using it will stop being able to publish.', ok: 'Revoke', danger: true });
      modal.close(); if (r === null) return;
      try { await api('admin-blog-key-revoke', { id: b.dataset.brev }); toast('Key revoked'); blogTab(box); } catch (ex) { toast(ex.message, true); }
    }));
    box.querySelectorAll('[data-bunpub]').forEach((b) => (b.onclick = async () => {
      const r = await confirmBox({ title: 'Unpublish this post?', text: 'It comes off the blog after the next build, in about 2 minutes. It stays in the GitHub history.', ok: 'Unpublish', danger: true });
      modal.close(); if (r === null) return;
      try { await api('admin-blog-unpublish', { slug: b.dataset.bunpub }); toast('Unpublished. Gone from the blog in about 2 minutes'); blogTab(box); } catch (ex) { toast(ex.message, true); }
    }));
  }
  async function emailsTab(box) {
    try { mailData ||= await api('admin-emails'); } catch (ex) { box.innerHTML = `<p class="pf-err">${h(ex.message)}</p>`; return; }
    const E = mailData.emails;
    box.innerHTML = `<p class="pf-hint pf-mb">${E.length} emails, built from the live code with test data on ${date(mailData.built)} (rebuilt every deploy). Nothing here is sent. CRM follow-ups show the default wording; edit the live versions in the CRM.</p>
      <div class="pf-card pf-flush"><table class="pf-table"><thead><tr><th>Email</th><th>Subject</th><th class="pf-hide-s">Goes to</th></tr></thead><tbody>
      ${E.map((m, i) => `<tr class="pf-rowlink" data-mail="${i}" tabindex="0"><td><b>${h(m.label)}</b>${m.files?.length ? `<span>Attached: ${h(m.files.join(', '))}</span>` : ''}</td><td>${h(m.subject)}</td>
        <td class="pf-hide-s"><span>${/leaflegal\.co$/.test(m.to) ? 'You (Leaflegal)' : /acmetrading/.test(m.to) ? 'The client' : 'The firm'}</span></td></tr>`).join('')}</tbody></table></div>`;
    box.querySelectorAll('[data-mail]').forEach((r) => { const go = () => { const m = E[+r.dataset.mail];
      drawer(`<div class="pf-dh"><div><span class="pf-eyebrow">${h(m.label)}</span><h2>${h(m.subject)}</h2></div></div><p class="pf-hint">To: ${h(m.to)} (test data)${m.files?.length ? ` · Attached: ${h(m.files.join(', '))}` : ''}</p>
        <iframe class="pf-mail-frame" title="${h(m.subject)}" sandbox></iframe>`);
      modal.querySelector('iframe').srcdoc = m.html; };
      r.onclick = go; r.onkeydown = (e) => e.key === 'Enter' && go(); });
  }

  // Commission client P&L (admin only): commission received vs ad spend on the leads they've had.
  function commissionSection(b, d, stages) {
    const E = d.commission || [], got = E.filter((e) => e.kind === 'commission'), ads = E.filter((e) => e.kind === 'spend');
    const n = d.bought.length, matched = d.bought.filter((l) => l.ad_by === 'campaign').length, priced = d.bought.filter((l) => l.ad_cost != null);
    const meta = priced.reduce((a, l) => a + l.ad_cost, 0), extra = ads.reduce((a, e) => a + e.amount, 0);
    const inc = got.reduce((a, e) => a + e.amount, 0), cost = meta + extra, p = inc - cost;
    const per = (v, k) => (k ? money2(v / k) : '–');
    return `<h3 class="pf-dsec">Commission</h3>
      <p class="pf-hint">${b.plan?.commission ? `<b>${h(b.plan.name)}</b> · ${b.plan.credits ? `${num(b.plan.credits)} credits a month, nothing to pay · next credits ${dayOnly(b.plan.next_at)}` : 'credits added by hand, nothing to pay'}. ` : ''}Credits they get count as £0 revenue, so this account runs at a loss until commission comes in. Commission they pay you counts as revenue in Finance. Only admins see this.</p>
      <div class="pf-kpis pf-kpis-3">
        <div class="pf-kpi"><span>Commission received</span><b>${money2(inc)}</b><em>${got.length} payment${got.length === 1 ? '' : 's'} · ${per(inc, n)} per lead</em></div>
        <div class="pf-kpi"><span>Ad spend</span><b>${money2(cost)}</b><em>${num(n)} lead${n === 1 ? '' : 's'} sent · ${per(cost, n)} per lead${extra ? ` · ${money2(extra)} outside Meta` : ''}</em></div>
        <div class="pf-kpi ${p < 0 ? 'pf-kpi-loss' : 'pf-kpi-win'}"><span>Profit</span><b>${money2(p)}</b><em>${cost ? `${(inc / cost).toFixed(1)}× return on ad spend` : 'no ad spend logged yet'}${stages.instructed ? ` · ${per(inc, stages.instructed)} per instructed matter` : ''}</em></div></div>
      <div class="pf-row-l"><button class="pf-btn pf-btn-primary" data-a="commission">${I.coins}Add commission payment</button><button class="pf-btn" data-a="spend">Add other ad spend</button></div>
      <p class="pf-hint">${d.meta !== 'ok' && n ? 'Meta isn’t connected, so Meta ad spend can’t be worked out. ' : n ? `Meta ad spend is worked out per lead: ${matched} of ${n} matched to their campaign’s spend that week ÷ its leads, the rest at that week’s average cost per lead. ` : ''}Use “Add other ad spend” only for spend outside Meta.</p>
      ${E.length ? `<table class="pf-table pf-mini"><tbody>${E.map((e) => `<tr><td><b>${e.kind === 'spend' ? 'Other ad spend' : 'Commission received'}</b><span>${dayOnly(e.date)}${e.note ? ` · ${h(e.note)}` : ''}</span></td><td class="pf-r ${e.kind === 'spend' ? 'pf-neg' : 'pf-plus'}"><b>${e.kind === 'spend' ? '−' : '+'}${money2(e.amount)}</b></td><td class="pf-r"><button class="pf-btn pf-btn-sm" type="button" data-a="entry-del" data-id="${e.id}" aria-label="Delete entry">Delete</button></td></tr>`).join('')}</tbody></table>` : '<p class="pf-hint">No payments or ad spend logged yet.</p>'}`;
  }
  function entryModal(b, kind) {
    const today = isoDay(new Date()), spend = kind === 'spend';
    modal.className = 'pf-modal'; modal.onclick = null;
    modal.innerHTML = `<form method="dialog" class="pf-modal-in"><h2>${spend ? 'Add other ad spend' : 'Add commission payment'}</h2><p>${spend ? `Ad spend outside Meta behind ${h(b.company)}’s leads. Meta spend is worked out automatically, so don’t add it here.` : `Commission ${h(b.company)} paid you.`} Only admins see this.</p>
      <div class="pf-two"><label>Amount <span>(£${spend ? '' : ' ex VAT'})</span><div class="pf-money"><i>£</i><input name="amount" inputmode="decimal" required></div></label>
        <label>${spend ? 'Date' : 'Date paid'}<input name="date" type="date" value="${today}" max="${today}" required></label></div>
      <label>Note <span>(optional)</span><input name="note" placeholder="${spend ? 'e.g. Google Ads, November' : 'e.g. 3 matters instructed, invoice INV-0041'}"></label>
      <div class="pf-row"><button class="pf-btn" value="cancel" formnovalidate>Cancel</button><button class="pf-btn pf-btn-primary" value="ok">Save</button></div></form>`;
    modal.onclose = async () => {
      modal.onclose = null;
      if (modal.returnValue !== 'ok') return clientDrawer(b.id);
      const f = modal.querySelector('form');
      try { await api('admin-commission', { broker: b.id, kind, amount: f.amount.value, date: f.date.value, note: f.note.value }); toast(spend ? 'Ad spend added' : 'Commission payment added'); finData = null; } catch (ex) { toast(ex.message, true); }
      clientDrawer(b.id);
    };
    modal.returnValue = ''; if (!modal.open) modal.showModal();
  }

  function creditModal(b) {
    modal.className = 'pf-modal'; modal.onclick = null;
    modal.innerHTML = `<form method="dialog" class="pf-modal-in"><h2>Adjust credits</h2><p>${h(b.company)} has <b>${num(b.credits)}</b> credits.</p>
      <label>Credits to add <span>(use a minus sign to remove)</span><input name="n" inputmode="numeric" required></label>
      <label>Reason <span>(shown in their history)</span><input name="reason" placeholder="e.g. 5,000 credit package, invoice INV-0012"></label>
      <label>Invoiced amount <span>(optional, £ ex VAT, counted as revenue)</span><div class="pf-money"><i>£</i><input name="invoiced" inputmode="decimal" placeholder="0"></div></label>
      <div class="pf-row"><button class="pf-btn" value="cancel" formnovalidate>Cancel</button><button class="pf-btn pf-btn-primary" value="ok">Apply</button></div></form>`;
    modal.onclose = async () => {
      modal.onclose = null;
      if (modal.returnValue !== 'ok') return;
      const f = modal.querySelector('form');
      try { await api('admin-broker', { id: b.id, credits: f.n.value.replace(/[^\d-]/g, ''), reason: f.reason.value, invoiced: f.invoiced.value.replace(/[^\d.]/g, '') }); toast('Credits updated'); finData = null; admin(); } catch (ex) { toast(ex.message, true); }
    };
    modal.returnValue = ''; if (!modal.open) modal.showModal();
  }

  // ------------------------------------------------ onboarding wizard
  const PC_RE = /^[A-Z]{1,2}\d[A-Z\d]? \d[A-Z]{2}$/;
  const fmtPostcode = (v) => { const c = String(v || '').toUpperCase().replace(/[^A-Z0-9]/g, ''); return c.length > 3 ? `${c.slice(0, -3)} ${c.slice(-3)}` : c; };
  // Saved as one line ("line 1, line 2, town, county, POSTCODE"); split back into fields for editing.
  const splitAddress = (a) => {
    const p = String(a || '').split(',').map((x) => x.trim()).filter(Boolean), o = { line1: '', line2: '', town: '', county: '', postcode: '' };
    if (p.length && PC_RE.test(fmtPostcode(p[p.length - 1]))) o.postcode = fmtPostcode(p.pop());
    if (p.length > 1) o.town = p.pop();
    o.line1 = p.shift() || ''; o.line2 = p.join(', ');
    return o;
  };
  const OB_STEPS = [['firm', 'Firm'], ['leads', 'Leads'], ['profile', 'Profile'], ['plan', 'Plan'], ['agreement', 'Agreement'], ['pay', 'Payment']];
  // The stepper shows creating the account as step 1, so signup and email confirmation sit in the same frame as onboarding.
  const ALL_STEPS = [['account', 'Account'], ...OB_STEPS];
  const obAt = (k) => OB_STEPS.findIndex(([x]) => x === k), obOf = () => `Step ${ob.step + 2} of ${ALL_STEPS.length}`;
  let ob = { step: 0, plan: null, amount: 0, coupon: '', couponLabel: '' };
  function obShell(inner, at = ob.step + 1, side = `<a href="${P}/dashboard" class="pf-onb-skip">Finish later</a>`, home = `${P}/dashboard`) {
    app.className = 'pf-onb';
    app.innerHTML = `<header class="pf-onb-top"><a href="${home}" class="pf-onb-logo" aria-label="Leaflegal">${LOGO}</a>
      <ol class="pf-onb-steps">${ALL_STEPS.map(([, n], i) => `<li class="${i < at ? 'done' : i === at ? 'on' : ''}"${i === at ? ' aria-current="step"' : ''}><span>${i < at ? I.check : i + 1}</span>${n}</li>`).join('')}</ol>
      ${side}</header>
      <main class="pf-onb-main"><div class="pf-onb-card">${inner}</div></main>`;
  }
  const obNav = (next = 'Continue', back = true) => `<div class="pf-onb-nav">${back && ob.step ? `<button type="button" class="pf-btn" data-back>Back</button>` : '<span></span>'}<button class="pf-btn pf-btn-primary pf-btn-lg" type="submit">${next}${I.arrow}</button></div>`;
  const obGo = (n) => { ob.step = n; window.scrollTo(0, 0); onboarding(); };
  const wireBack = () => app.querySelector('[data-back]')?.addEventListener('click', () => obGo(ob.step - 1));

  async function onboarding() {
    const step = OB_STEPS[ob.step][0];
    if (step === 'firm') {
      const adr = splitAddress(me.address), regs = me.regulators || [], numOf = (id) => regs.find((r) => r.id === id)?.number || '';
      obShell(`<form class="pf-onb-form" novalidate><span class="pf-eyebrow">${obOf()}</span><h1>Firm details</h1><p class="pf-sub">These details go on the referral agreement and invoices. We check every firm on its regulator’s register before leads go live.</p>
        <div class="pf-two"><label>Firm name<input name="company" value="${h(me.company)}" autocomplete="organization" required></label>
          <label>Company number <span>(optional)</span><input name="company_number" value="${h(me.company_number || '')}" autocapitalize="characters" placeholder="e.g. 01234567"></label></div>
        <h4 class="pf-sec">Regulators</h4><p class="pf-hint pf-mt-0">Tick every body that regulates the firm and add its number. This decides which practice areas the firm can buy.</p>
        <div class="pf-regs">${TX.regulators.map((r) => `<div class="pf-reg ${numOf(r.id) ? 'on' : ''}"><label class="pf-check"><input type="checkbox" name="reg" value="${r.id}" ${regs.some((x) => x.id === r.id) ? 'checked' : ''}> ${h(r.label)}</label>
          <label class="pf-reg-n" ${regs.some((x) => x.id === r.id) ? '' : 'hidden'}>${h(r.number)}<input name="regnum_${r.id}" value="${h(numOf(r.id))}" autocomplete="off"></label></div>`).join('')}</div>
        <h4 class="pf-sec">Firm address</h4>
        <label>Address line 1<input name="line1" value="${h(adr.line1)}" autocomplete="address-line1" required></label>
        <label>Address line 2 <span>(optional)</span><input name="line2" value="${h(adr.line2)}" autocomplete="address-line2"></label>
        <div class="pf-two"><label>Town or city<input name="town" value="${h(adr.town)}" autocomplete="address-level2" required></label>
          <label>County <span>(optional)</span><input name="county" value="${h(adr.county)}" autocomplete="address-level1"></label></div>
        <div class="pf-two"><label>Postcode<input name="postcode" value="${h(adr.postcode)}" autocomplete="postal-code" autocapitalize="characters" required></label><span></span></div>
        <h4 class="pf-sec">Signing for the firm</h4>
        <div class="pf-two"><label>Full name<input name="contact_name" value="${h(me.contact_name || '')}" autocomplete="name" required></label>
          <label>Position<input name="signer_title" value="${h(me.signer_title || prefill.role || '')}" placeholder="e.g. Partner" required></label></div>
        <label>Phone<input name="phone" value="${h(me.phone || '')}" type="tel" autocomplete="tel"></label>
        <p class="pf-err" role="alert"></p>${obNav('Continue', false)}</form>`);
      const form = app.querySelector('form');
      form.addEventListener('change', (e) => { if (e.target.name !== 'reg') return; const box = e.target.closest('.pf-reg'), n = box.querySelector('.pf-reg-n');
        n.hidden = !e.target.checked; box.classList.toggle('on', e.target.checked); if (e.target.checked) n.querySelector('input').focus(); });
      form.onsubmit = async (e) => {
        e.preventDefault(); const fd = new FormData(form), v = Object.fromEntries(fd), err = form.querySelector('.pf-err');
        v.postcode = fmtPostcode(v.postcode);
        const regulators = fd.getAll('reg').map((id) => ({ id, number: String(fd.get(`regnum_${id}`) || '').trim() }));
        if (!v.company.trim() || !v.line1.trim() || !v.town.trim() || !v.contact_name.trim() || !v.signer_title.trim()) return (err.textContent = 'Please fill in the firm name, address, full name and position.');
        if (!regulators.length) return (err.textContent = 'Tick at least one regulator.');
        const missing = regulators.find((r) => !r.number);
        if (missing) return (err.textContent = `Please add the ${regulatorOf(missing.id)?.number || 'regulator number'}.`);
        if (!PC_RE.test(v.postcode)) return (err.textContent = 'Please enter a valid UK postcode.');
        const cn = v.company_number.replace(/\s/g, '').toUpperCase();
        if (cn && !/^[A-Z0-9]{6,10}$/.test(cn)) return (err.textContent = 'Please enter a valid Companies House number, or leave it blank.');
        const body = { company: v.company.trim(), company_number: cn, regulators, contact_name: v.contact_name.trim(), signer_title: v.signer_title.trim(), phone: v.phone.trim(),
          address: [v.line1, v.line2, v.town, v.county, v.postcode].map((x) => x.trim()).filter(Boolean).join(', ') };
        try { await api('onboard', body); Object.assign(me, body); obGo(obAt('leads')); } catch (ex) { err.textContent = ex.message; }
      };
    }

    if (step === 'leads') {
      const allowed = firmAreas(), f = { ...(me.filters || {}) }, obAuto = me.mode === 'auto' || !Object.keys(me.filters || {}).length; // new firms start on Automatic
      if (!f.areas?.length) f.areas = [...allowed]; // everything the regulators allow, to start with
      obShell(`<form class="pf-onb-form pf-onb-wide" novalidate><span class="pf-eyebrow">${obOf()}</span><h1>Lead preferences</h1><p class="pf-sub">Pick the practice areas and matters the firm handles and where it takes clients from. This can be changed any time.</p>
        ${modeCards(obAuto)}
        <h4>Practice areas</h4>${areaPicker(f, allowed)}
        <h4>Regions</h4>${chips('regions', TX.regions, f.regions)}
        <details class="pf-autocaps" ${obAuto ? '' : 'hidden'}><summary>Set auto-buy limits <span>(optional, no limits unless set)</span></summary><div class="pf-two">
          <label>Leads per day<input name="dailyLeads" inputmode="numeric" value="${f.dailyLeads || ''}" placeholder="No limit"></label>
          <label>Credits per day<input name="dailyCredits" inputmode="numeric" value="${f.dailyCredits || ''}" placeholder="No limit"></label>
          <label>Credits per month<input name="monthly_cap" inputmode="numeric" value="${me.monthly_cap || ''}" placeholder="No limit"></label>
          <label>Most credits per lead<input name="maxPrice" inputmode="numeric" value="${f.maxPrice || ''}" placeholder="No maximum"></label></div>
          <p class="pf-hint">Leads above the per-lead limit are left to buy by hand.</p></details>
        <label class="pf-mt-s">Send leads to<input name="deliver_emails" value="${h(me.deliver_emails || '')}" placeholder="${h(me.email)}"></label>
        <p class="pf-err" role="alert"></p>${obNav()}</form>`);
      const form = app.querySelector('form'); wireBack(); wireAreas(form);
      form.addEventListener('change', () => (form.querySelector('.pf-autocaps').hidden = new FormData(form).get('mode') !== 'auto'));
      form.onsubmit = async (e) => {
        e.preventDefault(); const fd = new FormData(form), err = form.querySelector('.pf-err'), { areas, matters } = readAreas(form);
        if (!areas.length) return (err.textContent = 'Tick at least one practice area.');
        if (areas.some((a) => !fd.getAll(`m_${a}`).length)) return (err.textContent = 'Tick at least one matter in each practice area, or untick the area.');
        if (!fd.getAll('regions').length) return (err.textContent = 'Tick at least one region.');
        const d = (k) => +String(fd.get(k) || '').replace(/\D/g, '') || null;
        const v = { mode: fd.get('mode'), monthly_cap: d('monthly_cap') || 0, notify: true, deliver_emails: listVals(fd.get('deliver_emails')), notify_emails: listVals(fd.get('deliver_emails')),
          filters: { ...(me.filters || {}), areas, matters, regions: anyOf(fd.getAll('regions'), TX.regions), dailyLeads: d('dailyLeads'), dailyCredits: d('dailyCredits'), maxPrice: d('maxPrice') } };
        try { const r = await api('settings', v); Object.assign(me, v, { filters: r.filters || v.filters }); } catch (ex) { return (err.textContent = ex.message); }
        if (v.mode === 'auto') await offerBacklog();
        obGo(obAt('profile'));
      };
    }

    if (step === 'profile') {
      let prof = { ...profOf() };
      obShell(`<form class="pf-onb-form pf-onb-wide" novalidate><span class="pf-eyebrow">${obOf()}</span><h1>Public profile</h1>
        <p class="pf-sub">When a client is matched with the firm, this is who we tell them to expect. Paste the firm’s website and we’ll fill in what we can.</p>
        <div data-profbox>${profEditor(prof)}</div><p class="pf-err" role="alert"></p>${obNav()}</form>`);
      const form = app.querySelector('form'), pbox = form.querySelector('[data-profbox]'); wireBack();
      const redraw = (p) => { prof = p; pbox.innerHTML = profEditor(p); wireProfile(pbox, prof, redraw); };
      wireProfile(pbox, prof, redraw);
      form.onsubmit = async (e) => {
        e.preventDefault(); const p = profRead(pbox, prof), err = form.querySelector('.pf-err'), bad = profValid(p);
        if (bad) return (err.textContent = bad);
        try { const r = await api('profile', p); me.profile = r.profile; obGo(obAt('plan')); } catch (ex) { err.textContent = ex.message; }
      };
    }

    if (step === 'plan') {
      const trialOk = me.trialEligible, T = trial;
      // Suggest a plan from the leads a month they asked for × the real average lead price (server, last 90 days).
      // Volume may be a range ("50 to 100" → 75) or "250+" (→ 250).
      const nums = String(prefill.volume || '').match(/\d[\d,]*/g)?.map((n) => +n.replace(/,/g, '')) || [];
      const vol = nums.length ? Math.round(nums.reduce((x, y) => x + y, 0) / nums.length) : 0, need = vol * (pricing.avgLead || 45);
      if (!ob.plan) {
        if (!vol || (trialOk && need <= packs.starter.credits)) ob.plan = trialOk ? 'trial' : 'starter';
        else ob.plan = need <= packs.starter.credits ? 'starter' : need <= packs.growth.credits ? 'growth' : 'custom';
        if (ob.plan === 'custom') ob.amount = Math.max(custom.min, Math.ceil(need / (1 + custom.bonus / 100) / custom.step) * custom.step);
      }
      const card = (k, title, price, credits, sub, extra = '') => `<label class="pf-plancard ${k === 'trial' ? 'pf-plancard-trial' : ''} ${ob.plan === k ? 'on' : ''}"><input type="radio" name="plan" value="${k}" ${ob.plan === k ? 'checked' : ''}>
        ${extra}<b>${title}</b><span class="pf-pc-price">${price}<small> + VAT</small></span><span class="pf-pc-cr">${credits}</span><span class="pf-pc-sub">${sub}</span></label>`;
      obShell(`<form class="pf-onb-form pf-onb-wide" novalidate><span class="pf-eyebrow">${obOf()}</span><h1>Choose a plan</h1><p class="pf-sub">Monthly subscription, billed by card. Cancel any time. Unused credits roll over while you're subscribed.</p>
        ${vol ? `<p class="pf-prefilled">${I.target}About ${num(vol)} leads a month was the figure given, roughly ${num(need)} credits. We’ve picked a plan to match.</p>` : ''}
        <div class="pf-plans">
          ${trialOk ? card('trial', 'First month offer', gbp(T.pence / 100), `${num(T.credits)} credits`, `Then ${gbp(packs[T.then].pence / 100)} + VAT a month for ${num(packs[T.then].credits)} credits. Cancel or upgrade any time.`, '<em class="pf-ribbon">New firms</em>') : ''}
          ${Object.entries(packs).map(([k, p]) => card(k, p.name, gbp(p.pence / 100), `${num(p.credits)} credits`, p.bonus ? `${p.bonus}% bonus credits every month` : 'Every month')).join('')}
          <label class="pf-plancard pf-plancard-custom ${ob.plan === 'custom' ? 'on' : ''}"><input type="radio" name="plan" value="custom" ${ob.plan === 'custom' ? 'checked' : ''}>
            <b>Custom</b><span class="pf-custom-in"><span>£</span><input name="customAmount" inputmode="numeric" value="${num(ob.amount || custom.min * 2)}" aria-label="Monthly amount in pounds"><span>/month + VAT</span></span>
            <span class="pf-pc-cr" data-ocred></span><span class="pf-pc-sub" data-onote></span></label>
        </div>
        <div class="pf-plan-extras">
          <details class="pf-coupon" ${ob.coupon ? 'open' : ''}><summary>Have a coupon code? <u>Click here</u></summary>
            <div class="pf-coupon-row"><input name="coupon" value="${h(ob.coupon)}" placeholder="Your code" autocapitalize="characters" aria-label="Coupon code"><button type="button" class="pf-btn" data-apply>Apply</button></div>
            <p class="pf-coupon-msg ${ob.couponLabel ? 'ok' : ''}">${ob.couponLabel ? `${I.check}${h(ob.couponLabel)} applied${ob.plan === 'trial' ? ' (replaces the first month offer)' : ''}` : ''}</p></details>
          <p class="pf-hint">Need more than ${num(custom.maxCredits)} credits a month? <a href="mailto:${custom.contact}">Contact us</a> for a custom plan.</p>
          <button type="button" class="pf-btn pf-howbtn" data-how>${I.coins}How credits work and what leads cost</button></div>
        <p class="pf-err" role="alert"></p>${obNav()}</form>`);
      const form = app.querySelector('form'); wireBack();
      form.querySelector('[data-how]').onclick = () => {
        modal.className = 'pf-modal pf-modal-wide'; modal.onclick = (e) => { if (e.target === modal) modal.close(); }; modal.onclose = null;
        modal.innerHTML = `<div class="pf-modal-in"><button class="pf-iconbtn pf-drawer-x" aria-label="Close" data-close>${I.x}</button>${howCredits()}${priceCalc()}</div>`;
        modal.querySelector('[data-close]').onclick = () => modal.close();
        modal.showModal(); wirePriceCalc(modal);
      };
      const amt = form.querySelector('[name=customAmount]');
      const syncCustom = () => {
        const n = Math.max(custom.min, Math.round((+amt.value.replace(/\D/g, '') || 0) / custom.step) * custom.step), cr = Math.round(n * (1 + custom.bonus / 100));
        ob.amount = n; ob.enterprise = cr > custom.maxCredits;
        form.querySelector('[data-ocred]').textContent = `${num(cr)} credits`;
        form.querySelector('[data-onote]').textContent = ob.enterprise ? `Over ${num(custom.maxCredits)} credits: our team will contact you to set this up. No payment now.` : 'Credits every month';
      };
      amt.addEventListener('focus', () => { const r = form.querySelector('[name=plan][value=custom]'); if (!r.checked) { r.checked = true; r.dispatchEvent(new Event('change', { bubbles: true })); } });
      amt.addEventListener('input', syncCustom); amt.addEventListener('blur', () => { syncCustom(); amt.value = num(ob.amount); });
      syncCustom();
      form.addEventListener('change', (e) => { if (e.target.name === 'plan') { ob.plan = e.target.value; form.querySelectorAll('.pf-plancard').forEach((c) => c.classList.toggle('on', c.querySelector('input').checked)); } });
      form.querySelector('.pf-coupon').ontoggle = (e) => e.target.open && form.coupon.focus();
      form.querySelector('[data-apply]').onclick = async () => {
        const code = form.coupon.value.trim(), msg = form.querySelector('.pf-coupon-msg');
        if (!code) { ob.coupon = ''; ob.couponLabel = ''; msg.textContent = ''; return; }
        try { const r = await api('coupon', { code }); ob.coupon = r.code; ob.couponLabel = r.label; msg.className = 'pf-coupon-msg ok'; msg.innerHTML = `${I.check}${h(r.label)} applied${ob.plan === 'trial' ? ' (instead of the first month offer)' : ''}`; }
        catch (ex) { ob.coupon = ''; ob.couponLabel = ''; msg.className = 'pf-coupon-msg bad'; msg.textContent = ex.message; }
      };
      form.onsubmit = (e) => { e.preventDefault(); if (form.coupon.value.trim() && !ob.coupon) return (form.querySelector('.pf-err').textContent = 'Apply your coupon code first, or clear it.'); obGo(obAt(me.agreementWaived ? 'pay' : 'agreement')); };
    }

    if (step === 'agreement') {
      if (me.agreementWaived) return obGo(obAt('pay'));
      const { html: terms, version } = await api('terms');
      obShell(`<form class="pf-onb-form pf-onb-wide" novalidate><span class="pf-eyebrow">${obOf()}</span><h1>Referral agreement</h1>
        <p class="pf-sub">Between ${h(me.company)} and Vertical Brands Ltd (trading as Leaflegal). Please read it in full. A signed copy is emailed and kept in the account.</p>
        <div class="pf-terms" tabindex="0" aria-label="Referral agreement">${terms}</div>
        <div class="pf-two pf-mt-s"><label>Full name<input name="signer_name" value="${h(me.contact_name || '')}" autocomplete="name" required></label>
          <label>Position<input name="signer_title" value="${h(me.signer_title || '')}" required></label></div>
        <label class="pf-check"><input type="checkbox" name="authority"> I confirm I am authorised to accept this agreement on behalf of ${h(me.company)}.</label>
        <label class="pf-check"><input type="checkbox" name="accept"> I have read and agree to the Leaflegal Law Firm Referral Agreement (version ${h(version)}), and agree that accepting it online is legally binding.</label>
        <p class="pf-err" role="alert"></p>${obNav('Agree and continue')}</form>`);
      const form = app.querySelector('form'); wireBack();
      form.onsubmit = async (e) => {
        e.preventDefault(); const err = form.querySelector('.pf-err'), btn = form.querySelector('[type=submit]');
        if (form.signer_name.value.trim().split(/\s+/).length < 2) return (err.textContent = 'Please type your full name (first and last name).');
        if (!form.signer_title.value.trim()) return (err.textContent = 'Please enter the position held at the firm.');
        if (!form.authority.checked || !form.accept.checked) return (err.textContent = 'Please tick both boxes to accept the agreement.');
        btn.disabled = true; btn.classList.add('busy');
        try {
          const r = await api('sign', { version, signer_name: form.signer_name.value, signer_title: form.signer_title.value, accept: true, authority: true });
          try { localStorage.removeItem('llp-prefill'); } catch {}
          me.agreement = r.agreement; me.agreementCurrent = true; me.onboarded_at = new Date().toISOString(); toast('Agreement accepted. A copy is on its way to your inbox.');
          const { subscription: has } = await api('subscription').catch(() => ({}));
          if (has) { nav('dashboard'); return; } // already subscribed: nothing to pay
          obGo(obAt(ob.plan ? 'pay' : 'plan'));
        } catch (ex) { err.textContent = ex.message; btn.disabled = false; btn.classList.remove('busy'); }
      };
    }

    if (step === 'pay') {
      if (!ob.plan) return obGo(obAt('plan'));
      if (ob.plan === 'custom' && ob.enterprise) {
        obShell(`<div class="pf-onb-form pf-onb-wide pf-onb-done"><span class="pf-empty-ic">${I.check}</span><h1>Thanks, we’ll be in touch</h1>
          <p class="pf-sub">Your agreement is signed. Because you've asked for a large custom plan (about ${gbp(ob.amount)} + VAT a month, ${num(Math.round(ob.amount * (1 + custom.bonus / 100)))} credits), a member of our team will contact you to agree the details and switch on your credits. There's nothing to pay now.</p>
          <div class="pf-row-l"><a class="pf-btn pf-btn-primary pf-btn-lg" href="${P}/dashboard">Go to your dashboard${I.arrow}</a></div></div>`);
        if (!ob.sentEnterprise) { ob.sentEnterprise = true; api('enterprise-request', { amount: ob.amount }).catch((ex) => toast(ex.message, true)); }
        return;
      }
      const isTrial = ob.plan === 'trial', isCustom = ob.plan === 'custom';
      const p = isTrial ? null : isCustom ? { name: 'Custom', pence: ob.amount * 100, credits: Math.round(ob.amount * (1 + custom.bonus / 100)) } : packs[ob.plan];
      obShell(`<div class="pf-onb-form pf-onb-wide"><span class="pf-eyebrow">${obOf()}</span><h1>Payment</h1>
        <p class="pf-sub">${isTrial ? `First month ${gbp(trial.pence / 100)} + VAT for ${num(trial.credits)} credits, then ${gbp(packs[trial.then].pence / 100)} + VAT a month.` : `${h(p.name)}: ${gbp(p.pence / 100)} + VAT a month for ${num(p.credits)} credits.`}${ob.couponLabel ? ` Code applied: ${h(ob.couponLabel)}.` : ''} Cancel any time from Billing.</p>
        <div class="pf-onb-pay" id="pf-onb-pay"><div class="pf-pay-load">Loading secure payment form…</div></div>
        <div class="pf-onb-nav"><button type="button" class="pf-btn" data-back>Back</button><a class="pf-link" href="${P}/dashboard">I'll pay later</a></div></div>`);
      wireBack();
      try {
        const r = await api('checkout', { pack: ob.plan, amount: ob.amount, coupon: ob.coupon || undefined, embedded: true });
        if (!r.clientSecret) { if (!r.url) throw new Error('Could not start checkout. Please try again.'); location.href = r.url; return; }
        await loadStripe();
        await mountPay(r, '#pf-onb-pay');
      } catch (ex) { app.querySelector('#pf-onb-pay').innerHTML = `<p class="pf-err">${h(ex.message)}</p>`; }
    }
  }

  // ------------------------------------------------ confirm your email
  function verifyView() {
    obShell(`<div class="pf-onb-form"><span class="pf-eyebrow">Step 1 of ${ALL_STEPS.length}</span><h1>Check the inbox</h1>
        <p class="pf-sub">We’ve sent a confirmation link to <b>${h(me.email)}</b>. Click it to carry on setting up your account. It can take a minute to arrive, so check your spam folder too.</p>
        <p class="pf-err" role="status"></p>
        <p class="pf-onb-alt">Wrong address? <a href="#" data-out>Sign out</a> and create the account again.</p>
        <div class="pf-onb-nav"><button class="pf-btn" data-resend>Send the link again</button><button class="pf-btn pf-btn-primary pf-btn-lg" data-done>I’ve confirmed it${I.arrow}</button></div></div>`,
      0, '<a href="#" class="pf-onb-skip" data-out>Sign out</a>');
    const msg = app.querySelector('.pf-err');
    app.querySelector('[data-done]').onclick = () => { cache.clear(); route(); };
    app.querySelector('[data-resend]').onclick = async (e) => {
      e.currentTarget.disabled = true;
      try { await api('resend-verify', {}); msg.textContent = 'Sent. Check your inbox.'; } catch (ex) { msg.textContent = ex.message; }
    };
    app.querySelectorAll('[data-out]').forEach((a) => (a.onclick = (e) => { e.preventDefault(); signOut(); }));
  }

  // ------------------------------------------------ notifications
  // Which emails a firm gets. Bought-lead delivery stays on Auto-buy (it sits with webhooks); account and billing emails always go.
  function notifications() {
    shell('notifications');
    const sug = ['instant', 'daily', 'off'].includes(me.filters?.suggest) ? me.filters.suggest : 'instant', auto = me.mode === 'auto';
    const choice = (v, t, d) => `<label class="pf-choice"><input type="radio" name="suggest" value="${v}" ${sug === v ? 'checked' : ''}><span><b>${t}</b><em>${d}</em></span></label>`;
    view().innerHTML = `<form class="pf-auto" id="pf-notform" novalidate><div class="pf-auto-main">
      <section class="pf-card"><div class="pf-card-h"><h3>Leads that fit the criteria</h3><span>Set under <a href="${P}/autobuy">Auto-buy</a></span></div>
        <div class="pf-opt"><label class="pf-switchrow pf-switchrow-top"><input type="checkbox" role="switch" name="notify" ${me.notify ? 'checked' : ''}><span class="pf-toggle-ui"></span><span><b>Email when a matching lead arrives</b><em>${auto ? 'Auto-buy buys matching leads straight away, so this only emails when one costs more than the maximum per lead' : 'So it can be bought before another firm gets it'}</em></span></label>
          ${listField('notify_emails', me.notify_emails, 'email', me.email, 'Add another email', 10)}
          <p class="pf-hint">These addresses get all new-lead emails. Leave blank to use ${h(me.email)}.</p></div></section>
      <section class="pf-card"><div class="pf-card-h"><h3>Leads outside the criteria</h3><span>Leads ${auto ? 'auto-buy skips' : 'that don’t match'}, suggested anyway</span></div>
        <p class="pf-hint pf-mt-0">Each email says which criteria the lead falls outside, so it’s easy to decide if it’s worth buying.</p>
        <div class="pf-choices">${choice('instant', 'As they arrive', 'One email per lead, so it can be bought before anyone else')}
          ${choice('daily', 'Daily summary', 'One email each morning listing the unsold leads from the last day')}
          ${choice('off', 'Off', 'Only hear about leads that fit the criteria')}</div></section>
      ${auto ? `<section class="pf-card"><div class="pf-card-h"><h3>Leads auto-buy skipped</h3></div>
        <label class="pf-switchrow pf-switchrow-top"><input type="checkbox" role="switch" name="missed" ${me.filters?.missed !== 'off' ? 'checked' : ''}><span class="pf-toggle-ui"></span><span><b>Daily email of skipped leads</b><em>Each morning: the leads from the last day that fell outside the auto-buy criteria, who bought them, and what held them back. Replaces the daily summary above.</em></span></label></section>` : ''}
      <section class="pf-card"><div class="pf-card-h"><h3>Bought leads</h3></div>
        <p class="pf-hint pf-mt-0">${me.deliver_on === false ? 'Bought leads aren’t emailed right now.' : `Each bought lead is emailed with full contact details to ${h(me.deliver_emails || me.email)}.`} Change this, or send leads to a CRM, under <a href="${P}/autobuy">Auto-buy, Delivery</a>.</p></section>
      <section class="pf-card"><div class="pf-card-h"><h3>Always sent</h3></div>
        <p class="pf-hint pf-mt-0">Emails about the account itself always go to ${h(me.email)}: payments and plan changes, low credit warnings, refund decisions and sign-in links.</p></section>
    </div></form>
    <div class="pf-savebar"><span>Changes apply to the next email.</span><button class="pf-btn pf-btn-primary pf-btn-lg" type="submit" form="pf-notform">Save settings</button></div>`;
    const form = view().querySelector('form'); wireLists(form);
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      // settings rewrites mode, cap and criteria, so send the current ones back unchanged.
      const v = { mode: me.mode, monthly_cap: me.monthly_cap, filters: me.filters, notify: !!fd.get('notify'), notify_emails: fd.getAll('notify_emails').map((x) => String(x).trim()).filter(Boolean), suggest: fd.get('suggest'), ...(auto ? { missed: fd.get('missed') ? 'on' : 'off' } : {}) };
      try { const r = await api('settings', v); Object.assign(me, { notify: v.notify, notify_emails: v.notify_emails.join(', ') || null, filters: r.filters }); toast('Notification settings saved'); notifications(); } catch (ex) { toast(ex.message, true); }
    });
  }

  // ------------------------------------------------ router
  // Broker CRM (admins): UI lives in crm.js, loaded on first visit and handed the shell's helpers.
  async function crm() {
    if (!me.is_admin) { nav('dashboard'); return; }
    shell('crm');
    if (!window.LLCRM) await new Promise((ok, bad) => document.head.appendChild(Object.assign(document.createElement('script'), { src: '/assets/crm.js?v=1', onload: ok, onerror: () => bad(new Error('Couldn’t load the CRM. Please refresh.')) })));
    window.LLCRM({ view, h, I, toast, modal, drawer, confirmBox, when, ago, date, empty, initials, nav, P, me,
      api: (action, body) => apiFetch(action, body, true, 'crm'), platformApi: api });
  }
  const VIEWS = { dashboard, opportunities, leads, autobuy, notifications, profile, billing: credits, credits, account, admin, crm, onboarding };
  async function route() {
    await Promise.all([handoffReady, configReady, taxReady]);
    let tab = currentTab();
    if (tab === 'signup') { history.replaceState(null, '', `${P}/register${location.search}`); tab = 'register'; } // old links
    if (modal.open) { modal.onclose = null; modal.close(); }
    if (tab === 'register' && session) { saveSession(null); me = null; } // a register link always shows the sign-up form
    if (tab === 'join') { if (session) { saveSession(null); me = null; } return joinView(); }
    if (!session) return authView(tab === 'register' ? 'up' : 'in');
    try {
      const first = !me;
      const d = await api('me'); if (d.taxonomy?.areas?.length) useTx(d.taxonomy); me = d.broker; opts = d.options; packs = d.packs; pricing = d.pricing?.areas ? d.pricing : pricing?.areas ? { ...(d.pricing || {}), ...pricing } : d.pricing; custom = d.custom; trial = d.trial; low = d.lowCredits || low;
      if (acting && me.is_admin && ['profile', 'autobuy', 'notifications'].includes(tab)) me = acting; else acting = null;
      if (!me.email_verified_at) return verifyView();
      if (first) prefetch();
      killPay();
      const firstRun = !tab && !me.member && !me.onboarded_at && !me.agreement && !me.agreementWaived;
      if (TAB_NEED[tab] && !can(TAB_NEED[tab])) { nav('dashboard'); return; }
      await (firstRun ? onboarding : VIEWS[tab] || dashboard)();
    } catch (e) {
      if (me) return toast(e.message, true);
      saveSession(null); authView('in');
      app.querySelector('.pf-err').textContent = e.status === 404 || e.message === 'Failed to fetch' || /Unexpected/.test(e.message)
        ? "Can't reach the platform right now. Please try again in a moment." : e.message;
    }
  }
  // Clean URLs: platform.leaflegal.co/<tab>. Old #tab links are converted on load; /signup is now /register.
  addEventListener('popstate', route);
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="/"]'), href = a?.getAttribute('href') || '';
    if (!a || e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || a.target || !href.startsWith(`${P}/`) || /^\/(api|assets)\//.test(href)) return;
    e.preventDefault(); nav(href.slice(P.length + 1).split('?')[0]);
  });
  if (/^#[a-z]+$/.test(location.hash)) history.replaceState(null, '', `${P}/${location.hash.slice(1)}${location.search}`);
  route();
})();

// Leaflegal Platform demo mode: click around the platform with sample data, no server needed.
// Off unless the URL has ?demo=firm or ?demo=admin (the role is kept in sessionStorage for this tab; ?demo=off leaves).
// When on, window.fetch answers /api/platform, /api/crm and Supabase /auth/v1 calls from in-browser data shaped like
// api/platform.js and api/crm.js replies. Changes live in sessionStorage, so they last until the tab is closed.
// Load before platform.js. Nothing real is read, sent or charged.
(() => {
  const RK = 'llp-demo', SK = 'llp-demo-state', TK = 'llp-session';
  const url0 = new URL(location.href), flag = url0.searchParams.get('demo');
  let role = null;
  try {
    if (flag === 'off') { sessionStorage.removeItem(RK); sessionStorage.removeItem(SK); }
    else if (flag === 'firm' || flag === 'admin') sessionStorage.setItem(RK, flag);
    role = sessionStorage.getItem(RK);
  } catch {}
  if (flag) { url0.searchParams.delete('demo'); history.replaceState(history.state, '', url0.pathname + url0.search + url0.hash); }
  const demoToken = (t) => /^demo-(firm|admin)$/.test(String(t || ''));
  if (role !== 'firm' && role !== 'admin') {
    // Demo is off: swap a demo sign-in back to the real one saved on the way in (if any), else show the sign-in page.
    try { const s = JSON.parse(localStorage.getItem(TK) || 'null'); if (demoToken(s?.access)) { const real = sessionStorage.getItem('llp-real-session'); if (real) localStorage.setItem(TK, real); else localStorage.removeItem(TK); } sessionStorage.removeItem('llp-real-session'); } catch {}
    return;
  }
  // Landing with ?demo=firm or ?demo=admin signs straight in as that role.
  try { const s = JSON.parse(localStorage.getItem(TK) || 'null'); if (s && !demoToken(s.access)) sessionStorage.setItem('llp-real-session', JSON.stringify(s)); if (flag || (s && !demoToken(s.access))) localStorage.setItem(TK, JSON.stringify({ access: `demo-${role}`, refresh: `demo-${role}` })); } catch {}

  // ------------------------------------------------ banner
  const BH = 34;
  const css = `:root{--demo-h:${BH}px}body{padding-top:var(--demo-h)}
.pf-demo-bar{position:fixed;top:0;left:0;right:0;z-index:60;height:var(--demo-h);display:flex;align-items:center;justify-content:center;gap:14px;padding:0 16px;background:#f29a12;color:#14271f;font:700 13px/1.2 "LINE Seed Sans",system-ui,-apple-system,sans-serif;white-space:nowrap;overflow:hidden}
.pf-demo-bar a{color:#14271f;text-decoration:underline;text-underline-offset:2px}.pf-demo-bar span{overflow:hidden;text-overflow:ellipsis}
.pf-side{top:var(--demo-h)!important}.pf-top,.pf-onb-top{top:var(--demo-h)!important}
@media(min-width:901px){.pf-side{height:calc(100vh - var(--demo-h))!important;height:calc(100dvh - var(--demo-h))!important}}
.pf-loading,.pf-shell{min-height:calc(100vh - var(--demo-h))}
@media(max-width:560px){.pf-demo-bar{gap:10px;font-size:12px}.pf-demo-bar .pf-demo-sw{display:none}}`;
  const bar = () => {
    if (document.querySelector('.pf-demo-bar')) return;
    document.head.appendChild(Object.assign(document.createElement('style'), { textContent: css }));
    const other = role === 'admin' ? 'firm' : 'admin';
    const b = Object.assign(document.createElement('div'), { className: 'pf-demo-bar' });
    b.setAttribute('role', 'note');
    b.innerHTML = `<span>Demo with sample data. Nothing here is real.</span><a class="pf-demo-sw" href="${/^\/platform(\/|$)/.test(location.pathname) ? '/platform' : ''}/${other === 'admin' ? 'admin' : 'dashboard'}?demo=${other}">View as ${other === 'admin' ? 'admin' : 'the firm'}</a><a href="${location.pathname}?demo=off">Leave demo</a>`;
    document.body.prepend(b);
  };
  if (document.body) bar(); else document.addEventListener('DOMContentLoaded', bar);

  // ------------------------------------------------ taxonomy and server constants (api/_lib/taxonomy.js, api/_lib/platform.js)
  const TAX = {"areas":[{"slug":"conveyancing","label":"Conveyancing","ew":true,"matters":[["buying-a-home","Buying a home"],["selling-a-home","Selling a home"],["buying-and-selling","Buying and selling"],["first-time-buyers","First time buyer"],["buying-a-leasehold-flat","Buying a leasehold flat"],["new-build-purchases","New build purchase"],["buy-to-let","Buy to let"],["remortgaging","Remortgaging"],["transfer-of-equity","Transfer of equity"],["other","Something else"]]},{"slug":"immigration","label":"Immigration","ew":false,"matters":[["work-visas","Work visa"],["spouse-and-partner-visas","Spouse or partner visa"],["family-visas","Family visa"],["settlement","Settlement (ILR)"],["british-citizenship","British citizenship"],["eu-settlement-scheme","EU Settlement Scheme"],["sponsor-licences","Sponsor licence (employer)"],["refusals-and-appeals","Refusal or appeal"],["visitor-visas","Visitor visa"],["talent-and-founder-visas","Global Talent or Innovator Founder"],["other","Something else"]]},{"slug":"family-law","label":"Family law","ew":true,"matters":[["divorce","Divorce"],["civil-partnership-dissolution","Ending a civil partnership"],["financial-settlements","Financial settlement"],["consent-orders","Consent order"],["child-arrangements","Child arrangements"],["cohabitation-disputes","Cohabitation dispute"],["separation-agreements","Separation agreement"],["prenuptial-agreements","Prenuptial agreement"],["other","Something else"]]},{"slug":"debt-recovery","label":"Debt recovery","ew":true,"businessOnly":true,"matters":[["unpaid-invoices","Unpaid invoices"],["letters-before-action","Letter before action"],["court-claims","Court claim"],["enforcement","Enforcing a judgment"],["statutory-demands","Statutory demand"],["winding-up-petitions","Winding up petition"],["late-payment-interest","Late payment interest"],["other","Something else"]]},{"slug":"motoring-offences","label":"Motoring offences","ew":true,"matters":[["speeding","Speeding"],["drink-driving","Drink driving"],["drug-driving","Drug driving"],["careless-driving","Careless driving"],["dangerous-driving","Dangerous driving"],["driving-without-insurance","Driving without insurance"],["mobile-phone","Using a phone while driving"],["failing-to-identify-the-driver","Failing to identify the driver"],["totting-up","Totting up ban"],["exceptional-hardship","Exceptional hardship"],["other-motoring","Another motoring offence"],["other","Something else"]]},{"slug":"licensing","label":"Licensing","ew":true,"matters":[["premises-licence-applications","New premises licence"],["licence-variations","Licence variation"],["transfers-and-dps","Transfer or DPS change"],["personal-licences","Personal licence"],["licence-reviews","Licence review or hearing"],["taxi-and-private-hire-licences","Taxi or private hire licence"],["other-licensing","Another licence"],["other","Something else"]]},{"slug":"lease-extensions","label":"Lease extensions","ew":true,"matters":[["statutory-lease-extension","Statutory lease extension"],["informal-lease-extension","Informal lease extension"],["short-lease","Flat with a short lease"],["collective-enfranchisement","Buying the freehold"],["selling-a-leasehold-flat","Selling a leasehold flat"],["lease-variations","Lease variation"],["other","Something else"]]},{"slug":"trademarks","label":"Trademarks and IP","ew":false,"matters":[["trademark-registration","Trademark registration"],["trademark-searches","Trademark search"],["objections-and-oppositions","Objection or opposition"],["trademark-infringement","Trademark infringement"],["cease-and-desist-letters","Cease and desist letter"],["trademark-renewals","Renewal or ownership change"],["copyright","Copyright"],["design-rights","Design rights"],["other-ip","Another brand or IP matter"],["other","Something else"]]}],"regions":["London","South East","South West","East of England","East Midlands","West Midlands","Yorkshire and the Humber","North West","North East","Wales","Scotland","Northern Ireland","Channel Islands and Isle of Man","Outside the UK"],"urgency":["Urgently","Within a month","In the next few months","Just looking into it"],"audiences":[["individual","Individuals"],["business","Businesses"]],"grades":["A","B","C"],"privatePay":[["yes","Can pay privately"],["quote","Will pay if the cost is right"]],"regulators":[{"id":"SRA","label":"Solicitors Regulation Authority (SRA)","number":"SRA number","areas":["conveyancing","immigration","family-law","debt-recovery","motoring-offences","licensing","lease-extensions","trademarks"]},{"id":"CILEX","label":"CILEx Regulation","number":"CILEx Regulation number","areas":["conveyancing","immigration","family-law","debt-recovery","motoring-offences","licensing","lease-extensions","trademarks"]},{"id":"CLC","label":"Council for Licensed Conveyancers (CLC)","number":"CLC licence number","areas":["conveyancing","lease-extensions"]},{"id":"IAA","label":"Immigration Advice Authority (IAA)","number":"IAA reference","areas":["immigration"]},{"id":"IPREG","label":"Intellectual Property Regulation Board (IPReg)","number":"IPReg registration number","areas":["trademarks"]}],"stages":["new","contacted","consultation","instructed","lost"],"stageLabels":{"new":"New","contacted":"Contacted","consultation":"Consultation","instructed":"Instructed","lost":"Lost"}};
  const areaOf = (s) => TAX.areas.find((a) => a.slug === s) || null;
  const areaLabel = (s) => areaOf(s)?.label || s || '';
  const matterLabel = (a, m) => areaOf(a)?.matters.find(([k]) => k === m)?.[1] || null;
  const regulatorOf = (id) => TAX.regulators.find((r) => r.id === id) || null;
  const allowedAreas = (ids = []) => [...new Set(ids.flatMap((id) => regulatorOf(id)?.areas || []))];
  const regIds = (b) => (Array.isArray(b?.regulators) ? b.regulators : []).map((r) => r?.id).filter(Boolean);
  const canTake = (b, l) => allowedAreas(regIds(b)).includes(l.area);
  const REGISTER = { SRA: 'https://www.sra.org.uk/consumers/register/', CILEX: 'https://cilexregulation.org.uk/', CLC: 'https://www.clc-uk.org/', IAA: 'https://www.gov.uk/find-an-immigration-adviser' };
  const TERMS_VERSION = '2026-11-22';
  const DEFAULT_PRICING = { min: 15, max: 400,
    areas: { conveyancing: 35, immigration: 60, 'family-law': 55, 'debt-recovery': 45, 'motoring-offences': 50, licensing: 55, 'lease-extensions': 60, trademarks: 50 },
    matters: { 'immigration/sponsor-licences': 120, 'family-law/financial-settlements': 75, 'motoring-offences/drink-driving': 70,
      'motoring-offences/dangerous-driving': 80, 'licensing/premises-licence-applications': 70, 'lease-extensions/collective-enfranchisement': 110,
      'trademarks/trademark-infringement': 75, 'trademarks/objections-and-oppositions': 65 },
    grade: { A: 1.3, B: 1, C: 0.7 }, urgent: 1.15, business: 1.1, value: [[1000000, 1.4], [500000, 1.25], [250000, 1.1]] };
  const PRICE_EXAMPLES = [
    { area: 'conveyancing', matter: 'buying-a-home', grade: 'B', urgency: 'Within a month', audience: 'individual', value_min: 250000 },
    { area: 'family-law', matter: 'divorce', grade: 'A', urgency: 'Urgently', audience: 'individual' },
    { area: 'family-law', matter: 'financial-settlements', grade: 'B', urgency: 'In the next few months', audience: 'individual', value_min: 500000 },
    { area: 'motoring-offences', matter: 'drink-driving', grade: 'A', urgency: 'Urgently', audience: 'individual' },
    { area: 'immigration', matter: 'sponsor-licences', grade: 'A', urgency: 'Within a month', audience: 'business' },
    { area: 'debt-recovery', matter: 'unpaid-invoices', grade: 'C', urgency: 'Just looking into it', audience: 'business' },
  ];
  const PACKS = { starter: { name: 'Starter', credits: 2500, pence: 250000, bonus: 0 }, growth: { name: 'Growth', credits: 5000, pence: 500000, bonus: 0 } };
  const TRIAL = { pence: 100000, credits: 1000, then: 'starter' };
  const CUSTOM = { min: 6000, max: 250000, step: 1000, bonus: 0, maxCredits: 20000, contact: 'hello@leaflegal.co' };
  const LOW_CREDITS = 200, RETURN_HOURS = 72, DISCOUNT = { hours: 72, pct: 50 };
  const CANCEL_REASONS = ['Lead quality wasn’t good enough', 'Leads didn’t turn into deals', 'Not enough leads matching my criteria', 'Too expensive', 'Taking a break for now', 'Moving to another lead source', 'Something else'];
  const RETURN_REASONS = [
    { reason: 'Phone number is not in service', kind: 'ok', note: 'If we confirm the number isn’t in service, we’ll refund the lead in full.' },
    { reason: 'Phone number belongs to someone else', kind: 'ok', note: 'If we confirm the number belongs to someone else, we’ll refund the lead in full.' },
    { reason: 'Email address bounces or does not exist', kind: 'ok', note: 'If we confirm the email address doesn’t exist, we’ll refund the lead in full.' },
    { reason: 'Outside the practice area or region stated', kind: 'review', note: 'Tell us what the client told you. We’ll look into it, but a refund isn’t guaranteed.' },
    { reason: 'Duplicate of a lead already bought', kind: 'review', note: 'Tell us the number of the lead you already have. We’ll check it, but a refund isn’t guaranteed.' },
    { reason: 'Something else', kind: 'review', note: 'Tell us what happened. We’ll look into it, but a refund isn’t guaranteed.' },
    { reason: 'They’re no longer interested', kind: 'no', note: 'Sorry, we can’t refund this. Every lead is a real inbound enquiry, but not every client will go ahead. That’s the nature of lead generation.' },
    { reason: 'They decided not to instruct a firm', kind: 'no', note: 'Sorry, we can’t refund this. Plans change after someone enquires, and that’s outside our control.' },
  ];
  const DECLINE = { valid: 'We checked the phone number and email address and both are valid. Refunds are for leads we can’t reach because the contact details are wrong.',
    interest: 'The client is no longer interested.', brief: 'The client has changed what they need or decided not to instruct a firm.', scope: 'We checked the enquiry and the practice area and region match what the client told us.',
    duplicate: 'We checked and this is a separate enquiry, not a copy of a lead you already have.', attempts: 'The contact details look right, so the client may just be busy.', late: 'The request came in after the 72-hour refund window.' };
  const PERMS = { buy: 'Buy leads and request refunds', settings: 'Change auto-buy, delivery, profile and notifications', billing: 'Manage billing, plans and the referral agreement', team: 'Add and remove users' };
  const STAGES = TAX.stages;
  const NO_SEND = 'This is a demo, so nothing is sent or charged. This works once the platform is live.';
  const NO_PAY = 'This is a demo, so no payment is taken and the plan stays as it is. Billing works once the platform is live.';

  // ------------------------------------------------ pricing, masking and matching (same rules as api/_lib/platform.js)
  const num = (v, d) => (Number.isFinite(Number(v)) && v !== null && v !== '' ? Number(v) : d);
  const gbp = (n) => '£' + Number(n || 0).toLocaleString('en-GB');
  const mergePricing = (v) => { const D = DEFAULT_PRICING; if (!v || !v.areas) return D;
    return { ...D, ...v, areas: { ...D.areas, ...v.areas }, matters: { ...(v.matters && typeof v.matters === 'object' ? v.matters : D.matters) }, grade: { ...D.grade, ...(v.grade || {}) }, value: Array.isArray(v.value) ? v.value : D.value }; };
  const priceParts = (l, P = DEFAULT_PRICING) => {
    const base = num(P.matters?.[`${l.area}/${l.matter}`], num(P.areas?.[l.area], 50)), grade = num(P.grade?.[l.grade], 1);
    const urgent = l.urgency === 'Urgently' ? num(P.urgent, 1) : 1, business = l.audience === 'business' ? num(P.business, 1) : 1;
    const vm = Number(l.value_min) || 0, step = (P.value || []).find(([at]) => vm > 0 && vm >= at);
    return { base, grade, urgent, business, value: step ? num(step[1], 1) : 1 };
  };
  const price = (l, P = DEFAULT_PRICING) => { const x = priceParts(l, P), raw = x.base * x.grade * x.urgent * x.business * x.value;
    return Math.min(P.max ?? 400, Math.max(P.min ?? 15, Math.round(raw / 5) * 5)); };
  const discountAt = (l) => new Date(new Date(l.created_at).getTime() + DISCOUNT.hours * 36e5);
  const salePrice = (l) => {
    if (!l.buyer && l.price_fixed) return { price: l.price, list_price: l.list_price > l.price ? l.list_price : null, discounted: l.list_price > l.price };
    if (l.buyer || Date.now() < discountAt(l).getTime()) return { price: l.price, list_price: null, discounted: false };
    return { price: Math.max(1, Math.ceil(l.price * (100 - DISCOUNT.pct) / 100)), list_price: l.price, discounted: true };
  };
  const stars = (n) => '*'.repeat(Math.max(3, Math.min(n, 8)));
  const maskContact = (l) => {
    const name = String(l.full_name || '').trim().split(/\s+/).filter(Boolean).map((w, i) => (i ? '' : w[0].toUpperCase()) + stars(w.length - (i ? 0 : 1))).join(' ');
    const [local = '', domain = ''] = String(l.email || '').toLowerCase().split('@'), dot = domain.indexOf('.');
    const email = local && domain ? `${local[0]}${stars(local.length - 1)}@${stars(dot)}${domain.slice(dot)}` : '';
    const ph = String(l.phone || '').replace(/\s/g, ''), phone = ph.length > 6 ? `${ph.slice(0, 4)}${'*'.repeat(ph.length - 6)}${ph.slice(-2)}` : '';
    const c = l.checks || {};
    return { name, email, phone, phoneValid: /^\+447\d{9}$/.test(ph), emailChecked: !!email, phoneLive: c.phone?.reachable === true, emailVerified: c.email?.result === 'valid' };
  };
  const CH_TYPES = { ltd: 'Private limited company', llp: 'Limited liability partnership' };
  const companyInfo = (c, full) => { if (!c?.number) return null; const p = c.profile || {};
    const info = { source: 'Companies House', type: CH_TYPES[c.type] || c.type || null, status: c.status || null, incorporated: full ? c.incorporated || null : c.incorporated?.slice(0, 4) || null,
      locality: p.locality || null, industries: p.industries || [], accounts_overdue: !!p.accounts_overdue, confirmation_overdue: !!p.confirmation_overdue, insolvency_history: !!p.insolvency_history, checked: !!c.profile };
    return full ? { ...info, name: p.title || null, number: c.number, address: c.address || null, sic: p.sic || [], url: `https://find-and-update.company-information.service.gov.uk/company/${c.number}` } : info; };
  const PREVIEW = 'id,created_at,area,area_label,matter,matter_label,audience,urgency,deadline,postcode_district,postcode_area,region,country,location_source,value_band,value_label,value_min,value_max,private_pay,answers,tags,grade,score,price,list_price,price_fixed'.split(',');
  const pick = (o, keys) => Object.fromEntries(keys.map((k) => [k, o[k] ?? null]));
  const withMask = (l, trusted = true) => { const rest = pick(l, PREVIEW);
    return { ...rest, ...salePrice(rest), has_summary: !!l.summary, discount_at: rest.price_fixed ? null : discountAt(rest).toISOString(),
      contact: trusted ? maskContact(l) : null, companies_house: trusted && l.audience === 'business' ? companyInfo(l.company, false) : null }; };
  const matterName = (l) => l.matter_label || matterLabel(l.area, l.matter) || l.area_label || areaLabel(l.area) || 'Legal enquiry';
  const areaName = (l) => l.area_label || areaLabel(l.area) || 'Legal enquiry';
  const leadOut = (l) => ({
    id: l.id, received_at: l.created_at, purchased_at: l.bought_at || null, auto_bought: !!l.auto, price_credits: l.price,
    practice_area: l.area || null, practice_area_label: areaName(l), matter: l.matter || null, matter_label: matterName(l),
    audience: l.audience || null, urgency: l.urgency || null, deadline: l.deadline || null,
    contact_name: l.full_name || null, email: l.email || null, phone: l.phone || null, postcode: l.postcode || null, region: l.region || null,
    business_name: l.business_name || null, company_number: l.company_number || l.company?.number || null,
    value_band: l.value_band || null, value_label: l.value_label || null, private_pay: l.private_pay || null,
    grade: l.grade || null, quality_score: Number.isFinite(l.score) ? l.score : null, tags: l.tags || [], summary: l.summary || null, answers: l.answers || [],
    consent: l.consent ? { version: l.consent.version || null, at: l.consent.at || null, text: l.consent.text || null } : null,
    stage: l.stage || 'new', stage_at: l.stage_at || null, instructed_value: l.instructed_value ?? null, archived_at: l.archived_at || null });
  const list = (v) => (Array.isArray(v) ? v : []);
  const AUD = Object.fromEntries(TAX.audiences);
  function missGroups(f, l) {
    f = f || {}; const out = [], aName = areaName(l), mName = matterName(l);
    if (!list(f.areas).includes(l.area)) out.push({ k: 'areas', v: l.area, label: aName, why: `${aName} is not one of the practice areas selected` });
    else { const ms = list(f.matters?.[l.area]); if (ms.length && !ms.includes(l.matter)) out.push({ k: 'matters', v: `${l.area}/${l.matter}`, label: `${mName} (${aName})`, why: `${mName} is not one of the ${aName.toLowerCase()} matters selected` }); }
    if (list(f.regions).length && !list(f.regions).includes(l.region)) out.push({ k: 'regions', v: l.region || '', label: l.region || 'No region given', why: l.region ? `${l.region} is outside the regions selected` : 'The enquiry has no region' });
    if (list(f.postcodeAreas).length && !list(f.postcodeAreas).includes(l.postcode_area)) out.push({ k: 'postcodeAreas', v: l.postcode_area || '', label: l.postcode_area ? `Postcode area ${l.postcode_area}` : 'No postcode given', why: l.postcode_area ? `Postcode area ${l.postcode_area} is outside the postcode areas selected` : 'The enquiry has no postcode' });
    if (list(f.audiences).length && !list(f.audiences).includes(l.audience)) { const a = AUD[l.audience] || 'Unknown client type'; out.push({ k: 'audiences', v: l.audience || '', label: a, why: `${a} are not selected` }); }
    if (list(f.urgencies).length && !list(f.urgencies).includes(l.urgency)) out.push({ k: 'urgencies', v: l.urgency || '', label: l.urgency ? `Needed ${l.urgency.toLowerCase()}` : 'No urgency given', why: l.urgency ? `Urgency ${l.urgency.toLowerCase()} is not selected` : 'The enquiry has no urgency' });
    if (list(f.grades).length && !list(f.grades).includes(l.grade)) out.push({ k: 'grades', v: l.grade || '', label: l.grade ? `Grade ${l.grade} leads` : 'Ungraded leads', why: l.grade ? `Grade ${l.grade} is not selected` : 'The lead has no grade' });
    if (f.privatePayOnly && l.private_pay === 'quote') out.push({ k: 'privatePayOnly', v: false, label: 'Will pay if the cost is right', why: 'The client will only pay privately if the cost is right' });
    const has = l.value_min != null || l.value_max != null, top = l.value_max ?? l.value_min, bottom = l.value_min ?? l.value_max;
    if (f.valueMin && has && top < f.valueMin) out.push({ k: 'valueMin', label: `Value under ${gbp(f.valueMin)}`, why: `${l.value_band || gbp(top)} is below the ${gbp(f.valueMin)} minimum value` });
    if (f.valueMax && has && bottom > f.valueMax) out.push({ k: 'valueMax', label: `Value over ${gbp(f.valueMax)}`, why: `${l.value_band || gbp(bottom)} is above the ${gbp(f.valueMax)} maximum value` });
    const tags = list(l.tags);
    if (list(f.tagsAny).length && !list(f.tagsAny).some((t) => tags.includes(t))) out.push({ k: 'tagsAny', v: '', label: 'Without the tags required', why: `None of the tags required (${list(f.tagsAny).join(', ')})` });
    for (const t of list(f.tagsNone).filter((x) => tags.includes(x))) out.push({ k: 'tagsNone', v: t, label: `Tagged ${t}`, why: `Tagged ${t}, which is excluded` });
    return out;
  }
  const matches = (f, l) => !missGroups(f, l).length;
  const fits = (b, l) => canTake(b, l) && matches(b?.filters || {}, l);

  // ------------------------------------------------ sample data
  const NOW = Date.now(), H = 36e5, D = 864e5;
  const iso = (msAgo) => new Date(NOW - msAgo).toISOString();
  const dayAhead = (d) => new Date(NOW + d * D).toISOString().slice(0, 10);
  const FIRM = '3f6a8b2c-4d01-4c55-9e10-6a1f0c3e2b7d', ADMIN = 'a0d1e2f3-7a10-4b2c-8d3e-0000000000ad', BRIGHT = 'b7c1d2e3-1f20-4a3b-9c4d-5e6f7a8b9c01',
    MERID = 'c4e5f6a7-2b31-4c4d-8e5f-6a7b8c9d0e02', ASHBY = 'd1e2f3a4-3c42-4d5e-9f60-7b8c9d0e1f03', NORTH = 'e8f9a0b1-4d53-4e6f-8a71-8c9d0e1f2a04', KEST = 'f5a6b7c8-5e64-4f70-9b82-9d0e1f2a3b05';
  const PROFILE_SHOW = { person: true, website: true, phone: true, whatsapp: true, sms: true, email: true };
  const firm = (o) => ({ company_number: null, address: null, signer_title: null, regulator_checked_at: null, approved: true, credits: 0, mode: 'manual', monthly_cap: 0,
    filters: { areas: [], matters: {}, regions: [], postcodeAreas: [], audiences: [], urgencies: [], grades: [], privatePayOnly: false, valueMin: null, valueMax: null, tagsAny: [], tagsNone: [], dailyLeads: null, dailyCredits: null, maxPrice: null, suggest: 'instant', missed: 'on' },
    is_admin: false, suspended_at: null, suspend_reason: null, plan: null, stripe_customer: null, email_verified_at: iso(100 * D), onboarded_at: iso(100 * D), notify: true, notify_emails: null,
    deliver_on: true, deliver_emails: null, webhook_on: false, webhook_urls: [], webhook_url: null, webhook_secret: null, hubspot: null, pipedrive: null, leads_exported_at: null,
    trial_used: true, profile: null, backlog_at: null, last_auto_at: null, ...o });
  const F = (areas, regions, extra = {}) => ({ ...firm({}).filters, areas, regions, ...extra });
  const FIRMS = () => [
    firm({ id: FIRM, email: 'eleanor.harper@example.com', company: 'Harper & Lowe Solicitors LLP', company_number: 'OC000123', address: '1 Example Street, London EC1A 1AA',
      contact_name: 'Eleanor Harper', signer_title: 'Managing Partner', phone: '020 7946 0123', regulators: [{ id: 'SRA', number: '654321' }], regulator_checked_at: iso(118 * D),
      credits: 1250, mode: 'auto', monthly_cap: 3000, filters: F(['conveyancing', 'family-law', 'lease-extensions'], ['London', 'South East'], { maxPrice: 200 }),
      created_at: iso(120 * D), email_verified_at: iso(120 * D), onboarded_at: iso(119 * D), stripe_customer: 'cus_demo_harper', notify_emails: 'eleanor.harper@example.com, intake@example.com',
      deliver_emails: 'intake@example.com', last_auto_at: iso(4 * D),
      profile: { name: 'Harper & Lowe Solicitors', person: 'Eleanor Harper', role: 'Managing Partner', about: 'Residential property and family law team in central London and Surrey. Fixed fee quotes on request.',
        website: 'https://www.example.com/', phone: '020 7946 0123', whatsapp: '', sms: '', email: 'enquiries@example.com', logo: '', logoW: 0, logoH: 0, show: { ...PROFILE_SHOW } } }),
    firm({ id: ADMIN, email: 'admin@example.com', company: 'Leaflegal', contact_name: 'Demo Admin', is_admin: true, credits: 5000, regulators: [], created_at: iso(200 * D), trial_used: false }),
    firm({ id: BRIGHT, email: 'marcus.webb@example.com', company: 'Brightwater Conveyancing Ltd', company_number: '00000456', address: '22 Sample Road, Manchester M2 1AA', contact_name: 'Marcus Webb',
      signer_title: 'Director', phone: '0161 496 0456', regulators: [{ id: 'CLC', number: '10234' }], regulator_checked_at: iso(85 * D), credits: 640, mode: 'auto', monthly_cap: 2000,
      filters: F(['conveyancing', 'lease-extensions'], ['North West', 'Yorkshire and the Humber', 'West Midlands']), created_at: iso(90 * D), stripe_customer: 'cus_demo_bright',
      profile: { name: 'Brightwater Conveyancing', person: 'Marcus Webb', role: 'Director', about: 'Licensed conveyancers for the North West.', website: 'https://www.example.org/', phone: '0161 496 0456', whatsapp: '', sms: '', email: 'hello@example.org', logo: '', logoW: 0, logoH: 0, show: { ...PROFILE_SHOW } } }),
    firm({ id: MERID, email: 'anika.rao@example.com', company: 'Meridian Immigration Advisers', address: '5 Demo Court, Birmingham B3 2AA', contact_name: 'Anika Rao', signer_title: 'Principal Adviser',
      phone: '0121 496 0789', regulators: [{ id: 'IAA', number: 'F202300123' }], regulator_checked_at: iso(40 * D), credits: 300, filters: F(['immigration'], []), created_at: iso(45 * D), stripe_customer: 'cus_demo_meridian' }),
    firm({ id: ASHBY, email: 'olivia.ashby@example.com', company: 'Ashby & Cole Family Solicitors', address: '9 Placeholder Lane, Leeds LS2 7AA', contact_name: 'Olivia Ashby', signer_title: 'Partner',
      phone: '0113 496 0321', regulators: [{ id: 'SRA', number: '700111' }], approved: false, onboarded_at: null, created_at: iso(26 * H), email_verified_at: iso(25 * H), trial_used: false,
      filters: F(['family-law'], ['Yorkshire and the Humber']) }),
    firm({ id: NORTH, email: 'daniel.north@example.com', company: 'Northgate Legal LLP', company_number: 'OC000789', address: '40 Sample Square, Newcastle NE1 1AA', contact_name: 'Daniel North',
      signer_title: 'Partner', phone: '0191 498 0654', regulators: [{ id: 'CILEX', number: '7701234' }], regulator_checked_at: iso(60 * D), credits: 1480, mode: 'auto', monthly_cap: 2000,
      filters: F(['conveyancing', 'motoring-offences', 'debt-recovery'], ['North East', 'Yorkshire and the Humber']), created_at: iso(70 * D),
      plan: { name: 'Invoiced 2,000', credits: 2000, price: 2000, started_at: iso(62 * D), next_at: new Date(NOW + 28 * D).toISOString() } }),
    firm({ id: KEST, email: 'ruth.kestrel@example.com', company: 'Kestrel Motoring Defence', contact_name: 'Ruth Kestrel', signer_title: 'Solicitor Director', phone: '0191 498 0987',
      regulators: [{ id: 'SRA', number: '612345' }], regulator_checked_at: iso(30 * D), credits: 0, mode: 'auto', filters: F(['motoring-offences'], []), created_at: iso(33 * D),
      plan: { name: 'Commission', credits: 0, price: 0, commission: true, started_at: iso(30 * D), next_at: new Date(NOW + 30 * D).toISOString() } }),
  ];

  // One enquiry. pc: full postcode (null for abroad). v: [band, label, min, max]. buy: [firm, ms ago, auto, stage, stage ms ago, instructed value].
  const LEADS = [
    { id: 2041, ago: 21 * D, area: 'conveyancing', matter: 'buying-a-home', urgency: 'Within a month', pc: 'SW11 4NP', region: 'London', v: ['£400k to £500k', 'Property price', 400000, 500000], pay: 'yes', grade: 'A', score: 88,
      tags: ['mortgage agreed', 'chain'], name: 'Alex Sample', ph: '101', ch: 'Google search', buy: [FIRM, 21 * D - 4 * 6e4, true, 'instructed', 12 * D, 1850],
      summary: 'We have had an offer accepted on a two bed flat and need a conveyancer who can start this week. The estate agent wants our conveyancer’s details by Friday.',
      qa: [['Where is the property?', 'Battersea, London SW11'], ['What price has been agreed?', '£465,000'], ['Is it freehold or leasehold?', 'Leasehold flat with 112 years left on the lease'], ['Are you buying with a mortgage?', 'Yes, mortgage offer received'], ['Is there a chain?', 'One buyer below us, no onward chain'], ['When do you hope to complete?', 'Within 8 weeks']] },
    { id: 2042, ago: 10 * D, area: 'family-law', matter: 'divorce', urgency: 'Within a month', pc: 'GU1 3AA', region: 'South East', pay: 'yes', grade: 'A', score: 84, tags: ['children', 'property'],
      name: 'Jordan Example', ph: '102', ch: 'Meta ads', buy: [FIRM, 10 * D - 3 * H, false, 'consultation', 6 * D],
      summary: 'Married eleven years and we have agreed to separate. I want to start the divorce properly and make sure the house and the children are sorted fairly.',
      qa: [['Has either of you applied for a divorce yet?', 'No, not yet'], ['How long have you been married?', '11 years'], ['Are there children under 18?', 'Yes, two children aged 7 and 10'], ['Do you own property together?', 'Yes, the family home in joint names'], ['Have you agreed arrangements for the children?', 'Mostly, we would like it in writing'], ['Is anyone at risk of harm?', 'No']] },
    { id: 2043, ago: 6 * D, area: 'lease-extensions', matter: 'statutory-lease-extension', urgency: 'In the next few months', pc: 'N1 2XY', region: 'London', v: ['£250k to £500k', 'Flat value', 250000, 500000], pay: 'yes', grade: 'B', score: 72,
      tags: ['short lease'], name: 'Priya Placeholder', ph: '103', ch: 'Google search', buy: [FIRM, 6 * D - 2 * 6e4, true, 'contacted', 4 * D],
      summary: 'My lease is getting shorter and I have been told it will be harder to sell or remortgage below 80 years. I would like to extend it before that happens.',
      qa: [['How many years are left on the lease?', '74 years'], ['Have you owned the flat for at least two years?', 'Yes, since 2019'], ['Do you know who the freeholder is?', 'Yes, a property management company'], ['Have you had a valuation?', 'Not yet'], ['Are you planning to sell soon?', 'Possibly next year']] },
    { id: 2044, ago: 22 * H, area: 'family-law', matter: 'financial-settlements', urgency: 'Within a month', pc: 'SE22 8AA', region: 'London', v: ['£500k to £1m', 'Assets', 500000, 1000000], pay: 'yes', grade: 'A', score: 90,
      tags: ['pension', 'business assets'], name: 'Sam Mockford', ph: '104', ch: 'Meta ads', buy: [FIRM, 20 * H, false, 'new'],
      summary: 'We separated last year and the divorce is under way. My spouse owns shares in a company and we both have pensions, so I need help reaching a fair financial agreement.',
      qa: [['Have you separated?', 'Yes, eight months ago'], ['Has a divorce application been made?', 'Yes, waiting for the conditional order'], ['What are the main assets?', 'The house, two pensions and my spouse’s company shares'], ['Have you tried mediation?', 'One session, it did not reach agreement'], ['Have you started financial disclosure?', 'Partly completed'], ['What would you like to happen?', 'A fair split agreed without going to court if possible']] },
    { id: 2045, ago: 15 * D, area: 'conveyancing', matter: 'selling-a-home', urgency: 'Within a month', pc: 'BN1 6AA', region: 'South East', v: ['£250k to £500k', 'Property price', 250000, 500000], pay: 'quote', grade: 'B', score: 64,
      tags: [], name: 'Casey Specimen', ph: '105', ch: 'Direct or unknown', buy: [FIRM, 15 * D - 5 * 6e4, true, 'lost', 9 * D],
      summary: 'Selling my house in Brighton and moving into rented for a while. The buyer is a first time buyer and wants to move quickly.',
      qa: [['Have you accepted an offer?', 'Yes, from a first time buyer'], ['Is it freehold or leasehold?', 'Freehold house'], ['Is there a mortgage to pay off?', 'Yes'], ['Are you buying another home at the same time?', 'No, moving into rented'], ['When do you need to complete?', 'As soon as possible']] },
    { id: 2046, ago: 4 * D, area: 'lease-extensions', matter: 'collective-enfranchisement', urgency: 'In the next few months', pc: 'W9 1AB', region: 'London', v: ['£1m+', 'Building value', 1000000, null], pay: 'yes', grade: 'A', score: 86,
      tags: ['freehold', 'group of leaseholders'], name: 'Robin Testcase', ph: '106', ch: 'Google search', buy: [FIRM, 4 * D - 3 * 6e4, true, 'consultation', 1 * D],
      summary: 'Six of us in an eight flat building want to buy the freehold together. The freeholder lives abroad and repairs take months, so we want to take control.',
      qa: [['How many flats are in the building?', '8 flats'], ['How many leaseholders want to take part?', '6 of the 8'], ['Is there commercial space in the building?', 'No, residential only'], ['Have the leaseholders formed a company yet?', 'No'], ['Has a surveyor valued the freehold?', 'We have an informal estimate'], ['Who is the freeholder?', 'A private landlord based abroad']] },
    { id: 2047, ago: 5 * D, area: 'immigration', matter: 'spouse-and-partner-visas', urgency: 'Within a month', pc: 'B15 2TT', region: 'West Midlands', pay: 'yes', grade: 'B', score: 70, tags: ['applying from abroad'],
      name: 'Morgan Demo', ph: '107', ch: 'Meta ads', buy: [MERID, 4 * D, false, 'contacted', 3 * D],
      summary: 'My wife is overseas and we want her to join me in Birmingham. I would like help getting the application right first time.',
      qa: [['Where is your partner now?', 'Outside the UK'], ['Are you married or in a civil partnership?', 'Married since last year'], ['Do you meet the income requirement?', 'I think so, my salary is £34,000'], ['Has a UK visa been refused before?', 'No'], ['When would you like to apply?', 'Within the next month']] },
    { id: 2048, ago: 3 * D, area: 'conveyancing', matter: 'remortgaging', urgency: 'In the next few months', pc: 'M20 2AA', region: 'North West', v: ['£250k to £500k', 'Property price', 250000, 500000], pay: 'yes', grade: 'B', score: 66,
      tags: [], name: 'Taylor Notreal', ph: '108', ch: 'Google search', buy: [BRIGHT, 2 * D, true, 'new'], checks: 'unknown',
      summary: 'Remortgaging with a new lender as my fixed rate ends soon. My broker has asked me to choose a conveyancer.',
      qa: [['Is the property in your sole name?', 'Yes'], ['Have you chosen a new lender?', 'Yes, product chosen through a broker'], ['Are you adding or removing anyone from the title?', 'No'], ['When does your current deal end?', 'In about three months']] },
    { id: 2049, ago: 2 * D, area: 'motoring-offences', matter: 'drink-driving', urgency: 'Urgently', deadline: 9, pc: 'NE1 4ST', region: 'North East', pay: 'yes', grade: 'A', score: 82,
      tags: ['court date', 'first offence'], name: 'Jamie Example', ph: '109', ch: 'Meta ads', buy: [KEST, 2 * D - 2 * H, false, 'contacted', 1 * D], free: true,
      summary: 'I have a court date next week and I need to keep driving for work if at all possible. I want to understand my options before the hearing.',
      qa: [['Have you been charged?', 'Yes, a postal requisition arrived'], ['When is your court date?', 'In about nine days'], ['What was the reading?', '52 in breath'], ['Do you need to drive for work?', 'Yes, I am a field engineer'], ['Do you have previous convictions?', 'None'], ['How do you plan to plead?', 'Not decided yet']] },
    { id: 2050, ago: 2 * H, area: 'conveyancing', matter: 'first-time-buyers', urgency: 'Within a month', pc: 'E14 7HG', region: 'London', v: ['£250k to £500k', 'Property price', 250000, 500000], pay: 'yes', grade: 'A', score: 91,
      tags: ['mortgage agreed', 'lifetime isa'], name: 'Riley Sample', ph: '110', ch: 'Meta ads', summary: 'First home, offer accepted yesterday on a one bed flat in Canary Wharf. Looking for a conveyancer who can move quickly and explain each step.',
      qa: [['Have you had an offer accepted?', 'Yes, yesterday'], ['Is it freehold or leasehold?', 'Leasehold flat with a 125 year lease'], ['Are you using a Lifetime ISA?', 'Yes'], ['Do you have a mortgage in principle?', 'Yes'], ['Is it a new build?', 'No, built in 2010'], ['When do you want to complete?', 'Within 10 weeks']] },
    { id: 2051, ago: 35 * 6e4, area: 'family-law', matter: 'child-arrangements', urgency: 'Urgently', deadline: 12, pc: 'RG1 8DN', region: 'South East', pay: 'quote', grade: 'A', score: 85,
      tags: ['hearing date', 'children'], name: 'Charlie Placeholder', ph: '111', ch: 'Google search', summary: 'There is a first court hearing in under two weeks about where my daughter lives. I want someone to help me prepare and to come to the hearing if needed.',
      qa: [['How many children are involved?', 'One, aged 5'], ['Is there a court hearing booked?', 'Yes, a first hearing in under two weeks'], ['Have you been to a mediation meeting (MIAM)?', 'Yes, last month'], ['What is the current arrangement?', 'She lives with me and sees her other parent every other weekend'], ['What would you like to change?', 'A written arrangement both sides stick to'], ['Are there any safeguarding concerns?', 'No']] },
    { id: 2052, ago: 5 * H, area: 'lease-extensions', matter: 'short-lease', urgency: 'In the next few months', pc: 'SE1 7PB', region: 'London', v: ['£250k to £500k', 'Flat value', 250000, 500000], pay: 'yes', grade: 'B', score: 74,
      tags: ['short lease', 'selling'], name: 'Ash Mockley', ph: '112', ch: 'Direct or unknown', summary: 'Trying to sell my flat but the buyer’s lender wants a longer lease first. Need to know what to do and how long it takes.',
      qa: [['How many years are left on the lease?', '68 years'], ['What is the ground rent?', '£250 a year, doubling every 25 years'], ['Have you owned the flat for at least two years?', 'Yes'], ['Are you planning to sell?', 'Yes, I have a buyer waiting'], ['Do you know who the freeholder is?', 'Yes, a housing association']] },
    { id: 2053, ago: 26 * H, area: 'immigration', matter: 'work-visas', urgency: 'In the next few months', pc: null, region: 'Outside the UK', pay: 'yes', grade: 'B', score: 68, tags: ['skilled worker'],
      name: 'Dev Example', ph: '113', ch: 'Meta ads', summary: 'I have a job offer from a UK software company and want help with the Skilled Worker visa so I can start in spring.',
      qa: [['Do you have a job offer?', 'Yes, from a UK software company'], ['Is the employer a licensed sponsor?', 'They say they are'], ['What is the salary?', '£48,000'], ['How will you meet the English language requirement?', 'My degree was taught in English'], ['When do you want to start?', 'In three months']] },
    { id: 2054, ago: 80 * H, area: 'immigration', matter: 'sponsor-licences', urgency: 'Within a month', pc: 'EC2A 4NE', region: 'London', aud: 'business', pay: 'yes', grade: 'A', score: 89,
      tags: ['employer', 'first licence'], name: 'Morgan Specimen', ph: '114', ch: 'Google search', biz: ['Example Robotics Ltd', '00001234', 'ltd', '2018-05-14', 'London', ['Information and communication']],
      summary: 'We are a growing robotics company and want to hire three engineers from overseas. We have never held a sponsor licence.',
      qa: [['How many overseas workers do you want to sponsor?', 'Three to start with'], ['Have you held a sponsor licence before?', 'No'], ['What roles are they for?', 'Software and hardware engineers'], ['Do you have HR systems in place?', 'Yes, we use an HR platform'], ['How many staff do you have?', '24']] },
    { id: 2055, ago: 2 * D, area: 'debt-recovery', matter: 'unpaid-invoices', urgency: 'Within a month', pc: 'B1 1AA', region: 'West Midlands', aud: 'business', v: ['£10k to £50k', 'Amount owed', 10000, 50000], pay: 'yes', grade: 'B', score: 71,
      tags: ['b2b'], name: 'Lee Example', ph: '115', ch: 'Google search', biz: ['Sample Fabrications Ltd', '00002345', 'ltd', '2011-09-02', 'Birmingham', ['Manufacturing']],
      summary: 'A customer owes us £18,400 across four invoices and keeps promising to pay. We want to recover it without losing too much time.',
      qa: [['How much is owed?', '£18,400 over four invoices'], ['How old are the invoices?', '60 to 120 days'], ['Has the customer disputed the debt?', 'No, they keep promising to pay'], ['Do you have a written contract?', 'Yes, signed terms of business'], ['Is the customer still trading?', 'Yes']] },
    { id: 2056, ago: 4 * D, area: 'debt-recovery', matter: 'statutory-demands', urgency: 'Urgently', pc: 'M1 3BE', region: 'North West', aud: 'business', v: ['£50k to £100k', 'Amount owed', 50000, 100000], pay: 'yes', grade: 'B', score: 69,
      tags: ['b2b', 'personal guarantee'], name: 'Toni Demo', ph: '116', ch: 'Direct or unknown', biz: ['Example Logistics Ltd', '00003456', 'ltd', '2015-02-20', 'Manchester', ['Transport and storage']],
      summary: 'A haulage customer owes us £62,000 and has admitted it in writing. The director gave a personal guarantee and we want to move quickly.',
      qa: [['How much is owed?', '£62,000'], ['Has the debtor admitted the debt?', 'Yes, in emails'], ['Have you sent a letter before action?', 'Yes, three weeks ago'], ['Is the debtor a company or an individual?', 'A limited company'], ['Is there any security or guarantee?', 'The director signed a personal guarantee']] },
    { id: 2057, ago: 6 * H, area: 'motoring-offences', matter: 'speeding', urgency: 'Within a month', deadline: 20, pc: 'LS1 4AP', region: 'Yorkshire and the Humber', pay: 'quote', grade: 'C', score: 52,
      tags: ['totting up risk'], name: 'Frankie Testwood', ph: '117', ch: 'Meta ads', summary: 'Caught at 48 in a 30 and I already have 6 points. Worried about losing my licence.',
      qa: [['How fast were you going?', '48 in a 30 zone'], ['How many points do you have now?', '6'], ['Do you have a court date?', 'The letter says around three weeks'], ['Do you need to drive?', 'Yes, for the school run and for work'], ['Have you replied to the notice?', 'Yes, I named myself as the driver']] },
    { id: 2058, ago: 20 * H, area: 'motoring-offences', matter: 'dangerous-driving', urgency: 'Urgently', deadline: 16, pc: 'CB1 2JD', region: 'East of England', pay: 'yes', grade: 'B', score: 73,
      tags: ['court date'], name: 'Lee Sample', ph: '118', ch: 'Google search', summary: 'I have been charged after an incident on the A14. Nobody was hurt. I need representation at the first hearing.',
      qa: [['What have you been charged with?', 'Dangerous driving'], ['Was anyone injured?', 'No'], ['When is the first hearing?', 'In just over two weeks'], ['Were you interviewed by the police?', 'Yes, without a solicitor'], ['Do you hold a full licence?', 'Yes, for 15 years with no points']] },
    { id: 2059, ago: 2 * D, area: 'licensing', matter: 'premises-licence-applications', urgency: 'Within a month', pc: 'E8 3PH', region: 'London', aud: 'business', pay: 'yes', grade: 'A', score: 87,
      tags: ['new venue', 'late hours'], name: 'Jesse Placeholder', ph: '119', ch: 'Google search', biz: ['Example Coffee House Ltd', '00004567', 'ltd', '2021-07-01', 'London', ['Hospitality and food']],
      summary: 'We are opening a café bar in Hackney and want to serve alcohol until 11pm with some live music.',
      qa: [['What kind of premises is it?', 'Café by day, small bar in the evening'], ['What hours do you want?', 'Alcohol until 11pm, open until 11.30pm'], ['Do you want regulated entertainment?', 'Yes, acoustic live music'], ['Is the venue in a cumulative impact area?', 'We are not sure'], ['When do you plan to open?', 'In about two months']] },
    { id: 2060, ago: 5 * D, area: 'licensing', matter: 'personal-licences', urgency: 'Just looking into it', pc: 'BS1 5TR', region: 'South West', pay: 'quote', grade: 'C', score: 49, tags: [],
      name: 'Robin Example', ph: '120', ch: 'Direct or unknown', summary: 'Thinking about applying for a personal licence so I can become the DPS at the pub where I work.',
      qa: [['Have you done the licensing qualification?', 'Not yet'], ['Do you have unspent convictions?', 'No'], ['Which council area do you live in?', 'Bristol'], ['When do you need the licence?', 'No fixed date']] },
    { id: 2061, ago: 30 * H, area: 'conveyancing', matter: 'buy-to-let', urgency: 'In the next few months', pc: 'M14 5AA', region: 'North West', v: ['£100k to £250k', 'Property price', 100000, 250000], pay: 'yes', grade: 'B', score: 70,
      tags: ['landlord'], name: 'Pat Specimen', ph: '121', ch: 'Google search', summary: 'Buying my second rental property near the university. Buying in my own name with a buy to let mortgage.',
      qa: [['Are you buying in your own name or a company?', 'My own name'], ['What is the price?', '£185,000'], ['Is it freehold or leasehold?', 'Freehold terrace'], ['Will there be tenants in place?', 'No, it will be empty'], ['Do you have a mortgage offer?', 'Agreement in principle only']] },
    { id: 2062, ago: 4 * D, area: 'family-law', matter: 'prenuptial-agreements', urgency: 'In the next few months', pc: 'OX4 1AA', region: 'South East', pay: 'yes', grade: 'C', score: 55,
      tags: ['wedding date'], name: 'Kai Placeholder', ph: '122', ch: 'Meta ads', summary: 'Getting married next summer and we would like a prenup because I own a house from before we met.',
      qa: [['When is the wedding?', 'Next summer'], ['What do you want the agreement to cover?', 'The house I owned before we met'], ['Has your partner agreed to a prenup?', 'Yes'], ['Will your partner get their own advice?', 'Yes, they plan to']] },
    { id: 2063, ago: 10 * D, area: 'conveyancing', matter: 'transfer-of-equity', urgency: 'Just looking into it', pc: 'CF10 1AA', region: 'Wales', v: ['£100k to £250k', 'Property price', 100000, 250000], pay: 'yes', grade: 'B', score: 63,
      tags: [], name: 'Rhys Example', ph: '123', ch: 'Direct or unknown', summary: 'I want to add my partner to the deeds of my flat now that we live together.',
      qa: [['What do you want to change?', 'Add my partner to the title'], ['Is there a mortgage?', 'Yes, the lender knows'], ['Is any money changing hands?', 'No'], ['When would you like it done?', 'No rush']] },
    { id: 2064, ago: 12 * H, area: 'lease-extensions', matter: 'informal-lease-extension', urgency: 'In the next few months', pc: 'TN1 1AA', region: 'South East', v: ['£250k to £500k', 'Flat value', 250000, 500000], pay: 'yes', grade: 'B', score: 76,
      tags: ['short lease'], name: 'Morgan Testcase', ph: '124', ch: 'Google search', summary: 'The freeholder has offered an informal lease extension and I want someone to check whether the terms are sensible.',
      qa: [['How many years are left?', '79 years'], ['Has the freeholder made an offer?', 'Yes, 99 years added for a premium'], ['Does the offer change the ground rent?', 'Yes, it would go up'], ['Have you had a valuation?', 'No'], ['Have you owned the flat for two years?', 'Yes']] },
    { id: 2065, ago: 2 * D, area: 'family-law', matter: 'divorce', urgency: 'Within a month', pc: 'NG1 5AA', region: 'East Midlands', pay: 'yes', grade: 'B', score: 67, tags: [],
      name: 'Alex Notreal', ph: '125', ch: 'Meta ads', summary: 'We separated two years ago and both want a straightforward divorce. No children and nothing much to divide.',
      qa: [['Has either of you applied for a divorce yet?', 'No'], ['How long have you been separated?', 'Two years'], ['Are there children under 18?', 'No'], ['Is there property or savings to divide?', 'No, we rent separately'], ['Does your spouse agree to the divorce?', 'Yes']] },
    { id: 2066, ago: 7 * D, area: 'immigration', matter: 'british-citizenship', urgency: 'In the next few months', pc: 'CV1 2AA', region: 'West Midlands', pay: 'yes', grade: 'B', score: 72, tags: ['settled status'],
      name: 'Sasha Demo', ph: '126', ch: 'Google search', summary: 'I have had settled status for over a year and want to apply for British citizenship.',
      qa: [['What status do you hold now?', 'Settled status under the EU Settlement Scheme'], ['How long have you held it?', 'Just over a year'], ['Have you passed the Life in the UK test?', 'Yes'], ['Have you spent long periods outside the UK?', 'No'], ['Any criminal convictions?', 'No']] },
    { id: 2067, ago: 3 * D, area: 'conveyancing', matter: 'buying-a-home', urgency: 'Within a month', pc: 'KT1 1AA', region: 'London', v: ['£500k to £1m', 'Property price', 500000, 1000000], pay: 'yes', grade: 'C', score: 38,
      tags: [], name: 'Quinn Specimen', ph: '127', ch: 'Meta ads', hidden: ['phone not in service'], checks: 'bad', summary: 'Buying a house.',
      qa: [['What price has been agreed?', '£600,000'], ['Is it freehold or leasehold?', 'Freehold'], ['Are you buying with a mortgage?', 'Yes'], ['When do you hope to complete?', 'Soon']] },
    { id: 2068, ago: 26 * H, area: 'trademarks', matter: 'trademark-registration', urgency: 'Within a month', pc: 'M1 4BT', region: 'North West', aud: 'business', pay: 'quote', grade: 'B', score: 74,
      tags: ['brand launch'], name: 'Avery Example', ph: '128', ch: 'Google search', biz: ['Example Coffee Roasters Ltd', '00005678', 'ltd', '2023-02-01', 'Manchester', ['Manufacture of food products']],
      summary: 'We are launching a coffee brand and want to register the name and logo before we start selling.',
      qa: [['What do you want to protect?', 'A brand name and logo'], ['Is the brand already in use?', 'Not yet, launching in the spring'], ['Which countries do you need it in?', 'The UK for now'], ['Has a search been done?', 'No'], ['How many classes of goods or services?', 'Two, coffee and cafe services']] },
    // A wider spread across every area, matter, region, urgency, grade and channel (added 22 Nov 2026).
    { id: 2069, ago: 50 * 6e4, area: 'conveyancing', matter: 'buying-and-selling', urgency: 'Urgently', pc: 'BS6 5AA', region: 'South West', v: ['£250k to £500k', 'Property price', 250000, 500000], pay: 'yes', grade: 'A', score: 89,
      tags: ['chain', 'mortgage agreed'], name: 'Holly Sampleton', ph: '129', ch: 'Google search', summary: 'Selling our flat and buying a house in Bishopston. Both sales are agreed and the agents want solicitors named this week.',
      qa: [['What are you selling?', 'A two bed leasehold flat'], ['What are you buying?', 'A three bed freehold house'], ['Are both sales agreed?', 'Yes'], ['Do you have a mortgage offer?', 'Agreement in principle, full application this week'], ['When would you like to complete?', 'Within two months']] },
    { id: 2070, ago: 3 * H, area: 'conveyancing', matter: 'new-build-purchases', urgency: 'Urgently', deadline: 21, pc: 'MK10 7AA', region: 'South East', v: ['£250k to £500k', 'Property price', 250000, 500000], pay: 'yes', grade: 'A', score: 86,
      tags: ['new build', 'reservation deadline'], name: 'Owen Placeholder', ph: '130', ch: 'Meta ads', summary: 'Reserved a new build house and the developer needs exchange within 28 days of reservation.',
      qa: [['Who is the developer?', 'A national housebuilder'], ['When did you reserve?', 'Last week'], ['Is there an exchange deadline?', 'Yes, 28 days from reservation'], ['Are you using Help to Buy or a scheme?', 'No, standard mortgage'], ['Is it freehold or leasehold?', 'Freehold']] },
    { id: 2071, ago: 8 * H, area: 'conveyancing', matter: 'buying-a-leasehold-flat', urgency: 'Within a month', pc: 'LS6 2AA', region: 'Yorkshire and the Humber', v: ['£100k to £250k', 'Property price', 100000, 250000], pay: 'quote', grade: 'B', score: 66,
      tags: ['leasehold', 'first time buyer'], name: 'Mia Testwell', ph: '131', ch: 'Google search', summary: 'Buying a one bed flat in Headingley. The service charge looks high and I want someone to check the lease properly.',
      qa: [['What price has been agreed?', '£165,000'], ['How long is left on the lease?', '112 years'], ['What is the service charge?', '£2,100 a year'], ['Are you a first time buyer?', 'Yes'], ['Do you have a mortgage?', 'Yes, agreement in principle']] },
    { id: 2072, ago: 14 * H, area: 'conveyancing', matter: 'selling-a-home', urgency: 'In the next few months', pc: 'NR2 3AA', region: 'East of England', v: ['£250k to £500k', 'Property price', 250000, 500000], pay: 'yes', grade: 'B', score: 71,
      tags: ['probate property'], name: 'Graham Example', ph: '132', ch: 'Direct or unknown', summary: 'Selling my late mother’s house. Probate has been granted and we have an offer.',
      qa: [['Has probate been granted?', 'Yes'], ['Is there a mortgage on the property?', 'No'], ['How many executors are there?', 'Two, me and my sister'], ['Has an offer been accepted?', 'Yes, from a cash buyer'], ['Is the property empty?', 'Yes']] },
    { id: 2073, ago: 2 * D, area: 'conveyancing', matter: 'first-time-buyers', urgency: 'Within a month', pc: 'L15 4AA', region: 'North West', v: ['£100k to £250k', 'Property price', 100000, 250000], pay: 'quote', grade: 'C', score: 51,
      tags: ['first time buyer', 'lifetime isa'], name: 'Chloe Demoford', ph: '133', ch: 'Meta ads', summary: 'First home, using a Lifetime ISA. I just want a fixed fee quote before I go further.',
      qa: [['What price has been agreed?', '£140,000'], ['Are you using a Lifetime ISA?', 'Yes'], ['Is it freehold or leasehold?', 'Freehold'], ['Have you had an offer accepted?', 'Not yet, viewing this weekend']] },
    { id: 2074, ago: 6 * D, area: 'conveyancing', matter: 'remortgaging', urgency: 'Just looking into it', pc: 'EX4 4AA', region: 'South West', v: ['£250k to £500k', 'Property price', 250000, 500000], pay: 'yes', grade: 'C', score: 47,
      tags: [], name: 'Nina Specimen', ph: '134', ch: 'Google search', summary: 'My fixed rate ends in the spring. Looking at options to remortgage and release some equity.',
      qa: [['When does your current deal end?', 'In about five months'], ['Are you releasing equity?', 'Possibly £30,000'], ['Is anyone else on the title?', 'My husband'], ['Do you have a new lender yet?', 'No']] },
    { id: 2075, ago: 9 * D, area: 'conveyancing', matter: 'other', urgency: 'In the next few months', pc: 'CF5 1AA', region: 'Wales', v: ['£100k to £250k', 'Property price', 100000, 250000], pay: 'yes', grade: 'B', score: 62,
      tags: ['boundary'], name: 'Gareth Notreal', ph: '135', ch: 'Google search', buy: [MERID, 8 * D, true, 'contacted', 7 * D], summary: 'Buying a strip of land from my neighbour to extend the garden.',
      qa: [['What do you need help with?', 'Buying part of a neighbour’s garden'], ['Has a price been agreed?', 'Yes, £8,000'], ['Is the land registered?', 'We think so'], ['Is there a mortgage on either property?', 'Yes, on both']] },
    { id: 2076, ago: 12 * D, area: 'conveyancing', matter: 'buying-a-home', urgency: 'Within a month', pc: 'DE1 2AA', region: 'East Midlands', v: ['£250k to £500k', 'Property price', 250000, 500000], pay: 'yes', grade: 'A', score: 83,
      tags: ['mortgage agreed'], name: 'Tariq Example', ph: '136', ch: 'Google search', buy: [BRIGHT, 12 * D - 5 * 6e4, true, 'instructed', 9 * D, 1450], summary: 'Offer accepted on a semi in Derby. Mortgage offer issued.',
      qa: [['What price has been agreed?', '£285,000'], ['Is it freehold or leasehold?', 'Freehold'], ['Do you have a mortgage offer?', 'Yes'], ['Is there a chain?', 'Short chain, seller is buying']] },
    { id: 2077, ago: 18 * D, area: 'conveyancing', matter: 'buy-to-let', urgency: 'In the next few months', pc: 'S1 2AA', region: 'Yorkshire and the Humber', aud: 'business', v: ['£100k to £250k', 'Property price', 100000, 250000], pay: 'yes', grade: 'B', score: 69,
      tags: ['landlord', 'limited company'], name: 'Bea Mockridge', ph: '137', ch: 'Meta ads', buy: [NORTH, 17 * D, false, 'lost', 10 * D], biz: ['Example Lettings Ltd', '00006789', 'ltd', '2020-03-11', 'Sheffield', ['Real estate activities']],
      summary: 'Our property company is buying a two bed flat in the city centre to let out.',
      qa: [['Are you buying in your own name or a company?', 'Through our limited company'], ['What is the price?', '£135,000'], ['Will there be tenants in place?', 'Yes, a tenant is staying on'], ['Do you have a mortgage offer?', 'Yes, a company buy to let mortgage']] },
    { id: 2078, ago: 1 * H, area: 'immigration', matter: 'spouse-and-partner-visas', urgency: 'Urgently', deadline: 14, pc: 'E7 9AA', region: 'London', pay: 'yes', grade: 'A', score: 88,
      tags: ['extension', 'visa expiring'], name: 'Amira Sample', ph: '138', ch: 'Google search', summary: 'My partner visa runs out in five weeks and I need to apply for the extension. Our income has changed since last time.',
      qa: [['Is this a first application or an extension?', 'Extension'], ['When does your current visa expire?', 'In five weeks'], ['Has anything changed since your last application?', 'My partner changed jobs'], ['Do you live together?', 'Yes'], ['Have you had a refusal before?', 'No']] },
    { id: 2079, ago: 7 * H, area: 'immigration', matter: 'family-visas', urgency: 'Within a month', pc: 'LE2 1AA', region: 'East Midlands', pay: 'quote', grade: 'B', score: 65,
      tags: ['parent'], name: 'Raj Placeholder', ph: '139', ch: 'Meta ads', summary: 'I would like my elderly mother to come and live with us in Leicester.',
      qa: [['Who do you want to bring to the UK?', 'My mother'], ['Where do they live now?', 'Outside the UK'], ['What status do you hold?', 'British citizen'], ['Have you applied before?', 'No']] },
    { id: 2080, ago: 30 * H, area: 'immigration', matter: 'settlement', urgency: 'In the next few months', pc: 'G1 1AA', region: 'Scotland', pay: 'yes', grade: 'B', score: 74,
      tags: ['ilr', 'skilled worker'], name: 'Lina Testcase', ph: '140', ch: 'Google search', summary: 'I reach five years on a Skilled Worker visa in March and want help with my ILR application.',
      qa: [['What visa do you hold now?', 'Skilled Worker'], ['When do you reach the qualifying period?', 'In March'], ['Have you passed the Life in the UK test?', 'Booked for next month'], ['Any long absences from the UK?', 'No'], ['Is your employer still sponsoring you?', 'Yes']] },
    { id: 2081, ago: 3 * D, area: 'immigration', matter: 'eu-settlement-scheme', urgency: 'Within a month', pc: 'BT1 1AA', region: 'Northern Ireland', pay: 'quote', grade: 'C', score: 54,
      tags: ['pre-settled status'], name: 'Marta Demo', ph: '141', ch: 'Direct or unknown', summary: 'I have pre-settled status and I am not sure if it has moved to settled status automatically.',
      qa: [['What status do you hold?', 'Pre-settled status'], ['How long have you lived in the UK?', 'Six years'], ['Have you received any emails from the Home Office?', 'Not that I have seen'], ['Do you need it for a job or travel?', 'A new job']] },
    { id: 2082, ago: 4 * D, area: 'immigration', matter: 'refusals-and-appeals', urgency: 'Urgently', deadline: 10, pc: 'B10 0AA', region: 'West Midlands', pay: 'yes', grade: 'A', score: 82,
      tags: ['appeal deadline', 'refusal'], name: 'Hassan Example', ph: '142', ch: 'Google search', buy: [FIRM, 4 * D - 10 * 6e4, true, 'consultation', 2 * D],
      summary: 'My wife’s visa was refused and we have a short time to appeal. We think the decision got our finances wrong.',
      qa: [['What was refused?', 'Spouse visa'], ['When was the decision?', 'Four days ago'], ['Do you have a right of appeal?', 'The letter says yes'], ['Why was it refused?', 'Financial requirement'], ['Do you have the refusal letter?', 'Yes']] },
    { id: 2083, ago: 9 * H, area: 'immigration', matter: 'visitor-visas', urgency: 'In the next few months', pc: null, region: 'Outside the UK', pay: 'quote', grade: 'C', score: 44,
      tags: ['previous refusal'], name: 'Ade Specimen', ph: '143', ch: 'Meta ads', summary: 'I want to visit my brother for his wedding next summer. I was refused a visit visa two years ago.',
      qa: [['Why are you visiting?', 'My brother’s wedding'], ['Have you been refused before?', 'Yes, two years ago'], ['How long do you want to stay?', 'Three weeks'], ['Who is paying for the trip?', 'Me']] },
    { id: 2084, ago: 2 * D, area: 'immigration', matter: 'talent-and-founder-visas', urgency: 'In the next few months', pc: null, region: 'Outside the UK', pay: 'yes', grade: 'A', score: 81,
      tags: ['founder', 'endorsement'], name: 'Yuki Placeholder', ph: '144', ch: 'Google search', summary: 'I am a startup founder planning to move my company to London and need help with the endorsement and visa.',
      qa: [['Which route are you looking at?', 'Innovator Founder'], ['Do you have an endorsing body?', 'Not yet'], ['Has your business raised investment?', 'Yes, a seed round'], ['When do you want to move?', 'Within six months']] },
    { id: 2085, ago: 11 * D, area: 'immigration', matter: 'sponsor-licences', urgency: 'Urgently', pc: 'LS11 5AA', region: 'Yorkshire and the Humber', aud: 'business', pay: 'yes', grade: 'A', score: 87,
      tags: ['employer', 'compliance visit'], name: 'Callum Notreal', ph: '145', ch: 'Google search', buy: [MERID, 11 * D - 4 * 6e4, true, 'instructed', 6 * D, 3200],
      biz: ['Example Care Homes Ltd', '00007890', 'ltd', '2009-06-18', 'Leeds', ['Human health and social work']],
      summary: 'We hold a sponsor licence and the Home Office has booked a compliance visit. We want our records checked first.',
      qa: [['Do you already hold a sponsor licence?', 'Yes'], ['How many sponsored workers do you have?', '31'], ['What has happened?', 'A compliance visit is booked'], ['When is the visit?', 'In two weeks']] },
    { id: 2086, ago: 5 * H, area: 'immigration', matter: 'work-visas', urgency: 'Within a month', pc: 'CB2 1AA', region: 'East of England', pay: 'yes', grade: 'B', score: 73,
      tags: ['switching'], name: 'Priyanka Sample', ph: '146', ch: 'Google search', summary: 'I am on a Graduate visa and my employer wants to sponsor me. I need help switching to Skilled Worker.',
      qa: [['What visa do you hold now?', 'Graduate visa'], ['When does it expire?', 'In four months'], ['Has your employer issued a certificate of sponsorship?', 'They are about to'], ['What is the salary?', '£41,000']] },
    { id: 2087, ago: 16 * D, area: 'immigration', matter: 'british-citizenship', urgency: 'Just looking into it', pc: 'JE2 3AA', region: 'Channel Islands and Isle of Man', pay: 'quote', grade: 'C', score: 41,
      tags: [], name: 'Pierre Example', ph: '147', ch: 'Direct or unknown', summary: 'Wondering whether I can apply for British citizenship while living in Jersey.',
      qa: [['What status do you hold now?', 'Indefinite leave'], ['Where do you live?', 'Jersey'], ['How long have you held your status?', 'Three years']] },
    { id: 2088, ago: 40 * 6e4, area: 'family-law', matter: 'child-arrangements', urgency: 'Urgently', deadline: 6, pc: 'M33 7AA', region: 'North West', pay: 'yes', grade: 'A', score: 90,
      tags: ['children', 'court hearing'], name: 'Danielle Testwood', ph: '148', ch: 'Google search', summary: 'My ex has stopped me seeing our two children and there is a first hearing next week. I need representation.',
      qa: [['How many children are involved?', 'Two, aged 4 and 7'], ['Is there a court case already?', 'Yes, first hearing next week'], ['Have you tried mediation?', 'Yes, my ex would not attend'], ['Are there any safety concerns?', 'No'], ['Where do the children live now?', 'With their mother']] },
    { id: 2089, ago: 4 * H, area: 'family-law', matter: 'financial-settlements', urgency: 'Within a month', pc: 'HP9 1AA', region: 'South East', v: ['£1m+', 'Assets', 1000000, null], pay: 'yes', grade: 'A', score: 92,
      tags: ['business assets', 'pension', 'property'], name: 'Victoria Mockley', ph: '149', ch: 'Google search', summary: 'Divorcing after 18 years. There is the family home, a second property, pensions and my husband’s company to sort out.',
      qa: [['Has a divorce application been made?', 'Yes'], ['What are the main assets?', 'Two properties, pensions and a business'], ['Roughly what are they worth?', 'Over £2 million together'], ['Have you exchanged financial disclosure?', 'Not yet'], ['Is your spouse represented?', 'Yes']] },
    { id: 2090, ago: 10 * H, area: 'family-law', matter: 'civil-partnership-dissolution', urgency: 'Within a month', pc: 'BN2 1AA', region: 'South East', pay: 'yes', grade: 'B', score: 70,
      tags: ['property'], name: 'Jamie Placeholder', ph: '150', ch: 'Meta ads', summary: 'We want to end our civil partnership. We own a flat together and need to agree what happens to it.',
      qa: [['How long have you been in the civil partnership?', 'Seven years'], ['Do you own property together?', 'Yes, a flat'], ['Are there children?', 'No'], ['Does your partner agree?', 'Yes']] },
    { id: 2091, ago: 3 * D, area: 'family-law', matter: 'consent-orders', urgency: 'In the next few months', pc: 'SO15 2AA', region: 'South East', pay: 'quote', grade: 'B', score: 62,
      tags: ['agreed terms'], name: 'Rachel Demo', ph: '151', ch: 'Google search', summary: 'We have agreed how to split things and want a consent order so it is legally binding.',
      qa: [['Have you agreed the split?', 'Yes, in writing'], ['Is there a pension involved?', 'Yes, one pension'], ['Has the divorce been finalised?', 'Conditional order granted'], ['Do you need it drafted or checked?', 'Drafted']] },
    { id: 2092, ago: 6 * D, area: 'family-law', matter: 'cohabitation-disputes', urgency: 'Within a month', pc: 'CF14 3AA', region: 'Wales', v: ['£250k to £500k', 'Assets', 250000, 500000], pay: 'yes', grade: 'B', score: 68,
      tags: ['property', 'unmarried'], name: 'Sian Example', ph: '152', ch: 'Google search', buy: [BRIGHT, 6 * D - 30 * 6e4, false, 'contacted', 5 * D], summary: 'We were never married. The house is in his name but I paid towards it for ten years.',
      qa: [['Were you married or in a civil partnership?', 'No'], ['Whose name is the property in?', 'His name only'], ['Did you contribute to it?', 'Yes, the mortgage and renovations'], ['Do you have evidence of payments?', 'Bank statements']] },
    { id: 2093, ago: 20 * D, area: 'family-law', matter: 'separation-agreements', urgency: 'Just looking into it', pc: 'YO1 7AA', region: 'Yorkshire and the Humber', pay: 'quote', grade: 'C', score: 46,
      tags: [], name: 'Paul Specimen', ph: '153', ch: 'Meta ads', summary: 'We are separating but not ready to divorce. Want something in writing about money and the house.',
      qa: [['Are you married?', 'Yes'], ['Do you want to divorce now?', 'Not yet'], ['Are there children?', 'One, aged 15']] },
    { id: 2094, ago: 25 * D, area: 'family-law', matter: 'divorce', urgency: 'Within a month', pc: 'TS1 2AA', region: 'North East', pay: 'yes', grade: 'B', score: 66,
      tags: ['children'], name: 'Lauren Testcase', ph: '154', ch: 'Google search', buy: [NORTH, 25 * D - 2 * 6e4, true, 'instructed', 18 * D, 950], summary: 'Ready to start the divorce. We have one child and agree on most things.',
      qa: [['Has either of you applied for a divorce yet?', 'No'], ['Are there children under 18?', 'Yes, one'], ['Is there property to divide?', 'Yes, the family home'], ['Does your spouse agree?', 'Yes']] },
    { id: 2095, ago: 13 * H, area: 'family-law', matter: 'other', urgency: 'In the next few months', pc: 'PL4 6AA', region: 'South West', pay: 'quote', grade: 'C', score: 43,
      tags: ['grandparents'], name: 'Maureen Notreal', ph: '155', ch: 'Direct or unknown', summary: 'We are grandparents and have not been allowed to see our grandchildren for a year.',
      qa: [['What do you need help with?', 'Seeing our grandchildren'], ['Have you tried mediation?', 'No'], ['How old are the children?', '6 and 9']] },
    { id: 2096, ago: 90 * 6e4, area: 'debt-recovery', matter: 'letters-before-action', urgency: 'Within a month', pc: 'RG2 0AA', region: 'South East', aud: 'business', v: ['£5k to £10k', 'Amount owed', 5000, 10000], pay: 'yes', grade: 'B', score: 72,
      tags: ['b2b'], name: 'Ollie Example', ph: '156', ch: 'Google search', biz: ['Sample Digital Agency Ltd', '00008901', 'ltd', '2017-10-05', 'Reading', ['Information and communication']],
      summary: 'A client owes us £7,800 for a website build and has gone quiet. We want a formal letter sent.',
      qa: [['How much is owed?', '£7,800'], ['How old is the debt?', '90 days'], ['Has the customer disputed the work?', 'No'], ['Do you have a signed contract?', 'Yes'], ['Is the customer still trading?', 'Yes']] },
    { id: 2097, ago: 15 * H, area: 'debt-recovery', matter: 'court-claims', urgency: 'Urgently', pc: 'NG7 2AA', region: 'East Midlands', aud: 'business', v: ['£50k to £100k', 'Amount owed', 50000, 100000], pay: 'yes', grade: 'A', score: 84,
      tags: ['b2b', 'lba sent'], name: 'Neil Sampleford', ph: '157', ch: 'Google search', biz: ['Example Building Supplies Ltd', '00009012', 'ltd', '2004-01-22', 'Nottingham', ['Wholesale and retail trade']],
      summary: 'A contractor owes £74,000 for materials. We sent a letter before action and they ignored it. Ready to issue a claim.',
      qa: [['How much is owed?', '£74,000'], ['Have you sent a letter before action?', 'Yes, over 30 days ago'], ['Has the debtor responded?', 'No'], ['Do you have signed terms?', 'Yes, with retention of title'], ['Is the debtor still trading?', 'Yes']] },
    { id: 2098, ago: 5 * D, area: 'debt-recovery', matter: 'enforcement', urgency: 'Within a month', pc: 'CV3 4AA', region: 'West Midlands', aud: 'business', v: ['£10k to £50k', 'Amount owed', 10000, 50000], pay: 'yes', grade: 'B', score: 67,
      tags: ['judgment'], name: 'Zara Placeholder', ph: '158', ch: 'Direct or unknown', buy: [KEST, 5 * D - 6e4, true, 'contacted', 4 * D], biz: ['Example Engineering Ltd', '00010123', 'ltd', '2012-08-30', 'Coventry', ['Manufacturing']],
      summary: 'We have a county court judgment for £23,000 but the debtor has not paid. We need it enforced.',
      qa: [['Do you have a judgment?', 'Yes, county court'], ['How much is the judgment for?', '£23,000'], ['When was it made?', 'Two months ago'], ['Has anything been paid?', 'No']] },
    { id: 2099, ago: 2 * D, area: 'debt-recovery', matter: 'winding-up-petitions', urgency: 'Urgently', pc: 'EC1V 2AA', region: 'London', aud: 'business', v: ['£100k+', 'Amount owed', 100000, null], pay: 'yes', grade: 'A', score: 85,
      tags: ['b2b', 'statutory demand served'], name: 'Fraser Demo', ph: '159', ch: 'Google search', biz: ['Example Staffing Ltd', '00011234', 'ltd', '2014-04-14', 'London', ['Administrative and support services']],
      summary: 'A client owes us £140,000. A statutory demand expired without payment and we want to petition.',
      qa: [['How much is owed?', '£140,000'], ['Was a statutory demand served?', 'Yes, it expired last week'], ['Is the debt disputed?', 'No'], ['Is the debtor a company?', 'Yes']] },
    { id: 2100, ago: 8 * D, area: 'debt-recovery', matter: 'late-payment-interest', urgency: 'In the next few months', pc: 'BS2 0AA', region: 'South West', aud: 'business', v: ['£1k to £5k', 'Amount owed', 1000, 5000], pay: 'quote', grade: 'C', score: 48,
      tags: ['b2b'], name: 'Imogen Testwell', ph: '160', ch: 'Meta ads', biz: ['Sample Catering Ltd', '00012345', 'ltd', '2019-11-01', 'Bristol', ['Hospitality and food']],
      summary: 'Several customers always pay late. We want to know how to claim late payment interest and compensation.',
      qa: [['How many customers are involved?', 'Four'], ['What is the total owed?', 'About £3,500'], ['Do your terms mention late payment?', 'Not clearly']] },
    { id: 2101, ago: 22 * D, area: 'debt-recovery', matter: 'unpaid-invoices', urgency: 'Within a month', pc: 'NE6 1AA', region: 'North East', aud: 'business', v: ['£10k to £50k', 'Amount owed', 10000, 50000], pay: 'yes', grade: 'B', score: 70,
      tags: ['b2b'], name: 'Dominic Example', ph: '161', ch: 'Google search', buy: [ASHBY, 22 * D - 3 * 6e4, true, 'instructed', 15 * D, 1200], biz: ['Example Electrical Ltd', '00013456', 'ltd', '2008-02-15', 'Newcastle', ['Construction']],
      summary: 'Main contractor owes £31,000 on a fit out job and keeps disputing small items to delay.',
      qa: [['How much is owed?', '£31,000'], ['Has the debtor disputed the debt?', 'Only small items'], ['Do you have a written contract?', 'Yes, a subcontract'], ['Is the customer still trading?', 'Yes']] },
    { id: 2102, ago: 25 * 6e4, area: 'motoring-offences', matter: 'drink-driving', urgency: 'Urgently', deadline: 5, pc: 'CH1 2AA', region: 'North West', pay: 'yes', grade: 'A', score: 87,
      tags: ['court date', 'special reasons'], name: 'Kieran Mockford', ph: '162', ch: 'Google search', summary: 'Charged with drink driving after moving my car a few metres. Court is next week and I think there may be special reasons.',
      qa: [['What was the reading?', '42 in breath'], ['When is the court date?', 'Next week'], ['Do you plan to plead guilty?', 'Not sure, I want advice'], ['Do you need your licence for work?', 'Yes, I drive for a living']] },
    { id: 2103, ago: 11 * H, area: 'motoring-offences', matter: 'drug-driving', urgency: 'Urgently', deadline: 18, pc: 'SE15 4AA', region: 'London', pay: 'yes', grade: 'B', score: 72,
      tags: ['court date'], name: 'Tyler Sample', ph: '163', ch: 'Meta ads', summary: 'Stopped and tested positive at the roadside. I have now been charged and need representation.',
      qa: [['What substance was found?', 'Cannabis'], ['Have you been charged?', 'Yes'], ['When is the first hearing?', 'In just under three weeks'], ['Do you have any previous convictions?', 'No']] },
    { id: 2104, ago: 3 * D, area: 'motoring-offences', matter: 'careless-driving', urgency: 'Within a month', deadline: 24, pc: 'GL1 2AA', region: 'South West', pay: 'quote', grade: 'B', score: 61,
      tags: ['collision'], name: 'Hannah Placeholder', ph: '164', ch: 'Google search', summary: 'Minor collision at a roundabout and I have received a summons for careless driving.',
      qa: [['What happened?', 'A low speed collision at a roundabout'], ['Was anyone injured?', 'No'], ['Have you received a summons?', 'Yes'], ['How many points do you have?', '3']] },
    { id: 2105, ago: 7 * H, area: 'motoring-offences', matter: 'driving-without-insurance', urgency: 'Within a month', pc: 'WV1 1AA', region: 'West Midlands', pay: 'quote', grade: 'C', score: 50,
      tags: ['policy error'], name: 'Liam Demoford', ph: '165', ch: 'Meta ads', summary: 'I thought my insurance covered me to drive my friend’s car but it did not. Now I have a court letter.',
      qa: [['Did you think you were insured?', 'Yes, I had driving other cars cover before'], ['Do you have a court date?', 'Yes, in a month'], ['How many points do you have?', '0']] },
    { id: 2106, ago: 2 * D, area: 'motoring-offences', matter: 'mobile-phone', urgency: 'Within a month', pc: 'OX1 1AA', region: 'South East', pay: 'yes', grade: 'B', score: 64,
      tags: ['new driver'], name: 'Ella Testcase', ph: '166', ch: 'Google search', summary: 'Caught holding my phone at traffic lights. I passed my test 18 months ago and could lose my licence.',
      qa: [['When did you pass your test?', '18 months ago'], ['How many points do you have now?', '0'], ['Was the phone in your hand?', 'Yes, at a red light'], ['Have you replied to the notice?', 'Yes']] },
    { id: 2107, ago: 4 * D, area: 'motoring-offences', matter: 'failing-to-identify-the-driver', urgency: 'Within a month', pc: 'SL1 1AA', region: 'South East', aud: 'business', pay: 'yes', grade: 'B', score: 63,
      tags: ['company car'], name: 'Martin Example', ph: '167', ch: 'Direct or unknown', biz: ['Example Couriers Ltd', '00014567', 'ltd', '2016-05-09', 'Slough', ['Transport and storage']],
      summary: 'A notice for one of our vans went to an old address and we missed the deadline to name the driver.',
      qa: [['Who is the registered keeper?', 'The company'], ['Why was the driver not named?', 'The notice went to an old address'], ['Has a summons been issued?', 'Yes']] },
    { id: 2108, ago: 6 * D, area: 'motoring-offences', matter: 'totting-up', urgency: 'Urgently', deadline: 8, pc: 'HU1 1AA', region: 'Yorkshire and the Humber', pay: 'yes', grade: 'A', score: 80,
      tags: ['totting up risk', 'exceptional hardship'], name: 'Craig Notreal', ph: '168', ch: 'Google search', buy: [FIRM, 6 * D - 4 * 6e4, false, 'new'], summary: 'This would take me to 12 points. I care for my disabled father and need to keep driving.',
      qa: [['How many points do you have now?', '9'], ['What is the new offence?', 'Speeding'], ['Who would be affected by a ban?', 'My disabled father, I am his carer'], ['When is the court date?', 'In just over a week']] },
    { id: 2109, ago: 19 * H, area: 'motoring-offences', matter: 'exceptional-hardship', urgency: 'Within a month', pc: 'IP1 1AA', region: 'East of England', pay: 'yes', grade: 'B', score: 69,
      tags: ['exceptional hardship'], name: 'Sophie Specimen', ph: '169', ch: 'Meta ads', summary: 'Facing a totting up ban and I run a small cleaning business that depends on me driving between jobs.',
      qa: [['How many points will you have?', '12'], ['Who would be affected?', 'My business and two employees'], ['Is there public transport you could use?', 'Not for most of our jobs']] },
    { id: 2110, ago: 28 * D, area: 'motoring-offences', matter: 'other-motoring', urgency: 'Just looking into it', pc: 'DH1 1AA', region: 'North East', pay: 'quote', grade: 'C', score: 40,
      tags: [], name: 'Gavin Example', ph: '170', ch: 'Direct or unknown', summary: 'I was given a ticket for driving in a bus lane and want to know if it is worth challenging.',
      qa: [['What was the offence?', 'Driving in a bus lane'], ['Have you paid it?', 'Not yet']] },
    { id: 2111, ago: 2 * H, area: 'licensing', matter: 'licence-variations', urgency: 'Within a month', pc: 'B5 4AA', region: 'West Midlands', aud: 'business', pay: 'yes', grade: 'A', score: 83,
      tags: ['late hours', 'outdoor area'], name: 'Rosa Placeholder', ph: '171', ch: 'Google search', biz: ['Example Taverns Ltd', '00015678', 'ltd', '2013-09-17', 'Birmingham', ['Hospitality and food']],
      summary: 'We want to extend our hours to 1am at weekends and add the new beer garden to the licence.',
      qa: [['What do you want to change?', 'Later hours and add an outdoor area'], ['What hours do you want?', 'Until 1am Friday and Saturday'], ['Have there been any complaints?', 'None that we know of'], ['When do you need it?', 'Before the summer']] },
    { id: 2112, ago: 3 * D, area: 'licensing', matter: 'transfers-and-dps', urgency: 'Urgently', pc: 'NG1 6AA', region: 'East Midlands', aud: 'business', pay: 'yes', grade: 'B', score: 71,
      tags: ['acquisition'], name: 'Ben Testwood', ph: '172', ch: 'Google search', buy: [KEST, 3 * D - 8 * 6e4, true, 'consultation', 2 * D], biz: ['Example Bar Group Ltd', '00016789', 'ltd', '2022-01-10', 'Nottingham', ['Hospitality and food']],
      summary: 'We are buying a bar and need the premises licence transferred and a new DPS named before completion.',
      qa: [['What do you need?', 'Licence transfer and new DPS'], ['When does the purchase complete?', 'In three weeks'], ['Does the new DPS hold a personal licence?', 'Yes']] },
    { id: 2113, ago: 9 * D, area: 'licensing', matter: 'licence-reviews', urgency: 'Urgently', deadline: 15, pc: 'LS2 7AA', region: 'Yorkshire and the Humber', aud: 'business', pay: 'yes', grade: 'A', score: 86,
      tags: ['review hearing', 'police'], name: 'Connor Demo', ph: '173', ch: 'Google search', biz: ['Sample Nightclub Ltd', '00017890', 'ltd', '2010-12-03', 'Leeds', ['Arts, entertainment and recreation']],
      summary: 'The police have applied for a review of our licence after an incident outside. The hearing is in two weeks.',
      qa: [['Who applied for the review?', 'The police'], ['When is the hearing?', 'In just over two weeks'], ['What led to it?', 'A fight outside the venue'], ['Have you had a review before?', 'No']] },
    { id: 2114, ago: 21 * H, area: 'licensing', matter: 'taxi-and-private-hire-licences', urgency: 'Within a month', pc: 'L1 8AA', region: 'North West', pay: 'quote', grade: 'B', score: 60,
      tags: ['suspension'], name: 'Mo Example', ph: '174', ch: 'Meta ads', summary: 'The council suspended my private hire licence after a passenger complaint. I want to appeal.',
      qa: [['What licence do you hold?', 'Private hire driver'], ['What has the council done?', 'Suspended the licence'], ['Do you want to appeal?', 'Yes'], ['How long have you been licensed?', 'Nine years']] },
    { id: 2115, ago: 14 * D, area: 'licensing', matter: 'other-licensing', urgency: 'In the next few months', pc: 'TQ1 1AA', region: 'South West', aud: 'business', pay: 'quote', grade: 'C', score: 52,
      tags: ['events'], name: 'Erin Sampleton', ph: '175', ch: 'Google search', buy: [ASHBY, 13 * D, false, 'lost', 8 * D], biz: ['Example Events Ltd', '00018901', 'ltd', '2021-04-27', 'Torquay', ['Arts, entertainment and recreation']],
      summary: 'Planning a two day food and music festival next summer and not sure which licences we need.',
      qa: [['What kind of event is it?', 'Food and music festival'], ['How many people are expected?', 'Around 3,000 a day'], ['Will alcohol be sold?', 'Yes']] },
    { id: 2116, ago: 16 * H, area: 'lease-extensions', matter: 'statutory-lease-extension', urgency: 'Urgently', pc: 'SW2 1AA', region: 'London', v: ['£250k to £500k', 'Flat value', 250000, 500000], pay: 'yes', grade: 'A', score: 88,
      tags: ['short lease', 'marriage value'], name: 'Tom Mockridge', ph: '176', ch: 'Google search', summary: 'My lease has 81 years left and I want to serve notice before it drops below 80 and the premium jumps.',
      qa: [['How many years are left on the lease?', '81 years'], ['Have you owned the flat for at least two years?', 'Yes'], ['Have you had a valuation?', 'Not yet'], ['Do you know who the freeholder is?', 'Yes, a property company']] },
    { id: 2117, ago: 5 * D, area: 'lease-extensions', matter: 'selling-a-leasehold-flat', urgency: 'Within a month', pc: 'BN3 2AA', region: 'South East', v: ['£250k to £500k', 'Flat value', 250000, 500000], pay: 'yes', grade: 'B', score: 70,
      tags: ['selling', 'short lease'], name: 'Grace Placeholder', ph: '177', ch: 'Meta ads', buy: [BRIGHT, 5 * D - 6e4, true, 'consultation', 3 * D], summary: 'Selling my flat and the buyer wants the lease extended as part of the sale.',
      qa: [['How many years are left?', '74 years'], ['Is there a buyer?', 'Yes'], ['Can the notice be assigned to the buyer?', 'We would like that'], ['Have you owned it for two years?', 'Yes']] },
    { id: 2118, ago: 8 * D, area: 'lease-extensions', matter: 'collective-enfranchisement', urgency: 'In the next few months', pc: 'M3 5AA', region: 'North West', v: ['£1m+', 'Building value', 1000000, null], pay: 'yes', grade: 'B', score: 75,
      tags: ['freehold purchase', 'residents group'], name: 'Andrew Testcase', ph: '178', ch: 'Google search', summary: 'Twelve of the sixteen leaseholders in our block want to buy the freehold together.',
      qa: [['How many flats are in the building?', '16'], ['How many leaseholders want to take part?', '12'], ['Is there commercial space?', 'No'], ['Has the freeholder been approached?', 'Not yet']] },
    { id: 2119, ago: 4 * H, area: 'lease-extensions', matter: 'lease-variations', urgency: 'In the next few months', pc: 'PO5 1AA', region: 'South East', v: ['£100k to £250k', 'Flat value', 100000, 250000], pay: 'quote', grade: 'C', score: 49,
      tags: ['ground rent'], name: 'Lucy Example', ph: '179', ch: 'Direct or unknown', summary: 'The ground rent doubles every ten years and lenders will not lend on it. I want the lease varied.',
      qa: [['What is the problem with the lease?', 'Doubling ground rent'], ['What is the ground rent now?', '£400 a year'], ['Has the freeholder been asked?', 'Yes, no reply yet']] },
    { id: 2120, ago: 19 * D, area: 'lease-extensions', matter: 'short-lease', urgency: 'Just looking into it', pc: 'NW6 3AA', region: 'London', v: ['£500k to £1m', 'Flat value', 500000, 1000000], pay: 'yes', grade: 'B', score: 65,
      tags: ['short lease'], name: 'Daniel Demo', ph: '180', ch: 'Google search', buy: [MERID, 18 * D, false, 'instructed', 12 * D, 4200], summary: 'Inherited a flat with 62 years left. Want to know the cost of extending before deciding whether to sell.',
      qa: [['How many years are left?', '62 years'], ['How did you acquire the flat?', 'Inherited it'], ['Do you plan to sell or keep it?', 'Not decided']] },
    { id: 2121, ago: 6 * H, area: 'trademarks', matter: 'trademark-infringement', urgency: 'Urgently', pc: 'EC2A 3AA', region: 'London', aud: 'business', pay: 'yes', grade: 'A', score: 88,
      tags: ['infringement', 'online seller'], name: 'Nadia Sample', ph: '181', ch: 'Google search', biz: ['Example Skincare Ltd', '00019012', 'ltd', '2019-02-12', 'London', ['Manufacture of chemicals']],
      summary: 'Another seller is using our registered brand name on Amazon and customers are getting confused.',
      qa: [['Is your trademark registered?', 'Yes, in the UK'], ['Who is infringing?', 'An online seller'], ['Where is it happening?', 'Amazon and their own website'], ['Have you contacted them?', 'No']] },
    { id: 2122, ago: 2 * D, area: 'trademarks', matter: 'objections-and-oppositions', urgency: 'Urgently', deadline: 19, pc: 'G2 4AA', region: 'Scotland', aud: 'business', pay: 'yes', grade: 'B', score: 74,
      tags: ['opposition deadline'], name: 'Ewan Placeholder', ph: '182', ch: 'Google search', biz: ['Sample Distillery Ltd', '00020123', 'ltd', '2018-08-08', 'Glasgow', ['Manufacture of beverages']],
      summary: 'Our trademark application has been opposed by a bigger drinks company. We have a deadline to respond.',
      qa: [['What has happened?', 'Our application was opposed'], ['When is the deadline?', 'In under three weeks'], ['Is the brand already in use?', 'Yes, for two years']] },
    { id: 2123, ago: 4 * D, area: 'trademarks', matter: 'trademark-searches', urgency: 'In the next few months', pc: 'BS1 6AA', region: 'South West', aud: 'business', pay: 'quote', grade: 'C', score: 53,
      tags: ['brand launch'], name: 'Felix Testwell', ph: '183', ch: 'Meta ads', biz: ['Example Pet Foods Ltd', '00021234', 'ltd', '2024-06-03', 'Bristol', ['Manufacture of food products']],
      summary: 'We have three possible brand names and want to know which ones are clear before we pick one.',
      qa: [['How many names do you want searched?', 'Three'], ['Which countries?', 'UK and EU'], ['Is any name in use yet?', 'No']] },
    { id: 2124, ago: 7 * D, area: 'trademarks', matter: 'cease-and-desist-letters', urgency: 'Within a month', pc: 'M4 1AA', region: 'North West', aud: 'business', pay: 'yes', grade: 'B', score: 71,
      tags: ['received letter'], name: 'Isla Example', ph: '184', ch: 'Google search', buy: [NORTH, 7 * D - 6e4, true, 'contacted', 6 * D], biz: ['Sample Apparel Ltd', '00022345', 'ltd', '2020-09-21', 'Manchester', ['Wholesale and retail trade']],
      summary: 'We received a cease and desist letter saying our clothing brand infringes theirs. We need a response drafted.',
      qa: [['Did you send or receive the letter?', 'Received'], ['What is the deadline to reply?', '14 days'], ['Is your brand registered?', 'Application pending']] },
    { id: 2125, ago: 12 * D, area: 'trademarks', matter: 'copyright', urgency: 'In the next few months', pc: 'BT7 1AA', region: 'Northern Ireland', pay: 'quote', grade: 'C', score: 45,
      tags: ['photography'], name: 'Ciara Notreal', ph: '185', ch: 'Direct or unknown', summary: 'A company is using my photographs on their website without permission or credit.',
      qa: [['What has been copied?', 'Photographs'], ['Who is using them?', 'A hotel website'], ['Have you asked them to stop?', 'Yes, no reply']] },
    { id: 2126, ago: 15 * D, area: 'trademarks', matter: 'design-rights', urgency: 'Within a month', pc: 'SO14 2AA', region: 'South East', aud: 'business', pay: 'yes', grade: 'B', score: 68,
      tags: ['product design'], name: 'Arthur Specimen', ph: '186', ch: 'Google search', buy: [ASHBY, 15 * D - 5 * 6e4, true, 'instructed', 9 * D, 2600], biz: ['Example Homeware Ltd', '00023456', 'ltd', '2017-03-30', 'Southampton', ['Manufacturing']],
      summary: 'A competitor has launched a near copy of our best selling lamp. We registered the design last year.',
      qa: [['Is the design registered?', 'Yes, in the UK'], ['What has been copied?', 'A lamp design'], ['Are the copies on sale?', 'Yes, online and in shops']] },
    { id: 2127, ago: 26 * D, area: 'trademarks', matter: 'trademark-renewals', urgency: 'Just looking into it', pc: 'IM1 1AA', region: 'Channel Islands and Isle of Man', aud: 'business', pay: 'quote', grade: 'C', score: 42,
      tags: ['renewal'], name: 'Hugo Example', ph: '187', ch: 'Direct or unknown', biz: ['Sample Holdings Ltd', '00024567', 'ltd', '2006-07-07', 'Douglas', ['Financial and insurance activities']],
      summary: 'Two of our trademarks come up for renewal next year and the owner name needs updating.',
      qa: [['What do you need?', 'Renewal and ownership update'], ['How many marks?', 'Two'], ['When are they due?', 'Next year']] },
    { id: 2128, ago: 45 * 6e4, area: 'trademarks', matter: 'other-ip', urgency: 'Within a month', pc: 'EH1 1AA', region: 'Scotland', aud: 'business', pay: 'yes', grade: 'B', score: 67,
      tags: ['domain name'], name: 'Morven Sample', ph: '188', ch: 'Meta ads', biz: ['Example Software Ltd', '00025678', 'ltd', '2015-01-19', 'Edinburgh', ['Information and communication']],
      summary: 'Someone has registered a domain name with our brand and is pointing it at a competitor.',
      qa: [['What is the issue?', 'A domain using our brand'], ['Is your brand registered?', 'Yes'], ['What is the domain being used for?', 'Redirecting to a competitor']] },
  ];
  const META = { c1: ['120210000000000001', 'Conveyancing and leases, London and South East'], c2: ['120210000000000002', 'Family law, England'], c3: ['120210000000000003', 'Immigration and motoring, test'] };
  const META_ADS = [
    ['120211000000000011', 'Moving home this year', '120212000000000101', 'London homeowners', 'c1', 0.6], ['120211000000000012', 'Short lease checklist', '120212000000000102', 'Flat owners', 'c1', 0.4],
    ['120211000000000021', 'Separating, what next', '120212000000000201', 'Parents 30 to 55', 'c2', 0.55], ['120211000000000022', 'Fair financial settlement', '120212000000000202', 'Homeowners 35 to 60', 'c2', 0.45],
    ['120211000000000031', 'Visa help, one firm', '120212000000000301', 'Recent movers', 'c3', 0.5], ['120211000000000032', 'Court date coming up', '120212000000000302', 'Drivers 25 to 60', 'c3', 0.5],
  ];
  const DAILY = { c1: 55, c2: 40, c3: 25 };
  const metaFor = (l) => { const c = l.area === 'conveyancing' || l.area === 'lease-extensions' ? 'c1' : l.area === 'family-law' ? 'c2' : 'c3'; const ad = META_ADS.filter((a) => a[4] === c)[l.id % 2]; return { c, ad }; };

  function build() {
    const S = { v: 5, firms: FIRMS(), leads: [], notes: [], returns: [], ledger: [], agreements: [], team: [], invites: [], audit: [], commission: [], pricing: null, waived: [KEST, ADMIN],
      blogKeys: [{ id: 'k1', name: 'Weekly blog run', created_at: iso(40 * D), last_used: iso(3 * D), posts: 5 }], crm: null, seq: { note: 1, ret: 1, ledger: 1, team: 1, ag: 1, comm: 1, act: 1, crm: 1, lead: 3000 } };
    const P = DEFAULT_PRICING;
    for (const x of LEADS) {
      const created = iso(x.ago), A = areaOf(x.area), aud = x.aud || 'individual';
      const [first, last] = x.name.split(' ');
      const l = { id: x.id, created_at: created, area: x.area, area_label: A.label, matter: x.matter, matter_label: matterLabel(x.area, x.matter), audience: aud, urgency: x.urgency,
        deadline: x.deadline ? dayAhead(x.deadline) : null, postcode: x.pc, postcode_district: x.pc ? x.pc.split(' ')[0] : null, postcode_area: x.pc ? x.pc.match(/^[A-Z]{1,2}/)[0] : null,
        region: x.region, country: ({ Wales: 'wales', Scotland: 'scotland', 'Northern Ireland': 'ni', 'Channel Islands and Isle of Man': 'crown', 'Outside the UK': 'outside' })[x.region] || 'england', location_source: x.pc ? 'postcode' : null,
        value_band: x.v?.[0] || null, value_label: x.v?.[1] || null, value_min: x.v?.[2] ?? null, value_max: x.v?.[3] ?? null, private_pay: x.pay || null,
        answers: x.qa.map(([q, a], i) => ({ id: `q${i + 1}`, q, a })), tags: x.tags || [], grade: x.grade, score: x.score, summary: x.summary,
        full_name: x.name, email: `${first}.${last}@example.com`.toLowerCase(), phone: `07700 900${x.ph}`,
        business_name: x.biz?.[0] || null, company_number: x.biz?.[1] || null,
        company: x.biz ? { number: x.biz[1], type: x.biz[2], status: 'active', incorporated: x.biz[3], address: `Unit 1, Example Business Park, ${x.biz[4]}`,
          profile: { title: x.biz[0].toUpperCase(), locality: x.biz[4], industries: x.biz[5], sic: [], accounts_overdue: false, confirmation_overdue: false, insolvency_history: false } } : null,
        checks: x.checks === 'bad' ? { phone: { allocated: false, reachable: false }, email: { result: 'risky' } } : x.checks === 'unknown' ? { phone: { allocated: true, reachable: null }, email: { result: 'valid' } }
          : { phone: { allocated: true, reachable: true, carrier: ['EE', 'Vodafone', 'O2', 'Three'][x.id % 4] }, email: { result: 'valid' } },
        flags: x.hidden || [], hidden_at: x.hidden ? created : null, form_version: '2026-11',
        consent: { terms: true, share: true, version: '2026-11', at: created, text: 'I agree to Leaflegal sharing my enquiry with one law firm that can help, which may contact me about it.' },
        source: { page: `https://leaflegal.co/${x.area}/${x.matter}`, referrer: x.ch === 'Google search' ? 'https://www.google.com/' : x.ch === 'Meta ads' ? 'https://m.facebook.com/' : '' },
        ch: x.ch, price: 0, list_price: null, price_fixed: false, buyer: null, bought_at: null, auto: false, stage: null, stage_at: null, instructed_value: null, archived_at: null, exclude_brokers: [] };
      if (x.ch === 'Meta ads') { const m = metaFor(l); l.meta = [META[m.c][0], m.ad[2], m.ad[0]]; l.source.utm = { utm_source: 'facebook', utm_medium: 'paid', utm_campaign: l.meta[0], utm_term: l.meta[1], utm_content: l.meta[2] }; }
      l.price = price(l, P);
      if (x.buy) {
        const [b, at, auto, stage, stageAgo, value] = x.buy, full = l.price, paid = !auto && !x.free && at < x.ago - 72 * H ? Math.ceil(full / 2) : full;
        Object.assign(l, { buyer: b, bought_at: iso(at), auto, stage, stage_at: stageAgo ? iso(stageAgo) : null, instructed_value: value || null, price: paid, list_price: paid !== full ? full : null });
        S.ledger.push(x.free ? { id: S.seq.ledger++, broker: b, created_at: iso(at), delta: 0, reason: 'Lead assigned by Leaflegal (no charge)', lead_id: l.id, ref: null, invoiced: null }
          : { id: S.seq.ledger++, broker: b, created_at: iso(at), delta: -paid, reason: auto ? 'Auto-bought lead' : paid !== full ? 'Bought lead (50% off)' : 'Bought lead', lead_id: l.id, ref: null, invoiced: null });
      }
      S.leads.push(l);
    }
    const note = (lead, body, msAgo) => S.notes.push({ id: S.seq.note++, lead_id: lead, broker: S.leads.find((l) => l.id === lead).buyer, body, created_at: iso(msAgo) });
    note(2041, 'Called the same day. Client instructed us on our fixed fee. Client care letter and referral fee disclosure sent.', 20 * D);
    note(2041, 'Searches ordered. Lender is happy with the lease length.', 12 * D);
    note(2042, 'Spoke on the phone. Conflict check clear. Initial meeting booked for Thursday.', 9 * D);
    note(2043, 'Left a voicemail and sent an email with our lease extension guide.', 4 * D);
    note(2045, 'Client went with the conveyancer their estate agent recommended.', 9 * D);
    note(2046, 'Video call with three of the leaseholders. Sending a fee estimate for the whole group.', 1 * D);
    note(2047, 'Initial call done. Checking the financial evidence before quoting.', 3 * D);
    const ret = (o) => S.returns.push({ id: S.seq.ret++, details: null, decision: null, decided_at: null, credits: null, ...o });
    ret({ lead_id: 2048, broker: BRIGHT, reason: 'Phone number is not in service', details: 'Called three times on different days and the number says it is not recognised.', status: 'pending', created_at: iso(20 * H) });
    ret({ lead_id: 2045, broker: FIRM, reason: 'They decided not to instruct a firm', details: 'Client chose the conveyancer the estate agent suggested.', status: 'rejected', decision: 'Declined automatically: not a refundable reason', decided_at: iso(14 * D), created_at: iso(14 * D) });
    // Credits: plan payments and invoiced plans.
    const top = (b, msAgo, delta, reason, ref, invoiced = null) => S.ledger.push({ id: S.seq.ledger++, broker: b, created_at: iso(msAgo), delta, reason, lead_id: null, ref, invoiced });
    top(FIRM, 118 * D, 1000, 'First month offer', 'in_demo_h1'); top(FIRM, 88 * D, 2500, 'Starter monthly plan', 'in_demo_h2'); top(FIRM, 58 * D, 2500, 'Starter monthly plan', 'in_demo_h3'); top(FIRM, 28 * D, 2500, 'Starter monthly plan', 'in_demo_h4');
    top(FIRM, 26 * D, -4950, 'Auto-bought lead', null); S.ledger[S.ledger.length - 1].reason = 'Auto-bought leads (earlier months)';
    top(BRIGHT, 88 * D, 2500, 'Starter monthly plan', 'in_demo_b1'); top(BRIGHT, 58 * D, 2500, 'Starter monthly plan', 'in_demo_b2'); top(BRIGHT, 28 * D, 2500, 'Starter monthly plan', 'in_demo_b3');
    top(MERID, 44 * D, 1000, 'First month offer', 'in_demo_m1'); top(MERID, 14 * D, 2500, 'Starter monthly plan', 'in_demo_m2');
    top(NORTH, 62 * D, 2000, 'Monthly credits: Invoiced 2,000', 'plan-north-1', 2000); top(NORTH, 32 * D, 2000, 'Monthly credits: Invoiced 2,000', 'plan-north-2', 2000); top(NORTH, 2 * D, 2000, 'Monthly credits: Invoiced 2,000', 'plan-north-3', 2000);
    top(KEST, 30 * D, 0, 'Commission plan started', 'plan-kest-1');
    const ag = (broker, msAgo, signer_name, signer_title, signer_email, company) => S.agreements.push({ id: S.seq.ag++, broker, version: TERMS_VERSION, created_at: iso(msAgo), signer_name, signer_title, signer_email, company });
    ag(FIRM, 119 * D, 'Eleanor Harper', 'Managing Partner', 'eleanor.harper@example.com', 'Harper & Lowe Solicitors LLP');
    ag(BRIGHT, 89 * D, 'Marcus Webb', 'Director', 'marcus.webb@example.com', 'Brightwater Conveyancing Ltd');
    ag(MERID, 44 * D, 'Anika Rao', 'Principal Adviser', 'anika.rao@example.com', 'Meridian Immigration Advisers');
    ag(NORTH, 62 * D, 'Daniel North', 'Partner', 'daniel.north@example.com', 'Northgate Legal LLP');
    S.team.push({ id: S.seq.team++, broker: FIRM, email: 'tom.example@example.com', name: 'Tom Example', perms: { buy: true, settings: false, billing: false, team: false }, invited_at: iso(60 * D), joined_at: iso(59 * D), removed_at: null });
    S.team.push({ id: S.seq.team++, broker: FIRM, email: 'nina.sample@example.com', name: 'Nina Sample', perms: { buy: true, settings: true, billing: false, team: false }, invited_at: iso(2 * D), joined_at: null, removed_at: null });
    const inv = (email, name, company, msAgo, o = {}) => S.invites.push({ email, name, company, send_at: null, expires_at: new Date(NOW - msAgo + 30 * D).toISOString(), alerts: true, digest: null, batch: null, created_at: iso(msAgo), email_id: 'sent', kind: 'warm', queued: false, paused: false, accepted: false, ...o });
    inv('hannah.placeholder@example.net', 'Hannah Placeholder', 'Placeholder Family Law', 3 * D);
    inv('owen.sample@example.net', 'Owen Sample', 'Sample & Co Solicitors', 6 * D, { kind: 'cold' });
    inv('zara.example@example.net', 'Zara Example', 'Example Immigration Chambers', 1 * D, { send_at: new Date(NOW + 20 * H).toISOString(), email_id: 're_demo_1' });
    const log = (msAgo, action, target, detail) => S.audit.push({ at: iso(msAgo), action, target, detail, brokers: { company: 'Leaflegal' } });
    log(20 * H, 'invite', 'zara.example@example.net', { name: 'Zara Example', company: 'Example Immigration Chambers' });
    log(2 * D, 'lead-assign', '2049', { broker: 'Kestrel Motoring Defence', charge: false });
    log(30 * D, 'regulator-check', KEST, { checked: true });
    log(30 * D, 'plan-create', KEST, { name: 'Commission', commission: true });
    log(40 * D, 'regulator-check', MERID, { checked: true });
    log(62 * D, 'plan-create', NORTH, { name: 'Invoiced 2,000', credits: 2000, price: 2000 });
    S.commission.push({ id: S.seq.comm++, broker: KEST, kind: 'commission', amount: 350, date: iso(6 * D).slice(0, 10), note: 'Commission on two instructed matters', channel: null, created_at: iso(6 * D) });
    S.commission.push({ id: S.seq.comm++, broker: null, kind: 'spend', amount: 220, date: iso(9 * D).slice(0, 10), note: 'LinkedIn test campaign', channel: 'LinkedIn', created_at: iso(9 * D) });
    S.crm = crmSeed();
    return S;
  }
  function crmSeed() {
    const c = (id, name, company, email, stage, source, msAgo, o = {}) => ({ id, created_at: iso(msAgo), updated_at: iso(Math.min(msAgo, o.upd ?? msAgo)), name, company, email, phone: o.phone || null, position: o.position || 'Partner',
      source, stage, stage_changed_at: iso(o.stageAgo ?? msAgo), value: o.value ?? null, leads_per_month: o.lpm ?? null, budget: o.budget ?? null, tags: o.tags || [], next_action: o.next || null,
      next_action_at: o.nextAt != null ? new Date(NOW + o.nextAt).toISOString() : null, last_contacted_at: o.last != null ? iso(o.last) : null, broker_id: o.broker || null, flows_paused: false, unsubscribed_at: null, lost_reason: o.lost || null });
    const contacts = [
      c(1, 'Eleanor Harper', 'Harper & Lowe Solicitors LLP', 'eleanor.harper@example.com', 'won', 'Website enquiry', 125 * D, { broker: FIRM, value: 2500, stageAgo: 118 * D, last: 20 * D, tags: ['Conveyancing', 'Family law'] }),
      c(2, 'Olivia Ashby', 'Ashby & Cole Family Solicitors', 'olivia.ashby@example.com', 'onboarding', 'Platform sign-up', 26 * H, { broker: ASHBY, value: 2500, next: 'Check SRA number and approve', nextAt: 2 * H, tags: ['Family law'] }),
      c(3, 'Hannah Placeholder', 'Placeholder Family Law', 'hannah.placeholder@example.net', 'contacted', 'Invited to platform', 3 * D, { last: 3 * D, next: 'Follow-up call', nextAt: -4 * H, tags: ['Platform invite', 'Warm invite'] }),
      c(4, 'Owen Sample', 'Sample & Co Solicitors', 'owen.sample@example.net', 'contacted', 'Invited to platform', 6 * D, { tags: ['Platform invite', 'Cold invite'] }),
      c(5, 'Grace Demo', 'Demo Street Conveyancing', 'grace.demo@example.net', 'call_booked', 'LinkedIn outreach', 9 * D, { value: 5000, lpm: 60, next: 'Discovery call', nextAt: 1 * D, last: 2 * D, tags: ['Conveyancing'] }),
      c(6, 'Ian Specimen', 'Specimen Motoring Law', 'ian.specimen@example.net', 'proposal', 'Referral', 14 * D, { value: 2500, last: 4 * D, next: 'Chase proposal', nextAt: 2 * D, tags: ['Motoring offences'] }),
      c(7, 'Fiona Example', 'Example Licensing Partners', 'fiona.example@example.net', 'nurture', 'Cold email', 40 * D, { last: 30 * D, tags: ['Licensing'] }),
      c(8, 'Ben Notreal', 'Notreal Legal', 'ben.notreal@example.net', 'lost', 'Google search', 50 * D, { lost: 'Not taking on new work this year', last: 35 * D }),
    ];
    const activities = [
      { id: 1, contact_id: 5, created_at: iso(2 * D), kind: 'call', subject: 'Intro call', body: 'Interested in London conveyancing leads, wants to see sample enquiries.' },
      { id: 2, contact_id: 6, created_at: iso(4 * D), kind: 'email', subject: 'Leaflegal proposal', body: 'Sent the Starter plan proposal with sample motoring leads.' },
      { id: 3, contact_id: 3, created_at: iso(3 * D), kind: 'note', subject: null, body: 'Met at the regional law society event. Keen on child arrangements work.' },
      { id: 4, contact_id: 2, created_at: iso(26 * H), kind: 'system', subject: 'Created a Leaflegal Platform account', body: null },
    ];
    return { contacts, activities, seq: 10 };
  }

  let S = null;
  try { const raw = JSON.parse(sessionStorage.getItem(SK) || 'null'); if (raw?.v === 5) S = raw; } catch {}
  if (!S) S = build();
  const save = () => { try { sessionStorage.setItem(SK, JSON.stringify(S)); } catch {} };
  save();

  // ------------------------------------------------ helpers over the state
  const nowIso = () => new Date().toISOString();
  const byId = (id) => S.firms.find((b) => b.id === id);
  const lead = (id) => S.leads.find((l) => l.id === Number(id));
  const P = () => mergePricing(S.pricing);
  const signed = (id) => S.waived.includes(id) || S.agreements.some((a) => a.broker === id && a.version === TERMS_VERSION);
  const excluded = (l, id) => (l.exclude_brokers || []).includes(id);
  const listed = (uid) => S.leads.filter((l) => !l.buyer && !l.hidden_at && !excluded(l, uid) && (Date.now() - new Date(l.created_at) < 30 * D || l.price_fixed)).sort((a, z) => z.created_at.localeCompare(a.created_at));
  const addLedger = (broker, delta, reason, lead_id = null, ref = null, invoiced = null) => { const b = byId(broker); if (b) b.credits += delta;
    S.ledger.push({ id: S.seq.ledger++, broker, created_at: nowIso(), delta, reason, lead_id, ref, invoiced }); };
  const ledgerOf = (id) => S.ledger.filter((e) => e.broker === id).sort((a, z) => z.created_at.localeCompare(a.created_at) || z.id - a.id);
  const ledgerOut = (e) => ({ created_at: e.created_at, delta: e.delta, reason: e.reason, lead_id: e.lead_id, ...(e.invoiced ? { invoiced: e.invoiced } : {}) });
  const audit = (action, target, detail) => S.audit.unshift({ at: nowIso(), action, target: String(target ?? ''), detail, brokers: { company: 'Leaflegal' } });
  // Same as the buy_lead database function: 72 hour discount unless priced by hand.
  function buyLead(id, b, auto) {
    const l = lead(id);
    if (!l || l.buyer || l.hidden_at || excluded(l, b.id)) return false;
    const list0 = l.price, p = !l.price_fixed && Date.now() - new Date(l.created_at) > 72 * H ? Math.max(1, Math.ceil(list0 * 0.5)) : list0;
    if (!b.approved || b.suspended_at || b.credits < p) return false;
    Object.assign(l, { buyer: b.id, bought_at: nowIso(), auto, price: p, list_price: p !== list0 ? list0 : l.price_fixed ? l.list_price : null, stage: 'new', stage_at: null });
    addLedger(b.id, -p, auto ? 'Auto-bought lead' : p !== list0 ? 'Bought lead (50% off)' : 'Bought lead', l.id);
    if (auto) b.last_auto_at = nowIso();
    return true;
  }
  const subOf = (b) => {
    const s = { cus_demo_harper: ['Starter', 2500, 2500, 2], cus_demo_bright: ['Starter', 2500, 2500, 2], cus_demo_meridian: ['Starter', 2500, 2500, 16] }[b?.stripe_customer];
    return s ? { plan: s[0], credits: s[1], pounds: s[2], status: 'active', renews: new Date(NOW + s[3] * D).toISOString(), cancelling: !!b.cancelling, trial: false } : null;
  };
  const regulatorsOut = (b) => list(b?.regulators).filter((r) => r && regulatorOf(r.id)).map((r) => ({ id: r.id, number: r.number || '', label: regulatorOf(r.id).label, register: REGISTER[r.id] }));
  const cleanRegulators = (v) => { const seen = new Set(), out = [];
    for (const r of list(v)) { const id = String(r?.id || '').toUpperCase(), n = String(r?.number || '').trim().slice(0, 30); if (regulatorOf(id) && n && !seen.has(id)) { seen.add(id); out.push({ id, number: n }); } }
    return out.length ? out : null; };
  const sub = (v, allowed) => list(v).filter((x) => allowed.includes(x));
  const money = (v) => { const n = Math.round(Number(String(v ?? '').replace(/[^\d.]/g, ''))); return n > 0 ? n : null; };
  const tagsIn = (v) => [...new Set(list(v).map((t) => String(t || '').trim().toLowerCase().slice(0, 40)).filter((t) => /^[a-z0-9][a-z0-9 -]*$/.test(t)))].slice(0, 30);
  function cleanFilters(f = {}, b = {}) {
    const allowed = allowedAreas(regIds(b)), areas = sub(f.areas, TAX.areas.map((a) => a.slug)).filter((a) => allowed.includes(a)), matters = {};
    for (const a of areas) { const known = (areaOf(a)?.matters || []).map(([m]) => m), ms = sub(f.matters?.[a], known); if (ms.length) matters[a] = ms; }
    const postcodeAreas = [...new Set(list(f.postcodeAreas).map((x) => String(x || '').trim().toUpperCase()).filter((x) => /^[A-Z]{1,2}$/.test(x)))].slice(0, 130);
    const valueMin = money(f.valueMin), valueMax = money(f.valueMax);
    return { areas, matters, regions: sub(f.regions, TAX.regions), postcodeAreas, audiences: sub(f.audiences, TAX.audiences.map(([k]) => k)), urgencies: sub(f.urgencies, TAX.urgency),
      grades: sub(f.grades, TAX.grades), privatePayOnly: !!f.privatePayOnly, valueMin, valueMax: valueMin && valueMax && valueMax < valueMin ? null : valueMax,
      tagsAny: tagsIn(f.tagsAny), tagsNone: tagsIn(f.tagsNone), dailyLeads: money(f.dailyLeads), dailyCredits: money(f.dailyCredits), maxPrice: money(f.maxPrice) };
  }
  function missedSummary(b, leads) {
    const missed = [], G = {};
    for (const l of leads) { if (!canTake(b, l)) continue; const why = missGroups(b.filters || {}, l); if (!why.length) continue;
      missed.push({ l, why }); for (const w of why) { const g = (G[w.label] ||= { ...w, n: 0, only: 0 }); g.n++; if (why.length === 1) g.only++; } }
    const status = (l) => (l.buyer === b.id ? 'mine' : l.buyer ? 'sold' : 'live');
    return { missed, groups: Object.values(G).sort((x, y) => y.only - x.only || y.n - x.n),
      sold: missed.filter((m) => status(m.l) === 'sold').length, mine: missed.filter((m) => status(m.l) === 'mine').length, live: missed.filter((m) => status(m.l) === 'live').length };
  }
  const backlogOf = (b) => { const f = b.filters || {};
    return listed(b.id).filter((l) => { const c = l.checks || {}; return fits(b, l) && !(c.phone?.allocated === false || c.phone?.reachable === false || c.email?.result === 'undeliverable') && (!f.maxPrice || salePrice(l).price <= f.maxPrice); })
      .map((l) => ({ id: l.id, price: salePrice(l).price })); };
  const autoSpend = (id) => { const m = new Date(); m.setUTCDate(1); m.setUTCHours(0, 0, 0, 0);
    return -S.ledger.filter((e) => e.broker === id && e.reason === 'Auto-bought lead' && new Date(e.created_at) >= m).reduce((a, e) => a + e.delta, 0); };
  const quality = (l) => (Number.isFinite(l?.score) ? l.score : null);
  const origin = (l) => l.ch === 'Meta ads' ? { channel: 'Meta ads', campaign: l.meta?.[0] || null, campaign_name: Object.values(META).find(([id]) => id === l.meta?.[0])?.[1] || null,
    adset: META_ADS.find((a) => a[2] === l.meta?.[1])?.[3] || null, ad: META_ADS.find((a) => a[0] === l.meta?.[2])?.[1] || null } : { channel: l.ch || 'Direct or unknown', campaign: null, campaign_name: null, adset: null, ad: null };
  const commissionIds = () => new Set(S.firms.filter((b) => b.plan?.commission).map((b) => b.id));
  const withPaid = (l) => { if (!l.buyer) return l; const comm = commissionIds().has(l.buyer);
    const mine = S.ledger.filter((m) => m.broker === l.buyer && (m.lead_id === l.id || m.reason === `Refund for lead #${l.id}`) && (m.delta < 0 || /^Refund/.test(m.reason)));
    const got = mine.reduce((a, m) => a - m.delta, 0), paid = comm ? 0 : Math.max(0, got);
    return { ...l, paid, paid_why: comm ? 'commission' : paid ? null : mine.some((m) => m.delta > 0) ? 'refunded' : 'free' }; };
  const adCost = (l) => (l.ch === 'Meta ads' ? { ad_cost: Math.round((18 + (l.id % 7) * 3.4) * 100) / 100, ad_by: 'campaign' } : {});

  // A tiny one-page PDF (Helvetica, plain ASCII) for agreement downloads.
  function pdf(lines) {
    const esc = (s) => String(s).replace(/[^\x20-\x7e]/g, '').replace(/[\\()]/g, '\\$&');
    const body = ['BT', '/F1 11 Tf', ...lines.map((t, i) => `1 0 0 1 56 ${780 - i * 18} Tm (${esc(t)}) Tj`), 'ET'].join('\n');
    const objs = ['<< /Type /Catalog /Pages 2 0 R >>', '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
      '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
      '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>', `<< /Length ${body.length} >>\nstream\n${body}\nendstream`];
    let out = '%PDF-1.4\n'; const offs = [];
    objs.forEach((o, i) => { offs.push(out.length); out += `${i + 1} 0 obj\n${o}\nendobj\n`; });
    const x = out.length;
    out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n${offs.map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('')}trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${x}\n%%EOF`;
    return out;
  }
  const agreementPdf = (a) => pdf(['Leaflegal Law Firm Referral Agreement', '', 'DEMO COPY WITH SAMPLE DATA. NOT A REAL AGREEMENT.', '',
    `Reference  LL-RA-${String(a.id).padStart(5, '0')}`, `Version  ${a.version}`, `Firm  ${a.company}`, `Accepted by  ${a.signer_name}, ${a.signer_title}`,
    `Date  ${new Date(a.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`, '', 'The live platform attaches the full signed agreement here.']);

  // Public profile previews (what a matched client sees), simplified from matchedPreviews in api/_lib/platform.js.
  function previews(b, p) {
    const e = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const on = (k) => (p.show?.[k] !== false && p[k] ? p[k] : null), name = p.name || b.company, who = on('person');
    const lines = [on('phone') && `Call ${on('phone')}`, on('whatsapp') && `WhatsApp ${on('whatsapp')}`, on('email') && `Email ${on('email')}`, on('website') && `Website ${String(on('website')).replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}`].filter(Boolean);
    const shell = (inner, bg = '#f4f7f5') => `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;background:${bg};font:15px/1.5 system-ui,-apple-system,sans-serif;color:#1b3329}.w{max-width:600px;margin:40px auto;padding:36px;background:#fff;border-radius:24px;box-shadow:0 24px 60px rgba(20,39,31,.08)}h2{margin:0 0 8px;font-size:24px}.m{margin-top:20px;padding:20px;border:1px solid #e2ebe7;border-radius:16px}.m b{font-size:18px}.t{display:inline-block;font-size:12px;font-weight:700;color:#3d6656;text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px}ul{padding-left:18px}.n{margin-top:18px;font-size:13px;color:#5d7a6e}</style></head><body>${inner}</body></html>`;
    const card = `<div class="m"><span class="t">Your law firm</span><br>${p.logo ? `<img src="${e(p.logo)}" alt="" style="max-width:180px;max-height:64px;display:block;margin:6px 0">` : ''}<b>${e(name)}</b>${who ? `<div>${e(who)}${p.role ? `, ${e(p.role)}` : ''}</div>` : ''}${p.about ? `<p>${e(p.about)}</p>` : ''}${lines.length ? `<ul>${lines.map((x) => `<li>${e(x)}</li>`).join('')}</ul>` : ''}</div>`;
    const sms = `Hi Sam, thanks for your enquiry with Leaflegal. We've matched you with ${name}, a law firm, and ${who ? who.split(' ')[0] : name} will be in touch shortly.${lines.length ? '\n\n' + lines.join('\n') : ''}\n\nThe firm will explain its fees before you agree to anything. Leaflegal receives a fee from the firm for the introduction. Leaflegal`;
    const chat = (bg, bubble, head, label) => shell(`<div style="background:${head};color:#fff;padding:12px 16px;font-weight:600">Leaflegal <span style="font-weight:400;opacity:.8;font-size:12px">${label}</span></div><div style="padding:22px 16px"><div style="max-width:82%;padding:9px 12px;border-radius:12px;background:${bubble};white-space:pre-wrap">${e(sms)}</div></div>`, bg);
    return { page: shell(`<div class="w"><h2>Thanks, Sam. We've matched you with ${e(name)}.</h2><p>${e(who || 'They')} will be in touch shortly, usually by phone. We've emailed you their details too.</p>${card}<p class="n">Sample confirmation page shown in the demo.</p></div>`),
      email: shell(`<div class="w"><h2>You've been matched with ${e(name)}</h2><p>Hi Sam, thanks for your enquiry. ${e(name)} will contact you shortly. The firm will explain its fees before you agree to anything. Leaflegal receives a fee from the firm for the introduction.</p>${card}</div>`, '#f3f5f4'),
      subject: `You've been matched with ${name}`, whatsapp: chat('#efeae2', '#fff', '#075e54', 'Business account'), sms: chat('#fff', '#e9e9eb', '#3a3a3c', 'Text message') };
  }
  const cleanProfile = (p = {}, old = {}) => { const clip = (v, n) => String(v ?? '').trim().slice(0, n);
    const url = (v) => { v = clip(v, 200); if (!v) return ''; if (!/^https?:\/\//i.test(v)) v = `https://${v}`; try { const u = new URL(v); return u.hostname.includes('.') ? u.href : ''; } catch { return ''; } };
    const tel = (v) => clip(v, 30).replace(/[^\d+ ()-]/g, ''), mail = (v) => { v = clip(v, 120); return /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(v) ? v : ''; };
    return { name: clip(p.name, 120), person: clip(p.person, 80), role: clip(p.role, 80), about: clip(p.about, 240), website: url(p.website), phone: tel(p.phone), whatsapp: tel(p.whatsapp), sms: tel(p.sms), email: mail(p.email),
      logo: p.removeLogo ? '' : old.logo || '', logoW: p.removeLogo ? 0 : old.logoW || 0, logoH: p.removeLogo ? 0 : old.logoH || 0,
      show: Object.fromEntries(['person', 'website', 'phone', 'whatsapp', 'sms', 'email'].map((k) => [k, p.show?.[k] !== false])) }; };

  // ------------------------------------------------ /api/platform
  class Fail extends Error { constructor(status, msg) { super(msg); this.status = status; } }
  const fail = (status, msg) => { throw new Fail(status, msg); };
  const DEMO_EMAILS = () => ({ built: iso(2 * D), emails: [
    { label: 'New lead alert (to the firm)', to: 'intake@example.com', subject: 'New lead: Child arrangements, South East (75 credits)', html: mail('New lead: Child arrangements', 'A new enquiry fits the firm’s criteria. Grade A, South East, needed urgently. Open the platform to see the answers and buy it before another firm does.') },
    { label: 'Lead delivery (to the firm)', to: 'intake@example.com', subject: 'New lead: Riley Sample, First time buyer', html: mail('Riley Sample, First time buyer', 'The full contact details and answers are below. Call quickly, check for conflicts before discussing the matter, send the referral fee disclosure in writing and update the stage on My leads.') },
    { label: 'Matched email (to the client)', to: 'riley.sample@example.com', subject: 'You’ve been matched with Harper & Lowe Solicitors', html: mail('You’ve been matched with Harper & Lowe Solicitors', 'The firm will contact you shortly and will explain its fees before you agree to anything. Leaflegal receives a fee from the firm for the introduction.') },
    { label: 'Refund decision (to the firm)', to: 'marcus.webb@example.com', subject: 'Refund approved: lead #2048', html: mail('Refund approved', 'We’ve looked into lead #2048 and agree it should be refunded. The credits are back on your balance and ready to use.') },
  ] });
  function mail(title, text) {
    return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:32px 12px;background:#f3f5f4;font:15px/1.6 system-ui,-apple-system,sans-serif;color:#1b3329"><div style="max-width:560px;margin:0 auto;background:#fff;border-radius:20px;padding:36px"><div style="font-weight:800;color:#244237;margin-bottom:18px">Leaflegal</div><h1 style="font-size:22px;margin:0 0 12px">${title}</h1><p>${text}</p><p style="color:#5d7a6e;font-size:13px;margin-top:28px">Sample email shown in the demo.</p></div></body></html>`;
  }

  function platformApi(action, q, body, method, uid) {
    const POST = method === 'POST';
    // ---- public
    if (action === 'config') return { turnstile: null, supabaseUrl: 'https://qrdpvsqsfifmgkxinank.supabase.co', supabaseKey: 'sb_publishable_vZL7kU5KjOGWKSfcAAsnbg_9p9BBTUM' };
    if (action === 'taxonomy') return TAX;
    if (action === 'pricing') return { pricing: P() };
    if (action === 'terms') return { version: TERMS_VERSION, html: '<h2>Law Firm Referral Agreement</h2><p><b>Demo copy with sample data.</b> The live platform shows the full agreement here for the firm to read and accept.</p><p>Leaflegal is an introducer, not a law firm, and gives no legal advice. The firm must stay authorised by its regulator, tell clients about the referral fee in writing and decide for itself whether to take on each matter.</p>' };
    if (action === 'handoff') return {};
    if (action === 'join') fail(404, 'This invite has expired or was already used. Ask for a new one.');
    if (action === 'signup') fail(400, 'This is a demo, so new accounts can’t be created. Sign in with any email and password to look around.');
    // ---- signed in
    if (!uid) fail(401, 'Please sign in');
    let me = byId(uid);
    if (!me) fail(403, 'No firm account');
    const asId = q.get('as');
    if (asId) { if (!me.is_admin) fail(403, 'Admins only'); me = byId(asId) || fail(404, 'Firm not found'); }
    const id = me.id, restricted = !!me.plan?.commission && !asId;

    if (action === 'me') {
      const { stripe_customer, cancelling, ...pub } = JSON.parse(JSON.stringify(me));
      if (pub.plan?.commission) delete pub.plan.commission;
      const ag = S.agreements.filter((a) => a.broker === id).sort((a, z) => z.created_at.localeCompare(a.created_at))[0];
      pub.agreement = ag ? { id: ag.id, version: ag.version, created_at: ag.created_at } : null; pub.agreementWaived = S.waived.includes(id); pub.agreementCurrent = ag?.version === TERMS_VERSION || pub.agreementWaived;
      pub.allowedAreas = allowedAreas(regIds(me)); pub.restricted = restricted; pub.member = null; pub.trialEligible = !me.trial_used && !stripe_customer;
      const prices = S.leads.filter((l) => Date.now() - new Date(l.created_at) < 90 * D).map((l) => l.list_price || l.price);
      return { broker: { ...pub, billing: !!stripe_customer }, lowCredits: LOW_CREDITS, packs: PACKS, custom: CUSTOM, trial: TRIAL, termsVersion: TERMS_VERSION,
        pricing: { ...P(), avgLead: prices.length ? Math.round(prices.reduce((a, x) => a + x, 0) / prices.length) : 45 }, taxonomy: TAX,
        options: { returnReasons: RETURN_REASONS, cancelReasons: CANCEL_REASONS, returnHours: RETURN_HOURS } };
    }
    if (action === 'opportunities') return { discount: DISCOUNT, preview: !me.approved, leads: listed(id).filter((l) => canTake(me, l)).map((l) => ({ ...withMask(l, me.approved), quality: quality(l), match: matches(me.filters || {}, l) })) };
    if (action === 'missed') {
      const since = Math.max(Date.now() - 30 * D, new Date(me.created_at).getTime());
      const leads = S.leads.filter((l) => new Date(l.created_at) >= since && !excluded(l, id)), M = missedSummary(me, leads);
      return { days: 30, total: leads.length, missed: M.missed.length, sold: M.sold, mine: M.mine, live: M.live, groups: M.groups.slice(0, 8) };
    }
    if (action === 'leads') {
      return { leads: S.leads.filter((l) => l.buyer === id).sort((a, z) => z.bought_at.localeCompare(a.bought_at)).map((l) => { const r = S.returns.find((x) => x.lead_id === l.id && x.broker === id);
        return { ...leadOut(l), notes: S.notes.filter((n) => n.lead_id === l.id).map(({ body: b, created_at }) => ({ body: b, created_at })),
          refund: r ? { lead_id: r.lead_id, status: r.status, reason: r.reason, decision: r.decision, created_at: r.created_at } : null,
          refundable: !r && Date.now() - new Date(l.bought_at) < RETURN_HOURS * H }; }) };
    }
    if (action === 'leads-exported' && POST) { me.leads_exported_at = nowIso(); return { ok: true, at: me.leads_exported_at }; }
    if (action === 'dashboard') {
      const month = new Date(); month.setUTCDate(1); month.setUTCHours(0, 0, 0, 0);
      const mine = S.leads.filter((l) => l.buyer === id), live = listed(id).filter((l) => canTake(me, l)).map((l) => ({ ...withMask(l, me.approved), quality: quality(l) }));
      const thisMonth = mine.filter((l) => new Date(l.bought_at) >= month);
      const days = Array.from({ length: 30 }, (_, i) => ({ day: new Date(Date.now() - (29 - i) * D).toISOString().slice(0, 10), n: 0 }));
      for (const l of mine) { const d = days.find((x) => x.day === String(l.bought_at).slice(0, 10)); if (d) d.n++; }
      const stages = Object.fromEntries(STAGES.map((k) => [k, mine.filter((l) => l.stage === k).length]));
      const f = me.filters || {}, matching = live.filter((l) => matches(f, l)).map((l) => ({ ...l, match: true }));
      return { credits: me.credits, mode: me.mode, monthly_cap: me.monthly_cap, auto_spend: autoSpend(id),
        month: { leads: thisMonth.length, spent: thisMonth.reduce((a, l) => a + l.price, 0), auto: thisMonth.filter((l) => l.auto).length },
        total: { leads: mine.length, instructed: stages.instructed, instructed_value: mine.reduce((a, l) => a + (l.stage === 'instructed' ? l.instructed_value || 0 : 0), 0) },
        live: live.length, matching: matching.length, top: matching.concat(live.filter((l) => !matches(f, l)).map((l) => ({ ...l, match: false }))).slice(0, 3),
        days, stages, recent: ledgerOf(id).slice(0, 8).map(ledgerOut) };
    }
    if (action === 'stage' && POST) {
      if (!STAGES.includes(body.stage)) fail(400, 'Unknown stage');
      const l = S.leads.find((x) => x.id === Number(body.id) && x.buyer === id) || fail(404, 'Lead not found');
      const fee = body.instructed_value ?? body.funded_amount;
      Object.assign(l, { stage: body.stage, stage_at: nowIso(), ...(body.stage === 'instructed' ? { instructed_value: Math.max(0, Math.round(Number(fee) || 0)) || null } : {}) });
      return { ok: true, stage: l.stage, instructed_value: l.instructed_value };
    }
    if (action === 'archive' && POST) { const l = S.leads.find((x) => x.id === Number(body.id) && x.buyer === id) || fail(404, 'Lead not found'); l.archived_at = body.archived ? nowIso() : null; return { ok: true, archived_at: l.archived_at }; }
    if (action === 'note' && POST) {
      const text = String(body.body || '').trim().slice(0, 2000); if (!text) fail(400, 'Write a note first');
      const l = S.leads.find((x) => x.id === Number(body.id) && x.buyer === id) || fail(404, 'Lead not found');
      const n = { id: S.seq.note++, lead_id: l.id, broker: id, body: text, created_at: nowIso() }; S.notes.push(n);
      return { note: { body: n.body, created_at: n.created_at } };
    }
    if (action === 'refund' && POST) {
      const rr = RETURN_REASONS.find((x) => x.reason === body.reason) || fail(400, 'Choose a reason');
      if (rr.kind === 'review' && String(body.details || '').trim().length < 10) fail(400, 'Tell us what happened so we can look into it');
      const l = S.leads.find((x) => x.id === Number(body.id) && x.buyer === id) || fail(404, 'Lead not found');
      if (Date.now() - new Date(l.bought_at) > RETURN_HOURS * H) fail(400, `Refunds must be requested within ${RETURN_HOURS} hours of purchase`);
      if (S.returns.some((r) => r.lead_id === l.id && r.broker === id)) fail(409, 'A refund has already been requested for this lead');
      const r = { id: S.seq.ret++, lead_id: l.id, broker: id, reason: body.reason, details: String(body.details || '').slice(0, 1000) || null, status: 'pending', decision: null, decided_at: null, credits: null, created_at: nowIso() };
      if (rr.kind === 'no') { Object.assign(r, { status: 'rejected', decision: 'Declined automatically: not a refundable reason', decided_at: nowIso() }); S.returns.unshift(r); return { ok: true, declined: true, note: rr.note }; }
      S.returns.unshift(r); return { ok: true };
    }
    if (action === 'ledger') return { entries: ledgerOf(id).slice(0, 200).map(ledgerOut) };
    if (action === 'buy' && POST) {
      if (restricted) fail(403, 'Leads for this account are assigned by Leaflegal. Contact hello@leaflegal.co if one here looks right for you.');
      if (me.suspended_at) fail(403, 'Your account is suspended. Please contact hello@leaflegal.co.');
      if (!me.approved) fail(403, 'Your account is waiting for approval');
      if (!signed(id)) fail(403, 'Please sign the referral agreement first (Account → Referral agreement)');
      const l = lead(body.id);
      if (l?.hidden_at || (l && excluded(l, id))) fail(409, 'Sorry, this lead is no longer available');
      if (l && !canTake(me, l)) fail(403, 'The regulators on your account don’t cover this practice area. Add your regulator under Account if they do.');
      if (!buyLead(body.id, me, false)) { if (!l || l.buyer) fail(409, 'Sorry, this lead has just been taken'); fail(402, `You need ${salePrice(l).price} credits for this lead. Upgrade your plan under Billing to get more credits.`); }
      return { lead: leadOut(l) };
    }
    if (action === 'backlog') {
      if (restricted) fail(403, 'Leads for this account are assigned by Leaflegal.');
      const canBuy = me.approved && !me.suspended_at && !me.plan?.commission && signed(id);
      if (!POST) { const bl = backlogOf(me); return { count: bl.length, credits: bl.reduce((a, x) => a + x.price, 0), have: me.credits, now: canBuy && me.credits > 0 }; }
      if (!body.want) { me.backlog_at = null; return { ok: true }; }
      if (!canBuy || me.credits <= 0) { me.backlog_at = nowIso(); return { pending: true }; }
      const bl = backlogOf(me); let bought = 0, spent = 0, used = autoSpend(id);
      for (const x of bl) { if (x.price > me.credits || (me.monthly_cap && used + x.price > me.monthly_cap)) continue; if (!buyLead(x.id, me, true)) continue; const p = lead(x.id).price; bought++; spent += p; used += p; }
      me.backlog_at = null; return { bought, spent, left: bl.length - bought };
    }
    if (action === 'profile' && POST) { me.profile = cleanProfile(body, me.profile || {}); return { profile: me.profile }; }
    if (action === 'profile-logo' && POST) {
      const m = /^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(String(body.data || ''));
      if (!m) fail(400, 'Please choose a PNG, JPG, SVG or WebP image');
      if (String(body.data).length > 700000) fail(400, 'That logo is too large. Please try a smaller image.');
      const img = new Image(); img.src = body.data;
      me.profile = { ...(me.profile || {}), logo: body.data, logoW: img.naturalWidth || 180, logoH: img.naturalHeight || 64 }; return { profile: me.profile };
    }
    if (action === 'profile-preview' && POST) return previews(me, cleanProfile(body, me.profile || {}));
    if (action === 'profile-scan' && POST) fail(400, 'Website look-ups don’t run in the demo. Fill in the details by hand to see the preview change.');
    if (action === 'team') {
      return { owner: { email: me.email, name: me.contact_name }, perms: PERMS,
        members: S.team.filter((m) => m.broker === id && !m.removed_at).map((m) => ({ id: m.id, email: m.email, name: m.name, perms: { ...m.perms }, invited_at: m.invited_at, joined_at: m.joined_at, expired: !m.joined_at && Date.now() - new Date(m.invited_at) > 14 * D })) };
    }
    if (action === 'team-invite' && POST) fail(400, NO_SEND);
    if (action === 'team-update' && POST) { const m = S.team.find((x) => x.id === Number(body.id) && x.broker === id && !x.removed_at) || fail(404, 'User not found'); m.perms = Object.fromEntries(Object.keys(PERMS).map((k) => [k, !!body.perms?.[k]])); return { ok: true }; }
    if (action === 'team-remove' && POST) { const m = S.team.find((x) => x.id === Number(body.id) && x.broker === id && !x.removed_at) || fail(404, 'User not found'); m.removed_at = nowIso(); return { ok: true }; }
    if (action === 'settings' && POST) {
      if (restricted) { body.mode = me.mode; body.monthly_cap = me.monthly_cap; body.filters = { ...(me.filters || {}), suggest: body.filters?.suggest ?? body.suggest, missed: body.filters?.missed ?? body.missed }; }
      const emails = (v, what) => { if (v === undefined) return undefined;
        const l2 = [...new Set((Array.isArray(v) ? v : String(v || '').split(/[,;\s]+/)).map((e) => String(e).trim().toLowerCase()).filter(Boolean))];
        const bad = l2.find((e) => !/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(e)); if (bad) fail(400, `${bad} isn’t a valid email address`);
        if (l2.length > 10) fail(400, `Add up to 10 ${what} emails`); return l2.join(', ') || null; };
      const hooks = body.webhook_urls !== undefined ? body.webhook_urls : body.webhook_url !== undefined ? [body.webhook_url] : undefined;
      let webhookList;
      if (hooks !== undefined) { webhookList = [...new Set(list(Array.isArray(hooks) ? hooks : [hooks]).map((w) => String(w || '').trim()).filter(Boolean))];
        if (webhookList.length > 5) fail(400, 'Add up to 5 webhooks');
        for (const w of webhookList) { let ok = false; try { const u = new URL(w); ok = u.protocol === 'https:' && u.hostname.includes('.') && !/^(localhost|127\.|10\.|192\.168\.)/.test(u.hostname); } catch {} if (!ok) fail(400, `${w.slice(0, 80)} isn’t a public https:// address`); } }
      let secret; if (body.webhook_secret !== undefined) { secret = String(body.webhook_secret || '').trim() || null; if (secret && (secret.length < 16 || secret.length > 200 || /\s/.test(secret))) fail(400, 'The signing secret must be 16 to 200 characters with no spaces'); }
      let hubspot; if (body.hubspot !== undefined) { const t = String(body.hubspot?.form || '').trim(); const m = t.match(/(\d{5,})\D+([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
        hubspot = t ? (m ? { portal: m[1], form: m[2], on: body.hubspot.on !== false } : fail(400, 'Paste the HubSpot form’s embed code or its editor link (it contains the account ID and form ID)')) : null; }
      let pipedrive; if (body.pipedrive !== undefined) { const t = String(body.pipedrive?.token || '').trim();
        pipedrive = t ? (/^[0-9a-f]{40}$/i.test(t) ? { token: t.toLowerCase(), on: body.pipedrive.on !== false } : fail(400, 'The Pipedrive API token is 40 letters and numbers. Find it in Pipedrive under Settings, Personal preferences, API')) : null; }
      const notifyEmails = emails(body.notify_emails, 'alert'), deliverEmails = emails(body.deliver_emails, 'delivery');
      Object.assign(me, { mode: body.mode === 'auto' ? 'auto' : 'manual', monthly_cap: Math.max(0, Math.round(Number(body.monthly_cap) || 0)),
        ...(body.notify !== undefined ? { notify: body.notify !== false } : {}), ...(notifyEmails !== undefined ? { notify_emails: notifyEmails } : {}),
        ...(body.deliver_on !== undefined ? { deliver_on: body.deliver_on !== false } : {}), ...(deliverEmails !== undefined ? { deliver_emails: deliverEmails } : {}),
        ...(body.webhook_on !== undefined ? { webhook_on: body.webhook_on !== false } : {}), ...(webhookList !== undefined ? { webhook_urls: webhookList, webhook_url: webhookList[0] || null } : {}),
        ...(hubspot !== undefined ? { hubspot } : {}), ...(pipedrive !== undefined ? { pipedrive } : {}), ...(secret !== undefined ? { webhook_secret: secret } : {}),
        filters: { ...cleanFilters(body.filters || {}, me), suggest: ['instant', 'daily', 'off'].includes(body.suggest) ? body.suggest : me.filters?.suggest || 'instant',
          missed: body.missed === 'off' || (body.missed === undefined && me.filters?.missed === 'off') ? 'off' : 'on' },
        ...(body.company ? { company: String(body.company).slice(0, 120) } : {}), ...(body.phone !== undefined ? { phone: String(body.phone).slice(0, 40) } : {}) });
      return { ok: true, filters: me.filters, hubspot: me.hubspot, pipedrive: me.pipedrive };
    }
    if (action === 'test-webhook' && POST) fail(400, 'This is a demo, so no test lead is sent. Webhooks, HubSpot and Pipedrive work once the platform is live.');
    if (['checkout', 'change-plan', 'cancel-plan', 'resume-plan', 'billing', 'coupon', 'enterprise-request'].includes(action) && POST) fail(400, NO_PAY);
    if (action === 'subscription') return { subscription: subOf(me) };
    if (action === 'invoices') {
      const inv = S.ledger.filter((e) => e.broker === id && /^in_/.test(e.ref || '')).sort((a, z) => z.created_at.localeCompare(a.created_at));
      return { invoices: inv.map((e, i) => ({ number: `DEMO-${String(1000 + inv.length - i)}`, date: e.created_at, total: e.delta * 1.2, status: 'paid', url: null, pdf: null, plan: `Leaflegal ${e.reason}` })) };
    }
    if (action === 'onboard' && POST) {
      const t = (v, n) => String(v ?? '').trim().slice(0, n);
      const regs = body.regulators === undefined ? cleanRegulators(me.regulators) : cleanRegulators(body.regulators); if (!regs) fail(400, 'Add your regulator and your firm’s number with them');
      if (JSON.stringify(regs) !== JSON.stringify(cleanRegulators(me.regulators))) me.regulator_checked_at = null;
      Object.assign(me, { company: t(body.company, 120) || me.company, address: t(body.address, 300) || null, contact_name: t(body.contact_name, 120) || me.contact_name, signer_title: t(body.signer_title, 80) || null, phone: t(body.phone, 40) || me.phone, regulators: regs });
      return { ok: true };
    }
    if (action === 'sign' && POST) {
      if (body.version !== TERMS_VERSION) fail(409, 'The agreement has been updated. Please reload and read the latest version.');
      if (body.accept !== true || body.authority !== true) fail(400, 'Please tick both boxes to confirm');
      const name = String(body.signer_name || '').trim().slice(0, 120), title = String(body.signer_title || '').trim().slice(0, 80);
      if (name.split(/\s+/).length < 2) fail(400, 'Type your full name'); if (!title) fail(400, 'Enter your position at the company');
      const a = { id: S.seq.ag++, broker: id, version: TERMS_VERSION, created_at: nowIso(), signer_name: name, signer_title: title, signer_email: me.email, company: me.company };
      S.agreements.unshift(a); me.onboarded_at = nowIso(); me.signer_title = title;
      return { ok: true, agreement: { id: a.id, version: a.version, created_at: a.created_at } };
    }
    if (action === 'resend-verify' && POST) return { ok: true };

    // ---- admin
    if (action.startsWith('admin')) {
      if (!me.is_admin) fail(403, 'Admins only');
      return adminApi(action, q, body, POST, me);
    }
    fail(404, 'Unknown action');
  }

  function adminApi(action, q, body, POST, me) {
    const clients = () => S.firms.filter((b) => !b.is_admin);
    if (action === 'admin') {
      const comm = commissionIds();
      const brokers = [...S.firms].sort((a, z) => z.created_at.localeCompare(a.created_at)).map((b) => pick(b, ['id', 'email', 'company', 'contact_name', 'phone', 'regulators', 'regulator_checked_at', 'approved', 'credits', 'mode', 'is_admin', 'created_at', 'suspended_at', 'plan', 'stripe_customer']));
      const returns = [...S.returns].sort((a, z) => z.created_at.localeCompare(a.created_at)).map((r) => { const l = lead(r.lead_id) || {};
        return { id: r.id, lead_id: r.lead_id, broker: r.broker, reason: r.reason, details: r.details, status: r.status, decision: r.decision, created_at: r.created_at,
          leads: { full_name: l.full_name, area: l.area, matter: l.matter, matter_label: l.matter_label, price: l.price }, brokers: { company: byId(r.broker)?.company || '' } }; });
      const leads = [...S.leads].sort((a, z) => z.created_at.localeCompare(a.created_at)).map((l) => {
        const row = { ...pick(l, ['id', 'created_at', 'area', 'area_label', 'matter', 'matter_label', 'audience', 'urgency', 'region', 'postcode_district', 'value_band', 'private_pay', 'grade', 'score', 'flags', 'price', 'list_price', 'price_fixed', 'full_name', 'business_name', 'bought_at', 'auto', 'stage', 'instructed_value', 'archived_at', 'buyer', 'hidden_at']),
          brokers: l.buyer ? { company: byId(l.buyer)?.company || '' } : null };
        return withPaid({ ...row, ...(l.buyer ? {} : salePrice(l)), ...origin(l), suppressed: false, ...adCost(l) }); });
      const live = clients().filter((b) => subOf(b)), sold = leads.filter((l) => l.buyer);
      const forSale = S.leads.filter((l) => !l.buyer && !l.hidden_at && Date.now() - new Date(l.created_at) < 30 * D);
      const payers = clients().filter((b) => !b.plan?.commission);
      const refunded = S.returns.filter((r) => r.status === 'approved').reduce((a, r) => a + (r.credits || 0), 0);
      const paidInv = S.ledger.filter((e) => /^in_/.test(e.ref || '')), gross = paidInv.reduce((a, e) => a + e.delta * 1.2, 0);
      const P0 = P();
      return { uploads: {}, suppressed: [{ email: 'old.address@example.net', reason: 'Bounced (earlier send)', source: 'resend', created_at: iso(12 * D) }], accepted: [{ email: 'olivia.ashby@example.com', at: iso(26 * H), broker: ASHBY }],
        brokers, invites: S.invites.map((v) => ({ ...v })), agreements: [...S.agreements].sort((a, z) => z.created_at.localeCompare(a.created_at)), waived: [...S.waived], termsVersion: TERMS_VERSION,
        returns, leads, adStatus: { 'Meta ads': 'ok' }, pricing: P0, audit: S.audit.slice(0, 60), defaults: DEFAULT_PRICING, taxonomy: TAX,
        examples: PRICE_EXAMPLES.map((e) => ({ ...e, price: price(e, P0), parts: priceParts(e, P0) })),
        stats: { brokers: clients().length, pending: clients().filter((b) => !b.approved).length, active: clients().filter((b) => !b.suspended_at && !b.plan?.commission && (b.plan || subOf(b))).length,
          commission: clients().filter((b) => !b.suspended_at && b.plan?.commission).length, leads: leads.length, sold: sold.length, credits_sold: sold.reduce((a, l) => a + (l.paid ?? l.price), 0),
          for_sale: { leads: forSale.length, credits: forSale.reduce((a, l) => a + salePrice(l).price, 0), full: forSale.reduce((a, l) => a + l.price, 0) }, refunds: S.returns.filter((r) => r.status === 'pending').length,
          money: { spent: S.leads.filter((l) => l.buyer && !comm.has(l.buyer)).reduce((a, l) => a + l.price, 0) - refunded, unspent: payers.reduce((a, b) => a + (b.credits || 0), 0), holders: payers.filter((b) => b.credits > 0).length,
            mrr: live.reduce((a, b) => a + subOf(b).pounds, 0), subs: live.length, cancelling: live.filter((b) => b.cancelling).length, cash: gross, cash_ex_vat: gross / 1.2, refunded: 0 } } };
    }
    if (action === 'admin-ads') {
      const day = (v, d) => (/^\d{4}-\d{2}-\d{2}$/.test(v || '') ? v : d);
      const to = day(q.get('to'), new Date().toISOString().slice(0, 10)), from = day(q.get('from'), new Date(Date.now() - 6 * D).toISOString().slice(0, 10));
      const days = Math.max(1, Math.round((Date.parse(`${to}T00:00:00Z`) - Math.max(Date.parse(`${from}T00:00:00Z`), Date.now() - 120 * D)) / D) + 1);
      const ads = META_ADS.map(([ad_id, ad, adset_id, adset, c, share]) => { const spend = Math.round(DAILY[c] * share * days * (META[c] === META.c3 ? 0.6 : 1) * 100) / 100, impressions = Math.round(spend * 95), clicks = Math.round(impressions * 0.012);
        return { ad_id, ad, adset_id, adset, campaign_id: META[c][0], campaign: META[c][1], spend, impressions, clicks, meta_leads: Math.round(spend / 28), live: c !== 'c3', thumb: null, title: ad, body: 'Tell us about your legal matter and we’ll pass it to one law firm that can help.' }; });
      const campaigns = Object.entries(META).map(([k, [cid, name]]) => ({ id: cid, name, status: k === 'c3' ? 'PAUSED' : 'ACTIVE', updated: k === 'c3' ? iso(3 * D) : iso(40 * D), daily: DAILY[k], lifetime: null }));
      const inRange = S.leads.filter((l) => l.ch === 'Meta ads' && l.created_at.slice(0, 10) >= from && l.created_at.slice(0, 10) <= to);
      return { status: 'ok', ads, campaigns, attrib: Object.fromEntries(inRange.map((l) => [l.id, l.meta])), from, to,
        leads: inRange.map((l) => ({ id: l.id, matter: matterName(l), created_at: l.created_at, buyer: l.buyer ? byId(l.buyer)?.company || null : null, stage: l.stage })) };
    }
    if (action === 'admin-finance') {
      const since = new Date(); since.setUTCMonth(since.getUTCMonth() - 11, 1); since.setUTCHours(0, 0, 0, 0);
      const ledger = S.ledger.filter((m) => new Date(m.created_at) >= since && m.lead_id && (m.delta < 0 || /^Lead assigned/.test(m.reason) || /^Refund for lead/.test(m.reason)))
        .map((m) => ({ date: m.created_at, broker: m.broker, lead: m.lead_id ?? (Number(/#(\d+)/.exec(m.reason)?.[1]) || null), kind: m.delta < 0 ? 'sale' : /^Refund/.test(m.reason) ? 'refund' : 'free',
          credits: m.delta < 0 ? -m.delta : m.delta > 0 ? m.delta : lead(m.lead_id)?.price || 0, auto: /^Auto/.test(m.reason) }));
      const inv = S.ledger.filter((e) => /^in_/.test(e.ref || ''));
      const spend = []; for (let i = 119; i >= 0; i--) { const d0 = new Date(Date.now() - i * D).toISOString().slice(0, 10), s = Math.round((DAILY.c1 + DAILY.c2 + (i > 3 ? DAILY.c3 * 0.6 : 0)) * (0.85 + ((i * 37) % 30) / 100) * 100) / 100; spend.push({ date: d0, spend: s, clicks: Math.round(s * 1.1) }); }
      return { since: since.toISOString(), meta: 'ok', ledger,
        topups: S.ledger.filter((e) => e.delta > 0).map((e) => ({ broker: e.broker, delta: e.delta, ref: e.ref, invoiced: e.invoiced, reason: e.reason })),
        returned: S.returns.filter((r) => r.status === 'approved').map((r) => ({ date: r.created_at, broker: r.broker, price: r.credits ?? lead(r.lead_id)?.price ?? 0 })),
        invoices: inv.map((e) => ({ id: e.ref, date: e.created_at.slice(0, 10), customer: byId(e.broker)?.stripe_customer, gross: e.delta * 1.2, vat: e.delta * 0.2, exVat: e.delta })),
        fees: inv.map((e) => ({ date: e.created_at.slice(0, 10), fee: Math.round(e.delta * 1.2 * 0.015 * 100) / 100 + 0.2, kind: 'Card processing' })), refunds: [], spend,
        leads: S.leads.filter((l) => new Date(l.created_at) >= since).map((l) => ({ id: l.id, created_at: l.created_at, price: l.price, list_price: l.list_price, buyer: l.buyer, bought_at: l.bought_at, auto: l.auto, ad_cost: adCost(l).ad_cost || 0, ad_by: l.ch === 'Meta ads' ? 'campaign' : 'none' })),
        brokers: clients().map((b) => pick(b, ['id', 'company', 'email', 'stripe_customer', 'credits', 'approved', 'created_at', 'plan'])), commission: [...S.commission],
        manual: S.ledger.filter((e) => e.invoiced > 0).map((e) => ({ date: e.created_at.slice(0, 10), broker: e.broker, exVat: Number(e.invoiced) })) };
    }
    if (action === 'admin-client') {
      const b = byId(q.get('id')) || fail(404, 'Not found'), id = b.id;
      const ag = S.agreements.filter((a) => a.broker === id).sort((a, z) => z.created_at.localeCompare(a.created_at))[0];
      const bought = S.leads.filter((l) => l.buyer === id).sort((a, z) => z.bought_at.localeCompare(a.bought_at)).map((l) => ({ ...pick(l, ['id', 'price', 'stage', 'instructed_value', 'bought_at', 'auto', 'created_at', 'area', 'matter', 'matter_label']), ad_cost: adCost(l).ad_cost ?? null, ad_by: adCost(l).ad_by || 'none' }));
      const { cancelling, ...raw } = JSON.parse(JSON.stringify(b));
      return { broker: { ...raw, regulators: regulatorsOut(b), regulator_checked_at: b.regulator_checked_at || null, allowed_areas: allowedAreas(regIds(b)) }, subscription: subOf(b),
        ledger: ledgerOf(id).slice(0, 100).map(ledgerOut), bought, agreement: ag ? pick(ag, ['id', 'version', 'created_at', 'signer_name', 'signer_title']) : null, waived: S.waived.includes(id),
        commission: S.commission.filter((e) => e.broker === id), meta: 'ok' };
    }
    if (action === 'admin-regulator-check' && POST) { const b = byId(body.broker) || fail(404, 'Firm not found');
      if (body.checked !== false && !cleanRegulators(b.regulators)) fail(400, 'This firm hasn’t given a regulator yet');
      b.regulator_checked_at = body.checked === false ? null : nowIso(); audit('regulator-check', b.id, { checked: !!b.regulator_checked_at }); return { ok: true, regulator_checked_at: b.regulator_checked_at }; }
    if (action === 'admin-update' && POST) {
      const b = byId(body.broker) || fail(400, 'Bad id'), t = (v, n) => (v === undefined ? undefined : String(v).trim().slice(0, n) || null);
      const patch = Object.fromEntries(Object.entries({ company: t(body.company, 120), contact_name: t(body.contact_name, 120), phone: t(body.phone, 40), company_number: t(body.company_number, 12), address: t(body.address, 300), signer_title: t(body.signer_title, 80),
        ...(typeof body.is_admin === 'boolean' && body.broker !== me.id ? { is_admin: body.is_admin } : {}) }).filter(([, v]) => v !== undefined));
      if (patch.company === null) delete patch.company;
      if (body.regulators !== undefined) { const regs = cleanRegulators(body.regulators) || fail(400, 'Add at least one regulator with its number'); patch.regulators = regs; patch.regulator_checked_at = null; }
      if (body.email) { const e = String(body.email).trim().toLowerCase(); if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(e)) fail(400, 'Enter a valid email address'); patch.email = e; }
      if (body.cancel === true) b.cancelling = true;
      Object.assign(b, patch); audit('broker-edit', b.id, patch); return { ok: true };
    }
    if (action === 'admin-suspend' && POST) { if (body.broker === me.id) fail(400, 'You can’t suspend your own account'); const b = byId(body.broker) || fail(404, 'Firm not found');
      const on = body.suspend !== false; Object.assign(b, on ? { suspended_at: nowIso(), suspend_reason: String(body.reason || '').trim().slice(0, 200) || null } : { suspended_at: null, suspend_reason: null });
      audit(on ? 'suspend' : 'unsuspend', b.id, {}); return { ok: true }; }
    if (action === 'admin-delete' && POST) {
      if (body.broker === me.id) fail(400, 'You can’t delete your own account');
      const b = byId(body.broker) || fail(404, 'Firm not found');
      if (S.leads.some((l) => l.buyer === b.id)) fail(409, `${b.company} has bought leads, so their account can’t be deleted. Suspend it instead.`);
      if (String(body.confirm || '').trim().toLowerCase() !== String(b.company).trim().toLowerCase()) fail(400, 'Type the company name exactly to confirm');
      S.firms = S.firms.filter((x) => x.id !== b.id); audit('delete', b.email, { company: b.company }); return { ok: true };
    }
    if (action === 'admin-plan' && POST) {
      const b = byId(body.broker) || fail(404, 'Firm not found');
      if (body.remove) { b.plan = null; audit('plan-remove', b.id, {}); return { ok: true }; }
      const name = String(body.name || '').trim().slice(0, 60), credits = Math.round(Number(body.credits)), pr = Math.round(Number(body.price || 0) * 100) / 100, commission = body.commission === true;
      if (!name) fail(400, 'Give the plan a name'); if (!((commission ? credits >= 0 : credits > 0) && credits <= 1e6)) fail(400, 'Monthly credits must be a positive number');
      if (!(pr >= 0 && pr <= 1e7)) fail(400, 'Enter the monthly price in pounds');
      const start = body.start ? new Date(body.start) : new Date(); if (isNaN(start)) fail(400, 'Pick a valid start date');
      const plan = { name, credits, price: commission ? 0 : pr, ...(commission ? { commission: true } : {}), started_at: start.toISOString(), next_at: start.toISOString() };
      if (b.plan && !body.start) Object.assign(plan, { started_at: b.plan.started_at, next_at: b.plan.next_at });
      let given = 0; if (new Date(plan.next_at) <= Date.now() && credits > 0) { addLedger(b.id, credits, `Monthly credits: ${name}`, null, `plan-${b.id}-${Date.now()}`, commission ? null : pr || null); given = credits; const n = new Date(plan.next_at); n.setUTCMonth(n.getUTCMonth() + 1); plan.next_at = n.toISOString(); }
      b.plan = plan; audit('plan-create', b.id, plan); return { ok: true, plan, given };
    }
    if (action === 'admin-emails') return DEMO_EMAILS();
    if (action === 'admin-agreement-waive' && POST) { const b = byId(body.broker) || fail(404, 'Firm not found'); const on = body.waive !== false;
      S.waived = S.waived.filter((x) => x !== b.id).concat(on ? [b.id] : []); audit(on ? 'agreement-waive' : 'agreement-require', b.id, { company: b.company }); return { ok: true, waived: on }; }
    if (action === 'admin-commission' && POST) {
      if (body.remove) { const e = S.commission.find((x) => x.id === Number(body.remove)) || fail(404, 'Entry not found'); S.commission = S.commission.filter((x) => x !== e); return { ok: true }; }
      const kind = body.kind === 'spend' ? 'spend' : body.kind === 'commission' ? 'commission' : fail(400, 'Unknown entry type');
      const amount = Math.round(Number(String(body.amount ?? '').replace(/[^\d.]/g, '')) * 100) / 100, date = /^\d{4}-\d{2}-\d{2}$/.test(body.date || '') ? body.date : null;
      if (!(amount > 0 && amount <= 1e7)) fail(400, 'Enter an amount in pounds'); if (!date || new Date(date) > Date.now() + D) fail(400, 'Pick a date, today or earlier');
      S.commission.unshift({ id: S.seq.comm++, broker: body.broker || null, kind, amount, date, note: String(body.note || '').trim().slice(0, 200) || null, channel: String(body.channel || '').trim().slice(0, 40) || null, created_at: nowIso() });
      return { ok: true };
    }
    if (action === 'admin-invite-cancel' && POST) { const e = String(body.email || '').trim().toLowerCase(); S.invites.some((v) => v.email === e) || fail(404, 'Invite not found'); S.invites = S.invites.filter((v) => v.email !== e); audit('invite-cancel', e, {}); return { ok: true }; }
    if (action === 'admin-invite-delete' && POST) { const em = list(body.emails).map((e) => String(e).trim().toLowerCase()), n0 = S.invites.length;
      S.invites = S.invites.filter((v) => !(em.includes(v.email) || (body.batch && v.batch === body.batch))); return { ok: true, deleted: n0 - S.invites.length, cancelled: 0, left: 0 }; }
    if (action === 'admin-invite-edit' && POST) {
      const v = S.invites.find((x) => x.email === String(body.email || '').trim().toLowerCase()) || fail(404, 'Invite not found');
      const e = String(body.newEmail || body.email).trim().toLowerCase(), n = String(body.name ?? v.name ?? '').trim().slice(0, 120);
      if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(e)) fail(400, 'Please enter a valid email address'); if (!n) fail(400, 'Please enter their name');
      if (e !== v.email) fail(400, NO_SEND);
      Object.assign(v, { name: n, company: String(body.company ?? v.company ?? '').trim().slice(0, 120) || null }); return { ok: true, changed: true, outcome: 'saved', at: v.send_at };
    }
    if (['admin-invite', 'admin-invite-bulk', 'admin-invite-batch', 'admin-invite-leads', 'admin-invite-flush', 'admin-whats-new', 'admin-resend-backfill', 'admin-blog-key', 'admin-blog-unpublish'].includes(action) && POST) fail(400, NO_SEND);
    if (action === 'admin-blog') return { ready: true, keys: S.blogKeys.map((k) => ({ ...k })), posts: [
      { slug: 'what-a-lease-extension-involves', title: 'What a lease extension involves', category: 'Lease extensions', date: iso(3 * D).slice(0, 10) },
      { slug: 'first-court-hearing-child-arrangements', title: 'Your first child arrangements hearing', category: 'Family law', date: iso(10 * D).slice(0, 10) },
      { slug: 'conveyancing-timeline', title: 'How long conveyancing takes', category: 'Conveyancing', date: iso(17 * D).slice(0, 10) }] };
    if (action === 'admin-blog-key-revoke' && POST) { S.blogKeys = S.blogKeys.filter((k) => k.id !== String(body.id || '')); return { ok: true }; }
    if (action === 'admin-broker' && POST) {
      const b = byId(body.id) || fail(404, 'Firm not found');
      if (typeof body.approved === 'boolean') { b.approved = body.approved; if (!body.approved) b.suspended_at = b.suspended_at || null; audit('broker', b.id, { approved: body.approved }); }
      const delta = Math.round(Number(body.credits) || 0);
      if (delta) { if (b.credits + delta < 0) fail(400, `They only have ${b.credits} credits`);
        addLedger(b.id, delta, String(body.reason || (delta > 0 ? 'Credits added by Leaflegal' : 'Credits removed by Leaflegal')).slice(0, 120), null, `admin-${Date.now()}`, Math.round(Number(body.invoiced || 0) * 100) / 100 || null);
        audit('broker', b.id, { credits: delta, reason: body.reason }); }
      return { ok: true };
    }
    if (action === 'admin-refund' && POST) {
      const r = S.returns.find((x) => x.id === Number(body.id) && x.status === 'pending') || fail(404, 'Refund already decided'), l = lead(r.lead_id);
      const approve = !!body.approve, why = approve ? '' : [DECLINE[body.why] || '', String(body.note || '').trim().slice(0, 1000)].filter(Boolean).join('\n\n');
      if (!approve && !why) fail(400, 'Choose a reason or write one');
      if (approve && l.buyer && l.buyer !== r.broker) fail(409, 'This lead has moved to another firm since. Add credits by hand instead.');
      if (approve) addLedger(r.broker, l.price, `Refund for lead #${r.lead_id}`, null, `return-${r.id}`);
      Object.assign(r, { status: approve ? 'approved' : 'rejected', decided_at: nowIso(), ...(approve ? { credits: l.price } : { decision: why }) });
      audit(approve ? 'refund-approve' : 'refund-decline', r.id, { lead: r.lead_id, credits: l.price }); return { ok: true, lead: r.lead_id };
    }
    if (action === 'admin-lead' && !POST) {
      const l = lead(q.get('id')) || fail(404, 'Lead not found'), P0 = P();
      const { ch, meta, ...raw } = withPaid(JSON.parse(JSON.stringify(l)));
      return { notes: l.buyer ? S.notes.filter((n) => n.lead_id === l.id).map((n) => ({ body: n.body, created_at: n.created_at })) : [],
        refunds: l.buyer ? S.returns.filter((r) => r.lead_id === l.id).map((r) => ({ reason: r.reason, details: r.details, status: r.status, decision: r.decision, created_at: r.created_at, brokers: { company: byId(r.broker)?.company || '' } })) : [],
        lead: { ...raw, brokers: l.buyer ? { company: byId(l.buyer)?.company || '', email: byId(l.buyer)?.email || '' } : null, ...origin(l), quality: quality(l), suppressed: null, ...(l.buyer ? {} : { ...salePrice(l), discount_at: !l.price_fixed ? discountAt(l).toISOString() : null }) },
        brokers: [...S.firms].sort((a, z) => a.company.localeCompare(z.company)).map((b) => ({ ...pick(b, ['id', 'company', 'contact_name', 'email', 'credits', 'approved', 'plan']), can_take: canTake(b, l) })),
        taxonomy: TAX, pricing: P0, list_price_now: price(l, P0) };
    }
    if (action === 'admin-lead' && POST) {
      const l = lead(body.id) || fail(404, 'Lead not found'), op = body.op;
      if (op === 'price') { const p = Math.round(Number(body.price)); if (!(p >= 1 && p <= 1000)) fail(400, 'Price must be between 1 and 1,000 credits'); if (l.buyer) fail(409, 'This lead has already been sold'); l.price = p; audit('lead-price', l.id, { to: p }); return { ok: true }; }
      if (op === 'reprice') { if (l.buyer) fail(409, 'This lead has already been sold'); const p = price(l, P()); Object.assign(l, { price: p, list_price: null, price_fixed: false }); return { ok: true, price: p }; }
      let refunded = 0;
      if (op === 'relist') {
        const area = body.area || l.area, matter = body.matter === undefined ? l.matter : body.matter || null, urgency = body.urgency || l.urgency, grade = body.grade || l.grade;
        const fix = { area, matter, urgency, grade, ...(area !== l.area || matter !== l.matter ? { area_label: areaOf(area)?.label || l.area_label, matter_label: matterLabel(area, matter) } : {}) };
        const full = l.list_price || l.price, p = body.price === 'half' ? Math.max(1, Math.ceil(full / 2)) : body.price === 'recalc' ? price({ ...l, ...fix }, P()) : body.price === 'full' || body.price == null ? full : Math.round(Number(body.price));
        if (!(p >= 1 && p <= 1000)) fail(400, 'Price must be between 1 and 1,000 credits');
        if (body.refund && l.buyer) { refunded = -S.ledger.filter((e) => e.broker === l.buyer && (e.lead_id === l.id || e.reason === `Refund for lead #${l.id}`)).reduce((a, e) => a + e.delta, 0);
          if (refunded > 0) addLedger(l.buyer, refunded, `Refund for lead #${l.id}`, null, `relist-${l.id}`); else refunded = 0; }
        Object.assign(l, fix, { price: p, list_price: body.price === 'half' ? full : null, price_fixed: true, ...(l.buyer ? { buyer: null, bought_at: null, auto: false, stage: null, stage_at: null, instructed_value: null } : {}) });
        audit('lead-relist', l.id, { price: p, refunded: refunded || undefined });
        if (!body.broker) return { ok: true, price: p, refunded };
      }
      if (op === 'assign' || op === 'relist') {
        const b = byId(body.broker) || fail(400, 'Choose a firm');
        if (l.buyer) fail(409, 'This lead has already been sold');
        if (!canTake(b, l)) fail(400, `${b.company}'s regulators don't cover ${areaName(l).toLowerCase()}, so this lead can't go to them`);
        if (body.charge) { if (!signed(b.id)) fail(400, `${b.company} hasn't accepted the referral agreement yet. Assign it free instead, or ask them to accept it.`);
          if (!buyLead(l.id, b, false)) fail(402, b.approved ? `${b.company} doesn't have enough credits (${b.credits}). Assign it free instead, or add credits first.` : `${b.company} isn't approved yet`); }
        else { Object.assign(l, { buyer: b.id, bought_at: nowIso(), auto: false, stage: 'new' }); addLedger(b.id, 0, 'Lead assigned by Leaflegal (no charge)', l.id); }
        audit('lead-assign', l.id, { broker: b.company, charge: !!body.charge }); return { ok: true };
      }
      if (op === 'redeliver' || op === 'refund-notice') fail(400, NO_SEND);
      if (op === 'suppress' || op === 'unsuppress') return { ok: true };
      if (op === 'hide' || op === 'unhide') { l.hidden_at = op === 'hide' ? nowIso() : null; return { ok: true }; }
      if (op === 'delete') { if (body.confirm !== l.id) fail(400, 'Confirm the lead number to delete it'); S.leads = S.leads.filter((x) => x !== l); return { ok: true }; }
      fail(400, 'Unknown action');
    }
    if (action === 'admin-pricing' && POST) {
      const n = (v, lo, hi, d) => { const x = Number(v); return v !== null && v !== '' && v !== undefined && Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : d; };
      const Dp = DEFAULT_PRICING, min = Math.round(n(body.min, 1, 1000, Dp.min)), max = Math.round(n(body.max, min, 5000, Dp.max)), matters = {};
      for (const [k, v] of Object.entries(body.matters && typeof body.matters === 'object' ? body.matters : {})) { const [a, m] = String(k).split('/'); if (matterLabel(a, m) && Number(v) > 0) matters[`${a}/${m}`] = Math.round(n(v, 1, 5000, 50)); }
      S.pricing = { min, max, areas: Object.fromEntries(TAX.areas.map((a) => [a.slug, Math.round(n(body.areas?.[a.slug], 1, 5000, Dp.areas[a.slug] ?? 50))])), matters,
        grade: Object.fromEntries(TAX.grades.map((g) => [g, n(body.grade?.[g], 0.1, 3, Dp.grade[g])])), urgent: n(body.urgent, 0.5, 3, Dp.urgent), business: n(body.business, 0.5, 3, Dp.business),
        value: (Array.isArray(body.value) ? body.value : Dp.value).map((x) => [Math.round(n(x?.[0], 1, 1e9, 0)), n(x?.[1], 0.5, 3, 1)]).filter(([at]) => at > 0).sort((x, y) => y[0] - x[0]).slice(0, 6) };
      const P0 = P(); let repriced;
      if (body.reprice) { repriced = 0; for (const l of S.leads) if (!l.buyer && !l.hidden_at && !l.price_fixed) { const p = price(l, P0); if (p !== l.price) { l.price = p; repriced++; } } }
      audit('pricing', 'pricing', S.pricing);
      return { ok: true, pricing: P0, examples: PRICE_EXAMPLES.map((e) => ({ ...e, price: price(e, P0), parts: priceParts(e, P0) })), ...(repriced !== undefined ? { repriced } : {}) };
    }
    if (action === 'admin-reprice' && POST) { const P0 = P(); let checked = 0, changed = 0;
      for (const l of S.leads) if (!l.buyer && !l.hidden_at && (body.all === true || !l.price_fixed)) { checked++; const p = price(l, P0); if (p !== l.price) { l.price = p; l.price_fixed = false; l.list_price = null; changed++; } }
      return { ok: true, repriced: changed, checked }; }
    fail(404, 'Unknown action');
  }

  // ------------------------------------------------ /api/crm (admins)
  const CRM_STAGES = [['new', 'New enquiry'], ['contacted', 'Contacted'], ['call_booked', 'Call booked'], ['proposal', 'Proposal sent'], ['onboarding', 'Signing up'], ['won', 'Customer'], ['nurture', 'Nurture'], ['lost', 'Lost']];
  const CRM_SOURCES = ['Website enquiry', 'Booked a call', 'Platform sign-up', 'Google search', 'Google Ads', 'Meta ads', 'LinkedIn', 'LinkedIn outreach', 'Cold email', 'Cold call', 'Referral', 'Event', 'Invited to platform', 'Other'];
  const CRM_FLOWS = [
    { id: 'new:0', stage: 'new', day: 0, subject: 'Thanks for getting in touch, {first_name}', body: 'Hi {first_name},\n\nThanks for your interest in Leaflegal. Each enquiry goes to one law firm only, and you see the matter, urgency, region and answers before you buy.\n\n{sender_name}' },
    { id: 'contacted:3', stage: 'contacted', day: 3, subject: 'Sample enquiries for {company}', body: 'Hi {first_name},\n\nHere are a few recent sample enquiries in your practice areas. Sign up here when you’re ready {signup_link}\n\n{sender_name}' },
    { id: 'proposal:4', stage: 'proposal', day: 4, subject: 'Any questions about the proposal?', body: 'Hi {first_name},\n\nJust checking whether you had any questions about the plan we discussed.\n\n{sender_name}' },
    { id: 'nurture:30', stage: 'nurture', day: 30, subject: 'What’s new at Leaflegal', body: 'Hi {first_name},\n\nA quick update on new practice areas and regions now live on Leaflegal.\n\n{sender_name}' },
  ];
  const CRM_LINKS = { signup_link: 'https://platform.leaflegal.co/register', calculator_link: 'https://leaflegal.co/partners/pricing', pricing_link: 'https://leaflegal.co/partners/pricing' };
  function crmApi(action, q, b, POST) {
    const C = S.crm, one = (id) => C.contacts.find((c) => c.id === Number(id)) || fail(404, 'Contact not found');
    const act = (contact_id, kind, subject, text) => C.activities.unshift({ id: C.seq++, contact_id, created_at: nowIso(), kind, subject, body: text });
    if (action === 'list') return { contacts: C.contacts.map((c) => ({ ...c })), recent: C.activities.filter((a) => ['email', 'sms', 'flow', 'note', 'call'].includes(a.kind)).slice(0, 40), stages: CRM_STAGES, sources: CRM_SOURCES, sms: false, wa: false, links: CRM_LINKS };
    if (action === 'contact') { const c = one(q.get('id')); const bk = c.broker_id ? byId(c.broker_id) : null;
      return { contact: { ...c, notes: null }, activities: C.activities.filter((a) => a.contact_id === c.id), sent: [], broker: bk ? pick(bk, ['id', 'company', 'credits', 'approved', 'suspended_at', 'mode', 'created_at', 'stripe_customer']) : null,
        upcoming: CRM_FLOWS.filter((s) => s.stage === c.stage).map((s) => ({ id: s.id, subject: s.subject, day: s.day, due: new Date(Date.parse(c.stage_changed_at) + s.day * D).toISOString(), overdue: s.day <= (Date.now() - Date.parse(c.stage_changed_at)) / D })),
        mobile: /^(\+?44\s?7|07)/.test(String(c.phone || '')), e164: null }; }
    if (action === 'flows') return { flows: CRM_FLOWS.map((s) => ({ ...s, on: true, sent: 0, edited: false })), stages: CRM_STAGES };
    if (!POST) fail(404, 'Unknown action');
    if (action === 'save') { const c = b.id ? one(b.id) : null;
      const patch = Object.fromEntries(['name', 'company', 'email', 'phone', 'position', 'source', 'stage', 'value', 'leads_per_month', 'budget', 'tags', 'next_action', 'next_action_at', 'flows_paused', 'lost_reason'].filter((k) => b[k] !== undefined).map((k) => [k, k === 'tags' && typeof b[k] === 'string' ? b[k].split(',').map((x) => x.trim()).filter(Boolean) : b[k]]));
      if (c) { Object.assign(c, patch, { updated_at: nowIso() }); if (b.resubscribe) c.unsubscribed_at = null; return { ok: true, contact: c }; }
      if (!patch.name && !patch.email) fail(400, 'Add a name or an email');
      const n = { id: C.seq++, created_at: nowIso(), updated_at: nowIso(), name: '', company: '', email: '', phone: null, position: null, source: 'Other', stage: 'new', stage_changed_at: nowIso(), value: null, leads_per_month: null, budget: null, tags: [], next_action: null, next_action_at: null, last_contacted_at: null, broker_id: null, flows_paused: false, unsubscribed_at: null, lost_reason: null, ...patch };
      C.contacts.unshift(n); return { ok: true, contact: n }; }
    if (action === 'stage') { const c = one(b.id); c.stage = b.stage; c.stage_changed_at = nowIso(); if (b.reason) c.lost_reason = b.reason; act(c.id, 'stage', `Moved to ${CRM_STAGES.find(([k]) => k === b.stage)?.[1] || b.stage}`, null); return { ok: true, contact: c }; }
    if (action === 'note') { const c = one(b.id); act(c.id, b.kind === 'call' ? 'call' : 'note', b.kind === 'call' ? `Call${b.outcome ? `, ${b.outcome}` : ''}` : null, String(b.body || '')); c.last_contacted_at = b.kind === 'call' ? nowIso() : c.last_contacted_at; return { ok: true }; }
    if (action === 'note-delete') { C.activities = C.activities.filter((a) => a.id !== Number(b.activity)); return { ok: true }; }
    if (action === 'delete') { C.contacts = C.contacts.filter((c) => c.id !== Number(b.id)); return { ok: true }; }
    if (action === 'preview') { const c = one(b.id); const m = (t) => String(t || '').replace(/\{(\w+)\}/g, (x, k) => ({ first_name: (c.name || 'there').split(' ')[0], name: c.name, company: c.company || 'your firm', sender_name: 'The Leaflegal team', ...CRM_LINKS }[k] ?? x));
      return { subject: m(b.subject), html: mail(m(b.subject), m(b.body).replace(/[<>&]/g, '').replace(/\n/g, '<br>')) }; }
    if (['email', 'sms', 'import', 'run-flows', 'link-broker'].includes(action)) fail(400, NO_SEND);
    if (action === 'flows') return { flows: CRM_FLOWS.map((s) => ({ ...s, on: true, sent: 0, edited: false })), stages: CRM_STAGES };
    fail(404, 'Unknown action');
  }

  // ------------------------------------------------ fetch
  const realFetch = window.fetch.bind(window);
  const json = (status, data) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const headerOf = (init, input, k) => { const hs = init?.headers || (input instanceof Request ? input.headers : null); if (!hs) return '';
    if (hs instanceof Headers) return hs.get(k) || ''; const f = Object.keys(hs).find((x) => x.toLowerCase() === k.toLowerCase()); return f ? hs[f] : ''; };
  const signedIn = () => { try { return demoToken(JSON.parse(localStorage.getItem(TK) || 'null')?.access); } catch { return false; } };
  window.fetch = async (input, init = {}) => {
    let url; try { url = new URL(typeof input === 'string' ? input : input.url, location.href); } catch { return realFetch(input, init); }
    const method = String(init.method || (input instanceof Request ? input.method : 'GET')).toUpperCase();
    if (url.pathname.includes('/auth/v1/')) {
      await wait(150);
      const who = byId(role === 'admin' ? ADMIN : FIRM), user = { id: who.id, email: who.email, role: 'authenticated', aud: 'authenticated' };
      if (/\/token$/.test(url.pathname)) return json(200, { access_token: `demo-${role}`, refresh_token: `demo-${role}`, token_type: 'bearer', expires_in: 3600, user });
      if (/\/recover$/.test(url.pathname)) return json(200, {});
      return json(200, user);
    }
    const ep = url.origin === location.origin && { '/api/platform': 'platform', '/api/crm': 'crm' }[url.pathname];
    if (!ep) return realFetch(input, init);
    await wait(90 + Math.random() * 120);
    const q = url.searchParams, action = String(q.get('action') || '');
    let body = {}; try { body = init.body ? JSON.parse(init.body) : {}; } catch {}
    const tok = headerOf(init, input, 'Authorization').replace(/^Bearer\s+/i, '');
    const uid = tok === 'demo-admin' ? ADMIN : tok === 'demo-firm' ? FIRM : null;
    try {
      if (ep === 'crm') { if (!uid) fail(401, 'Please sign in'); if (!byId(uid)?.is_admin) fail(403, 'Admins only'); }
      if ((action === 'agreement' || action === 'admin-agreement') && uid) {
        const me = byId(uid), aid = Number(q.get('id')) || null;
        if (action === 'admin-agreement' && !me.is_admin) fail(403, 'Admins only');
        const a = action === 'admin-agreement' ? S.agreements.find((x) => x.id === aid) : S.agreements.filter((x) => x.broker === uid && (!aid || x.id === aid)).sort((x, z) => z.created_at.localeCompare(x.created_at))[0];
        if (!a) fail(404, action === 'agreement' ? 'No signed agreement yet' : 'Not found');
        return new Response(agreementPdf(a), { status: 200, headers: { 'Content-Type': 'application/pdf' } });
      }
      const out = ep === 'crm' ? crmApi(action, q, body, method === 'POST') : platformApi(action, q, body, method, uid);
      if (method === 'POST') save();
      return json(200, JSON.parse(JSON.stringify(out ?? {})));
    } catch (e) {
      if (e instanceof Fail) return json(e.status, { error: e.message });
      console.warn('Leaflegal demo:', action, e);
      return json(500, { error: 'Something went wrong in the demo. Please try again.' });
    }
  };
  // A sign-in left in place when this tab started demo mode keeps working as the demo role.
  void signedIn;
})();

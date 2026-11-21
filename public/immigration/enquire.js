// Immigration enquiry funnel (/immigration/enquire). Demo only: nothing is sent anywhere.
// Uses the /apply card styles (assets/apply.css). Employer and individual paths, fee gate, can't-help exits.
(() => {
  const root = document.getElementById('ap');
  if (!root) return;
  const body = root.querySelector('.ap-body'), bar = root.querySelector('.ap-bar'), count = root.querySelector('.ap-count'), backBtn = root.querySelector('.ap-back');
  const KEY = 'll-immigration-demo';
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const I = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
  const TICK = I('<path d="M5 12l5 5 9-10" stroke-width="3"/>');
  const ARROW = I('<path d="M5 12h14M13 6l6 6-6 6"/>');
  const ICON = {
    biz: I('<path d="M3 21h18M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16"/><path d="M10 7h4M10 11h4M10 15h4"/>'),
    person: I('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'),
    look: I('<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>'),
  };
  const NAT = ['Afghan','Albanian','Algerian','American','Argentinian','Australian','Bangladeshi','Brazilian','British','Bulgarian','Canadian','Chinese','Colombian','Egyptian','Emirati','Filipino','French','Gambian','German','Ghanaian','Greek','Hong Kong (BN(O))','Indian','Indonesian','Iranian','Iraqi','Irish','Italian','Jamaican','Japanese','Jordanian','Kenyan','Lebanese','Malaysian','Mexican','Moroccan','Nepalese','New Zealander','Nigerian','Pakistani','Polish','Portuguese','Romanian','Russian','Saudi','Singaporean','South African','South Korean','Spanish','Sri Lankan','Sudanese','Syrian','Thai','Turkish','Ugandan','Ukrainian','Vietnamese','Zimbabwean'];

  let a = {}, hist = ['who'], busy = false;
  const o = (v, label, sub, x) => Object.assign({ v, label, sub }, x || {});

  const STEPS = {
    who: { type: 'single', icons: true, q: 'What do you need help with?', options: () => [
      o('employer', 'Hiring or sponsoring overseas staff', 'Sponsor licences, Certificates of Sponsorship, compliance', { ico: 'biz' }),
      o('individual', 'A visa for me or my family', 'Visas, settlement, citizenship and family routes', { ico: 'person' }),
      o('seeker', 'Finding a UK job or a sponsor', 'You want an employer to sponsor your visa', { ico: 'look', exit: 'sponsor' })] },
    e_status: { type: 'single', q: 'Does your business hold a sponsor licence?', options: () => [
      o('none', 'No licence'), o('considering', 'No, but we’re thinking about applying'), o('holds', 'Yes, we already hold one')] },
    e_help: { type: 'multi', q: 'Which of these does your business need?', options: () => [
      a.e_status !== 'holds' && o('licence', 'Applying for a sponsor licence'),
      o('cos', 'Certificates of Sponsorship'),
      o('recruit', 'Recruiting workers from overseas'),
      o('compliance', 'Compliance and Home Office audits'),
      o('founder', 'Global Talent or Innovator Founder')].filter(Boolean) },
    e_company: { type: 'company', q: 'What is the name of your company?', placeholder: 'Company name', auto: 'organization',
      validate: (v) => v.trim().length < 2 ? 'Please enter the company name' : '' },
    e_sector: { type: 'single', grid: true, q: 'Which sector are you in?', options: () => [
      o('care', 'Health and social care'), o('hosp', 'Hospitality and food'), o('tech', 'Technology and digital'), o('eng', 'Engineering and construction'),
      o('edu', 'Education and research'), o('retail', 'Retail, logistics and manufacturing'), o('fin', 'Finance and professional services'), o('other', 'Something else')] },
    e_size: { type: 'single', grid: true, q: 'Roughly how many people work there?', options: () => [
      o('s1', '1 to 9'), o('s2', '10 to 49'), o('s3', '50 to 249'), o('s4', '250 or more')] },
    i_service: { type: 'single', q: 'Which visa or application is it?', options: () => [
      o('skilled', 'Skilled Worker visa'), o('family', 'Spouse, partner or family visa'), o('ilr', 'Indefinite leave to remain'),
      o('citizen', 'British citizenship'), o('visitor', 'Standard Visitor visa'), o('talent', 'Global Talent or Innovator Founder'),
      o('asylum', 'Asylum or refugee protection', null, { exit: 'asylum' }),
      o('general', 'Just a general question', null, { exit: 'info' })] },
    i_joboffer: { type: 'single', q: 'Do you have a job offer from a UK employer?', options: () => [
      o('yes', 'Yes, and they hold a sponsor licence'), o('unsure', 'Yes, but I’m not sure about their licence'),
      o('no', 'No, I’m still looking for a sponsor', null, { exit: 'sponsor' })] },
    i_nationality: { type: 'text', list: true, q: 'What is your nationality?', placeholder: 'For example, Indian', auto: 'off',
      validate: (v) => /^[A-Za-z][A-Za-z .'()\-]{2,40}$/.test(v.trim()) ? '' : 'Please enter a nationality, for example Indian or Nigerian' },
    i_status: { type: 'single', q: 'What is your current immigration status?', options: () => [
      o('visa', 'In the UK on a visa'), o('settled', 'In the UK with settled or pre-settled status'),
      o('expired', 'In the UK, but my visa has expired or been refused'), o('outside', 'Outside the UK'),
      o('british', 'British or Irish, applying for a family member')] },
    i_deadline: { type: 'date', q: 'When does your current visa run out?' },
    region: { type: 'single', grid: true, q: () => a.who === 'employer' ? 'Where is your business based?' : 'Where in the UK do you live?', options: () => {
      const r = [o('eng', 'England'), o('sco', 'Scotland'), o('wal', 'Wales'), o('ni', 'Northern Ireland')];
      if (a.who === 'employer') r.push(o('abroad', 'Outside the UK, expanding here', null, { wide: true }));
      return r; } },
    timeframe: { type: 'single', q: () => a.who === 'employer' ? 'When do you need this in place?' : 'When do you want to get started?', options: () => [
      o('urgent', 'As soon as possible'), o('m1', 'In the next 1 to 3 months'), o('m3', 'In 3 to 6 months'),
      o('research', 'I’m just researching for now', null, { exit: 'research' })] },
    fees: { type: 'single', note: true, q: 'If the solicitor can help, are you ready to go ahead?', options: () => [
      o('now', 'Yes, I’m ready to instruct a solicitor'), o('quote', 'Yes, once I know what it will cost'),
      o('free', 'No, I was hoping for free advice', null, { exit: 'free' })] },
    contact: { type: 'contact', q: 'Where should the solicitor call you?' },
  };

  const L = (href, t) => ({ href, t });
  const EXITS = {
    sponsor: { reason: 'The solicitors we work with advise employers, and people who already have a route into the UK. They can’t find you a job or a sponsor. These official pages can help with your search.',
      links: [L('https://www.gov.uk/government/publications/register-of-licensed-sponsors-workers', 'Register of licensed sponsors (GOV.UK)'), L('https://www.gov.uk/skilled-worker-visa', 'Skilled Worker visa (GOV.UK)')] },
    asylum: { reason: 'Asylum and refugee protection are outside the services our partner firms offer. You may be able to get free specialist help, including legal aid.',
      links: [L('https://www.gov.uk/claim-asylum', 'Claim asylum in the UK (GOV.UK)'), L('https://www.gov.uk/check-legal-aid', 'Check if you can get legal aid (GOV.UK)'), L('https://www.refugeecouncil.org.uk/', 'Refugee Council')] },
    free: { reason: 'The solicitors we work with charge for their advice, so they can’t help with free advice. These services give free, reliable information.',
      links: [L('https://www.gov.uk/browse/visas-immigration', 'Visas and immigration (GOV.UK)'), L('https://www.citizensadvice.org.uk/immigration/', 'Citizens Advice: immigration'), L('https://www.gov.uk/find-an-immigration-adviser', 'Find a regulated immigration adviser (GOV.UK)')] },
    info: { reason: 'Our partner solicitors take on applications and employer work rather than general questions. The official guidance answers most questions and is kept up to date.',
      links: [L('https://www.gov.uk/check-uk-visa', 'Check if you need a UK visa (GOV.UK)'), L('https://www.gov.uk/browse/visas-immigration', 'Visas and immigration (GOV.UK)')] },
    research: { reason: 'It sounds like you’re still weighing up your options. Come back when you have a timeframe in mind. Until then, these pages are a good place to start.',
      links: () => a.who === 'employer'
        ? [L('https://www.gov.uk/uk-visa-sponsorship-employers', 'Sponsoring workers: guidance for employers (GOV.UK)'), L('https://www.gov.uk/government/publications/register-of-licensed-sponsors-workers', 'Register of licensed sponsors (GOV.UK)')]
        : [L('https://www.gov.uk/check-uk-visa', 'Check if you need a UK visa (GOV.UK)'), L('https://www.gov.uk/browse/visas-immigration', 'Visas and immigration (GOV.UK)')] },
  };

  function pathFor() {
    if (a.who === 'individual') {
      const p = ['who', 'i_service'];
      if (a.i_service === 'skilled') p.push('i_joboffer');
      p.push('i_nationality', 'i_status');
      if (['visa', 'expired'].includes(a.i_status)) p.push('i_deadline');
      if (a.i_status !== 'outside') p.push('region');
      return p.concat(['timeframe', 'fees', 'contact']);
    }
    return ['who', 'e_status', 'e_help', 'e_company', 'e_sector', 'e_size', 'region', 'timeframe', 'fees', 'contact'];
  }
  const top = () => hist[hist.length - 1];
  const next = (id) => { const p = pathFor(); return p[p.indexOf(id) + 1] || 'contact'; };
  const qOf = (s) => typeof s.q === 'function' ? s.q() : s.q;
  const go = (id) => { hist.push(id); show(1); };
  const back = () => { if (hist.length > 1) { hist.pop(); show(-1); } };
  const daysTo = (v) => { if (!v) return null; const t = new Date(); t.setHours(0, 0, 0, 0); return Math.round((new Date(v + 'T00:00:00') - t) / 864e5); };

  // ---------- validation ----------
  const DISPOSABLE = ['mailinator.com','tempmail.com','temp-mail.org','10minutemail.com','guerrillamail.com','yopmail.com','trashmail.com','sharklasers.com','getnada.com','throwawaymail.com','dispostable.com','maildrop.cc'];
  const TYPOS = {'gmial.com':'gmail.com','gmai.com':'gmail.com','gamil.com':'gmail.com','gmail.co':'gmail.com','gmail.con':'gmail.com','gmail.co.uk':'gmail.com','hotmial.com':'hotmail.com','hotmail.con':'hotmail.com','yahooo.com':'yahoo.com','yaho.com':'yahoo.com','outlok.com':'outlook.com','outlook.con':'outlook.com','iclod.com':'icloud.com','icloud.co':'icloud.com'};
  const checkName = (v) => { v = v.trim().replace(/\s+/g, ' ');
    if (!v) return 'Please enter your name';
    if (!/^[\p{L}][\p{L}'’.\- ]+$/u.test(v)) return 'Please use letters only';
    if (v.split(' ').length < 2) return 'Please enter your first and last name';
    if (/^(test|asdf|qwerty|aaa+|abc)\b/i.test(v)) return 'Please enter your real name';
    return ''; };
  const checkEmail = (v) => { v = v.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return { err: 'Please enter a valid email address' };
    const dom = v.split('@')[1];
    if (DISPOSABLE.includes(dom)) return { err: 'Please use an email address you check regularly, not a temporary one' };
    if (TYPOS[dom]) return { err: '', fix: v.split('@')[0] + '@' + TYPOS[dom] };
    return { err: '' }; };
  const normPhone = (v) => { let n = v.replace(/[\s\-().]/g, '');
    if (n.startsWith('+44')) n = '0' + n.slice(3); else if (n.startsWith('0044')) n = '0' + n.slice(4);
    return n.replace(/^0(?=0)/, ''); };
  const checkPhone = (v) => { const n = normPhone(v);
    if (!n) return { err: 'Please enter your UK mobile number' };
    if (/(\d)\1{6,}/.test(n) || ['07123456789', '07987654321'].includes(n)) return { err: 'That number doesn’t look right. Please check it' };
    if (/^07[1-57-9]\d{8}$/.test(n) || /^07624\d{6}$/.test(n)) return { err: '', n };
    if (/^0[123]\d{8,9}$/.test(n)) return { err: 'That looks like a landline. The solicitor will call you, so please give a mobile' };
    return { err: 'Please enter a UK mobile number, for example 07700 900123' }; };
  const fmtPhone = (n) => n.slice(0, 5) + ' ' + n.slice(5);

  // ---------- screens ----------
  const optBtn = (opt, on, multi) => `<button type="button" class="ap-opt${on ? ' sel' : ''}${opt.wide ? ' wide' : ''}" role="${multi ? 'checkbox' : 'radio'}" aria-checked="${on}" data-v="${opt.v}">${opt.ico ? `<span class="ap-ico">${ICON[opt.ico]}</span>` : ''}<span><b>${opt.label}</b>${opt.sub ? `<small>${opt.sub}</small>` : ''}</span><span class="ap-tick">${TICK}</span></button>`;
  const nextBtn = (label = 'Continue', type = 'button') => `<div class="ap-actions"><button type="${type}" class="button ap-next" data-next>${label} ${ARROW}</button></div>`;
  const FEE_NOTE = '<div class="im-note"><b>Immigration advice is a paid service.</b> Your first call, a 15-minute phone assessment with a solicitor, is free. If you want them to act for you, they’ll explain their fees before any work starts.</div>';

  function render(id) {
    const s = STEPS[id], q = qOf(s);
    let h = `<h2 class="ap-q" tabindex="-1">${q}</h2>`;
    if (s.note) h += FEE_NOTE;
    if (s.type === 'single') {
      const opts = s.options(), cols = s.icons || !s.grid ? ' one' : '';
      h += `<div class="ap-opts${cols}" role="radiogroup" aria-label="${esc(q)}">${opts.map((x) => optBtn(x, a[id] === x.v)).join('')}</div>`;
      if (opts.some((x) => x.v === a[id] && !x.exit)) h += nextBtn();
    } else if (s.type === 'multi') {
      const opts = s.options();
      a[id] = (a[id] || []).filter((v) => opts.some((x) => x.v === v));
      h += `<p class="ap-multi-hint">Choose all that apply</p><div class="ap-opts one" role="group" aria-label="${esc(q)}">${opts.map((x) => optBtn(x, a[id].includes(x.v), true)).join('')}</div>${nextBtn()}`;
    } else if (s.type === 'company' && !a.coManual) {
      h += `<div class="ap-field ap-text-step"><label class="ap-sr" for="ap-co">Search for your company</label>
        <input id="ap-co" type="search" autocomplete="off" placeholder="Start typing your company name" value="${esc(a.e_company || '')}">
        <span class="ap-err" id="ap-co-err"></span><div class="ap-opts one ap-co-list" role="radiogroup" aria-label="Matching companies" aria-live="polite"></div>
        <p class="ap-note"><button type="button" class="ap-link" data-manual>Can’t find it? Enter the name yourself</button></p></div>${a.e_company_no ? nextBtn() : ''}`;
    } else if (s.type === 'text' || s.type === 'company') {
      h += `<form novalidate><div class="ap-field ap-text-step"><label class="ap-sr" for="ap-${id}">${esc(q)}</label><input id="ap-${id}" type="text" ${s.list ? 'list="im-nat"' : ''} autocomplete="${s.auto}" placeholder="${s.placeholder}" value="${esc(a[id] || '')}"><span class="ap-err" id="ap-${id}-err"></span></div>${s.list ? `<datalist id="im-nat">${NAT.map((n) => `<option value="${n}">`).join('')}</datalist>` : ''}${nextBtn('Continue', 'submit')}</form>`;
    } else if (s.type === 'date') {
      const max = new Date(); max.setFullYear(max.getFullYear() + 5);
      h += `<form novalidate><div class="ap-field ap-text-step"><label class="ap-sr" for="ap-date">${esc(q)}</label><input id="ap-date" type="date" value="${a[id] && a[id] !== 'none' ? a[id] : ''}" max="${max.toISOString().slice(0, 10)}"><span class="ap-err" id="ap-date-err"></span></div>
        <button type="button" class="ap-exempt" data-nodate>I’m not sure of the date</button>${nextBtn('Continue', 'submit')}</form>`;
    } else {
      const c = a.draft || {};
      const f = (n, l, type, ac, full, extra = '') => `<div class="ap-field${full ? ' full' : ''}"><label for="ap-${n}">${l}</label><input id="ap-${n}" name="${n}" type="${type}" autocomplete="${ac}" value="${esc(c[n] || '')}" ${extra}><span class="ap-err" id="ap-${n}-err"></span></div>`;
      h += `<form novalidate><div class="ap-grid">${f('fullName', 'Full name', 'text', 'name', true)}${f('email', 'Email address', 'email', 'email', false, 'inputmode="email"')}${f('phone', 'Mobile number', 'tel', 'tel', false, 'inputmode="tel" placeholder="07700 900123"')}</div>
        <p class="ap-note im-mobile">The solicitor will call you, so please give a mobile number.</p>
        <div class="ap-hp" aria-hidden="true"><label>Website<input name="website" tabindex="-1" autocomplete="off"></label></div>
        <label class="ap-consent"><input type="checkbox" name="consent" ${c.consent ? 'checked' : ''}><span>I agree to the <a href="/terms-conditions" target="_blank">Terms</a> and <a href="/privacy-policy" target="_blank">Privacy Policy</a>. Loanleaf will share my details with one UK immigration law firm, who may contact me about my enquiry.</span></label><span class="ap-err" id="ap-consent-err"></span>
        ${nextBtn('Request my call', 'submit')}<div class="ap-formerr" role="alert"></div></form>`;
    }
    return h;
  }

  function wire(id, step) {
    const s = STEPS[id];
    const err = (k, m) => { const e = step.querySelector(`#ap-${k}-err`), i = step.querySelector(`#ap-${k}`); if (e) e.innerHTML = m; if (i) i.setAttribute('aria-invalid', !!m); return !m; };
    if (s.type === 'single') {
      const opts = s.options();
      step.querySelectorAll('.ap-opt').forEach((b) => b.addEventListener('click', () => {
        if (busy) return; busy = true;
        step.querySelectorAll('.ap-opt').forEach((x) => { x.classList.toggle('sel', x === b); x.setAttribute('aria-checked', x === b); });
        const x = opts.find((y) => y.v === b.dataset.v); a[id] = x.v;
        setTimeout(() => { busy = false; go(x.exit ? 'x_' + x.exit : next(id)); }, 220);
      }));
      step.querySelector('[data-next]')?.addEventListener('click', () => go(next(id)));
    } else if (s.type === 'multi') {
      const btn = step.querySelector('[data-next]'), sync = () => { btn.disabled = !a[id].length; }; sync();
      step.querySelectorAll('.ap-opt').forEach((b) => b.addEventListener('click', () => {
        const v = b.dataset.v, on = !a[id].includes(v);
        a[id] = on ? [...a[id], v] : a[id].filter((x) => x !== v);
        b.classList.toggle('sel', on); b.setAttribute('aria-checked', on); sync();
      }));
      btn.addEventListener('click', () => go(next(id)));
    } else if (s.type === 'company' && !a.coManual) {
      wireCompany(id, step);
    } else if (s.type === 'text' || s.type === 'company') {
      const f = step.querySelector('form'), inp = f.querySelector('input');
      f.addEventListener('submit', (e) => { e.preventDefault(); if (err(id, s.validate(inp.value))) { a[id] = inp.value.trim().replace(/\s+/g, ' '); if (id === 'e_company') a.e_company_no = ''; go(next(id)); } });
      inp.addEventListener('input', () => err(id, ''));
    } else if (s.type === 'date') {
      const f = step.querySelector('form'), inp = f.querySelector('input');
      f.addEventListener('submit', (e) => { e.preventDefault(); let m = '';
        if (!inp.value) m = 'Please choose a date';
        else if (daysTo(inp.value) < 0 && a.i_status !== 'expired') m = 'That date has passed. If your visa has run out, go back and update your status';
        else if (inp.value > inp.max) m = 'Please choose a date within the next five years';
        if (err('date', m)) { a[id] = inp.value; go(next(id)); } });
      f.querySelector('[data-nodate]').addEventListener('click', () => { a[id] = 'none'; go(next(id)); });
    } else {
      const f = step.querySelector('form'), el = f.elements, fe = f.querySelector('.ap-formerr');
      const save = () => { a.draft = { fullName: el.fullName.value, email: el.email.value, phone: el.phone.value, consent: el.consent.checked }; };
      let nudged = '';
      const vEmail = () => { const r = checkEmail(el.email.value);
        if (r.fix && nudged !== el.email.value) { nudged = el.email.value;
          err('email', `Did you mean <button type="button" class="ap-fix">${esc(r.fix)}</button>?`);
          step.querySelector('#ap-email-err .ap-fix').onclick = () => { el.email.value = r.fix; err('email', ''); save(); };
          return false; }
        return err('email', r.err); };
      el.fullName.addEventListener('blur', () => el.fullName.value && err('fullName', checkName(el.fullName.value)));
      el.email.addEventListener('blur', () => el.email.value && vEmail());
      el.phone.addEventListener('blur', () => el.phone.value && err('phone', checkPhone(el.phone.value).err));
      f.addEventListener('input', () => { save(); fe.classList.remove('on'); });
      f.addEventListener('submit', (e) => { e.preventDefault(); save();
        const ok = [err('fullName', checkName(el.fullName.value)), vEmail(), err('phone', checkPhone(el.phone.value).err), err('consent', el.consent.checked ? '' : 'Please tick to agree')].every(Boolean);
        if (!ok) { f.querySelector('[aria-invalid="true"]')?.focus(); return; }
        if (el.website.value) return; // honeypot
        const email = el.email.value.trim().toLowerCase(), phone = checkPhone(el.phone.value).n;
        let prev = []; try { prev = JSON.parse(localStorage.getItem(KEY) || '[]'); } catch {}
        if (prev.some((p) => p.email === email || p.phone === phone)) {
          fe.textContent = 'You’ve already sent an enquiry with these details. A solicitor will call you, so there’s no need to send another.'; fe.classList.add('on'); return; }
        try { localStorage.setItem(KEY, JSON.stringify(prev.concat({ email, phone }))); } catch {}
        a.contact = { name: el.fullName.value.trim().replace(/\s+/g, ' '), email, phone };
        go('done'); });
    }
  }

  // Companies House search via /api/company (server holds the key). Dissolved companies can't be picked.
  const CO_STATUS = { dissolved: 'Dissolved', liquidation: 'In liquidation', administration: 'In administration', receivership: 'In receivership', 'converted-closed': 'Closed', 'insolvency-proceedings': 'Insolvency proceedings' };
  function wireCompany(id, step) {
    const inp = step.querySelector('#ap-co'), list = step.querySelector('.ap-co-list');
    let timer, seq = 0, items = [];
    const manual = () => { a.coManual = true; a.e_company_no = ''; show(0); };
    const pick = (c) => { Object.assign(a, { e_company: c.title, e_company_no: c.number, e_company_created: c.created, e_company_address: c.address }); go(next(id)); };
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
          return `<button type="button" class="ap-opt${a.e_company_no === c.number ? ' sel' : ''}" role="radio" aria-checked="${a.e_company_no === c.number}" data-i="${i}"${live ? '' : ' disabled'}><span><b>${esc(c.title)}</b><small>${esc(meta)}</small></span><span class="ap-tick">${TICK}</span></button>`;
        }).join('') : '<p class="ap-note">No companies found. Check the spelling, or enter the name yourself below.</p>';
        list.querySelectorAll('[data-i]').forEach((b) => b.addEventListener('click', () => pick(items[+b.dataset.i])));
      } catch { if (my === seq && !a.e_company_no) manual(); } // search unavailable: fall back to a plain name field
    };
    inp.addEventListener('input', () => { a.e_company = inp.value; a.e_company_no = ''; step.querySelector('.ap-actions')?.remove(); clearTimeout(timer); timer = setTimeout(run, 300); });
    inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); clearTimeout(timer); run(); } });
    step.querySelector('[data-manual]').addEventListener('click', manual);
    step.querySelector('[data-next]')?.addEventListener('click', () => go(next(id)));
    if (inp.value.trim().length >= 2) run();
  }

  function exitScreen(key) {
    const x = EXITS[key], links = typeof x.links === 'function' ? x.links() : x.links;
    return `<div class="ap-step on ap-done"><div class="ap-badge ap-badge-no">${I('<path d="M18 6L6 18M6 6l12 12" stroke-width="3"/>')}</div>
      <h2 class="ap-q" tabindex="-1">Sorry, we can't help with this one</h2><p class="ap-stop">${x.reason}</p>
      <ul class="im-links">${links.map((l) => `<li><a href="${l.href}" target="_blank" rel="noopener">${l.t}</a></li>`).join('')}</ul>
      <div class="ap-actions"><a href="/" class="button ap-next">Back to home</a></div></div>`;
  }
  function doneScreen() {
    const c = a.contact, first = esc(c.name.split(' ')[0]);
    return `<div class="ap-step on ap-done"><div class="ap-badge">${TICK}</div>
      <h2 class="ap-q" tabindex="-1">Thanks, ${first}. A solicitor will call you.</h2>
      <p class="ap-done-lead">They’ll call <b>${fmtPhone(c.phone)}</b> for a free 15-minute phone assessment.</p>
      <ol class="ap-steps-next"><li>A specialist UK immigration solicitor reads your answers</li><li>They call you to talk through where you stand</li><li>If they can help, they explain their fees before any work starts</li></ol></div>`;
  }

  function show(dir) {
    const id = top(), exit = id.startsWith('x_'), done = id === 'done';
    if (exit) { body.innerHTML = exitScreen(id.slice(2)); }
    else if (done) { body.innerHTML = doneScreen(); }
    else { body.innerHTML = `<div class="ap-step on${dir < 0 ? ' back' : ''}">${render(id)}</div>`; wire(id, body.firstElementChild); }
    const p = pathFor(), i = p.indexOf(id);
    bar.innerHTML = p.map((_, k) => `<span${done || (!exit && k <= i) ? ' class="on"' : ''}></span>`).join('');
    count.textContent = done ? 'Complete' : exit ? '' : `Step ${i + 1} of ${p.length}`;
    backBtn.classList.toggle('on', hist.length > 1 && !done && !exit);
    if (dir) { body.querySelector('.ap-q')?.focus({ preventScroll: true }); const r = root.getBoundingClientRect(); if (r.top < 0) root.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  }

  backBtn.addEventListener('click', back);
  show(0);
})();

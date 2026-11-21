// Broker CRM (platform.loanleaf.co/crm, admins only). Loaded by platform.js, which passes its shell helpers in.
// API: /api/crm (api/crm.js). Email goes through Resend, SMS through Bird; stage email flows run daily.
window.LLCRM = async (X) => {
  const { view, h, I, toast, modal, drawer, confirmBox, when, ago, empty, initials, api } = X;
  if (!document.querySelector('link[href^="/assets/crm.css"]')) document.head.appendChild(Object.assign(document.createElement('link'), { rel: 'stylesheet', href: '/assets/crm.css?v=1' }));
  const S = window.LLCRM.state ||= { tab: 'board', q: '', source: '', stage: '' };
  const ic = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const IC = {
    note: ic('<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>'), sms: ic('<path d="M4 5h16v11H9l-5 4z"/>'), call: ic('<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>'),
    flow: ic('<path d="M4 6h10M4 12h16M4 18h7"/><circle cx="18" cy="6" r="2"/><circle cx="15" cy="18" r="2"/>'), stage: ic('<path d="M5 12h14M13 6l6 6-6 6"/>'), system: ic('<circle cx="12" cy="12" r="8"/><path d="M12 8v4l2.5 1.5"/>'),
    search: ic('<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4-4"/>'), trash: ic('<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>'), upload: ic('<path d="M12 16V4M7 9l5-5 5 5M4 20h16"/>'),
    pause: ic('<path d="M9 5v14M15 5v14"/>'), play: ic('<path d="M7 5l12 7-12 7z"/>'), edit: ic('<path d="M4 20h4L19 9l-4-4L4 16z"/>'), link: ic('<path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/>'),
  };
  const KIND = { note: ['Note', IC.note], call: ['Call', IC.call], email: ['Email', I.mail], sms: ['Text', IC.sms], flow: ['Flow email', IC.flow], stage: ['Stage', IC.stage], system: ['Update', IC.system] };
  const day = (d) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  const isoLocal = (d) => { if (!d) return ''; const x = new Date(d); x.setMinutes(x.getMinutes() - x.getTimezoneOffset()); return x.toISOString().slice(0, 16); };
  const overdue = (c) => c.next_action_at && Date.parse(c.next_action_at) < Date.now();
  const today = (c) => c.next_action_at && new Date(c.next_action_at).toDateString() === new Date().toDateString();
  const money = (n) => (n == null ? '' : '£' + Number(n).toLocaleString('en-GB'));
  const OPEN = ['new', 'contacted', 'call_booked', 'proposal', 'onboarding'];

  let D;
  const load = async () => { D = await api('list'); };
  const stageName = (k) => D.stages.find(([x]) => x === k)?.[1] || k;
  const stageTag = (k) => `<span class="crm-stage crm-s-${k}">${h(stageName(k))}</span>`;

  // ------------------------------------------------ page
  async function render() {
    view().innerHTML = '<div class="pf-skel"></div><div class="pf-skel pf-skel-2"></div>';
    try { await load(); } catch (ex) { view().innerHTML = empty('team', 'Couldn’t load the CRM', h(ex.message)); return; }
    draw();
  }
  function filtered() {
    const q = S.q.trim().toLowerCase();
    return D.contacts.filter((c) => (!S.source || c.source === S.source) && (!S.stage || c.stage === S.stage)
      && (!q || [c.name, c.company, c.email, c.phone, c.position, ...(c.tags || [])].some((v) => String(v || '').toLowerCase().includes(q))));
  }
  function draw() {
    const all = D.contacts, open = all.filter((c) => OPEN.includes(c.stage));
    const due = all.filter((c) => overdue(c) || today(c)).length;
    const weekAgo = Date.now() - 7 * 864e5, monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();
    const value = open.reduce((a, c) => a + (c.value || 0), 0);
    const tabs = [['board', 'Pipeline'], ['list', 'Contacts'], ['tasks', `Follow-ups${due ? ` <em class="pf-badge">${due}</em>` : ''}`], ['flows', 'Email flows']];
    view().innerHTML = `<div class="pf-kpis crm-kpis">
        <div class="pf-kpi pf-kpi-dark"><span>${I.team}Open pipeline</span><b>${open.length}</b><em>${value ? `${money(value)} a month expected` : `${all.length} contacts in total`}</em></div>
        <div class="pf-kpi"><span>${I.clock}Follow-ups due</span><b>${due}</b><em>today or overdue</em></div>
        <div class="pf-kpi"><span>${I.plus}New this week</span><b>${all.filter((c) => Date.parse(c.created_at) > weekAgo).length}</b><em>${all.filter((c) => Date.parse(c.created_at) > weekAgo && ['Website enquiry', 'Booked a call', 'Platform sign-up', 'Google search', 'Google Ads', 'Meta ads', 'LinkedIn'].includes(c.source)).length} inbound</em></div>
        <div class="pf-kpi"><span>${I.check}Won this month</span><b>${all.filter((c) => c.stage === 'won' && Date.parse(c.stage_changed_at) >= monthStart).length}</b><em>${all.filter((c) => c.stage === 'won').length} customers in total</em></div></div>
      <div class="pf-toolbar crm-toolbar"><div class="pf-seg pf-seg-scroll" role="tablist">${tabs.map(([k, n]) => `<button role="tab" aria-selected="${S.tab === k}" class="${S.tab === k ? 'on' : ''}" data-tab="${k}">${n}</button>`).join('')}</div>
        <div class="crm-tools">${S.tab === 'flows' ? '' : `<label class="crm-search">${IC.search}<input type="search" placeholder="Search name, firm, email, tag" value="${h(S.q)}" data-q aria-label="Search contacts"></label>
          <select class="pf-select" data-src aria-label="Filter by source"><option value="">All sources</option>${D.sources.map((s) => `<option ${S.source === s ? 'selected' : ''}>${h(s)}</option>`).join('')}</select>`}
          <button class="pf-btn" data-import>${IC.upload}Import</button><button class="pf-btn pf-btn-primary" data-add>${I.plus}Add contact</button></div></div>
      <div data-body></div>`;
    view().querySelectorAll('[data-tab]').forEach((b) => (b.onclick = () => { S.tab = b.dataset.tab; draw(); }));
    const qi = view().querySelector('[data-q]');
    if (qi) qi.oninput = () => { S.q = qi.value; body(); };
    const si = view().querySelector('[data-src]');
    if (si) si.onchange = () => { S.source = si.value; body(); };
    view().querySelector('[data-add]').onclick = () => editContact();
    view().querySelector('[data-import]').onclick = importModal;
    body();
  }
  function body() {
    const el = view().querySelector('[data-body]');
    if (S.tab === 'board') board(el);
    if (S.tab === 'list') list(el);
    if (S.tab === 'tasks') tasks(el);
    if (S.tab === 'flows') flows(el);
  }
  const bindOpen = (root) => root.querySelectorAll('[data-c]').forEach((r) => {
    const go = (e) => { if (e.target.closest('a,button:not([data-c])')) return; contact(+r.dataset.c); };
    r.onclick = go; r.onkeydown = (e) => (e.key === 'Enter') && go(e);
  });

  // ------------------------------------------------ pipeline board (drag a card to change stage)
  function card(c) {
    const next = c.next_action || c.next_action_at ? `<span class="crm-next ${overdue(c) ? 'late' : today(c) ? 'today' : ''}">${I.clock}${h(c.next_action || 'Follow up')}${c.next_action_at ? ` · ${day(c.next_action_at)}` : ''}</span>` : '';
    return `<article class="crm-card" draggable="true" data-c="${c.id}" tabindex="0" aria-label="${h(c.name || c.company)}">
      <div class="crm-card-top"><span class="pf-avatar pf-avatar-s">${initials(c.company || c.name)}</span><div><b>${h(c.company || c.name || c.email || 'Unnamed')}</b><span>${h(c.company ? c.name : c.email || '')}</span></div></div>
      <div class="crm-card-meta"><span class="crm-src">${h(c.source)}</span>${c.value ? `<span>${money(c.value)}/mo</span>` : c.budget ? `<span>${h(c.budget)}</span>` : ''}${c.unsubscribed_at ? '<span class="crm-warn">Unsubscribed</span>' : ''}</div>
      ${next}<span class="crm-card-foot">${c.last_contacted_at ? `Last contact ${ago(c.last_contacted_at)}` : `Added ${ago(c.created_at)}`}${c.broker_id ? ' · on platform' : ''}</span></article>`;
  }
  function board(el) {
    const cs = filtered();
    const cols = D.stages.filter(([k]) => k !== 'lost' || cs.some((c) => c.stage === 'lost'));
    el.innerHTML = `<div class="crm-board">${cols.map(([k, n]) => { const list = cs.filter((c) => c.stage === k).sort((a, b) => (a.next_action_at || 'z').localeCompare(b.next_action_at || 'z') || b.updated_at.localeCompare(a.updated_at));
      return `<section class="crm-col" data-stage="${k}"><header>${stageTag(k)}<span>${list.length}</span></header><div class="crm-col-in">${list.map(card).join('') || '<p class="crm-col-empty">Drop a contact here</p>'}</div></section>`; }).join('')}</div>
      <p class="pf-hint">Drag a card to another column to move it along. Moving a contact starts that stage's email flow (see Email flows).</p>`;
    bindOpen(el);
    let dragId = null;
    el.querySelectorAll('.crm-card').forEach((c) => {
      c.ondragstart = (e) => { dragId = +c.dataset.c; c.classList.add('drag'); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', c.dataset.c); };
      c.ondragend = () => c.classList.remove('drag');
    });
    el.querySelectorAll('.crm-col').forEach((col) => {
      col.ondragover = (e) => { e.preventDefault(); col.classList.add('over'); };
      col.ondragleave = () => col.classList.remove('over');
      col.ondrop = async (e) => {
        e.preventDefault(); col.classList.remove('over');
        const id = dragId || +e.dataTransfer.getData('text/plain'), c = D.contacts.find((x) => x.id === id), stage = col.dataset.stage;
        if (!c || c.stage === stage) return;
        await moveStage(c, stage);
      };
    });
  }
  async function moveStage(c, stage) {
    let reason = '';
    if (stage === 'lost') { reason = await confirmBox({ title: `Mark ${h(c.company || c.name)} as lost?`, text: 'Their email flows stop. You can move them back at any time.', ok: 'Mark as lost', input: 'Reason (optional)' }); modal.close(); if (reason === null) return false; }
    try {
      await api('stage', { id: c.id, stage, reason });
      Object.assign(c, { stage, stage_changed_at: new Date().toISOString(), updated_at: new Date().toISOString() });
      toast(`${c.company || c.name} moved to ${stageName(stage)}`); body(); return true;
    } catch (ex) { toast(ex.message, true); return false; }
  }

  // ------------------------------------------------ contacts table
  function list(el) {
    const cs = filtered().sort((a, b) => b.updated_at.localeCompare(a.updated_at));
    el.innerHTML = `<div class="crm-chips crm-stagefilter">${[['', 'All'], ...D.stages].map(([k, n]) => `<button class="crm-chip ${S.stage === k ? 'on' : ''}" data-sf="${k}">${h(n)} <em>${k ? D.contacts.filter((c) => c.stage === k).length : D.contacts.length}</em></button>`).join('')}</div>
      ${cs.length ? `<div class="pf-card pf-flush"><table class="pf-table"><thead><tr><th>Contact</th><th>Stage</th><th class="pf-hide-s">Source</th><th class="pf-hide-s">Next step</th><th class="pf-hide-s">Last contact</th></tr></thead><tbody>
      ${cs.map((c) => `<tr class="pf-rowlink" data-c="${c.id}" tabindex="0"><td><div class="pf-biz"><span class="pf-avatar pf-avatar-s">${initials(c.company || c.name)}</span><div><b>${h(c.company || c.name || 'Unnamed')}</b><span>${h([c.company ? c.name : '', c.email].filter(Boolean).join(' · '))}</span></div></div></td>
        <td>${stageTag(c.stage)}${c.unsubscribed_at ? '<span class="crm-warn">Unsubscribed</span>' : c.flows_paused ? '<span>Flows paused</span>' : ''}</td><td class="pf-hide-s">${h(c.source)}</td>
        <td class="pf-hide-s">${c.next_action_at ? `<b class="${overdue(c) ? 'crm-late' : ''}">${day(c.next_action_at)}</b><span>${h(c.next_action || '')}</span>` : '<span>–</span>'}</td>
        <td class="pf-hide-s">${c.last_contacted_at ? ago(c.last_contacted_at) : '–'}</td></tr>`).join('')}</tbody></table></div>`
      : empty('team', S.q || S.source || S.stage ? 'No contacts match' : 'No contacts yet', S.q || S.source || S.stage ? 'Try a different search or filter.' : 'Broker enquiries and platform sign-ups appear here automatically. Add people you speak to yourself with Add contact, or paste a list with Import.')}`;
    el.querySelectorAll('[data-sf]').forEach((b) => (b.onclick = () => { S.stage = b.dataset.sf; list(el); }));
    bindOpen(el);
  }

  // ------------------------------------------------ follow-ups
  function tasks(el) {
    const cs = filtered(), withDate = cs.filter((c) => c.next_action_at && c.stage !== 'lost').sort((a, b) => a.next_action_at.localeCompare(b.next_action_at));
    const late = withDate.filter((c) => overdue(c) && !today(c)), tod = withDate.filter(today), soon = withDate.filter((c) => !overdue(c) && !today(c));
    const noStep = cs.filter((c) => OPEN.includes(c.stage) && !c.next_action_at).sort((a, b) => (a.last_contacted_at || a.created_at).localeCompare(b.last_contacted_at || b.created_at));
    const row = (c) => `<tr class="pf-rowlink" data-c="${c.id}" tabindex="0"><td><b>${h(c.company || c.name)}</b><span>${h(c.name && c.company ? c.name : c.email || '')}</span></td><td>${stageTag(c.stage)}</td>
      <td><b class="${overdue(c) && !today(c) ? 'crm-late' : ''}">${c.next_action_at ? when(c.next_action_at) : '–'}</b><span>${h(c.next_action || (c.last_contacted_at ? `Last contact ${ago(c.last_contacted_at)}` : `Added ${ago(c.created_at)}`))}</span></td>
      <td class="pf-r"><div class="pf-actions">${c.phone ? `<a class="pf-btn pf-btn-sm" href="tel:${h(c.phone.replace(/[^\d+]/g, ''))}">${IC.call}Call</a>` : ''}<button class="pf-btn pf-btn-sm" data-c="${c.id}">Open</button></div></td></tr>`;
    const block = (title, sub, rows) => rows.length ? `<div class="pf-card-h pf-mt"><h3>${title}</h3><span>${sub}</span></div><div class="pf-card pf-flush"><table class="pf-table"><tbody>${rows.map(row).join('')}</tbody></table></div>` : '';
    const feed = D.recent.slice(0, 15).map((a) => { const c = D.contacts.find((x) => x.id === a.contact_id); if (!c) return '';
      return `<li data-c="${c.id}" tabindex="0"><span class="crm-feed-ic crm-k-${a.kind}">${KIND[a.kind][1]}</span><div><b>${h(KIND[a.kind][0])}${a.kind === 'email' || a.kind === 'flow' ? `: ${h(a.subject || '')}` : ''}</b><span>${h(c.company || c.name)} · ${ago(a.created_at)}</span>${a.kind === 'note' || a.kind === 'call' || a.kind === 'sms' ? `<p>${h(String(a.body || '').slice(0, 140))}</p>` : ''}</div></li>`; }).join('');
    el.innerHTML = `<div class="crm-tasks"><div>${block('Overdue', `${late.length} to catch up on`, late)}${block('Today', `${tod.length} due`, tod)}${block('Coming up', 'next steps you’ve scheduled', soon.slice(0, 30))}
        ${block('No next step', 'open deals with nothing scheduled, oldest first', noStep.slice(0, 30))}
        ${!withDate.length && !noStep.length ? empty('clock', 'Nothing to follow up', 'Set a next step on a contact and it shows up here on the day.') : ''}</div>
      <aside class="pf-card crm-feed-card"><div class="pf-card-h"><h3>Recent activity</h3></div>${feed ? `<ul class="crm-feed">${feed}</ul>` : '<p class="pf-hint">Emails, texts, calls and notes appear here.</p>'}</aside></div>`;
    bindOpen(el);
  }

  // ------------------------------------------------ email flows
  async function flows(el) {
    el.innerHTML = '<div class="pf-skel"></div>';
    let F; try { F = await api('flows'); } catch (ex) { el.innerHTML = empty('mail', 'Couldn’t load flows', h(ex.message)); return; }
    const groups = F.stages.map(([k, n]) => [k, n, F.flows.filter((s) => s.stage === k)]).filter(([, , s]) => s.length);
    el.innerHTML = `<p class="pf-hint crm-flowhint">Automatic emails sent in your name, with replies going to your inbox, while a contact sits in a stage. Each email goes out on a weekday morning on the day shown, at most one at a time and never within 2 days of your last message. Moving a contact on stops the rest. Unsubscribed contacts and contacts with flows paused are skipped.</p>
      ${groups.map(([k, n, steps]) => `<div class="pf-card-h pf-mt">${stageTag(k)}<span>${steps.length} email${steps.length === 1 ? '' : 's'}</span></div>
      <div class="pf-card pf-flush"><table class="pf-table crm-flowtable"><tbody>${steps.map((s) => `<tr><td class="crm-flowday"><b>Day ${s.day}</b><span>${s.day ? 'after entering' : 'straight away'}</span></td>
        <td><b>${h(s.subject)}</b><span>${h(s.body.replace(/\s+/g, ' ').slice(0, 120))}…</span></td><td class="pf-hide-s"><span>${s.sent} sent</span>${s.edited ? '<span>Edited</span>' : ''}</td>
        <td class="pf-r"><div class="pf-actions"><label class="crm-toggle" title="${s.on ? 'On' : 'Off'}"><input type="checkbox" role="switch" data-on="${s.id}" ${s.on ? 'checked' : ''} aria-label="Send ${h(s.subject)}"><span></span></label><button class="pf-btn pf-btn-sm" data-edit="${s.id}">${IC.edit}Edit</button></div></td></tr>`).join('')}</tbody></table></div>`).join('')}
      <div class="pf-row-l pf-mt"><button class="pf-btn" data-run>${IC.play}Send anything due now</button></div>`;
    const save = async (next) => { try { const r = await api('flows', { flows: next }); F.flows = r.flows; toast('Flows saved'); flows(el); } catch (ex) { toast(ex.message, true); } };
    el.querySelectorAll('[data-on]').forEach((x) => (x.onchange = () => save(F.flows.map((s) => (s.id === x.dataset.on ? { ...s, on: x.checked } : s)))));
    el.querySelectorAll('[data-edit]').forEach((b) => (b.onclick = () => {
      const s = F.flows.find((x) => x.id === b.dataset.edit);
      modal.className = 'pf-modal pf-modal-wide'; modal.onclick = null; modal.onclose = null;
      modal.innerHTML = `<form class="pf-modal-in pf-form" data-f><h2>${h(stageName(s.stage))}: day ${s.day}</h2>
        <div class="crm-two-s"><label>Send on day<input name="day" type="number" min="0" max="365" value="${s.day}"></label><label>Subject<input name="subject" value="${h(s.subject)}" required></label></div>
        <label>Message<textarea name="body" rows="14" required>${h(s.body)}</textarea></label>
        <p class="pf-hint">${mergeHelp}</p>
        <div class="crm-preview" data-pv hidden></div>
        <div class="pf-row"><button type="button" class="pf-btn" data-reset>Reset to default</button><button type="button" class="pf-btn" data-prev>Preview</button><button type="button" class="pf-btn" data-x>Cancel</button><button class="pf-btn pf-btn-primary">Save</button></div></form>`;
      if (!modal.open) modal.showModal();
      const f = modal.querySelector('[data-f]');
      f.querySelector('[data-x]').onclick = () => modal.close();
      f.querySelector('[data-reset]').onclick = () => { f.subject.value = s.default?.subject || s.subject; f.body.value = s.default?.body || s.body; f.day.value = s.default?.day ?? s.day; };
      f.querySelector('[data-prev]').onclick = () => preview(f.querySelector('[data-pv]'), 0, f.subject.value, f.body.value);
      f.onsubmit = (e) => { e.preventDefault(); modal.close(); save(F.flows.map((x) => (x.id === s.id ? { ...x, subject: f.subject.value, body: f.body.value, day: +f.day.value } : x))); };
    }));
    el.querySelector('[data-run]').onclick = async (e) => { e.target.disabled = true; try { const r = await api('run-flows', {}); toast(`${r.sent} email${r.sent === 1 ? '' : 's'} sent`); flows(el); } catch (ex) { toast(ex.message, true); e.target.disabled = false; } };
  }
  const mergeHelp = 'Merge tags: {first_name}, {company}, {sender_name}, {signup_link}, {calculator_link}, {booking_link}. Make a link with [link text]({signup_link}). Leave a blank line between paragraphs.';
  async function preview(box, id, subject, body) {
    box.hidden = false; box.innerHTML = '<div class="pf-skel"></div>';
    try { const p = await api('preview', { id, subject, body }); box.innerHTML = `<div class="crm-pv-subj"><span>Subject</span><b>${h(p.subject)}</b></div><iframe title="Email preview" sandbox="" srcdoc="${h(p.html)}"></iframe>`; }
    catch (ex) { box.innerHTML = `<p class="pf-err">${h(ex.message)}</p>`; }
  }

  // ------------------------------------------------ add / edit contact
  function form(c = {}) {
    return `<div class="pf-two"><label>Full name<input name="name" value="${h(c.name || '')}" autocomplete="off"></label><label>Company<input name="company" value="${h(c.company || '')}" autocomplete="off"></label></div>
      <div class="pf-two"><label>Email<input name="email" type="email" value="${h(c.email || '')}" autocomplete="off"></label><label>Phone<input name="phone" type="tel" value="${h(c.phone || '')}" autocomplete="off"></label></div>
      <div class="pf-two"><label>Position<input name="position" value="${h(c.position || '')}"></label><label>Website<input name="website" value="${h(c.website || '')}" placeholder="example.co.uk"></label></div>
      <div class="pf-two"><label>How they found us<select name="source" class="pf-select">${D.sources.map((s) => `<option ${(c.source || 'LinkedIn outreach') === s ? 'selected' : ''}>${h(s)}</option>`).join('')}</select></label>
        <label>Source detail<input name="source_detail" value="${h(c.source_detail || '')}" placeholder="e.g. LinkedIn post, referred by Tom"></label></div>
      <div class="pf-two"><label>Leads a month<input name="leads_per_month" value="${h(c.leads_per_month || '')}" placeholder="e.g. 50 to 100"></label><label>Expected spend a month (£)<input name="value" inputmode="numeric" value="${c.value ?? ''}" placeholder="e.g. 2500"></label></div>
      <label>Tags<input name="tags" value="${h((c.tags || []).join(', '))}" placeholder="Comma separated, e.g. Asset finance, London"></label>`;
  }
  function editContact() {
    modal.className = 'pf-modal pf-modal-wide'; modal.onclick = null; modal.onclose = null;
    modal.innerHTML = `<form class="pf-modal-in pf-form" data-f><h2>Add a contact</h2>${form()}
      <div class="pf-two"><label>Stage<select name="stage" class="pf-select">${D.stages.map(([k, n]) => `<option value="${k}" ${k === 'contacted' ? 'selected' : ''}>${h(n)}</option>`).join('')}</select></label>
        <label>Next step on<input name="next_action_at" type="datetime-local"></label></div>
      <label>Next step<input name="next_action" placeholder="e.g. Call back about pricing"></label>
      <label>Note<textarea name="note" rows="3" placeholder="What you talked about"></textarea></label>
      <label class="pf-check"><input type="checkbox" name="flows_paused"> Don't send automatic flow emails</label>
      <p class="pf-err" data-err></p><div class="pf-row"><button type="button" class="pf-btn" data-x>Cancel</button><button class="pf-btn pf-btn-primary">Add contact</button></div></form>`;
    if (!modal.open) modal.showModal();
    const f = modal.querySelector('[data-f]');
    f.querySelector('[data-x]').onclick = () => modal.close();
    f.onsubmit = async (e) => {
      e.preventDefault();
      const v = Object.fromEntries(new FormData(f)); v.flows_paused = !!f.flows_paused.checked;
      const btn = f.querySelector('button:not([type])'); btn.disabled = true;
      try { const r = await api('save', v); modal.close(); toast('Contact added'); await load(); draw(); contact(r.contact.id); }
      catch (ex) { f.querySelector('[data-err]').textContent = ex.message; btn.disabled = false; }
    };
  }

  // ------------------------------------------------ import (paste CSV)
  function parseCsv(text) {
    const rows = []; let row = [], cell = '', q = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (q) { if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (ch === '"') q = false; else cell += ch; continue; }
      if (ch === '"') q = true; else if (ch === ',' || ch === '\t') { row.push(cell); cell = ''; } else if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; } else cell += ch;
    }
    if (cell || row.length) { row.push(cell); rows.push(row); }
    return rows.filter((r) => r.some((x) => x.trim()));
  }
  const COLS = { name: /^(full ?)?name$|^contact/i, first: /^first/i, last: /^(last|sur)/i, company: /company|firm|organi[sz]ation|business/i, email: /e-?mail/i, phone: /phone|mobile|tel/i, position: /position|title|role/i, website: /web|url|site/i };
  function importModal() {
    modal.className = 'pf-modal pf-modal-wide'; modal.onclick = null; modal.onclose = null;
    modal.innerHTML = `<form class="pf-modal-in pf-form" data-f><h2>Import contacts</h2>
      <p>Paste rows from a spreadsheet or CSV, with a header row. Columns we understand: name (or first name and last name), company, email, phone, position, website. Emails already in the CRM are skipped.</p>
      <textarea name="csv" rows="8" placeholder="name,company,email,phone&#10;Sam Taylor,Taylor Finance Ltd,sam@taylorfinance.co.uk,07700 900123" required></textarea>
      <div class="pf-two"><label>How they found us<select name="source" class="pf-select">${D.sources.map((s) => `<option ${s === 'LinkedIn outreach' ? 'selected' : ''}>${h(s)}</option>`).join('')}</select></label>
        <label>Stage<select name="stage" class="pf-select">${D.stages.map(([k, n]) => `<option value="${k}" ${k === 'contacted' ? 'selected' : ''}>${h(n)}</option>`).join('')}</select></label></div>
      <div class="pf-two"><label>Tags<input name="tags" placeholder="e.g. Nov outreach"></label><label>Source detail<input name="detail" placeholder="e.g. NACFB member list"></label></div>
      <label class="pf-check"><input type="checkbox" name="flowsPaused"> Don't send automatic flow emails to these contacts</label>
      <p class="pf-hint" data-count></p><p class="pf-err" data-err></p>
      <div class="pf-row"><button type="button" class="pf-btn" data-x>Cancel</button><button class="pf-btn pf-btn-primary">Import</button></div></form>`;
    if (!modal.open) modal.showModal();
    const f = modal.querySelector('[data-f]');
    const rowsOf = () => {
      const r = parseCsv(f.csv.value); if (r.length < 2) return [];
      const head = r[0].map((x) => x.trim()), idx = Object.fromEntries(Object.entries(COLS).map(([k, re]) => [k, head.findIndex((x) => re.test(x))]));
      return r.slice(1).map((cells) => { const g = (k) => (idx[k] >= 0 ? String(cells[idx[k]] || '').trim() : '');
        return { name: g('name') || [g('first'), g('last')].filter(Boolean).join(' '), company: g('company'), email: g('email'), phone: g('phone'), position: g('position'), website: g('website') }; });
    };
    f.csv.oninput = () => { const n = rowsOf().length; f.querySelector('[data-count]').textContent = n ? `${n} contact${n === 1 ? '' : 's'} found` : ''; };
    f.querySelector('[data-x]').onclick = () => modal.close();
    f.onsubmit = async (e) => {
      e.preventDefault();
      const rows = rowsOf(); if (!rows.length) { f.querySelector('[data-err]').textContent = 'Add a header row and at least one contact.'; return; }
      const btn = f.querySelector('button:not([type])'); btn.disabled = true;
      try { const r = await api('import', { rows, source: f.source.value, stage: f.stage.value, tags: f.tags.value, detail: f.detail.value, flowsPaused: f.flowsPaused.checked });
        modal.close(); toast(`${r.added} added${r.skipped ? `, ${r.skipped} skipped` : ''}`); await load(); draw(); }
      catch (ex) { f.querySelector('[data-err]').textContent = ex.message; btn.disabled = false; }
    };
  }

  // ------------------------------------------------ contact drawer
  async function contact(id, focus) {
    drawer('<div class="pf-skel"></div>');
    let d; try { d = await api(`contact&id=${id}`); } catch (ex) { modal.close(); return toast(ex.message, true); }
    const c = d.contact, b = d.broker, tel = (c.phone || '').replace(/[^\d+]/g, '');
    const acts = d.activities;
    const tl = acts.map((a) => `<li class="crm-tl-${a.kind}"><span class="crm-feed-ic crm-k-${a.kind}">${KIND[a.kind][1]}</span><div>
        <div class="crm-tl-h"><b>${h(KIND[a.kind][0])}${a.subject ? `: ${h(a.subject)}` : ''}</b><span title="${h(new Date(a.created_at).toLocaleString('en-GB'))}">${ago(a.created_at)}</span>${a.kind === 'note' || a.kind === 'call' ? `<button class="pf-iconbtn crm-tl-x" data-del="${a.id}" aria-label="Delete">${IC.trash}</button>` : ''}</div>
        ${a.body ? `<p class="${a.kind === 'email' || a.kind === 'flow' ? 'crm-tl-mail' : ''}">${h(a.body)}</p>` : ''}${a.meta?.outcome ? `<span class="crm-src">${h(a.meta.outcome)}</span>` : ''}</div></li>`).join('');
    drawer(`<div class="pf-dh"><span class="pf-avatar pf-avatar-lg">${initials(c.company || c.name)}</span><div><span class="pf-eyebrow">${h(c.source)} · added ${day(c.created_at)}</span><h2>${h(c.company || c.name || c.email || 'Unnamed')}</h2>${c.company && c.name ? `<span class="crm-sub">${h(c.name)}${c.position ? `, ${h(c.position)}` : ''}</span>` : ''}</div></div>
      <div class="crm-stagebar" role="group" aria-label="Stage">${D.stages.map(([k, n]) => `<button type="button" class="${c.stage === k ? 'on' : ''} crm-s-${k}" data-st="${k}">${h(n)}</button>`).join('')}</div>
      <div class="crm-quick">
        <button class="pf-btn" data-act="email" ${c.email ? '' : 'disabled'}>${I.mail}Email</button>
        <button class="pf-btn" data-act="sms" ${c.phone ? '' : 'disabled'}>${IC.sms}Text</button>
        ${tel ? `<a class="pf-btn" href="tel:${h(tel)}">${IC.call}Call</a>` : ''}
        <button class="pf-btn" data-act="call">${IC.call}Log call</button>
        <button class="pf-btn" data-act="note">${IC.note}Note</button></div>
      ${c.unsubscribed_at ? `<div class="pf-banner pf-banner-warn">${I.x}<div><b>Unsubscribed ${day(c.unsubscribed_at)}.</b> They get no flow emails. Only email them if they've asked you to.</div><button class="pf-btn pf-btn-sm" data-resub>Resubscribe</button></div>` : ''}
      <div data-compose></div>
      <form class="crm-next-form" data-next><label>Next step<input name="next_action" value="${h(c.next_action || '')}" placeholder="e.g. Send pricing, call back Tuesday"></label>
        <label>When<input name="next_action_at" type="datetime-local" value="${isoLocal(c.next_action_at)}"></label>
        <div class="crm-next-quick">${[['Tomorrow', 1], ['In 3 days', 3], ['Next week', 7]].map(([l, n]) => `<button type="button" class="crm-chip" data-in="${n}">${l}</button>`).join('')}<button type="button" class="crm-chip" data-in="0">Clear</button></div>
        <button class="pf-btn pf-btn-sm pf-btn-primary">Save next step</button></form>
      <div class="crm-facts">
        ${[['Email', c.email ? `<a href="mailto:${h(c.email)}">${h(c.email)}</a>` : '–'], ['Phone', c.phone ? `<a href="tel:${h(tel)}">${h(c.phone)}</a>` : '–'], ['Leads a month', h(c.leads_per_month || '–')], ['Budget', h(c.budget || (c.value ? `${money(c.value)}/mo` : '–'))],
          ['Found us', `${h(c.source)}${c.source_detail ? `<span>${h(c.source_detail)}</span>` : ''}`], ['Website', c.website ? `<a href="${h(/^https?:/.test(c.website) ? c.website : `https://${c.website}`)}" target="_blank" rel="noopener">${h(c.website.replace(/^https?:\/\//, ''))}</a>` : '–'],
          ...(c.tags?.length ? [['Tags', c.tags.map((t) => `<span class="crm-src">${h(t)}</span>`).join(' ')]] : []), ...(c.lost_reason ? [['Lost because', h(c.lost_reason)]] : [])]
          .map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</div>
      ${b ? `<div class="crm-broker"><span class="pf-avatar pf-avatar-s">${initials(b.company)}</span><div><b>On Loanleaf Platform</b><span>${b.suspended_at ? 'Suspended' : b.approved ? 'Approved' : 'Waiting for approval'} · ${Number(b.credits).toLocaleString('en-GB')} credits · ${b.stripe_customer ? 'paying' : 'no plan yet'}</span></div><a class="pf-btn pf-btn-sm" href="${X.P}/admin">Admin</a></div>` : ''}
      <h3 class="pf-dsec">Email flow</h3>
      <div class="crm-flowbox">${c.unsubscribed_at ? '<p class="pf-hint">Stopped: unsubscribed.</p>' : c.flows_paused ? '<p class="pf-hint">Paused for this contact.</p>'
        : d.upcoming.length ? `<ul>${d.upcoming.map((s) => `<li><b>${h(s.subject)}</b><span>${s.overdue ? 'Due now, sends on the next weekday run' : `Day ${s.day} · ${day(s.due)}`}</span></li>`).join('')}</ul>` : `<p class="pf-hint">No more flow emails while they're in ${h(stageName(c.stage))}.</p>`}
        <button class="pf-btn pf-btn-sm" data-pause>${c.flows_paused ? `${IC.play}Resume flow emails` : `${IC.pause}Pause flow emails`}</button></div>
      <h3 class="pf-dsec">Timeline</h3>${tl ? `<ul class="crm-tl">${tl}</ul>` : '<p class="pf-hint">Nothing yet.</p>'}
      <details class="crm-edit"><summary>Edit details</summary><form class="pf-form" data-edit>${form(c)}<label>Lost reason<input name="lost_reason" value="${h(c.lost_reason || '')}"></label><p class="pf-err" data-err></p>
        <div class="pf-row-l"><button class="pf-btn pf-btn-primary">Save details</button><button type="button" class="pf-btn pf-btn-danger" data-delete>${IC.trash}Delete contact</button></div></form></details>`);
    const M = modal, reopen = (f2) => contact(id, f2);
    const refresh = async () => { await load(); body(); };
    M.querySelectorAll('[data-st]').forEach((x) => (x.onclick = async () => { if (await moveStage(D.contacts.find((y) => y.id === id) || c, x.dataset.st)) reopen(); else if (!M.open) reopen(); }));
    M.querySelectorAll('[data-act]').forEach((x) => (x.onclick = () => compose(x.dataset.act)));
    M.querySelectorAll('[data-del]').forEach((x) => (x.onclick = async () => { try { await api('note-delete', { id, activity: +x.dataset.del }); reopen(); } catch (ex) { toast(ex.message, true); } }));
    M.querySelector('[data-resub]')?.addEventListener('click', async () => { try { await api('save', { id, resubscribe: true }); toast('Resubscribed'); await refresh(); reopen(); } catch (ex) { toast(ex.message, true); } });
    M.querySelector('[data-pause]').onclick = async () => { try { await api('save', { id, flows_paused: !c.flows_paused }); toast(c.flows_paused ? 'Flow emails resumed' : 'Flow emails paused'); await refresh(); reopen(); } catch (ex) { toast(ex.message, true); } };
    const nf = M.querySelector('[data-next]');
    nf.querySelectorAll('[data-in]').forEach((x) => (x.onclick = () => {
      if (x.dataset.in === '0') { nf.next_action_at.value = ''; nf.next_action.value = ''; return; }
      const t = new Date(); t.setDate(t.getDate() + +x.dataset.in); t.setHours(10, 0, 0, 0); nf.next_action_at.value = isoLocal(t);
    }));
    nf.onsubmit = async (e) => { e.preventDefault(); try { await api('save', { id, next_action: nf.next_action.value, next_action_at: nf.next_action_at.value ? new Date(nf.next_action_at.value).toISOString() : null }); toast('Next step saved'); await refresh(); } catch (ex) { toast(ex.message, true); } };
    const ef = M.querySelector('[data-edit]');
    ef.onsubmit = async (e) => { e.preventDefault(); try { await api('save', { id, ...Object.fromEntries(new FormData(ef)) }); toast('Saved'); await refresh(); reopen(); } catch (ex) { ef.querySelector('[data-err]').textContent = ex.message; } };
    M.querySelector('[data-delete]').onclick = async () => {
      const r = await confirmBox({ title: `Delete ${h(c.company || c.name)}?`, text: 'This removes the contact and their whole timeline. It can’t be undone.', ok: 'Delete', danger: true });
      if (r === null) return reopen();
      try { await api('delete', { id }); modal.close(); toast('Contact deleted'); await refresh(); } catch (ex) { toast(ex.message, true); }
    };

    // Inline composers (email, text, call log, note) open above the next-step form.
    async function compose(kind) {
      const box = M.querySelector('[data-compose]');
      if (kind === 'note' || kind === 'call') {
        box.innerHTML = `<form class="crm-compose pf-form" data-cf><b>${kind === 'call' ? 'Log a call' : 'Add a note'}</b>
          ${kind === 'call' ? `<div class="crm-chips">${['Spoke to them', 'Left voicemail', 'No answer', 'Wrong number'].map((o, i) => `<label class="crm-chip"><input type="radio" name="outcome" value="${o}" ${i ? '' : 'checked'}><span>${o}</span></label>`).join('')}</div>` : ''}
          <textarea name="body" rows="4" placeholder="${kind === 'call' ? 'What did you talk about?' : 'Write a note'}" required></textarea>
          <div class="pf-row-l"><button class="pf-btn pf-btn-primary">Save</button><button type="button" class="pf-btn" data-cx>Cancel</button></div></form>`;
        const f = box.querySelector('[data-cf]'); f.body.focus();
        f.querySelector('[data-cx]').onclick = () => (box.innerHTML = '');
        f.onsubmit = async (e) => { e.preventDefault(); try { await api('note', { id, kind, body: f.body.value, outcome: f.outcome?.value }); toast(kind === 'call' ? 'Call logged' : 'Note added'); await refresh(); reopen(); } catch (ex) { toast(ex.message, true); } };
        return;
      }
      if (kind === 'sms') {
        const live = D.sms;
        box.innerHTML = `<form class="crm-compose pf-form" data-cf><b>Text ${h(c.name || c.phone)}</b><span class="pf-hint">${h(d.e164 || c.phone)}${d.mobile ? '' : ' · this doesn’t look like a UK mobile'}</span>
          <textarea name="body" rows="4" maxlength="640" required>Hi {first_name}, it's ${h((X.me.contact_name || '').split(' ')[0] || 'Aran')} from Loanleaf. </textarea><span class="pf-hint" data-n></span>
          ${live ? '' : '<p class="pf-hint">SMS sending isn’t connected yet, so this opens the message on your phone and logs it here.</p>'}
          <div class="pf-row-l">${live ? '<button class="pf-btn pf-btn-primary">Send text</button>' : '<button class="pf-btn pf-btn-primary">Open on my phone and log it</button>'}<button type="button" class="pf-btn" data-cx>Cancel</button></div></form>`;
        const f = box.querySelector('[data-cf]'), n = f.querySelector('[data-n]'), count = () => { const l = f.body.value.length; n.textContent = `${l} characters · ${Math.max(1, Math.ceil(l / 153))} text${l > 160 ? 's' : ''}`; };
        f.body.oninput = count; count(); f.body.focus(); f.body.setSelectionRange(f.body.value.length, f.body.value.length);
        f.querySelector('[data-cx]').onclick = () => (box.innerHTML = '');
        f.onsubmit = async (e) => {
          e.preventDefault();
          const text = f.body.value.replace(/\{first_name\}/g, (c.name || '').split(' ')[0] || 'there');
          if (!live) location.href = `sms:${encodeURIComponent(d.e164 || tel)}?&body=${encodeURIComponent(text)}`;
          try { await api('sms', { id, body: f.body.value, logOnly: !live }); toast(live ? 'Text sent' : 'Logged'); await refresh(); reopen(); } catch (ex) { toast(ex.message, true); }
        };
        return;
      }
      // email
      let F; try { F = (await api('flows')).flows; } catch { F = []; }
      const tpls = F.filter((s) => s.stage === c.stage).concat(F.filter((s) => s.stage !== c.stage));
      box.innerHTML = `<form class="crm-compose pf-form" data-cf><b>Email ${h(c.name || c.email)}</b><span class="pf-hint">To ${h(c.email)} · replies go to your inbox</span>
        <label>Start from<select class="pf-select" name="tpl"><option value="">Blank email</option>${tpls.map((s) => `<option value="${s.id}">${h(stageName(s.stage))}: ${h(s.subject)}</option>`).join('')}</select></label>
        <label>Subject<input name="subject" required></label>
        <label>Message<textarea name="body" rows="10" required>Hi {first_name},\n\n</textarea></label>
        <p class="pf-hint">${mergeHelp}</p>
        <label>Then move to<select class="pf-select" name="stage"><option value="">Keep in ${h(stageName(c.stage))}</option>${D.stages.filter(([k]) => k !== c.stage).map(([k, n]) => `<option value="${k}" ${c.stage === 'new' && k === 'contacted' ? 'selected' : ''}>${h(n)}</option>`).join('')}</select></label>
        <div class="crm-preview" data-pv hidden></div>
        <div class="pf-row-l"><button class="pf-btn pf-btn-primary">${I.mail}Send email</button><button type="button" class="pf-btn" data-prev>Preview</button><button type="button" class="pf-btn" data-cx>Cancel</button></div></form>`;
      const f = box.querySelector('[data-cf]'); f.subject.focus();
      f.tpl.onchange = () => { const s = F.find((x) => x.id === f.tpl.value); if (s) { f.subject.value = s.subject; f.body.value = s.body; } };
      f.querySelector('[data-cx]').onclick = () => (box.innerHTML = '');
      f.querySelector('[data-prev]').onclick = () => preview(f.querySelector('[data-pv]'), id, f.subject.value, f.body.value);
      f.onsubmit = async (e) => {
        e.preventDefault(); const btn = f.querySelector('button:not([type])'); btn.disabled = true;
        try { await api('email', { id, subject: f.subject.value, body: f.body.value, stage: f.stage.value }); toast('Email sent'); await refresh(); reopen(); }
        catch (ex) { toast(ex.message, true); btn.disabled = false; }
      };
    }
    if (focus) compose(focus);
  }

  await render();
};

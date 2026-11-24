// One branded shell for every email Leaflegal sends: platform emails to firms, CRM follow-ups,
// enquiry confirmations to the public and the team's form notifications.
// Table layout with inline styles so it holds up in Gmail, Outlook and phone mail apps.
// No imports, so any API route can use it without pulling in the platform code.

export const SITE = 'https://leaflegal.co';
export const LOGO_WHITE = `${SITE}/assets/Leaflegal_Logo_White_email.png`; // 720x158 PNG (SVG doesn't show in Gmail or Outlook)
export const C = { G: '#244237', SAGE: '#579e83', MINT: '#bddbd1', PALE: '#e3f1ed', INK: '#14271f', TEXT: '#2b3f36', MUTED: '#62786f', FAINT: '#86998f', LINE: '#dde5e1', SOFT: '#f5f9f7', BG: '#eef3f0' };
export const F = 'font-family:Arial,Helvetica,sans-serif;';
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// A paragraph of body copy (html is trusted, already escaped by the caller).
export const para = (html, extra = '') => `<p style="${F}margin:0 0 18px;font-size:15px;line-height:1.65;color:${C.TEXT};${extra}">${html}</p>`;

// Bulletproof button. bgcolor on the cell keeps the colour in Outlook, which ignores the rounded corners.
export function button({ label, url }, { center = false, outline = false } = {}) {
  const cell = outline ? `border:2px solid ${C.G};border-radius:8px` : `background:${C.G};border-radius:8px`;
  return `<table role="presentation" cellpadding="0" cellspacing="0" ${center ? 'align="center" ' : ''}style="margin:${center ? '4px auto 0' : '6px 0 24px'}"><tr><td ${outline ? '' : `bgcolor="${C.G}" `}style="${cell}"><a href="${esc(url)}" style="${F}display:inline-block;padding:${outline ? '13px 26px' : '15px 30px'};border-radius:8px;color:${outline ? C.G : '#ffffff'};text-decoration:none;font-weight:bold;font-size:15px;letter-spacing:.2px;white-space:nowrap">${esc(label)}&nbsp;&rarr;</a></td></tr></table>`;
}

// Label and value table in a soft panel. rows: [[label, valueHtml]] (values must already be escaped).
export function detailsTable(rows, { title = '' } = {}) {
  const tr = rows.map(([k, v], i) => `<tr><td style="${F}padding:12px 18px;${i || title ? `border-top:1px solid ${C.LINE};` : ''}font-size:13px;line-height:1.5;color:${C.MUTED};width:38%;vertical-align:top">${esc(k)}</td><td style="${F}padding:12px 18px;${i || title ? `border-top:1px solid ${C.LINE};` : ''}font-size:14px;line-height:1.5;font-weight:bold;color:${C.INK};vertical-align:top;white-space:pre-wrap;word-break:break-word">${v === '' || v == null ? '–' : v}</td></tr>`).join('');
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:6px 0 24px;background:${C.SOFT};border:1px solid ${C.LINE};border-radius:10px;border-collapse:separate">
${title ? `<tr><td colspan="2" style="${F}padding:14px 18px 10px;font-size:11px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;color:${C.SAGE}">${esc(title)}</td></tr>` : ''}${tr}</table>`;
}

// Numbered steps with green number badges. items: [[title, textHtml]] or plain strings (escaped html).
export function numbered(items) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:4px 0 12px">${items.map((it, i) => {
    const [t, d] = Array.isArray(it) ? it : [null, it];
    return `<tr><td style="padding:0 14px 16px 0;vertical-align:top;width:28px"><div style="${F}width:28px;height:28px;line-height:28px;border-radius:14px;background:${C.G};color:#ffffff;font-weight:bold;font-size:13px;text-align:center">${i + 1}</div></td><td style="${F}padding:4px 0 16px;vertical-align:top">${t ? `<div style="font-weight:bold;font-size:15px;line-height:1.4;color:${C.INK};margin:0 0 4px">${esc(t)}</div>` : ''}${d ? `<div style="font-size:${t ? 14 : 15}px;line-height:1.6;color:${t ? C.MUTED : C.TEXT}">${d}</div>` : ''}</td></tr>`;
  }).join('')}</table>`;
}

// The whole email. body is trusted html for the white card.
// above: optional html between the card and the footer (for example the platform links).
// footer: html lines for the small print, company details always follow.
// unsub: unsubscribe url, shown as a link in the footer.
// logoHref: where the logo links (null for no link).
export function shell({ title = 'Leaflegal', preheader = '', heading = '', body = '', above = '', footer = '', links = true, unsub = '', logoHref = SITE }) {
  const logo = `<img src="${LOGO_WHITE}" width="136" height="30" alt="Leaflegal" style="display:block;border:0;outline:none;width:136px;height:30px;color:#ffffff;${F}font-size:22px;font-weight:bold">`;
  const small = `color:${C.FAINT};text-decoration:underline`;
  return `<!doctype html><html lang="en" xmlns="http://www.w3.org/1999/xhtml"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="x-apple-disable-message-reformatting"><meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light"><title>${esc(title)}</title>
<!--[if mso]><style>table,td,div,p,a{font-family:Arial,Helvetica,sans-serif!important}</style><![endif]-->
<style>a{text-decoration-skip-ink:auto}@media only screen and (max-width:560px){.ll-outer{padding:16px 8px 28px!important}.ll-head{padding:22px 22px!important}.ll-body{padding:30px 22px 26px!important}.ll-h1{font-size:23px!important}.ll-btns,.ll-btns tbody,.ll-btns tr{display:block!important;width:100%!important}.ll-btns td{display:block!important;width:100%!important;box-sizing:border-box;text-align:center!important}.ll-btns .ll-gap{height:10px!important;width:auto!important}.ll-btns a{display:block!important}.ll-cards{margin:0!important}.ll-card{display:block!important;max-width:none!important;width:auto!important;margin:0 0 10px!important}.ll-purpose{height:auto!important}}</style></head>
<body style="margin:0;padding:0;background:${C.BG};-webkit-text-size-adjust:100%">
${preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;mso-hide:all">${esc(preheader)}${'&#8203;&nbsp;'.repeat(40)}</div>` : ''}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="${C.BG}" style="background:${C.BG}"><tr><td class="ll-outer" align="center" style="padding:32px 12px 40px">
<!--[if mso]><table role="presentation" width="600" cellpadding="0" cellspacing="0"><tr><td><![endif]-->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px">
<tr><td class="ll-head" bgcolor="${C.G}" style="background:${C.G};padding:26px 40px;border-radius:14px 14px 0 0">${logoHref ? `<a href="${esc(logoHref)}" style="text-decoration:none">${logo}</a>` : logo}</td></tr>
<tr><td height="5" bgcolor="${C.SAGE}" style="height:5px;line-height:5px;font-size:0;background:${C.SAGE}">&nbsp;</td></tr>
<tr><td class="ll-body" bgcolor="#ffffff" style="background:#ffffff;padding:40px 40px 34px;border:1px solid ${C.LINE};border-top:0;border-radius:0 0 14px 14px">
${heading ? `<h1 class="ll-h1" style="${F}margin:0 0 22px;font-size:26px;line-height:1.25;font-weight:bold;color:${C.INK}">${esc(heading)}</h1>` : ''}${body}
</td></tr>
${above}
<tr><td align="center" style="padding:24px 28px 8px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:470px"><tr><td align="center" style="${F}font-size:12px;line-height:1.65;color:${C.FAINT}">
${footer ? `<p style="margin:0 0 12px">${footer}</p>` : ''}<p style="margin:0 0 12px">Leaflegal is a trading name of Vertical Brands Ltd, company number 14254961<br>20-22 Wenlock Road, London N1 7GU</p>
${links || unsub ? `<p style="margin:0">${[links && `<a href="${SITE}" style="${small}">leaflegal.co</a>`, links && `<a href="${SITE}/privacy-policy" style="${small}">Privacy Policy</a>`, links && `<a href="${SITE}/terms-conditions" style="${small}">Terms</a>`, unsub && `<a href="${esc(unsub)}" style="${small}">Unsubscribe</a>`].filter(Boolean).join('&nbsp;&nbsp;&middot;&nbsp;&nbsp;')}</p>` : ''}
</td></tr></table></td></tr>
</table>
<!--[if mso]></td></tr></table><![endif]-->
</td></tr></table></body></html>`;
}

// Internal notification to the team (form submissions). rows: [[label, value]] (values are escaped here).
export function teamNotice({ heading, intro = '', rows = [], note = '', preheader = '' }) {
  const body = `${intro ? para(intro) : ''}${detailsTable(rows.map(([k, v]) => [k, esc(v)]))}${note ? `<p style="${F}margin:0;padding:14px 16px;background:${C.PALE};border-radius:8px;font-size:13px;line-height:1.6;color:${C.TEXT}">${note}</p>` : ''}`;
  return shell({ title: heading, heading, preheader, body, footer: 'Sent to the Leaflegal team from a form on leaflegal.co. Reply to this email to answer the sender.', links: false });
}

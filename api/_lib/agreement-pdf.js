import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { SECTIONS, P } from './terms.js';

// The signed Partner Agreement as an A4 PDF (email attachment, Account and Admin downloads).
// Same wording as the HTML copy in terms.js. Built-in Helvetica, so no font files are needed on the server.
const INK = rgb(0.106, 0.2, 0.161), MUTED = rgb(0.365, 0.478, 0.431), LINE = rgb(0.827, 0.878, 0.855), TINT = rgb(0.965, 0.98, 0.973);
// Helvetica only covers WinAnsi: keep £, curly quotes and dashes; swap anything else for a safe character.
const clean = (s) => String(s ?? '').replace(/[‐‑]/g, '-').replace(/[^\x20-\x7E -ÿ–—‘’“”•…€\n]/g, '?');

export async function signedPdf(a) {
  const doc = await PDFDocument.create();
  doc.setTitle(`Leaflegal Partner Agreement - ${clean(a.company)}`); doc.setAuthor('Vertical Brands Ltd (trading as Leaflegal)');
  const reg = await doc.embedFont(StandardFonts.Helvetica), bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const W = 595.28, H = 841.89, M = 56, width = W - 2 * M, ref = `LL-PA-${String(a.id).padStart(5, '0')}`;
  let page, y;
  const newPage = () => { page = doc.addPage([W, H]); y = H - M; };
  const ensure = (h) => { if (y - h < M + 24) newPage(); };
  const wrap = (text, font, size, w) => {
    const lines = [];
    for (const para of clean(text).split('\n')) {
      let line = '';
      for (const word of para.split(/\s+/).filter(Boolean)) {
        const t = line ? `${line} ${word}` : word;
        if (font.widthOfTextAtSize(t, size) <= w) line = t; else { if (line) lines.push(line); line = word; }
      }
      lines.push(line);
    }
    return lines;
  };
  // A paragraph, optionally with a bold lead-in ("4.2") hanging in the left column.
  const para = (text, { size = 10, font = reg, color = INK, lead = '', gap = 6, indent = 0 } = {}) => {
    const hang = lead ? 30 : 0, lines = wrap(text, font, size, width - hang - indent), lh = size * 1.45;
    lines.forEach((l, i) => {
      ensure(lh);
      if (i === 0 && lead) page.drawText(clean(lead), { x: M + indent, y: y - size, size, font: bold, color });
      page.drawText(l, { x: M + indent + hang, y: y - size, size, font, color });
      y -= lh;
    });
    y -= gap;
  };

  newPage();
  page.drawText('Leaflegal Partner Agreement', { x: M, y: y - 20, size: 20, font: bold, color: INK }); y -= 30;
  para(`Version ${a.version} · Agreement reference ${ref}`, { size: 9.5, color: MUTED, gap: 14 });

  // Parties box
  const partner = `${a.company}${a.company_number ? `, company number ${a.company_number}` : ''}${a.address ? `, of ${a.address}` : ''} (the “Partner”).`;
  const boxLines = [...wrap(`Between ${P}`, reg, 10, width - 24), '', ...wrap(`and ${partner}`, reg, 10, width - 24)];
  const boxH = boxLines.length * 14.5 + 20;
  ensure(boxH);
  page.drawRectangle({ x: M, y: y - boxH, width, height: boxH, color: TINT, borderColor: LINE, borderWidth: 1 });
  let by = y - 10;
  for (const l of boxLines) { by -= 14.5; if (l) page.drawText(l, { x: M + 12, y: by + 3.5, size: 10, font: reg, color: INK }); }
  y -= boxH + 16;

  SECTIONS.forEach(([title, ps], i) => {
    ensure(40);
    para(title, { size: 12, font: bold, gap: 4 });
    ps.forEach((p, j) => para(p, { lead: `${i + 1}.${j + 1}` }));
    y -= 4;
  });

  // Acceptance record
  ensure(190);
  page.drawLine({ start: { x: M, y }, end: { x: W - M, y }, thickness: 1, color: LINE }); y -= 18;
  para('Accepted for and on behalf of the Partner', { size: 12, font: bold, gap: 6 });
  para(`Accepted online by ticking “I am authorised to accept this agreement on behalf of ${a.company}” and “I have read and agree to the Leaflegal Partner Agreement”.`, { gap: 10 });
  const when = new Date(a.created_at).toLocaleString('en-GB', { dateStyle: 'long', timeStyle: 'short', timeZone: 'Europe/London' });
  for (const [k, v] of [['Name', a.signer_name], ['Position', a.signer_title], ['Company', a.company], ['Email', a.signer_email], ['Accepted', `${when} (UK time)`], ['IP address', a.ip || '–'], ['Document hash', a.terms_hash]]) {
    const lines = wrap(v || '–', k === 'Name' ? bold : reg, k === 'Document hash' ? 8 : 10, width - 110);
    lines.forEach((l, n) => {
      ensure(14.5);
      if (!n) page.drawText(k, { x: M, y: y - 10, size: 10, font: reg, color: MUTED });
      page.drawText(l, { x: M + 110, y: y - 10, size: k === 'Document hash' ? 8 : 10, font: k === 'Name' ? bold : reg, color: INK });
      y -= 14.5;
    });
  }
  y -= 8;
  para('The person accepting confirmed they have authority to bind the Partner. Accepted for and on behalf of Vertical Brands Ltd (trading as Leaflegal) on the same date.', { size: 9, color: MUTED });

  const pages = doc.getPages();
  pages.forEach((p, i) => {
    const f = clean(`Leaflegal Partner Agreement · ${ref} · Page ${i + 1} of ${pages.length}`);
    p.drawText(f, { x: M, y: 30, size: 8, font: reg, color: MUTED });
  });
  return doc.save();
}

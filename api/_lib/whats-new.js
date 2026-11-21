// "What's new" announcement (17 Nov 2026), sent once from Admin (action admin-whats-new). Preview: node tools/whats-new-email.mjs
import { PLATFORM_URL } from './platform.js';


const F = 'font-family:Arial,Helvetica,sans-serif;';
const G = '#244237', INK = '#14271f', TEXT = '#2b3f36', LINE = '#dde5e1';
const IMG = 'https://leaflegal.co/assets/email';

const p = (html, extra = '') => `<p style="${F}margin:0 0 16px;font-size:15px;line-height:1.65;color:${TEXT};${extra}">${html}</p>`;
const h = (t) => `<p style="${F}margin:34px 0 8px;font-size:17px;line-height:1.35;font-weight:bold;color:${INK}">${t}</p>`;
// Screenshot on a soft panel. width = display width in px (images are ~2x for sharp screens).
const shot = (file, alt, width) => `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:6px 0 4px"><tr>
  <td align="center" style="background:#eef3f0;border:1px solid ${LINE};padding:22px 16px">
    <img src="${IMG}/${file}" width="${width}" alt="${alt}" style="display:block;width:100%;max-width:${width}px;height:auto;border:0"></td></tr></table>`;
const img = (file, alt, width) => `<img src="${IMG}/${file}" width="${width}" alt="${alt}" style="display:block;width:100%;max-width:${width}px;height:auto;border:0;margin:4px auto 8px">`;
const link = (label, url) => p(`<a href="${url}" style="color:${G};font-weight:bold">${label}</a>`, 'margin:12px 0 0;font-size:14px');

// invite: { token, email } for firms invited but not yet on the platform (adds join link + a clear unsubscribe button).
export const whatsNew = (firstName, invite = null) => {
  const join = invite ? `${PLATFORM_URL}/signup?invite=${encodeURIComponent(invite.token)}` : null;
  const stop = invite ? `${PLATFORM_URL}/api/platform?action=invite-stop&t=${encodeURIComponent(invite.token)}` : null;
  const go = (path) => join || `${PLATFORM_URL}/${path}`;
  return {
    title: 'What’s new on Leaflegal',
    preheader: 'Enquiries up 21% this week, plus homeowner status, WhatsApp and a new My leads.',
    greeting: `Hi ${firstName || 'there'},`,
    html:
      p(invite ? 'A quick update on what’s changed on Leaflegal Platform this week, in case you’re still deciding whether to join.'
        : 'A quick update on a few things we’ve changed this week. Most of them came straight from brokers telling us what would help.') +
      p('Enquiries are up 21% on last week.') +
      img('wn-stats-3.jpg', 'This week: 21% more business enquiries than last week', 520) +

      h('See if they own their home') +
      p('Every opportunity now shows whether the director is a homeowner or a tenant, alongside revenue, time trading and credit. You see it before you buy, and you can set auto-buy to homeowners only.') +
      shot('wn-opportunity.jpg', 'An opportunity showing revenue, trading time, homeowner status and credit', 300) +
      link(invite ? 'Accept your invite' : 'Browse opportunities', go('opportunities')) +

      h('Message them on WhatsApp') +
      p('Each lead you buy now has a WhatsApp button next to Call and Email. It opens with a short first message already filled in, so you can edit it or just hit send.') +
      p('On their side, the business gets a WhatsApp from us as soon as they’re matched with you, with your name and how to reach you, so they’re expecting to hear from you.') +
      shot('wn-lead.jpg', 'A bought lead with Call, WhatsApp and Email buttons and the stage tracker', 300) +

      h('New and improved My leads') +
      p('Search your leads, filter by purpose or revenue, and archive the ones you’re finished with. Export gives you a CSV of whatever you’re looking at, so one stage or one week is easy to pull into your CRM.') +
      shot('wn-myleads.jpg', 'My leads with search, filters, stages and export', 520) +
      (invite ? '' : link('Open My leads', `${PLATFORM_URL}/leads`)) +

      h('Every lead matched on Companies House') +
      p('We only pass on limited companies and LLPs we can find on Companies House. You get the company details with every lead, including when it was set up, its industry and whether its filings are up to date.') +
      shot('wn-companies-house.jpg', 'Companies House details on a lead: company name, number, type, status, incorporation date and industry', 300) + '<div style="height:26px;line-height:26px">&nbsp;</div>',
    cta: invite ? { label: 'Accept your invite', url: join } : { label: 'See what’s live now', url: `${PLATFORM_URL}/opportunities` },
    after: p('If anything on the platform could work better for you, just reply and let us know.', 'margin:26px 0 22px') +
      p(`Thanks,<br><b style="color:${INK}">Team Leaflegal</b>`, 'margin:0') +
      (invite ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:30px 0 0"><tr><td align="center" style="${F}border-top:1px solid ${LINE};padding:22px 0 0;font-size:13px;line-height:1.6;color:#4f645b">
        Not for you? You can stop these emails in one click.<br>
        <a href="${stop}" style="display:inline-block;margin-top:12px;padding:10px 22px;border:1px solid #9fb2a9;color:${INK};font-weight:bold;text-decoration:none">Unsubscribe</a></td></tr></table>` : ''),
    signoff: false,
    ...(invite ? { nav: false, replyTo: 'hello@leaflegal.co', unsub: stop,
      footer: `You're receiving this because the Leaflegal team invited ${invite.email} to join Leaflegal Platform. <a href="${stop}" style="color:#86998f">Unsubscribe</a>.` } : {}),
  };
};


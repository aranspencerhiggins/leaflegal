// "What's new" announcement for the move to legal enquiries, sent once from Admin (action admin-whats-new).
// Preview: node tools/whats-new-email.mjs. No screenshots yet: add legal ones under /assets/email when they exist.
import { PLATFORM_URL, API_URL } from './platform.js';

const F = 'font-family:Arial,Helvetica,sans-serif;';
const G = '#244237', INK = '#14271f', TEXT = '#2b3f36', LINE = '#dde5e1';

const p = (html, extra = '') => `<p style="${F}margin:0 0 16px;font-size:15px;line-height:1.65;color:${TEXT};${extra}">${html}</p>`;
const h = (t) => `<p style="${F}margin:34px 0 8px;font-size:17px;line-height:1.35;font-weight:bold;color:${INK}">${t}</p>`;
// Screenshot on a soft panel. width = display width in px (images are ~2x for sharp screens).
const link = (label, url) => p(`<a href="${url}" style="color:${G};font-weight:bold">${label}</a>`, 'margin:12px 0 0;font-size:14px');

// invite: { token, email } for firms invited but not yet on the platform (adds join link + a clear unsubscribe button).
export const whatsNew = (firstName, invite = null) => {
  const join = invite ? `${PLATFORM_URL}/register?invite=${encodeURIComponent(invite.token)}` : null;
  const stop = invite ? `${API_URL}?action=invite-stop&t=${encodeURIComponent(invite.token)}` : null;
  const go = (path) => join || `${PLATFORM_URL}/${path}`;
  return {
    title: 'What’s new on Leaflegal',
    preheader: 'Legal enquiries by practice area, regulator checks and a fairer way to price leads.',
    greeting: `Hi ${firstName || 'there'},`,
    html:
      p(invite ? 'A quick update on what’s changed on Leaflegal Platform, in case you’re still deciding whether to join.'
        : 'A quick update on what’s changed on Leaflegal Platform. Most of it came from firms telling us what would help.') +

      h('Enquiries by practice area and matter') +
      p('Every opportunity now shows the practice area, the matter, roughly where the client is, how soon they need help and what they told us. You see all of it before you buy, and you can set auto-buy to the areas, matters and regions you want.') +
      link(invite ? 'Accept your invite' : 'Browse opportunities', go('opportunities')) +

      h('Only the work your regulator allows') +
      p('Add your regulator and your number with them, and we only show you enquiries in the practice areas it covers. Immigration enquiries go only to firms regulated by the SRA, CILEx Regulation or the IAA.') +

      h('Prices that follow the work') +
      p('Each lead is priced by practice area and matter, then adjusted for quality, urgency and the value involved. Leads not bought within 72 hours drop in price, and you can set a maximum price for auto-buy.') +

      h('Clients know you’re calling') +
      p('As soon as a client is matched with you, we email them your name and how to reach you, and tell them you’ll explain your fees before they agree to anything. They’re expecting to hear from you.') +
      p('Each lead you buy has Call, WhatsApp and Email buttons, a stage tracker from contacted to instructed, and a reminder to send your referral fee disclosure in writing.') +
      (invite ? '' : link('Open My leads', `${PLATFORM_URL}/leads`)) + '<div style="height:26px;line-height:26px">&nbsp;</div>',
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


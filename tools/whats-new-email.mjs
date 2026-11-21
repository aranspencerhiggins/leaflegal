// "What's new on Leaflegal" note (17 Nov 2026). Preview only:
//   node tools/whats-new-email.mjs            > tools/whats-new-email-preview.html          (platform accounts)
//   node tools/whats-new-email.mjs --invited  > tools/whats-new-email-preview-invited.html  (invited firms)
// Images live at leaflegal.co/assets/email/wn-*.jpg (sample data, no real leads; stats graphic from tools/email-graphics/stats.html).
// Sending is a separate, approved step (whatsNew is exported for that).
import { emailHtml } from '../api/_lib/platform.js';
import { whatsNew } from '../api/_lib/whats-new.js';

if (import.meta.url === `file://${process.argv[1]}`) {
  const invited = process.argv.includes('--invited');
  process.stdout.write(emailHtml(whatsNew('Jo', invited ? { token: 'preview-token', email: 'jo@acmefinance.co.uk' } : null)));
}

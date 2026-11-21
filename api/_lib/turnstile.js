// Cloudflare Turnstile bot check for the enquiry form and broker signup.
// Env TURNSTILE_SITE_KEY (public) + TURNSTILE_SECRET_KEY. Off until both are set, so the page and the server can't disagree.
export const turnstileSiteKey = () => (process.env.TURNSTILE_SITE_KEY && process.env.TURNSTILE_SECRET_KEY ? process.env.TURNSTILE_SITE_KEY.trim() : null);

// true = let it through. Missing or rejected token = false. Cloudflare unreachable = true (never lose a real lead to an outage).
export async function human(token, ip) {
  if (!turnstileSiteKey()) return true;
  if (!token || String(token).length > 2048) return false;
  try {
    const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST', body: new URLSearchParams({ secret: process.env.TURNSTILE_SECRET_KEY.trim(), response: String(token), ...(ip ? { remoteip: ip } : {}) }),
      signal: AbortSignal.timeout(5000),
    });
    const d = await r.json();
    if (!d.success) console.error('turnstile', JSON.stringify(d['error-codes'] || []));
    return !!d.success;
  } catch (e) { console.error('turnstile unreachable', e.message); return true; }
}

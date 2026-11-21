import { createHash } from 'node:crypto';

// Bird Lookup: is the mobile live on a network, does the mailbox exist.
// Env BIRD_API_KEY = a Bird workspace key with the `lookup` scope (bk_<region>_…; the prefix picks the API host).
// Cost (Nov 2026): phone base $0.005 + presence $0.007 when answered; email $0.0005.
// Fail open: no key, an error, a timeout or a rate limit returns null, so our side never blocks a real lead.
const host = (k) => `https://${(k.match(/^b[km]_([a-z0-9]+)_/) || [])[1] || 'us1'}.platform.bird.com`;
const idem = (kind, v) => `${kind}/${createHash('sha256').update(v).digest('hex').slice(0, 32)}`; // repeat submits replay the stored answer (no second charge); no personal data in headers

async function bird(path, body, key, retry = true) {
  const k = process.env.BIRD_API_KEY;
  if (!k) return null;
  try {
    const r = await fetch(host(k) + path, {
      method: 'POST',
      headers: { Authorization: `Bearer ${k}`, 'Content-Type': 'application/json', 'Idempotency-Key': key },
      body: JSON.stringify(body), signal: AbortSignal.timeout(4000),
    });
    if (!r.ok) {
      console.error('bird', path, r.status, (await r.text()).slice(0, 200));
      // Brief outage (5xx) or rate limit: one more try after a short pause. Timeouts aren't retried, so the form never waits much longer.
      if (retry && (r.status >= 500 || r.status === 429)) { await new Promise((ok) => setTimeout(ok, 400)); return bird(path, body, key, false); }
      return null;
    }
    return await r.json();
  } catch (e) { console.error('bird', path, e.message); return null; }
}

// reachable: true / false (network says not currently reachable: dead number OR phone switched off) / null (no answer).
// allocated: false when no network serves the number at all (e.g. 07123 456789): a number that doesn't exist.
export async function checkPhone(phone) {
  const d = await bird('/v1/lookup/phone-number', { phone_number: phone, type: ['presence'] }, idem('phone', phone));
  if (!d) return null;
  return { line_type: d.line_type || null, carrier: d.network_info?.carrier_name || null, reachable: d.presence?.status === 'ok' ? d.presence.reachable : null,
    allocated: !!d.network_info || d.line_type === 'mobile' };
}

// result: valid | neutral | risky | undeliverable | typo (open list). reason for undeliverable: invalid_syntax | invalid_domain | invalid_recipient.
export async function checkEmail(email) {
  const d = await bird('/v1/lookup/email', { email }, idem('email', email));
  if (!d) return null;
  return { result: d.result || null, reason: d.reason || null, confidence: d.delivery_confidence ?? null, did_you_mean: d.did_you_mean || null, flags: d.flags || [] };
}

// What to ask the person filling in the form, or null to let it through.
// hard = can't be overridden; otherwise they can confirm the value is right and carry on.
export function problem(pc, ec, b) {
  if (ec?.result === 'undeliverable' && ['invalid_syntax', 'invalid_domain'].includes(ec.reason))
    return { field: 'email', error: "That email address can't receive email. Please check it." };
  if (ec?.result === 'typo' && ec.did_you_mean && !b.emailConfirmed)
    return { field: 'email', error: 'Please check your email address.', suggest: ec.did_you_mean, confirm: true };
  // A mailbox that doesn't exist or a number no network serves can't be confirmed past: the enquiry stops until it's fixed.
  if (ec?.result === 'undeliverable')
    return { field: 'email', error: "We couldn't find a mailbox at that address. Please check it and try again." };
  if (pc?.allocated === false)
    return { field: 'phone', error: "That number doesn't exist. Please check your mobile number and try again." };
  if (pc?.reachable === false && !b.phoneConfirmed)
    return { field: 'phone', error: "We couldn't reach that number just now. Please check it's right.", confirm: true };
  return null;
}

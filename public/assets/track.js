// Meta + LinkedIn tracking for Loanleaf (both only with marketing-cookie consent).
// Pixel + Conversions API events share an event_id so Meta de-duplicates them.
// Usage: llTrack('FormStep', { form: 'business', step: 3, step_name: 'timeline' })
(() => {
  const PIXEL_ID = '658905286613269';
  // LinkedIn Insight Tag (Campaign Manager account 560716965). Site events → LinkedIn conversion IDs (Measure → Conversion tracking).
  const LI_PARTNER = '10412564';
  // Conversions go to LinkedIn from the server (api/_lib/platform.js LI_SERVER) for everyone, so the tag sends none itself (no double count).
  const STANDARD = new Set(['PageView', 'ViewContent', 'Lead', 'SubmitApplication', 'Contact', 'CompleteRegistration']);
  const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now() + '-' + Math.random().toString(36).slice(2));

  // Facebook/Instagram ad click ID (?fbclid=) kept for this visit for attribution.
  try {
    const fbclid = new URLSearchParams(location.search).get('fbclid');
    if (fbclid) sessionStorage.setItem('ll-fbc', `fb.1.${Date.now()}.${fbclid}`);
  } catch {}
  const fbc = () => { try { return sessionStorage.getItem('ll-fbc') || ''; } catch { return ''; } };
  const fbp = () => (document.cookie.match(/(?:^|; )_fbp=([^;]+)/) || [])[1] || '';

  function loadPixel() {
    if (window.fbq) return;
    /* eslint-disable */
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;
    s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
    /* eslint-enable */
    fbq('init', PIXEL_ID);
    fbq('track', 'PageView');
    // Events fired on this page before the pixel loaded (e.g. ViewContent on page load, before the cookie choice): send them now,
    // same eventID as their server copy so Meta counts each once and the pixel adds the browser ID.
    early.splice(0).forEach(([e, d, id]) => fbq(STANDARD.has(e) ? 'track' : 'trackCustom', e, d, { eventID: id }));
  }

  function loadLinkedIn() {
    if (window.lintrk) return;
    window._linkedin_data_partner_ids = [LI_PARTNER];
    window.lintrk = function (a, b) { window.lintrk.q.push([a, b]); }; window.lintrk.q = [];
    const t = document.createElement('script'); t.async = true; t.src = 'https://snap.licdn.com/li.lms-analytics/insight.min.js';
    document.head.appendChild(t);
  }

  const early = []; // [event, data, eventId] fired before the pixel loaded on this page
  const consented = () => !!window.loanleafCookies?.get()?.marketing;
  const send = (event, data, eventId) => {
    const body = JSON.stringify({ event, data, eventId, page: location.href, fbc: fbc(), fbp: fbp() });
    try { navigator.sendBeacon ? navigator.sendBeacon('/api/track', new Blob([body], { type: 'application/json' })) : fetch('/api/track', { method: 'POST', body, keepalive: true, headers: { 'Content-Type': 'application/json' } }); } catch {}
  };
  // Fire an event. opts.server=false skips the /api/track copy.
  window.llTrack = (event, data = {}, opts = {}) => {
    const eventId = opts.eventId || uid();
    if (window.fbq) fbq(STANDARD.has(event) ? 'track' : 'trackCustom', event, data, { eventID: eventId });
    else early.push([event, data, eventId]);
    if (opts.server !== false) {
      // Cookies already accepted but the pixel hasn't set its browser ID (_fbp) yet: wait up to 1.5s so the server copy carries it.
      if (consented() && !fbp()) { let n = 0; const t = setInterval(() => { if (fbp() || ++n >= 15) { clearInterval(t); send(event, data, eventId); } }, 100); }
      else send(event, data, eventId);
    }
    return eventId;
  };
  window.llTrackIds = { fbc, fbp, uid };
  (window.__llq || []).splice(0).forEach((x) => window.llTrack(...x));

  const start = () => window.loanleafCookies ? window.loanleafCookies.on('marketing', () => { loadPixel(); loadLinkedIn(); }) : null;
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', start) : start();
})();

// Vercel Routing Middleware: the broker platform lives at the root of platform.loanleaf.co
// (platform.loanleaf.co/dashboard, /register, …) and is served from public/platform/index.html.
// Old /platform/... addresses, on either host, redirect to the clean address so emailed links keep working.
const APP = 'platform.loanleaf.co';

export const config = { matcher: ['/((?!api/|assets/).*)'] };

export default function middleware(req) {
  const url = new URL(req.url), host = (req.headers.get('host') || '').toLowerCase();
  const old = url.pathname === '/platform' || url.pathname.startsWith('/platform/');
  if (host === APP || host === 'loanleaf.co' || host === 'www.loanleaf.co') {
    if (old) return Response.redirect(`https://${APP}${url.pathname.slice('/platform'.length) || '/'}${url.search}`, 308);
    if (host === APP && !/\.[a-z0-9]+$/i.test(url.pathname)) return new Response(null, { headers: { 'x-middleware-rewrite': new URL('/platform', url).toString() } });
  }
  return undefined; // everything else carries on as normal
}

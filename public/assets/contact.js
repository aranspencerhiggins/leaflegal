// /contact form -> /api/contact
(() => {
  const f = document.getElementById('ll-contact');
  if (!f) return;
  const out = f.querySelector('.ll-cf-msg'), btn = f.querySelector('button[type=submit]');
  f.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!f.reportValidity()) return;
    const data = Object.fromEntries(new FormData(f)); data.page = location.href;
    btn.disabled = true; btn.textContent = 'Sending…'; out.className = 'll-cf-msg';
    try {
      const r = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      if (!r.ok) throw new Error(r.status);
      f.innerHTML = '<div class="ll-cf-done" role="status"><h2>Thanks, message sent.</h2><p>We reply to every message within one working day.</p></div>';
    } catch {
      btn.disabled = false; btn.textContent = 'Send message';
      out.className = 'll-cf-msg on'; out.innerHTML = 'Sorry, that didn’t send. Please try again or email <a href="mailto:hello@loanleaf.co">hello@loanleaf.co</a>.';
    }
  });
})();

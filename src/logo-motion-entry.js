(() => {
  const nav = document.querySelector('.nav nav');
  if (nav && !nav.querySelector('a[href="/logo-motion"]')) {
    const link = document.createElement('a');
    link.href = '/logo-motion';
    link.textContent = 'Logo Motion';
    nav.insertBefore(link, nav.firstChild);
  }

  const hero = document.querySelector('.hero .lead');
  if (hero && !document.querySelector('.gw-logo-motion-link')) {
    const row = document.createElement('div');
    row.className = 'gw-logo-motion-link';
    row.innerHTML = '<a href="/logo-motion">✦ NEW: Animate your logo →</a>';
    hero.insertAdjacentElement('afterend', row);
    const style = document.createElement('style');
    style.textContent = '.gw-logo-motion-link{margin:20px auto -22px;text-align:center}.gw-logo-motion-link a{display:inline-flex;align-items:center;padding:9px 13px;border:1px solid #dedfd9;border-radius:999px;background:#fff;color:#111318;text-decoration:none;font-size:10px;font-weight:700;box-shadow:0 8px 26px rgba(17,19,24,.04)}.gw-logo-motion-link a:hover{transform:translateY(-1px)}';
    document.head.appendChild(style);
  }
})();
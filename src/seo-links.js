(() => {
  const links = [
    ['/remove-gemini-watermark', 'Remove Gemini watermark'],
    ['/gemini-video-watermark-remover', 'Gemini video remover'],
    ['/veo-watermark-remover', 'Veo watermark remover'],
    ['/blog/how-to-turn-off-gemini-visible-watermark', 'Gemini Media watermark 2026'],
    ['/blog', 'Creator guides'],
    ['/blog/clean-ai-video-without-cropping', '1080×1920 video guide'],
  ];

  function install() {
    const footerWrap = document.querySelector('footer .wrap');
    if (!footerWrap || footerWrap.querySelector('[data-seo-guides]')) return false;

    const nav = document.createElement('nav');
    nav.setAttribute('data-seo-guides', '1');
    nav.setAttribute('aria-label', 'Watermark removal guides');
    nav.className = 'footerLinks seoGuideLinks';
    for (const [href, label] of links) {
      const a = document.createElement('a');
      a.href = href;
      a.textContent = label;
      nav.appendChild(a);
    }
    footerWrap.appendChild(nav);
    return true;
  }

  if (install()) return;
  const observer = new MutationObserver(() => {
    if (install()) observer.disconnect();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
  setTimeout(() => observer.disconnect(), 15000);
})();

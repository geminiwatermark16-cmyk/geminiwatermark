(() => {
  const links = [
    ['/remove-gemini-watermark', 'Remove Gemini watermark'],
    ['/gemini-image-watermark-remover', 'Gemini image remover'],
    ['/gemini-video-watermark-remover', 'Gemini video remover'],
    ['/google-flow-watermark-remover', 'Google Flow remover'],
    ['/veo-watermark-remover', 'Veo watermark remover'],
    ['/media-converter.html', 'Video to MP3 / MP4 converter'],
    ['/blog/how-to-turn-off-gemini-visible-watermark', 'Gemini Media watermark 2026'],
    ['/blog', 'Creator guides'],
    ['/blog/clean-ai-video-without-cropping', '1080×1920 video guide'],
  ];

  function installHeaderLink() {
    const headerNav = document.querySelector('header.nav nav');
    if (!headerNav || headerNav.querySelector('[data-media-converter-link]')) return false;
    const a = document.createElement('a');
    a.href = '/media-converter.html';
    a.textContent = 'MP3 / MP4';
    a.setAttribute('data-media-converter-link', '1');
    headerNav.appendChild(a);
    return true;
  }

  function installFooterLinks() {
    const footerWrap = document.querySelector('footer .wrap');
    if (!footerWrap || footerWrap.querySelector('[data-seo-guides]')) return false;

    const nav = document.createElement('nav');
    nav.setAttribute('data-seo-guides', '1');
    nav.setAttribute('aria-label', 'Watermark removal and media tools');
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

  function install() {
    const headerDone = installHeaderLink();
    const footerDone = installFooterLinks();
    return headerDone && footerDone;
  }

  if (install()) return;
  const observer = new MutationObserver(() => {
    if (install()) observer.disconnect();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
  setTimeout(() => observer.disconnect(), 15000);
})();

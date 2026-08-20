(() => {
  const links = [
    ['/remove-gemini-watermark', 'Remove Gemini watermark'],
    ['/gemini-watermark-still-showing', 'Gemini watermark still showing?'],
    ['/gemini-image-watermark-remover', 'Gemini image remover'],
    ['/gemini-video-watermark-remover', 'Gemini video remover'],
    ['/google-flow-watermark-remover', 'Google Flow remover'],
    ['/veo-watermark-remover', 'Veo watermark remover'],
    ['/blog/how-to-turn-off-gemini-visible-watermark', 'Gemini / Flow watermark policy 2026'],
    ['/blog/visible-watermark-vs-synthid', 'Visible watermark vs SynthID'],
    ['/blog/why-watermark-remains-after-export', 'Watermark export troubleshooting'],
    ['/blog/clean-ai-video-without-cropping', '1080×1920 video guide'],
    ['/blog', 'Creator guides'],
  ];

  function cleanupLegacySocialPromos() {
    document.querySelector('[data-media-converter-link]')?.remove();
    document.querySelector('[data-social-downloader-home]')?.remove();
    document.querySelector('[data-social-downloader-styles]')?.remove();
  }

  function installStyles() {
    if (document.querySelector('[data-gemini-seo-styles]')) return true;
    const style = document.createElement('style');
    style.setAttribute('data-gemini-seo-styles', '1');
    style.textContent = `
      .gwSeoIntent{padding:64px 0;background:#f5f5f2;color:#111}
      .gwSeoIntentGrid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:24px}
      .gwSeoIntent a{display:block;border:1px solid rgba(17,17,17,.12);border-radius:20px;padding:22px;color:#111;text-decoration:none;background:#fff}
      .gwSeoIntent h3{margin:0 0 8px;font-size:22px}.gwSeoIntent p{margin:0;line-height:1.55;color:#555}
      @media(max-width:760px){.gwSeoIntentGrid{grid-template-columns:1fr}}
    `;
    document.head.appendChild(style);
    return true;
  }

  function installHeaderGuideLink() {
    const headerNav = document.querySelector('header.nav nav');
    if (!headerNav) return false;
    let a = headerNav.querySelector('[data-gemini-guide-link]');
    if (!a) {
      a = document.createElement('a');
      a.setAttribute('data-gemini-guide-link', '1');
      headerNav.appendChild(a);
    }
    a.href = '/blog';
    a.textContent = 'Guides';
    a.setAttribute('aria-label', 'Gemini watermark guides');
    return true;
  }

  function installSeoIntentLinks() {
    if (document.querySelector('[data-seo-intent-home]')) return true;
    const pricing = document.querySelector('#pricing');
    if (!pricing) return false;
    const section = document.createElement('section');
    section.className = 'gwSeoIntent';
    section.setAttribute('data-seo-intent-home', '1');
    section.innerHTML = `
      <div class="wrap">
        <small>GEMINI & FLOW HELP</small>
        <h2>Watermark still showing?</h2>
        <p class="sectionLead">Check Gemini and Google Flow watermark behavior before editing an export. Visible watermark behavior can depend on tier, region and whether the file was already exported.</p>
        <div class="gwSeoIntentGrid">
          <a href="/gemini-watermark-still-showing"><h3>Gemini / Flow watermark still showing</h3><p>Troubleshoot plan tier, region, account entitlement, older exports and SynthID.</p></a>
          <a href="/blog/how-to-turn-off-gemini-visible-watermark"><h3>Gemini & Flow watermark policy 2026</h3><p>Understand visible-watermark behavior for new and already-exported media.</p></a>
        </div>
      </div>`;
    pricing.insertAdjacentElement('afterend', section);
    return true;
  }

  function installFooterLinks() {
    const footerWrap = document.querySelector('footer .wrap');
    if (!footerWrap) return false;
    let nav = footerWrap.querySelector('[data-seo-guides]');
    if (nav) nav.remove();
    nav = document.createElement('nav');
    nav.setAttribute('data-seo-guides', '1');
    nav.setAttribute('aria-label', 'Gemini and Veo watermark guides');
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
    cleanupLegacySocialPromos();
    installStyles();
    const headerDone = installHeaderGuideLink();
    const intentDone = installSeoIntentLinks();
    const footerDone = installFooterLinks();
    return headerDone && intentDone && footerDone;
  }

  if (install()) return;
  const observer = new MutationObserver(() => {
    if (install()) observer.disconnect();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
  setTimeout(() => observer.disconnect(), 15000);
})();

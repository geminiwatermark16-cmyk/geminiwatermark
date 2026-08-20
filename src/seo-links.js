(() => {
  const downloaderPath = '/media-converter';
  const links = [
    ['/remove-gemini-watermark', 'Remove Gemini watermark'],
    ['/gemini-watermark-still-showing', 'Gemini watermark still showing?'],
    ['/gemini-image-watermark-remover', 'Gemini image remover'],
    ['/gemini-video-watermark-remover', 'Gemini video remover'],
    ['/google-flow-watermark-remover', 'Google Flow remover'],
    ['/veo-watermark-remover', 'Veo watermark remover'],
    ['/blog/how-to-turn-off-gemini-visible-watermark', 'Gemini / Flow watermark policy 2026'],
    [downloaderPath + '?platform=instagram', 'Instagram Reel Downloader'],
    [downloaderPath + '?platform=pinterest', 'Pinterest Video Downloader'],
    ['/blog', 'Creator guides'],
    ['/blog/clean-ai-video-without-cropping', '1080×1920 video guide'],
  ];

  function installStyles() {
    if (document.querySelector('[data-social-downloader-styles]')) return true;
    const style = document.createElement('style');
    style.setAttribute('data-social-downloader-styles', '1');
    style.textContent = `
      .gwSocialTools{padding:72px 0;background:#0d0d0f;color:#fff}
      .gwSocialToolsHead{max-width:760px;margin-bottom:28px}
      .gwSocialTools small{display:block;color:#a1a1aa;letter-spacing:.12em;font-size:12px;font-weight:800;margin-bottom:10px}
      .gwSocialTools h2{font-size:clamp(34px,5vw,58px);line-height:1.02;letter-spacing:-.045em;margin:0 0 14px;color:#fff}
      .gwSocialTools .gwSocialLead{color:#b5b5bd;max-width:720px;font-size:17px;line-height:1.65;margin:0}
      .gwSocialCards{display:grid;grid-template-columns:1fr 1fr;gap:16px}
      .gwSocialCard{display:block;border:1px solid #2f2f35;background:#151518;border-radius:22px;padding:24px;color:#fff!important;text-decoration:none!important;transition:transform .18s ease,border-color .18s ease,background .18s ease}
      .gwSocialCard:hover{transform:translateY(-2px);border-color:#55555e;background:#19191d}
      .gwSocialIcon{width:48px;height:48px;border-radius:14px;display:grid;place-items:center;background:#fff;color:#111;font-size:19px;font-weight:900;margin-bottom:22px}
      .gwSocialCard h3{font-size:24px;margin:0 0 8px;color:#fff}
      .gwSocialCard p{font-size:14px;line-height:1.55;margin:0 0 20px;color:#9f9fa8}
      .gwSocialCta{display:inline-flex;align-items:center;gap:7px;font-weight:850;color:#fff}
      .gwSeoIntent{padding:64px 0;background:#f5f5f2;color:#111}
      .gwSeoIntentGrid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:24px}
      .gwSeoIntent a{display:block;border:1px solid rgba(17,17,17,.12);border-radius:20px;padding:22px;color:#111;text-decoration:none;background:#fff}
      .gwSeoIntent h3{margin:0 0 8px;font-size:22px}.gwSeoIntent p{margin:0;line-height:1.55;color:#555}
      @media(max-width:760px){.gwSocialTools{padding:52px 0}.gwSocialCards,.gwSeoIntentGrid{grid-template-columns:1fr}}
    `;
    document.head.appendChild(style);
    return true;
  }

  function installHeaderLink() {
    const headerNav = document.querySelector('header.nav nav');
    if (!headerNav) return false;
    let a = headerNav.querySelector('[data-media-converter-link]');
    if (!a) {
      a = document.createElement('a');
      a.setAttribute('data-media-converter-link', '1');
      headerNav.appendChild(a);
    }
    a.href = downloaderPath;
    a.textContent = 'Instagram / Pinterest';
    a.setAttribute('aria-label', 'Instagram Reel and Pinterest Video Downloader');
    return true;
  }

  function installSeoIntentLinks() {
    if (document.querySelector('[data-seo-intent-home]')) return true;
    const pricing = document.querySelector('#pricing');
    const main = document.querySelector('main');
    if (!pricing || !main) return false;
    const section = document.createElement('section');
    section.className = 'gwSeoIntent';
    section.setAttribute('data-seo-intent-home', '1');
    section.innerHTML = `
      <div class="wrap">
        <small>GEMINI & FLOW HELP</small>
        <h2>Watermark still showing?</h2>
        <p class="sectionLead">Check current Gemini and Google Flow watermark rules before editing an export. Visible watermark behavior can depend on tier, region and whether the file was already exported.</p>
        <div class="gwSeoIntentGrid">
          <a href="/gemini-watermark-still-showing"><h3>Gemini / Flow watermark still showing</h3><p>Troubleshoot plan tier, region, account entitlement, old exports and SynthID.</p></a>
          <a href="/blog/how-to-turn-off-gemini-visible-watermark"><h3>Gemini & Flow watermark policy 2026</h3><p>Understand when a visible watermark may appear and what changes for new vs already-exported media.</p></a>
        </div>
      </div>`;
    pricing.insertAdjacentElement('afterend', section);
    return true;
  }

  function installSocialTools() {
    if (document.querySelector('[data-social-downloader-home]')) return true;
    const how = document.querySelector('#how');
    const main = document.querySelector('main');
    if (!how || !main) return false;

    const section = document.createElement('section');
    section.className = 'gwSocialTools';
    section.setAttribute('data-social-downloader-home', '1');
    section.innerHTML = `
      <div class="wrap">
        <div class="gwSocialToolsHead">
          <small>FREE SOCIAL VIDEO TOOLS</small>
          <h2>Instagram Reel & Pinterest Video Downloader</h2>
          <p class="gwSocialLead">Paste a supported public Instagram Reel/Post or Pinterest Pin link, preview the video, and download it in a few clicks.</p>
        </div>
        <div class="gwSocialCards">
          <a class="gwSocialCard" href="${downloaderPath}?platform=instagram" aria-label="Open Instagram Reel Downloader">
            <div class="gwSocialIcon">◎</div>
            <h3>Instagram Reel Downloader</h3>
            <p>Download videos from supported public Instagram Reels and video posts.</p>
            <span class="gwSocialCta">Download Instagram Reel →</span>
          </a>
          <a class="gwSocialCard" href="${downloaderPath}?platform=pinterest" aria-label="Open Pinterest Video Downloader">
            <div class="gwSocialIcon">P</div>
            <h3>Pinterest Video Downloader</h3>
            <p>Download videos from supported public Pinterest Pins and shared links.</p>
            <span class="gwSocialCta">Download Pinterest Video →</span>
          </a>
        </div>
      </div>`;
    main.insertBefore(section, how);
    return true;
  }

  function installFooterLinks() {
    const footerWrap = document.querySelector('footer .wrap');
    if (!footerWrap) return false;
    let nav = footerWrap.querySelector('[data-seo-guides]');
    if (nav) nav.remove();

    nav = document.createElement('nav');
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
    installStyles();
    const headerDone = installHeaderLink();
    const intentDone = installSeoIntentLinks();
    const socialDone = installSocialTools();
    const footerDone = installFooterLinks();
    return headerDone && intentDone && socialDone && footerDone;
  }

  if (install()) return;
  const observer = new MutationObserver(() => {
    if (install()) observer.disconnect();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
  setTimeout(() => observer.disconnect(), 15000);
})();

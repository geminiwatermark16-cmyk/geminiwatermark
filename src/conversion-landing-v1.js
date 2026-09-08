(() => {
  const STYLE_ID = 'gw-conversion-landing-v2-style';
  const ROOT_ID = 'gwConversionPanel';
  let paywallWasOpen = false;

  const currentPrice = () => 'Free';

  const track = (name, extra = {}) => {
    try {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ event: name, ...extra });
      if (typeof window.gtag === 'function') {
        window.gtag('event', name, {
          page_path: `${location.pathname}${location.search}`,
          ...extra,
        });
      }
    } catch {}
  };

  const trackOnce = (key, name, extra = {}) => {
    try {
      const storageKey = `gw_conversion_${key}`;
      if (sessionStorage.getItem(storageKey) === '1') return;
      sessionStorage.setItem(storageKey, '1');
    } catch {}
    track(name, extra);
  };

  const ensureStyle = () => {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .gwConversionPanel{max-width:920px;margin:24px auto 0;padding:20px;background:linear-gradient(135deg,#111318 0%,#1b1e25 100%);border:1px solid rgba(255,255,255,.08);border-radius:24px;color:#fff;text-align:left;box-shadow:0 24px 70px rgba(17,19,24,.14)}
      .gwConversionTop{display:grid;grid-template-columns:1fr auto;gap:24px;align-items:center}
      .gwConversionKicker{display:inline-flex;align-items:center;gap:7px;font-size:10px;letter-spacing:.14em;font-weight:800;color:#bfcaff;margin-bottom:10px}.gwConversionKicker::before{content:'';width:7px;height:7px;border-radius:50%;background:#62d48f;box-shadow:0 0 0 4px rgba(98,212,143,.12)}
      .gwConversionPanel h2{font:600 clamp(25px,3.4vw,39px)/1.05 'Manrope',sans-serif;letter-spacing:-.04em;margin:0 0 10px;color:#fff;max-width:650px}.gwConversionPanel h2 span{color:#aebcff}
      .gwConversionPanel p{margin:0;color:#aeb2bb;font-size:13px;line-height:1.65;max-width:680px}.gwConversionPanel p strong{color:#fff}
      .gwConversionActions{display:flex;flex-direction:column;gap:9px;min-width:220px}.gwConversionPrimary,.gwConversionSecondary{border-radius:999px;padding:13px 18px;text-decoration:none;text-align:center;font-size:12px;font-weight:800;cursor:pointer;transition:transform .16s ease,background .16s ease}.gwConversionPrimary{background:#fff;color:#111318;border:1px solid #fff}.gwConversionSecondary{background:transparent;color:#fff;border:1px solid rgba(255,255,255,.2)}
      .gwConversionPrimary:hover,.gwConversionSecondary:hover{transform:translateY(-1px)}
      .gwConversionTrust{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:16px;padding-top:16px;border-top:1px solid rgba(255,255,255,.1)}.gwConversionTrust span{display:flex;align-items:center;gap:7px;font-size:11px;color:#d7dae0}.gwConversionTrust span::before{content:'✓';display:grid;place-items:center;width:19px;height:19px;border-radius:50%;background:rgba(98,212,143,.12);color:#7fe3a6;font-size:11px;font-weight:900;flex:none}
      .gwUploadSteps{max-width:920px;margin:12px auto 0;display:grid;grid-template-columns:repeat(3,1fr);gap:8px;text-align:left}.gwUploadSteps>div{background:#fff;border:1px solid #dedfd9;border-radius:15px;padding:12px 14px;display:flex;align-items:center;gap:10px}.gwUploadSteps b{width:25px;height:25px;border-radius:8px;display:grid;place-items:center;background:#111318;color:#fff;font-size:10px;flex:none}.gwUploadSteps span{font-size:11px;color:#61656c;line-height:1.35}.gwUploadSteps strong{color:#111318;font-weight:800}
      .gwSelectedProof{max-width:920px;margin:10px auto 0;padding:12px 14px;border:1px solid #b9dec8;background:#f3fbf6;border-radius:14px;display:none;align-items:flex-start;gap:10px;text-align:left}.gwSelectedProof.show{display:flex}.gwSelectedProof .gwProofIcon{width:26px;height:26px;display:grid;place-items:center;border-radius:50%;background:#dff4e7;color:#207443;font-weight:900;flex:none}.gwSelectedProof strong{display:block;font-size:12px;color:#153c26;margin-bottom:2px}.gwSelectedProof span{display:block;font-size:10px;line-height:1.45;color:#4d6b59}
      .gwPricingAssurance{margin-top:16px;display:flex;gap:8px;flex-wrap:wrap}.gwPricingAssurance span{padding:8px 10px;border-radius:999px;background:#f6f6f3;border:1px solid #e1e2dd;font-size:10px;font-weight:700;color:#5d6168}.featured .gwPricingAssurance span{background:#1c1f25;border-color:#31343b;color:#d8dbe2}
      .gwUploadFirstLink{display:block;margin:0 0 10px;border:1px solid rgba(255,255,255,.22);border-radius:999px;padding:13px 18px;text-align:center;color:#fff!important;text-decoration:none;font-size:11px;font-weight:800}.gwUploadFirstLink:hover{background:rgba(255,255,255,.06)}
      .gwCheckoutTrust{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin:13px 0 4px}.gwCheckoutTrust span{padding:9px 10px;border:1px solid #e5e5e0;border-radius:11px;background:#fafaf8;font-size:10px;color:#62666d;line-height:1.3}.gwCheckoutTrust span::before{content:'✓ ';color:#2f9b5f;font-weight:900}.gwCheckoutPolicies{display:flex;justify-content:center;gap:12px;flex-wrap:wrap;margin-top:10px}.gwCheckoutPolicies a{font-size:9px;color:#73777d;text-decoration:underline;text-underline-offset:2px}
      .gwMobileCta{display:none}
      @media(max-width:760px){
        .gwConversionPanel{margin-top:20px;padding:17px;border-radius:20px}.gwConversionTop{grid-template-columns:1fr;gap:18px}.gwConversionActions{min-width:0;width:100%}.gwConversionTrust{grid-template-columns:1fr 1fr}.gwUploadSteps{grid-template-columns:1fr}.gwCheckoutTrust{grid-template-columns:1fr}
        .gwMobileCta{position:fixed;display:flex;left:10px;right:10px;bottom:10px;z-index:44;align-items:center;justify-content:space-between;gap:12px;background:#111318;color:#fff;border:1px solid rgba(255,255,255,.12);border-radius:18px;padding:10px 11px 10px 14px;box-shadow:0 18px 50px rgba(0,0,0,.3);transform:translateY(130%);opacity:0;transition:.2s}.gwMobileCta.show{transform:translateY(0);opacity:1}.gwMobileCta b{display:block;font-size:12px}.gwMobileCta small{display:block;font-size:9px;color:#9da2ab;margin-top:2px}.gwMobileCta button{border:0;background:#fff;color:#111318;border-radius:999px;padding:11px 14px;font-size:10px;font-weight:900;white-space:nowrap;cursor:pointer}
        body{padding-bottom:78px}
      }
      @media(max-width:430px){.gwConversionTrust{grid-template-columns:1fr}.gwConversionPanel h2{font-size:27px}}
    `;
    document.head.appendChild(style);
  };

  const patchCoreConversionCopy = () => {
    const price = currentPrice();
    const hero = document.querySelector('.hero');
    if (!hero) return false;

    const badge = hero.querySelector('.ac-badge, .badge');
    if (badge) badge.textContent = `12 Indian languages · Hinglish that stays Hinglish`;

    const h1 = hero.querySelector('h1');
    if (h1) h1.innerHTML = 'Every word, <span class="ac-highlight">on the beat.</span>';

    const lead = hero.querySelector('.lead');
    if (lead) lead.textContent = `Auto-captions drift. Ours carry a start and end for every single word, so the highlight lands exactly when it is spoken. 12 Indian languages, in your own script or romanised — and every word stays editable before you export.`;

    const navBtn = document.querySelector('.navBtn');
    if (navBtn) {
      navBtn.textContent = 'Create Auto Subtitles →';
      navBtn.style.background = '#10b981';
      navBtn.style.color = '#ffffff';
    }

    const toolTitle = document.getElementById('toolTitle');
    if (toolTitle) toolTitle.textContent = 'Drop your video here';
    const toolSub = document.getElementById('toolSub');
    if (toolSub) toolSub.textContent = 'Select MP4, WebM or MOV · 100% free browser processing';
    return true;
  };

  const activateVideoFirst = () => {
    if (location.pathname !== '/' && location.pathname !== '/index.html') return false;
    const params = new URLSearchParams(location.search);
    if (params.get('mode') === 'image') return false;
    if (params.get('mode') === 'subtitles' || document.getElementById('subtitlesTab')) return false;
    const videoTab = document.getElementById('videoTab');
    if (!videoTab) return false;
    if (!videoTab.classList.contains('active')) {
      if (typeof window.__GW_SWITCH_MODE__ === 'function') window.__GW_SWITCH_MODE__('video');
      else if (typeof videoTab.onclick === 'function') videoTab.onclick();
    }
    return true;
  };

  const mountHeroConversion = () => {
    const hero = document.querySelector('.hero');
    const lead = hero?.querySelector('.lead');
    const tool = document.getElementById('tool');
    if (!hero || !lead || !tool) return false;
    if (document.getElementById(ROOT_ID)) return true;

    const panel = document.createElement('section');
    panel.id = ROOT_ID;
    panel.className = 'gwConversionPanel';
    panel.setAttribute('aria-label', 'AutoCap Studio information');
    panel.innerHTML = `
      <div class="gwConversionTop">
        <div>
          <span class="gwConversionKicker">12 INDIAN LANGUAGES · 16 VIRAL CAPTION PRESETS</span>
          <h2>Auto Subtitles & AI Video Studio <span>100% free in-browser processing.</span></h2>
          <p>Transcribe 12 Indian languages with exact word-by-word timing, or remove watermarks and clean images directly on your device with no limits.</p>
        </div>
        <div class="gwConversionActions">
          <a class="gwConversionPrimary" id="gwHeroUploadVideo" href="#subtitlesTab" onclick="document.getElementById('subtitlesTab')?.click();">⚡ Auto Subtitles (Free)</a>
          <a class="gwConversionSecondary" id="gwHeroPricing" href="#how">How it works</a>
        </div>
      </div>
      <div class="gwConversionTrust">
        <span>100% Free Forever</span>
        <span>12 Indian Languages</span>
        <span>16 Caption Styles</span>
        <span>Local Browser Processing</span>
      </div>
    `;
        <span>Unlimited Videos</span>
        <span>Media stays on your device</span>
        <span>Zero Server Uploads</span>
      </div>
    `;
    lead.insertAdjacentElement('afterend', panel);

    const steps = document.createElement('div');
    steps.className = 'gwUploadSteps';
    steps.innerHTML = `
      <div><b>1</b><span><strong>Choose your video</strong><br>MP4, WebM or MOV</span></div>
      <div><b>2</b><span><strong>Instant processing</strong><br>Runs locally in browser</span></div>
      <div><b>3</b><span><strong>Download result</strong><br>Clean video · Free</span></div>
    `;
    panel.insertAdjacentElement('afterend', steps);

    const proof = document.createElement('div');
    proof.id = 'gwSelectedProof';
    proof.className = 'gwSelectedProof';
    proof.innerHTML = '<div class="gwProofIcon">✓</div><div><strong>Video loaded successfully</strong><span>Your video is ready to process. 100% free local cleanup.</span></div>';
    steps.insertAdjacentElement('afterend', proof);

    document.getElementById('gwHeroUploadVideo')?.addEventListener('click', (event) => {
      event.preventDefault();
      document.getElementById('videoTab')?.click();
      document.getElementById('tool')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setTimeout(() => document.getElementById('fileInput')?.click(), 100);
      track('landing_upload_video_click', { source: 'hero' });
    });
    document.getElementById('gwHeroPricing')?.addEventListener('click', () => {
      track('landing_pricing_click', { source: 'hero' });
    });

    return true;
  };

  const showSelectedProof = (file) => {
    if (!file || !file.type?.startsWith('video/')) return;
    const proof = document.getElementById('gwSelectedProof');
    if (!proof) return;
    proof.classList.add('show');
    refreshPrices();
    trackOnce('video_ready', 'landing_video_ready', {
      file_size_mb: Math.round((file.size / 1024 / 1024) * 10) / 10,
    });
  };

  const enhancePricing = () => {
    const pricing = document.getElementById('pricing');
    const featured = pricing?.querySelector('article.featured');
    const imageCard = pricing?.querySelector('.pricing article:not(.featured)');
    if (!pricing || !featured) return false;

    const pricingTitle = pricing.querySelector('h2');
    if (pricingTitle) pricingTitle.textContent = `Video access: ${currentPrice()} for 30 days.`;
    const sectionLead = pricing.querySelector('.sectionLead');
    if (sectionLead) sectionLead.textContent = `Choose your video before paying. Processing and download require the ${currentPrice()} 30-day video access pass. No automatic renewal. Supported image cleanup remains free.`;

    const featuredTitle = featured.querySelector('h3');
    if (featuredTitle) featuredTitle.textContent = '30-Day Video Pass';

    if (!featured.querySelector('.gwUploadFirstLink')) {
      const link = document.createElement('a');
      link.className = 'gwUploadFirstLink';
      link.href = '#tool';
      link.textContent = 'Choose video first — no payment yet';
      const buy = document.getElementById('buyPlan');
      featured.insertBefore(link, buy || null);
      link.addEventListener('click', (event) => {
        event.preventDefault();
        document.getElementById('videoTab')?.click();
        document.getElementById('tool')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        track('landing_upload_video_click', { source: 'pricing' });
      });
    }

    if (!featured.querySelector('.gwPricingAssurance')) {
      const assurance = document.createElement('div');
      assurance.className = 'gwPricingAssurance';
      assurance.innerHTML = '<span>30-day video access</span><span>No auto-renewal</span><span>Secure Cashfree checkout</span>';
      featured.querySelector('ul')?.insertAdjacentElement('afterend', assurance);
    }

    if (imageCard && !imageCard.querySelector('.gwPricingAssurance')) {
      const assurance = document.createElement('div');
      assurance.className = 'gwPricingAssurance';
      assurance.innerHTML = '<span>₹0 image cleanup</span><span>No account needed</span><span>Browser-side</span>';
      imageCard.querySelector('ul')?.insertAdjacentElement('afterend', assurance);
    }

    return true;
  };

  const enhanceCheckout = () => {
    const card = document.querySelector('#payModal .modalCard');
    const pay = document.getElementById('payBtn');
    if (!card || !pay) return false;

    const heading = card.querySelector('h2,h3');
    if (heading) heading.textContent = 'Unlock video processing';

    const description = card.querySelector(':scope > p');
    if (description) description.textContent = `Your selected video is ready. Unlock supported processing for ${currentPrice()} and keep video access active for 30 days. No automatic renewal.`;

    const duration = card.querySelector('.payPrice span');
    if (duration) duration.textContent = '30 days · no automatic renewal';

    if (!card.querySelector('.gwCheckoutTrust')) {
      const trust = document.createElement('div');
      trust.className = 'gwCheckoutTrust';
      trust.innerHTML = `
        <span>Video already selected</span>
        <span>30-day video access</span>
        <span>No auto-renewal</span>
        <span>Access unlocks after verification</span>
      `;
      pay.insertAdjacentElement('beforebegin', trust);
    }

    if (!card.querySelector('.gwCheckoutPolicies')) {
      const policies = document.createElement('div');
      policies.className = 'gwCheckoutPolicies';
      policies.innerHTML = '<a href="/refund-policy" target="_blank" rel="noopener">Refund policy</a><a href="/privacy" target="_blank" rel="noopener">Privacy</a><a href="/terms" target="_blank" rel="noopener">Terms</a>';
      pay.insertAdjacentElement('afterend', policies);
    }

    return true;
  };

  const trackPaywall = () => {
    const modal = document.getElementById('payModal');
    if (!modal) return false;
    const open = !modal.classList.contains('hidden');
    if (open && !paywallWasOpen) {
      track('video_paywall_seen', {
        price: currentPrice(),
        video_selected: document.getElementById('gwSelectedProof')?.classList.contains('show') ? 1 : 0,
      });
    }
    paywallWasOpen = open;
    if (!modal.dataset.gwConversionObserved) {
      modal.dataset.gwConversionObserved = '1';
      new MutationObserver(trackPaywall).observe(modal, { attributes: true, attributeFilter: ['class'] });
    }
    return true;
  };

  const placeTrustAfterPricing = () => {
    const trust = document.getElementById('trust');
    const pricing = document.getElementById('pricing');
    const faq = document.getElementById('faq');
    if (!trust || !pricing || !faq) return false;
    if (trust.previousElementSibling === pricing) return true;
    pricing.insertAdjacentElement('afterend', trust);
    return true;
  };

  const mountMobileCta = () => {
    if (document.getElementById('gwMobileCta')) return true;
    if (!document.getElementById('tool')) return false;

    const cta = document.createElement('div');
    cta.id = 'gwMobileCta';
    cta.className = 'gwMobileCta';
    cta.innerHTML = `<div><b>100% Free Video Remover</b><small>Unlimited processing · no payment required</small></div><button type="button">Choose video</button>`;
    document.body.appendChild(cta);

    cta.querySelector('button')?.addEventListener('click', () => {
      document.getElementById('videoTab')?.click();
      document.getElementById('tool')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setTimeout(() => document.getElementById('fileInput')?.click(), 100);
      track('landing_upload_video_click', { source: 'mobile_sticky' });
    });

    const updateVisibility = () => {
      if (!window.matchMedia('(max-width:760px)').matches) {
        cta.classList.remove('show');
        return;
      }
      const tool = document.getElementById('tool');
      const rect = tool?.getBoundingClientRect();
      const nearTool = rect && rect.top < window.innerHeight * .72 && rect.bottom > 120;
      const modalOpen = !document.getElementById('payModal')?.classList.contains('hidden');
      cta.classList.toggle('show', !nearTool && !modalOpen && window.scrollY > 240);
    };

    window.addEventListener('scroll', updateVisibility, { passive: true });
    window.addEventListener('resize', updateVisibility, { passive: true });
    document.addEventListener('click', () => setTimeout(updateVisibility, 40), true);
    updateVisibility();
    return true;
  };

  const refreshPrices = () => {
    const price = currentPrice();
    document.querySelectorAll('[data-gw-price]').forEach((element) => {
      if (element.textContent !== price) element.textContent = price;
    });
  };

  const bindVideoSelectionProof = () => {
    const input = document.getElementById('fileInput');
    if (input && !input.dataset.gwConversionBound) {
      input.dataset.gwConversionBound = '1';
      input.addEventListener('change', (event) => {
        showSelectedProof(event.currentTarget?.files?.[0]);
      });
    }
    const dropzone = document.getElementById('dropzone');
    if (dropzone && !dropzone.dataset.gwConversionBound) {
      dropzone.dataset.gwConversionBound = '1';
      dropzone.addEventListener('drop', (event) => {
        showSelectedProof(event.dataTransfer?.files?.[0]);
      }, true);
    }
  };

  const mount = () => {
    ensureStyle();
    patchCoreConversionCopy();
    const hero = mountHeroConversion();
    enhancePricing();
    enhanceCheckout();
    trackPaywall();
    mountMobileCta();
    placeTrustAfterPricing();
    bindVideoSelectionProof();
    refreshPrices();
    return hero;
  };

  trackOnce('landing_view', 'video_conversion_landing_view', {
    landing_variant: 'video_first_v2',
  });

  if (!mount()) {
    const target = document.getElementById('app') || document.documentElement;
    const observer = new MutationObserver(() => {
      if (mount()) observer.disconnect();
    });
    observer.observe(target, { childList: true, subtree: true });
  }

  setTimeout(() => {
    activateVideoFirst();
    patchCoreConversionCopy();
    mount();
  }, 350);
  setTimeout(() => {
    activateVideoFirst();
    patchCoreConversionCopy();
    enhancePricing();
    enhanceCheckout();
    trackPaywall();
    bindVideoSelectionProof();
    refreshPrices();
  }, 1200);
  setTimeout(() => {
    patchCoreConversionCopy();
    enhancePricing();
    enhanceCheckout();
    placeTrustAfterPricing();
    trackPaywall();
    refreshPrices();
  }, 2800);
})();
(() => {
  const STYLE_ID = 'gw-conversion-landing-v1-style';
  const ROOT_ID = 'gwConversionPanel';

  const currentPrice = () => {
    const featured = document.querySelector('#pricing article.featured .price b')?.textContent?.trim();
    if (featured) return featured;
    const modal = document.querySelector('#payModal .payPrice b')?.textContent?.trim();
    if (modal) return modal;
    const badge = document.querySelector('.hero .badge')?.textContent || '';
    const match = badge.match(/(?:₹|\$|€|£)\s?\d+(?:[.,]\d+)?/);
    return match?.[0]?.replace(/\s+/g, '') || '₹99';
  };

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

  const ensureStyle = () => {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .gwConversionPanel{max-width:920px;margin:28px auto 0;padding:18px;background:linear-gradient(135deg,#111318 0%,#1b1e25 100%);border:1px solid rgba(255,255,255,.08);border-radius:24px;color:#fff;text-align:left;box-shadow:0 24px 70px rgba(17,19,24,.14)}
      .gwConversionTop{display:grid;grid-template-columns:1fr auto;gap:24px;align-items:center}
      .gwConversionKicker{display:inline-flex;align-items:center;gap:7px;font-size:10px;letter-spacing:.14em;font-weight:800;color:#bfcaff;margin-bottom:10px}.gwConversionKicker::before{content:'';width:7px;height:7px;border-radius:50%;background:#62d48f;box-shadow:0 0 0 4px rgba(98,212,143,.12)}
      .gwConversionPanel h2{font:600 clamp(25px,3.4vw,39px)/1.05 'Manrope',sans-serif;letter-spacing:-.04em;margin:0 0 10px;color:#fff;max-width:650px}.gwConversionPanel h2 span{color:#aebcff}
      .gwConversionPanel p{margin:0;color:#aeb2bb;font-size:13px;line-height:1.65;max-width:680px}
      .gwConversionActions{display:flex;flex-direction:column;gap:9px;min-width:210px}.gwConversionPrimary,.gwConversionSecondary{border-radius:999px;padding:13px 18px;text-decoration:none;text-align:center;font-size:12px;font-weight:800;cursor:pointer}.gwConversionPrimary{background:#fff;color:#111318;border:1px solid #fff}.gwConversionSecondary{background:transparent;color:#fff;border:1px solid rgba(255,255,255,.2)}
      .gwConversionPrimary:hover,.gwConversionSecondary:hover{transform:translateY(-1px)}
      .gwConversionTrust{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:16px;padding-top:16px;border-top:1px solid rgba(255,255,255,.1)}.gwConversionTrust span{display:flex;align-items:center;gap:7px;font-size:11px;color:#d7dae0}.gwConversionTrust span::before{content:'✓';display:grid;place-items:center;width:19px;height:19px;border-radius:50%;background:rgba(98,212,143,.12);color:#7fe3a6;font-size:11px;font-weight:900;flex:none}
      .gwUploadSteps{max-width:920px;margin:12px auto 0;display:grid;grid-template-columns:repeat(3,1fr);gap:8px;text-align:left}.gwUploadSteps>div{background:#fff;border:1px solid #dedfd9;border-radius:15px;padding:12px 14px;display:flex;align-items:center;gap:10px}.gwUploadSteps b{width:25px;height:25px;border-radius:8px;display:grid;place-items:center;background:#111318;color:#fff;font-size:10px;flex:none}.gwUploadSteps span{font-size:11px;color:#61656c;line-height:1.35}.gwUploadSteps strong{color:#111318;font-weight:800}
      .gwPricingAssurance{margin-top:16px;display:flex;gap:8px;flex-wrap:wrap}.gwPricingAssurance span{padding:8px 10px;border-radius:999px;background:#f6f6f3;border:1px solid #e1e2dd;font-size:10px;font-weight:700;color:#5d6168}.featured .gwPricingAssurance span{background:#1c1f25;border-color:#31343b;color:#d8dbe2}
      .gwUploadFirstLink{display:block;margin:0 0 10px;border:1px solid rgba(255,255,255,.22);border-radius:999px;padding:13px 18px;text-align:center;color:#fff!important;text-decoration:none;font-size:11px;font-weight:800}.gwUploadFirstLink:hover{background:rgba(255,255,255,.06)}
      .gwCheckoutTrust{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin:13px 0 4px}.gwCheckoutTrust span{padding:9px 10px;border:1px solid #e5e5e0;border-radius:11px;background:#fafaf8;font-size:10px;color:#62666d;line-height:1.3}.gwCheckoutTrust span::before{content:'✓ ';color:#2f9b5f;font-weight:900}.gwCheckoutPolicies{display:flex;justify-content:center;gap:12px;flex-wrap:wrap;margin-top:10px}.gwCheckoutPolicies a{font-size:9px;color:#73777d;text-decoration:underline;text-underline-offset:2px}
      .gwMobileCta{display:none}
      @media(max-width:760px){
        .gwConversionPanel{margin-top:22px;padding:17px;border-radius:20px}.gwConversionTop{grid-template-columns:1fr;gap:18px}.gwConversionActions{min-width:0;width:100%}.gwConversionTrust{grid-template-columns:1fr 1fr}.gwUploadSteps{grid-template-columns:1fr}.gwCheckoutTrust{grid-template-columns:1fr}
        .gwMobileCta{position:fixed;display:flex;left:10px;right:10px;bottom:10px;z-index:44;align-items:center;justify-content:space-between;gap:12px;background:#111318;color:#fff;border:1px solid rgba(255,255,255,.12);border-radius:18px;padding:10px 11px 10px 14px;box-shadow:0 18px 50px rgba(0,0,0,.3);transform:translateY(130%);opacity:0;transition:.2s}.gwMobileCta.show{transform:translateY(0);opacity:1}.gwMobileCta b{display:block;font-size:12px}.gwMobileCta small{display:block;font-size:9px;color:#9da2ab;margin-top:2px}.gwMobileCta button{border:0;background:#fff;color:#111318;border-radius:999px;padding:11px 14px;font-size:10px;font-weight:900;white-space:nowrap;cursor:pointer}
        body{padding-bottom:78px}
      }
      @media(max-width:430px){.gwConversionTrust{grid-template-columns:1fr}.gwConversionPanel h2{font-size:27px}}
    `;
    document.head.appendChild(style);
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
    panel.setAttribute('aria-label', 'Video plan and upload information');
    panel.innerHTML = `
      <div class="gwConversionTop">
        <div>
          <span class="gwConversionKicker">UPLOAD FIRST · PAY ONLY BEFORE PROCESSING</span>
          <h2>Your video can be selected first. <span>No blind checkout.</span></h2>
          <p>Choose your Gemini/Veo video and let the tool read it locally. If you want to process it, unlock supported video cleanup for <strong data-gw-price>₹99</strong> for 30 days.</p>
        </div>
        <div class="gwConversionActions">
          <a class="gwConversionPrimary" id="gwHeroUploadVideo" href="#tool">Upload my video</a>
          <a class="gwConversionSecondary" id="gwHeroPricing" href="#pricing">See the 30-day plan</a>
        </div>
      </div>
      <div class="gwConversionTrust">
        <span>Cashfree secure checkout</span>
        <span>No automatic renewal</span>
        <span>Media stays on your device</span>
        <span>30-day video access</span>
      </div>
    `;
    lead.insertAdjacentElement('afterend', panel);

    const steps = document.createElement('div');
    steps.className = 'gwUploadSteps';
    steps.innerHTML = `
      <div><b>1</b><span><strong>Select video</strong><br>MP4, WebM or MOV</span></div>
      <div><b>2</b><span><strong>Check support</strong><br>File is read locally first</span></div>
      <div><b>3</b><span><strong>Unlock & process</strong><br><span data-gw-price>₹99</span> · 30 days</span></div>
    `;
    panel.insertAdjacentElement('afterend', steps);

    document.getElementById('gwHeroUploadVideo')?.addEventListener('click', (event) => {
      event.preventDefault();
      document.getElementById('videoTab')?.click();
      document.getElementById('tool')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      track('landing_upload_video_click', { source: 'hero' });
    });
    document.getElementById('gwHeroPricing')?.addEventListener('click', () => {
      track('landing_pricing_click', { source: 'hero' });
    });

    return true;
  };

  const enhancePricing = () => {
    const pricing = document.getElementById('pricing');
    const featured = pricing?.querySelector('article.featured');
    const imageCard = pricing?.querySelector('.pricing article:not(.featured)');
    if (!pricing || !featured) return false;

    if (!featured.querySelector('.gwUploadFirstLink')) {
      const link = document.createElement('a');
      link.className = 'gwUploadFirstLink';
      link.href = '#tool';
      link.textContent = 'Upload video first — no payment yet';
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
      assurance.innerHTML = '<span>30 days</span><span>No auto-renewal</span><span>Server-verified access</span>';
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

    if (!card.querySelector('.gwCheckoutTrust')) {
      const trust = document.createElement('div');
      trust.className = 'gwCheckoutTrust';
      trust.innerHTML = `
        <span>Cashfree checkout</span>
        <span>30-day access</span>
        <span>No auto-renewal</span>
        <span>Unlocks after payment verification</span>
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
    cta.innerHTML = `<div><b>Try your video first</b><small><span data-gw-price>₹99</span> · 30-day plan only before processing</small></div><button type="button">Upload video</button>`;
    document.body.appendChild(cta);

    cta.querySelector('button')?.addEventListener('click', () => {
      document.getElementById('videoTab')?.click();
      document.getElementById('tool')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
      cta.classList.toggle('show', !nearTool && !modalOpen && window.scrollY > 280);
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

  const mount = () => {
    ensureStyle();
    const hero = mountHeroConversion();
    enhancePricing();
    enhanceCheckout();
    mountMobileCta();
    placeTrustAfterPricing();
    refreshPrices();
    return hero;
  };

  if (!mount()) {
    const target = document.getElementById('app') || document.documentElement;
    const observer = new MutationObserver(() => {
      if (mount()) observer.disconnect();
    });
    observer.observe(target, { childList: true, subtree: true });
  }

  // Regional pricing arrives asynchronously. Refresh the conversion copy after
  // the pricing API has had time to update the core UI.
  setTimeout(refreshPrices, 500);
  setTimeout(refreshPrices, 1500);
  setTimeout(() => {
    enhancePricing();
    enhanceCheckout();
    placeTrustAfterPricing();
    refreshPrices();
  }, 2600);
})();

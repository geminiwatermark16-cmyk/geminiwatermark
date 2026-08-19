(() => {
  const mountIndiaTrust = () => {
    const trust = document.getElementById('trust');
    if (!trust || document.getElementById('gwIndiaTrust')) return Boolean(document.getElementById('gwIndiaTrust'));

    const intro = trust.querySelector('.gwTrustIntro');
    if (!intro) return false;

    const block = document.createElement('div');
    block.id = 'gwIndiaTrust';
    block.className = 'gwIndiaTrust';
    block.innerHTML = `
      <div class="gwIndiaHead">
        <span>🇮🇳 BUILT FOR INDIA</span>
        <b>Simple pricing. Familiar checkout. Real support.</b>
      </div>
      <div class="gwIndiaGrid">
        <div><strong>₹99</strong><small>30-day video plan</small></div>
        <div><strong>INR</strong><small>Clear India pricing</small></div>
        <div><strong>Cashfree</strong><small>Payment checkout</small></div>
        <div><strong>Hindi + English</strong><small>Support available</small></div>
      </div>
      <div class="gwIndiaBadges" aria-label="India service highlights">
        <span>✓ No automatic renewal</span>
        <span>✓ Payment verified on server</span>
        <span>✓ Privacy policy published</span>
        <span>✓ Refund policy published</span>
        <span>✓ Live chat support</span>
      </div>
    `;

    intro.insertAdjacentElement('afterend', block);

    const style = document.createElement('style');
    style.id = 'gw-india-trust-styles';
    style.textContent = `
      .gwIndiaTrust{margin:0 0 26px;background:linear-gradient(135deg,#fff 0%,#f9f7f1 100%);border:1px solid rgba(17,17,17,.09);border-radius:26px;padding:24px;box-shadow:0 16px 44px rgba(0,0,0,.035)}
      .gwIndiaHead{display:flex;align-items:end;justify-content:space-between;gap:20px;margin-bottom:20px}.gwIndiaHead span{font-size:11px;letter-spacing:.15em;font-weight:850;opacity:.6}.gwIndiaHead b{font-size:20px;letter-spacing:-.025em;text-align:right}
      .gwIndiaGrid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.gwIndiaGrid>div{background:#111;color:#fff;border-radius:18px;padding:18px;min-height:105px;display:flex;flex-direction:column;justify-content:space-between}.gwIndiaGrid strong{font-size:22px;letter-spacing:-.035em}.gwIndiaGrid small{font-size:12px;opacity:.62}
      .gwIndiaBadges{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}.gwIndiaBadges span{padding:9px 12px;border-radius:999px;background:#fff;border:1px solid rgba(17,17,17,.1);font-size:12px;font-weight:700}
      @media(max-width:900px){.gwIndiaGrid{grid-template-columns:repeat(2,1fr)}}
      @media(max-width:600px){.gwIndiaTrust{padding:18px;border-radius:20px}.gwIndiaHead{align-items:flex-start;flex-direction:column}.gwIndiaHead b{text-align:left}.gwIndiaGrid{grid-template-columns:1fr 1fr}.gwIndiaGrid>div{min-height:92px;padding:15px}.gwIndiaBadges span{width:100%;text-align:center}}
    `;
    document.head.appendChild(style);
    return true;
  };

  if (!mountIndiaTrust()) {
    const target = document.getElementById('app') || document.body;
    const observer = new MutationObserver(() => {
      if (mountIndiaTrust()) observer.disconnect();
    });
    observer.observe(target, { childList: true, subtree: true });
  }
})();

// Keep the ₹99 Cashfree checkout reachable from both video experiences even
// while free video trial credits remain. The free quota is not consumed or
// blocked by this UI; users can close checkout and continue using free videos.
(() => {
  const STYLE_ID = 'gw-video-payment-entry-style';

  const freeVideosLeft = () => {
    const badge = document.getElementById('videoBadge')?.textContent?.trim() || '';
    const match = badge.match(/^(\d+)\s+Free$/i);
    return match ? Math.max(0, Number(match[1]) || 0) : 0;
  };

  const isPaid = () => {
    const badge = document.getElementById('videoBadge')?.textContent?.trim() || '';
    const quota = document.getElementById('quotaPrice')?.textContent?.trim() || '';
    return badge === 'Unlocked' || quota === 'Active';
  };

  const currentPrice = () =>
    document.querySelector('#payModal .payPrice b')?.textContent?.trim() ||
    document.querySelector('#pricing article.featured .price b')?.textContent?.trim() ||
    '₹99';

  const openCheckout = () => {
    const modal = document.getElementById('payModal');
    if (!modal) return;

    const price = currentPrice();
    const left = freeVideosLeft();
    const copy = modal.querySelector('.modalCard > p');
    const payButton = document.getElementById('payBtn');

    if (copy) {
      copy.textContent = left > 0
        ? `You still have ${left} free video${left === 1 ? '' : 's'} left. Continue free, or buy the ${price} video plan now for 30 days.`
        : `Your free video allowance is used. Continue with the ${price} video plan for 30 days.`;
    }
    if (payButton && !payButton.disabled) payButton.textContent = `Pay ${price} with Cashfree`;

    modal.classList.remove('hidden');
    document.body.classList.add('locked');
    setTimeout(() => {
      const preferred = document.getElementById('phone') || document.getElementById('email');
      preferred?.focus?.();
    }, 50);
  };

  const ensureStyle = () => {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .gwVideoPayEntry{border:0;border-radius:999px;padding:9px 13px;background:#111;color:#fff;font:inherit;font-size:12px;font-weight:850;cursor:pointer;white-space:nowrap;box-shadow:0 8px 20px rgba(0,0,0,.12)}
      .gwVideoPayEntry:hover{transform:translateY(-1px)}
      .quota .gwVideoPayEntry{margin-left:auto}
      .gwUpscaleHero .gwVideoPayEntry{margin-left:auto;align-self:flex-start}
      @media(max-width:700px){.quota .gwVideoPayEntry{width:100%;margin:8px 0 0}.gwUpscaleHero .gwVideoPayEntry{width:100%;margin:12px 0 0}}
    `;
    document.head.appendChild(style);
  };

  const wireButton = (button) => {
    if (!button || button.dataset.gwCheckoutWired === '1') return;
    button.dataset.gwCheckoutWired = '1';
    button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      openCheckout();
    });
  };

  const ensureEntryPoints = () => {
    const modal = document.getElementById('payModal');
    const videoTab = document.getElementById('videoTab');
    if (!modal || !videoTab) return false;

    ensureStyle();
    const paid = isPaid();
    const price = currentPrice();

    // Pricing CTA: keep it usable even before all free videos are consumed.
    const buyPlan = document.getElementById('buyPlan');
    if (buyPlan) {
      buyPlan.style.display = paid ? 'none' : '';
      if (!paid) buyPlan.textContent = `Buy ${price} plan now`;
      wireButton(buyPlan);
    }

    // My Account CTA previously only jumped to #pricing; open checkout instead.
    const accountUpgrade = document.getElementById('accountUpgrade');
    if (accountUpgrade && accountUpgrade.dataset.gwCheckoutWired !== '1') {
      accountUpgrade.dataset.gwCheckoutWired = '1';
      accountUpgrade.addEventListener('click', (event) => {
        event.preventDefault();
        document.getElementById('accountModal')?.classList.add('hidden');
        document.body.classList.remove('locked');
        openCheckout();
      });
    }

    // Normal Video mode gets its own visible payment entry in the quota row.
    const quota = document.querySelector('#tool > .quota');
    let videoPay = document.getElementById('gwVideoUpgradeInline');
    if (quota && !videoPay) {
      videoPay = document.createElement('button');
      videoPay.id = 'gwVideoUpgradeInline';
      videoPay.type = 'button';
      videoPay.className = 'gwVideoPayEntry';
      quota.appendChild(videoPay);
      wireButton(videoPay);
    }
    if (videoPay) {
      videoPay.textContent = `Buy ${price} plan`;
      const videoActive = videoTab.classList.contains('active');
      videoPay.style.display = !paid && videoActive ? '' : 'none';
    }

    // Video Enhance previously had no Cashfree entry point at all.
    const enhanceHero = document.querySelector('#upscalePanel .gwUpscaleHero');
    let enhancePay = document.getElementById('gwEnhanceUpgradeInline');
    if (enhanceHero && !enhancePay) {
      enhancePay = document.createElement('button');
      enhancePay.id = 'gwEnhanceUpgradeInline';
      enhancePay.type = 'button';
      enhancePay.className = 'gwVideoPayEntry';
      enhanceHero.appendChild(enhancePay);
      wireButton(enhancePay);
    }
    if (enhancePay) {
      enhancePay.textContent = `Buy ${price} plan`;
      const enhanceActive = document.getElementById('upscaleTab')?.classList.contains('active');
      enhancePay.style.display = !paid && enhanceActive ? '' : 'none';
    }

    return true;
  };

  const refreshSoon = () => setTimeout(ensureEntryPoints, 0);
  document.addEventListener('click', (event) => {
    if (event.target.closest('#videoTab, #imageTab, #upscaleTab, #backgroundTab, #accountBtn, #footerAccountBtn, #closeModal')) {
      refreshSoon();
    }
  }, true);

  const observer = new MutationObserver(() => ensureEntryPoints());
  observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true });
  ensureEntryPoints();
})();

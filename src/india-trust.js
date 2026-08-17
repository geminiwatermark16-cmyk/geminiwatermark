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

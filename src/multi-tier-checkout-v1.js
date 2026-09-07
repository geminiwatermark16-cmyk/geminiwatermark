(() => {
  const STYLE_ID = 'gw-multi-tier-style';

  function ensureStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .gw-plan-selector {
        display: flex;
        flex-direction: column;
        gap: 10px;
        margin: 16px 0;
        text-align: left;
      }
      .gw-plan-card {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 14px 16px;
        border: 2px solid #e2e4dd;
        border-radius: 16px;
        cursor: pointer;
        background: #fafaf8;
        transition: all .16s ease;
      }
      .gw-plan-card:hover {
        border-color: #b0b3a8;
      }
      .gw-plan-card.active {
        border-color: #111318;
        background: #fff;
        box-shadow: 0 4px 14px rgba(17,19,24,.08);
      }
      .gw-plan-card input[type="radio"] {
        accent-color: #111318;
        width: 18px;
        height: 18px;
        margin: 0;
        cursor: pointer;
      }
      .gw-plan-badge {
        position: absolute;
        top: -9px;
        right: 14px;
        background: #10b981;
        color: #fff;
        font-size: 9px;
        font-weight: 900;
        letter-spacing: .06em;
        padding: 2px 8px;
        border-radius: 999px;
        text-transform: uppercase;
      }
      .gw-plan-details {
        flex: 1;
      }
      .gw-plan-title {
        font-size: 13px;
        font-weight: 800;
        color: #111;
      }
      .gw-plan-desc {
        font-size: 11px;
        color: #666;
        margin-top: 1px;
      }
      .gw-plan-cost {
        text-align: right;
      }
      .gw-plan-cost b {
        display: block;
        font-size: 16px;
        font-weight: 900;
        color: #111;
      }
      .gw-plan-cost span {
        display: block;
        font-size: 10px;
        color: #888;
      }
    `;
    document.head.appendChild(style);
  }

  window.__GW_SELECTED_PLAN_TIER__ = 'monthly';

  function initPlanSelector() {
    const modalCard = document.querySelector('#payModal .modalCard');
    if (!modalCard) return;

    const existingPrice = modalCard.querySelector('.payPrice');
    const payBtn = document.getElementById('payBtn');
    if (!existingPrice || !payBtn) return;

    if (document.getElementById('gwPlanSelector')) return;

    // Check if user is in India (default currency INR)
    const isIndia = !existingPrice.textContent.includes('$');

    if (!isIndia) return; // For international, keep $1 single option

    existingPrice.style.display = 'none';

    const selector = document.createElement('div');
    selector.id = 'gwPlanSelector';
    selector.className = 'gw-plan-selector';
    selector.innerHTML = `
      <label class="gw-plan-card active" data-tier="monthly">
        <input type="radio" name="gw_plan_choice" value="monthly" checked>
        <span class="gw-plan-badge">BEST VALUE</span>
        <div class="gw-plan-details">
          <div class="gw-plan-title">30-Day Creator Pass</div>
          <div class="gw-plan-desc">Unlimited video processing · 30 days</div>
        </div>
        <div class="gw-plan-cost">
          <b>₹99</b>
          <span>no renewal</span>
        </div>
      </label>

      <label class="gw-plan-card" data-tier="single">
        <input type="radio" name="gw_plan_choice" value="single">
        <div class="gw-plan-details">
          <div class="gw-plan-title">Single Video Pass</div>
          <div class="gw-plan-desc">Process 1 video · 24-hr access</div>
        </div>
        <div class="gw-plan-cost">
          <b>₹29</b>
          <span>instant</span>
        </div>
      </label>
    `;

    existingPrice.parentNode.insertBefore(selector, existingPrice);

    const cards = selector.querySelectorAll('.gw-plan-card');

    function updateSelection(tier) {
      window.__GW_SELECTED_PLAN_TIER__ = tier;
      cards.forEach((card) => {
        const isMatch = card.dataset.tier === tier;
        card.classList.toggle('active', isMatch);
        const radio = card.querySelector('input[type="radio"]');
        if (radio) radio.checked = isMatch;
      });

      const priceStr = tier === 'single' ? '₹29' : '₹99';
      if (payBtn && !payBtn.disabled) {
        payBtn.textContent = `Pay ${priceStr} with Cashfree`;
      }
    }

    cards.forEach((card) => {
      card.addEventListener('click', () => {
        const tier = card.dataset.tier;
        if (tier) updateSelection(tier);
      });
    });

    // Update pricing section on landing page to show both passes
    const pricingSection = document.getElementById('pricing');
    if (pricingSection) {
      const videoArticle = pricingSection.querySelector('article.featured');
      if (videoArticle && !videoArticle.querySelector('.gw-single-hint')) {
        const hint = document.createElement('p');
        hint.className = 'gw-single-hint';
        hint.style.cssText = 'margin-top:8px;font-size:11px;color:#aeb2bb;';
        hint.innerHTML = '⚡ <em>Need only 1 video?</em> Single Video Pass also available for <strong>₹29</strong>.';
        videoArticle.appendChild(hint);
      }
    }
  }

  ensureStyles();
  initPlanSelector();

  // Watch in case modal is re-rendered
  const payModal = document.getElementById('payModal');
  if (payModal) {
    const observer = new MutationObserver(() => initPlanSelector());
    observer.observe(payModal, { childList: true, subtree: true });
  }
})();

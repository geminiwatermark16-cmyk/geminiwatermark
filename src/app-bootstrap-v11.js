// Paid-video policy: images stay free, but video access requires the paid plan
// before the first upload. Mark the old browser trial as fully consumed before
// the application runtime evaluates its entitlement gate.
try {
  localStorage.setItem('gw_video_free_count_v2', '21');
  localStorage.setItem('gw_video_free_used_v1', '1');
} catch {}

// Load the existing app/account/payment runtime first.
await import('./runtime-loader.js?v=20260818-13');

// Pure-browser story cleaner with texture restore, edge feathering and safe
// temporal stabilization. No OpenCV/WASM dependency.
await import('./video-clean-v13.js?v=20260818-14');

if (typeof window.__GW_PURE_CLEAN_STORY_VIDEO__ === 'function') {
  const pureCleaner = window.__GW_PURE_CLEAN_STORY_VIDEO__;

  window.__GW_EXACT_CLEAN_STORY_VIDEO__ = async (blob, options = {}) => {
    const title = document.getElementById('processingTitle');
    const sub = document.getElementById('processingSub');
    if (title) title.textContent = 'Removing Gemini diamond…';
    if (sub) sub.textContent = 'Texture-aware cleanup · smoothing artifacts';

    let timer;
    try {
      return await Promise.race([
        pureCleaner(blob, options),
        new Promise((_, reject) => {
          timer = setTimeout(() => reject(new Error('Video cleanup timed out. Please retry once.')), 45000);
        })
      ]);
    } finally {
      if (timer) clearTimeout(timer);
    }
  };

  window.__GW_ACTIVE_VIDEO_CLEANER__ = 'pure-js-v14-texture-smooth-watchdog';
}

const TOKEN_KEY = 'gw_video_plan_token_v1';
const DEFAULT_PLAN_PRICE = {
  country: 'IN',
  region: 'india',
  amount: 99,
  currency: 'INR',
  displayPrice: '₹99',
  durationDays: 30,
  requiresIndianPhone: true,
  requiresEmail: false,
};
let planPrice = { ...DEFAULT_PLAN_PRICE };

function setText(element, text) {
  if (element && element.textContent !== text) element.textContent = text;
}

function setHtml(element, html) {
  if (element && element.innerHTML !== html) element.innerHTML = html;
}

function ensureUnlimitedStyles() {
  if (document.getElementById('gw-unlimited-plan-style')) return;
  const style = document.createElement('style');
  style.id = 'gw-unlimited-plan-style';
  style.textContent = `
    #pricing article.featured{position:relative;overflow:hidden}
    .gwUnlimitedPill{display:inline-flex;align-items:center;gap:7px;margin:10px 0 4px;padding:8px 12px;border-radius:999px;background:#111;color:#fff;font-size:12px;font-weight:900;letter-spacing:.08em;text-transform:uppercase}
    .gwUnlimitedPill::before{content:'✦';font-size:11px}
    #payModal .gwUnlimitedModal{display:inline-flex;margin:2px 0 12px;padding:8px 12px;border-radius:999px;background:#111;color:#fff;font-size:12px;font-weight:900;letter-spacing:.08em;text-transform:uppercase}
    #videoBadge{white-space:nowrap}
  `;
  document.head.appendChild(style);
}

function patchCheckoutIdentityUi() {
  const phone = document.getElementById('phone');
  const email = document.getElementById('email');
  const phoneLabel = phone?.closest('label');
  const emailLabel = email?.closest('label');

  if (planPrice.region === 'international') {
    if (phoneLabel) phoneLabel.style.display = 'none';
    if (phone) phone.value = '';
    if (emailLabel) {
      const em = emailLabel.querySelector('em');
      if (em) em.textContent = 'required';
    }
    if (email) {
      email.required = true;
      email.placeholder = 'you@example.com';
    }
  } else {
    if (phoneLabel) phoneLabel.style.display = '';
    if (emailLabel) {
      const em = emailLabel.querySelector('em');
      if (em) em.textContent = 'optional';
    }
    if (email) email.required = false;
  }
}

function patchPaidVideoCopy() {
  ensureUnlimitedStyles();
  const price = planPrice.displayPrice;

  const videoBadge = document.getElementById('videoBadge');
  const quotaPrice = document.getElementById('quotaPrice');
  const isPaid = videoBadge?.textContent?.trim() === 'Unlocked' || quotaPrice?.textContent?.trim() === 'Active';
  const videoMode = document.getElementById('videoTab')?.classList.contains('active');

  setHtml(document.querySelector('.hero .badge'), `<i></i> Images free · Unlimited Videos ${price} / 30 Days`);
  setText(document.querySelector('.hero .lead'), `Remove supported visible Gemini watermarks from images and Veo videos in your browser. Images are free. Get unlimited video processing for 30 days with the ${price} plan. Payment is required before your first video upload.`);

  if (videoBadge && !isPaid) setText(videoBadge, `${price} · Unlimited`);

  setHtml(document.querySelector('.metrics article:nth-child(3)'), '<b>Unlimited</b><span>Videos for 30 days</span>');
  setHtml(document.querySelector('.metrics article:nth-child(4)'), `<b>${price}</b><span>30-day video plan</span>`);

  setText(document.querySelector('#pricing h2'), `Unlimited videos. ${price} for 30 days.`);
  setText(document.querySelector('#pricing .sectionLead'), `Pay ${price} once and process unlimited supported videos for 30 days. No free video trial and no automatic renewal.`);

  const featured = document.querySelector('#pricing article.featured');
  if (featured) {
    setText(featured.querySelector(':scope > span'), 'UNLIMITED VIDEO PLAN');
    const priceValue = featured.querySelector('.price b');
    if (priceValue) setText(priceValue, price);
    const priceEm = featured.querySelector('.price em');
    if (priceEm) setText(priceEm, '30 days');
    const list = featured.querySelector('ul');
    if (list) {
      const items = list.querySelectorAll('li');
      if (items[0]) setText(items[0], 'Unlimited video processing for 30 days');
      if (items[1]) setText(items[1], '1080×1920 story/reel support');
      if (items[2]) setText(items[2], 'New Gemini diamond + old Veo mode');
      let pill = featured.querySelector('.gwUnlimitedPill');
      if (!pill) {
        pill = document.createElement('div');
        pill.className = 'gwUnlimitedPill';
        const priceBox = featured.querySelector('.price');
        priceBox?.insertAdjacentElement('afterend', pill);
      }
      setText(pill, 'Unlimited Videos · 30 Days');
    }
    const buyBtn = featured.querySelector('#buyPlan');
    if (buyBtn) setText(buyBtn, `Get Unlimited Videos · ${price}`);
  }

  const faqDetails = [...document.querySelectorAll('#faq details')];
  const oldTrialFaq = faqDetails.find((detail) => detail.querySelector('summary')?.textContent?.includes('21 free'));
  if (oldTrialFaq) {
    setText(oldTrialFaq.querySelector('summary'), 'Do videos have a free trial?');
    setText(oldTrialFaq.querySelector('p'), `No. Video upload and processing require the ${price} plan. The plan includes unlimited supported video processing for 30 days. Image cleanup remains free.`);
  }

  const modal = document.getElementById('payModal');
  const modalCard = modal?.querySelector('.modalCard');
  if (modalCard) {
    setText(modalCard.querySelector('h2'), 'Unlock Unlimited Videos');
    setText(modalCard.querySelector(':scope > p'), `Pay ${price} once to unlock unlimited supported video processing for 30 days. Payment is required before your first video upload.`);
    const payPriceValue = modalCard.querySelector('.payPrice b');
    if (payPriceValue) setText(payPriceValue, price);
    const priceText = modalCard.querySelector('.payPrice span');
    if (priceText) setText(priceText, 'Unlimited videos · 30 days');
    let modalPill = modalCard.querySelector('.gwUnlimitedModal');
    if (!modalPill) {
      modalPill = document.createElement('div');
      modalPill.className = 'gwUnlimitedModal';
      modalCard.querySelector('.payPrice')?.insertAdjacentElement('beforebegin', modalPill);
    }
    setText(modalPill, 'Unlimited Videos · 30 Days');
    const payBtn = document.getElementById('payBtn');
    if (payBtn && !payBtn.disabled) setText(payBtn, `Pay ${price} with Cashfree`);
  }

  const accountUpgrade = document.getElementById('accountUpgrade');
  if (accountUpgrade) setText(accountUpgrade, `Buy / renew ${price} plan`);

  if (videoMode && !isPaid) {
    setText(document.getElementById('quotaTitle'), `Unlimited Videos · ${price}`);
    setText(document.getElementById('quotaText'), '30 days unlimited processing · no auto-renewal');
    setText(quotaPrice, price);
    setText(document.getElementById('toolTitle'), 'Unlock unlimited video processing');
    setText(document.getElementById('toolSub'), `${price} gives unlimited supported videos for 30 days`);
    setText(document.getElementById('dropStrong'), `Get Unlimited Videos · ${price}`);
    setText(document.getElementById('dropMeta'), 'Pay once · unlimited supported videos for 30 days');
  }

  patchCheckoutIdentityUi();
}

async function postJson(url, body) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.ok === false) throw new Error(data.error || 'Request failed.');
  return data;
}

function installRegionalCheckout() {
  const payBtn = document.getElementById('payBtn');
  if (!payBtn) return;

  payBtn.onclick = async () => {
    const phone = String(document.getElementById('phone')?.value || '').replace(/\D/g, '').slice(-15);
    const email = String(document.getElementById('email')?.value || '').trim();
    const msg = document.getElementById('checkoutMsg');
    const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    if (planPrice.region === 'india' && !/^[6-9]\d{9}$/.test(phone)) {
      if (msg) msg.textContent = 'Enter a valid 10-digit Indian mobile number.';
      return;
    }
    if (planPrice.region === 'international' && !validEmail) {
      if (msg) msg.textContent = 'Enter a valid email address for international checkout.';
      return;
    }
    if (email && !validEmail) {
      if (msg) msg.textContent = 'Enter a valid email address.';
      return;
    }

    payBtn.disabled = true;
    payBtn.textContent = 'Opening Cashfree…';
    if (msg) msg.textContent = '';

    try {
      const order = await postJson('/api/create-order', { phone, email });
      if (typeof window.Cashfree !== 'function') throw new Error('Cashfree checkout SDK did not load.');
      const cashfree = window.Cashfree({ mode: order.mode });
      const result = await cashfree.checkout({ paymentSessionId: order.paymentSessionId, redirectTarget: '_modal' });
      if (result?.error) throw new Error(result.error.message || 'Checkout did not complete.');

      const verification = await postJson('/api/verify-order', { orderId: order.orderId });
      if (!verification.paid || !verification.entitlementToken) {
        throw new Error('Payment is not verified yet. If money was debited, reopen My Account in a moment.');
      }

      localStorage.setItem(TOKEN_KEY, verification.entitlementToken);
      if (msg) msg.textContent = 'Payment verified. Video access is unlocked for 30 days.';
      location.reload();
    } catch (error) {
      if (msg) msg.textContent = error?.message || 'Checkout could not be completed.';
      payBtn.disabled = false;
      payBtn.textContent = `Pay ${planPrice.displayPrice} with Cashfree`;
    }
  };
}

async function loadRegionalPlanPrice() {
  try {
    const response = await fetch('/api/plan-price', { cache: 'no-store' });
    const data = await response.json();
    if (response.ok && data?.ok && data?.displayPrice) {
      planPrice = { ...DEFAULT_PLAN_PRICE, ...data };
    }
  } catch {
    planPrice = { ...DEFAULT_PLAN_PRICE };
  }
  patchPaidVideoCopy();
  installRegionalCheckout();
}

patchPaidVideoCopy();
installRegionalCheckout();
loadRegionalPlanPrice();

for (const id of ['videoTab', 'imageTab', 'chooseAnother', 'buyPlan', 'closeModal', 'payBtn', 'accountBtn', 'footerAccountBtn']) {
  document.getElementById(id)?.addEventListener('click', () => setTimeout(() => {
    patchPaidVideoCopy();
    installRegionalCheckout();
  }, 0));
}

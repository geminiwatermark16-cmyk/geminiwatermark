// 21-free-video policy restore.
// A previous bootstrap forced the browser trial counter to 21 on every load,
// which made the ₹99 plan appear before the first video. Restore a fresh
// 21-video allowance once per browser, then let main-fixed.js enforce payment
// only from video 22 onward.
const TRIAL_COUNT_KEY = 'gw_video_free_count_v2';
const LEGACY_TRIAL_KEY = 'gw_video_free_used_v1';
const TRIAL_RESTORE_KEY = 'gw_video_trial_21_restored_20260818_v1';

try {
  if (localStorage.getItem(TRIAL_RESTORE_KEY) !== '1') {
    localStorage.setItem(TRIAL_COUNT_KEY, '0');
    localStorage.removeItem(LEGACY_TRIAL_KEY);
    localStorage.setItem(TRIAL_RESTORE_KEY, '1');
  }
} catch {}

// Load the existing app/account/payment runtime first. Its native policy is:
// first 21 successfully processed videos free, video 22+ requires a plan.
await import('./runtime-loader.js?v=20260818-13');

// Keep the current pure-browser story cleaner.
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

function currentVideoAccess() {
  const badge = document.getElementById('videoBadge')?.textContent?.trim() || '';
  const quota = document.getElementById('quotaPrice')?.textContent?.trim() || '';
  const paid = badge === 'Unlocked' || quota === 'Active';
  const match = badge.match(/^(\d+)\s+Free$/i);
  const freeLeft = match ? Math.max(0, Number(match[1]) || 0) : 0;
  return { paid, freeLeft, trialAvailable: !paid && freeLeft > 0 };
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

function patchTrialAndRegionalCopy() {
  const price = planPrice.displayPrice;
  const { paid, freeLeft, trialAvailable } = currentVideoAccess();

  setHtml(document.querySelector('.hero .badge'), `<i></i> Images free · 21 videos free · then ${price}`);
  setText(
    document.querySelector('.hero .lead'),
    `Remove supported visible Gemini watermarks from images and Veo videos in your browser. Images are free. Your first 21 successfully processed videos are free, then video processing unlocks with the ${price} plan for 30 days.`
  );

  setHtml(document.querySelector('.metrics article:nth-child(3)'), '<b>21</b><span>Videos free</span>');
  setHtml(document.querySelector('.metrics article:nth-child(4)'), `<b>${price}</b><span>30-day video plan</span>`);

  setText(document.querySelector('#pricing h2'), 'Images free. 21 videos free.');
  setText(
    document.querySelector('#pricing .sectionLead'),
    `Process your first 21 videos free on this browser. Video 22 onward requires the ${price} plan, valid for 30 days from successful payment.`
  );

  const featured = document.querySelector('#pricing article.featured');
  if (featured) {
    setText(featured.querySelector(':scope > span'), 'VIDEO');
    const priceValue = featured.querySelector('.price b');
    if (priceValue) setText(priceValue, price);
    const priceEm = featured.querySelector('.price em');
    if (priceEm) setText(priceEm, 'for 30 days');

    const items = featured.querySelectorAll('li');
    if (items[0]) setText(items[0], 'First 21 videos free');
    if (items[1]) setText(items[1], '1080×1920 story/reel support');
    if (items[2]) setText(items[2], 'New Gemini diamond + old Veo mode');

    const buyBtn = document.getElementById('buyPlan');
    if (buyBtn) {
      // No ₹99 checkout link/CTA while free videos remain. It appears only
      // after all 21 free successful video processes have been consumed.
      buyBtn.style.display = (!paid && !trialAvailable) ? '' : 'none';
      setText(buyBtn, `Unlock video for ${price}`);
    }
  }

  const modal = document.getElementById('payModal');
  const modalCard = modal?.querySelector('.modalCard');
  if (modalCard) {
    setText(modalCard.querySelector('h2'), 'Unlock video');
    setText(modalCard.querySelector(':scope > p'), `Your 21 free videos are used. Continue with the ${price} video plan for 30 days.`);
    const payPriceValue = modalCard.querySelector('.payPrice b');
    if (payPriceValue) setText(payPriceValue, price);
    const priceText = modalCard.querySelector('.payPrice span');
    if (priceText) setText(priceText, '30 days · no auto-renewal');
    const payBtn = document.getElementById('payBtn');
    if (payBtn && !payBtn.disabled) setText(payBtn, `Pay ${price} with Cashfree`);
  }

  const accountUpgrade = document.getElementById('accountUpgrade');
  if (accountUpgrade) setText(accountUpgrade, `Buy / renew ${price} plan`);

  const videoMode = document.getElementById('videoTab')?.classList.contains('active');
  if (videoMode && trialAvailable) {
    setText(document.getElementById('dropMeta'), `${freeLeft} free video${freeLeft === 1 ? '' : 's'} remaining · then ${price}`);
  } else if (videoMode && !paid && !trialAvailable) {
    setText(document.getElementById('toolTitle'), 'Unlock more video processing');
    setText(document.getElementById('toolSub'), 'Your 21 free videos have been used');
    setText(document.getElementById('dropStrong'), `${price} plan required`);
    setText(document.getElementById('dropMeta'), '21 free videos used · upgrade to continue');
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
  patchTrialAndRegionalCopy();
  installRegionalCheckout();
}

patchTrialAndRegionalCopy();
installRegionalCheckout();
loadRegionalPlanPrice();

const videoBadge = document.getElementById('videoBadge');
if (videoBadge) {
  new MutationObserver(() => {
    patchTrialAndRegionalCopy();
    installRegionalCheckout();
  }).observe(videoBadge, { childList: true, subtree: true, characterData: true });
}

for (const id of ['videoTab', 'imageTab', 'chooseAnother', 'closeModal', 'accountBtn', 'footerAccountBtn']) {
  document.getElementById(id)?.addEventListener('click', () => setTimeout(() => {
    patchTrialAndRegionalCopy();
    installRegionalCheckout();
  }, 0));
}

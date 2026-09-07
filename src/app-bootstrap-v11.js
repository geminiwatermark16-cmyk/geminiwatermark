// Paid-video policy: image cleanup stays free, but all video processing requires
// an active paid plan before the first upload. Mark the browser trial as fully
// consumed before the core runtime evaluates its entitlement gate.
const TRIAL_COUNT_KEY = 'gw_video_free_count_v2';
const LEGACY_TRIAL_KEY = 'gw_video_free_used_v1';

try {
  localStorage.setItem(TRIAL_COUNT_KEY, '21');
  localStorage.setItem(LEGACY_TRIAL_KEY, '1');
} catch {}

// Load the existing app/account/payment runtime first. With the browser trial
// locked above, its native entitlement gate requires payment for every video.
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

// Ad traffic lands here primarily for video. Put Video first and make it the
// default selected tool. The paid gate remains enforced by the core runtime.
function promoteVideoForAdTraffic() {
  const tabs = document.querySelector('.tabs');
  const videoTab = document.getElementById('videoTab');
  const imageTab = document.getElementById('imageTab');
  if (!tabs || !videoTab || !imageTab) return;

  if (tabs.firstElementChild !== videoTab) tabs.insertBefore(videoTab, imageTab);
  videoTab.classList.add('gw-video-priority');

  // Use the app's own click handler so all mode state and payment gating stay
  // in sync.
  if (!videoTab.classList.contains('active')) videoTab.click();
}

const videoPriorityStyle = document.createElement('style');
videoPriorityStyle.textContent = `
  #videoTab.gw-video-priority{
    position:relative;
    font-weight:800;
  }
  #videoTab.gw-video-priority::after{
    display: none !important;
  }
  #videoTab.gw-video-priority.active{
    transform:translateY(-1px);
  }
`;
document.head.appendChild(videoPriorityStyle);
promoteVideoForAdTraffic();

const TOKEN_KEY = 'gw_video_plan_token_v1';
const UNLIMITED_ACCESS_EMAIL = 'hyydikshant@gmail.com';
const DEFAULT_PLAN_PRICE = {
  country: 'IN',
  region: 'india',
  amount: 0,
  currency: 'INR',
  displayPrice: 'Free',
  durationDays: 3650,
  requiresIndianPhone: false,
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
  return { paid: true };
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

function patchPaidAndRegionalCopy() {
  setHtml(document.querySelector('.hero .badge'), `<i></i> 100% FREE · Unlimited Videos & Images`);
  setText(
    document.querySelector('.hero .lead'),
    `Remove supported visible Gemini watermarks from images and Veo videos in your browser. 100% free with no limits, no login, and no subscription.`
  );

  setHtml(document.querySelector('.metrics article:nth-child(3)'), '<b>100%</b><span>Free for all</span>');
  setHtml(document.querySelector('.metrics article:nth-child(4)'), `<b>₹0</b><span>Free Forever</span>`);

  setText(document.querySelector('#pricing h2'), `100% Free Forever.`);
  setText(
    document.querySelector('#pricing .sectionLead'),
    `Both image and video processing are completely free with no payment, no subscriptions, and no credits. Clean unlimited images and videos directly in your browser.`
  );

  const buyBtn = document.getElementById('buyPlan');
  if (buyBtn) buyBtn.style.display = 'none';

  const videoBadge = document.getElementById('videoBadge');
  if (videoBadge) setText(videoBadge, 'Free');

  setText(document.getElementById('quotaTitle'), '100% Free Access');
  setText(document.getElementById('quotaText'), 'Free video & image cleanup');
  setText(document.getElementById('quotaPrice'), '₹0');
  setText(document.getElementById('dropStrong'), 'Drop video here');
  setText(document.getElementById('dropMeta'), '100% Free · local browser processing');

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

  const emailInput = document.getElementById('email');
  if (emailInput) {
    emailInput.oninput = () => {
      if (payBtn.disabled) return;
      const normalized = String(emailInput.value || '').trim().toLowerCase();
      payBtn.textContent = normalized === UNLIMITED_ACCESS_EMAIL
        ? 'Activate unlimited access'
        : `Pay ${planPrice.displayPrice} with Cashfree`;
    };
  }

  payBtn.onclick = async () => {
    const phone = String(document.getElementById('phone')?.value || '').replace(/\D/g, '').slice(-15);
    const email = String(document.getElementById('email')?.value || '').trim();
    const normalizedEmail = email.toLowerCase();
    const msg = document.getElementById('checkoutMsg');
    const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const unlimitedAccess = normalizedEmail === UNLIMITED_ACCESS_EMAIL;

    if (unlimitedAccess) {
      payBtn.disabled = true;
      payBtn.textContent = 'Activating unlimited access…';
      if (msg) msg.textContent = '';

      try {
        const access = await postJson('/api/unlimited-access', { email: normalizedEmail });
        if (!access.entitlementToken) throw new Error('Unlimited access token was not returned.');
        localStorage.setItem(TOKEN_KEY, access.entitlementToken);
        if (msg) msg.textContent = 'Unlimited video access activated for this email.';
        location.reload();
      } catch (error) {
        if (msg) msg.textContent = error?.message || 'Unlimited access could not be activated.';
        payBtn.disabled = false;
        payBtn.textContent = 'Activate unlimited access';
      }
      return;
    }

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
      if (msg) msg.textContent = `Payment verified. ${planPrice.displayPrice} video plan is ACTIVE for 30 days.`;

      // Keep the user on the video flow after successful payment. Reloading lets
      // the core runtime validate the signed entitlement token and set its own
      // paid state before processing starts.
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
  patchPaidAndRegionalCopy();
  installRegionalCheckout();
  promoteVideoForAdTraffic();
}

patchPaidAndRegionalCopy();
installRegionalCheckout();
promoteVideoForAdTraffic();
loadRegionalPlanPrice();

const videoBadge = document.getElementById('videoBadge');
if (videoBadge) {
  new MutationObserver(() => {
    patchPaidAndRegionalCopy();
    installRegionalCheckout();
  }).observe(videoBadge, { childList: true, subtree: true, characterData: true });
}

for (const id of ['videoTab', 'imageTab', 'chooseAnother', 'closeModal', 'accountBtn', 'footerAccountBtn']) {
  document.getElementById(id)?.addEventListener('click', () => setTimeout(() => {
    patchPaidAndRegionalCopy();
    installRegionalCheckout();
  }, 0));
}

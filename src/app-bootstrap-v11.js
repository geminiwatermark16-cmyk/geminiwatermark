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
    box-shadow:0 0 0 2px rgba(17,17,17,.12),0 10px 28px rgba(0,0,0,.12);
  }
  #videoTab.gw-video-priority::after{
    content:'MOST POPULAR';
    position:absolute;
    top:-9px;
    right:10px;
    padding:3px 7px;
    border-radius:999px;
    background:#111;
    color:#fff;
    font-size:9px;
    line-height:1;
    letter-spacing:.08em;
    font-weight:900;
  }
  #videoTab.gw-video-priority.active{
    transform:translateY(-1px);
  }
  @media (max-width:640px){
    #videoTab.gw-video-priority::after{right:7px;font-size:8px}
  }
`;
document.head.appendChild(videoPriorityStyle);
promoteVideoForAdTraffic();

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
  return { paid };
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
  const price = planPrice.displayPrice;
  const { paid } = currentVideoAccess();

  setHtml(document.querySelector('.hero .badge'), `<i></i> Images free · Video ${price} / 30 days`);
  setText(
    document.querySelector('.hero .lead'),
    `Remove supported visible Gemini watermarks from images and Veo videos in your browser. Image cleanup is free. Video processing is a paid feature and requires the ${price} plan, active for 30 days after successful payment.`
  );

  setHtml(document.querySelector('.metrics article:nth-child(3)'), '<b>PAID</b><span>Video processing</span>');
  setHtml(document.querySelector('.metrics article:nth-child(4)'), `<b>${price}</b><span>30-day video plan</span>`);

  setText(document.querySelector('#pricing h2'), `Images free. Video ${price} for 30 days.`);
  setText(
    document.querySelector('#pricing .sectionLead'),
    `Supported image cleanup stays free. Video upload and processing require the ${price} plan, valid for 30 days from successful payment with no automatic renewal.`
  );

  const featured = document.querySelector('#pricing article.featured');
  if (featured) {
    setText(featured.querySelector(':scope > span'), 'VIDEO PLAN');
    const priceValue = featured.querySelector('.price b');
    if (priceValue) setText(priceValue, price);
    const priceEm = featured.querySelector('.price em');
    if (priceEm) setText(priceEm, 'for 30 days');

    const items = featured.querySelectorAll('li');
    if (items[0]) setText(items[0], 'Paid video processing from the first video');
    if (items[1]) setText(items[1], '720p + 1080p portrait and landscape support');
    if (items[2]) setText(items[2], 'New Gemini diamond + old Veo mode');

    const buyBtn = document.getElementById('buyPlan');
    if (buyBtn) {
      buyBtn.style.display = paid ? 'none' : '';
      setText(buyBtn, `Unlock video for ${price}`);
    }
  }

  const modal = document.getElementById('payModal');
  const modalCard = modal?.querySelector('.modalCard');
  if (modalCard) {
    setText(modalCard.querySelector('h2'), 'Unlock video');
    setText(modalCard.querySelector(':scope > p'), `Video processing is paid. Continue with the ${price} video plan for 30 days.`);
    const payPriceValue = modalCard.querySelector('.payPrice b');
    if (payPriceValue) setText(payPriceValue, price);
    const priceText = modalCard.querySelector('.payPrice span');
    if (priceText) setText(priceText, '30 days · no auto-renewal');
    const payBtn = document.getElementById('payBtn');
    if (payBtn && !payBtn.disabled) setText(payBtn, `Pay ${price} with Cashfree`);
  }

  const accountUpgrade = document.getElementById('accountUpgrade');
  if (accountUpgrade) setText(accountUpgrade, `Buy / renew ${price} plan`);

  const videoBadge = document.getElementById('videoBadge');
  if (videoBadge && !paid) setText(videoBadge, price);

  const videoMode = document.getElementById('videoTab')?.classList.contains('active');
  if (videoMode && !paid) {
    setText(document.getElementById('quotaTitle'), `Video plan · ${price}`);
    setText(document.getElementById('quotaText'), 'Paid video processing · 30-day access');
    setText(document.getElementById('quotaPrice'), price);
    setText(document.getElementById('toolTitle'), 'Unlock video processing');
    setText(document.getElementById('toolSub'), `${price} gives supported video processing for 30 days`);
    setText(document.getElementById('dropStrong'), `Pay ${price} to process video`);
    setText(document.getElementById('dropMeta'), 'Video is a paid feature · payment required before upload');
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

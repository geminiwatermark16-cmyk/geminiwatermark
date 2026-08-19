const TRIAL_COUNT_KEY = 'gw_video_free_count_v2';
const LEGACY_TRIAL_KEY = 'gw_video_free_used_v1';
const TOKEN_KEY = 'gw_video_plan_token_v1';
const UNLIMITED_ACCESS_EMAIL = 'hyydikshant@gmail.com';

const DEFAULT_PLAN = {
  country: 'IN',
  region: 'india',
  amount: 99,
  currency: 'INR',
  displayPrice: '₹99',
  durationDays: 30,
  requiresIndianPhone: true,
  requiresEmail: false,
};
let funnelPlan = { ...DEFAULT_PLAN };

function analyticsItem(value) {
  return [{
    item_id: 'video_30d',
    item_name: 'Gemini/Veo video plan - 30 days',
    price: Number(value) || 0,
    quantity: 1,
  }];
}

function pushDataLayer(event, payload) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event, ...payload });
}

function fireMeta(name, params, eventId) {
  try {
    if (typeof window.fbq === 'function') {
      if (eventId) window.fbq('track', name, params, { eventID: eventId });
      else window.fbq('track', name, params);
    }
  } catch (error) {
    console.warn(`Meta ${name} event failed`, error);
  }
}

function markOnce(key) {
  try {
    if (localStorage.getItem(key) === '1') return false;
    localStorage.setItem(key, '1');
    return true;
  } catch {
    return true;
  }
}

function trackInitiateCheckout({ orderId, amount, currency }) {
  const value = Number(amount ?? funnelPlan.amount) || 0;
  const code = String(currency || funnelPlan.currency || 'INR').toUpperCase();
  const id = `gw_ic_${orderId || Date.now()}`;
  if (orderId && !markOnce(`gw_track_ic_${orderId}`)) return;

  fireMeta('InitiateCheckout', {
    value,
    currency: code,
    content_name: '30-day video plan',
    content_type: 'product',
    num_items: 1,
  }, id);
  pushDataLayer('initiate_checkout', {
    cashfree_order_id: orderId || '',
    ecommerce: { currency: code, value, items: analyticsItem(value) },
  });
}

window.__GW_TRACK_PURCHASE__ = ({ orderId, amount, currency } = {}) => {
  if (!orderId) return;
  if (!markOnce(`gw_track_purchase_${orderId}`)) return;

  const value = Number(amount ?? funnelPlan.amount) || 0;
  const code = String(currency || funnelPlan.currency || 'INR').toUpperCase();
  const eventId = `gw_purchase_${orderId}`;

  fireMeta('Purchase', {
    value,
    currency: code,
    content_name: '30-day video plan',
    content_type: 'product',
    num_items: 1,
  }, eventId);
  pushDataLayer('purchase', {
    ecommerce: {
      transaction_id: orderId,
      currency: code,
      value,
      items: analyticsItem(value),
    },
  });
};

// Video remains paid from the first processing attempt, but visitors can now
// select their file before checkout so they know the video was accepted.
try {
  localStorage.setItem(TRIAL_COUNT_KEY, '21');
  localStorage.setItem(LEGACY_TRIAL_KEY, '1');
} catch {}

// Patch the core runtime before the existing v11 bootstrap runs. v11 imports
// the exact same runtime URL, so the ESM cache prevents a duplicate boot.
await import('./runtime-funnel-patch-v1.js?v=20260820-1');
await import('./app-bootstrap-v11.js?v=20260819-1');

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

async function loadFunnelPlan() {
  try {
    const response = await fetch('/api/plan-price', { cache: 'no-store' });
    const data = await response.json();
    if (response.ok && data?.ok && data?.displayPrice) funnelPlan = { ...DEFAULT_PLAN, ...data };
  } catch {
    funnelPlan = { ...DEFAULT_PLAN };
  }
  patchUploadFirstCopy();
}

function selectedVideoReady() {
  try {
    return Boolean(window.__GW_HAS_SELECTED_VIDEO__?.());
  } catch {
    return false;
  }
}

function isPaid() {
  const badge = document.getElementById('videoBadge')?.textContent?.trim() || '';
  const quota = document.getElementById('quotaPrice')?.textContent?.trim() || '';
  return badge === 'Unlocked' || quota === 'Active';
}

function setText(selectorOrElement, text) {
  const element = typeof selectorOrElement === 'string'
    ? document.querySelector(selectorOrElement)
    : selectorOrElement;
  if (element && element.textContent !== text) element.textContent = text;
}

function patchUploadFirstCopy() {
  const price = funnelPlan.displayPrice || '₹99';
  const paid = isPaid();
  const videoMode = document.getElementById('videoTab')?.classList.contains('active');

  setText('.hero .lead', `Remove supported visible Gemini watermarks from images and Veo videos in your browser. Image cleanup is free. For video, select your file first and complete the ${price} 30-day plan only before processing.`);
  setText('#pricing .sectionLead', `Supported image cleanup stays free. For video, you can select and preview your file first; processing and download require the ${price} plan for 30 days, with no automatic renewal.`);

  const modalCard = document.querySelector('#payModal .modalCard');
  if (modalCard) {
    setText(modalCard.querySelector(':scope > p'), selectedVideoReady()
      ? `Your video is loaded and ready. Pay ${price} to process it and unlock video access for 30 days.`
      : `Video processing is paid. Continue with the ${price} video plan for 30 days.`);
    setText(modalCard.querySelector('.payPrice b'), price);
    setText(modalCard.querySelector('.payPrice span'), '30 days · no auto-renewal');
  }

  if (videoMode && !paid) {
    setText(document.getElementById('quotaTitle'), `Video plan · ${price}`);
    setText(document.getElementById('quotaText'), 'Select first · pay only before processing');
    setText(document.getElementById('quotaPrice'), price);
    setText(document.getElementById('toolTitle'), 'Upload your video first');
    setText(document.getElementById('toolSub'), 'We will read the video locally before checkout · MP4/WebM/MOV');
    setText(document.getElementById('dropStrong'), 'Drop video here');
    setText(document.getElementById('dropMeta'), `Select your video first · ${price} payment is required only before processing`);
  }
}

function validEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function waitForCashfree(timeoutMs = 5000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (typeof window.Cashfree === 'function') return window.Cashfree;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error('Cashfree checkout is still loading. Please tap Pay again in a moment.');
}

async function verifyWithRetry(orderId) {
  let last = null;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    last = await postJson('/api/verify-order', { orderId });
    if (last.paid && last.entitlementToken) return last;
    if (attempt < 4) await new Promise((resolve) => setTimeout(resolve, 900 + (attempt * 500)));
  }
  return last || { paid: false, status: 'UNKNOWN' };
}

async function completePaidUnlock(verification) {
  localStorage.setItem(TOKEN_KEY, verification.entitlementToken);
  window.__GW_TRACK_PURCHASE__?.({
    orderId: verification.orderId,
    amount: verification.amount,
    currency: verification.currency,
  });

  const msg = document.getElementById('checkoutMsg');
  if (msg) msg.textContent = `Payment verified. ${funnelPlan.displayPrice} video plan is ACTIVE for 30 days.`;

  if (typeof window.__GW_COMPLETE_PAID_UNLOCK__ === 'function') {
    Promise.resolve(window.__GW_COMPLETE_PAID_UNLOCK__()).catch((error) => {
      console.error('Could not continue selected video after payment', error);
      location.reload();
    });
  } else {
    location.reload();
  }
}

async function runCheckout(button) {
  if (button.disabled) return;

  const phone = String(document.getElementById('phone')?.value || '').replace(/\D/g, '').slice(-15);
  const email = String(document.getElementById('email')?.value || '').trim();
  const normalizedEmail = email.toLowerCase();
  const msg = document.getElementById('checkoutMsg');

  if (normalizedEmail === UNLIMITED_ACCESS_EMAIL) {
    button.disabled = true;
    button.textContent = 'Activating unlimited access…';
    if (msg) msg.textContent = '';
    try {
      const access = await postJson('/api/unlimited-access', { email: normalizedEmail });
      if (!access.entitlementToken) throw new Error('Unlimited access token was not returned.');
      localStorage.setItem(TOKEN_KEY, access.entitlementToken);
      if (msg) msg.textContent = 'Unlimited video access activated.';
      if (typeof window.__GW_COMPLETE_PAID_UNLOCK__ === 'function') {
        Promise.resolve(window.__GW_COMPLETE_PAID_UNLOCK__()).catch(() => location.reload());
      } else location.reload();
    } catch (error) {
      if (msg) msg.textContent = error?.message || 'Unlimited access could not be activated.';
      button.disabled = false;
      button.textContent = 'Activate unlimited access';
    }
    return;
  }

  if (funnelPlan.region === 'india' && !/^[6-9]\d{9}$/.test(phone)) {
    if (msg) msg.textContent = 'Enter a valid 10-digit Indian mobile number.';
    return;
  }
  if (funnelPlan.region === 'international' && !validEmail(email)) {
    if (msg) msg.textContent = 'Enter a valid email address for international checkout.';
    return;
  }
  if (email && !validEmail(email)) {
    if (msg) msg.textContent = 'Enter a valid email address.';
    return;
  }

  button.disabled = true;
  button.textContent = 'Opening Cashfree…';
  if (msg) msg.textContent = 'Preparing secure checkout…';

  try {
    const order = await postJson('/api/create-order', { phone, email });
    trackInitiateCheckout(order);

    const Cashfree = await waitForCashfree();
    const cashfree = Cashfree({ mode: order.mode });
    const result = await cashfree.checkout({
      paymentSessionId: order.paymentSessionId,
      redirectTarget: '_modal',
    });
    if (result?.error) throw new Error(result.error.message || 'Checkout did not complete.');

    if (msg) msg.textContent = 'Payment submitted. Verifying…';
    const verification = await verifyWithRetry(order.orderId);
    if (!verification.paid || !verification.entitlementToken) {
      throw new Error(`Payment is not verified yet${verification.status ? ` (${verification.status})` : ''}. If money was debited, wait a few seconds and try My Account.`);
    }

    await completePaidUnlock({
      ...verification,
      amount: verification.amount ?? order.amount,
      currency: verification.currency ?? order.currency,
      orderId: verification.orderId || order.orderId,
    });
  } catch (error) {
    if (msg) msg.textContent = error?.message || 'Checkout could not be completed.';
    button.disabled = false;
    button.textContent = `Pay ${funnelPlan.displayPrice} with Cashfree`;
  }
}

// Capture the Pay click before v11's older property handler so the improved
// verification + Purchase tracking path is always used, even if v11 repatches it.
document.addEventListener('click', (event) => {
  const button = event.target?.closest?.('#payBtn');
  if (!button) return;
  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();
  runCheckout(button);
}, true);

const videoBadge = document.getElementById('videoBadge');
if (videoBadge) {
  new MutationObserver(() => queueMicrotask(patchUploadFirstCopy))
    .observe(videoBadge, { childList: true, subtree: true, characterData: true });
}
for (const id of ['videoTab', 'imageTab', 'chooseAnother', 'buyPlan']) {
  document.getElementById(id)?.addEventListener('click', () => setTimeout(patchUploadFirstCopy, 0));
}
document.getElementById('fileInput')?.addEventListener('change', () => setTimeout(patchUploadFirstCopy, 0));

loadFunnelPlan();
for (const delay of [0, 250, 900, 2000]) setTimeout(patchUploadFirstCopy, delay);

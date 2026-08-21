// Load non-critical homepage features only after the core remover UI is ready.
// This keeps first interaction fast and prevents feature modules from competing
// with the main watermark-remover bootstrap during the initial page load.

// app-bootstrap-v12 currently has one legacy unlimited email hardcoded in its
// checkout handler. Intercept additional server-allowlisted emails at window
// capture level so they reach /api/unlimited-access before the normal Cashfree
// handler runs. The API remains the source of truth for authorization.
const TOKEN_KEY = 'gw_video_plan_token_v1';
const EXTRA_UNLIMITED_EMAILS = new Set([
  'meijinnn0@gmail.com',
]);

async function activateExtraUnlimitedAccess(button, email) {
  const msg = document.getElementById('checkoutMsg');
  button.disabled = true;
  button.textContent = 'Activating unlimited access…';
  if (msg) msg.textContent = '';

  try {
    const response = await fetch('/api/unlimited-access', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.ok === false || !data.entitlementToken) {
      throw new Error(data.error || 'Unlimited access could not be activated.');
    }

    localStorage.setItem(TOKEN_KEY, data.entitlementToken);
    if (msg) msg.textContent = 'Unlimited video access activated.';

    if (typeof window.__GW_COMPLETE_PAID_UNLOCK__ === 'function') {
      Promise.resolve(window.__GW_COMPLETE_PAID_UNLOCK__()).catch(() => location.reload());
    } else {
      location.reload();
    }
  } catch (error) {
    if (msg) msg.textContent = error?.message || 'Unlimited access could not be activated.';
    button.disabled = false;
    button.textContent = 'Activate unlimited access';
  }
}

window.addEventListener('click', (event) => {
  const button = event.target?.closest?.('#payBtn');
  if (!button) return;

  const email = String(document.getElementById('email')?.value || '').trim().toLowerCase();
  if (!EXTRA_UNLIMITED_EMAILS.has(email)) return;

  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();
  activateExtraUnlimitedAccess(button, email);
}, true);

const waitForCore = async (timeout = 10000) => {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    if (document.getElementById('imageTab') && document.getElementById('videoTab')) return true;
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  return false;
};

const coreReady = await waitForCore();

document.documentElement.classList.remove('gw-booting');
document.documentElement.classList.add('gw-ready');
const bootScreen = document.getElementById('gw-boot-screen');
if (bootScreen) setTimeout(() => bootScreen.remove(), 220);

if (coreReady) {
  // Yield one frame so the usable remover can paint before secondary features
  // parse/execute.
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
}

const modules = [
  './background-remover-v1.js?v=20260818-1',
  './video-upscale-v1.js?v=20260818-2',
  './video-upscale-mp4-v2.js?v=20260818-2',
  './video-enhance-gpu-v2.js?v=20260818-1',
  './video-paid-gate.js?v=20260819-1',
  './conversion-landing-v1.js?v=20260822-1',
  './trust-enhancements.js?v=20260818-2',
  './india-trust.js?v=20260819-3',
];

Promise.allSettled(modules.map((url) => import(url))).then((results) => {
  for (const result of results) {
    if (result.status === 'rejected') console.warn('Deferred feature failed to load', result.reason);
  }
});
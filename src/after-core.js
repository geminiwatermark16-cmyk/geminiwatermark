// Load non-critical homepage features only after the core remover UI is ready.
// This keeps first interaction fast and prevents feature modules from competing
// with the main watermark-remover bootstrap during the initial page load.
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
  './trust-enhancements.js?v=20260818-2',
  './india-trust.js?v=20260819-3',
];

Promise.allSettled(modules.map((url) => import(url))).then((results) => {
  for (const result of results) {
    if (result.status === 'rejected') console.warn('Deferred feature failed to load', result.reason);
  }
});

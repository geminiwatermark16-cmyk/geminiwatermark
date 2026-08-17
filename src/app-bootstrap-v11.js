// Paid-video policy: images stay free, but video access requires the ₹99 plan
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

  // runtime-loader calls this hook for supported 1080x1920 Gemini diamond clips.
  // The outer timeout guarantees the UI can never spin forever even if a
  // browser media event fails to arrive.
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

function patchPaidVideoCopy() {
  const videoBadge = document.getElementById('videoBadge');
  const quotaPrice = document.getElementById('quotaPrice');
  const isPaid = videoBadge?.textContent?.trim() === 'Unlocked' || quotaPrice?.textContent?.trim() === 'Active';
  const videoMode = document.getElementById('videoTab')?.classList.contains('active');

  const badge = document.querySelector('.hero .badge');
  if (badge) badge.innerHTML = '<i></i> Images free · Video requires ₹99 plan';

  const lead = document.querySelector('.hero .lead');
  if (lead) lead.textContent = 'Remove supported visible Gemini watermarks from images and Veo videos in your browser. Images are free. Video processing requires the ₹99 plan before your first video upload.';

  if (videoBadge && !isPaid) videoBadge.textContent = '₹99';

  const metric = document.querySelector('.metrics article:nth-child(3)');
  if (metric) metric.innerHTML = '<b>Paid</b><span>Video access</span>';

  const pricingHeading = document.querySelector('#pricing h2');
  if (pricingHeading) pricingHeading.textContent = 'Images free. Video starts at ₹99.';
  const pricingLead = document.querySelector('#pricing .sectionLead');
  if (pricingLead) pricingLead.textContent = 'Image cleanup stays free. A verified ₹99 plan is required before any video can be uploaded or processed.';
  const featuredFirstItem = document.querySelector('#pricing article.featured ul li:first-child');
  if (featuredFirstItem) featuredFirstItem.textContent = 'Payment required before first video upload';

  const faqDetails = [...document.querySelectorAll('#faq details')];
  const oldTrialFaq = faqDetails.find((detail) => detail.querySelector('summary')?.textContent?.includes('21 free'));
  if (oldTrialFaq) {
    oldTrialFaq.querySelector('summary').textContent = 'Do videos have a free trial?';
    const p = oldTrialFaq.querySelector('p');
    if (p) p.textContent = 'No. Video upload and processing require the ₹99 plan. Image cleanup remains free.';
  }

  const modal = document.getElementById('payModal');
  const modalText = modal?.querySelector('.modalCard > p');
  if (modalText) modalText.textContent = 'Video processing requires the ₹99 plan. Complete payment to unlock video upload and processing.';

  if (videoMode && !isPaid) {
    const quotaTitle = document.getElementById('quotaTitle');
    const quotaText = document.getElementById('quotaText');
    const toolTitle = document.getElementById('toolTitle');
    const toolSub = document.getElementById('toolSub');
    const dropStrong = document.getElementById('dropStrong');
    const dropMeta = document.getElementById('dropMeta');
    if (quotaTitle) quotaTitle.textContent = '₹99 video plan required';
    if (quotaText) quotaText.textContent = 'Pay once to unlock 30-day video access';
    if (quotaPrice) quotaPrice.textContent = '₹99';
    if (toolTitle) toolTitle.textContent = 'Unlock video processing';
    if (toolSub) toolSub.textContent = 'Payment is required before your first video upload';
    if (dropStrong) dropStrong.textContent = 'Unlock video for ₹99';
    if (dropMeta) dropMeta.textContent = 'Click to purchase the ₹99 plan before uploading video';
  }

  const accountContent = document.getElementById('accountContent');
  if (accountContent && accountContent.textContent.includes('video trial / ₹99 plan')) {
    accountContent.innerHTML = accountContent.innerHTML.replace('video trial / ₹99 plan', 'video requires ₹99 plan');
  }
}

patchPaidVideoCopy();
for (const id of ['videoTab', 'imageTab', 'chooseAnother', 'buyPlan', 'closeModal', 'payBtn', 'accountBtn', 'footerAccountBtn']) {
  document.getElementById(id)?.addEventListener('click', () => setTimeout(patchPaidVideoCopy, 0));
}

const copyObserver = new MutationObserver(() => {
  const videoMode = document.getElementById('videoTab')?.classList.contains('active');
  if (videoMode || !document.getElementById('accountModal')?.classList.contains('hidden')) {
    queueMicrotask(patchPaidVideoCopy);
  }
});
const observed = document.getElementById('app');
if (observed) copyObserver.observe(observed, { subtree: true, childList: true, characterData: true });

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

function setText(element, text) {
  if (element && element.textContent !== text) element.textContent = text;
}

function setHtml(element, html) {
  if (element && element.innerHTML !== html) element.innerHTML = html;
}

function patchPaidVideoCopy() {
  const videoBadge = document.getElementById('videoBadge');
  const quotaPrice = document.getElementById('quotaPrice');
  const isPaid = videoBadge?.textContent?.trim() === 'Unlocked' || quotaPrice?.textContent?.trim() === 'Active';
  const videoMode = document.getElementById('videoTab')?.classList.contains('active');

  setHtml(document.querySelector('.hero .badge'), '<i></i> Images free · Video requires ₹99 plan');
  setText(document.querySelector('.hero .lead'), 'Remove supported visible Gemini watermarks from images and Veo videos in your browser. Images are free. Video processing requires the ₹99 plan before your first video upload.');

  if (videoBadge && !isPaid) setText(videoBadge, '₹99');

  setHtml(document.querySelector('.metrics article:nth-child(3)'), '<b>Paid</b><span>Video access</span>');
  setText(document.querySelector('#pricing h2'), 'Images free. Video starts at ₹99.');
  setText(document.querySelector('#pricing .sectionLead'), 'Image cleanup stays free. A verified ₹99 plan is required before any video can be uploaded or processed.');
  setText(document.querySelector('#pricing article.featured ul li:first-child'), 'Payment required before first video upload');

  const faqDetails = [...document.querySelectorAll('#faq details')];
  const oldTrialFaq = faqDetails.find((detail) => detail.querySelector('summary')?.textContent?.includes('21 free'));
  if (oldTrialFaq) {
    setText(oldTrialFaq.querySelector('summary'), 'Do videos have a free trial?');
    setText(oldTrialFaq.querySelector('p'), 'No. Video upload and processing require the ₹99 plan. Image cleanup remains free.');
  }

  const modalText = document.getElementById('payModal')?.querySelector('.modalCard > p');
  setText(modalText, 'Video processing requires the ₹99 plan. Complete payment to unlock video upload and processing.');

  if (videoMode && !isPaid) {
    setText(document.getElementById('quotaTitle'), '₹99 video plan required');
    setText(document.getElementById('quotaText'), 'Pay once to unlock 30-day video access');
    setText(quotaPrice, '₹99');
    setText(document.getElementById('toolTitle'), 'Unlock video processing');
    setText(document.getElementById('toolSub'), 'Payment is required before your first video upload');
    setText(document.getElementById('dropStrong'), 'Unlock video for ₹99');
    setText(document.getElementById('dropMeta'), 'Click to purchase the ₹99 plan before uploading video');
  }
}

patchPaidVideoCopy();
for (const id of ['videoTab', 'imageTab', 'chooseAnother', 'buyPlan', 'closeModal', 'payBtn']) {
  document.getElementById(id)?.addEventListener('click', () => setTimeout(patchPaidVideoCopy, 0));
}

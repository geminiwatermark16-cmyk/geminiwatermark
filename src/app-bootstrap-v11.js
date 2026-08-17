// v12: wait for the complete OpenCV wasm runtime before using cv.inpaint,
// with a local JavaScript fallback if OpenCV cannot initialize.
await import('./video-deep-clean.js?v=20260818-12');

// Keep the existing account, pricing and Cashfree runtime intact.
await import('./runtime-loader.js?v=20260818-10');

// runtime-loader v10 calls this compatibility hook for 1080x1920 diamond clips.
if (typeof window.__GW_TELEA_CLEAN_STORY_VIDEO__ === 'function') {
  window.__GW_EXACT_CLEAN_STORY_VIDEO__ = window.__GW_TELEA_CLEAN_STORY_VIDEO__;
  if (!window.__GW_ACTIVE_VIDEO_CLEANER__) window.__GW_ACTIVE_VIDEO_CLEANER__ = 'telea-v12-ready';
}

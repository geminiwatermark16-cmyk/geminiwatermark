// Load the tested content-aware Gemini story cleaner with a fresh cache key.
await import('./video-deep-clean.js?v=20260818-11');

// Keep the current app/account/payment runtime intact.
await import('./runtime-loader.js?v=20260818-10');

// runtime-loader v10 still calls the legacy exact-clean hook. Force that hook
// to the tested Telea cleaner after all v10 modules have finished loading.
if (typeof window.__GW_TELEA_CLEAN_STORY_VIDEO__ === 'function') {
  window.__GW_EXACT_CLEAN_STORY_VIDEO__ = window.__GW_TELEA_CLEAN_STORY_VIDEO__;
  window.__GW_ACTIVE_VIDEO_CLEANER__ = 'telea-v11';
}

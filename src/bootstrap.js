// Load the current Gemini/Veo watermark-position compatibility patch before
// the application imports the browser engine. This guarantees the shared ESM
// module catalog is corrected before video processing starts.
await import('./video-position-patch.js?v=20260818-1');
await import('./main-fixed.js?v=20260818-1');

await import('./video-position-patch.js?v=20260818-7');
await import('./video-deep-clean.js?v=20260818-7');

const mainUrl = new URL('./main-fixed.js?v=20260818-7', import.meta.url);
const response = await fetch(mainUrl, { cache: 'no-store' });
if (!response.ok) throw new Error(`Could not load the watermark remover application (${response.status}).`);
let source = await response.text();

const processNeedle = "const blob = await engine.processVideoFile(state.file, options);";
const processReplacement = `let blob = await engine.processVideoFile(state.file, options);
  if (profile === 'diamond' && state.videoSize?.width === 1080 && state.videoSize?.height === 1920 && typeof window.__GW_DEEP_CLEAN_VIDEO__ === 'function') {
    $('processingTitle').textContent = 'Finishing tested cleanup…';
    $('processingSub').textContent = 'Exact 9:16 diamond mask · local processing';
    blob = await window.__GW_DEEP_CLEAN_VIDEO__(blob, {
      onProgress: (progress) => {
        const pct = Math.max(3, Math.min(100, Number(progress || 0) * 100));
        $('progressBar').style.width = pct + '%';
      }
    });
  }`;

if (!source.includes(processNeedle)) throw new Error('Video cleanup hook could not be installed.');
source = source.replace(processNeedle, processReplacement);

const downloadNeedle = "a.download = state.mode === 'image' ? 'geminiwatermark-clean.png' : 'geminiwatermark-clean.mp4';";
const downloadReplacement = "a.download = state.mode === 'image' ? 'geminiwatermark-clean.png' : (state.result?.type?.includes('webm') ? 'geminiwatermark-clean.webm' : 'geminiwatermark-clean.mp4');";
source = source.replace(downloadNeedle, downloadReplacement);

const appBlob = new Blob([source], { type: 'text/javascript' });
const appUrl = URL.createObjectURL(appBlob);
try {
  await import(appUrl);
} finally {
  URL.revokeObjectURL(appUrl);
}

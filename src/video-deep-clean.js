const ENGINE_URLS = [
  'https://esm.sh/@pictx/gemini-veo-watermark-remover@0.2.4/browser?bundle',
  'https://esm.run/@pictx/gemini-veo-watermark-remover@0.2.4/browser'
];

const STORY_WATERMARK = { x: 856, y: 1696, width: 96, height: 96 };
const ALPHA_MAP_KEY = 'veo-diamond-1080p-portrait';

function waitFor(target, event) {
  return new Promise((resolve, reject) => {
    const onEvent = () => { cleanup(); resolve(); };
    const onError = () => { cleanup(); reject(new Error('Video could not be decoded for exact cleanup.')); };
    const cleanup = () => {
      target.removeEventListener(event, onEvent);
      target.removeEventListener('error', onError);
    };
    target.addEventListener(event, onEvent, { once: true });
    target.addEventListener('error', onError, { once: true });
  });
}

function recorderMime() {
  const candidates = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm'
  ];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) || '';
}

let toolsPromise;
async function loadReverseAlphaTools() {
  if (toolsPromise) return toolsPromise;
  toolsPromise = (async () => {
    let lastError;
    for (const url of ENGINE_URLS) {
      try {
        const engine = await import(url);
        if (typeof engine.removeWatermark !== 'function' || typeof engine.getEmbeddedAlphaMap !== 'function') continue;
        const alphaMap = engine.getEmbeddedAlphaMap(ALPHA_MAP_KEY);
        if (!alphaMap || alphaMap.width !== 96 || alphaMap.height !== 96 || !alphaMap.data) {
          throw new Error('The calibrated 96×96 Gemini diamond alpha map is unavailable.');
        }
        return { removeWatermark: engine.removeWatermark, alphaMap };
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError || new Error('Exact reverse-alpha engine could not load.');
  })();
  return toolsPromise;
}

function cleanCurrentFrame(ctx, tools) {
  const { x, y, width, height } = STORY_WATERMARK;
  const region = ctx.getImageData(x, y, width, height);
  tools.removeWatermark(region, tools.alphaMap.data, { x: 0, y: 0, width, height });
  ctx.putImageData(region, x, y);
}

/**
 * Exact 1080×1920 Gemini story cleaner.
 *
 * This intentionally does NOT blur or inpaint. It applies the SDK's calibrated
 * 96×96 Gemini diamond alpha map directly at the position measured from the
 * user's actual current story sample (x=856, y=1696). Only alpha-map pixels are
 * changed, so there is no rectangular/square patch painted over the frame.
 */
export async function exactCleanStoryVideo(inputBlob, options = {}) {
  if (!(inputBlob instanceof Blob) || inputBlob.size === 0) return inputBlob;
  if (!('MediaRecorder' in window)) throw new Error('This browser cannot encode the cleaned video. Use current Chrome or Edge.');

  const tools = await loadReverseAlphaTools();
  const url = URL.createObjectURL(inputBlob);
  const video = document.createElement('video');
  video.src = url;
  video.preload = 'auto';
  video.playsInline = true;
  video.volume = 0;
  video.style.position = 'fixed';
  video.style.left = '-99999px';
  video.style.width = '1px';
  video.style.height = '1px';
  document.body.appendChild(video);

  try {
    await waitFor(video, 'loadedmetadata');
    const width = video.videoWidth;
    const height = video.videoHeight;
    if (width !== 1080 || height !== 1920) {
      throw new Error(`Exact story profile expects 1080×1920, received ${width}×${height}.`);
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { alpha: false, willReadFrequently: true });
    if (!ctx) throw new Error('Canvas processing is unavailable in this browser.');

    const fps = 30;
    const canvasStream = canvas.captureStream(fps);
    const capture = typeof video.captureStream === 'function'
      ? video.captureStream()
      : (typeof video.mozCaptureStream === 'function' ? video.mozCaptureStream() : null);

    const tracks = [...canvasStream.getVideoTracks()];
    if (capture) tracks.push(...capture.getAudioTracks());
    const outputStream = new MediaStream(tracks);
    const mimeType = recorderMime();
    const recorder = new MediaRecorder(outputStream, {
      ...(mimeType ? { mimeType } : {}),
      videoBitsPerSecond: 12_500_000,
      audioBitsPerSecond: 192_000,
    });

    const chunks = [];
    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size) chunks.push(event.data);
    };

    let stopResolve;
    const stopped = new Promise((resolve) => { stopResolve = resolve; });
    recorder.onstop = () => stopResolve();
    let cancelled = false;

    const render = () => {
      if (cancelled) return;
      ctx.drawImage(video, 0, 0, width, height);
      cleanCurrentFrame(ctx, tools);

      if (Number.isFinite(video.duration) && video.duration > 0 && typeof options.onProgress === 'function') {
        options.onProgress(Math.min(1, video.currentTime / video.duration));
      }

      if (!video.ended && !video.paused) {
        if (typeof video.requestVideoFrameCallback === 'function') video.requestVideoFrameCallback(render);
        else requestAnimationFrame(render);
      }
    };

    recorder.start(250);
    await video.play();
    if (typeof video.requestVideoFrameCallback === 'function') video.requestVideoFrameCallback(render);
    else requestAnimationFrame(render);

    await waitFor(video, 'ended');
    cancelled = true;
    if (recorder.state !== 'inactive') recorder.stop();
    await stopped;

    const type = recorder.mimeType || mimeType || 'video/webm';
    const output = new Blob(chunks, { type: type.split(';')[0] });
    if (!output.size) throw new Error('Exact video cleanup produced an empty output.');
    return output;
  } finally {
    video.pause();
    video.removeAttribute('src');
    video.load();
    video.remove();
    URL.revokeObjectURL(url);
  }
}

window.__GW_EXACT_CLEAN_STORY_VIDEO__ = exactCleanStoryVideo;

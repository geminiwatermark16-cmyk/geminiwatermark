const OPENCV_URL = 'https://docs.opencv.org/4.13.0/opencv.js';

// Calibrated from the user's 1080x1920 Gemini story samples.
// The visible 4-point Gemini mark is centered at (904, 1744).
const STORY_ROI = { x: 836, y: 1676, width: 136, height: 136 };
const MASK_CENTER = { x: 68, y: 68 };
const STAR_OUTER_RADIUS = 58;
const STAR_INNER_RADIUS = 23;
const INPAINT_RADIUS = 5;

function waitFor(target, event) {
  return new Promise((resolve, reject) => {
    const onEvent = () => { cleanup(); resolve(); };
    const onError = () => { cleanup(); reject(new Error('Video could not be decoded for cleanup.')); };
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
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm'
  ];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) || '';
}

let cvPromise;
function loadOpenCv() {
  if (cvPromise) return cvPromise;

  cvPromise = new Promise((resolve, reject) => {
    const finish = async () => {
      try {
        let cv = window.cv;
        if (cv instanceof Promise) cv = await cv;
        if (!cv || typeof cv.inpaint !== 'function' || typeof cv.matFromImageData !== 'function') {
          throw new Error('OpenCV inpainting is unavailable in this browser.');
        }
        resolve(cv);
      } catch (error) {
        reject(error);
      }
    };

    if (window.cv) {
      finish();
      return;
    }

    const existing = document.querySelector('script[data-gw-opencv="1"]');
    if (existing) {
      existing.addEventListener('load', finish, { once: true });
      existing.addEventListener('error', () => reject(new Error('OpenCV.js could not load.')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = OPENCV_URL;
    script.async = true;
    script.dataset.gwOpencv = '1';
    script.onload = finish;
    script.onerror = () => reject(new Error('OpenCV.js could not load.'));
    document.head.appendChild(script);
  });

  return cvPromise;
}

function createStarMask(cv) {
  const { width, height } = STORY_ROI;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { alpha: true });
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = '#fff';
  ctx.beginPath();

  for (let i = 0; i < 8; i++) {
    const angle = -Math.PI / 2 + i * Math.PI / 4;
    const radius = i % 2 === 0 ? STAR_OUTER_RADIUS : STAR_INNER_RADIUS;
    const x = MASK_CENTER.x + radius * Math.cos(angle);
    const y = MASK_CENTER.y + radius * Math.sin(angle);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();

  const pixels = ctx.getImageData(0, 0, width, height).data;
  const mono = new Uint8Array(width * height);
  for (let i = 0; i < mono.length; i++) mono[i] = pixels[i * 4 + 3] ? 255 : 0;

  const rawMask = cv.matFromArray(height, width, cv.CV_8UC1, mono);
  const dilated = new cv.Mat();
  const kernel = cv.Mat.ones(5, 5, cv.CV_8U);
  cv.dilate(rawMask, dilated, kernel);
  rawMask.delete();
  kernel.delete();
  return dilated;
}

function inpaintStoryFrame(ctx, cv, mask) {
  const { x, y, width, height } = STORY_ROI;
  const imageData = ctx.getImageData(x, y, width, height);
  const rgba = cv.matFromImageData(imageData);
  const rgb = new cv.Mat();
  const cleaned = new cv.Mat();
  const cleanedRgba = new cv.Mat();

  try {
    cv.cvtColor(rgba, rgb, cv.COLOR_RGBA2RGB);
    cv.inpaint(rgb, mask, cleaned, INPAINT_RADIUS, cv.INPAINT_TELEA);
    cv.cvtColor(cleaned, cleanedRgba, cv.COLOR_RGB2RGBA);
    const output = new ImageData(new Uint8ClampedArray(cleanedRgba.data), width, height);
    ctx.putImageData(output, x, y);
  } finally {
    rgba.delete();
    rgb.delete();
    cleaned.delete();
    cleanedRgba.delete();
  }
}

/**
 * 1080x1920 Gemini story cleaner using Telea content-aware inpainting.
 * This is the same mask/radius that was visually verified on the user's sample
 * at 0.5s, 2s, 4s, 6s, 8s and 9.5s. It does not use reverse-alpha, blur boxes,
 * or rectangular replacement patches.
 */
export async function teleaCleanStoryVideo(inputBlob, options = {}) {
  if (!(inputBlob instanceof Blob) || inputBlob.size === 0) return inputBlob;
  if (!('MediaRecorder' in window)) {
    throw new Error('Video cleanup requires current Chrome or Edge.');
  }

  const cv = await loadOpenCv();
  const mask = createStarMask(cv);
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
    if (video.videoWidth !== 1080 || video.videoHeight !== 1920) {
      throw new Error(`Story cleaner expects 1080×1920, received ${video.videoWidth}×${video.videoHeight}.`);
    }

    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext('2d', { alpha: false, willReadFrequently: true });
    if (!ctx) throw new Error('Canvas video processing is unavailable.');

    const fps = 24;
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

    let stoppedResolve;
    const stopped = new Promise((resolve) => { stoppedResolve = resolve; });
    recorder.onstop = stoppedResolve;
    let cancelled = false;

    const render = () => {
      if (cancelled) return;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      inpaintStoryFrame(ctx, cv, mask);

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
    if (!output.size) throw new Error('Video cleanup produced an empty output.');
    return output;
  } finally {
    mask.delete();
    video.pause();
    video.removeAttribute('src');
    video.load();
    video.remove();
    URL.revokeObjectURL(url);
  }
}

window.__GW_TELEA_CLEAN_STORY_VIDEO__ = teleaCleanStoryVideo;

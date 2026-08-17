const OPENCV_URL = 'https://docs.opencv.org/4.13.0/opencv.js';

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

async function unwrapCv() {
  let cv = window.cv;
  if (cv instanceof Promise) cv = await cv;
  return cv || null;
}

function isInpaintReady(cv) {
  return Boolean(cv && typeof cv.inpaint === 'function' && typeof cv.matFromImageData === 'function' && typeof cv.Mat === 'function');
}

let cvPromise;
function loadOpenCv() {
  if (cvPromise) return cvPromise;

  cvPromise = new Promise((resolve, reject) => {
    let settled = false;
    let pollTimer = 0;
    let timeoutTimer = 0;

    const cleanup = () => {
      if (pollTimer) clearInterval(pollTimer);
      if (timeoutTimer) clearTimeout(timeoutTimer);
    };

    const resolveWhenReady = async () => {
      if (settled) return;
      try {
        const cv = await unwrapCv();
        if (isInpaintReady(cv)) {
          settled = true;
          cleanup();
          window.cv = cv;
          resolve(cv);
        }
      } catch {
        // Runtime can still be initializing; polling continues.
      }
    };

    const fail = (message) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error(message));
    };

    // Register runtime initialization before loading opencv.js. Script onload
    // can occur before the wasm runtime has installed cv.inpaint.
    const previousModule = window.Module && typeof window.Module === 'object' ? window.Module : {};
    const previousRuntimeCallback = previousModule.onRuntimeInitialized;
    window.Module = {
      ...previousModule,
      onRuntimeInitialized() {
        try { previousRuntimeCallback?.(); } catch (error) { console.warn(error); }
        resolveWhenReady();
      }
    };

    const existing = document.querySelector('script[data-gw-opencv="1"]');
    if (!existing) {
      const script = document.createElement('script');
      script.src = OPENCV_URL;
      script.async = true;
      script.dataset.gwOpencv = '1';
      script.onload = resolveWhenReady;
      script.onerror = () => fail('OpenCV.js could not load.');
      document.head.appendChild(script);
    } else {
      existing.addEventListener('load', resolveWhenReady, { once: true });
    }

    pollTimer = setInterval(resolveWhenReady, 120);
    timeoutTimer = setTimeout(() => fail('OpenCV runtime did not become ready.'), 20000);
    resolveWhenReady();
  });

  return cvPromise;
}

function starPolygon(outerRadius, innerRadius) {
  const points = [];
  for (let i = 0; i < 8; i++) {
    const angle = -Math.PI / 2 + i * Math.PI / 4;
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    points.push([
      MASK_CENTER.x + radius * Math.cos(angle),
      MASK_CENTER.y + radius * Math.sin(angle),
    ]);
  }
  return points;
}

function createBinaryStarMask() {
  const { width, height } = STORY_ROI;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { alpha: true, willReadFrequently: true });
  if (!ctx) throw new Error('Canvas mask generation is unavailable.');

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  const points = starPolygon(STAR_OUTER_RADIUS, STAR_INNER_RADIUS);
  points.forEach(([x, y], index) => index ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
  ctx.closePath();
  ctx.fill();

  const rgba = ctx.getImageData(0, 0, width, height).data;
  const raw = new Uint8Array(width * height);
  for (let i = 0; i < raw.length; i++) raw[i] = rgba[i * 4 + 3] ? 1 : 0;

  const dilated = new Uint8Array(raw);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!raw[y * width + x]) continue;
      for (let dy = -2; dy <= 2; dy++) {
        const yy = y + dy;
        if (yy < 0 || yy >= height) continue;
        for (let dx = -2; dx <= 2; dx++) {
          const xx = x + dx;
          if (xx < 0 || xx >= width) continue;
          dilated[yy * width + xx] = 1;
        }
      }
    }
  }
  return dilated;
}

const STAR_MASK = createBinaryStarMask();

function createCvMask(cv) {
  const { width, height } = STORY_ROI;
  const bytes = new Uint8Array(STAR_MASK.length);
  for (let i = 0; i < bytes.length; i++) bytes[i] = STAR_MASK[i] ? 255 : 0;
  return cv.matFromArray(height, width, cv.CV_8UC1, bytes);
}

let purePlan;
function getPurePlan() {
  if (purePlan) return purePlan;
  const { width, height } = STORY_ROI;
  const size = width * height;
  const INF = 1e9;
  const distance = new Float32Array(size);
  for (let i = 0; i < size; i++) if (STAR_MASK[i]) distance[i] = INF;
  const queue = new Int32Array(size);
  let head = 0;
  let tail = 0;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = y * width + x;
      if (!STAR_MASK[i]) continue;
      if (!STAR_MASK[i - 1] || !STAR_MASK[i + 1] || !STAR_MASK[i - width] || !STAR_MASK[i + width]) {
        distance[i] = 1;
        queue[tail++] = i;
      }
    }
  }

  while (head < tail) {
    const i = queue[head++];
    const nextDistance = distance[i] + 1;
    for (const n of [i - width, i - 1, i + width, i + 1]) {
      if (n < 0 || n >= size || !STAR_MASK[n] || distance[n] <= nextDistance) continue;
      distance[n] = nextDistance;
      queue[tail++] = n;
    }
  }

  const order = [];
  for (let i = 0; i < size; i++) if (STAR_MASK[i]) order.push(i);
  order.sort((a, b) => distance[a] - distance[b]);

  const radius = INPAINT_RADIUS;
  const entries = order.map((i) => {
    const x = i % width;
    const y = Math.floor(i / width);
    const gx = ((x + 1 < width ? distance[i + 1] : distance[i]) - (x > 0 ? distance[i - 1] : distance[i])) * 0.5;
    const gy = ((y + 1 < height ? distance[i + width] : distance[i]) - (y > 0 ? distance[i - width] : distance[i])) * 0.5;
    const neighbors = [];
    let total = 0;

    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        if (!dx && !dy) continue;
        const d2 = dx * dx + dy * dy;
        if (d2 > radius * radius) continue;
        const xx = x + dx;
        const yy = y + dy;
        if (xx < 1 || yy < 1 || xx >= width - 1 || yy >= height - 1) continue;
        const n = yy * width + xx;
        if (STAR_MASK[n] && distance[n] >= distance[i]) continue;

        const geometric = 1 / (d2 * Math.sqrt(d2));
        const level = 1 / (1 + Math.abs((STAR_MASK[n] ? distance[n] : 0) - distance[i]));
        const direction = Math.abs((-dx) * gx + (-dy) * gy) + 0.05;
        const weight = geometric * level * direction;
        neighbors.push([n, weight]);
        total += weight;
      }
    }

    if (total > 0) for (const item of neighbors) item[1] /= total;
    return { index: i, neighbors };
  });

  purePlan = { entries, width, height };
  return purePlan;
}

function pureJsInpaint(imageData) {
  const plan = getPurePlan();
  const result = new Uint8ClampedArray(imageData.data);
  const source = imageData.data;
  const channels = [new Float32Array(plan.width * plan.height), new Float32Array(plan.width * plan.height), new Float32Array(plan.width * plan.height)];

  for (let i = 0; i < plan.width * plan.height; i++) {
    channels[0][i] = source[i * 4];
    channels[1][i] = source[i * 4 + 1];
    channels[2][i] = source[i * 4 + 2];
  }

  for (const { index, neighbors } of plan.entries) {
    if (!neighbors.length) continue;
    for (let c = 0; c < 3; c++) {
      let value = 0;
      for (const [neighbor, weight] of neighbors) value += channels[c][neighbor] * weight;
      channels[c][index] = value;
    }
  }

  for (let i = 0; i < STAR_MASK.length; i++) {
    if (!STAR_MASK[i]) continue;
    result[i * 4] = Math.max(0, Math.min(255, Math.round(channels[0][i])));
    result[i * 4 + 1] = Math.max(0, Math.min(255, Math.round(channels[1][i])));
    result[i * 4 + 2] = Math.max(0, Math.min(255, Math.round(channels[2][i])));
    result[i * 4 + 3] = 255;
  }

  return new ImageData(result, plan.width, plan.height);
}

function opencvInpaint(ctx, cv, cvMask) {
  const { x, y, width, height } = STORY_ROI;
  const imageData = ctx.getImageData(x, y, width, height);
  const rgba = cv.matFromImageData(imageData);
  const rgb = new cv.Mat();
  const cleaned = new cv.Mat();
  const cleanedRgba = new cv.Mat();

  try {
    cv.cvtColor(rgba, rgb, cv.COLOR_RGBA2RGB);
    cv.inpaint(rgb, cvMask, cleaned, INPAINT_RADIUS, cv.INPAINT_TELEA);
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

function fallbackInpaint(ctx) {
  const { x, y, width, height } = STORY_ROI;
  const imageData = ctx.getImageData(x, y, width, height);
  ctx.putImageData(pureJsInpaint(imageData), x, y);
}

export async function teleaCleanStoryVideo(inputBlob, options = {}) {
  if (!(inputBlob instanceof Blob) || inputBlob.size === 0) return inputBlob;
  if (!('MediaRecorder' in window)) throw new Error('Video cleanup requires current Chrome or Edge.');

  let cv = null;
  let cvMask = null;
  try {
    cv = await loadOpenCv();
    cvMask = createCvMask(cv);
    window.__GW_ACTIVE_VIDEO_CLEANER__ = 'opencv-telea-v12';
  } catch (error) {
    console.warn('OpenCV Telea unavailable; using local JavaScript fallback.', error);
    window.__GW_ACTIVE_VIDEO_CLEANER__ = 'pure-js-inpaint-v12';
  }

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
    recorder.onstop = () => stoppedResolve();
    let cancelled = false;

    const cleanFrame = () => {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      if (cv && cvMask) opencvInpaint(ctx, cv, cvMask);
      else fallbackInpaint(ctx);
    };

    const render = () => {
      if (cancelled) return;
      cleanFrame();
      if (Number.isFinite(video.duration) && video.duration > 0 && typeof options.onProgress === 'function') {
        options.onProgress(Math.min(1, video.currentTime / video.duration));
      }
      if (!video.ended && !video.paused) {
        if (typeof video.requestVideoFrameCallback === 'function') video.requestVideoFrameCallback(render);
        else requestAnimationFrame(render);
      }
    };

    cleanFrame();
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
    try { cvMask?.delete?.(); } catch {}
    video.pause();
    video.removeAttribute('src');
    video.load();
    video.remove();
    URL.revokeObjectURL(url);
  }
}

window.__GW_TELEA_CLEAN_STORY_VIDEO__ = teleaCleanStoryVideo;
window.__GW_EXACT_CLEAN_STORY_VIDEO__ = teleaCleanStoryVideo;

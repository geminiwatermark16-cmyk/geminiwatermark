const BASE = { width: 1920, height: 1080, x: 1676, y: 836, roi: 136, outer: 58, inner: 23 };
const FPS = 24;
const TEMPORAL_MAX_DIFF = 26;
const TEMPORAL_BLEND = 0.10;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function waitForEvent(target, event, timeoutMs, message) {
  return new Promise((resolve, reject) => {
    let timer = 0;
    const cleanup = () => {
      target.removeEventListener(event, done);
      target.removeEventListener('error', fail);
      if (timer) clearTimeout(timer);
    };
    const done = () => { cleanup(); resolve(); };
    const fail = () => { cleanup(); reject(new Error(message || 'Video could not be decoded.')); };
    target.addEventListener(event, done, { once: true });
    target.addEventListener('error', fail, { once: true });
    timer = setTimeout(() => { cleanup(); reject(new Error(message || 'Video operation timed out.')); }, timeoutMs);
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

function supportedLandscape(width, height) {
  return (width === 1280 && height === 720) || (width === 1920 && height === 1080);
}

function makeConfig(frameWidth, frameHeight) {
  if (!supportedLandscape(frameWidth, frameHeight)) {
    throw new Error(`Gemini landscape cleaner supports 1280×720 or 1920×1080. Received ${frameWidth}×${frameHeight}.`);
  }

  const sx = frameWidth / BASE.width;
  const sy = frameHeight / BASE.height;
  const scale = (sx + sy) / 2;
  const width = Math.max(40, Math.round(BASE.roi * sx));
  const height = Math.max(40, Math.round(BASE.roi * sy));
  const x = clamp(Math.round(BASE.x * sx), 0, frameWidth - width);
  const y = clamp(Math.round(BASE.y * sy), 0, frameHeight - height);
  return {
    frameWidth,
    frameHeight,
    roi: { x, y, width, height },
    center: { x: width / 2, y: height / 2 },
    outer: Math.max(14, BASE.outer * scale),
    inner: Math.max(6, BASE.inner * scale),
    dilation: Math.max(1, Math.round(2 * scale)),
  };
}

function starPoints(config) {
  const points = [];
  for (let i = 0; i < 8; i++) {
    const angle = -Math.PI / 2 + i * Math.PI / 4;
    const radius = i % 2 === 0 ? config.outer : config.inner;
    points.push([
      config.center.x + radius * Math.cos(angle),
      config.center.y + radius * Math.sin(angle),
    ]);
  }
  return points;
}

function createMask(config) {
  const { width, height } = config.roi;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { alpha: true, willReadFrequently: true });
  if (!ctx) throw new Error('Canvas mask generation is unavailable.');

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  starPoints(config).forEach(([x, y], index) => index ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
  ctx.closePath();
  ctx.fill();

  const rgba = ctx.getImageData(0, 0, width, height).data;
  const raw = new Uint8Array(width * height);
  for (let i = 0; i < raw.length; i++) raw[i] = rgba[i * 4 + 3] ? 1 : 0;

  const mask = new Uint8Array(raw);
  const d = config.dilation;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!raw[y * width + x]) continue;
      for (let dy = -d; dy <= d; dy++) {
        const yy = y + dy;
        if (yy < 0 || yy >= height) continue;
        for (let dx = -d; dx <= d; dx++) {
          const xx = x + dx;
          if (xx < 0 || xx >= width) continue;
          mask[yy * width + xx] = 1;
        }
      }
    }
  }
  return mask;
}

function buildDonorPlan(config, mask) {
  const { width, height } = config.roi;
  const directions = [
    [-1, 0], [1, 0], [0, -1], [0, 1],
    [-1, -1], [1, -1], [-1, 1], [1, 1]
  ];
  const plan = new Array(width * height);
  const maxDistance = Math.max(width, height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = y * width + x;
      if (!mask[index]) continue;
      const donors = [];

      for (const [dx, dy] of directions) {
        for (let distance = 1; distance <= maxDistance; distance++) {
          const xx = x + dx * distance;
          const yy = y + dy * distance;
          if (xx < 0 || yy < 0 || xx >= width || yy >= height) break;
          const donor = yy * width + xx;
          if (!mask[donor]) {
            donors.push([donor, 1 / Math.max(1, distance)]);
            break;
          }
        }
      }

      let total = 0;
      for (const donor of donors) total += donor[1];
      if (total > 0) for (const donor of donors) donor[1] /= total;
      plan[index] = donors;
    }
  }
  return plan;
}

function cleanRoi(imageData, mask, donorPlan, previous) {
  const source = imageData.data;
  const output = new Uint8ClampedArray(source);

  for (let i = 0; i < mask.length; i++) {
    if (!mask[i]) continue;
    const donors = donorPlan[i];
    if (!donors || !donors.length) continue;

    const p = i * 4;
    for (let channel = 0; channel < 3; channel++) {
      let value = 0;
      for (const [donor, weight] of donors) value += source[donor * 4 + channel] * weight;
      output[p + channel] = clamp(Math.round(value), 0, 255);
    }
    output[p + 3] = 255;
  }

  if (previous && previous.length === output.length) {
    for (let i = 0; i < mask.length; i++) {
      if (!mask[i]) continue;
      const p = i * 4;
      const diff = (
        Math.abs(output[p] - previous[p]) +
        Math.abs(output[p + 1] - previous[p + 1]) +
        Math.abs(output[p + 2] - previous[p + 2])
      ) / 3;
      if (diff >= TEMPORAL_MAX_DIFF) continue;
      const blend = TEMPORAL_BLEND * (1 - diff / TEMPORAL_MAX_DIFF);
      output[p] = Math.round(output[p] * (1 - blend) + previous[p] * blend);
      output[p + 1] = Math.round(output[p + 1] * (1 - blend) + previous[p + 1] * blend);
      output[p + 2] = Math.round(output[p + 2] * (1 - blend) + previous[p + 2] * blend);
    }
  }

  return new ImageData(output, imageData.width, imageData.height);
}

function safeStopRecorder(recorder) {
  if (recorder && recorder.state !== 'inactive') {
    try { recorder.requestData(); } catch {}
    try { recorder.stop(); } catch {}
  }
}

export async function cleanLandscapeGeminiVideo(inputBlob, options = {}) {
  if (!(inputBlob instanceof Blob) || inputBlob.size === 0) throw new Error('Video file is empty.');
  if (!('MediaRecorder' in window)) throw new Error('Video cleanup requires current Chrome or Edge.');

  const url = URL.createObjectURL(inputBlob);
  const video = document.createElement('video');
  video.src = url;
  video.preload = 'auto';
  video.playsInline = true;
  video.muted = true;
  video.volume = 0;
  video.style.position = 'fixed';
  video.style.left = '-99999px';
  video.style.top = '0';
  video.style.width = '2px';
  video.style.height = '2px';
  video.style.opacity = '0.001';
  document.body.appendChild(video);

  let recorder = null;
  let canvasStream = null;
  let capturedStream = null;
  let watchdog = 0;
  let cancelled = false;

  try {
    if (video.readyState < 1) await waitForEvent(video, 'loadedmetadata', 10000, 'Video metadata could not be loaded.');
    const config = makeConfig(video.videoWidth, video.videoHeight);
    const mask = createMask(config);
    const donorPlan = buildDonorPlan(config, mask);

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d', { alpha: false, willReadFrequently: true });
    if (!ctx) throw new Error('Canvas video processing is unavailable.');

    let previous = null;
    let lastTime = NaN;
    canvasStream = canvas.captureStream(FPS);
    capturedStream = typeof video.captureStream === 'function'
      ? video.captureStream()
      : (typeof video.mozCaptureStream === 'function' ? video.mozCaptureStream() : null);

    const tracks = [...canvasStream.getVideoTracks()];
    if (capturedStream) tracks.push(...capturedStream.getAudioTracks());
    const outputStream = new MediaStream(tracks);
    const mimeType = recorderMime();
    recorder = new MediaRecorder(outputStream, {
      ...(mimeType ? { mimeType } : {}),
      videoBitsPerSecond: video.videoWidth >= 1920 ? 14_000_000 : 8_000_000,
      audioBitsPerSecond: 192_000,
    });

    const chunks = [];
    recorder.ondataavailable = (event) => { if (event.data && event.data.size) chunks.push(event.data); };
    let stoppedResolve;
    const stopped = new Promise((resolve) => { stoppedResolve = resolve; });
    recorder.onstop = () => stoppedResolve();
    recorder.onerror = () => stoppedResolve();

    const drawClean = () => {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const { x, y, width, height } = config.roi;
      const roi = ctx.getImageData(x, y, width, height);
      const cleaned = cleanRoi(roi, mask, donorPlan, previous);
      const isNewFrame = !Number.isFinite(lastTime) || Math.abs(video.currentTime - lastTime) > 0.001;
      if (isNewFrame) {
        previous = new Uint8ClampedArray(cleaned.data);
        lastTime = video.currentTime;
      }
      ctx.putImageData(cleaned, x, y);

      if (typeof options.onProgress === 'function' && Number.isFinite(video.duration) && video.duration > 0) {
        options.onProgress(Math.min(0.99, Math.max(0.02, video.currentTime / video.duration)));
      }
    };

    const render = () => {
      if (cancelled) return;
      try { drawClean(); } catch (error) {
        cancelled = true;
        safeStopRecorder(recorder);
        return;
      }
      if (!video.ended && !video.paused) {
        if (typeof video.requestVideoFrameCallback === 'function') video.requestVideoFrameCallback(render);
        else requestAnimationFrame(render);
      }
    };

    drawClean();
    recorder.start(250);

    const duration = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 10;
    let finishedResolve;
    let finishedReject;
    const finished = new Promise((resolve, reject) => { finishedResolve = resolve; finishedReject = reject; });
    let finishedOnce = false;

    const finish = () => {
      if (finishedOnce) return;
      finishedOnce = true;
      cancelled = true;
      try { drawClean(); } catch (error) { finishedReject(error); return; }
      if (typeof options.onProgress === 'function') options.onProgress(1);
      safeStopRecorder(recorder);
      finishedResolve();
    };

    const fail = (error) => {
      if (finishedOnce) return;
      finishedOnce = true;
      cancelled = true;
      safeStopRecorder(recorder);
      finishedReject(error instanceof Error ? error : new Error(String(error)));
    };

    video.addEventListener('ended', finish, { once: true });
    video.addEventListener('error', () => fail(new Error('Video playback failed during cleanup.')), { once: true });
    video.addEventListener('timeupdate', () => {
      if (!finishedOnce && duration > 0 && video.currentTime >= duration - 0.08) finish();
    });

    watchdog = setTimeout(() => {
      if (video.currentTime >= Math.max(0, duration - 0.35)) finish();
      else fail(new Error('Landscape video cleanup timed out. Please retry once.'));
    }, Math.max(35000, Math.ceil(duration * 3500)));

    try {
      await video.play();
    } catch {
      fail(new Error('Browser blocked video processing. Click Remove watermark again.'));
    }

    if (!finishedOnce) {
      if (typeof video.requestVideoFrameCallback === 'function') video.requestVideoFrameCallback(render);
      else requestAnimationFrame(render);
    }

    await finished;
    if (watchdog) clearTimeout(watchdog);
    await Promise.race([stopped, new Promise((resolve) => setTimeout(resolve, 3000))]);

    const type = recorder.mimeType || mimeType || 'video/webm';
    const output = new Blob(chunks, { type: type.split(';')[0] });
    if (!output.size) throw new Error('Landscape video cleanup produced an empty output.');
    window.__GW_ACTIVE_VIDEO_CLEANER__ = `landscape-diamond-v1-${video.videoWidth}x${video.videoHeight}`;
    return output;
  } finally {
    if (watchdog) clearTimeout(watchdog);
    cancelled = true;
    safeStopRecorder(recorder);
    try { canvasStream?.getTracks?.().forEach((track) => track.stop()); } catch {}
    try { capturedStream?.getTracks?.().forEach((track) => track.stop()); } catch {}
    video.pause();
    video.removeAttribute('src');
    video.load();
    video.remove();
    URL.revokeObjectURL(url);
  }
}

window.__GW_CLEAN_LANDSCAPE_VIDEO__ = cleanLandscapeGeminiVideo;

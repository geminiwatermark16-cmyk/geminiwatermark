const STORY_ROI = { x: 836, y: 1676, width: 136, height: 136 };
const MASK_CENTER = { x: 68, y: 68 };
const STAR_OUTER_RADIUS = 58;
const STAR_INNER_RADIUS = 23;
const INPAINT_RADIUS = 5;
const TEMPORAL_MAX_DIFF = 24;
const TEMPORAL_MAX_BLEND = 0.14;
const TEXTURE_STRENGTH = 0.34;

function waitForEvent(target, event, timeoutMs, errorMessage) {
  return new Promise((resolve, reject) => {
    let timer = 0;
    const cleanup = () => {
      target.removeEventListener(event, onDone);
      target.removeEventListener('error', onError);
      if (timer) clearTimeout(timer);
    };
    const onDone = () => { cleanup(); resolve(); };
    const onError = () => { cleanup(); reject(new Error(errorMessage || 'Video could not be decoded.')); };
    target.addEventListener(event, onDone, { once: true });
    target.addEventListener('error', onError, { once: true });
    if (timeoutMs) timer = setTimeout(() => { cleanup(); reject(new Error(errorMessage || 'Video operation timed out.')); }, timeoutMs);
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
let purePlan;

function smoothstep(value) {
  const t = Math.max(0, Math.min(1, value));
  return t * t * (3 - 2 * t);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

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

  const donorAngles = Array.from({ length: 16 }, (_, index) => index * Math.PI / 8);
  const donorRadii = [8, 12, 16, 22, 30, 40, 50, 60, 66];

  const entries = order.map((i) => {
    const x = i % width;
    const y = Math.floor(i / width);
    const gx = ((x + 1 < width ? distance[i + 1] : distance[i]) - (x > 0 ? distance[i - 1] : distance[i])) * 0.5;
    const gy = ((y + 1 < height ? distance[i + width] : distance[i]) - (y > 0 ? distance[i - width] : distance[i])) * 0.5;
    const neighbors = [];
    let total = 0;

    for (let dy = -INPAINT_RADIUS; dy <= INPAINT_RADIUS; dy++) {
      for (let dx = -INPAINT_RADIUS; dx <= INPAINT_RADIUS; dx++) {
        if (!dx && !dy) continue;
        const d2 = dx * dx + dy * dy;
        if (d2 > INPAINT_RADIUS * INPAINT_RADIUS) continue;
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

    const donors = [];
    const seen = new Set();
    for (const radius of donorRadii) {
      for (const angle of donorAngles) {
        const xx = Math.round(x + Math.cos(angle) * radius);
        const yy = Math.round(y + Math.sin(angle) * radius);
        if (xx < 2 || yy < 2 || xx >= width - 2 || yy >= height - 2) continue;
        const n = yy * width + xx;
        if (STAR_MASK[n] || seen.has(n)) continue;
        seen.add(n);
        donors.push(n);
        if (donors.length >= 12) break;
      }
      if (donors.length >= 12) break;
    }

    return {
      index: i,
      neighbors,
      donors,
      feather: 0.94 + 0.06 * smoothstep((distance[i] - 1) / 5),
    };
  });

  purePlan = { entries, width, height };
  return purePlan;
}

function localAverage(source, index, width, channel) {
  const offsets = [-width, -1, 1, width];
  let sum = source[index * 4 + channel] * 2;
  let count = 2;
  for (const offset of offsets) {
    const n = index + offset;
    if (n < 0 || n >= width * STORY_ROI.height) continue;
    sum += source[n * 4 + channel];
    count++;
  }
  return sum / count;
}

function pureJsInpaint(imageData) {
  const plan = getPurePlan();
  const result = new Uint8ClampedArray(imageData.data);
  const source = imageData.data;
  const size = plan.width * plan.height;
  const channels = [new Float32Array(size), new Float32Array(size), new Float32Array(size)];

  for (let i = 0; i < size; i++) {
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

  for (const entry of plan.entries) {
    const { index, donors, feather } = entry;
    if (!donors.length) continue;

    const baseR = channels[0][index];
    const baseG = channels[1][index];
    const baseB = channels[2][index];
    const baseLuma = baseR * 0.2126 + baseG * 0.7152 + baseB * 0.0722;

    let best = -1;
    let bestScore = Infinity;
    let loR = 255, loG = 255, loB = 255;
    let hiR = 0, hiG = 0, hiB = 0;

    for (const donor of donors) {
      const r = source[donor * 4];
      const g = source[donor * 4 + 1];
      const b = source[donor * 4 + 2];
      loR = Math.min(loR, r); loG = Math.min(loG, g); loB = Math.min(loB, b);
      hiR = Math.max(hiR, r); hiG = Math.max(hiG, g); hiB = Math.max(hiB, b);
      const luma = r * 0.2126 + g * 0.7152 + b * 0.0722;
      const colorDistance = Math.abs(r - baseR) + Math.abs(g - baseG) + Math.abs(b - baseB);
      const score = Math.abs(luma - baseLuma) * 2 + colorDistance * 0.12;
      if (score < bestScore) {
        bestScore = score;
        best = donor;
      }
    }

    if (best < 0) continue;

    const values = [baseR, baseG, baseB];
    const lows = [loR, loG, loB];
    const highs = [hiR, hiG, hiB];
    for (let c = 0; c < 3; c++) {
      const donorValue = source[best * 4 + c];
      const donorMean = localAverage(source, best, plan.width, c);
      const detail = donorValue - donorMean;
      const textured = values[c] + detail * TEXTURE_STRENGTH;
      const clamped = clamp(textured, lows[c] - 12, highs[c] + 12);
      const original = source[index * 4 + c];
      channels[c][index] = clamped * feather + original * (1 - feather);
    }
  }

  for (let i = 0; i < STAR_MASK.length; i++) {
    if (!STAR_MASK[i]) continue;
    result[i * 4] = clamp(Math.round(channels[0][i]), 0, 255);
    result[i * 4 + 1] = clamp(Math.round(channels[1][i]), 0, 255);
    result[i * 4 + 2] = clamp(Math.round(channels[2][i]), 0, 255);
    result[i * 4 + 3] = 255;
  }
  return new ImageData(result, plan.width, plan.height);
}

function stabilizeTemporal(current, previous) {
  if (!previous || previous.length !== current.data.length) {
    return new Uint8ClampedArray(current.data);
  }

  const data = current.data;
  for (let i = 0; i < STAR_MASK.length; i++) {
    if (!STAR_MASK[i]) continue;
    const p = i * 4;
    const diff = (
      Math.abs(data[p] - previous[p]) +
      Math.abs(data[p + 1] - previous[p + 1]) +
      Math.abs(data[p + 2] - previous[p + 2])
    ) / 3;
    if (diff >= TEMPORAL_MAX_DIFF) continue;
    const weight = TEMPORAL_MAX_BLEND * (1 - diff / TEMPORAL_MAX_DIFF);
    data[p] = Math.round(data[p] * (1 - weight) + previous[p] * weight);
    data[p + 1] = Math.round(data[p + 1] * (1 - weight) + previous[p + 1] * weight);
    data[p + 2] = Math.round(data[p + 2] * (1 - weight) + previous[p + 2] * weight);
  }
  return new Uint8ClampedArray(data);
}

function cleanFrame(ctx, temporalState, mediaTime) {
  const { x, y, width, height } = STORY_ROI;
  const imageData = ctx.getImageData(x, y, width, height);
  const cleaned = pureJsInpaint(imageData);

  const isNewFrame = !Number.isFinite(temporalState.lastTime) || Math.abs(mediaTime - temporalState.lastTime) > 0.001;
  if (isNewFrame) {
    temporalState.previous = stabilizeTemporal(cleaned, temporalState.previous);
    cleaned.data.set(temporalState.previous);
    temporalState.lastTime = mediaTime;
  } else if (temporalState.previous) {
    cleaned.data.set(temporalState.previous);
  }

  ctx.putImageData(cleaned, x, y);
}

function safeStopRecorder(recorder) {
  if (recorder && recorder.state !== 'inactive') {
    try { recorder.requestData(); } catch {}
    try { recorder.stop(); } catch {}
  }
}

export async function pureJsCleanStoryVideo(inputBlob, options = {}) {
  if (!(inputBlob instanceof Blob) || inputBlob.size === 0) return inputBlob;
  if (!('MediaRecorder' in window)) throw new Error('Video cleanup requires current Chrome or Edge.');

  window.__GW_ACTIVE_VIDEO_CLEANER__ = 'pure-js-v14-texture-smooth';
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
  let cancelled = false;
  let watchdog = 0;

  try {
    if (video.readyState < 1) {
      await waitForEvent(video, 'loadedmetadata', 10000, 'Video metadata could not be loaded.');
    }
    if (video.videoWidth !== 1080 || video.videoHeight !== 1920) {
      throw new Error(`Story cleaner expects 1080×1920, received ${video.videoWidth}×${video.videoHeight}.`);
    }

    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext('2d', { alpha: false, willReadFrequently: true });
    if (!ctx) throw new Error('Canvas video processing is unavailable.');

    getPurePlan();
    const temporalState = { previous: null, lastTime: NaN };

    const fps = 24;
    canvasStream = canvas.captureStream(fps);
    capturedStream = typeof video.captureStream === 'function'
      ? video.captureStream()
      : (typeof video.mozCaptureStream === 'function' ? video.mozCaptureStream() : null);

    const tracks = [...canvasStream.getVideoTracks()];
    if (capturedStream) tracks.push(...capturedStream.getAudioTracks());
    const outputStream = new MediaStream(tracks);
    const mimeType = recorderMime();
    recorder = new MediaRecorder(outputStream, {
      ...(mimeType ? { mimeType } : {}),
      videoBitsPerSecond: 12_500_000,
      audioBitsPerSecond: 192_000,
    });

    const chunks = [];
    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size) chunks.push(event.data);
    };

    let recorderStoppedResolve;
    const recorderStopped = new Promise((resolve) => { recorderStoppedResolve = resolve; });
    recorder.onstop = () => recorderStoppedResolve();
    recorder.onerror = () => recorderStoppedResolve();

    const drawClean = () => {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      cleanFrame(ctx, temporalState, video.currentTime);
      if (typeof options.onProgress === 'function' && Number.isFinite(video.duration) && video.duration > 0) {
        options.onProgress(Math.min(0.99, Math.max(0.02, video.currentTime / video.duration)));
      }
    };

    const render = () => {
      if (cancelled) return;
      try { drawClean(); } catch (error) { console.warn('Frame cleanup failed.', error); }
      if (!cancelled && !video.ended && !video.paused) {
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
      try { drawClean(); } catch {}
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

    const watchdogMs = Math.max(35000, Math.ceil(duration * 3500));
    watchdog = setTimeout(() => {
      if (video.currentTime >= Math.max(0, duration - 0.35)) finish();
      else fail(new Error('Video cleanup timed out. Please retry once.'));
    }, watchdogMs);

    try {
      await video.play();
    } catch (error) {
      fail(new Error('Browser blocked video processing. Click Remove watermark again.'));
    }

    if (!finishedOnce) {
      if (typeof video.requestVideoFrameCallback === 'function') video.requestVideoFrameCallback(render);
      else requestAnimationFrame(render);
    }

    await finished;
    if (watchdog) clearTimeout(watchdog);
    await Promise.race([
      recorderStopped,
      new Promise((resolve) => setTimeout(resolve, 3000)),
    ]);

    const type = recorder.mimeType || mimeType || 'video/webm';
    const output = new Blob(chunks, { type: type.split(';')[0] });
    if (!output.size) throw new Error('Video cleanup produced an empty output.');
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

window.__GW_PURE_CLEAN_STORY_VIDEO__ = pureJsCleanStoryVideo;
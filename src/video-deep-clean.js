function waitFor(target, event) {
  return new Promise((resolve, reject) => {
    const onEvent = () => { cleanup(); resolve(); };
    const onError = () => { cleanup(); reject(new Error('Video could not be decoded for seamless cleanup.')); };
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

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function smoothstep(edge0, edge1, value) {
  const t = clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

function readPixel(data, width, x, y, channel) {
  const px = clamp(Math.round(x), 0, width - 1);
  const height = data.length / 4 / width;
  const py = clamp(Math.round(y), 0, height - 1);
  return data[(py * width + px) * 4 + channel];
}

/**
 * Reconstruct only the Gemini diamond area from its surrounding clean pixels.
 * Unlike the previous blur-box fallback, this uses a feathered diamond mask,
 * so no rectangular patch is painted over the video.
 */
function seamlessDiamondInpaint(ctx, canvas) {
  const region = { x: 858, y: 1622, width: 116, height: 116 };
  const pad = 34;
  const sx = Math.max(0, region.x - pad);
  const sy = Math.max(0, region.y - pad);
  const sw = Math.min(canvas.width - sx, region.width + pad * 2);
  const sh = Math.min(canvas.height - sy, region.height + pad * 2);

  const source = ctx.getImageData(sx, sy, sw, sh);
  const target = ctx.getImageData(region.x, region.y, region.width, region.height);
  const sourceData = source.data;
  const out = target.data;

  const localX = region.x - sx;
  const localY = region.y - sy;
  const leftSampleX = localX - 16;
  const rightSampleX = localX + region.width + 16;
  const topSampleY = localY - 16;
  const bottomSampleY = localY + region.height + 16;

  for (let y = 0; y < region.height; y++) {
    const ny = ((y + 0.5) - region.height / 2) / (region.height / 2);
    const fy = region.height > 1 ? y / (region.height - 1) : 0.5;

    for (let x = 0; x < region.width; x++) {
      const nx = ((x + 0.5) - region.width / 2) / (region.width / 2);
      const diamondDistance = Math.abs(nx) + Math.abs(ny);

      // Full replacement over the actual ~96px diamond, then feather softly
      // into the untouched frame. The 116px working region provides margin.
      const mask = 1 - smoothstep(0.78, 1.04, diamondDistance);
      if (mask <= 0.001) continue;

      const fx = region.width > 1 ? x / (region.width - 1) : 0.5;
      const srcY = localY + y;
      const srcX = localX + x;
      const outIndex = (y * region.width + x) * 4;

      for (let c = 0; c < 3; c++) {
        const left = readPixel(sourceData, sw, leftSampleX, srcY, c);
        const right = readPixel(sourceData, sw, rightSampleX, srcY, c);
        const top = readPixel(sourceData, sw, srcX, topSampleY, c);
        const bottom = readPixel(sourceData, sw, srcX, bottomSampleY, c);

        const horizontal = left + (right - left) * fx;
        const vertical = top + (bottom - top) * fy;
        const reconstructed = horizontal * 0.5 + vertical * 0.5;
        const original = out[outIndex + c];
        out[outIndex + c] = Math.round(original * (1 - mask) + reconstructed * mask);
      }
    }
  }

  ctx.putImageData(target, region.x, region.y);
}

export async function deepCleanStoryVideo(inputBlob, options = {}) {
  if (!(inputBlob instanceof Blob) || inputBlob.size === 0) return inputBlob;
  if (!('MediaRecorder' in window)) return inputBlob;

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
    if (width !== 1080 || height !== 1920) return inputBlob;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { alpha: false, willReadFrequently: true });

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
      videoBitsPerSecond: 9_000_000,
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
      seamlessDiamondInpaint(ctx, canvas);

      if (Number.isFinite(video.duration) && video.duration > 0 && typeof options.onProgress === 'function') {
        options.onProgress(Math.min(1, video.currentTime / video.duration));
      }

      if (!video.ended && !video.paused) {
        if (typeof video.requestVideoFrameCallback === 'function') video.requestVideoFrameCallback(render);
        else requestAnimationFrame(render);
      }
    };

    ctx.drawImage(video, 0, 0, width, height);
    seamlessDiamondInpaint(ctx, canvas);
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
    return output.size ? output : inputBlob;
  } catch (error) {
    console.warn('Seamless cleanup fallback skipped:', error);
    return inputBlob;
  } finally {
    video.pause();
    video.removeAttribute('src');
    video.load();
    video.remove();
    URL.revokeObjectURL(url);
  }
}

window.__GW_DEEP_CLEAN_VIDEO__ = deepCleanStoryVideo;

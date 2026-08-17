function waitFor(target, event) {
  return new Promise((resolve, reject) => {
    const onEvent = () => { cleanup(); resolve(); };
    const onError = () => { cleanup(); reject(new Error('Video could not be decoded for deep cleanup.')); };
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

function makeBlurredPatch(sourceCanvas, x, y, width, height) {
  const pad = 70;
  const sx = Math.max(0, x - pad);
  const sy = Math.max(0, y - pad);
  const sw = Math.min(sourceCanvas.width - sx, width + pad * 2);
  const sh = Math.min(sourceCanvas.height - sy, height + pad * 2);

  const raw = document.createElement('canvas');
  raw.width = sw;
  raw.height = sh;
  const rawCtx = raw.getContext('2d', { alpha: false });
  rawCtx.drawImage(sourceCanvas, sx, sy, sw, sh, 0, 0, sw, sh);

  const blurred = document.createElement('canvas');
  blurred.width = sw;
  blurred.height = sh;
  const blurCtx = blurred.getContext('2d', { alpha: false });
  blurCtx.filter = 'blur(34px)';
  blurCtx.drawImage(raw, 0, 0);
  blurCtx.filter = 'blur(18px)';
  blurCtx.globalAlpha = 0.82;
  blurCtx.drawImage(blurred, 0, 0);
  blurCtx.globalAlpha = 1;
  blurCtx.filter = 'none';

  return {
    canvas: blurred,
    cropX: x - sx,
    cropY: y - sy,
    width,
    height,
  };
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

    // Current Gemini/Veo 9:16 story sample: keep original dimensions and
    // apply a wide, feathered second pass around the bottom-right diamond.
    if (width !== 1080 || height !== 1920) return inputBlob;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { alpha: false });

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

    const region = { x: 810, y: 1570, width: 220, height: 240 };
    let cancelled = false;

    const render = () => {
      if (cancelled) return;
      ctx.drawImage(video, 0, 0, width, height);

      const patch = makeBlurredPatch(canvas, region.x, region.y, region.width, region.height);
      ctx.drawImage(
        patch.canvas,
        patch.cropX,
        patch.cropY,
        patch.width,
        patch.height,
        region.x,
        region.y,
        region.width,
        region.height
      );

      if (Number.isFinite(video.duration) && video.duration > 0 && typeof options.onProgress === 'function') {
        options.onProgress(Math.min(1, video.currentTime / video.duration));
      }

      if (!video.ended && !video.paused) {
        if (typeof video.requestVideoFrameCallback === 'function') video.requestVideoFrameCallback(render);
        else requestAnimationFrame(render);
      }
    };

    ctx.drawImage(video, 0, 0, width, height);
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
    console.warn('Deep-clean fallback skipped:', error);
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

const waitFor = async (selector, timeout = 10000) => {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    const node = document.querySelector(selector);
    if (node) return node;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  return null;
};

const panel = await waitFor('#upscalePanel');
if (panel && panel.dataset.aiSuperResolution !== 'v4') {
  panel.dataset.aiSuperResolution = 'v4';

  const $ = (id) => document.getElementById(id);
  const message = $('upscaleMessage');
  const processing = $('upscaleProcessing');
  const progressBar = $('upscaleProgressBar');
  const progressText = $('upscaleProgressText');
  const processingTitle = $('upscaleProcessingTitle');
  const processingSub = $('upscaleProcessingSub');
  const fileInput = $('upscaleFileInput');
  const afterVideo = $('upscaleAfter');
  const outputMeta = $('upscaleOutputMeta');
  const anotherButton = $('upscaleAnother');

  const replaceButton = (id) => {
    const old = $(id);
    if (!old) return null;
    const clone = old.cloneNode(true);
    old.replaceWith(clone);
    return clone;
  };

  // Clone the buttons so the old resize-only and MP4 override handlers are removed.
  const startButton = replaceButton('upscaleStart');
  const downloadButton = replaceButton('upscaleDownload');

  if (startButton) startButton.textContent = 'AI Upscale 2× — MAX Quality ✦';
  if (downloadButton) downloadButton.textContent = 'Download AI MP4 ↓';

  const tab = $('upscaleTab');
  if (tab) tab.innerHTML = '<span>Video Upscale</span><b>AI 2× MAX</b><i>REAL AI</i>';

  const heroSmall = panel.querySelector('.gwUpscaleHero small');
  const heroTitle = panel.querySelector('.gwUpscaleHero h2');
  const heroCopy = panel.querySelector('.gwUpscaleHero p');
  const heroPill = panel.querySelector('.gwUpscalePill');
  if (heroSmall) heroSmall.textContent = 'AI SUPER RESOLUTION · ESRGAN MEDIUM';
  if (heroTitle) heroTitle.textContent = 'Real 2× AI enhancement with stronger texture recovery';
  if (heroCopy) heroCopy.textContent = 'MAX Quality mode uses the heavier ESRGAN Medium neural model on every frame, extra patch overlap to reduce seams, and a high-bitrate H.264 MP4 encode to preserve the recovered detail.';
  if (heroPill) heroPill.textContent = '✦ MAX Quality';

  const trust = panel.querySelector('.gwUpscaleTrust');
  if (trust) {
    trust.innerHTML = '<span>● On-device AI</span><span>ESRGAN Medium</span><span>2× neural detail</span><span>High-bitrate MP4</span>';
  }

  let resultBlob = null;
  let resultUrl = null;
  let mediaLib = null;
  let aiUpscaler = null;
  let loadingPromise = null;
  let running = false;

  const setMessage = (text, type = '') => {
    if (!message) return;
    message.textContent = text;
    message.className = `gwUpscaleMessage ${type}`;
  };

  const setProgress = (value, label) => {
    const pct = Math.max(0, Math.min(100, Math.round(Number(value || 0) * 100)));
    if (progressBar) progressBar.style.width = `${pct}%`;
    if (progressText) progressText.textContent = `${pct}%`;
    if (label && processingSub) processingSub.textContent = label;
  };

  const clearResult = () => {
    resultBlob = null;
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    resultUrl = null;
    if (afterVideo) {
      afterVideo.pause();
      afterVideo.removeAttribute('src');
      afterVideo.load();
      afterVideo.classList.add('hidden');
    }
    if (downloadButton) downloadButton.classList.add('hidden');
    if (startButton) startButton.classList.remove('hidden');
  };

  const loadScript = (src, ready) => new Promise((resolve, reject) => {
    if (ready()) return resolve();
    const existing = Array.from(document.scripts).find((script) => script.src === src);
    if (existing) {
      const check = setInterval(() => {
        if (ready()) {
          clearInterval(check);
          resolve();
        }
      }, 50);
      setTimeout(() => {
        clearInterval(check);
        if (!ready()) reject(new Error('AI library did not finish loading.'));
      }, 30000);
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.onload = () => ready() ? resolve() : reject(new Error('AI library loaded without its expected runtime.'));
    script.onerror = () => reject(new Error('Could not load the AI enhancement library. Check your internet connection and retry.'));
    document.head.appendChild(script);
  });

  const loadAiRuntime = async () => {
    if (aiUpscaler && mediaLib) return { mediaLib, aiUpscaler };
    if (loadingPromise) return loadingPromise;

    loadingPromise = (async () => {
      if (processingTitle) processingTitle.textContent = 'Loading MAX Quality AI model…';
      setProgress(0.02, 'TensorFlow.js + ESRGAN Medium 2×');

      await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@latest/dist/tf.min.js', () => Boolean(window.tf));
      await window.tf.ready();
      try {
        if (window.tf.getBackend() !== 'webgl') await window.tf.setBackend('webgl');
      } catch {}

      await Promise.all([
        loadScript('https://cdn.jsdelivr.net/npm/@upscalerjs/esrgan-medium@latest/dist/umd/2x.min.js', () => Boolean(window.ESRGANMedium2x)),
        loadScript('https://cdn.jsdelivr.net/npm/upscaler@latest/dist/browser/umd/upscaler.min.js', () => Boolean(window.Upscaler)),
      ]);

      setProgress(0.05, 'Loading high-quality MP4 pipeline');
      mediaLib = await import('https://cdn.jsdelivr.net/npm/mediabunny@1.52.2/+esm');
      aiUpscaler = new window.Upscaler({ model: window.ESRGANMedium2x });

      if (typeof aiUpscaler.warmup === 'function') {
        await aiUpscaler.warmup({ patchSize: 64, padding: 5 }, { awaitNextFrame: true });
      }

      return { mediaLib, aiUpscaler };
    })();

    try {
      return await loadingPromise;
    } catch (error) {
      loadingPromise = null;
      throw error;
    }
  };

  const makeCanvas = (width, height) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return canvas;
  };

  const runAiUpscale = async () => {
    const file = fileInput?.files?.[0];
    if (!file || !file.type.startsWith('video/')) {
      setMessage('Choose a video first.', 'error');
      return;
    }
    if (running) return;

    running = true;
    clearResult();
    if (startButton) startButton.disabled = true;
    if (anotherButton) anotherButton.disabled = true;
    if (fileInput) fileInput.disabled = true;
    if (processing) processing.classList.remove('hidden');
    if (processingTitle) processingTitle.textContent = 'Starting MAX Quality AI enhancement…';
    setProgress(0, 'Preparing video and ESRGAN Medium');
    setMessage('MAX Quality is a heavier real-AI pass, so it can take substantially longer than normal resizing.');

    let inputCanvas;
    let inputContext;

    try {
      const { mediaLib: media, aiUpscaler: upscaler } = await loadAiRuntime();
      const input = new media.Input({
        source: new media.BlobSource(file),
        formats: media.ALL_FORMATS,
      });

      const videoTrack = await input.getPrimaryVideoTrack();
      if (!videoTrack) throw new Error('No readable video track was found in this file.');

      const sourceWidth = await videoTrack.getDisplayWidth();
      const sourceHeight = await videoTrack.getDisplayHeight();
      const outWidth = sourceWidth * 2;
      const outHeight = sourceHeight * 2;
      if (!sourceWidth || !sourceHeight) throw new Error('Could not read video dimensions.');
      if (Math.max(outWidth, outHeight) > 4096) {
        throw new Error(`AI 2× output would be ${outWidth}×${outHeight}. MAX Quality browser mode currently supports up to a 4096px long edge.`);
      }

      inputCanvas = makeCanvas(sourceWidth, sourceHeight);
      inputContext = inputCanvas.getContext('2d', { alpha: false, willReadFrequently: false });
      if (!inputContext) throw new Error('Could not create the AI frame renderer.');

      const target = new media.BufferTarget();
      const output = new media.Output({
        format: new media.Mp4OutputFormat({ fastStart: 'in-memory' }),
        target,
      });

      // Preserve fine AI detail during the second encode. For 4K this reaches ~40 Mbps;
      // smaller outputs keep a generous floor instead of being recompressed too aggressively.
      const targetBitrate = Math.min(
        50_000_000,
        Math.max(16_000_000, Math.round(outWidth * outHeight * 5))
      );

      let conversionProgress = 0;
      let frameNumber = 0;
      const conversion = await media.Conversion.init({
        input,
        output,
        tracks: 'primary',
        video: {
          codec: 'avc',
          bitrate: targetBitrate,
          hardwareAcceleration: 'prefer-hardware',
          keyFrameInterval: 2,
          forceTranscode: true,
          processedWidth: outWidth,
          processedHeight: outHeight,
          process: async (sample) => {
            frameNumber += 1;
            inputContext.clearRect(0, 0, sourceWidth, sourceHeight);
            sample.draw(inputContext, 0, 0, sourceWidth, sourceHeight);

            if (processingTitle) processingTitle.textContent = `MAX AI enhancing frame ${frameNumber}`;
            const enhanced = await upscaler.upscale(inputCanvas, {
              output: 'tensor',
              patchSize: 64,
              padding: 5,
              awaitNextFrame: true,
              progress: (patchProgress) => {
                const base = Math.min(0.96, Math.max(0.06, conversionProgress));
                const micro = Math.min(0.025, Number(patchProgress || 0) * 0.025);
                setProgress(base + micro, `ESRGAN Medium texture recovery · ${Math.round(Number(patchProgress || 0) * 100)}% of current frame`);
              },
            });

            const enhancedCanvas = makeCanvas(outWidth, outHeight);
            try {
              await window.tf.browser.toPixels(enhanced, enhancedCanvas);
            } finally {
              enhanced.dispose?.();
            }
            return enhancedCanvas;
          },
        },
      });

      conversion.onProgress = (progress) => {
        conversionProgress = Math.max(conversionProgress, Number(progress || 0));
        setProgress(Math.max(0.06, conversionProgress), `Frame-by-frame MAX Quality AI · ${Math.round(conversionProgress * 100)}%`);
      };

      if (processingTitle) processingTitle.textContent = 'MAX Quality AI enhancing every frame…';
      await conversion.execute();

      const buffer = target.buffer;
      if (!buffer || !buffer.byteLength) throw new Error('AI processing finished but the MP4 encoder returned an empty file.');

      resultBlob = new Blob([buffer], { type: 'video/mp4' });
      resultUrl = URL.createObjectURL(resultBlob);
      if (afterVideo) {
        afterVideo.src = resultUrl;
        afterVideo.classList.remove('hidden');
      }
      if (outputMeta) outputMeta.textContent = `${outWidth}×${outHeight} · AI MAX · ${(resultBlob.size / 1024 / 1024).toFixed(1)} MB`;
      if (processing) processing.classList.add('hidden');
      if (startButton) startButton.classList.add('hidden');
      if (downloadButton) downloadButton.classList.remove('hidden');
      setProgress(1, 'MAX Quality AI super resolution complete');
      setMessage(`ESRGAN Medium 2× AI enhancement is ready. MP4 target bitrate: ${(targetBitrate / 1_000_000).toFixed(0)} Mbps.`, 'ok');
    } catch (error) {
      if (processing) processing.classList.add('hidden');
      setMessage(error?.message || 'AI upscaling failed. Please retry in the latest Chrome or Edge.', 'error');
    } finally {
      running = false;
      if (startButton) startButton.disabled = false;
      if (anotherButton) anotherButton.disabled = false;
      if (fileInput) fileInput.disabled = false;
    }
  };

  startButton?.addEventListener('click', runAiUpscale);

  downloadButton?.addEventListener('click', (event) => {
    event.preventDefault();
    if (!resultBlob || !resultUrl) return;
    const selectedName = fileInput?.files?.[0]?.name || 'video';
    const base = selectedName.replace(/\.[^.]+$/, '') || 'video';
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = `${base}-ai-max-2x.mp4`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setMessage('MAX Quality AI-enhanced MP4 downloaded.', 'ok');
  });

  anotherButton?.addEventListener('click', () => {
    if (!running) clearResult();
  });

  fileInput?.addEventListener('change', () => {
    if (!running) clearResult();
  });
}
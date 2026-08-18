const waitFor = async (selector, timeout = 8000) => {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    const node = document.querySelector(selector);
    if (node) return node;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  return null;
};

const tabs = await waitFor('#tool .tabs');
if (!tabs || document.getElementById('upscaleTab')) {
  // App shell did not load or the feature is already installed.
} else {
  const tool = document.getElementById('tool');
  const imageTab = document.getElementById('imageTab');
  const videoTab = document.getElementById('videoTab');

  const upscaleTab = document.createElement('button');
  upscaleTab.id = 'upscaleTab';
  upscaleTab.type = 'button';
  upscaleTab.className = 'gwUpscaleTab';
  upscaleTab.innerHTML = '<span>Video Upscale</span><b>2× HQ</b><i>NEW</i>';
  tabs.appendChild(upscaleTab);

  const panel = document.createElement('section');
  panel.id = 'upscalePanel';
  panel.className = 'gwUpscalePanel hidden';
  panel.innerHTML = `
    <div class="gwUpscaleHero">
      <div>
        <small>2× VIDEO UPSCALER</small>
        <h2>Make your video 2× sharper in resolution</h2>
        <p>High-quality browser resampling with smooth scaling. Your video stays on this device.</p>
      </div>
      <span class="gwUpscalePill">✦ High Quality</span>
    </div>

    <input id="upscaleFileInput" type="file" hidden accept="video/mp4,video/webm,video/quicktime">
    <button id="upscaleDropzone" class="gwUpscaleDropzone" type="button">
      <span class="gwUpscaleIcon">↗</span>
      <strong>Drop video to upscale 2×</strong>
      <span>or click to browse from your device</span>
      <em>MP4, WebM or MOV · up to 250 MB · output up to 4K long edge</em>
    </button>

    <div id="upscaleWorkspace" class="gwUpscaleWorkspace hidden">
      <div class="gwUpscalePreviewGrid">
        <article>
          <div class="gwUpscalePreviewTop"><b>Original</b><small id="upscaleOriginalMeta">—</small></div>
          <div class="gwUpscaleMedia"><video id="upscaleBefore" controls playsinline></video></div>
        </article>
        <article>
          <div class="gwUpscalePreviewTop"><b>2× High Quality</b><small id="upscaleOutputMeta">Ready</small></div>
          <div class="gwUpscaleMedia gwUpscaleResult">
            <div id="upscaleProcessing" class="gwUpscaleProcessing hidden">
              <span class="gwUpscaleSpinner"></span>
              <b id="upscaleProcessingTitle">Upscaling video…</b>
              <small id="upscaleProcessingSub">Preparing high-quality 2× output</small>
              <div class="gwUpscaleProgress"><i id="upscaleProgressBar"></i></div>
              <em id="upscaleProgressText">0%</em>
            </div>
            <video id="upscaleAfter" class="hidden" controls playsinline></video>
          </div>
        </article>
      </div>
      <div class="gwUpscaleActions">
        <button id="upscaleAnother" class="gwUpscaleSecondary" type="button">Choose another</button>
        <button id="upscaleStart" class="gwUpscalePrimary" type="button">Upscale 2× High Quality ✦</button>
        <button id="upscaleDownload" class="gwUpscalePrimary hidden" type="button">Download 2× video ↓</button>
      </div>
      <p id="upscaleMessage" class="gwUpscaleMessage"></p>
    </div>

    <div class="gwUpscaleTrust">
      <span>● Local browser processing</span>
      <span>2× resolution</span>
      <span>High-quality smoothing</span>
      <span>No media upload</span>
    </div>
  `;
  tabs.insertAdjacentElement('afterend', panel);

  const style = document.createElement('style');
  style.textContent = `
    #tool .tabs{overflow:visible;flex-wrap:wrap}
    .gwUpscaleTab{position:relative!important;overflow:visible!important;background:linear-gradient(135deg,#111 0%,#2b174d 48%,#5227ff 100%)!important;color:#fff!important;border:1px solid rgba(82,39,255,.42)!important;box-shadow:0 10px 28px rgba(82,39,255,.18);transform:translateZ(0)}
    .gwUpscaleTab span{font-weight:800}.gwUpscaleTab b{background:#fff!important;color:#35117e!important}.gwUpscaleTab i{position:absolute;right:-7px;top:-10px;background:#ffec5c;color:#171300;border:2px solid #fff;border-radius:999px;padding:3px 7px;font-size:9px;font-style:normal;font-weight:900;letter-spacing:.08em;box-shadow:0 5px 14px rgba(0,0,0,.18)}
    .gwUpscaleTab:hover,.gwUpscaleTab.active{transform:translateY(-1px);box-shadow:0 14px 36px rgba(82,39,255,.28)}
    .gwUpscaleTab.active{outline:3px solid rgba(82,39,255,.12)}
    .gwUpscalePanel{padding:24px 24px 20px}.gwUpscalePanel.hidden{display:none}
    .gwUpscaleHero{display:flex;justify-content:space-between;gap:24px;align-items:flex-start;padding:6px 2px 20px}.gwUpscaleHero small{display:block;font-size:11px;font-weight:900;letter-spacing:.15em;opacity:.55;margin-bottom:8px}.gwUpscaleHero h2{margin:0 0 8px;font-size:clamp(25px,4vw,42px);line-height:1.02;letter-spacing:-.035em;max-width:700px}.gwUpscaleHero p{margin:0;opacity:.64;line-height:1.55;max-width:700px}.gwUpscalePill{white-space:nowrap;background:#111;color:#fff;padding:9px 13px;border-radius:999px;font-size:12px;font-weight:800}
    .gwUpscaleDropzone{width:100%;min-height:240px;border:1.5px dashed rgba(82,39,255,.34);background:linear-gradient(180deg,rgba(82,39,255,.055),rgba(82,39,255,.018));border-radius:22px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;padding:28px;cursor:pointer;color:inherit;transition:.2s ease}.gwUpscaleDropzone:hover,.gwUpscaleDropzone.drag{border-color:#5227ff;background:rgba(82,39,255,.075);transform:translateY(-1px)}.gwUpscaleIcon{width:46px;height:46px;border-radius:15px;display:grid;place-items:center;background:#111;color:white;font-size:25px;margin-bottom:5px}.gwUpscaleDropzone strong{font-size:20px}.gwUpscaleDropzone span:not(.gwUpscaleIcon){opacity:.62}.gwUpscaleDropzone em{font-size:12px;font-style:normal;opacity:.48;margin-top:4px}
    .gwUpscaleWorkspace.hidden{display:none}.gwUpscalePreviewGrid{display:grid;grid-template-columns:1fr 1fr;gap:14px}.gwUpscalePreviewGrid article{background:#fff;border:1px solid rgba(0,0,0,.08);border-radius:18px;overflow:hidden}.gwUpscalePreviewTop{display:flex;align-items:center;justify-content:space-between;padding:12px 14px;border-bottom:1px solid rgba(0,0,0,.07)}.gwUpscalePreviewTop small{opacity:.55}.gwUpscaleMedia{background:#0e0e0e;aspect-ratio:16/10;display:grid;place-items:center;position:relative;overflow:hidden}.gwUpscaleMedia video{width:100%;height:100%;object-fit:contain;background:#0e0e0e}.gwUpscaleMedia video.hidden{display:none}.gwUpscaleProcessing{position:absolute;inset:0;z-index:2;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;color:#fff;background:radial-gradient(circle at 50% 40%,rgba(82,39,255,.32),rgba(0,0,0,.92));padding:24px}.gwUpscaleProcessing.hidden{display:none}.gwUpscaleProcessing b{font-size:20px;margin-top:12px}.gwUpscaleProcessing small{opacity:.72;margin:6px 0 14px}.gwUpscaleProcessing em{font-style:normal;font-size:12px;margin-top:7px;opacity:.75}.gwUpscaleSpinner{width:30px;height:30px;border:3px solid rgba(255,255,255,.22);border-top-color:#fff;border-radius:50%;animation:gwSpin .8s linear infinite}.gwUpscaleProgress{width:min(320px,80%);height:6px;background:rgba(255,255,255,.16);border-radius:999px;overflow:hidden}.gwUpscaleProgress i{display:block;width:0;height:100%;background:#fff;border-radius:inherit;transition:width .15s linear}@keyframes gwSpin{to{transform:rotate(360deg)}}
    .gwUpscaleActions{display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap;margin-top:14px}.gwUpscaleActions button{border:0;border-radius:12px;padding:12px 15px;font:inherit;font-weight:800;cursor:pointer}.gwUpscaleSecondary{background:#eee;color:#111}.gwUpscalePrimary{background:#111;color:#fff}.gwUpscalePrimary:disabled{opacity:.45;cursor:not-allowed}.gwUpscaleActions .hidden{display:none}.gwUpscaleMessage{min-height:22px;margin:10px 2px 0;font-size:13px}.gwUpscaleMessage.error{color:#9e271c}.gwUpscaleMessage.ok{color:#177044}.gwUpscaleTrust{display:flex;gap:8px;flex-wrap:wrap;margin-top:16px}.gwUpscaleTrust span{background:rgba(0,0,0,.05);border-radius:999px;padding:7px 10px;font-size:11px;font-weight:700;opacity:.68}
    @media(max-width:760px){#tool .tabs{display:grid!important;grid-template-columns:1fr 1fr}.gwUpscaleTab{grid-column:1/-1}.gwUpscalePanel{padding:18px 14px}.gwUpscaleHero{display:block}.gwUpscalePill{display:inline-flex;margin-top:13px}.gwUpscalePreviewGrid{grid-template-columns:1fr}.gwUpscaleDropzone{min-height:210px}.gwUpscaleActions{justify-content:stretch}.gwUpscaleActions button{flex:1 1 100%}}
  `;
  document.head.appendChild(style);

  const regularNodes = [
    tool.querySelector('.quota'),
    tool.querySelector('.toolHead'),
    document.getElementById('videoOptions'),
    document.getElementById('dropzone'),
    document.getElementById('workspace'),
  ].filter(Boolean);
  const visibilityMemory = new Map();
  let upscaleActive = false;
  let sourceFile = null;
  let sourceUrl = null;
  let resultUrl = null;
  let resultBlob = null;
  let running = false;

  const $ = (id) => document.getElementById(id);
  const msg = (text, type = '') => {
    $('upscaleMessage').textContent = text;
    $('upscaleMessage').className = `gwUpscaleMessage ${type}`;
  };

  const showUpscale = () => {
    upscaleActive = true;
    upscaleTab.classList.add('active');
    imageTab?.classList.remove('active');
    videoTab?.classList.remove('active');
    regularNodes.forEach((node) => {
      visibilityMemory.set(node, node.classList.contains('hidden'));
      node.classList.add('hidden');
    });
    panel.classList.remove('hidden');
  };

  const hideUpscale = () => {
    if (!upscaleActive) return;
    upscaleActive = false;
    upscaleTab.classList.remove('active');
    panel.classList.add('hidden');
    regularNodes.forEach((node) => {
      if (visibilityMemory.get(node) === false) node.classList.remove('hidden');
    });
    visibilityMemory.clear();
  };

  upscaleTab.addEventListener('click', showUpscale);
  imageTab?.addEventListener('click', hideUpscale, { capture: true });
  videoTab?.addEventListener('click', hideUpscale, { capture: true });

  const revoke = () => {
    if (sourceUrl) URL.revokeObjectURL(sourceUrl);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    sourceUrl = null;
    resultUrl = null;
    resultBlob = null;
  };

  const reset = () => {
    if (running) return;
    revoke();
    sourceFile = null;
    $('upscaleBefore').removeAttribute('src');
    $('upscaleAfter').removeAttribute('src');
    $('upscaleAfter').classList.add('hidden');
    $('upscaleWorkspace').classList.add('hidden');
    $('upscaleDropzone').classList.remove('hidden');
    $('upscaleStart').classList.remove('hidden');
    $('upscaleDownload').classList.add('hidden');
    $('upscaleOutputMeta').textContent = 'Ready';
    $('upscaleProgressBar').style.width = '0%';
    $('upscaleProgressText').textContent = '0%';
    msg('');
  };

  const loadMetadata = (file) => new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const url = URL.createObjectURL(file);
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;
    video.onloadedmetadata = () => {
      const data = { width: video.videoWidth, height: video.videoHeight, duration: video.duration };
      URL.revokeObjectURL(url);
      resolve(data);
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('This video format could not be read in your browser. Try MP4 or WebM.'));
    };
    video.src = url;
  });

  const chooseFile = async (file) => {
    if (!file || !file.type.startsWith('video/')) return msg('Please choose a video file.', 'error');
    if (file.size > 250 * 1024 * 1024) return msg('Video is larger than 250 MB.', 'error');
    if (running) return;

    reset();
    try {
      const meta = await loadMetadata(file);
      if (!meta.width || !meta.height || !Number.isFinite(meta.duration)) throw new Error('Could not read video dimensions.');
      const outputWidth = meta.width * 2;
      const outputHeight = meta.height * 2;
      if (Math.max(outputWidth, outputHeight) > 4096) {
        throw new Error(`2× output would be ${outputWidth}×${outputHeight}. For browser stability, this upscaler currently supports a maximum 4096px long edge.`);
      }
      sourceFile = file;
      sourceUrl = URL.createObjectURL(file);
      $('upscaleBefore').src = sourceUrl;
      $('upscaleOriginalMeta').textContent = `${meta.width}×${meta.height} · ${(file.size / 1024 / 1024).toFixed(1)} MB`;
      $('upscaleOutputMeta').textContent = `${outputWidth}×${outputHeight}`;
      $('upscaleDropzone').classList.add('hidden');
      $('upscaleWorkspace').classList.remove('hidden');
      msg('Ready for 2× high-quality upscale. Processing runs in real time in your browser.');
    } catch (error) {
      sourceFile = null;
      msg(error?.message || 'Could not open this video.', 'error');
    }
  };

  const bestRecorderType = () => {
    const types = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8,opus',
      'video/webm;codecs=vp8',
      'video/webm',
    ];
    return types.find((type) => window.MediaRecorder?.isTypeSupported?.(type)) || '';
  };

  const upscaleVideo = async () => {
    if (!sourceFile || running) return;
    if (!window.MediaRecorder || !HTMLCanvasElement.prototype.captureStream) {
      return msg('2× video export is not supported by this browser. Please use the latest Chrome or Edge.', 'error');
    }

    running = true;
    $('upscaleStart').disabled = true;
    $('upscaleAnother').disabled = true;
    $('upscaleProcessing').classList.remove('hidden');
    $('upscaleAfter').classList.add('hidden');
    msg('');

    const workVideo = document.createElement('video');
    const workUrl = URL.createObjectURL(sourceFile);
    workVideo.src = workUrl;
    workVideo.preload = 'auto';
    workVideo.playsInline = true;
    workVideo.muted = false;
    workVideo.volume = 0;

    try {
      await new Promise((resolve, reject) => {
        workVideo.onloadedmetadata = resolve;
        workVideo.onerror = () => reject(new Error('Could not decode this video for upscaling.'));
      });

      const outW = workVideo.videoWidth * 2;
      const outH = workVideo.videoHeight * 2;
      const duration = workVideo.duration || 1;
      const canvas = document.createElement('canvas');
      canvas.width = outW;
      canvas.height = outH;
      const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });
      if (!ctx) throw new Error('Could not start the browser video renderer.');
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      const fps = 30;
      const canvasStream = canvas.captureStream(fps);
      let sourceStream = null;
      try {
        sourceStream = typeof workVideo.captureStream === 'function' ? workVideo.captureStream() : (typeof workVideo.mozCaptureStream === 'function' ? workVideo.mozCaptureStream() : null);
      } catch {}
      const audioTracks = sourceStream?.getAudioTracks?.() || [];
      const outputStream = new MediaStream([...canvasStream.getVideoTracks(), ...audioTracks]);
      const mimeType = bestRecorderType();
      const pixels = outW * outH;
      const videoBitsPerSecond = Math.min(36_000_000, Math.max(10_000_000, Math.round(pixels * 4)));
      const recorder = new MediaRecorder(outputStream, {
        ...(mimeType ? { mimeType } : {}),
        videoBitsPerSecond,
        audioBitsPerSecond: 192_000,
      });
      const chunks = [];
      recorder.ondataavailable = (event) => { if (event.data?.size) chunks.push(event.data); };

      let drawStopped = false;
      const draw = () => {
        if (drawStopped) return;
        try { ctx.drawImage(workVideo, 0, 0, outW, outH); } catch {}
        const pct = Math.max(0, Math.min(99, Math.round((workVideo.currentTime / duration) * 100)));
        $('upscaleProgressBar').style.width = `${pct}%`;
        $('upscaleProgressText').textContent = `${pct}%`;
        $('upscaleProcessingSub').textContent = `${workVideo.videoWidth}×${workVideo.videoHeight} → ${outW}×${outH}`;
        if ('requestVideoFrameCallback' in workVideo) workVideo.requestVideoFrameCallback(draw);
        else requestAnimationFrame(draw);
      };

      const done = new Promise((resolve, reject) => {
        recorder.onerror = () => reject(recorder.error || new Error('Video export failed.'));
        recorder.onstop = resolve;
      });

      workVideo.onended = () => {
        drawStopped = true;
        $('upscaleProgressBar').style.width = '100%';
        $('upscaleProgressText').textContent = '100%';
        setTimeout(() => { if (recorder.state !== 'inactive') recorder.stop(); }, 120);
      };

      recorder.start(1000);
      draw();
      await workVideo.play();
      await done;

      if (!chunks.length) throw new Error('Browser did not produce an output video.');
      resultBlob = new Blob(chunks, { type: recorder.mimeType || 'video/webm' });
      if (resultUrl) URL.revokeObjectURL(resultUrl);
      resultUrl = URL.createObjectURL(resultBlob);
      $('upscaleAfter').src = resultUrl;
      $('upscaleAfter').classList.remove('hidden');
      $('upscaleProcessing').classList.add('hidden');
      $('upscaleStart').classList.add('hidden');
      $('upscaleDownload').classList.remove('hidden');
      $('upscaleOutputMeta').textContent = `${outW}×${outH} · ${(resultBlob.size / 1024 / 1024).toFixed(1)} MB`;
      msg(audioTracks.length ? '2× High Quality video is ready with audio.' : '2× High Quality video is ready. This browser could not preserve the source audio track.', 'ok');
    } catch (error) {
      $('upscaleProcessing').classList.add('hidden');
      msg(error?.message || 'Upscaling failed. Try a shorter MP4/WebM video in Chrome.', 'error');
    } finally {
      workVideo.pause();
      workVideo.removeAttribute('src');
      workVideo.load();
      URL.revokeObjectURL(workUrl);
      running = false;
      $('upscaleStart').disabled = false;
      $('upscaleAnother').disabled = false;
    }
  };

  const fileInput = $('upscaleFileInput');
  const dropzone = $('upscaleDropzone');
  dropzone.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => chooseFile(fileInput.files?.[0]));
  for (const type of ['dragenter', 'dragover']) {
    dropzone.addEventListener(type, (event) => { event.preventDefault(); dropzone.classList.add('drag'); });
  }
  for (const type of ['dragleave', 'drop']) {
    dropzone.addEventListener(type, (event) => { event.preventDefault(); dropzone.classList.remove('drag'); });
  }
  dropzone.addEventListener('drop', (event) => chooseFile(event.dataTransfer?.files?.[0]));
  $('upscaleAnother').addEventListener('click', reset);
  $('upscaleStart').addEventListener('click', upscaleVideo);
  $('upscaleDownload').addEventListener('click', () => {
    if (!resultBlob || !resultUrl) return;
    const a = document.createElement('a');
    const base = (sourceFile?.name || 'video').replace(/\.[^.]+$/, '');
    a.href = resultUrl;
    a.download = `${base}-2x-hq.webm`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  });
}

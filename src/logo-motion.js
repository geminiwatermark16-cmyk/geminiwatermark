(() => {
  const input = document.getElementById('logoInput');
  const preview = document.getElementById('logoPreview');
  const empty = document.getElementById('emptyState');
  const stage = document.getElementById('stage');
  const stageWrap = document.getElementById('stageWrap');
  const exportBtn = document.getElementById('exportBtn');
  const replayBtn = document.getElementById('replayBtn');
  const status = document.getElementById('status');
  const previewLabel = document.getElementById('previewLabel');
  const duration = document.getElementById('duration');
  const durationValue = document.getElementById('durationValue');
  const intensity = document.getElementById('intensity');
  const intensityValue = document.getElementById('intensityValue');
  const bgColor = document.getElementById('bgColor');
  const bgHex = document.getElementById('bgHex');

  let currentAnimation = 'pulse';
  let currentRatio = '1:1';
  let objectUrl = '';

  const animationMap = {
    pulse: 'lmPulse', reveal: 'lmReveal', spin: 'lmSpin', bounce: 'lmBounce', glow: 'lmGlow', float: 'lmFloat'
  };
  const animationNames = {
    pulse: '3D Pulse', reveal: 'Soft Reveal', spin: 'Spin In', bounce: 'Bounce', glow: 'Neon Glow', float: 'Float'
  };

  function updateLabel() {
    previewLabel.textContent = `${animationNames[currentAnimation]} · ${currentRatio}`;
  }

  function play() {
    if (preview.hidden) return;
    const seconds = Number(duration.value);
    const strength = Number(intensity.value) / 70;
    preview.style.animation = 'none';
    preview.offsetHeight;
    preview.style.transformOrigin = 'center';
    preview.style.animation = `${animationMap[currentAnimation]} ${seconds}s cubic-bezier(.2,.8,.2,1) both`;
    preview.style.setProperty('--lm-strength', strength);
  }

  input.addEventListener('change', () => {
    const file = input.files?.[0];
    if (!file) return;
    if (!['image/png','image/svg+xml','image/webp'].includes(file.type)) {
      status.textContent = 'Please choose a PNG, SVG or WebP logo.';
      return;
    }
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    objectUrl = URL.createObjectURL(file);
    preview.src = objectUrl;
    preview.hidden = false;
    empty.hidden = true;
    exportBtn.disabled = false;
    status.textContent = `${file.name} ready.`;
    preview.onload = play;
  });

  document.getElementById('animationGrid').addEventListener('click', (event) => {
    const button = event.target.closest('button[data-animation]');
    if (!button) return;
    document.querySelectorAll('#animationGrid button').forEach((b) => b.classList.remove('active'));
    button.classList.add('active');
    currentAnimation = button.dataset.animation;
    updateLabel();
    play();
  });

  document.getElementById('ratioGroup').addEventListener('click', (event) => {
    const button = event.target.closest('button[data-ratio]');
    if (!button) return;
    document.querySelectorAll('#ratioGroup button').forEach((b) => b.classList.remove('active'));
    button.classList.add('active');
    currentRatio = button.dataset.ratio;
    stageWrap.classList.remove('square','portrait','landscape');
    stageWrap.classList.add(currentRatio === '9:16' ? 'portrait' : currentRatio === '16:9' ? 'landscape' : 'square');
    updateLabel();
    play();
  });

  duration.addEventListener('input', () => { durationValue.textContent = `${Number(duration.value).toFixed(1)}s`; play(); });
  intensity.addEventListener('input', () => {
    intensityValue.textContent = `${intensity.value}%`;
    const amount = Number(intensity.value);
    preview.style.maxWidth = `${Math.min(78, 46 + amount * .23)}%`;
    preview.style.maxHeight = `${Math.min(78, 46 + amount * .23)}%`;
    play();
  });
  replayBtn.addEventListener('click', play);

  function setBg(value) {
    if (!/^#[0-9a-f]{6}$/i.test(value)) return;
    stage.style.background = value;
    bgColor.value = value;
    bgHex.value = value.toLowerCase();
  }
  bgColor.addEventListener('input', () => setBg(bgColor.value));
  bgHex.addEventListener('change', () => setBg(bgHex.value.trim()));

  function getCanvasSize() {
    if (currentRatio === '9:16') return [720, 1280];
    if (currentRatio === '16:9') return [1280, 720];
    return [900, 900];
  }

  async function exportWebM() {
    if (!preview.src || !window.MediaRecorder) {
      status.textContent = 'WebM export is not supported in this browser.';
      return;
    }
    exportBtn.disabled = true;
    exportBtn.textContent = 'Rendering…';
    status.textContent = 'Rendering locally in your browser…';

    try {
      const [w, h] = getCanvasSize();
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d');
      const stream = canvas.captureStream(30);
      const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? 'video/webm;codecs=vp9' : 'video/webm';
      const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 6000000 });
      const chunks = [];
      recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      const done = new Promise((resolve) => recorder.onstop = resolve);
      const total = Number(duration.value) * 1000;
      const started = performance.now();
      recorder.start(100);

      function easeOutBack(t) {
        const c1 = 1.70158, c3 = c1 + 1;
        return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
      }
      function drawFrame(now) {
        const elapsed = Math.min(total, now - started);
        const t = Math.min(1, elapsed / total);
        ctx.fillStyle = bgColor.value;
        ctx.fillRect(0, 0, w, h);
        const image = preview;
        const iw = image.naturalWidth || 1, ih = image.naturalHeight || 1;
        const base = Math.min(w / iw, h / ih) * .56;
        let scale = 1, opacity = 1, rotation = 0, y = 0;
        const e = easeOutBack(Math.min(1, t * 1.4));
        if (currentAnimation === 'pulse') scale = .72 + .28 * e;
        if (currentAnimation === 'reveal') { scale = .9 + .1 * e; opacity = Math.min(1, t * 3); y = (1 - e) * 40; }
        if (currentAnimation === 'spin') { scale = .35 + .65 * e; opacity = Math.min(1, t * 4); rotation = (-140 + 140 * e) * Math.PI / 180; }
        if (currentAnimation === 'bounce') { scale = .72 + .28 * e; opacity = Math.min(1, t * 4); y = (1 - e) * -130; }
        if (currentAnimation === 'glow') { scale = .88 + .12 * e; opacity = .25 + .75 * Math.min(1, t * 3); ctx.shadowColor = 'rgba(130,155,255,.95)'; ctx.shadowBlur = 10 + 45 * Math.sin(Math.min(1,t) * Math.PI); }
        if (currentAnimation === 'float') { scale = .94 + .06 * e; opacity = Math.min(1, t * 3); y = (1 - e) * 34 - Math.sin(t * Math.PI) * 8; }
        const dw = iw * base * scale, dh = ih * base * scale;
        ctx.save(); ctx.globalAlpha = opacity; ctx.translate(w/2, h/2 + y); ctx.rotate(rotation); ctx.drawImage(image, -dw/2, -dh/2, dw, dh); ctx.restore();
        ctx.shadowBlur = 0;
        if (elapsed < total) requestAnimationFrame(drawFrame); else recorder.stop();
      }
      requestAnimationFrame(drawFrame);
      await done;
      const blob = new Blob(chunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `logo-motion-${currentAnimation}-${currentRatio.replace(':','x')}.webm`; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      status.textContent = 'Export complete.';
    } catch (error) {
      console.error(error);
      status.textContent = 'Export failed in this browser. Try Chrome or Edge.';
    } finally {
      exportBtn.disabled = false;
      exportBtn.textContent = 'Export WebM';
    }
  }

  exportBtn.addEventListener('click', exportWebM);
  updateLabel();
})();
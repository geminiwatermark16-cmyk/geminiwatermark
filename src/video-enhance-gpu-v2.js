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
if (panel && panel.dataset.gpuEnhance !== 'v2') {
  panel.dataset.gpuEnhance = 'v2';

  const $ = (id) => document.getElementById(id);
  const fileInput = $('upscaleFileInput');
  const beforeVideo = $('upscaleBefore');
  const afterVideo = $('upscaleAfter');
  const processing = $('upscaleProcessing');
  const processingTitle = $('upscaleProcessingTitle');
  const processingSub = $('upscaleProcessingSub');
  const progressBar = $('upscaleProgressBar');
  const progressText = $('upscaleProgressText');
  const message = $('upscaleMessage');
  const outputMeta = $('upscaleOutputMeta');
  const anotherButton = $('upscaleAnother');

  const replaceButton = (id) => {
    const old = $(id);
    if (!old) return null;
    const clone = old.cloneNode(true);
    old.replaceWith(clone);
    return clone;
  };

  const startButton = replaceButton('upscaleStart');
  const downloadButton = replaceButton('upscaleDownload');

  if (startButton) startButton.textContent = 'Enhance 2× — GPU Detail Boost ✦';
  if (downloadButton) downloadButton.textContent = 'Download MP4 ↓';

  const tab = $('upscaleTab');
  if (tab) tab.innerHTML = '<span>Video Enhance</span><b>2× SHARPER</b><i>FAST</i>';

  const heroSmall = panel.querySelector('.gwUpscaleHero small');
  const heroTitle = panel.querySelector('.gwUpscaleHero h2');
  const heroCopy = panel.querySelector('.gwUpscaleHero p');
  const heroPill = panel.querySelector('.gwUpscalePill');
  if (heroSmall) heroSmall.textContent = 'GPU VIDEO ENHANCEMENT · 2×';
  if (heroTitle) heroTitle.textContent = '2× resolution with real edge and detail enhancement';
  if (heroCopy) heroCopy.textContent = 'Uses your GPU to upscale every frame, add local detail sharpening, mild contrast recovery and cleaner perceived edges without loading a heavy AI model that can freeze Chrome.';
  if (heroPill) heroPill.textContent = '⚡ GPU Fast';

  const trust = panel.querySelector('.gwUpscaleTrust');
  if (trust) {
    trust.innerHTML = '<span>● On-device GPU</span><span>2× resolution</span><span>Edge detail boost</span><span>Contrast recovery</span><span>MP4 output</span>';
  }

  let resultBlob = null;
  let resultUrl = null;
  let selectedFile = fileInput?.files?.[0] || null;
  let running = false;

  const setMessage = (text, type = '') => {
    if (!message) return;
    message.textContent = text;
    message.className = `gwUpscaleMessage ${type}`;
  };

  const setProgress = (pct, label = '') => {
    const value = Math.max(0, Math.min(100, Math.round(Number(pct) || 0)));
    if (progressBar) progressBar.style.width = `${value}%`;
    if (progressText) progressText.textContent = `${value}%`;
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
    startButton?.classList.remove('hidden');
    downloadButton?.classList.add('hidden');
  };

  const isVideoLike = (file) => {
    if (!file) return false;
    if (String(file.type || '').startsWith('video/')) return true;
    return /\.(mp4|webm|mov|m4v)$/i.test(file.name || '');
  };

  fileInput?.addEventListener('change', () => {
    const picked = fileInput.files?.[0];
    if (picked) selectedFile = picked;
    if (!running) clearResult();
  });

  document.getElementById('upscaleDropzone')?.addEventListener('drop', (event) => {
    const dropped = event.dataTransfer?.files?.[0];
    if (dropped) selectedFile = dropped;
  }, { capture: true });

  anotherButton?.addEventListener('click', () => {
    if (running) return;
    selectedFile = null;
    clearResult();
  });

  const resolveSourceFile = async () => {
    const inputFile = fileInput?.files?.[0];
    if (isVideoLike(inputFile)) {
      selectedFile = inputFile;
      return inputFile;
    }
    if (isVideoLike(selectedFile)) return selectedFile;

    const src = beforeVideo?.currentSrc || beforeVideo?.src || '';
    if (src.startsWith('blob:')) {
      const response = await fetch(src);
      if (!response.ok) throw new Error('Could not reopen the selected local video. Choose the video again.');
      const blob = await response.blob();
      selectedFile = new File([blob], 'selected-video.mp4', {
        type: blob.type || 'video/mp4',
        lastModified: Date.now(),
      });
      return selectedFile;
    }
    return null;
  };

  const compileShader = (gl, type, source) => {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const info = gl.getShaderInfoLog(shader) || 'Shader compilation failed.';
      gl.deleteShader(shader);
      throw new Error(info);
    }
    return shader;
  };

  const createGpuRenderer = (canvas, sourceWidth, sourceHeight) => {
    const gl = canvas.getContext('webgl', {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      preserveDrawingBuffer: false,
      powerPreference: 'high-performance',
    });
    if (!gl) throw new Error('WebGL GPU enhancement is not available in this browser.');

    const vertexSource = `
      attribute vec2 a_position;
      attribute vec2 a_uv;
      varying vec2 v_uv;
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
        v_uv = a_uv;
      }
    `;

    const fragmentSource = `
      precision highp float;
      uniform sampler2D u_texture;
      uniform vec2 u_texel;
      varying vec2 v_uv;

      void main() {
        vec3 c  = texture2D(u_texture, v_uv).rgb;
        vec3 l  = texture2D(u_texture, v_uv + vec2(-u_texel.x, 0.0)).rgb;
        vec3 r  = texture2D(u_texture, v_uv + vec2( u_texel.x, 0.0)).rgb;
        vec3 u  = texture2D(u_texture, v_uv + vec2(0.0, -u_texel.y)).rgb;
        vec3 d  = texture2D(u_texture, v_uv + vec2(0.0,  u_texel.y)).rgb;
        vec3 ul = texture2D(u_texture, v_uv + vec2(-u_texel.x, -u_texel.y)).rgb;
        vec3 ur = texture2D(u_texture, v_uv + vec2( u_texel.x, -u_texel.y)).rgb;
        vec3 dl = texture2D(u_texture, v_uv + vec2(-u_texel.x,  u_texel.y)).rgb;
        vec3 dr = texture2D(u_texture, v_uv + vec2( u_texel.x,  u_texel.y)).rgb;

        vec3 localAverage = (l + r + u + d + ul + ur + dl + dr) * 0.125;
        vec3 detail = c - localAverage;
        vec3 enhanced = c + detail * 0.58;

        float lum = dot(enhanced, vec3(0.2126, 0.7152, 0.0722));
        enhanced = mix(vec3(lum), enhanced, 1.045);
        enhanced = (enhanced - 0.5) * 1.04 + 0.5;

        gl_FragColor = vec4(clamp(enhanced, 0.0, 1.0), 1.0);
      }
    `;

    const program = gl.createProgram();
    gl.attachShader(program, compileShader(gl, gl.VERTEX_SHADER, vertexSource));
    gl.attachShader(program, compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(program) || 'GPU enhancement program could not start.');
    }
    gl.useProgram(program);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
       1,  1,
    ]), gl.STATIC_DRAW);
    const positionLocation = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    const uvBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      0, 0,
      1, 0,
      0, 1,
      1, 1,
    ]), gl.STATIC_DRAW);
    const uvLocation = gl.getAttribLocation(program, 'a_uv');
    gl.enableVertexAttribArray(uvLocation);
    gl.vertexAttribPointer(uvLocation, 2, gl.FLOAT, false, 0, 0);

    const texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

    const textureLocation = gl.getUniformLocation(program, 'u_texture');
    gl.uniform1i(textureLocation, 0);
    const texelLocation = gl.getUniformLocation(program, 'u_texel');
    gl.uniform2f(texelLocation, 1 / sourceWidth, 1 / sourceHeight);
    gl.viewport(0, 0, canvas.width, canvas.height);

    return {
      render(video) {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      },
      destroy() {
        gl.deleteTexture(texture);
        gl.deleteBuffer(positionBuffer);
        gl.deleteBuffer(uvBuffer);
        gl.deleteProgram(program);
      },
    };
  };

  const pickRecorderType = () => {
    const candidates = [
      'video/mp4;codecs=avc1.4d0033,mp4a.40.2',
      'video/mp4;codecs=avc1.4d0033',
      'video/mp4',
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp9',
      'video/webm',
    ];
    return candidates.find((type) => window.MediaRecorder?.isTypeSupported?.(type)) || '';
  };

  const runEnhance = async () => {
    if (running) return;

    let file;
    try {
      file = await resolveSourceFile();
    } catch (error) {
      setMessage(error?.message || 'Choose the video again.', 'error');
      return;
    }

    if (!isVideoLike(file)) {
      setMessage('Choose a video first.', 'error');
      return;
    }
    if (!window.MediaRecorder || !HTMLCanvasElement.prototype.captureStream) {
      setMessage('GPU video export is not supported by this browser. Please use the latest Chrome or Edge.', 'error');
      return;
    }

    running = true;
    clearResult();
    startButton.disabled = true;
    if (anotherButton) anotherButton.disabled = true;
    if (fileInput) fileInput.disabled = true;
    processing?.classList.remove('hidden');
    if (processingTitle) processingTitle.textContent = 'Starting GPU enhancement…';
    setProgress(0, 'Preparing video');
    setMessage('Enhancing every frame with 2× GPU scaling plus local detail and edge recovery.');

    const workVideo = document.createElement('video');
    const workUrl = URL.createObjectURL(file);
    workVideo.src = workUrl;
    workVideo.preload = 'auto';
    workVideo.playsInline = true;
    workVideo.muted = false;
    workVideo.volume = 0;

    let renderer = null;
    let drawStopped = false;

    try {
      await new Promise((resolve, reject) => {
        workVideo.onloadedmetadata = resolve;
        workVideo.onerror = () => reject(new Error('Could not decode this video. Try MP4 or WebM.'));
      });

      const sourceWidth = workVideo.videoWidth;
      const sourceHeight = workVideo.videoHeight;
      const outWidth = sourceWidth * 2;
      const outHeight = sourceHeight * 2;
      const duration = Math.max(0.001, Number(workVideo.duration) || 1);

      if (!sourceWidth || !sourceHeight) throw new Error('Could not read video dimensions.');
      if (Math.max(outWidth, outHeight) > 4096) {
        throw new Error(`2× output would be ${outWidth}×${outHeight}. Current browser-safe limit is 4096px on the long edge.`);
      }

      const canvas = document.createElement('canvas');
      canvas.width = outWidth;
      canvas.height = outHeight;
      renderer = createGpuRenderer(canvas, sourceWidth, sourceHeight);

      const fps = 30;
      const canvasStream = canvas.captureStream(fps);
      let sourceStream = null;
      try {
        sourceStream = typeof workVideo.captureStream === 'function'
          ? workVideo.captureStream()
          : (typeof workVideo.mozCaptureStream === 'function' ? workVideo.mozCaptureStream() : null);
      } catch {}
      const audioTracks = sourceStream?.getAudioTracks?.() || [];
      const outputStream = new MediaStream([...canvasStream.getVideoTracks(), ...audioTracks]);

      const mimeType = pickRecorderType();
      const pixels = outWidth * outHeight;
      const videoBitsPerSecond = Math.min(32_000_000, Math.max(14_000_000, Math.round(pixels * 4.2)));
      const recorder = new MediaRecorder(outputStream, {
        ...(mimeType ? { mimeType } : {}),
        videoBitsPerSecond,
        audioBitsPerSecond: 192_000,
      });

      const chunks = [];
      recorder.ondataavailable = (event) => {
        if (event.data?.size) chunks.push(event.data);
      };

      const done = new Promise((resolve, reject) => {
        recorder.onerror = () => reject(recorder.error || new Error('Video export failed.'));
        recorder.onstop = resolve;
      });

      const renderFrame = () => {
        if (drawStopped) return;
        try { renderer.render(workVideo); } catch {}
        const pct = Math.max(0, Math.min(99, Math.round((workVideo.currentTime / duration) * 100)));
        if (processingTitle) processingTitle.textContent = `Enhancing video… ${pct}%`;
        setProgress(pct, `${sourceWidth}×${sourceHeight} → ${outWidth}×${outHeight} · GPU detail boost`);
        if ('requestVideoFrameCallback' in workVideo) {
          workVideo.requestVideoFrameCallback(renderFrame);
        } else {
          requestAnimationFrame(renderFrame);
        }
      };

      workVideo.onended = () => {
        drawStopped = true;
        setProgress(100, 'Finalizing enhanced MP4');
        setTimeout(() => {
          if (recorder.state !== 'inactive') recorder.stop();
        }, 150);
      };

      renderer.render(workVideo);
      recorder.start(1000);
      renderFrame();
      await workVideo.play();
      await done;

      if (!chunks.length) throw new Error('Browser did not produce an enhanced output video.');

      resultBlob = new Blob(chunks, { type: recorder.mimeType || mimeType || 'video/mp4' });
      resultUrl = URL.createObjectURL(resultBlob);
      if (afterVideo) {
        afterVideo.src = resultUrl;
        afterVideo.classList.remove('hidden');
      }
      processing?.classList.add('hidden');
      startButton.classList.add('hidden');
      downloadButton?.classList.remove('hidden');
      if (outputMeta) outputMeta.textContent = `${outWidth}×${outHeight} · GPU Enhanced · ${(resultBlob.size / 1024 / 1024).toFixed(1)} MB`;
      setProgress(100, 'GPU enhancement complete');
      setMessage(audioTracks.length
        ? 'Enhanced video is ready: 2× resolution + sharper local detail + preserved audio.'
        : 'Enhanced video is ready: 2× resolution + sharper local detail. Source audio was not available to the browser capture pipeline.', 'ok');
    } catch (error) {
      processing?.classList.add('hidden');
      setMessage(error?.message || 'GPU enhancement failed. Try a shorter MP4 in the latest Chrome.', 'error');
    } finally {
      drawStopped = true;
      renderer?.destroy?.();
      workVideo.pause();
      workVideo.removeAttribute('src');
      workVideo.load();
      URL.revokeObjectURL(workUrl);
      running = false;
      startButton.disabled = false;
      if (anotherButton) anotherButton.disabled = false;
      if (fileInput) fileInput.disabled = false;
    }
  };

  startButton?.addEventListener('click', runEnhance);

  downloadButton?.addEventListener('click', (event) => {
    event.preventDefault();
    if (!resultBlob || !resultUrl) return;
    const name = selectedFile?.name || fileInput?.files?.[0]?.name || 'video';
    const base = name.replace(/\.[^.]+$/, '') || 'video';
    const isMp4 = String(resultBlob.type || '').toLowerCase().includes('mp4');
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = `${base}-2x-enhanced.${isMp4 ? 'mp4' : 'webm'}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setMessage('Enhanced video downloaded.', 'ok');
  });
}

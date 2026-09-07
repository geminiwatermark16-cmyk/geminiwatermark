(() => {
  const CSS_HREF = '/src/subtitle-studio.css?v=20260907-1';

  function ensureStyles() {
    if (document.querySelector(`link[href*="subtitle-studio.css"]`)) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = CSS_HREF;
    document.head.appendChild(link);
  }

  // State
  let videoFile = null;
  let cues = [
    { start: 0.0, end: 2.5, text: "AI GENERATED VIDEO" },
    { start: 2.5, end: 5.0, text: "CLEANED AND CAPTIONED" },
    { start: 5.0, end: 8.0, text: "READY FOR SOCIAL MEDIA 🔥" }
  ];
  let currentStyle = 'viral';
  let currentPos = 'bottom';
  let currentSize = 22;

  function formatTime(secs) {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    const ms = Math.floor((secs % 1) * 10);
    return `${m}:${s.toString().padStart(2, '0')}.${ms}`;
  }

  function initSubtitleStudio() {
    const tabs = document.querySelector('#tool .tabs');
    const tool = document.getElementById('tool');
    const dropzone = document.getElementById('dropzone');
    const toolHead = tool?.querySelector('.toolHead');
    const quota = tool?.querySelector('.quota');
    const singleWorkspace = document.getElementById('workspace');

    if (!tabs || !tool || document.getElementById('subtitlesTab')) return;

    // Add Tab
    const subTab = document.createElement('button');
    subTab.id = 'subtitlesTab';
    subTab.type = 'button';
    subTab.innerHTML = 'Auto Subtitles <b>New</b>';
    tabs.appendChild(subTab);

    // Create Studio Panel
    const panel = document.createElement('div');
    panel.id = 'subtitlesPanel';
    panel.className = 'gw-subtitles-panel';
    panel.innerHTML = `
      <div class="gw-sub-studio-grid">
        <!-- Left: Video & Live Overlay Preview -->
        <div class="gw-sub-preview-wrap">
          <div class="gw-sub-video-container" id="gwSubVideoContainer">
            <video id="gwSubVideo" playsinline preload="metadata"></video>
            <div id="gwSubOverlay" class="gw-sub-overlay pos-bottom">
              <span id="gwSubText" class="gw-sub-text gw-style-viral" style="font-size: ${currentSize}px;">SAMPLE CAPTION</span>
            </div>
          </div>
          <div style="padding: 14px; background: #fff; border-top: 1px solid #eee;">
            <div class="gw-sub-actions-bar">
              <button id="gwBurnSubBtn" class="gw-sub-btn primary" type="button">🔥 Burn Subtitles & Download Video</button>
              <button id="gwExportSrtBtn" class="gw-sub-btn secondary" type="button">Export .SRT</button>
              <button id="gwExportVttBtn" class="gw-sub-btn secondary" type="button">Export .VTT</button>
            </div>
            <div id="gwBurnProgress" style="display:none; margin-top:10px; font-size:11px; font-weight:700; color:#10b981;">
              Rendering captioned video… <span id="gwBurnPct">0%</span>
            </div>
          </div>
        </div>

        <!-- Right: Studio Controls -->
        <div class="gw-sub-controls">
          <!-- Video Source -->
          <div class="gw-sub-section">
            <h4>1. Video Source</h4>
            <div style="display:flex; gap:8px; flex-wrap:wrap;">
              <input type="file" id="gwSubFileInput" accept="video/mp4,video/webm,video/quicktime" hidden>
              <button class="gw-sub-btn secondary" type="button" onclick="document.getElementById('gwSubFileInput').click()">📁 Choose Video File</button>
              <button id="gwUseCleanedVideoBtn" class="gw-sub-btn magic" type="button" style="display:none;">✨ Use Cleaned Video</button>
            </div>
            <p id="gwSubFileMeta" style="margin:8px 0 0; font-size:11px; color:#666;">Select a video to generate and style subtitles.</p>
          </div>

          <!-- Auto Transcription -->
          <div class="gw-sub-section">
            <h4>2. AI Auto-Transcription</h4>
            <div style="display:flex; gap:8px; align-items:center;">
              <select id="gwSubLang" style="padding:8px 12px; border-radius:8px; border:1px solid #ccc; font-size:12px;">
                <option value="en-US">English (US)</option>
                <option value="en-IN">English (India)</option>
                <option value="hi-IN">Hindi (हिंदी)</option>
                <option value="es-ES">Spanish</option>
              </select>
              <button id="gwAutoTranscribeBtn" class="gw-sub-btn magic" type="button">✨ Auto-Transcribe Audio</button>
            </div>
            <p id="gwTranscribeStatus" style="margin:8px 0 0; font-size:11px; color:#666;">Transcribes spoken words automatically using browser speech recognition.</p>
          </div>

          <!-- Subtitle Styling Presets -->
          <div class="gw-sub-section">
            <h4>3. Viral Subtitle Styles</h4>
            <div class="gw-preset-buttons">
              <button type="button" class="gw-preset-btn active" data-style="viral">⚡ Viral Reel</button>
              <button type="button" class="gw-preset-btn" data-style="hormozi">🔥 Hormozi</button>
              <button type="button" class="gw-preset-btn" data-style="minimal">✦ Minimal</button>
              <button type="button" class="gw-preset-btn" data-style="neon">🌟 Neon</button>
            </div>

            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:14px;">
              <span style="font-size:12px; font-weight:700; color:#444;">Position:</span>
              <div style="display:flex; gap:6px;">
                <button type="button" class="gw-pos-btn gw-sub-btn secondary" data-pos="bottom" style="padding:4px 10px; font-size:11px;">Bottom</button>
                <button type="button" class="gw-pos-btn gw-sub-btn secondary" data-pos="middle" style="padding:4px 10px; font-size:11px;">Center</button>
                <button type="button" class="gw-pos-btn gw-sub-btn secondary" data-pos="top" style="padding:4px 10px; font-size:11px;">Top</button>
              </div>
            </div>

            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:10px;">
              <span style="font-size:12px; font-weight:700; color:#444;">Font Size:</span>
              <input type="range" id="gwFontSizeSlider" min="14" max="44" value="${currentSize}" style="width:140px;">
            </div>
          </div>

          <!-- Caption Timeline Editor -->
          <div class="gw-sub-section">
            <h4>
              <span>4. Subtitle Timeline</span>
              <button id="gwAddCueBtn" class="gw-sub-btn secondary" type="button" style="padding:3px 8px; font-size:10px;">+ Add Line</button>
            </h4>
            <div id="gwCueList" class="gw-cue-list"></div>
          </div>
        </div>
      </div>
    `;

    if (singleWorkspace) {
      singleWorkspace.parentNode.insertBefore(panel, singleWorkspace.nextSibling);
    } else {
      tool.appendChild(panel);
    }

    // Tab Navigation
    const imageTab = document.getElementById('imageTab');
    const videoTab = document.getElementById('videoTab');
    const linkTab = document.getElementById('linkTab');
    const linkPanel = document.getElementById('linkPanel');

    function selectSubtitlesTab() {
      imageTab?.classList.remove('active');
      videoTab?.classList.remove('active');
      linkTab?.classList.remove('active');
      subTab.classList.add('active');

      if (dropzone) dropzone.style.display = 'none';
      if (toolHead) toolHead.style.display = 'none';
      if (quota) quota.style.display = 'none';
      if (linkPanel) linkPanel.classList.remove('active');
      panel.classList.add('active');
    }

    subTab.addEventListener('click', selectSubtitlesTab);

    [imageTab, videoTab, linkTab].forEach((t) => {
      t?.addEventListener('click', () => {
        subTab.classList.remove('active');
        panel.classList.remove('active');
      });
    });

    // Elements
    const video = document.getElementById('gwSubVideo');
    const overlay = document.getElementById('gwSubOverlay');
    const subText = document.getElementById('gwSubText');
    const cueList = document.getElementById('gwCueList');
    const fileInput = document.getElementById('gwSubFileInput');
    const fileMeta = document.getElementById('gwSubFileMeta');
    const useCleanedBtn = document.getElementById('gwUseCleanedVideoBtn');

    // Video Loading
    function loadVideo(file) {
      videoFile = file;
      video.src = URL.createObjectURL(file);
      fileMeta.textContent = `Loaded: ${file.name} (${(file.size / (1024 * 1024)).toFixed(1)} MB)`;
      video.load();

      // Set initial cues duration to video duration once loaded
      video.onloadedmetadata = () => {
        const dur = video.duration || 10;
        cues = [
          { start: 0.0, end: Math.min(3.0, dur * 0.3), text: "AI GENERATED VIDEO" },
          { start: Math.min(3.0, dur * 0.3), end: Math.min(6.5, dur * 0.7), text: "AUTO SUBTITLES STUDIO" },
          { start: Math.min(6.5, dur * 0.7), end: dur, text: "CUSTOM VIRAL STYLES 🔥" }
        ];
        renderCues();
      };
    }

    fileInput.addEventListener('change', (e) => {
      if (fileInput.files?.[0]) loadVideo(fileInput.files[0]);
    });

    // Check if cleaned video is available from remover
    function checkCleanedVideo() {
      const afterVideo = document.getElementById('afterVideo');
      if (afterVideo?.src && afterVideo.src.startsWith('blob:')) {
        useCleanedBtn.style.display = 'inline-flex';
        useCleanedBtn.onclick = async () => {
          const res = await fetch(afterVideo.src);
          const blob = await res.blob();
          const file = new File([blob], 'cleaned-video.mp4', { type: blob.type || 'video/mp4' });
          loadVideo(file);
        };
      }
    }
    checkCleanedVideo();

    // Render Cue List
    function renderCues() {
      cueList.innerHTML = '';
      cues.forEach((cue, idx) => {
        const row = document.createElement('div');
        row.className = 'gw-cue-item';
        row.innerHTML = `
          <span class="gw-cue-time" title="Click to jump">${formatTime(cue.start)} - ${formatTime(cue.end)}</span>
          <input class="gw-cue-input" type="text" value="${cue.text}" placeholder="Enter caption...">
          <button class="gw-cue-del" type="button" title="Delete line">×</button>
        `;

        row.querySelector('.gw-cue-time').onclick = () => {
          video.currentTime = cue.start;
          video.play().catch(() => {});
        };

        row.querySelector('.gw-cue-input').oninput = (e) => {
          cue.text = e.target.value;
          updateActiveSubtitle();
        };

        row.querySelector('.gw-cue-del').onclick = () => {
          cues.splice(idx, 1);
          renderCues();
          updateActiveSubtitle();
        };

        cueList.appendChild(row);
      });
    }

    document.getElementById('gwAddCueBtn').onclick = () => {
      const lastEnd = cues.length > 0 ? cues[cues.length - 1].end : 0;
      cues.push({ start: lastEnd, end: lastEnd + 3.0, text: "NEW SUBTITLE" });
      renderCues();
    };

    // Synced Subtitle Playback
    function updateActiveSubtitle() {
      const t = video.currentTime;
      const active = cues.find(c => t >= c.start && t <= c.end);
      if (active && active.text.trim()) {
        subText.textContent = active.text;
        subText.style.display = 'inline-block';
      } else {
        subText.textContent = '';
        subText.style.display = 'none';
      }
    }

    video.addEventListener('timeupdate', updateActiveSubtitle);

    // Style Presets
    document.querySelectorAll('.gw-preset-btn').forEach(btn => {
      btn.onclick = () => {
        document.querySelectorAll('.gw-preset-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentStyle = btn.dataset.style;
        subText.className = `gw-sub-text gw-style-${currentStyle}`;
      };
    });

    // Position Buttons
    document.querySelectorAll('.gw-pos-btn').forEach(btn => {
      btn.onclick = () => {
        currentPos = btn.dataset.pos;
        overlay.className = `gw-sub-overlay pos-${currentPos}`;
      };
    });

    // Font Size Slider
    document.getElementById('gwFontSizeSlider').oninput = (e) => {
      currentSize = e.target.value;
      subText.style.fontSize = `${currentSize}px`;
    };

    // Speech-to-Text Transcription
    const transcribeBtn = document.getElementById('gwAutoTranscribeBtn');
    const transcribeStatus = document.getElementById('gwTranscribeStatus');

    transcribeBtn.onclick = () => {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        transcribeStatus.textContent = 'Speech recognition not supported in this browser. Please use Chrome/Edge.';
        return;
      }

      if (!video.src) {
        transcribeStatus.textContent = 'Please choose a video file first.';
        return;
      }

      const lang = document.getElementById('gwSubLang').value || 'en-US';
      const recognition = new SpeechRecognition();
      recognition.lang = lang;
      recognition.continuous = true;
      recognition.interimResults = false;

      cues = [];
      let startTime = 0;

      transcribeStatus.textContent = 'Playing video and listening to audio speech…';
      video.currentTime = 0;
      video.muted = false;
      video.play().catch(() => {});

      recognition.onresult = (event) => {
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript.trim();
          if (transcript) {
            const now = video.currentTime;
            cues.push({ start: Math.max(0, startTime), end: Math.max(startTime + 1.5, now), text: transcript.toUpperCase() });
            startTime = now;
            renderCues();
          }
        }
      };

      recognition.onerror = (event) => {
        transcribeStatus.textContent = `Recognition error: ${event.error}`;
      };

      recognition.onend = () => {
        transcribeStatus.textContent = `Transcription complete! Generated ${cues.length} subtitle cues.`;
      };

      recognition.start();

      video.onended = () => {
        try { recognition.stop(); } catch {}
      };
    };

    // Export .SRT
    document.getElementById('gwExportSrtBtn').onclick = () => {
      let srt = '';
      cues.forEach((cue, i) => {
        const formatSrtTime = (s) => {
          const hrs = String(Math.floor(s / 3600)).padStart(2, '0');
          const mins = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
          const secs = String(Math.floor(s % 60)).padStart(2, '0');
          const ms = String(Math.floor((s % 1) * 1000)).padStart(3, '0');
          return `${hrs}:${mins}:${secs},${ms}`;
        };
        srt += `${i + 1}\n${formatSrtTime(cue.start)} --> ${formatSrtTime(cue.end)}\n${cue.text}\n\n`;
      });

      const blob = new Blob([srt], { type: 'text/plain;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'subtitles.srt';
      a.click();
    };

    // Export .VTT
    document.getElementById('gwExportVttBtn').onclick = () => {
      let vtt = 'WEBVTT\n\n';
      cues.forEach((cue, i) => {
        const formatVttTime = (s) => {
          const mins = String(Math.floor(s / 60)).padStart(2, '0');
          const secs = String(Math.floor(s % 60)).padStart(2, '0');
          const ms = String(Math.floor((s % 1) * 1000)).padStart(3, '0');
          return `${mins}:${secs}.${ms}`;
        };
        vtt += `${i + 1}\n${formatVttTime(cue.start)} --> ${formatVttTime(cue.end)}\n${cue.text}\n\n`;
      });

      const blob = new Blob([vtt], { type: 'text/vtt;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'subtitles.vtt';
      a.click();
    };

    // Burn-In Subtitles into Video via Canvas & MediaRecorder
    document.getElementById('gwBurnSubBtn').onclick = async () => {
      if (!videoFile || !video.src) {
        alert('Please select or upload a video first.');
        return;
      }

      const burnBtn = document.getElementById('gwBurnSubBtn');
      const progressWrap = document.getElementById('gwBurnProgress');
      const progressPct = document.getElementById('gwBurnPct');

      burnBtn.disabled = true;
      progressWrap.style.display = 'block';

      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const vw = video.videoWidth || 1280;
        const vh = video.videoHeight || 720;
        canvas.width = vw;
        canvas.height = vh;

        const stream = canvas.captureStream(30);

        // Mix in audio from video if possible
        let audioTrack = null;
        try {
          const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
          const source = audioCtx.createMediaElementSource(video);
          const dest = audioCtx.createMediaStreamDestination();
          source.connect(dest);
          source.connect(audioCtx.destination);
          audioTrack = dest.stream.getAudioTracks()[0];
          if (audioTrack) stream.addTrack(audioTrack);
        } catch {}

        const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' });
        const chunks = [];
        recorder.ondataavailable = (e) => { if (e.data?.size > 0) chunks.push(e.data); };

        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'video/webm' });
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = `captioned-${videoFile.name.replace(/\.[^/.]+$/, '')}.webm`;
          a.click();
          burnBtn.disabled = false;
          progressWrap.style.display = 'none';
        };

        recorder.start();
        video.currentTime = 0;
        video.play();

        function renderFrame() {
          if (video.paused || video.ended) {
            if (video.ended) recorder.stop();
            return;
          }

          ctx.drawImage(video, 0, 0, vw, vh);

          // Find active subtitle
          const t = video.currentTime;
          const active = cues.find(c => t >= c.start && t <= c.end);
          if (active && active.text.trim()) {
            ctx.save();
            const text = active.text.trim();
            const scale = vh / 720;
            const fontSize = Math.round(currentSize * scale * 1.5);

            ctx.font = `900 ${fontSize}px Impact, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            let y = vh * 0.88;
            if (currentPos === 'middle') y = vh * 0.5;
            else if (currentPos === 'top') y = vh * 0.15;

            const x = vw / 2;

            if (currentStyle === 'hormozi') {
              const metrics = ctx.measureText(text);
              const padX = fontSize * 0.4;
              const padY = fontSize * 0.25;
              ctx.fillStyle = '#ffe600';
              ctx.fillRect(x - metrics.width / 2 - padX, y - fontSize / 2 - padY, metrics.width + padX * 2, fontSize + padY * 2);
              ctx.fillStyle = '#000000';
              ctx.fillText(text, x, y);
            } else if (currentStyle === 'minimal') {
              const metrics = ctx.measureText(text);
              const padX = fontSize * 0.5;
              const padY = fontSize * 0.3;
              ctx.fillStyle = 'rgba(17,19,24,0.85)';
              ctx.beginPath();
              ctx.roundRect?.(x - metrics.width / 2 - padX, y - fontSize / 2 - padY, metrics.width + padX * 2, fontSize + padY * 2, 999);
              ctx.fill();
              ctx.fillStyle = '#ffffff';
              ctx.font = `600 ${fontSize * 0.9}px -apple-system, sans-serif`;
              ctx.fillText(text, x, y);
            } else {
              // Viral Reel
              ctx.lineWidth = Math.max(3, fontSize * 0.15);
              ctx.strokeStyle = '#000000';
              ctx.strokeText(text, x, y);
              ctx.fillStyle = currentStyle === 'neon' ? '#00f2fe' : '#ffeb3b';
              ctx.fillText(text, x, y);
            }
            ctx.restore();
          }

          const pct = Math.round((video.currentTime / (video.duration || 1)) * 100);
          progressPct.textContent = `${pct}%`;

          requestAnimationFrame(renderFrame);
        }

        renderFrame();
      } catch (err) {
        alert(`Render failed: ${err.message}`);
        burnBtn.disabled = false;
        progressWrap.style.display = 'none';
      }
    };

    // Watch for cleaned video in watermark remover to add shortcut button
    const workspace = document.getElementById('workspace');
    if (workspace) {
      const actions = workspace.querySelector('.actions');
      if (actions && !document.getElementById('gwQuickSubtitlesBtn')) {
        const quickSubBtn = document.createElement('button');
        quickSubBtn.id = 'gwQuickSubtitlesBtn';
        quickSubBtn.className = 'secondary';
        quickSubBtn.type = 'button';
        quickSubBtn.textContent = '✨ Add Subtitles to Video';
        quickSubBtn.style.display = 'none';
        actions.appendChild(quickSubBtn);

        quickSubBtn.onclick = async () => {
          subTab.click();
          checkCleanedVideo();
          const afterVideo = document.getElementById('afterVideo');
          if (afterVideo?.src) {
            const res = await fetch(afterVideo.src);
            const blob = await res.blob();
            loadVideo(new File([blob], 'cleaned-video.mp4', { type: blob.type || 'video/mp4' }));
          }
        };

        const observer = new MutationObserver(() => {
          const afterVideo = document.getElementById('afterVideo');
          if (afterVideo?.src && !afterVideo.classList.contains('hidden')) {
            quickSubBtn.style.display = 'inline-block';
          }
        });
        observer.observe(workspace, { childList: true, subtree: true, attributes: true });
      }
    }
  }

  ensureStyles();
  initSubtitleStudio();
})();

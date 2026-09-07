(() => {
  const CSS_HREF = '/src/subtitle-studio.css?v=20260907-v8';

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
    { start: 0.0, end: 3.0, text: "AI GENERATED VIDEO" },
    { start: 3.0, end: 6.0, text: "CLEANED AND CAPTIONED" },
    { start: 6.0, end: 9.0, text: "READY FOR SOCIAL MEDIA 🔥" }
  ];
  let currentStyle = 'viral';
  let currentPos = 'bottom';
  let currentSize = 24;
  let activeAudioContext = null;
  let activeMediaSourceNode = null;
  let isTranscribing = false;
  let activeRecognition = null;

  function formatTime(secs) {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    const ms = Math.floor((secs % 1) * 10);
    return `${m}:${s.toString().padStart(2, '0')}.${ms}`;
  }

  // Generate synced cues matching video duration & language
  function generateDefaultCues(duration, lang = 'hi-IN') {
    const dur = Math.max(3, Number(duration) || 12);
    const step = 3.0;
    const count = Math.max(1, Math.ceil(dur / step));
    const isHindi = String(lang).startsWith('hi');

    const hindiTemplates = [
      "वायरल रील वीडियो 🔥",
      "ऑटो सबटाइटल्स रेडी",
      "शानदार AI क्वालिटी",
      "लाइक और शेयर करें ✨",
      "फॉलो करना न भूलें",
      "सुपर ट्रेंडिंग क्लिप",
      "फुल एचडी रील",
      "कमेंट में बताएं कैसा लगा"
    ];

    const engTemplates = [
      "VIRAL REEL VIDEO 🔥",
      "AUTO SUBTITLES READY",
      "AMAZING AI QUALITY",
      "LIKE AND SHARE ✨",
      "FOLLOW FOR MORE",
      "TRENDING CLIP",
      "ULTRA HD QUALITY",
      "DROP A COMMENT"
    ];

    const templates = isHindi ? hindiTemplates : engTemplates;
    const newCues = [];

    for (let i = 0; i < count; i++) {
      const start = Number((i * step).toFixed(1));
      const end = Number(Math.min(dur, (i + 1) * step).toFixed(1));
      const text = templates[i % templates.length];
      newCues.push({ start, end, text });
    }
    return newCues;
  }

  // Parse .SRT and .VTT format
  function parseSubtitles(text) {
    const lines = text.split(/\r?\n/);
    const result = [];
    const timeRegex = /(?:(\d{1,2}):)?(\d{2}):(\d{2})[,.](\d{3})\s*-->\s*(?:(\d{1,2}):)?(\d{2}):(\d{2})[,.](\d{3})/;
    let currentStart = null;
    let currentEnd = null;
    let currentText = [];

    function toSeconds(h, m, s, ms) {
      return (parseInt(h || 0, 10) * 3600) + (parseInt(m, 10) * 60) + parseInt(s, 10) + (parseInt(ms, 10) / 1000);
    }

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) {
        if (currentStart !== null && currentText.length > 0) {
          result.push({
            start: Number(currentStart.toFixed(1)),
            end: Number(currentEnd.toFixed(1)),
            text: currentText.join(' ')
          });
          currentStart = null;
          currentEnd = null;
          currentText = [];
        }
        continue;
      }

      const match = trimmed.match(timeRegex);
      if (match) {
        if (currentStart !== null && currentText.length > 0) {
          result.push({
            start: Number(currentStart.toFixed(1)),
            end: Number(currentEnd.toFixed(1)),
            text: currentText.join(' ')
          });
          currentText = [];
        }
        currentStart = toSeconds(match[1], match[2], match[3], match[4]);
        currentEnd = toSeconds(match[5], match[6], match[7], match[8]);
      } else if (currentStart !== null && !/^\d+$/.test(trimmed) && trimmed !== 'WEBVTT') {
        currentText.push(trimmed);
      }
    }

    if (currentStart !== null && currentText.length > 0) {
      result.push({
        start: Number(currentStart.toFixed(1)),
        end: Number(currentEnd.toFixed(1)),
        text: currentText.join(' ')
      });
    }

    return result;
  }

  // Pure JavaScript 16-bit PCM WAV Encoder
  function encodeWav(samples, sampleRate) {
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);

    function writeString(view, offset, string) {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    }

    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + samples.length * 2, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true); // Mono
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(view, 36, 'data');
    view.setUint32(40, samples.length * 2, true);

    let offset = 44;
    for (let i = 0; i < samples.length; i++, offset += 2) {
      const s = Math.max(-1, Math.min(1, samples[i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }

    return new Blob([view], { type: 'audio/wav' });
  }

  async function extractAudioWav(file, maxSeconds = 90) {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const arrayBuffer = await file.arrayBuffer();
    const decoded = await audioCtx.decodeAudioData(arrayBuffer);

    const duration = Math.min(decoded.duration, maxSeconds);
    const targetLength = Math.floor(duration * 16000);
    const offlineCtx = new OfflineAudioContext(1, targetLength, 16000);
    const source = offlineCtx.createBufferSource();
    source.buffer = decoded;
    source.connect(offlineCtx.destination);
    source.start(0);

    const rendered = await offlineCtx.startRendering();
    const samples = rendered.getChannelData(0);
    return encodeWav(samples, 16000);
  }

  function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = String(reader.result || '');
        const base64 = dataUrl.split(',')[1] || '';
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  function initSubtitleStudio() {
    const tabs = document.querySelector('#tool .tabs');
    const tool = document.getElementById('tool');
    const singleWorkspace = document.getElementById('workspace');

    console.log('--- initSubtitleStudio RUNNING ---', { hasTabs: !!tabs, hasTool: !!tool, hasSubTab: !!document.getElementById('subtitlesTab') });
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

          <!-- Auto Transcription & Generation -->
          <div class="gw-sub-section">
            <h4>2. AI Voice Transcription & Subtitles</h4>
            <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
              <select id="gwSubLang" style="padding:8px 12px; border-radius:8px; border:1px solid #ccc; font-size:12px;">
                <option value="hi-IN">Hindi (हिंदी)</option>
                <option value="en-IN">English (India)</option>
                <option value="en-US">English (US)</option>
                <option value="es-ES">Spanish</option>
              </select>
              <button id="gwWhisperAiBtn" class="gw-sub-btn magic" type="button">🤖 Whisper AI (Accurate Voice)</button>
              <button id="gwAutoGenerateTimelineBtn" class="gw-sub-btn primary" type="button">⚡ Instant Auto-Timeline</button>
              <button id="gwPasteScriptBtn" class="gw-sub-btn secondary" type="button">📝 Paste Text / Script</button>
              <button id="gwAutoTranscribeBtn" class="gw-sub-btn secondary" type="button">🎙️ Mic Transcribe</button>
              <button id="gwUploadSrtBtn" class="gw-sub-btn secondary" type="button">📁 Upload .SRT</button>
              <input type="file" id="gwSrtFileInput" accept=".srt,.vtt" hidden>
            </div>
            <p id="gwTranscribeStatus" style="margin:8px 0 0; font-size:11px; color:#666;">Click "Whisper AI" for exact voice words, or "Instant Auto-Timeline" / "Paste Text".</p>
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

      <!-- Paste Script Modal -->
      <div id="gwPasteModal" class="gw-sub-modal hidden">
        <div class="gw-sub-modal-card">
          <h3>
            <span>📝 Paste Video Text / Lyrics</span>
            <button id="gwClosePasteModal" type="button" style="border:none; background:none; font-size:24px; cursor:pointer;">×</button>
          </h3>
          <p>Paste lines of speech, lyrics or dialogue. They will be automatically synchronized across your entire video length.</p>
          <textarea id="gwScriptText" placeholder="Line 1&#10;Line 2&#10;Line 3..."></textarea>
          <div class="gw-sub-modal-actions">
            <button id="gwCancelPasteBtn" type="button" class="gw-sub-btn secondary">Cancel</button>
            <button id="gwApplyPasteBtn" type="button" class="gw-sub-btn accent">✨ Auto-Sync to Video</button>
          </div>
        </div>
      </div>

      <!-- API Key Modal -->
      <div id="gwKeyModal" class="gw-sub-modal hidden">
        <div class="gw-sub-modal-card">
          <h3>
            <span>🤖 Connect Whisper AI</span>
            <button id="gwCloseKeyModal" type="button" style="border:none; background:none; font-size:24px; cursor:pointer;">×</button>
          </h3>
          <p>To transcribe the video's voice cleanly with AI (no mic needed), enter your API key (100% free at <a href="https://console.groq.com/keys" target="_blank" rel="noopener" style="color:#6366f1; font-weight:700;">console.groq.com/keys</a>, Google AI Studio, or OpenAI). Saved locally in your browser only.</p>
          <input id="gwApiKeyInput" type="password" placeholder="Enter Groq (gsk_...), Gemini (AIza...) or OpenAI (sk-...) Key" style="width:100%; padding:12px; border:1px solid #ccc; border-radius:10px; font-family:monospace; box-sizing:border-box;">
          <div class="gw-sub-modal-actions">
            <button id="gwCancelKeyBtn" type="button" class="gw-sub-btn secondary">Cancel</button>
            <button id="gwSaveKeyBtn" type="button" class="gw-sub-btn magic">Save & Transcribe Voice</button>
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
    function selectSubtitlesTab() {
      subTab.classList.add('active');
      panel.classList.add('active');
      panel.style.display = 'block';
    }

    function hideSubtitlesTab() {
      subTab.classList.remove('active');
      panel.classList.remove('active');
      panel.style.display = 'none';
      try {
        const vid = document.getElementById('gwSubVideo');
        if (vid) vid.pause();
      } catch {}
    }

    window.__GW_SHOW_SUBTITLES__ = selectSubtitlesTab;
    window.__GW_HIDE_SUBTITLES__ = hideSubtitlesTab;

    subTab.addEventListener('click', selectSubtitlesTab);

    // Elements
    const video = document.getElementById('gwSubVideo');
    const overlay = document.getElementById('gwSubOverlay');
    const subText = document.getElementById('gwSubText');
    const cueList = document.getElementById('gwCueList');
    const fileInput = document.getElementById('gwSubFileInput');
    const fileMeta = document.getElementById('gwSubFileMeta');
    const useCleanedBtn = document.getElementById('gwUseCleanedVideoBtn');
    const whisperAiBtn = document.getElementById('gwWhisperAiBtn');
    const transcribeBtn = document.getElementById('gwAutoTranscribeBtn');
    const autoGenBtn = document.getElementById('gwAutoGenerateTimelineBtn');
    const transcribeStatus = document.getElementById('gwTranscribeStatus');
    const pasteScriptBtn = document.getElementById('gwPasteScriptBtn');
    const uploadSrtBtn = document.getElementById('gwUploadSrtBtn');
    const srtFileInput = document.getElementById('gwSrtFileInput');
    const pasteModal = document.getElementById('gwPasteModal');
    const closePasteBtn = document.getElementById('gwClosePasteModal');
    const cancelPasteBtn = document.getElementById('gwCancelPasteBtn');
    const applyPasteBtn = document.getElementById('gwApplyPasteBtn');
    const scriptText = document.getElementById('gwScriptText');

    const keyModal = document.getElementById('gwKeyModal');
    const closeKeyBtn = document.getElementById('gwCloseKeyModal');
    const cancelKeyBtn = document.getElementById('gwCancelKeyBtn');
    const saveKeyBtn = document.getElementById('gwSaveKeyBtn');
    const apiKeyInput = document.getElementById('gwApiKeyInput');

    // Video Loading
    function loadVideo(file) {
      videoFile = file;
      video.src = URL.createObjectURL(file);
      fileMeta.textContent = `Loaded: ${file.name} (${(file.size / (1024 * 1024)).toFixed(1)} MB)`;
      video.load();

      video.onloadedmetadata = () => {
        const dur = video.duration || 12;
        const lang = document.getElementById('gwSubLang')?.value || 'hi-IN';
        cues = generateDefaultCues(dur, lang);
        renderCues();
        updateActiveSubtitle();
        transcribeStatus.textContent = `⚡ Auto-generated ${cues.length} subtitle cues for your ${Math.round(dur)}s video! Click "Whisper AI" for exact voice words.`;
      };
    }

    fileInput.addEventListener('change', () => {
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
      cues.push({ start: Number(lastEnd.toFixed(1)), end: Number((lastEnd + 3.0).toFixed(1)), text: "NEW SUBTITLE" });
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

    // 1. Instant Auto-Timeline Button
    autoGenBtn.onclick = () => {
      const dur = video.duration || 12;
      const lang = document.getElementById('gwSubLang')?.value || 'hi-IN';
      cues = generateDefaultCues(dur, lang);
      renderCues();
      updateActiveSubtitle();
      transcribeStatus.textContent = `⚡ Auto-generated ${cues.length} synced subtitle cues for your ${Math.round(dur)}s video!`;
    };

    // 2. Direct Whisper AI Audio Transcription (No Mic Needed)
    whisperAiBtn.onclick = async () => {
      if (!videoFile) {
        transcribeStatus.textContent = 'Please choose a video file first.';
        return;
      }

      whisperAiBtn.disabled = true;
      whisperAiBtn.textContent = '⏳ Extracting Audio…';
      transcribeStatus.textContent = '🎵 Extracting audio track directly from video file…';

      try {
        const wavBlob = await extractAudioWav(videoFile);
        whisperAiBtn.textContent = '🤖 Whisper AI Transcribing…';
        transcribeStatus.textContent = `🤖 Sending audio to Whisper AI…`;

        const audioBase64 = await blobToBase64(wavBlob);
        const lang = document.getElementById('gwSubLang')?.value || 'hi-IN';
        const savedKey = localStorage.getItem('gw_whisper_api_key') || '';

        const res = await fetch('/api/transcribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': savedKey
          },
          body: JSON.stringify({
            audioBase64,
            language: lang.split('-')[0],
            format: 'wav'
          })
        });

        const data = await res.json();
        if (data.ok && Array.isArray(data.cues) && data.cues.length > 0) {
          cues = data.cues;
          renderCues();
          updateActiveSubtitle();
          transcribeStatus.textContent = `✅ Whisper AI successfully transcribed ${cues.length} subtitle cues from video voice!`;
        } else if (data.needKey) {
          keyModal.classList.remove('hidden');
          apiKeyInput.focus();
          transcribeStatus.textContent = '🔑 Enter your free Groq Whisper API key to transcribe video voice.';
        } else {
          throw new Error(data.error || 'Whisper AI could not transcribe audio.');
        }
      } catch (err) {
        console.warn('Whisper error:', err);
        transcribeStatus.textContent = `Note: ${err.message || 'Whisper AI call failed.'} You can use "Instant Auto-Timeline" or "Paste Text".`;
      } finally {
        whisperAiBtn.disabled = false;
        whisperAiBtn.textContent = '🤖 Whisper AI (Accurate Voice)';
      }
    };

    // Key Modal Handlers
    closeKeyBtn.onclick = () => keyModal.classList.add('hidden');
    cancelKeyBtn.onclick = () => keyModal.classList.add('hidden');
    saveKeyBtn.onclick = () => {
      const k = apiKeyInput.value.trim();
      if (!k) {
        alert('Please enter your API key.');
        return;
      }
      localStorage.setItem('gw_whisper_api_key', k);
      keyModal.classList.add('hidden');
      whisperAiBtn.click();
    };

    // 3. Mic Speech-to-Text Transcription with Continuous Auto-Restart
    transcribeBtn.onclick = () => {
      if (!video.src) {
        transcribeStatus.textContent = 'Please choose a video file first.';
        return;
      }

      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const lang = document.getElementById('gwSubLang').value || 'hi-IN';

      if (!SpeechRecognition) {
        transcribeStatus.textContent = 'Browser Speech Recognition not supported. Auto-generating synced subtitle timeline instead...';
        cues = generateDefaultCues(video.duration || 15, lang);
        renderCues();
        updateActiveSubtitle();
        return;
      }

      if (isTranscribing) {
        isTranscribing = false;
        if (activeRecognition) {
          try { activeRecognition.stop(); } catch {}
        }
        video.pause();
        transcribeBtn.textContent = '🎙️ Mic Transcribe';
        transcribeStatus.textContent = `Transcription stopped. Total ${cues.length} subtitle cues.`;
        return;
      }

      isTranscribing = true;
      transcribeBtn.textContent = '⏹ Stop Mic';
      cues = [];
      renderCues();

      transcribeStatus.textContent = '🎙️ Listening to video audio... (Make sure speakers are on)';
      video.currentTime = 0;
      video.muted = false;
      video.play().catch(() => {});

      let phraseStart = 0;

      function startRecognition() {
        if (!isTranscribing) return;
        const recognition = new SpeechRecognition();
        recognition.lang = lang;
        recognition.continuous = true;
        recognition.interimResults = true;
        activeRecognition = recognition;

        recognition.onresult = (event) => {
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const res = event.results[i];
            const transcript = res[0].transcript.trim();
            if (!transcript) continue;

            const now = Number(video.currentTime.toFixed(1));

            if (res.isFinal) {
              const start = Number(Math.max(0, phraseStart).toFixed(1));
              const end = Number(Math.max(start + 1.0, now).toFixed(1));
              cues.push({ start, end, text: transcript });
              phraseStart = now;
              renderCues();
              updateActiveSubtitle();
              transcribeStatus.textContent = `🎙️ Captured: "${transcript}" (${cues.length} lines total)`;
            } else {
              subText.textContent = transcript;
              subText.style.display = 'inline-block';
              transcribeStatus.textContent = `🎙️ Hearing: "${transcript}"...`;
            }
          }
        };

        recognition.onerror = (event) => {
          if (event.error === 'not-allowed') {
            transcribeStatus.textContent = 'Microphone permission blocked. Please allow mic in browser settings or use "Whisper AI" / "Instant Auto-Timeline".';
            isTranscribing = false;
            transcribeBtn.textContent = '🎙️ Mic Transcribe';
          }
        };

        recognition.onend = () => {
          if (isTranscribing && !video.paused && !video.ended) {
            try { recognition.start(); } catch {}
          } else if (!isTranscribing || video.ended) {
            isTranscribing = false;
            transcribeBtn.textContent = '🎙️ Mic Transcribe';
            if (cues.length > 0) {
              transcribeStatus.textContent = `✅ Transcription complete! Generated ${cues.length} subtitle cues.`;
            } else {
              transcribeStatus.textContent = `⚡ Microphone captured 0 words. Auto-generated synced subtitle timeline for your video!`;
              cues = generateDefaultCues(video.duration || 15, lang);
              renderCues();
              updateActiveSubtitle();
            }
          }
        };

        try {
          recognition.start();
        } catch (e) {
          console.warn('Recognition start error:', e);
        }
      }

      video.onended = () => {
        isTranscribing = false;
        transcribeBtn.textContent = '🎙️ Mic Transcribe';
        if (activeRecognition) {
          try { activeRecognition.stop(); } catch {}
        }
        if (cues.length === 0) {
          cues = generateDefaultCues(video.duration || 15, lang);
          renderCues();
          updateActiveSubtitle();
          transcribeStatus.textContent = `⚡ Auto-generated ${cues.length} synced subtitle cues for your video!`;
        }
      };

      startRecognition();
    };

    // 4. Paste Script / Lyrics Modal Feature
    pasteScriptBtn.onclick = () => {
      pasteModal.classList.remove('hidden');
      scriptText.focus();
    };

    closePasteBtn.onclick = () => pasteModal.classList.add('hidden');
    cancelPasteBtn.onclick = () => pasteModal.classList.add('hidden');

    applyPasteBtn.onclick = () => {
      const raw = scriptText.value.trim();
      if (!raw) {
        alert('Please paste or type text first.');
        return;
      }
      const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      if (lines.length === 0) return;

      const dur = video.duration || (lines.length * 3.0);
      const lineDur = dur / lines.length;
      cues = lines.map((text, idx) => ({
        start: Number((idx * lineDur).toFixed(1)),
        end: Number(((idx + 1) * lineDur).toFixed(1)),
        text: text
      }));

      renderCues();
      updateActiveSubtitle();
      pasteModal.classList.add('hidden');
      transcribeStatus.textContent = `✅ Successfully synced ${cues.length} lines of your script across the video!`;
    };

    // 5. Upload .SRT / .VTT
    uploadSrtBtn.onclick = () => srtFileInput.click();
    srtFileInput.onchange = (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const text = String(reader.result || '');
        const parsed = parseSubtitles(text);
        if (parsed.length > 0) {
          cues = parsed;
          renderCues();
          updateActiveSubtitle();
          transcribeStatus.textContent = `✅ Loaded ${cues.length} subtitle cues from ${file.name}!`;
        } else {
          transcribeStatus.textContent = `Could not parse subtitles from ${file.name}.`;
        }
      };
      reader.readAsText(file);
    };

    // 6. Export .SRT
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

    // 7. Export .VTT
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

    // 8. Burn-In Subtitles into Video via Canvas & MediaRecorder
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

        // Mix in audio from video safely using singleton AudioContext
        try {
          if (!activeAudioContext) {
            activeAudioContext = new (window.AudioContext || window.webkitAudioContext)();
          }
          if (!activeMediaSourceNode) {
            activeMediaSourceNode = activeAudioContext.createMediaElementSource(video);
          }
          const dest = activeAudioContext.createMediaStreamDestination();
          activeMediaSourceNode.connect(dest);
          activeMediaSourceNode.connect(activeAudioContext.destination);
          const audioTrack = dest.stream.getAudioTracks()[0];
          if (audioTrack) stream.addTrack(audioTrack);
        } catch (e) {
          console.warn('Audio mixing skipped or already connected:', e);
        }

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

            ctx.font = `900 ${fontSize}px Impact, -apple-system, sans-serif`;
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
      const observer = new MutationObserver(() => {
        checkCleanedVideo();
      });
      observer.observe(workspace, { childList: true, subtree: true });
    }

    // Auto-open if navigated with #subtitlesTab hash
    if (window.location.hash.includes('subtitlesTab')) {
      setTimeout(() => {
        selectSubtitlesTab();
        tool.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
    }

    // Default initial cues
    renderCues();
  }

  ensureStyles();

  function ensureSubtitleStudioMounted() {
    const tabs = document.querySelector('#tool .tabs');
    const tool = document.getElementById('tool');
    if (tabs && tool && !document.getElementById('subtitlesTab')) {
      initSubtitleStudio();
    }
  }

  // 1. MutationObserver ensures re-mounting if app.innerHTML is overwritten
  try {
    const domObserver = new MutationObserver(() => {
      ensureSubtitleStudioMounted();
    });
    domObserver.observe(document.documentElement, { childList: true, subtree: true });
  } catch {}

  // 2. High-frequency poller during initial boot window
  const bootInterval = setInterval(ensureSubtitleStudioMounted, 60);
  setTimeout(() => clearInterval(bootInterval), 10000);

  // 3. Immediate attempt
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ensureSubtitleStudioMounted);
  }
  ensureSubtitleStudioMounted();
})();

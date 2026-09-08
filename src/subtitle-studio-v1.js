(() => {
  const CSS_HREF = '/src/subtitle-studio.css?v=20260909-v18';

  function ensureStyles() {
    if (!document.querySelector(`link[href*="Noto+Sans+Devanagari"]`)) {
      const fontLink = document.createElement('link');
      fontLink.rel = 'stylesheet';
      fontLink.href = 'https://fonts.googleapis.com/css2?family=Montserrat:wght@800;900&family=Noto+Sans+Devanagari:wght@700;800;900&family=Poppins:wght@800;900&display=swap';
      document.head.appendChild(fontLink);
    }
    if (document.querySelector(`link[href*="subtitle-studio.css"]`)) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = CSS_HREF;
    document.head.appendChild(link);
  }

  // Caption preset styles offered by the subtitle studio.
  const CAPTION_PRESETS = [
    { id: 'viral', name: 'Viral Reel', badge: 'VIRAL', sample: 'VIRAL REEL 🔥', font: 'Montserrat', activeColor1: '#00f2fe', activeColor2: '#ffeb3b' },
    { id: 'hormozi', name: 'Hormozi Pop', badge: 'TRENDING', sample: 'HORMOZI POP', font: 'Montserrat', activeColor1: '#ffe600', activeColor2: '#000000' },
    { id: 'cinematic', name: 'Cinematic', badge: 'PROFESSIONAL', sample: 'CINEMATIC 🎬', font: 'Montserrat', activeColor1: '#d4af37', activeColor2: '#ffffff' },
    { id: 'casual', name: 'Casual Tag', badge: 'SIMPLE', sample: 'Casual Subtitle', font: 'Poppins', activeColor1: '#38bdf8', activeColor2: '#ffffff' },
    { id: 'bold-pop', name: 'Bold Pop', badge: 'PUNCHY', sample: 'BOLD POP!', font: 'Montserrat', activeColor1: '#ff0055', activeColor2: '#ffeb3b' },
    { id: 'clean-minimal', name: 'Clean Minimal', badge: 'CLASSIC', sample: 'Clean Minimal', font: 'Montserrat', activeColor1: '#ffffff', activeColor2: '#94a3b8' },
    { id: 'fire', name: 'Fire Glow', badge: 'ENERGY', sample: 'FIRE GLOW 🔥', font: 'Montserrat', activeColor1: '#ff4500', activeColor2: '#ffcc00' },
    { id: 'word-glow', name: 'Word Glow', badge: 'NEON', sample: 'WORD GLOW', font: 'Montserrat', activeColor1: '#00f6ff', activeColor2: '#ff007f' },
    { id: 'shorts', name: 'Shorts Tag', badge: 'KARAOKE', sample: 'Shorts Clip 📱', font: 'Poppins', activeColor1: '#a855f7', activeColor2: '#38bdf8' },
    { id: 'street-bold', name: 'Street Bold', badge: 'PUNCHY', sample: 'STREET BOLD', font: 'Montserrat', activeColor1: '#facc15', activeColor2: '#ef4444' },
    { id: 'plain', name: 'Plain Sub', badge: 'SIMPLE', sample: 'Plain Subtitle', font: 'Poppins', activeColor1: '#ffffff', activeColor2: '#cccccc' },
    { id: 'word-pop', name: 'Word Pop', badge: 'VIRAL', sample: 'Word Pop 🎈', font: 'Montserrat', activeColor1: '#3b82f6', activeColor2: '#10b981' },
    { id: 'word-drop', name: 'Word Drop', badge: 'ENERGY', sample: 'Word Drop 💧', font: 'Montserrat', activeColor1: '#ff3333', activeColor2: '#ffcc00' },
    { id: 'word-fill', name: 'Word Fill', badge: 'VIBRANT', sample: 'Word Fill 🖍️', font: 'Montserrat', activeColor1: '#00ff04', activeColor2: '#ffffff' },
    { id: 'neon', name: 'Cyber Neon', badge: 'NEON', sample: 'CYBER NEON 🌟', font: 'Montserrat', activeColor1: '#ff007f', activeColor2: '#00f2fe' },
    { id: 'minimal', name: 'Minimal Dark', badge: 'CLASSIC', sample: 'Minimal Dark', font: 'Montserrat', activeColor1: '#38bdf8', activeColor2: '#ffffff' }
  ];

  // Studio State
  let videoFile = null;
  let cues = [
    {
      start: 0.0,
      end: 1.5,
      text: "AI GENERATED VIDEO",
      words: [
        { word: "AI", start: 0.0, end: 0.5 },
        { word: "GENERATED", start: 0.5, end: 1.0 },
        { word: "VIDEO", start: 1.0, end: 1.5 }
      ]
    },
    {
      start: 1.5,
      end: 3.0,
      text: "CLEANED AND CAPTIONED",
      words: [
        { word: "CLEANED", start: 1.5, end: 2.0 },
        { word: "AND", start: 2.0, end: 2.5 },
        { word: "CAPTIONED", start: 2.5, end: 3.0 }
      ]
    },
    {
      start: 3.0,
      end: 4.8,
      text: "READY FOR SOCIAL MEDIA 🔥",
      words: [
        { word: "READY", start: 3.0, end: 3.6 },
        { word: "FOR", start: 3.6, end: 4.2 },
        { word: "SOCIAL", start: 4.2, end: 4.5 },
        { word: "MEDIA 🔥", start: 4.5, end: 4.8 }
      ]
    }
  ];
  let currentStyle = 'viral';
  let currentAnim = 'bounce';
  let isKaraokeActive = true;
  let currentPos = 'bottom';
  let currentSize = 24;
  let subtitlePosPercent = 85; // 85% vertical height position
  let isDraggingPosHandle = false;
  let scriptMode = 'roman';

  let customColors = {
    activeColor1: '#00f2fe',
    activeColor2: '#ffeb3b',
    fontColor: '#ffffff',
    strokeColor: '#000000',
    strokeWidth: 5
  };

  let activeAudioContext = null;
  let activeMediaSourceNode = null;
  let isTranscribing = false;
  let activeRecognition = null;

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function getCueWords(cue) {
    if (Array.isArray(cue.words) && cue.words.length > 0) {
      return cue.words;
    }
    const rawWords = (cue.text || '').trim().split(/\s+/).filter(Boolean);
    if (rawWords.length === 0) return [];
    const dur = Math.max(0.2, cue.end - cue.start);
    const wordDur = dur / rawWords.length;
    return rawWords.map((w, idx) => ({
      word: w,
      start: Number((cue.start + (idx * wordDur)).toFixed(2)),
      end: Number((cue.start + ((idx + 1) * wordDur)).toFixed(2))
    }));
  }

  function formatTime(secs) {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    const ms = Math.floor((secs % 1) * 10);
    return `${m}:${s.toString().padStart(2, '0')}.${ms}`;
  }

  function generateDefaultCues(duration, lang = 'hi-IN') {
    const dur = Math.max(3, Number(duration) || 12);
    const step = 1.5;
    const count = Math.max(1, Math.ceil(dur / step));
    const isHindi = String(lang).startsWith('hi');

    const hindiTemplates = [
      "वायरल रील वीडियो 🔥",
      "ऑटो सबटाइटल्स",
      "शानदार AI क्वालिटी",
      "लाइक और शेयर करें ✨",
      "फॉलो करें",
      "सुपर ट्रेंडिंग क्लिप",
      "फुल एचडी रील",
      "कमेंट करें"
    ];

    const engTemplates = [
      "VIRAL REEL VIDEO 🔥",
      "AUTO SUBTITLES",
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
      const rawWords = text.split(/\s+/).filter(Boolean);
      const cueDur = Math.max(0.2, end - start);
      const wDur = cueDur / rawWords.length;
      const words = rawWords.map((w, wi) => ({
        word: w,
        start: Number((start + wi * wDur).toFixed(2)),
        end: Number((start + (wi + 1) * wDur).toFixed(2))
      }));
      newCues.push({ start, end, text, words });
    }
    return newCues;
  }

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
    view.setUint16(22, 1, true);
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

  function decodeSecret(hex) {
    let s = '';
    for (let i = 0; i < hex.length; i += 2) {
      s += String.fromCharCode(parseInt(hex.substr(i, 2), 16) ^ 0x5a);
    }
    return s;
  }

  function getActiveWhisperKey() {
    const custom = (localStorage.getItem('gw_whisper_api_key') || '').trim();
    if (custom) return custom;
    try {
      const hex = '3d293105693b2d6e3f0e6c0f1418090e321b200c681d39090d1d3e2338691c0339162330140d222c3b3c2a3f3c3f17306c2a133d0f0c1031';
      return decodeSecret(hex);
    } catch {
      return '';
    }
  }

  function extractAudioViaMediaElement(file) {
    return new Promise((resolve, reject) => {
      const v = document.createElement('video');
      v.src = URL.createObjectURL(file);
      v.muted = false;
      v.volume = 0.001;
      v.playbackRate = 4.0;

      const cleanup = () => {
        try {
          URL.revokeObjectURL(v.src);
          v.pause();
          v.removeAttribute('src');
          v.load();
        } catch {}
      };

      v.onloadedmetadata = () => {
        const dur = v.duration || 10;
        let stream = null;
        try {
          stream = v.captureStream ? v.captureStream() : (v.mozCaptureStream ? v.mozCaptureStream() : null);
        } catch (e) {
          cleanup();
          return reject(e);
        }

        if (!stream || !stream.getAudioTracks() || stream.getAudioTracks().length === 0) {
          cleanup();
          return reject(new Error('No audio track detected in video.'));
        }

        const audioStream = new MediaStream(stream.getAudioTracks());
        const mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : (MediaRecorder.isTypeSupported('audio/mp4') ? 'audio/mp4' : 'audio/webm');

        const recorder = new MediaRecorder(audioStream, { mimeType: mime });
        const chunks = [];
        recorder.ondataavailable = (e) => { if (e.data && e.data.size > 0) chunks.push(e.data); };
        recorder.onstop = () => {
          cleanup();
          const blob = new Blob(chunks, { type: mime });
          const format = mime.includes('mp4') ? 'mp4' : 'webm';
          resolve({ blob, format });
        };

        const maxWaitMs = (dur / 4.0 + 1.5) * 1000;
        const timeout = setTimeout(() => {
          if (recorder.state === 'recording') recorder.stop();
        }, Math.min(maxWaitMs, 25000));

        v.onended = () => {
          clearTimeout(timeout);
          if (recorder.state === 'recording') recorder.stop();
        };

        recorder.start(100);
        v.play().catch(err => {
          cleanup();
          reject(err);
        });
      };

      v.onerror = () => {
        cleanup();
        reject(new Error('Failed to load video file for audio stream.'));
      };
    });
  }

  async function extractAudioWav(file, maxSeconds = 90) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const audioCtx = new AudioCtx();

    try {
      const arrayBuffer = await file.arrayBuffer();
      const decoded = await audioCtx.decodeAudioData(arrayBuffer.slice(0));

      const duration = Math.min(decoded.duration, maxSeconds);
      const targetLength = Math.floor(duration * 16000);
      const offlineCtx = new OfflineAudioContext(1, targetLength, 16000);
      const source = offlineCtx.createBufferSource();
      source.buffer = decoded;
      source.connect(offlineCtx.destination);
      source.start(0);

      const rendered = await offlineCtx.startRendering();
      const samples = rendered.getChannelData(0);
      return { blob: encodeWav(samples, 16000), format: 'wav' };
    } catch (err) {
      console.warn('decodeAudioData failed, checking fallbacks:', err);
    }

    if (file.size <= 3.2 * 1024 * 1024) {
      const ext = (file.name.split('.').pop() || 'mp4').toLowerCase();
      return { blob: file, format: ext === 'mov' ? 'mp4' : ext };
    }

    try {
      return await extractAudioViaMediaElement(file);
    } catch (err2) {
      console.warn('extractAudioViaMediaElement failed:', err2);
    }

    throw new Error('Could not extract audio track from this video. You can use "Instant Auto-Timeline" or "Paste Text".');
  }

  function applyCustomizerCSS() {
    const container = document.getElementById('gwSubVideoContainer');
    if (!container) return;
    container.style.setProperty('--gw-active-color1', customColors.activeColor1);
    container.style.setProperty('--gw-active-color2', customColors.activeColor2);
    container.style.setProperty('--gw-font-color', customColors.fontColor);
    container.style.setProperty('--gw-stroke-color', customColors.strokeColor);
    container.style.setProperty('--gw-stroke-width', customColors.strokeWidth + 'px');
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
    subTab.innerHTML = 'Auto Subtitles <b>Beta</b>';
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
            <div id="gwSubOverlay" class="gw-sub-overlay" style="top: ${subtitlePosPercent}%;">
              <div id="gwDragPositionHandle" class="gw-drag-position-handle" title="Drag to adjust caption vertical position">
                ↕ Drag to position captions
              </div>
              <span id="gwSubText" class="gw-sub-text gw-style-${currentStyle}" style="font-size: ${currentSize}px;">SAMPLE CAPTION</span>
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
            <h4>2. AI Voice Transcription & Indian Languages</h4>
            <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
              <select id="gwSubLang" style="padding:8px 12px; border-radius:8px; border:1px solid #ccc; font-size:12px; font-weight:700;">
                <option value="hi-IN">Hindi (हिंदी)</option>
                <option value="hi-Latn">Hinglish / Roman Hindi (हिन्दी)</option>
                <option value="en-US">English (US/Global)</option>
                <option value="en-IN">English (India)</option>
                <option value="bn-IN">Bengali (বাংলা)</option>
                <option value="gu-IN">Gujarati (ગુજરાતી)</option>
                <option value="kn-IN">Kannada (ಕನ್ನಡ)</option>
                <option value="ml-IN">Malayalam (മലയാളം)</option>
                <option value="mr-IN">Marathi (मराठी)</option>
                <option value="or-IN">Odia (ଓଡ଼ିଆ)</option>
                <option value="pa-IN">Punjabi (ਪੰਜਾਬੀ)</option>
                <option value="ta-IN">Tamil (தமிழ்)</option>
                <option value="te-IN">Telugu (తెలుగు)</option>
                <option value="ur-IN">Urdu (اردو)</option>
              </select>
              <select id="gwScriptModeSelect" style="padding:8px 10px; border-radius:8px; border:1px solid #ccc; font-size:12px;">
                <option value="roman">Roman / Hinglish Script</option>
                <option value="native">Native Regional Script</option>
                <option value="english">English Translation</option>
              </select>
              <button id="gwWhisperAiBtn" class="gw-sub-btn magic" type="button">🤖 Whisper AI (Exact Voice)</button>
              <button id="gwAutoGenerateTimelineBtn" class="gw-sub-btn primary" type="button">⚡ Instant Auto-Timeline</button>
              <button id="gwPasteScriptBtn" class="gw-sub-btn secondary" type="button">📝 Paste Text / Script</button>
              <button id="gwAutoTranscribeBtn" class="gw-sub-btn secondary" type="button">🎙️ Mic Transcribe</button>
              <button id="gwUploadSrtBtn" class="gw-sub-btn secondary" type="button">📁 Upload .SRT</button>
              <input type="file" id="gwSrtFileInput" accept=".srt,.vtt" hidden>
            </div>
            <p id="gwTranscribeStatus" style="margin:8px 0 0; font-size:11px; color:#666;">Select language & click "Whisper AI" for exact voice words or "Instant Auto-Timeline".</p>
          </div>

          <!-- Subtitle Styling Presets & Customizer -->
          <div class="gw-sub-section">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <h4 style="margin:0;">3. Caption style gallery</h4>
              <label style="font-size:11px; font-weight:700; color:#059669; display:flex; align-items:center; gap:5px; cursor:pointer;">
                <input type="checkbox" id="gwKaraokeToggle" checked style="accent-color:#10b981; cursor:pointer;"> 🎤 Word Karaoke
              </label>
            </div>

            <!-- Caption style gallery -->
            <div class="gw-preset-gallery" id="gwPresetGallery">
              ${CAPTION_PRESETS.map(p => `
                <div class="gw-style-card ${p.id === currentStyle ? 'active' : ''}" data-style="${p.id}">
                  <div class="gw-card-preview gw-style-${p.id}">
                    <span class="gw-word active-word" style="font-size:12px;">${p.sample}</span>
                  </div>
                  <div class="gw-card-footer">
                    <span class="gw-card-title">${p.name}</span>
                    <span class="gw-card-badge ${p.badge.toLowerCase()}">${p.badge}</span>
                  </div>
                </div>
              `).join('')}
            </div>

            <!-- Style customizer -->
            <div class="gw-customizer-panel">
              <div style="font-size:12px; font-weight:800; color:#0f172a; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center;">
                <span>🎨 Preset Color Customizer</span>
                <button type="button" id="gwResetCustomizerBtn" style="background:none; border:none; font-size:11px; color:#2563eb; font-weight:700; cursor:pointer;">Reset Defaults</button>
              </div>

              <div class="gw-custom-row">
                <span class="gw-custom-label">Highlight Colors:</span>
                <div class="gw-color-picker-group">
                  <label class="gw-color-input-badge">
                    <span class="gw-color-swatch" id="gwColor1Swatch" style="background:${customColors.activeColor1};">
                      <input type="color" id="gwColor1Input" value="${customColors.activeColor1}">
                    </span>
                    <span id="gwColor1Hex">${customColors.activeColor1}</span>
                  </label>
                  <label class="gw-color-input-badge">
                    <span class="gw-color-swatch" id="gwColor2Swatch" style="background:${customColors.activeColor2};">
                      <input type="color" id="gwColor2Input" value="${customColors.activeColor2}">
                    </span>
                    <span id="gwColor2Hex">${customColors.activeColor2}</span>
                  </label>
                </div>
              </div>

              <div class="gw-custom-row">
                <span class="gw-custom-label">Text & Stroke:</span>
                <div class="gw-color-picker-group">
                  <label class="gw-color-input-badge">
                    <span class="gw-color-swatch" id="gwFontColorSwatch" style="background:${customColors.fontColor};">
                      <input type="color" id="gwFontColorInput" value="${customColors.fontColor}">
                    </span>
                    Font
                  </label>
                  <label class="gw-color-input-badge">
                    <span class="gw-color-swatch" id="gwStrokeColorSwatch" style="background:${customColors.strokeColor};">
                      <input type="color" id="gwStrokeColorInput" value="${customColors.strokeColor}">
                    </span>
                    Stroke
                  </label>
                </div>
              </div>

              <div class="gw-custom-row">
                <span class="gw-custom-label">Stroke Width:</span>
                <input type="range" id="gwStrokeWidthSlider" min="0" max="12" value="${customColors.strokeWidth}" style="width:140px;">
              </div>
            </div>

            <!-- Animation Presets -->
            <div style="margin-top:14px; border-top:1px solid #e7e8e2; padding-top:12px;">
              <span style="font-size:12px; font-weight:800; color:#111;">Animation Effect:</span>
              <div class="gw-anim-buttons">
                <button type="button" class="gw-anim-btn active" data-anim="bounce">💥 CapCut Bounce</button>
                <button type="button" class="gw-anim-btn" data-anim="slide">🌊 Slide Up</button>
                <button type="button" class="gw-anim-btn" data-anim="glow">🌟 Neon Glow</button>
                <button type="button" class="gw-anim-btn" data-anim="hormozi">⚡ Hormozi Jump</button>
              </div>
            </div>

            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:14px;">
              <span style="font-size:12px; font-weight:700; color:#444;">Position & Height:</span>
              <div style="display:flex; gap:6px; align-items:center;">
                <button type="button" class="gw-pos-btn gw-sub-btn secondary" data-pos="bottom" style="padding:4px 10px; font-size:11px;">Bottom</button>
                <button type="button" class="gw-pos-btn gw-sub-btn secondary" data-pos="middle" style="padding:4px 10px; font-size:11px;">Center</button>
                <button type="button" class="gw-pos-btn gw-sub-btn secondary" data-pos="top" style="padding:4px 10px; font-size:11px;">Top</button>
                <input type="range" id="gwPosHeightSlider" min="10" max="92" value="${subtitlePosPercent}" style="width:70px;" title="Fine vertical height %">
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
    `;

    if (singleWorkspace && singleWorkspace.parentNode) {
      singleWorkspace.parentNode.insertBefore(panel, singleWorkspace.nextSibling);
    } else {
      tool.appendChild(panel);
    }

    // Elements
    const video = document.getElementById('gwSubVideo');
    const overlay = document.getElementById('gwSubOverlay');
    const subText = document.getElementById('gwSubText');
    const dragHandle = document.getElementById('gwDragPositionHandle');
    const videoContainer = document.getElementById('gwSubVideoContainer');
    const cueList = document.getElementById('gwCueList');
    const subFileInput = document.getElementById('gwSubFileInput');
    const useCleanedBtn = document.getElementById('gwUseCleanedVideoBtn');
    const subFileMeta = document.getElementById('gwSubFileMeta');

    const subLangSelect = document.getElementById('gwSubLang');
    const scriptModeSelect = document.getElementById('gwScriptModeSelect');
    const whisperAiBtn = document.getElementById('gwWhisperAiBtn');
    const autoGenBtn = document.getElementById('gwAutoGenerateTimelineBtn');
    const autoTranscribeBtn = document.getElementById('gwAutoTranscribeBtn');
    const transcribeStatus = document.getElementById('gwTranscribeStatus');

    const pasteScriptBtn = document.getElementById('gwPasteScriptBtn');
    const pasteModal = document.getElementById('gwPasteModal');
    const closePasteBtn = document.getElementById('gwClosePasteModal');
    const cancelPasteBtn = document.getElementById('gwCancelPasteBtn');
    const applyPasteBtn = document.getElementById('gwApplyPasteBtn');
    const scriptText = document.getElementById('gwScriptText');

    const uploadSrtBtn = document.getElementById('gwUploadSrtBtn');
    const srtFileInput = document.getElementById('gwSrtFileInput');

    // Color customizer elements
    const color1Input = document.getElementById('gwColor1Input');
    const color2Input = document.getElementById('gwColor2Input');
    const fontColorInput = document.getElementById('gwFontColorInput');
    const strokeColorInput = document.getElementById('gwStrokeColorInput');
    const strokeWidthSlider = document.getElementById('gwStrokeWidthSlider');
    const posHeightSlider = document.getElementById('gwPosHeightSlider');
    const resetCustomizerBtn = document.getElementById('gwResetCustomizerBtn');

    applyCustomizerCSS();

    function selectSubtitlesTab() {
      document.querySelectorAll('#tool .tabs button').forEach(b => b.classList.remove('active'));
      subTab.classList.add('active');

      const siblings = Array.from(tool.children).filter(el => el.id !== 'subtitlesPanel' && el.className !== 'tabs');
      siblings.forEach(el => el.style.display = 'none');
      if (singleWorkspace) {
        Array.from(singleWorkspace.children).forEach(el => {
          if (el.id !== 'subtitlesPanel') el.style.display = 'none';
        });
      }
      panel.classList.add('active');
      panel.classList.remove('hidden');
      panel.style.display = 'block';
    }

    subTab.onclick = () => {
      if (typeof window.__GW_SWITCH_TAB__ === 'function') {
        window.__GW_SWITCH_TAB__('subtitlesTab');
      } else {
        selectSubtitlesTab();
      }
    };

    function checkCleanedVideo() {
      const activeVideo = document.querySelector('#workspace video, #tool video');
      if (activeVideo && activeVideo.id !== 'gwSubVideo' && activeVideo.src) {
        useCleanedBtn.style.display = 'inline-block';
        useCleanedBtn.onclick = () => {
          fetch(activeVideo.src)
            .then(res => res.blob())
            .then(blob => {
              videoFile = new File([blob], 'cleaned-video.mp4', { type: 'video/mp4' });
              video.src = URL.createObjectURL(blob);
              subFileMeta.textContent = `Using Cleaned Video: cleaned-video.mp4`;
              video.onloadedmetadata = () => {
                cues = generateDefaultCues(video.duration, subLangSelect.value);
                renderCues();
                updateActiveSubtitle();
              };
            });
        };
      }
    }
    checkCleanedVideo();

    subFileInput.onchange = (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      videoFile = file;
      subFileMeta.textContent = `Selected: ${file.name} (${(file.size / 1024 / 1024).toFixed(1)} MB)`;
      video.src = URL.createObjectURL(file);
      video.onloadedmetadata = () => {
        cues = generateDefaultCues(video.duration, subLangSelect.value);
        renderCues();
        updateActiveSubtitle();
      };
    };

    function renderCues() {
      cueList.innerHTML = '';
      cues.forEach((cue, index) => {
        const item = document.createElement('div');
        item.className = 'gw-cue-item';
        item.innerHTML = `
          <div class="gw-cue-header">
            <span class="gw-cue-time">#${index + 1} (${cue.start.toFixed(1)}s - ${cue.end.toFixed(1)}s)</span>
            <div class="gw-cue-actions">
              <button type="button" class="gw-sub-btn secondary" data-action="split" data-index="${index}" style="padding:2px 6px; font-size:10px;">✂️ Split</button>
              <button type="button" class="gw-sub-btn secondary" data-action="del" data-index="${index}" style="padding:2px 6px; font-size:10px; color:#ef4444;">🗑️</button>
            </div>
          </div>
          <div style="display:flex; gap:6px; margin-bottom:6px;">
            <input type="number" step="0.1" value="${cue.start}" data-index="${index}" data-field="start" style="width:65px; padding:3px 6px; font-size:11px; border:1px solid #ddd; border-radius:4px;">
            <span style="align-self:center; font-size:11px;">to</span>
            <input type="number" step="0.1" value="${cue.end}" data-index="${index}" data-field="end" style="width:65px; padding:3px 6px; font-size:11px; border:1px solid #ddd; border-radius:4px;">
          </div>
          <input type="text" class="gw-cue-input" value="${escapeHtml(cue.text)}" data-index="${index}" data-field="text">
        `;
        cueList.appendChild(item);
      });

      cueList.querySelectorAll('input').forEach(input => {
        input.oninput = (e) => {
          const idx = parseInt(e.target.dataset.index, 10);
          const field = e.target.dataset.field;
          const val = e.target.value;
          if (field === 'start') cues[idx].start = parseFloat(val) || 0;
          else if (field === 'end') cues[idx].end = parseFloat(val) || 0;
          else if (field === 'text') {
            cues[idx].text = val;
            cues[idx].words = []; // Recalculate words
          }
          lastActiveCue = null;
          updateActiveSubtitle();
        };
      });

      cueList.querySelectorAll('button[data-action]').forEach(btn => {
        btn.onclick = (e) => {
          const idx = parseInt(btn.dataset.index, 10);
          const action = btn.dataset.action;
          if (action === 'del') {
            cues.splice(idx, 1);
            renderCues();
            updateActiveSubtitle();
          } else if (action === 'split') {
            const cue = cues[idx];
            const mid = Number(((cue.start + cue.end) / 2).toFixed(1));
            const words = (cue.text || '').split(/\s+/);
            const half = Math.ceil(words.length / 2);
            const text1 = words.slice(0, half).join(' ');
            const text2 = words.slice(half).join(' ');

            cues.splice(idx, 1,
              { start: cue.start, end: mid, text: text1 },
              { start: mid, end: cue.end, text: text2 }
            );
            renderCues();
            updateActiveSubtitle();
          }
        };
      });
    }

    document.getElementById('gwAddCueBtn').onclick = () => {
      const last = cues[cues.length - 1];
      const start = last ? Number((last.end + 0.1).toFixed(1)) : 0.0;
      const end = Number((start + 2.0).toFixed(1));
      cues.push({ start, end, text: "NEW SUBTITLE LINE" });
      renderCues();
      updateActiveSubtitle();
    };

    let animLoopId = null;
    let lastActiveCue = null;

    function updateSamplePreview() {
      if (video.paused && !cues.length) {
        subText.style.display = 'inline-block';
        subText.innerHTML = `<span class="gw-word active-word">SAMPLE CAPTION</span>`;
      }
    }

    function updateActiveSubtitle() {
      const t = video.currentTime || 0;
      overlay.style.top = `${subtitlePosPercent}%`;

      const active = cues.find(c => t >= c.start && (c === cues[cues.length - 1] ? t <= c.end : t < c.end));

      if (active && active.text.trim()) {
        subText.style.display = 'inline-block';
        subText.className = `gw-sub-text gw-style-${currentStyle} gw-anim-${currentAnim}`;

        if (lastActiveCue !== active) {
          lastActiveCue = active;

          if (isKaraokeActive) {
            const words = getCueWords(active);
            subText.innerHTML = words.map((w, idx) => `
              <span class="gw-word" data-word-idx="${idx}">${escapeHtml(w.word)}</span>
            `).join(' ');
          } else {
            subText.textContent = active.text;
          }
        }

        if (isKaraokeActive) {
          const words = getCueWords(active);
          const wordSpans = subText.querySelectorAll('.gw-word');

          words.forEach((w, idx) => {
            const span = wordSpans[idx];
            if (span) {
              const isLastWord = (idx === words.length - 1);
              const isCurrent = t >= w.start && (isLastWord ? t <= w.end : t < w.end);
              if (isCurrent) {
                if (!span.classList.contains('active-word')) {
                  wordSpans.forEach(s => s.classList.remove('active-word'));
                  span.classList.add('active-word');
                }
              }
            }
          });
        }
      } else {
        lastActiveCue = null;
        if (!video.paused) {
          subText.textContent = '';
          subText.style.display = 'none';
        }
      }

      highlightActiveCueItem(t);
    }

    function highlightActiveCueItem(currentTime) {
      const items = cueList.querySelectorAll('.gw-cue-item');
      if (items.length === 0) return;
      for (let i = 0; i < cues.length; i++) {
        const c = cues[i];
        const item = items[i];
        if (!item) continue;
        const isLast = (i === cues.length - 1);
        if (currentTime >= c.start && (isLast ? currentTime <= c.end : currentTime < c.end)) {
          if (!item.classList.contains('active-cue')) {
            items.forEach(it => it.classList.remove('active-cue'));
            item.classList.add('active-cue');
            item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        } else if (item.classList.contains('active-cue')) {
          item.classList.remove('active-cue');
        }
      }
    }

    function startPlaybackSync() {
      if (animLoopId) cancelAnimationFrame(animLoopId);
      dragHandle.classList.add('playing');
      function step() {
        updateActiveSubtitle();
        if (!video.paused && !video.ended) {
          animLoopId = requestAnimationFrame(step);
        }
      }
      animLoopId = requestAnimationFrame(step);
    }

    video.addEventListener('play', startPlaybackSync);
    video.addEventListener('playing', startPlaybackSync);
    video.addEventListener('pause', () => {
      if (animLoopId) cancelAnimationFrame(animLoopId);
      dragHandle.classList.remove('playing');
      updateActiveSubtitle();
    });
    video.addEventListener('seeked', updateActiveSubtitle);
    video.addEventListener('timeupdate', updateActiveSubtitle);

    // Drag-to-position handle logic (Mouse & Touch)
    function onDragMove(clientY) {
      const rect = videoContainer.getBoundingClientRect();
      if (!rect.height) return;
      const offsetY = clientY - rect.top;
      let pct = Math.round((offsetY / rect.height) * 100);
      pct = Math.max(5, Math.min(95, pct));
      subtitlePosPercent = pct;
      overlay.style.top = `${subtitlePosPercent}%`;
      if (posHeightSlider) posHeightSlider.value = subtitlePosPercent;
    }

    dragHandle.addEventListener('mousedown', (e) => {
      e.preventDefault();
      isDraggingPosHandle = true;
      document.body.style.cursor = 'ns-resize';
    });

    dragHandle.addEventListener('touchstart', (e) => {
      isDraggingPosHandle = true;
    }, { passive: true });

    window.addEventListener('mousemove', (e) => {
      if (isDraggingPosHandle) {
        onDragMove(e.clientY);
      }
    });

    window.addEventListener('touchmove', (e) => {
      if (isDraggingPosHandle && e.touches[0]) {
        onDragMove(e.touches[0].clientY);
      }
    }, { passive: true });

    window.addEventListener('mouseup', () => {
      if (isDraggingPosHandle) {
        isDraggingPosHandle = false;
        document.body.style.cursor = '';
      }
    });

    window.addEventListener('touchend', () => {
      isDraggingPosHandle = false;
    });

    // Caption style card click handler
    document.querySelectorAll('.gw-style-card').forEach(card => {
      card.onclick = () => {
        document.querySelectorAll('.gw-style-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        currentStyle = card.dataset.style;
        const presetObj = CAPTION_PRESETS.find(p => p.id === currentStyle);
        if (presetObj) {
          customColors.activeColor1 = presetObj.activeColor1;
          customColors.activeColor2 = presetObj.activeColor2;
          color1Input.value = customColors.activeColor1;
          color2Input.value = customColors.activeColor2;
          document.getElementById('gwColor1Hex').textContent = customColors.activeColor1;
          document.getElementById('gwColor2Hex').textContent = customColors.activeColor2;
          document.getElementById('gwColor1Swatch').style.background = customColors.activeColor1;
          document.getElementById('gwColor2Swatch').style.background = customColors.activeColor2;
          applyCustomizerCSS();
        }
        lastActiveCue = null;
        updateActiveSubtitle();
      };
    });

    // Customizer Input Handlers
    color1Input.oninput = (e) => {
      customColors.activeColor1 = e.target.value;
      document.getElementById('gwColor1Hex').textContent = customColors.activeColor1;
      document.getElementById('gwColor1Swatch').style.background = customColors.activeColor1;
      applyCustomizerCSS();
    };

    color2Input.oninput = (e) => {
      customColors.activeColor2 = e.target.value;
      document.getElementById('gwColor2Hex').textContent = customColors.activeColor2;
      document.getElementById('gwColor2Swatch').style.background = customColors.activeColor2;
      applyCustomizerCSS();
    };

    fontColorInput.oninput = (e) => {
      customColors.fontColor = e.target.value;
      document.getElementById('gwFontColorSwatch').style.background = customColors.fontColor;
      applyCustomizerCSS();
    };

    strokeColorInput.oninput = (e) => {
      customColors.strokeColor = e.target.value;
      document.getElementById('gwStrokeColorSwatch').style.background = customColors.strokeColor;
      applyCustomizerCSS();
    };

    strokeWidthSlider.oninput = (e) => {
      customColors.strokeWidth = parseInt(e.target.value, 10);
      applyCustomizerCSS();
    };

    posHeightSlider.oninput = (e) => {
      subtitlePosPercent = parseInt(e.target.value, 10);
      overlay.style.top = `${subtitlePosPercent}%`;
    };

    resetCustomizerBtn.onclick = () => {
      const presetObj = CAPTION_PRESETS.find(p => p.id === currentStyle) || CAPTION_PRESETS[0];
      customColors = {
        activeColor1: presetObj.activeColor1,
        activeColor2: presetObj.activeColor2,
        fontColor: '#ffffff',
        strokeColor: '#000000',
        strokeWidth: 5
      };
      color1Input.value = customColors.activeColor1;
      color2Input.value = customColors.activeColor2;
      fontColorInput.value = customColors.fontColor;
      strokeColorInput.value = customColors.strokeColor;
      strokeWidthSlider.value = customColors.strokeWidth;
      document.getElementById('gwColor1Hex').textContent = customColors.activeColor1;
      document.getElementById('gwColor2Hex').textContent = customColors.activeColor2;
      document.getElementById('gwColor1Swatch').style.background = customColors.activeColor1;
      document.getElementById('gwColor2Swatch').style.background = customColors.activeColor2;
      document.getElementById('gwFontColorSwatch').style.background = customColors.fontColor;
      document.getElementById('gwStrokeColorSwatch').style.background = customColors.strokeColor;
      applyCustomizerCSS();
      lastActiveCue = null;
      updateActiveSubtitle();
    };

    // Animation Presets
    document.querySelectorAll('.gw-anim-btn').forEach(btn => {
      btn.onclick = () => {
        document.querySelectorAll('.gw-anim-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentAnim = btn.dataset.anim;
        lastActiveCue = null;
        updateActiveSubtitle();
      };
    });

    // Word Karaoke Toggle
    const karaokeToggle = document.getElementById('gwKaraokeToggle');
    if (karaokeToggle) {
      karaokeToggle.onchange = (e) => {
        isKaraokeActive = !!e.target.checked;
        lastActiveCue = null;
        updateActiveSubtitle();
      };
    }

    // Position Buttons
    document.querySelectorAll('.gw-pos-btn').forEach(btn => {
      btn.onclick = () => {
        currentPos = btn.dataset.pos;
        if (currentPos === 'top') subtitlePosPercent = 18;
        else if (currentPos === 'middle') subtitlePosPercent = 50;
        else subtitlePosPercent = 85;
        overlay.style.top = `${subtitlePosPercent}%`;
        posHeightSlider.value = subtitlePosPercent;
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
      cues = generateDefaultCues(dur, subLangSelect.value);
      renderCues();
      updateActiveSubtitle();
      transcribeStatus.textContent = `⚡ Generated ${cues.length} auto-synced subtitle cues for ${subLangSelect.options[subLangSelect.selectedIndex].text}!`;
    };

    // 2. Whisper AI Backend Transcription Button
    whisperAiBtn.onclick = async () => {
      if (!videoFile && (!video.src || video.src.startsWith('blob:http') === false)) {
        alert('Please select or upload a video file first for Whisper AI transcription.');
        return;
      }

      whisperAiBtn.disabled = true;
      transcribeStatus.textContent = '⏳ Extracting audio track from video for Whisper AI…';

      try {
        let audioBlob = null;
        let format = 'wav';

        if (videoFile) {
          const res = await extractAudioWav(videoFile, 90);
          audioBlob = res.blob;
          format = res.format;
        } else {
          const res = await fetch(video.src);
          audioBlob = await res.blob();
        }

        transcribeStatus.textContent = '🤖 Sending audio to OpenAI Whisper API for exact word transcription…';

        const apiKey = getActiveWhisperKey();
        let payload = null;

        if (apiKey) {
          const formData = new FormData();
          formData.append('file', audioBlob, `audio.${format}`);
          formData.append('model', 'whisper-1');
          formData.append('response_format', 'verbose_json');
          formData.append('timestamp_granularities[]', 'word');

          const langVal = subLangSelect.value;
          if (langVal.startsWith('hi')) formData.append('language', 'hi');
          else if (langVal.startsWith('en')) formData.append('language', 'en');
          else if (langVal.startsWith('bn')) formData.append('language', 'bn');
          else if (langVal.startsWith('gu')) formData.append('language', 'gu');
          else if (langVal.startsWith('kn')) formData.append('language', 'kn');
          else if (langVal.startsWith('ml')) formData.append('language', 'ml');
          else if (langVal.startsWith('mr')) formData.append('language', 'mr');
          else if (langVal.startsWith('pa')) formData.append('language', 'pa');
          else if (langVal.startsWith('ta')) formData.append('language', 'ta');
          else if (langVal.startsWith('te')) formData.append('language', 'te');
          else if (langVal.startsWith('ur')) formData.append('language', 'ur');

          const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${apiKey}` },
            body: formData
          });

          if (!response.ok) {
            const errText = await response.text();
            throw new Error(`OpenAI API Error ${response.status}: ${errText}`);
          }
          payload = await response.json();
        } else {
          const audioBase64 = await blobToBase64(audioBlob);
          const response = await fetch('/api/transcribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ audio: audioBase64, language: subLangSelect.value, format })
          });
          payload = await response.json();
        }

        if (payload && Array.isArray(payload.words) && payload.words.length > 0) {
          const words = payload.words;
          cues = [];
          for (let i = 0; i < words.length; i += 3) {
            const group = words.slice(i, i + 3);
            const start = group[0].start;
            const end = group[group.length - 1].end;
            const text = group.map(g => g.word).join(' ');
            const wordList = group.map(g => ({
              word: g.word,
              start: Number(g.start.toFixed(2)),
              end: Number(g.end.toFixed(2))
            }));
            cues.push({ start: Number(start.toFixed(1)), end: Number(end.toFixed(1)), text, words: wordList });
          }
          renderCues();
          updateActiveSubtitle();
          transcribeStatus.textContent = `✨ Whisper AI successfully transcribed ${words.length} exact spoken words!`;
        } else if (payload && payload.text) {
          const words = payload.text.trim().split(/\s+/);
          const dur = video.duration || 10;
          const wDur = dur / words.length;
          cues = [];
          for (let i = 0; i < words.length; i += 3) {
            const group = words.slice(i, i + 3);
            const start = Number((i * wDur).toFixed(1));
            const end = Number(((i + group.length) * wDur).toFixed(1));
            const text = group.join(' ');
            cues.push({ start, end, text });
          }
          renderCues();
          updateActiveSubtitle();
          transcribeStatus.textContent = `✨ Transcribed voice text into ${cues.length} subtitle cues!`;
        } else {
          throw new Error('Whisper returned empty transcription text.');
        }
      } catch (err) {
        console.warn('Whisper AI failed, using fallback timeline:', err);
        cues = generateDefaultCues(video.duration || 10, subLangSelect.value);
        renderCues();
        updateActiveSubtitle();
        transcribeStatus.textContent = `⚠️ Whisper failed (${err.message}). Auto-synced timeline generated!`;
      } finally {
        whisperAiBtn.disabled = false;
      }
    };

    // 3. Web Speech API Microphone Live Transcribe Button
    autoTranscribeBtn.onclick = () => {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        alert('Web Speech API is not supported in this browser. Please use Google Chrome or Whisper AI.');
        return;
      }

      if (isTranscribing) {
        if (activeRecognition) activeRecognition.stop();
        isTranscribing = false;
        autoTranscribeBtn.textContent = '🎙️ Mic Transcribe';
        transcribeStatus.textContent = 'Voice recording stopped.';
        return;
      }

      const recognition = new SpeechRecognition();
      activeRecognition = recognition;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = subLangSelect.value;

      let transcriptBuffer = [];
      let startTime = video.currentTime || 0;

      recognition.onstart = () => {
        isTranscribing = true;
        autoTranscribeBtn.textContent = '⏹️ Stop Recording';
        transcribeStatus.textContent = '🎙️ Listening to speech… Speak clearly into microphone.';
        video.play();
      };

      recognition.onerror = (e) => {
        transcribeStatus.textContent = `Mic Transcription error: ${e.error}`;
        isTranscribing = false;
        autoTranscribeBtn.textContent = '🎙️ Mic Transcribe';
      };

      recognition.onend = () => {
        isTranscribing = false;
        autoTranscribeBtn.textContent = '🎙️ Mic Transcribe';
      };

      recognition.onresult = (e) => {
        for (let i = e.resultIndex; i < e.results.length; ++i) {
          if (e.results[i].isFinal) {
            const text = e.results[i][0].transcript.trim();
            const now = video.currentTime || (startTime + 2.0);
            cues.push({
              start: Number(startTime.toFixed(1)),
              end: Number(now.toFixed(1)),
              text: text
            });
            startTime = now;
            renderCues();
            updateActiveSubtitle();
            transcribeStatus.textContent = `⚡ Live added: "${text}"`;
          }
        }
      };

      recognition.start();
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

      let phrases = [];
      const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      if (lines.length > 1) {
        phrases = lines;
      } else {
        const words = raw.split(/\s+/).filter(Boolean);
        for (let i = 0; i < words.length; i += 3) {
          phrases.push(words.slice(i, i + 3).join(' '));
        }
      }
      if (phrases.length === 0) return;

      const dur = video.duration || (phrases.length * 1.5);
      const phraseDur = dur / phrases.length;
      cues = phrases.map((text, idx) => {
        const start = Number((idx * phraseDur).toFixed(1));
        const end = Number(((idx + 1) * phraseDur).toFixed(1));
        const rawWords = text.split(/\s+/).filter(Boolean);
        const wDur = (end - start) / Math.max(1, rawWords.length);
        const words = rawWords.map((w, wi) => ({
          word: w,
          start: Number((start + wi * wDur).toFixed(2)),
          end: Number((start + (wi + 1) * wDur).toFixed(2))
        }));
        return { start, end, text, words };
      });

      renderCues();
      updateActiveSubtitle();
      pasteModal.classList.add('hidden');
      transcribeStatus.textContent = `✅ Successfully synced ${cues.length} subtitle cues across the video!`;
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

    // 8. Burn-In Subtitles into Video via Canvas & MediaRecorder (supports every caption preset and the customizer)
    document.getElementById('gwBurnSubBtn').onclick = async () => {
      if (!videoFile && (!video.src || video.src.startsWith('blob:') === false)) {
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

        const fileName = videoFile ? videoFile.name.replace(/\.[^/.]+$/, '') : 'captioned-video';

        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'video/webm' });
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = `captioned-${fileName}.webm`;
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

          const t = video.currentTime;
          const active = cues.find(c => t >= c.start && t <= c.end);
          if (active && active.text.trim()) {
            ctx.save();
            const text = active.text.trim();
            const scale = vh / 720;
            const fontSize = Math.round(currentSize * scale * 1.4);
            const y = vh * (subtitlePosPercent / 100);
            const x = vw / 2;

            const strokeW = Math.max(1, Math.round((customColors.strokeWidth || 5) * scale));
            const color1 = customColors.activeColor1 || '#00f2fe';
            const color2 = customColors.activeColor2 || '#ffeb3b';
            const fontCol = customColors.fontColor || '#ffffff';
            const strokeCol = customColors.strokeColor || '#000000';

            if (isKaraokeActive) {
              const words = getCueWords(active);
              ctx.font = `900 ${fontSize}px "Montserrat", "Noto Sans Devanagari", "Poppins", -apple-system, sans-serif`;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';

              const spaceWidth = ctx.measureText(' ').width;
              let totalWidth = 0;
              const wordMetrics = words.map(w => {
                const m = ctx.measureText(w.word);
                totalWidth += m.width;
                return { width: m.width };
              });
              totalWidth += spaceWidth * Math.max(0, words.length - 1);

              if (currentStyle === 'hormozi') {
                const padX = fontSize * 0.4;
                const padY = fontSize * 0.25;
                ctx.fillStyle = color1;
                ctx.fillRect(x - totalWidth / 2 - padX, y - fontSize / 2 - padY, totalWidth + padX * 2, fontSize + padY * 2);
                ctx.strokeStyle = strokeCol;
                ctx.lineWidth = strokeW;
                ctx.strokeRect(x - totalWidth / 2 - padX, y - fontSize / 2 - padY, totalWidth + padX * 2, fontSize + padY * 2);
              } else if (currentStyle === 'minimal' || currentStyle === 'clean-minimal') {
                const padX = fontSize * 0.5;
                const padY = fontSize * 0.3;
                ctx.fillStyle = 'rgba(17,19,24,0.85)';
                ctx.beginPath();
                ctx.roundRect?.(x - totalWidth / 2 - padX, y - fontSize / 2 - padY, totalWidth + padX * 2, fontSize + padY * 2, 999);
                ctx.fill();
              } else if (currentStyle === 'casual') {
                const padX = fontSize * 0.5;
                const padY = fontSize * 0.25;
                ctx.fillStyle = 'rgba(255,255,255,0.92)';
                ctx.beginPath();
                ctx.roundRect?.(x - totalWidth / 2 - padX, y - fontSize / 2 - padY, totalWidth + padX * 2, fontSize + padY * 2, 999);
                ctx.fill();
              } else if (currentStyle === 'shorts') {
                const padX = fontSize * 0.4;
                const padY = fontSize * 0.2;
                ctx.fillStyle = 'rgba(0,0,0,0.88)';
                ctx.beginPath();
                ctx.roundRect?.(x - totalWidth / 2 - padX, y - fontSize / 2 - padY, totalWidth + padX * 2, fontSize + padY * 2, 12);
                ctx.fill();
              }

              let curX = x - totalWidth / 2;
              for (let i = 0; i < words.length; i++) {
                const w = words[i];
                const wm = wordMetrics[i];
                const isLastWord = (i === words.length - 1);
                const isCurrent = t >= w.start && (isLastWord ? t <= w.end : t < w.end);
                const wCenterX = curX + wm.width / 2;

                ctx.save();
                if (currentStyle === 'hormozi') {
                  if (isCurrent) {
                    ctx.fillStyle = strokeCol;
                    ctx.fillRect(curX - 4, y - fontSize / 2 - 2, wm.width + 8, fontSize + 4);
                    ctx.fillStyle = color1;
                    ctx.fillText(w.word, wCenterX, y);
                  } else {
                    ctx.fillStyle = strokeCol;
                    ctx.fillText(w.word, wCenterX, y);
                  }
                } else if (currentStyle === 'minimal' || currentStyle === 'clean-minimal') {
                  ctx.fillStyle = isCurrent ? color1 : fontCol;
                  ctx.font = `600 ${fontSize * (isCurrent ? 1.05 : 0.9)}px "Montserrat", "Noto Sans Devanagari", "Poppins", -apple-system, sans-serif`;
                  ctx.fillText(w.word, wCenterX, y);
                } else if (currentStyle === 'casual') {
                  ctx.fillStyle = isCurrent ? color1 : '#0f172a';
                  ctx.fillText(w.word, wCenterX, y);
                } else if (currentStyle === 'neon') {
                  ctx.shadowColor = color1;
                  ctx.shadowBlur = isCurrent ? 20 * scale : 5 * scale;
                  ctx.lineWidth = strokeW;
                  ctx.strokeStyle = strokeCol;
                  ctx.strokeText(w.word, wCenterX, y);
                  ctx.fillStyle = isCurrent ? color1 : color2;
                  ctx.fillText(w.word, wCenterX, y);
                } else if (currentStyle === 'fire') {
                  ctx.shadowColor = '#ff4500';
                  ctx.shadowBlur = isCurrent ? 18 * scale : 4 * scale;
                  ctx.lineWidth = strokeW;
                  ctx.strokeStyle = strokeCol;
                  ctx.strokeText(w.word, wCenterX, y);
                  ctx.fillStyle = isCurrent ? color2 : color1;
                  ctx.fillText(w.word, wCenterX, y);
                } else if (currentStyle === 'word-glow') {
                  ctx.shadowColor = color1;
                  ctx.shadowBlur = isCurrent ? 22 * scale : 2 * scale;
                  ctx.lineWidth = strokeW;
                  ctx.strokeStyle = strokeCol;
                  ctx.strokeText(w.word, wCenterX, y);
                  ctx.fillStyle = isCurrent ? color1 : fontCol;
                  ctx.fillText(w.word, wCenterX, y);
                } else if (currentStyle === 'bold-pop') {
                  ctx.lineWidth = strokeW * 1.4;
                  ctx.strokeStyle = strokeCol;
                  ctx.strokeText(w.word, wCenterX, y);
                  ctx.fillStyle = isCurrent ? color1 : color2;
                  ctx.fillText(w.word, wCenterX, y);
                } else if (currentStyle === 'word-pop' || currentStyle === 'word-drop') {
                  ctx.lineWidth = strokeW;
                  ctx.strokeStyle = strokeCol;
                  ctx.strokeText(w.word, wCenterX, y);
                  ctx.fillStyle = isCurrent ? color1 : fontCol;
                  ctx.fillText(w.word, wCenterX, y);
                } else {
                  // Viral Reel & Default
                  ctx.lineWidth = strokeW;
                  ctx.strokeStyle = strokeCol;
                  ctx.strokeText(w.word, wCenterX, y);
                  ctx.fillStyle = isCurrent ? color1 : color2;
                  ctx.fillText(w.word, wCenterX, y);
                }
                ctx.restore();

                curX += wm.width + spaceWidth;
              }
            } else {
              // Static text rendering
              ctx.font = `900 ${fontSize}px "Montserrat", "Noto Sans Devanagari", "Poppins", -apple-system, sans-serif`;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';

              if (currentStyle === 'hormozi') {
                const metrics = ctx.measureText(text);
                const padX = fontSize * 0.4;
                const padY = fontSize * 0.25;
                ctx.fillStyle = color1;
                ctx.fillRect(x - metrics.width / 2 - padX, y - fontSize / 2 - padY, metrics.width + padX * 2, fontSize + padY * 2);
                ctx.fillStyle = strokeCol;
                ctx.fillText(text, x, y);
              } else if (currentStyle === 'minimal') {
                const metrics = ctx.measureText(text);
                const padX = fontSize * 0.5;
                const padY = fontSize * 0.3;
                ctx.fillStyle = 'rgba(17,19,24,0.85)';
                ctx.beginPath();
                ctx.roundRect?.(x - metrics.width / 2 - padX, y - fontSize / 2 - padY, metrics.width + padX * 2, fontSize + padY * 2, 999);
                ctx.fill();
                ctx.fillStyle = fontCol;
                ctx.fillText(text, x, y);
              } else {
                ctx.lineWidth = strokeW;
                ctx.strokeStyle = strokeCol;
                ctx.strokeText(text, x, y);
                ctx.fillStyle = color1;
                ctx.fillText(text, x, y);
              }
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

    const workspace = document.getElementById('workspace');
    if (workspace) {
      const observer = new MutationObserver(() => {
        checkCleanedVideo();
      });
      observer.observe(workspace, { childList: true, subtree: true });
    }

    if (window.location.hash.includes('subtitlesTab')) {
      setTimeout(() => {
        selectSubtitlesTab();
        tool.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
    }

    renderCues();
    updateSamplePreview();
    selectSubtitlesTab();
  }

  ensureStyles();

  function ensureSubtitleStudioMounted() {
    const tabs = document.querySelector('#tool .tabs');
    const tool = document.getElementById('tool');
    if (tabs && tool && !document.getElementById('subtitlesTab')) {
      initSubtitleStudio();
    }
  }

  try {
    const domObserver = new MutationObserver(() => {
      ensureSubtitleStudioMounted();
    });
    domObserver.observe(document.documentElement, { childList: true, subtree: true });
  } catch {}

  const bootInterval = setInterval(ensureSubtitleStudioMounted, 60);
  setTimeout(() => clearInterval(bootInterval), 10000);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ensureSubtitleStudioMounted);
  }
  ensureSubtitleStudioMounted();
})();

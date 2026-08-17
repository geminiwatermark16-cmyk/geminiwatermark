const app = document.querySelector('#app');

app.innerHTML = `
<header class="nav wrap">
  <a class="brand" href="#top"><span>✦</span> geminiwatermark.space</a>
  <nav><a href="#tool">Remover</a><a href="#how">How it works</a><a href="#pricing">Pricing</a><a href="#faq">FAQ</a></nav>
  <a class="navBtn" href="#tool">Remove watermark</a>
</header>
<main id="top">
  <section class="hero wrap">
    <div class="badge"><i></i> Images free · 21 videos free · then ₹99</div>
    <h1>Gemini watermark.<br><span>Gone in seconds.</span></h1>
    <p class="lead">Remove supported visible Gemini watermarks from images and Veo videos in your browser. Images are free. Your first 21 successfully processed videos are free, then video processing unlocks with the ₹99 plan.</p>

    <section id="tool" class="tool">
      <div class="tabs">
        <button id="imageTab" class="active">Image <b>Free</b></button>
        <button id="videoTab">Video <b id="videoBadge">21 Free</b></button>
      </div>
      <div class="quota"><strong id="quotaTitle">Unlimited images</strong><span id="quotaText">Free image cleanup</span><em id="quotaPrice">₹0</em></div>
      <div class="toolHead">
        <div><small>VISIBLE WATERMARK REMOVER</small><h2 id="toolTitle">Drop an image</h2><p id="toolSub">PNG, JPG, JPEG or WebP · up to 20 MB</p></div>
        <span class="local">● Local browser processing</span>
      </div>
      <div id="videoOptions" class="videoOptions hidden">
        <div><strong>Video watermark type</strong><span>Most new Gemini story videos use the diamond logo.</span></div>
        <label><select id="videoProfile"><option value="diamond">New Gemini diamond</option><option value="legacy">Old Veo text</option></select></label>
      </div>
      <input id="fileInput" type="file" hidden accept="image/png,image/jpeg,image/webp">
      <button id="dropzone" class="dropzone">
        <span class="upload">↑</span>
        <strong id="dropStrong">Drop image here</strong>
        <span id="dropSub">or click to browse from your device</span>
        <em id="dropMeta">Images are free · your media is processed on this device</em>
      </button>
      <div id="workspace" class="workspace hidden">
        <div class="previews">
          <article><div class="previewTop"><b>Original</b><small id="fileMeta"></small></div><div class="media"><img id="beforeImg" alt="Original preview"><video id="beforeVideo" class="hidden" controls playsinline></video></div></article>
          <article><div class="previewTop"><b>Cleaned</b><small id="resultMeta">Ready</small></div><div class="media result"><div id="processing" class="processing hidden"><span></span><b id="processingTitle">Processing…</b><small id="processingSub">On this device</small><div class="progress"><i id="progressBar"></i></div></div><img id="afterImg" alt="Cleaned preview"><video id="afterVideo" class="hidden" controls playsinline></video></div></article>
        </div>
        <div class="actions"><button id="chooseAnother" class="secondary">Choose another</button><button id="downloadBtn" class="primary" disabled>Download cleaned <span>↓</span></button></div>
        <p id="message" class="message"></p>
      </div>
    </section>
    <p class="privacy">● Media processing stays on your device. Cashfree handles checkout data when you upgrade.</p>
  </section>

  <section class="metrics"><div class="wrap"><article><b>100%</b><span>Browser-side media</span></article><article><b>0</b><span>Media files stored</span></article><article><b>21</b><span>Videos free</span></article><article><b>₹99</b><span>Video plan</span></article></div></section>

  <section id="how" class="section dark"><div class="wrap"><small>HOW IT WORKS</small><h2>Upload. Clean. Download.</h2><div class="steps"><article><b>01</b><h3>Upload</h3><p>Select a supported Gemini image or Veo video.</p></article><article><b>02</b><h3>Process</h3><p>The browser engine detects and reverses the supported visible watermark profile.</p></article><article><b>03</b><h3>Download</h3><p>Preview the result and save the cleaned media.</p></article></div></div></section>

  <section id="pricing" class="section wrap"><small>PRICING</small><h2>Images free. 21 videos free.</h2><p class="sectionLead">Process your first 21 videos free on this browser. Video 22 onward requires the ₹99 plan.</p><div class="pricing"><article><span>IMAGES</span><div class="price"><b>₹0</b><em>forever</em></div><ul><li>Unlimited supported images</li><li>Automatic current + legacy image detection</li><li>Browser-side processing</li></ul><a href="#tool">Remove an image</a></article><article class="featured"><span>VIDEO</span><div class="price"><b>₹99</b><em>video plan</em></div><ul><li>First 21 videos free</li><li>1080×1920 story/reel support</li><li>New Gemini diamond + old Veo mode</li></ul><button id="buyPlan">Unlock video for ₹99</button></article></div></section>

  <section id="faq" class="section faq wrap"><small>FAQ</small><h2>Good to know.</h2><details open><summary>Why might a watermark remain?</summary><p>The remover targets supported Gemini/Veo visible watermark profiles. For videos, select “New Gemini diamond” for recent Gemini outputs or “Old Veo text” for older Veo clips.</p></details><details><summary>What video size works best?</summary><p>Most story/reel clips are 1080×1920 portrait, which is supported by the current Gemini diamond profile. The original video aspect ratio is preserved in the downloaded output.</p></details><details><summary>How do the 21 free videos work?</summary><p>Your first 21 successfully processed videos are free on this browser. The current quota is browser-based.</p></details><details><summary>Does this remove SynthID?</summary><p>No. This tool handles supported visible watermarks only and does not remove invisible provenance or SynthID.</p></details></section>
</main>
<footer><div class="wrap"><b>✦ geminiwatermark.space</b><span>Independent utility · © 2026</span></div></footer>

<div id="payModal" class="modal hidden"><div class="modalCard"><button id="closeModal" class="close">×</button><span class="modalKicker">VIDEO PLAN</span><h2>Unlock video</h2><p>Your 21 free videos are used. Continue with the ₹99 video plan.</p><div class="payPrice"><b>₹99</b><span>one-time checkout</span></div><label>Mobile number<input id="phone" inputmode="numeric" maxlength="10" placeholder="10-digit mobile number"></label><label>Email <em>optional</em><input id="email" type="email" placeholder="you@example.com"></label><p id="checkoutMsg" class="checkoutMsg"></p><button id="payBtn" class="payBtn">Pay ₹99 with Cashfree</button><small>Plan unlocks only after Cashfree payment is verified on the server.</small></div></div>
`;

const $ = (id) => document.getElementById(id);
const FREE_VIDEO_LIMIT = 21;
const TRIAL_COUNT_KEY = 'gw_video_free_count_v2';
const LEGACY_TRIAL_KEY = 'gw_video_free_used_v1';
const TOKEN_KEY = 'gw_video_plan_token_v1';
const state = { mode: 'image', file: null, result: null, engine: null, paid: false, detected: null, videoSize: null };
const urls = new Set();
const engineUrls = [
  'https://esm.sh/@pictx/gemini-veo-watermark-remover@0.2.4/browser?bundle',
  'https://esm.run/@pictx/gemini-veo-watermark-remover@0.2.4/browser'
];

function objectUrl(blob) { const url = URL.createObjectURL(blob); urls.add(url); return url; }
function revokeAll() { urls.forEach((url) => URL.revokeObjectURL(url)); urls.clear(); }
function freeVideoCount() {
  const saved = Number.parseInt(localStorage.getItem(TRIAL_COUNT_KEY) || '', 10);
  if (Number.isFinite(saved) && saved >= 0) return Math.min(saved, FREE_VIDEO_LIMIT);
  if (localStorage.getItem(LEGACY_TRIAL_KEY) === '1') { localStorage.setItem(TRIAL_COUNT_KEY, '1'); return 1; }
  return 0;
}
function freeVideosLeft() { return Math.max(0, FREE_VIDEO_LIMIT - freeVideoCount()); }
function canVideo() { return state.paid || freeVideosLeft() > 0; }
function setMessage(text, type = '') { $('message').textContent = text; $('message').className = `message ${type}`; }
function openModal() { $('payModal').classList.remove('hidden'); document.body.classList.add('locked'); }
function closeModal() { $('payModal').classList.add('hidden'); document.body.classList.remove('locked'); }
function resetProgress() { $('progressBar').style.width = '3%'; }

async function post(url, body) {
  const response = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.ok === false) throw new Error(data.error || 'Request failed.');
  return data;
}

async function loadEngine() {
  if (state.engine) return state.engine;
  let lastError;
  for (const url of engineUrls) {
    try {
      const mod = await import(url);
      if (typeof mod.removeGeminiWatermark === 'function' && typeof mod.processVideoFile === 'function') {
        state.engine = mod;
        return mod;
      }
    } catch (error) { lastError = error; }
  }
  throw lastError || new Error('Watermark engine could not load. Check your internet connection and try again.');
}

async function restorePlan() {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) { updateVideoUi(); return; }
  try {
    const data = await post('/api/verify-entitlement', { token });
    state.paid = Boolean(data.active);
    if (!state.paid) localStorage.removeItem(TOKEN_KEY);
  } catch { state.paid = false; }
  updateVideoUi();
}

function updateVideoUi() {
  const left = freeVideosLeft();
  $('videoBadge').textContent = state.paid ? 'Unlocked' : (left > 0 ? `${left} Free` : '₹99');
  if (state.mode !== 'video') return;
  $('quotaTitle').textContent = state.paid ? 'Video unlocked' : (left > 0 ? `${left} free video${left === 1 ? '' : 's'} left` : '21 free videos used');
  $('quotaText').textContent = state.paid ? 'Your ₹99 video plan is active' : (left > 0 ? `${freeVideoCount()} of 21 used` : 'Upgrade required before video 22');
  $('quotaPrice').textContent = state.paid ? 'Active' : (left > 0 ? '₹0' : '₹99');
}

function clearWorkspace() {
  state.file = null; state.result = null; state.detected = null; state.videoSize = null;
  revokeAll(); resetProgress();
  $('workspace').classList.add('hidden'); $('dropzone').classList.remove('hidden');
  $('beforeImg').removeAttribute('src'); $('afterImg').removeAttribute('src');
  $('beforeVideo').removeAttribute('src'); $('afterVideo').removeAttribute('src');
  $('downloadBtn').disabled = true; setMessage('');
}

function switchMode(mode) {
  state.mode = mode; clearWorkspace();
  $('imageTab').classList.toggle('active', mode === 'image');
  $('videoTab').classList.toggle('active', mode === 'video');
  $('videoOptions').classList.toggle('hidden', mode !== 'video');
  $('workspace').classList.toggle('video-workspace', mode === 'video');
  if (mode === 'image') {
    $('fileInput').accept = 'image/png,image/jpeg,image/webp';
    $('toolTitle').textContent = 'Drop an image'; $('toolSub').textContent = 'PNG, JPG, JPEG or WebP · up to 20 MB';
    $('dropStrong').textContent = 'Drop image here'; $('dropMeta').textContent = 'Images are free · automatic Gemini watermark detection';
    $('quotaTitle').textContent = 'Unlimited images'; $('quotaText').textContent = 'Free image cleanup'; $('quotaPrice').textContent = '₹0';
  } else {
    const left = freeVideosLeft();
    $('fileInput').accept = 'video/mp4,video/webm,video/quicktime';
    $('toolTitle').textContent = canVideo() ? 'Drop a story / reel video' : 'Unlock more video processing';
    $('toolSub').textContent = canVideo() ? '1080×1920 portrait recommended · MP4/WebM/MOV' : 'Your 21 free videos have been used';
    $('dropStrong').textContent = canVideo() ? 'Drop 9:16 video here' : '₹99 plan required';
    $('dropMeta').textContent = state.paid ? 'Video plan active' : (left > 0 ? `${left} free videos remaining · then ₹99` : '21 free videos used · upgrade to continue');
    updateVideoUi();
  }
}

function validate(file) {
  if (state.mode === 'image' && !file.type.startsWith('image/')) return 'Please choose an image file.';
  if (state.mode === 'video' && !file.type.startsWith('video/')) return 'Please choose a video file.';
  const maxMb = state.mode === 'image' ? 20 : 250;
  if (file.size > maxMb * 1024 * 1024) return `File is larger than ${maxMb} MB.`;
  return '';
}

function videoSupportMessage(width, height) {
  const profile = $('videoProfile').value;
  if (profile === 'diamond' && width === 1080 && height === 1920) return '1080×1920 story format detected · supported new Gemini profile.';
  if (profile === 'diamond' && width === 1920 && height === 1080) return '1920×1080 landscape detected · supported new Gemini profile.';
  if (profile === 'legacy' && [[720,1280],[1080,1920],[1280,720],[1920,1080]].some(([w,h]) => w === width && h === height)) return `${width}×${height} detected · supported legacy Veo profile.`;
  return `${width}×${height} detected. Removal quality depends on whether this resolution matches the selected watermark profile.`;
}

function showFile(file) {
  revokeAll(); state.file = file; state.result = null; state.detected = null; resetProgress();
  const url = objectUrl(file); const isImage = state.mode === 'image';
  $('beforeImg').classList.toggle('hidden', !isImage); $('afterImg').classList.toggle('hidden', !isImage);
  $('beforeVideo').classList.toggle('hidden', isImage); $('afterVideo').classList.toggle('hidden', isImage);
  $('workspace').classList.toggle('video-workspace', !isImage);
  $('fileMeta').textContent = `${(file.size / 1024 / 1024).toFixed(1)} MB`;
  $('resultMeta').textContent = 'Ready'; $('workspace').classList.remove('hidden'); $('dropzone').classList.add('hidden');
  if (isImage) {
    $('beforeImg').src = url;
    processCurrent();
  } else {
    $('beforeVideo').src = url;
    $('beforeVideo').onloadedmetadata = () => {
      const width = $('beforeVideo').videoWidth; const height = $('beforeVideo').videoHeight;
      state.videoSize = { width, height };
      $('fileMeta').textContent = `${width}×${height} · ${(file.size / 1024 / 1024).toFixed(1)} MB`;
      setMessage(videoSupportMessage(width, height));
      processCurrent();
    };
    $('beforeVideo').onerror = () => setMessage('Could not read this video. Try MP4 (H.264) in Chrome or Edge.','error');
  }
}

async function processImage(engine) {
  const result = await engine.removeGeminiWatermark(state.file);
  if (!result || !(result.blob instanceof Blob)) throw new Error('Image engine returned an invalid result.');
  state.detected = Boolean(result.detected);
  state.result = result.blob;
  $('afterImg').src = objectUrl(result.blob);
  const confidence = Number.isFinite(result.confidence) ? ` · ${Math.round(result.confidence * 100)}% confidence` : '';
  if (result.detected) {
    $('resultMeta').textContent = `Watermark removed${confidence}`;
    setMessage(`Visible Gemini watermark detected and removed${confidence}.`, 'success');
  } else {
    $('resultMeta').textContent = 'No supported mark found';
    setMessage('No supported Gemini visible watermark was detected. The output was left unchanged.', 'error');
  }
}

async function processVideo(engine) {
  if (!('VideoDecoder' in window) || !('VideoEncoder' in window)) throw new Error('Video removal requires WebCodecs. Please use the latest Chrome or Edge.');
  const profile = $('videoProfile').value;
  const options = {
    onProgress: (current, total) => {
      let pct = 3;
      if (typeof current === 'number' && typeof total === 'number' && total > 0) pct = (current / total) * 100;
      else if (current && typeof current === 'object') {
        const raw = current.progress ?? current.percent ?? 0;
        pct = raw <= 1 ? raw * 100 : raw;
      }
      $('progressBar').style.width = `${Math.max(3, Math.min(100, pct))}%`;
      if (typeof current === 'number' && typeof total === 'number') $('processingSub').textContent = `${current} / ${total} frames`;
    }
  };
  if (profile === 'legacy') options.videoProfile = 'legacy';
  const blob = await engine.processVideoFile(state.file, options);
  if (!(blob instanceof Blob) || blob.size === 0) throw new Error('Video engine did not produce an output file.');
  state.result = blob;
  $('afterVideo').src = objectUrl(blob);
  $('resultMeta').textContent = profile === 'legacy' ? 'Legacy Veo cleaned' : 'Gemini diamond cleaned';
  if (!state.paid) localStorage.setItem(TRIAL_COUNT_KEY, String(Math.min(FREE_VIDEO_LIMIT, freeVideoCount() + 1)));
  const left = freeVideosLeft();
  setMessage(state.paid ? 'Video cleaned and ready to download.' : (left > 0 ? `Video cleaned. ${left} free video${left === 1 ? '' : 's'} remaining.` : 'Video cleaned. All 21 free videos are used; video 22 requires the ₹99 plan.'), 'success');
  updateVideoUi();
}

async function processCurrent() {
  if (!state.file) return;
  if (state.mode === 'video' && !canVideo()) { openModal(); return; }
  $('processing').classList.remove('hidden'); $('downloadBtn').disabled = true; resetProgress();
  $('processingSub').textContent = 'On this device';
  $('processingTitle').textContent = state.mode === 'image' ? 'Detecting & removing watermark…' : (state.paid ? 'Processing video…' : `Processing free video ${Math.min(FREE_VIDEO_LIMIT, freeVideoCount() + 1)} of ${FREE_VIDEO_LIMIT}…`);
  try {
    const engine = await loadEngine();
    if (state.mode === 'image') await processImage(engine); else await processVideo(engine);
    $('downloadBtn').disabled = !state.result;
  } catch (error) {
    console.error(error);
    $('resultMeta').textContent = 'Failed';
    setMessage(error?.message || 'Processing failed. Try another supported file.', 'error');
  } finally { $('processing').classList.add('hidden'); }
}

function selectFile(file) {
  const error = validate(file);
  if (error) { setMessage(error, 'error'); return; }
  if (state.mode === 'video' && !canVideo()) { openModal(); return; }
  showFile(file);
}

$('dropzone').onclick = () => { if (state.mode === 'video' && !canVideo()) { openModal(); return; } $('fileInput').click(); };
$('fileInput').onchange = (event) => event.target.files[0] && selectFile(event.target.files[0]);
$('dropzone').ondragover = (event) => { event.preventDefault(); $('dropzone').classList.add('drag'); };
$('dropzone').ondragleave = () => $('dropzone').classList.remove('drag');
$('dropzone').ondrop = (event) => { event.preventDefault(); $('dropzone').classList.remove('drag'); if (event.dataTransfer.files[0]) selectFile(event.dataTransfer.files[0]); };
$('imageTab').onclick = () => switchMode('image'); $('videoTab').onclick = () => switchMode('video');
$('chooseAnother').onclick = () => switchMode(state.mode);
$('videoProfile').onchange = () => { if (state.mode === 'video' && state.videoSize) setMessage(videoSupportMessage(state.videoSize.width, state.videoSize.height)); };
$('downloadBtn').onclick = () => {
  if (!state.result) return;
  const a = document.createElement('a'); a.href = objectUrl(state.result);
  a.download = state.mode === 'image' ? 'geminiwatermark-clean.png' : 'geminiwatermark-clean.mp4';
  document.body.appendChild(a); a.click(); a.remove();
};
$('buyPlan').onclick = openModal; $('closeModal').onclick = closeModal; $('payModal').onclick = (event) => { if (event.target === $('payModal')) closeModal(); };

async function verifyOrder(orderId) {
  $('checkoutMsg').textContent = 'Verifying payment…';
  const data = await post('/api/verify-order', { orderId });
  if (!data.paid) { $('checkoutMsg').textContent = `Payment status: ${data.status}.`; return false; }
  localStorage.setItem(TOKEN_KEY, data.entitlementToken); state.paid = true; updateVideoUi();
  $('checkoutMsg').textContent = 'Payment verified. Video unlocked.'; setTimeout(closeModal, 700); return true;
}

$('payBtn').onclick = async () => {
  const phone = $('phone').value.replace(/\D/g, '').slice(-10); const email = $('email').value.trim();
  if (!/^[6-9]\d{9}$/.test(phone)) { $('checkoutMsg').textContent = 'Enter a valid 10-digit Indian mobile number.'; return; }
  const button = $('payBtn'); button.disabled = true; button.textContent = 'Opening Cashfree…';
  try {
    const order = await post('/api/create-order', { phone, email });
    if (typeof window.Cashfree !== 'function') throw new Error('Cashfree checkout SDK did not load.');
    const cashfree = window.Cashfree({ mode: order.mode });
    const result = await cashfree.checkout({ paymentSessionId: order.paymentSessionId, redirectTarget: '_modal' });
    if (result?.error) throw new Error(result.error.message || 'Checkout did not complete.');
    await verifyOrder(order.orderId);
  } catch (error) { $('checkoutMsg').textContent = error.message || 'Payment could not start.'; }
  finally { button.disabled = false; button.textContent = 'Pay ₹99 with Cashfree'; }
};

const returnedOrder = new URLSearchParams(location.search).get('cf_order_id');
if (returnedOrder) { openModal(); verifyOrder(returnedOrder).catch((error) => $('checkoutMsg').textContent = error.message); history.replaceState({}, '', location.pathname); }

switchMode('image');
restorePlan();

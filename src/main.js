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
    <p class="lead">Clean supported visible Gemini watermarks from images and Veo videos directly in your browser. Images stay free. Your first 21 videos are free, then video processing unlocks with the ₹99 plan.</p>

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
      <input id="fileInput" type="file" hidden accept="image/png,image/jpeg,image/webp">
      <button id="dropzone" class="dropzone">
        <span class="upload">↑</span>
        <strong id="dropStrong">Drop image here</strong>
        <span id="dropSub">or click to browse from your device</span>
        <em id="dropMeta">Images are free · your media is processed on this device</em>
      </button>
      <div id="workspace" class="workspace hidden">
        <div class="previews">
          <article><div class="previewTop"><b>Original</b><small id="fileMeta"></small></div><div class="media"><img id="beforeImg"><video id="beforeVideo" class="hidden" controls playsinline></video></div></article>
          <article><div class="previewTop"><b>Cleaned</b><small id="resultMeta">Ready</small></div><div class="media result"><div id="processing" class="processing hidden"><span></span><b id="processingTitle">Processing…</b><small id="processingSub">On this device</small><div class="progress"><i id="progressBar"></i></div></div><img id="afterImg"><video id="afterVideo" class="hidden" controls playsinline></video></div></article>
        </div>
        <div class="actions"><button id="chooseAnother" class="secondary">Choose another</button><button id="downloadBtn" class="primary" disabled>Download cleaned <span>↓</span></button></div>
        <p id="message" class="message"></p>
      </div>
    </section>
    <p class="privacy">● Files stay on your device for media processing. Payment details required for checkout are handled through Cashfree.</p>
  </section>

  <section class="metrics"><div class="wrap"><article><b>100%</b><span>Browser-side media</span></article><article><b>0</b><span>Media files stored</span></article><article><b>21</b><span>Videos free</span></article><article><b>₹99</b><span>Video plan</span></article></div></section>

  <section id="how" class="section dark"><div class="wrap"><small>HOW IT WORKS</small><h2>Three steps. No account.</h2><div class="steps"><article><b>01</b><h3>Upload</h3><p>Select a supported Gemini image or Veo video.</p></article><article><b>02</b><h3>Process</h3><p>The browser-side engine cleans the supported visible mark zone.</p></article><article><b>03</b><h3>Download</h3><p>Preview the result and save the cleaned media.</p></article></div></div></section>

  <section id="pricing" class="section wrap"><small>PRICING</small><h2>Images free. 21 videos free.</h2><p class="sectionLead">No image credits. Process your first 21 videos free on this browser, then unlock continued video processing for ₹99.</p><div class="pricing"><article><span>IMAGES</span><div class="price"><b>₹0</b><em>forever</em></div><ul><li>Unlimited supported images</li><li>Browser-side processing</li><li>No account required</li></ul><a href="#tool">Remove an image</a></article><article class="featured"><span>VIDEO</span><div class="price"><b>₹99</b><em>video plan</em></div><ul><li>First 21 videos free</li><li>Veo visible-mark processing</li><li>Cashfree secure checkout</li></ul><button id="buyPlan">Unlock video for ₹99</button></article></div></section>

  <section id="faq" class="section faq wrap"><small>FAQ</small><h2>Good to know.</h2><details open><summary>Are images really free?</summary><p>Yes. Supported image cleanup has no paid image plan in this version.</p></details><details><summary>How do the 21 free videos work?</summary><p>Your first 21 successfully processed supported videos are free on this browser. The current trial is browser-based and can be reset if browser storage is cleared.</p></details><details><summary>Is this affiliated with Google?</summary><p>No. geminiwatermark.space is an independent utility and is not affiliated with, sponsored by, or endorsed by Google.</p></details><details><summary>Does this remove SynthID?</summary><p>No. This tool is for supported visible watermark cleanup only and does not provide invisible provenance or SynthID removal.</p></details></section>
</main>
<footer><div class="wrap"><b>✦ geminiwatermark.space</b><span>Independent utility · © 2026</span></div></footer>

<div id="payModal" class="modal hidden"><div class="modalCard"><button id="closeModal" class="close">×</button><span class="modalKicker">VIDEO PLAN</span><h2>Unlock video</h2><p>Your 21 free videos are used. Continue with the ₹99 video plan.</p><div class="payPrice"><b>₹99</b><span>one-time checkout</span></div><label>Mobile number<input id="phone" inputmode="numeric" maxlength="10" placeholder="10-digit mobile number"></label><label>Email <em>optional</em><input id="email" type="email" placeholder="you@example.com"></label><p id="checkoutMsg" class="checkoutMsg"></p><button id="payBtn" class="payBtn">Pay ₹99 with Cashfree</button><small>Secure Cashfree checkout. Plan unlocks only after server verification.</small></div></div>
`;

const $ = id => document.getElementById(id);
const state = { mode: 'image', file: null, result: null, engine: null, paid: false };
const TRIAL_COUNT_KEY = 'gw_video_free_count_v2';
const LEGACY_TRIAL_KEY = 'gw_video_free_used_v1';
const FREE_VIDEO_LIMIT = 21;
const TOKEN_KEY = 'gw_video_plan_token_v1';
const urls = new Set();
const engineUrls = [
  'https://esm.sh/@pictx/gemini-veo-watermark-remover@0.2.4/browser?bundle',
  'https://cdn.jsdelivr.net/npm/@pictx/gemini-veo-watermark-remover@0.2.4/dist/browser.js'
];

function objectUrl(blob){ const u = URL.createObjectURL(blob); urls.add(u); return u; }
function revokeAll(){ urls.forEach(u=>URL.revokeObjectURL(u)); urls.clear(); }
function freeVideoCount(){
  const saved = Number.parseInt(localStorage.getItem(TRIAL_COUNT_KEY) || '', 10);
  if(Number.isFinite(saved) && saved >= 0) return Math.min(saved, FREE_VIDEO_LIMIT);
  if(localStorage.getItem(LEGACY_TRIAL_KEY) === '1'){
    localStorage.setItem(TRIAL_COUNT_KEY, '1');
    return 1;
  }
  return 0;
}
function freeVideosLeft(){ return Math.max(0, FREE_VIDEO_LIMIT - freeVideoCount()); }
function canVideo(){ return state.paid || freeVideosLeft() > 0; }
function setMessage(text, type=''){ $('message').textContent = text; $('message').className = `message ${type}`; }
function openModal(){ $('payModal').classList.remove('hidden'); document.body.classList.add('locked'); }
function closeModal(){ $('payModal').classList.add('hidden'); document.body.classList.remove('locked'); }

async function post(url, body){
  const r = await fetch(url, { method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify(body) });
  const data = await r.json().catch(()=>({}));
  if(!r.ok || data.ok === false) throw new Error(data.error || 'Request failed.');
  return data;
}

async function restorePlan(){
  const token = localStorage.getItem(TOKEN_KEY);
  if(!token) return;
  try { const data = await post('/api/verify-entitlement', {token}); state.paid = !!data.active; if(!state.paid) localStorage.removeItem(TOKEN_KEY); } catch {}
  updateVideoUi();
}

function updateVideoUi(){
  const left = freeVideosLeft();
  if(state.paid){ $('videoBadge').textContent='Unlocked'; }
  else if(left > 0){ $('videoBadge').textContent=`${left} Free`; }
  else $('videoBadge').textContent='₹99';
  if(state.mode === 'video'){
    $('quotaTitle').textContent = state.paid ? 'Video unlocked' : (left > 0 ? `${left} free video${left === 1 ? '' : 's'} left` : '21 free videos used');
    $('quotaText').textContent = state.paid ? 'Your ₹99 video plan is active' : (left > 0 ? `${freeVideoCount()} of 21 used · keep processing free` : 'Upgrade required before another video');
    $('quotaPrice').textContent = state.paid ? 'Active' : (left > 0 ? '₹0' : '₹99');
  }
}

function switchMode(mode){
  state.mode = mode; state.file = null; state.result = null; revokeAll();
  $('imageTab').classList.toggle('active', mode==='image'); $('videoTab').classList.toggle('active', mode==='video');
  $('workspace').classList.add('hidden'); $('dropzone').classList.remove('hidden');
  $('beforeImg').src=''; $('afterImg').src=''; $('beforeVideo').src=''; $('afterVideo').src='';
  $('downloadBtn').disabled = true; setMessage('');
  if(mode==='image'){
    $('fileInput').accept='image/png,image/jpeg,image/webp'; $('toolTitle').textContent='Drop an image'; $('toolSub').textContent='PNG, JPG, JPEG or WebP · up to 20 MB'; $('dropStrong').textContent='Drop image here'; $('dropMeta').textContent='Images are free · your media is processed on this device'; $('quotaTitle').textContent='Unlimited images'; $('quotaText').textContent='Free image cleanup'; $('quotaPrice').textContent='₹0';
  } else {
    const left = freeVideosLeft();
    $('fileInput').accept='video/mp4,video/webm,video/quicktime';
    $('toolTitle').textContent = canVideo() ? 'Drop a video' : 'Unlock more video processing';
    $('toolSub').textContent = canVideo() ? 'MP4, WebM or MOV · modern Chrome/Edge recommended' : 'Your 21 free videos have been used';
    $('dropStrong').textContent = canVideo() ? 'Drop video here' : '₹99 plan required';
    $('dropMeta').textContent = state.paid ? 'Video plan active' : (left > 0 ? `${left} of 21 free videos remaining · then ₹99` : '21 free videos used · upgrade to continue');
    updateVideoUi();
  }
}

async function loadEngine(){
  if(state.engine) return state.engine;
  let last;
  for(const url of engineUrls){
    try { const mod = await import(url); if(typeof mod.removeGeminiWatermark==='function' && typeof mod.processVideoFile==='function'){ state.engine=mod; return mod; } } catch(e){ last=e; }
  }
  throw last || new Error('Processing engine could not load.');
}

function showFile(file){
  revokeAll(); state.file=file; state.result=null;
  const u=objectUrl(file); const isImage=state.mode==='image';
  $('beforeImg').classList.toggle('hidden', !isImage); $('beforeVideo').classList.toggle('hidden', isImage); $('afterImg').classList.toggle('hidden', !isImage); $('afterVideo').classList.toggle('hidden', isImage);
  if(isImage) $('beforeImg').src=u; else $('beforeVideo').src=u;
  $('fileMeta').textContent=`${(file.size/1024/1024).toFixed(1)} MB`;
  $('resultMeta').textContent='Ready'; $('workspace').classList.remove('hidden'); $('dropzone').classList.add('hidden');
  processCurrent();
}

async function processCurrent(){
  if(!state.file) return;
  if(state.mode==='video' && !canVideo()){ openModal(); return; }
  $('processing').classList.remove('hidden'); $('downloadBtn').disabled=true; setMessage('');
  $('processingTitle').textContent = state.mode==='image' ? 'Removing visible mark…' : (state.paid ? 'Processing video…' : `Processing free video ${Math.min(FREE_VIDEO_LIMIT, freeVideoCount()+1)} of ${FREE_VIDEO_LIMIT}…`);
  try {
    const engine=await loadEngine(); let blob;
    if(state.mode==='image'){
      const bitmap = await createImageBitmap(state.file);
      const canvas=document.createElement('canvas'); canvas.width=bitmap.width; canvas.height=bitmap.height;
      const ctx=canvas.getContext('2d'); ctx.drawImage(bitmap,0,0); bitmap.close();
      const imageData=ctx.getImageData(0,0,canvas.width,canvas.height);
      const cleaned=engine.removeGeminiWatermark(imageData);
      ctx.putImageData(cleaned,0,0);
      blob=await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('Could not create output.')),'image/png',1));
    } else {
      blob=await engine.processVideoFile(state.file,{ onProgress:(p)=>{ const n=typeof p==='number'?p:(p?.progress||0); $('progressBar').style.width=`${Math.max(3,Math.min(100,n<=1?n*100:n))}%`; } });
      if(!state.paid){
        localStorage.setItem(TRIAL_COUNT_KEY, String(Math.min(FREE_VIDEO_LIMIT, freeVideoCount()+1)));
      }
    }
    state.result=blob; const u=objectUrl(blob);
    if(state.mode==='image') $('afterImg').src=u; else $('afterVideo').src=u;
    $('resultMeta').textContent='Done'; $('downloadBtn').disabled=false;
    if(state.mode==='video' && !state.paid){
      const left=freeVideosLeft();
      setMessage(left > 0 ? `Ready to download. ${left} free video${left===1?'':'s'} remaining.` : 'Ready to download. All 21 free videos are now used; the next video requires the ₹99 plan.','success');
    } else {
      setMessage('Ready to download.','success');
    }
    updateVideoUi();
  } catch(err){ console.error(err); setMessage(err?.message || 'Processing failed. Try another supported file.','error'); }
  finally { $('processing').classList.add('hidden'); }
}

function validate(file){
  if(state.mode==='image' && !file.type.startsWith('image/')) return 'Please choose an image file.';
  if(state.mode==='video' && !file.type.startsWith('video/')) return 'Please choose a video file.';
  const max=state.mode==='image'?20:250;
  if(file.size>max*1024*1024) return `File is larger than ${max} MB.`;
  return '';
}

function select(file){ const error=validate(file); if(error){ setMessage(error,'error'); return; } showFile(file); }
$('dropzone').onclick=()=>{ if(state.mode==='video' && !canVideo()){ openModal(); return; } $('fileInput').click(); };
$('fileInput').onchange=e=>e.target.files[0]&&select(e.target.files[0]);
$('dropzone').ondragover=e=>{e.preventDefault();$('dropzone').classList.add('drag')};
$('dropzone').ondragleave=()=>$('dropzone').classList.remove('drag');
$('dropzone').ondrop=e=>{e.preventDefault();$('dropzone').classList.remove('drag'); if(state.mode==='video' && !canVideo()){ openModal(); return; } if(e.dataTransfer.files[0]) select(e.dataTransfer.files[0]);};
$('imageTab').onclick=()=>switchMode('image'); $('videoTab').onclick=()=>switchMode('video'); $('chooseAnother').onclick=()=>switchMode(state.mode);
$('downloadBtn').onclick=()=>{ if(!state.result)return; const a=document.createElement('a'); a.href=objectUrl(state.result); a.download=state.mode==='image'?'geminiwatermark-clean.png':'geminiwatermark-clean.mp4'; a.click(); };
$('buyPlan').onclick=openModal; $('closeModal').onclick=closeModal; $('payModal').onclick=e=>{if(e.target===$('payModal'))closeModal()};

async function verifyOrder(orderId){
  $('checkoutMsg').textContent='Verifying payment…';
  const data=await post('/api/verify-order',{orderId});
  if(!data.paid){ $('checkoutMsg').textContent=`Payment status: ${data.status}.`; return false; }
  localStorage.setItem(TOKEN_KEY,data.entitlementToken); state.paid=true; updateVideoUi(); $('checkoutMsg').textContent='Payment verified. Video unlocked.'; setTimeout(closeModal,700); return true;
}

$('payBtn').onclick=async()=>{
  const phone=$('phone').value.replace(/\D/g,'').slice(-10), email=$('email').value.trim();
  if(!/^[6-9]\d{9}$/.test(phone)){ $('checkoutMsg').textContent='Enter a valid 10-digit Indian mobile number.'; return; }
  const btn=$('payBtn'); btn.disabled=true; btn.textContent='Opening Cashfree…';
  try{
    const order=await post('/api/create-order',{phone,email});
    if(typeof window.Cashfree!=='function') throw new Error('Cashfree checkout SDK did not load.');
    const cashfree=window.Cashfree({mode:order.mode});
    const result=await cashfree.checkout({paymentSessionId:order.paymentSessionId,redirectTarget:'_modal'});
    if(result?.error) throw new Error(result.error.message || 'Checkout did not complete.');
    await verifyOrder(order.orderId);
  }catch(err){ $('checkoutMsg').textContent=err.message || 'Payment could not start.'; }
  finally{btn.disabled=false;btn.textContent='Pay ₹99 with Cashfree';}
};

const returnedOrder=new URLSearchParams(location.search).get('cf_order_id');
if(returnedOrder){ openModal(); verifyOrder(returnedOrder).catch(e=>$('checkoutMsg').textContent=e.message); history.replaceState({},'',location.pathname); }
restorePlan();
switchMode('image');

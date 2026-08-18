await Promise.all([
  import('./video-deep-clean.js?v=20260818-10'),
  import('./video-clean-adaptive-v1.js?v=20260818-1')
]);

const mainUrl = new URL('./main-fixed.js?v=20260818-10', import.meta.url);
const response = await fetch(mainUrl, { cache: 'no-store' });
if (!response.ok) throw new Error(`Could not load the watermark remover application (${response.status}).`);
let source = await response.text();

const processNeedle = "const blob = await engine.processVideoFile(state.file, options);";
const processReplacement = `let blob;
  const adaptiveDiamond = profile === 'diamond' && (
    (state.videoSize?.width === 720 && state.videoSize?.height === 1280) ||
    (state.videoSize?.width === 1080 && state.videoSize?.height === 1920)
  );
  if (adaptiveDiamond && typeof window.__GW_ADAPTIVE_CLEAN_STORY_VIDEO__ === 'function') {
    $('processingTitle').textContent = 'Removing Gemini diamond…';
    $('processingSub').textContent = state.videoSize?.width === 720
      ? '720×1280 adaptive cleanup · smoothing artifacts'
      : '1080×1920 adaptive cleanup · smoothing artifacts';
    blob = await window.__GW_ADAPTIVE_CLEAN_STORY_VIDEO__(state.file, {
      onProgress: (progress) => {
        const pct = Math.max(3, Math.min(100, Number(progress || 0) * 100));
        $('progressBar').style.width = pct + '%';
      }
    });
  } else if (profile === 'diamond' && state.videoSize?.width === 1080 && state.videoSize?.height === 1920 && typeof window.__GW_EXACT_CLEAN_STORY_VIDEO__ === 'function') {
    $('processingTitle').textContent = 'Removing Gemini diamond…';
    $('processingSub').textContent = 'Exact reverse-alpha · no blur or patch';
    blob = await window.__GW_EXACT_CLEAN_STORY_VIDEO__(state.file, {
      onProgress: (progress) => {
        const pct = Math.max(3, Math.min(100, Number(progress || 0) * 100));
        $('progressBar').style.width = pct + '%';
      }
    });
  } else {
    blob = await engine.processVideoFile(state.file, options);
  }`;

if (!source.includes(processNeedle)) throw new Error('Video cleanup hook could not be installed.');
source = source.replace(processNeedle, processReplacement);

source = source.replace(
  "if (profile === 'diamond' && width === 1080 && height === 1920) return '1080×1920 story format detected · supported new Gemini profile.';",
  "if (profile === 'diamond' && [[720,1280],[1080,1920]].some(([w,h]) => w === width && h === height)) return `${width}×${height} story format detected · supported new Gemini diamond profile.`;"
);
source = source
  .replace('1080×1920 portrait recommended · MP4/WebM/MOV', '720×1280 or 1080×1920 portrait · MP4/WebM/MOV')
  .replace('<li>1080×1920 story/reel support</li>', '<li>720×1280 + 1080×1920 story/reel support</li>')
  .replace('Most story/reel clips are 1080×1920 portrait, which is supported by the current Gemini diamond profile.', '720×1280 and 1080×1920 portrait clips are supported by the current Gemini diamond profile.');

const downloadNeedle = "a.download = state.mode === 'image' ? 'geminiwatermark-clean.png' : 'geminiwatermark-clean.mp4';";
const downloadReplacement = "a.download = state.mode === 'image' ? 'geminiwatermark-clean.png' : (state.result?.type?.includes('webm') ? 'geminiwatermark-clean.webm' : 'geminiwatermark-clean.mp4');";
source = source.replace(downloadNeedle, downloadReplacement);

source = source.replace(
  "if (!state.paid) localStorage.removeItem(TOKEN_KEY);",
  "if (!state.paid && data.reason === 'invalid') localStorage.removeItem(TOKEN_KEY);"
);

source = source
  .replace("Images free · 21 videos free · then ₹99", "Images free · 21 videos free · then ₹99 / 30 days")
  .replace("then video processing unlocks with the ₹99 plan.", "then video processing unlocks for 30 days with the ₹99 plan.")
  .replace("<b>₹99</b><span>Video plan</span>", "<b>₹99</b><span>30-day video plan</span>")
  .replace("Video 22 onward requires the ₹99 plan.", "Video 22 onward requires the ₹99 plan, valid for 30 days from successful payment.")
  .replace("<div class=\"price\"><b>₹99</b><em>video plan</em></div>", "<div class=\"price\"><b>₹99</b><em>for 30 days</em></div>")
  .replace("<li>New Gemini diamond + old Veo mode</li></ul><button id=\"buyPlan\">", "<li>New Gemini diamond + old Veo mode</li><li>30-day access · no automatic renewal</li></ul><button id=\"buyPlan\">")
  .replace("Continue with the ₹99 video plan.", "Continue with the ₹99 video plan. Access expires 30 days after successful payment.")
  .replace("<div class=\"payPrice\"><b>₹99</b><span>one-time checkout</span></div>", "<div class=\"payPrice\"><b>₹99</b><span>30 days · no auto-renewal</span></div>")
  .replace("Plan unlocks only after Cashfree payment is verified on the server.", "Plan unlocks only after Cashfree payment is verified on the server and remains active for 30 days.");

source = source.replace(
  '<a class="navBtn" href="#tool">Remove watermark</a>',
  '<div class="navActions"><button id="accountBtn" class="accountNavBtn" type="button">My Account</button><a class="navBtn" href="#tool">Remove watermark</a></div>'
);
source = source.replace(
  '<footer><div class="wrap"><b>✦ geminiwatermark.space</b><span>Independent utility · © 2026</span></div></footer>',
  '<footer><div class="wrap footerEnhanced"><b>✦ geminiwatermark.space</b><span>Independent utility · © 2026</span><nav class="footerLinks"><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="/refund-policy">Refund Policy</a><button id="footerAccountBtn" type="button">My Account</button></nav></div></footer>'
);

const appBlob = new Blob([source], { type: 'text/javascript' });
const appUrl = URL.createObjectURL(appBlob);
try {
  await import(appUrl);
} finally {
  URL.revokeObjectURL(appUrl);
}

const TOKEN_KEY = 'gw_video_plan_token_v1';

const shell = document.createElement('div');
shell.innerHTML = `
  <div id="accountModal" class="gwAccountModal hidden" role="dialog" aria-modal="true" aria-labelledby="gwAccountTitle">
    <div class="gwAccountCard">
      <button id="accountClose" class="gwAccountClose" type="button" aria-label="Close">×</button>
      <span class="gwAccountKicker">MY ACCOUNT</span>
      <h2 id="gwAccountTitle">Plan & purchase</h2>
      <div id="accountContent" class="gwAccountContent"><p>Loading…</p></div>
      <div class="gwAccountActions">
        <a href="#pricing" id="accountUpgrade">Buy / renew ₹99 plan</a>
        <button id="forgetAccount" type="button">Remove account from this browser</button>
      </div>
      <small>Account details are tied to the signed plan token stored on this browser. Media files are not uploaded or stored by this site.</small>
    </div>
  </div>
`;
document.body.appendChild(shell);

const style = document.createElement('style');
style.textContent = `
  .navActions{display:flex;align-items:center;gap:10px}.accountNavBtn{border:1px solid rgba(20,20,20,.16);background:transparent;border-radius:999px;padding:10px 14px;font:inherit;cursor:pointer}.footerEnhanced{gap:18px;flex-wrap:wrap}.footerLinks{display:flex;gap:14px;align-items:center;flex-wrap:wrap}.footerLinks a,.footerLinks button{font:inherit;color:inherit;opacity:.72;text-decoration:none;background:none;border:0;padding:0;cursor:pointer}.footerLinks a:hover,.footerLinks button:hover{opacity:1}.gwAccountModal{position:fixed;inset:0;z-index:9999;background:rgba(8,8,8,.58);display:grid;place-items:center;padding:20px}.gwAccountModal.hidden{display:none}.gwAccountCard{width:min(560px,100%);background:#f8f8f4;color:#111;border-radius:24px;padding:28px;position:relative;box-shadow:0 28px 90px rgba(0,0,0,.28)}.gwAccountClose{position:absolute;right:18px;top:14px;border:0;background:transparent;font-size:30px;cursor:pointer}.gwAccountKicker{font-size:12px;letter-spacing:.14em;font-weight:800}.gwAccountCard h2{font-size:34px;margin:8px 0 20px}.gwAccountGrid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.gwAccountItem{background:#fff;border:1px solid rgba(0,0,0,.08);border-radius:14px;padding:14px}.gwAccountItem span{display:block;font-size:11px;text-transform:uppercase;letter-spacing:.08em;opacity:.55;margin-bottom:5px}.gwAccountItem b{font-size:14px;word-break:break-word}.gwStatus{display:inline-flex;padding:7px 10px;border-radius:999px;background:#111;color:#fff;font-size:12px;margin-bottom:12px}.gwStatus.expired{background:#8f2d22}.gwAccountActions{display:flex;gap:10px;flex-wrap:wrap;margin:18px 0}.gwAccountActions a,.gwAccountActions button{border-radius:12px;padding:11px 14px;font:inherit;cursor:pointer;text-decoration:none}.gwAccountActions a{background:#111;color:white}.gwAccountActions button{background:transparent;border:1px solid rgba(0,0,0,.18)}.gwAccountCard small{display:block;opacity:.6;line-height:1.5}@media(max-width:700px){.accountNavBtn{display:none}.gwAccountGrid{grid-template-columns:1fr}.gwAccountCard{padding:24px 18px}.footerEnhanced{align-items:flex-start!important}.footerLinks{width:100%}}
`;
document.head.appendChild(style);

const accountModal = document.getElementById('accountModal');
const accountContent = document.getElementById('accountContent');

function fmtDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

async function loadAccount() {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) {
    accountContent.innerHTML = '<p>No paid plan is saved on this browser yet.</p><div class="gwAccountItem"><span>Current access</span><b>Images free · video trial / ₹99 plan</b></div>';
    return;
  }

  accountContent.innerHTML = '<p>Checking signed plan…</p>';
  try {
    const response = await fetch('/api/verify-entitlement', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    const data = await response.json();
    if (!data.ok || data.reason === 'invalid') {
      accountContent.innerHTML = '<p>This saved plan token is no longer valid.</p>';
      return;
    }

    accountContent.innerHTML = `
      <span class="gwStatus ${data.active ? '' : 'expired'}">${data.active ? 'ACTIVE' : 'EXPIRED'}</span>
      <div class="gwAccountGrid">
        <div class="gwAccountItem"><span>Plan</span><b>${data.plan || '₹99 Video — 30 days'}</b></div>
        <div class="gwAccountItem"><span>Status</span><b>${data.active ? 'Active' : 'Expired — renew to continue'}</b></div>
        <div class="gwAccountItem"><span>Paid on</span><b>${fmtDate(data.paidAt)}</b></div>
        <div class="gwAccountItem"><span>Expires on</span><b>${fmtDate(data.expiresAt)}</b></div>
        <div class="gwAccountItem"><span>Mobile</span><b>${data.phone || 'Not saved'}</b></div>
        <div class="gwAccountItem"><span>Email</span><b>${data.email || 'Not provided'}</b></div>
        <div class="gwAccountItem" style="grid-column:1/-1"><span>Cashfree order ID</span><b>${data.orderId || '—'}</b></div>
      </div>
    `;
  } catch {
    accountContent.innerHTML = '<p>Account details could not be loaded right now. Please try again.</p>';
  }
}

function openAccount() {
  accountModal.classList.remove('hidden');
  document.body.classList.add('locked');
  loadAccount();
}
function closeAccount() {
  accountModal.classList.add('hidden');
  document.body.classList.remove('locked');
}

document.getElementById('accountBtn')?.addEventListener('click', openAccount);
document.getElementById('footerAccountBtn')?.addEventListener('click', openAccount);
document.getElementById('accountClose')?.addEventListener('click', closeAccount);
accountModal.addEventListener('click', (event) => { if (event.target === accountModal) closeAccount(); });
document.getElementById('accountUpgrade')?.addEventListener('click', closeAccount);
document.getElementById('forgetAccount')?.addEventListener('click', () => {
  localStorage.removeItem(TOKEN_KEY);
  accountContent.innerHTML = '<p>Saved account token removed from this browser.</p>';
});

if (new URLSearchParams(location.search).get('account') === '1') {
  openAccount();
  history.replaceState({}, '', location.pathname);
}

const BG_MAX_MB = 20;
const BG_ENGINE_URL = 'https://esm.sh/@imgly/background-removal@1.7.0?bundle';

function waitForTool() {
  return new Promise((resolve) => {
    const find = () => {
      const tool = document.getElementById('tool');
      const tabs = tool?.querySelector('.tabs');
      const imageTab = document.getElementById('imageTab');
      const videoTab = document.getElementById('videoTab');
      if (tool && tabs && imageTab && videoTab) return resolve({ tool, tabs, imageTab, videoTab });
      requestAnimationFrame(find);
    };
    find();
  });
}

const { tool, tabs, imageTab, videoTab } = await waitForTool();

const backgroundTab = document.createElement('button');
backgroundTab.id = 'backgroundTab';
backgroundTab.type = 'button';
backgroundTab.innerHTML = 'Remove BG <b>Free</b>';
tabs.appendChild(backgroundTab);

const panel = document.createElement('div');
panel.id = 'backgroundRemovePanel';
panel.className = 'gw-bg-panel hidden';
panel.innerHTML = `
  <div class="quota gw-bg-quota"><strong>Unlimited background removal</strong><span>AI runs in your browser</span><em>₹0</em></div>
  <div class="toolHead">
    <div><small>AI BACKGROUND REMOVER</small><h2>Remove image background</h2><p>PNG, JPG, JPEG or WebP · up to ${BG_MAX_MB} MB</p></div>
    <span class="local">● Local browser processing</span>
  </div>
  <input id="bgFileInput" type="file" hidden accept="image/png,image/jpeg,image/webp">
  <button id="bgDropzone" class="dropzone" type="button">
    <span class="upload">↑</span>
    <strong>Drop image here</strong>
    <span>or click to browse from your device</span>
    <em>Free · first run downloads the AI model · image stays on this device</em>
  </button>
  <div id="bgWorkspace" class="workspace hidden">
    <div class="previews">
      <article>
        <div class="previewTop"><b>Original</b><small id="bgFileMeta"></small></div>
        <div class="media"><img id="bgBeforeImg" alt="Original image preview"></div>
      </article>
      <article>
        <div class="previewTop"><b>Background removed</b><small id="bgResultMeta">Ready</small></div>
        <div class="media result gw-bg-result-media">
          <div id="bgProcessing" class="processing hidden">
            <span></span><b id="bgProcessingTitle">Removing background…</b>
            <small id="bgProcessingSub">Loading AI model…</small>
            <div class="progress"><i id="bgProgressBar"></i></div>
          </div>
          <img id="bgAfterImg" alt="Transparent background result">
        </div>
      </article>
    </div>
    <div class="actions">
      <button id="bgChooseAnother" class="secondary" type="button">Choose another</button>
      <button id="bgDownloadBtn" class="primary" type="button" disabled>Download PNG <span>↓</span></button>
    </div>
    <p id="bgMessage" class="message"></p>
  </div>
`;

tabs.insertAdjacentElement('afterend', panel);

const style = document.createElement('style');
style.textContent = `
  #backgroundTab b{white-space:nowrap}
  .gw-bg-panel.hidden{display:none}
  .gw-bg-panel .gw-bg-result-media{background-color:#f5f5f5;background-image:linear-gradient(45deg,#ddd 25%,transparent 25%),linear-gradient(-45deg,#ddd 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#ddd 75%),linear-gradient(-45deg,transparent 75%,#ddd 75%);background-size:20px 20px;background-position:0 0,0 10px,10px -10px,-10px 0}
  .gw-bg-panel #bgProgressBar{width:3%}
  .gw-bg-native-hidden{display:none!important}
  @media(max-width:700px){#tool .tabs{overflow-x:auto;justify-content:flex-start;scrollbar-width:none}#tool .tabs::-webkit-scrollbar{display:none}#tool .tabs button{flex:0 0 auto;min-width:max-content}}
`;
document.head.appendChild(style);

const $ = (id) => document.getElementById(id);
const nativeNodes = [
  tool.querySelector(':scope > .quota'),
  tool.querySelector(':scope > .toolHead'),
  document.getElementById('videoOptions'),
  document.getElementById('fileInput'),
  document.getElementById('dropzone'),
  document.getElementById('workspace')
].filter(Boolean);

let active = false;
let sourceUrl = '';
let resultUrl = '';
let resultBlob = null;
let enginePromise = null;

function revoke(url) {
  if (url) URL.revokeObjectURL(url);
}

function clearBgWorkspace() {
  revoke(sourceUrl); revoke(resultUrl);
  sourceUrl = ''; resultUrl = ''; resultBlob = null;
  $('bgBeforeImg').removeAttribute('src');
  $('bgAfterImg').removeAttribute('src');
  $('bgWorkspace').classList.add('hidden');
  $('bgDropzone').classList.remove('hidden');
  $('bgDownloadBtn').disabled = true;
  $('bgResultMeta').textContent = 'Ready';
  $('bgMessage').textContent = '';
  $('bgMessage').className = 'message';
  $('bgProgressBar').style.width = '3%';
  $('bgFileInput').value = '';
}

function setNativeVisible(visible) {
  nativeNodes.forEach((node) => {
    if (visible) node.classList.remove('gw-bg-native-hidden');
    else node.classList.add('gw-bg-native-hidden');
  });
}

function activateBackgroundMode() {
  // Return the base tool to Image first so any other injected mode (for
  // example Video Upscale) gets a chance to close itself cleanly.
  imageTab.click();
  active = true;
  imageTab.classList.remove('active');
  videoTab.classList.remove('active');
  backgroundTab.classList.add('active');
  setNativeVisible(false);
  panel.classList.remove('hidden');
  clearBgWorkspace();
  tool.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function deactivateBackgroundMode() {
  if (!active) return;
  active = false;
  backgroundTab.classList.remove('active');
  panel.classList.add('hidden');
  setNativeVisible(true);
  revoke(sourceUrl); revoke(resultUrl);
  sourceUrl = ''; resultUrl = ''; resultBlob = null;
}

backgroundTab.addEventListener('click', activateBackgroundMode);
// Capture clicks on every present/future tool tab so Remove BG never overlaps
// another injected mode.
tabs.addEventListener('click', (event) => {
  const button = event.target.closest('button');
  if (active && button && button !== backgroundTab) deactivateBackgroundMode();
}, { capture: true });

async function loadBackgroundEngine() {
  if (!enginePromise) {
    enginePromise = import(BG_ENGINE_URL).then((mod) => {
      if (typeof mod.removeBackground !== 'function') throw new Error('Background removal engine could not load.');
      return mod.removeBackground;
    }).catch((error) => {
      enginePromise = null;
      throw error;
    });
  }
  return enginePromise;
}

function setBgMessage(text, type = '') {
  $('bgMessage').textContent = text;
  $('bgMessage').className = `message ${type}`;
}

function validateImage(file) {
  if (!file?.type?.startsWith('image/')) return 'Please choose a PNG, JPG, JPEG or WebP image.';
  if (file.size > BG_MAX_MB * 1024 * 1024) return `Image is larger than ${BG_MAX_MB} MB.`;
  return '';
}

async function processBackground(file) {
  const error = validateImage(file);
  if (error) { setBgMessage(error, 'error'); return; }

  revoke(sourceUrl); revoke(resultUrl);
  sourceUrl = URL.createObjectURL(file);
  resultUrl = '';
  resultBlob = null;
  $('bgBeforeImg').src = sourceUrl;
  $('bgAfterImg').removeAttribute('src');
  $('bgFileMeta').textContent = `${(file.size / 1024 / 1024).toFixed(1)} MB`;
  $('bgResultMeta').textContent = 'Processing';
  $('bgDropzone').classList.add('hidden');
  $('bgWorkspace').classList.remove('hidden');
  $('bgProcessing').classList.remove('hidden');
  $('bgDownloadBtn').disabled = true;
  $('bgProgressBar').style.width = '3%';
  setBgMessage('');

  try {
    $('bgProcessingTitle').textContent = 'Removing background…';
    $('bgProcessingSub').textContent = 'Loading AI model on this device…';
    const removeBackground = await loadBackgroundEngine();
    const blob = await removeBackground(file, {
      model: 'isnet_quint8',
      progress: (key, current, total) => {
        const safeCurrent = Number(current) || 0;
        const safeTotal = Number(total) || 0;
        const pct = safeTotal > 0 ? Math.max(3, Math.min(96, (safeCurrent / safeTotal) * 96)) : 8;
        $('bgProgressBar').style.width = `${pct}%`;
        const phase = String(key || '').replace(/^.*:/, '').replace(/[-_]/g, ' ');
        $('bgProcessingSub').textContent = phase ? `${phase}…` : 'Processing on this device…';
      }
    });

    if (!(blob instanceof Blob) || blob.size === 0) throw new Error('Background remover did not produce an image.');
    resultBlob = blob;
    resultUrl = URL.createObjectURL(blob);
    $('bgAfterImg').src = resultUrl;
    $('bgProgressBar').style.width = '100%';
    $('bgResultMeta').textContent = 'Transparent PNG ready';
    $('bgDownloadBtn').disabled = false;
    setBgMessage('Background removed. Your transparent PNG is ready to download.', 'success');
  } catch (err) {
    console.error('Background removal failed', err);
    $('bgResultMeta').textContent = 'Failed';
    setBgMessage(err?.message || 'Background removal failed. Please try another image.', 'error');
  } finally {
    $('bgProcessing').classList.add('hidden');
  }
}

$('bgDropzone').addEventListener('click', () => $('bgFileInput').click());
$('bgFileInput').addEventListener('change', (event) => {
  const file = event.target.files?.[0];
  if (file) processBackground(file);
});
$('bgDropzone').addEventListener('dragover', (event) => {
  event.preventDefault();
  $('bgDropzone').classList.add('drag');
});
$('bgDropzone').addEventListener('dragleave', () => $('bgDropzone').classList.remove('drag'));
$('bgDropzone').addEventListener('drop', (event) => {
  event.preventDefault();
  $('bgDropzone').classList.remove('drag');
  const file = event.dataTransfer?.files?.[0];
  if (file) processBackground(file);
});
$('bgChooseAnother').addEventListener('click', clearBgWorkspace);
$('bgDownloadBtn').addEventListener('click', () => {
  if (!resultBlob) return;
  const url = URL.createObjectURL(resultBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'background-removed.png';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

window.addEventListener('beforeunload', () => {
  revoke(sourceUrl); revoke(resultUrl);
});

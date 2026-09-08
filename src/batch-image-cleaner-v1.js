(() => {
  const STYLE_ID = 'gw-batch-cleaner-style';

  function ensureStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .gw-batch-workspace {
        display: none;
        background: #fff;
        border: 1px solid #dedfd9;
        border-radius: 20px;
        padding: 24px;
        margin-top: 18px;
        box-shadow: 0 12px 36px rgba(0,0,0,.06);
        text-align: left;
      }
      .gw-batch-workspace.active {
        display: block;
      }
      .gw-batch-head {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 14px;
        border-bottom: 1px solid #eee;
        padding-bottom: 16px;
        margin-bottom: 16px;
      }
      .gw-batch-head h3 {
        margin: 0 0 4px;
        font-size: 18px;
        font-weight: 800;
        color: #111;
      }
      .gw-batch-head p {
        margin: 0;
        font-size: 12px;
        color: #666;
      }
      .gw-batch-actions {
        display: flex;
        gap: 8px;
      }
      .gw-batch-btn {
        border-radius: 999px;
        padding: 9px 18px;
        font-size: 12px;
        font-weight: 800;
        cursor: pointer;
        transition: all .16s ease;
      }
      .gw-batch-btn.primary {
        background: #111318;
        color: #fff;
        border: none;
      }
      .gw-batch-btn.primary:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      .gw-batch-btn.secondary {
        background: transparent;
        color: #444;
        border: 1px solid #d0d0ca;
      }
      .gw-batch-btn.secondary:hover {
        background: #f4f4f0;
      }
      .gw-batch-progress-bar-wrap {
        width: 100%;
        height: 6px;
        background: #eee;
        border-radius: 999px;
        overflow: hidden;
        margin-bottom: 16px;
      }
      .gw-batch-progress-bar {
        width: 0%;
        height: 100%;
        background: #10b981;
        transition: width .25s ease;
      }
      .gw-batch-list {
        display: flex;
        flex-direction: column;
        gap: 10px;
        max-height: 460px;
        overflow-y: auto;
        padding-right: 4px;
      }
      .gw-batch-item {
        display: flex;
        align-items: center;
        gap: 14px;
        background: #fafaf8;
        border: 1px solid #e7e8e2;
        border-radius: 12px;
        padding: 10px 14px;
        transition: border-color .15s ease;
      }
      .gw-batch-item.done {
        border-color: #b9dec8;
        background: #f7fcf9;
      }
      .gw-batch-thumb {
        width: 48px;
        height: 48px;
        border-radius: 8px;
        object-fit: cover;
        background: #e2e2de;
        flex-shrink: 0;
      }
      .gw-batch-info {
        flex: 1;
        min-width: 0;
      }
      .gw-batch-name {
        font-size: 13px;
        font-weight: 700;
        color: #111;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .gw-batch-meta {
        font-size: 11px;
        color: #666;
        margin-top: 2px;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .gw-batch-badge {
        display: inline-block;
        font-size: 10px;
        font-weight: 800;
        padding: 2px 7px;
        border-radius: 6px;
        text-transform: uppercase;
      }
      .gw-batch-badge.waiting { background: #eee; color: #666; }
      .gw-batch-badge.processing { background: #dbeafe; color: #1e40af; }
      .gw-batch-badge.done { background: #d1fae5; color: #065f46; }
      .gw-batch-badge.error { background: #fee2e2; color: #991b1b; }

      .gw-batch-item-download {
        background: #fff;
        border: 1px solid #ccc;
        border-radius: 8px;
        padding: 6px 12px;
        font-size: 11px;
        font-weight: 700;
        cursor: pointer;
        color: #111;
      }
      .gw-batch-item-download:hover {
        background: #f0f0eb;
      }
      .gw-batch-item-download:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }
    `;
    document.head.appendChild(style);
  }

  let enginePromise = null;
  async function getEngine() {
    if (enginePromise) return enginePromise;
    const urls = [
      'https://esm.sh/@pictx/gemini-veo-watermark-remover@0.2.4/browser?bundle',
      'https://cdn.jsdelivr.net/npm/@pictx/gemini-veo-watermark-remover@0.2.4/dist/browser.js',
    ];
    enginePromise = (async () => {
      for (const u of urls) {
        try {
          const mod = await import(u);
          if (typeof mod.removeGeminiWatermark === 'function') return mod;
        } catch {}
      }
      throw new Error('Could not load image watermark engine.');
    })();
    return enginePromise;
  }

  function initBatchCleaner() {
    const tool = document.getElementById('tool');
    const fileInput = document.getElementById('fileInput');
    const dropzone = document.getElementById('dropzone');
    const imageTab = document.getElementById('imageTab');
    const videoTab = document.getElementById('videoTab');
    const singleWorkspace = document.getElementById('workspace');
    if (!tool || !fileInput) return;

    // Enable multiple image selection when in image mode
    function updateFileInputMultiple() {
      const isImage = imageTab?.classList.contains('active') ?? true;
      if (isImage) {
        fileInput.setAttribute('multiple', '');
      } else {
        fileInput.removeAttribute('multiple');
      }
    }

    imageTab?.addEventListener('click', () => {
      updateFileInputMultiple();
      const dropStrong = document.getElementById('dropStrong');
      const dropSub = document.getElementById('dropSub');
      if (dropStrong) dropStrong.textContent = 'Drop image(s) here';
      if (dropSub) dropSub.textContent = 'or click to browse · select multiple images for batch cleaning';
    });

    videoTab?.addEventListener('click', () => {
      updateFileInputMultiple();
      hideBatchWorkspace();
    });

    const tabs = document.querySelector('#tool .tabs');
    if (tabs && !document.getElementById('batchTab')) {
      const batchTab = document.createElement('button');
      batchTab.id = 'batchTab';
      batchTab.type = 'button';
      batchTab.innerHTML = 'Batch Clean <b>Images</b>';
      tabs.appendChild(batchTab);
    }

    let batchWorkspace = document.getElementById('gwBatchWorkspace');
    if (!batchWorkspace) {
      batchWorkspace = document.createElement('div');
      batchWorkspace.id = 'gwBatchWorkspace';
      batchWorkspace.className = 'gw-batch-workspace';
      batchWorkspace.innerHTML = `
        <div class="gw-batch-head">
          <div>
            <h3>Batch Image Cleaner</h3>
            <p id="gwBatchStatusText">Processing multiple images locally in browser...</p>
          </div>
          <div class="gw-batch-actions">
            <button id="gwBatchSelectFiles" class="gw-batch-btn secondary" type="button">+ Select Images</button>
            <button id="gwBatchClear" class="gw-batch-btn secondary" type="button">Close Batch</button>
            <button id="gwBatchDownloadAll" class="gw-batch-btn primary" type="button" disabled>Download All Cleaned ↓</button>
          </div>
        </div>
        <div class="gw-batch-progress-bar-wrap">
          <div id="gwBatchProgressBar" class="gw-batch-progress-bar"></div>
        </div>
        <div class="gw-batch-list" id="gwBatchList"></div>
      `;
      if (singleWorkspace) {
        singleWorkspace.parentNode.insertBefore(batchWorkspace, singleWorkspace.nextSibling);
      } else {
        tool.appendChild(batchWorkspace);
      }
      document.getElementById('gwBatchSelectFiles')?.addEventListener('click', () => {
        fileInput.setAttribute('multiple', '');
        fileInput.click();
      });
    }

    function showBatchWorkspace() {
      if (dropzone) dropzone.style.display = 'none';
      if (singleWorkspace) singleWorkspace.classList.add('hidden');
      batchWorkspace.classList.add('active');
    }

    function hideBatchWorkspace() {
      batchWorkspace.classList.remove('active');
      if (dropzone) dropzone.style.display = '';
    }

    window.__GW_HIDE_BATCH__ = hideBatchWorkspace;

    document.getElementById('gwBatchClear')?.addEventListener('click', hideBatchWorkspace);

    // Intercept file selection when multiple files are chosen
    fileInput.addEventListener('change', async (e) => {
      const files = Array.from(fileInput.files || []);
      const isImage = imageTab?.classList.contains('active') ?? true;
      if (!isImage || files.length <= 1) return;

      e.stopImmediatePropagation();
      await processBatch(files);
    }, true);

    // Also support drag & drop of multiple files
    dropzone?.addEventListener('drop', async (e) => {
      const isImage = imageTab?.classList.contains('active') ?? true;
      if (!isImage) return;
      const files = Array.from(e.dataTransfer?.files || []).filter(f => f.type.startsWith('image/'));
      if (files.length > 1) {
        e.preventDefault();
        e.stopImmediatePropagation();
        await processBatch(files);
      }
    }, true);

    async function processBatch(files) {
      showBatchWorkspace();
      const listEl = document.getElementById('gwBatchList');
      const progressEl = document.getElementById('gwBatchProgressBar');
      const statusText = document.getElementById('gwBatchStatusText');
      const downloadAllBtn = document.getElementById('gwBatchDownloadAll');

      listEl.innerHTML = '';
      progressEl.style.width = '0%';
      downloadAllBtn.disabled = true;

      const items = files.map((file, idx) => {
        const itemEl = document.createElement('div');
        itemEl.className = 'gw-batch-item';
        itemEl.id = `gw-batch-item-${idx}`;

        const thumbUrl = URL.createObjectURL(file);
        itemEl.innerHTML = `
          <img class="gw-batch-thumb" src="${thumbUrl}" alt="preview">
          <div class="gw-batch-info">
            <div class="gw-batch-name">${file.name}</div>
            <div class="gw-batch-meta">
              <span class="gw-batch-badge waiting" id="gw-badge-${idx}">Queued</span>
              <span id="gw-size-${idx}">${(file.size / 1024).toFixed(1)} KB</span>
            </div>
          </div>
          <button class="gw-batch-item-download" id="gw-dl-${idx}" type="button" disabled>Download</button>
        `;
        listEl.appendChild(itemEl);

        return { file, idx, itemEl, thumbUrl, cleanedBlob: null };
      });

      let completedCount = 0;
      statusText.textContent = `Processing 0 of ${items.length} images...`;

      try {
        const engine = await getEngine();

        for (const item of items) {
          const badge = document.getElementById(`gw-badge-${item.idx}`);
          const dlBtn = document.getElementById(`gw-dl-${item.idx}`);

          badge.className = 'gw-batch-badge processing';
          badge.textContent = 'Processing…';

          try {
            const result = await engine.removeGeminiWatermark(item.file);
            if (result && result.blob) {
              item.cleanedBlob = result.blob;
              const dlUrl = URL.createObjectURL(result.blob);

              badge.className = 'gw-batch-badge done';
              badge.textContent = result.detected ? 'Cleaned ✓' : 'Processed';
              item.itemEl.classList.add('done');

              dlBtn.disabled = false;
              dlBtn.onclick = () => {
                const a = document.createElement('a');
                a.href = dlUrl;
                a.download = `cleaned-${item.file.name.replace(/\.[^/.]+$/, '')}.png`;
                a.click();
              };
            }
          } catch (err) {
            badge.className = 'gw-batch-badge error';
            badge.textContent = 'Failed';
          }

          completedCount++;
          const pct = Math.round((completedCount / items.length) * 100);
          progressEl.style.width = `${pct}%`;
          statusText.textContent = `Completed ${completedCount} of ${items.length} images.`;
        }

        // Enable download all
        const validBlobs = items.filter(i => i.cleanedBlob);
        if (validBlobs.length > 0) {
          downloadAllBtn.disabled = false;
          downloadAllBtn.onclick = () => {
            validBlobs.forEach((item, i) => {
              setTimeout(() => {
                const a = document.createElement('a');
                a.href = URL.createObjectURL(item.cleanedBlob);
                a.download = `cleaned-${item.file.name.replace(/\.[^/.]+$/, '')}.png`;
                a.click();
              }, i * 350);
            });
          };
        }
      } catch (err) {
        statusText.textContent = `Engine error: ${err.message}`;
      }
    }
  }

  ensureStyles();
  initBatchCleaner();
})();

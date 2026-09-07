(() => {
  const STYLE_ID = 'gw-social-extract-style';

  function ensureStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .gw-link-panel {
        display: none;
        background: #fff;
        border: 1px solid #dedfd9;
        border-radius: 18px;
        padding: 24px 20px;
        text-align: center;
        margin-top: 14px;
        box-shadow: 0 4px 20px rgba(0,0,0,.04);
      }
      .gw-link-panel.active {
        display: block;
      }
      .gw-link-panel h3 {
        margin: 0 0 6px;
        font-size: 16px;
        font-weight: 800;
        color: #111;
      }
      .gw-link-panel p {
        margin: 0 0 16px;
        font-size: 12px;
        color: #666;
      }
      .gw-link-input-wrap {
        display: flex;
        gap: 8px;
        max-width: 580px;
        margin: 0 auto;
      }
      .gw-link-input-wrap input {
        flex: 1;
        padding: 12px 16px;
        border: 1px solid #d2d4cc;
        border-radius: 999px;
        font-size: 13px;
        outline: none;
        background: #fafaf8;
        transition: border-color .16s ease, box-shadow .16s ease;
      }
      .gw-link-input-wrap input:focus {
        border-color: #111318;
        background: #fff;
        box-shadow: 0 0 0 3px rgba(17,19,24,.1);
      }
      .gw-link-input-wrap button {
        background: #111318;
        color: #fff;
        border: none;
        padding: 12px 20px;
        border-radius: 999px;
        font-size: 12px;
        font-weight: 800;
        cursor: pointer;
        white-space: nowrap;
        transition: transform .14s ease, background .14s ease;
      }
      .gw-link-input-wrap button:hover {
        background: #232731;
        transform: translateY(-1px);
      }
      .gw-link-input-wrap button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        transform: none;
      }
      .gw-link-status {
        margin-top: 12px;
        font-size: 12px;
        font-weight: 700;
        min-height: 18px;
      }
      .gw-link-status.error {
        color: #d93025;
      }
      .gw-link-status.loading {
        color: #1a73e8;
      }
      .gw-link-chips {
        display: flex;
        justify-content: center;
        gap: 8px;
        flex-wrap: wrap;
        margin-top: 16px;
      }
      .gw-link-chips span {
        background: #f1f2ed;
        color: #555;
        font-size: 10px;
        font-weight: 700;
        padding: 5px 11px;
        border-radius: 999px;
      }
      @media(max-width: 520px) {
        .gw-link-input-wrap {
          flex-direction: column;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function initLinkTab() {
    const tabs = document.querySelector('#tool .tabs');
    const tool = document.getElementById('tool');
    if (!tabs || !tool) return;

    if (document.getElementById('linkTab')) return;

    const linkTab = document.createElement('button');
    linkTab.id = 'linkTab';
    linkTab.type = 'button';
    linkTab.innerHTML = 'Paste Link <b>New</b>';
    tabs.appendChild(linkTab);

    const linkPanel = document.createElement('div');
    linkPanel.id = 'linkPanel';
    linkPanel.className = 'gw-link-panel';
    linkPanel.innerHTML = `
      <h3>Paste Video or Reel Link</h3>
      <p>Clean watermarks directly from Instagram Reels, Pinterest, or direct MP4 links</p>
      <div class="gw-link-input-wrap">
        <input id="gwSocialUrlInput" type="url" placeholder="https://www.instagram.com/reel/... or https://pin.it/..." />
        <button id="gwFetchLinkBtn" type="button">Fetch Video →</button>
      </div>
      <div id="gwLinkStatus" class="gw-link-status"></div>
      <div class="gw-link-chips">
        <span>⚡ Instagram Reels</span>
        <span>⚡ Pinterest Pins</span>
        <span>⚡ Direct MP4 / WebM</span>
      </div>
    `;

    const dropzone = document.getElementById('dropzone');
    if (dropzone) {
      dropzone.parentNode.insertBefore(linkPanel, dropzone.nextSibling);
    } else {
      tool.appendChild(linkPanel);
    }

    const imageTab = document.getElementById('imageTab');
    const videoTab = document.getElementById('videoTab');
    const toolHead = tool.querySelector('.toolHead');
    const quota = tool.querySelector('.quota');

    function selectLinkTab() {
      linkTab.classList.add('active');
      linkPanel.classList.add('active');
      linkPanel.style.display = 'block';
    }

    function hideLinkTab() {
      linkTab.classList.remove('active');
      linkPanel.classList.remove('active');
      linkPanel.style.display = 'none';
    }

    window.__GW_SHOW_LINK__ = selectLinkTab;
    window.__GW_HIDE_LINK__ = hideLinkTab;

    linkTab.addEventListener('click', selectLinkTab);

    const urlInput = document.getElementById('gwSocialUrlInput');
    const fetchBtn = document.getElementById('gwFetchLinkBtn');
    const statusDiv = document.getElementById('gwLinkStatus');

    fetchBtn?.addEventListener('click', async () => {
      const url = String(urlInput?.value || '').trim();
      if (!url) {
        statusDiv.className = 'gw-link-status error';
        statusDiv.textContent = 'Please paste a valid link.';
        return;
      }

      fetchBtn.disabled = true;
      statusDiv.className = 'gw-link-status loading';
      statusDiv.textContent = 'Fetching video details…';

      try {
        let videoUrl = '';
        const isDirect = /\.(mp4|webm|mov)(\?|$)/i.test(url);

        if (isDirect) {
          videoUrl = url;
        } else {
          const res = await fetch('/api/social-extract', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ url }),
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok || !data.ok || !data.videos?.length) {
            throw new Error(data.message || data.error || 'Could not extract video from this link.');
          }
          videoUrl = data.videos[0];
        }

        statusDiv.textContent = 'Downloading media into browser…';

        const mediaResponse = await fetch(videoUrl);
        if (!mediaResponse.ok) throw new Error('Could not download media stream.');
        const blob = await mediaResponse.blob();
        const file = new File([blob], 'extracted-video.mp4', { type: blob.type || 'video/mp4' });

        statusDiv.className = 'gw-link-status';
        statusDiv.textContent = 'Video loaded! Switching to remover…';

        // Trigger file load into remover
        if (videoTab) videoTab.click();
        const fileInput = document.getElementById('fileInput');
        if (fileInput) {
          const dataTransfer = new DataTransfer();
          dataTransfer.items.add(file);
          fileInput.files = dataTransfer.files;
          fileInput.dispatchEvent(new Event('change', { bubbles: true }));
        }
      } catch (err) {
        statusDiv.className = 'gw-link-status error';
        statusDiv.textContent = err.message || 'Failed to extract video.';
      } finally {
        fetchBtn.disabled = false;
      }
    });

    urlInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') fetchBtn?.click();
    });
  }

  ensureStyles();
  initLinkTab();
})();

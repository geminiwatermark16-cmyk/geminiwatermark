// Master Tab & Workspace Coordinator for geminiwatermark.space
// Handles unified, conflict-free switching between all tools.
(() => {
  const ALL_TABS = ['subtitlesTab', 'videoTab', 'imageTab', 'batchTab', 'linkTab', 'backgroundTab', 'upscaleTab'];
  let isActivating = false;

  function pauseAllMedia() {
    ['upscaleBefore', 'upscaleAfter', 'gwSubVideo', 'beforeVideo', 'afterVideo'].forEach((id) => {
      const el = document.getElementById(id);
      if (el && typeof el.pause === 'function') {
        try { el.pause(); } catch {}
      }
    });
  }

  function getNativeElements() {
    const tool = document.getElementById('tool');
    return {
      toolHead: tool?.querySelector(':scope > .toolHead'),
      quota: tool?.querySelector(':scope > .quota'),
      dropzone: document.getElementById('dropzone'),
      workspace: document.getElementById('workspace'),
      videoOptions: document.getElementById('videoOptions'),
    };
  }

  function activateTab(tabId) {
    if (isActivating) return;
    isActivating = true;

    try {
      const tabs = document.querySelectorAll('#tool .tabs button');
      const { toolHead, quota, dropzone, workspace, videoOptions } = getNativeElements();

      // 1. Update active tab pill styling
      tabs.forEach((btn) => {
        btn.classList.toggle('active', btn.id === tabId);
      });

      // 2. Pause any playing background videos
      pauseAllMedia();

      // 3. Hide all custom injected panels cleanly
      const customPanels = [
        'upscalePanel',
        'backgroundRemovePanel',
        'linkPanel',
        'subtitlesPanel',
        'gwBatchWorkspace'
      ];
      customPanels.forEach((pId) => {
        const p = document.getElementById(pId);
        if (p) {
          p.classList.remove('active');
          p.classList.add('hidden');
          p.style.display = 'none';
        }
      });

      // 4. Handle native remover vs custom feature views
      if (tabId === 'imageTab' || tabId === 'videoTab') {
        const mode = tabId === 'imageTab' ? 'image' : 'video';

        // Restore native nodes
        [toolHead, quota, dropzone, workspace].forEach((node) => {
          if (!node) return;
          node.classList.remove('gw-bg-native-hidden', 'hidden');
          node.style.display = '';
        });

        if (videoOptions) {
          videoOptions.classList.toggle('hidden', mode !== 'video');
          videoOptions.style.display = mode === 'video' ? '' : 'none';
        }

        if (typeof window.__GW_SWITCH_MODE__ === 'function') {
          window.__GW_SWITCH_MODE__(mode);
        } else {
          const btn = document.getElementById(tabId);
          if (typeof btn?.onclick === 'function') {
            btn.onclick();
          }
        }
      } else {
        // Custom tool selected: hide native dropzone/workspace/options
        if (toolHead) toolHead.style.display = 'none';
        if (quota) quota.style.display = 'none';
        if (dropzone) dropzone.style.display = 'none';
        if (workspace) workspace.style.display = 'none';
        if (videoOptions) {
          videoOptions.classList.add('hidden');
          videoOptions.style.display = 'none';
        }

        // Show the selected custom panel
        if (tabId === 'subtitlesTab') {
          const p = document.getElementById('subtitlesPanel');
          if (p) {
            p.classList.remove('hidden');
            p.classList.add('active');
            p.style.display = 'block';
          }
        } else if (tabId === 'batchTab') {
          const p = document.getElementById('gwBatchWorkspace');
          if (p) {
            p.classList.remove('hidden');
            p.classList.add('active');
            p.style.display = 'block';
          }
        } else if (tabId === 'linkTab' || tabId === 'socialTab') {
          const p = document.getElementById('linkPanel');
          if (p) {
            p.classList.remove('hidden');
            p.classList.add('active');
            p.style.display = 'block';
          }
        } else if (tabId === 'upscaleTab') {
          const p = document.getElementById('upscalePanel');
          if (p) {
            p.classList.remove('hidden');
            p.classList.add('active');
            p.style.display = 'block';
          }
        } else if (tabId === 'backgroundTab') {
          const p = document.getElementById('backgroundRemovePanel');
          if (p) {
            p.classList.remove('hidden');
            p.classList.add('active');
            p.style.display = 'block';
          }
        }
      }
    } finally {
      isActivating = false;
    }
  }

  // Handle tab button clicks via standard bubbling
  document.addEventListener('click', (event) => {
    const btn = event.target.closest('#tool .tabs button');
    if (!btn || isActivating) return;
    if (ALL_TABS.includes(btn.id) || btn.id === 'socialTab') {
      activateTab(btn.id);
    }
  });

  // Intercept header navigation shortcuts
  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href*="subtitlesTab"], a.navBtn, a[href*="batchTab"], a[href*="socialTab"]');
    if (!link || isActivating) return;
    const href = link.getAttribute('href') || '';
    if (href.includes('subtitlesTab') || link.classList.contains('navBtn')) {
      event.preventDefault();
      activateTab('subtitlesTab');
      document.getElementById('tool')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (href.includes('batchTab')) {
      event.preventDefault();
      activateTab('batchTab');
      document.getElementById('tool')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (href.includes('socialTab')) {
      event.preventDefault();
      activateTab('linkTab');
      document.getElementById('tool')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });

  window.__GW_SWITCH_TAB__ = activateTab;

  setTimeout(() => {
    const params = new URLSearchParams(location.search);
    const hash = location.hash;
    if (params.get('mode') === 'video' || hash.includes('videoTab')) {
      activateTab('videoTab');
    } else if (params.get('mode') === 'image' || hash.includes('imageTab')) {
      activateTab('imageTab');
    } else if (params.get('mode') === 'batch' || hash.includes('batchTab')) {
      activateTab('batchTab');
    } else if (params.get('mode') === 'social' || hash.includes('socialTab') || hash.includes('linkTab')) {
      activateTab('linkTab');
    } else {
      activateTab('subtitlesTab');
    }
  }, 120);
})();

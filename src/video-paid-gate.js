// 100% Free: All video tools are completely unlocked for all users.
(() => {
  const applyUi = () => {
    const tab = document.getElementById('upscaleTab');
    if (tab) {
      const badge = tab.querySelector('b');
      if (badge && badge.textContent === 'LOCKED') badge.textContent = 'FAST';
    }

    const panel = document.getElementById('upscalePanel');
    if (panel) panel.dataset.paidVideo = '1';

    const start = document.getElementById('upscaleStart');
    if (start) start.removeAttribute('title');
  };

  applyUi();
  const observer = new MutationObserver(() => applyUi());
  observer.observe(document.documentElement, { childList: true, subtree: true });
})();

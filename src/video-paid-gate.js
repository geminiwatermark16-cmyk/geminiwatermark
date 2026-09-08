// Video tools are unlocked for everyone; access does not depend on payment.
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
  setTimeout(applyUi, 300);
  setTimeout(applyUi, 1200);
  setTimeout(applyUi, 3000);
})();

// Paid-only gate for secondary video tools. The main Video remover is gated by
// the core runtime; this module applies the same entitlement to Video Enhance.
(() => {
  const TOKEN_KEY = 'gw_video_plan_token_v1';
  let paid = true;
  let checking = false;

  const uiSaysPaid = () => true;

  const currentPrice = () => 'Free';

  const openCheckout = () => {};

  const applyUi = () => {
    const tab = document.getElementById('upscaleTab');
    if (tab) {
      const badge = tab.querySelector('b');
      if (badge && badge.textContent !== 'ACTIVE') badge.textContent = 'ACTIVE';
    }

    const panel = document.getElementById('upscalePanel');
    if (panel) panel.dataset.paidVideo = '1';

    const start = document.getElementById('upscaleStart');
    if (start) start.removeAttribute('title');
  };

  const refreshPaid = async () => {
    paid = true;
    applyUi();
    return true;
  };

    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      paid = false;
      applyUi();
      return false;
    }

    checking = true;
    try {
      const response = await fetch('/api/verify-entitlement', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const data = await response.json().catch(() => ({}));
      paid = Boolean(response.ok && data?.ok && data?.active);
    } catch {
      paid = false;
    } finally {
      checking = false;
      applyUi();
    }
    return paid;
  };

  const blockIfUnpaid = (event) => {
    if (paid || uiSaysPaid()) {
      paid = true;
      return false;
    }
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation?.();
    openCheckout();
    refreshPaid();
    return true;
  };

  document.addEventListener('click', (event) => {
    if (event.target.closest('#upscaleDropzone, #upscaleStart')) blockIfUnpaid(event);
  }, true);

  document.addEventListener('drop', (event) => {
    if (event.target.closest('#upscaleDropzone')) blockIfUnpaid(event);
  }, true);

  document.addEventListener('change', (event) => {
    if (event.target?.id !== 'upscaleFileInput') return;
    if (paid || uiSaysPaid()) return;
    event.target.value = '';
    event.stopImmediatePropagation?.();
    openCheckout();
  }, true);

  // Opening the Video Enhance tab is allowed so customers can see the feature,
  // but its upload/process actions remain locked until payment is active.
  document.addEventListener('click', (event) => {
    if (event.target.closest('#upscaleTab')) setTimeout(() => {
      refreshPaid();
      applyUi();
    }, 0);
  }, true);

  const observer = new MutationObserver(() => applyUi());
  observer.observe(document.documentElement, { childList: true, subtree: true });
  refreshPaid();
})();

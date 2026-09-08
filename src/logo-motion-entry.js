// Logo Motion is a secondary utility, so it belongs inside the Product menu
// rather than competing with the primary navigation for attention.
(() => {
  const productPanel = document.querySelector('.navMenu .navPanel');
  if (productPanel && !productPanel.querySelector('a[href="/logo-motion"]')) {
    const link = document.createElement('a');
    link.href = '/logo-motion';
    link.textContent = 'Logo motion';
    productPanel.appendChild(link);
    return;
  }

  const nav = document.querySelector('.nav nav');
  if (nav && !nav.querySelector('a[href="/logo-motion"]')) {
    const link = document.createElement('a');
    link.href = '/logo-motion';
    link.textContent = 'Logo motion';
    nav.appendChild(link);
  }
})();

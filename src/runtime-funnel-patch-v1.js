const nativeFetch = window.fetch.bind(window);

function transformMainSource(original) {
  let source = original;

  // Let unpaid visitors choose a video and see its metadata/support status first.
  source = source.replace(
    "  if (state.mode === 'video' && !canVideo()) { openModal(); return; }\n  showFile(file);",
    "  showFile(file);"
  );
  source = source.replace(
    "$('dropzone').onclick = () => { if (state.mode === 'video' && !canVideo()) { openModal(); return; } $('fileInput').click(); };",
    "$('dropzone').onclick = () => $('fileInput').click();"
  );

  // Keep the paywall before processing, but after the visitor has selected a file.
  source = source.replace(
    "  if (state.mode === 'video' && !canVideo()) { openModal(); return; }\n  $('processing').classList.remove('hidden');",
    "  if (state.mode === 'video' && !canVideo()) {\n    $('resultMeta').textContent = 'Payment required';\n    setMessage('Video loaded successfully. Complete payment to process and download the cleaned result.');\n    openModal();\n    return;\n  }\n  $('processing').classList.remove('hidden');"
  );

  // Expose a safe hand-off so successful Cashfree verification can unlock the
  // already-selected video without reloading the page (and losing the file).
  source = source.replace(
    "function selectFile(file) {",
    `window.__GW_COMPLETE_PAID_UNLOCK__ = async function () {
  state.paid = true;
  updateVideoUi();
  closeModal();
  if (state.mode === 'video' && state.file && !state.result) await processCurrent();
};
window.__GW_HAS_SELECTED_VIDEO__ = () => state.mode === 'video' && Boolean(state.file);

function selectFile(file) {`
  );

  // Track successful redirect-based payment verification too.
  source = source.replace(
    "  localStorage.setItem(TOKEN_KEY, data.entitlementToken); state.paid = true; updateVideoUi();",
    "  localStorage.setItem(TOKEN_KEY, data.entitlementToken); state.paid = true; updateVideoUi(); window.__GW_TRACK_PURCHASE__?.({ orderId: data.orderId || orderId, amount: data.amount, currency: data.currency });"
  );

  return source;
}

window.fetch = async (input, init) => {
  const requestUrl = typeof input === 'string' ? input : (input?.url || String(input || ''));
  const response = await nativeFetch(input, init);

  if (!requestUrl.includes('main-fixed.js')) return response;

  const source = transformMainSource(await response.text());
  return new Response(source, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
};

try {
  await import('./runtime-loader.js?v=20260818-13');
} finally {
  window.fetch = nativeFetch;
}

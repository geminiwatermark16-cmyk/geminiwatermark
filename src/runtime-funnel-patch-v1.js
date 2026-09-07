const nativeFetch = window.fetch.bind(window);

function transformMainSource(original) {
  let source = original;

  // Make state.paid true and canVideo always return true for 100% free access for all visitors
  source = source.replace(
    "const state = { mode: 'image', file: null, result: null, engine: null, paid: false };",
    "const state = { mode: 'image', file: null, result: null, engine: null, paid: true };"
  );
  source = source.replace(
    "function canVideo() { return state.paid || freeVideosLeft() > 0; }",
    "function canVideo() { return true; }"
  );

  // Remove paywall modal checks entirely
  source = source.replace(
    "  if (state.mode === 'video' && !canVideo()) { openModal(); return; }\n  showFile(file);",
    "  showFile(file);"
  );
  source = source.replace(
    "$('dropzone').onclick = () => { if (state.mode === 'video' && !canVideo()) { openModal(); return; } $('fileInput').click(); };",
    "$('dropzone').onclick = () => $('fileInput').click();"
  );
  source = source.replace(
    "  if (state.mode === 'video' && !canVideo()) { openModal(); return; }\n  $('processing').classList.remove('hidden');",
    "  $('processing').classList.remove('hidden');"
  );
  source = source.replace(
    "  if (state.mode === 'video' && !canVideo()) { openModal(); return; }",
    ""
  );

  // Update badges to Free
  source = source.replace(
    '<button id="videoTab">Video <b id="videoBadge">21 Free</b></button>',
    '<button id="videoTab">Video <b id="videoBadge">Free</b></button>'
  );
  source = source.replace('₹99 plan required', 'Drop video here');
  source = source.replace('Your 21 free videos have been used', '100% Free Video Processing');
  source = source.replace('Unlock more video processing', 'Drop a story / reel video');

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

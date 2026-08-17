const ENGINE_URLS = [
  'https://esm.sh/@pictx/gemini-veo-watermark-remover@0.2.4/browser?bundle',
  'https://esm.run/@pictx/gemini-veo-watermark-remover@0.2.4/browser'
];

function patchCurrentGeminiVideoPositions(engine) {
  const catalog = engine?.GEMINI_DIAMOND_VIDEO_CATALOG;
  if (!catalog) return false;

  // The npm browser package is calibrated against the older v0.5.0 profile
  // (192px right/bottom margins for 1080p diamond videos). Newer Gemini/Veo
  // exports moved the visible diamond. Current 1080x1920 story/reel samples
  // use the relocated ~128px-margin slot, matching upstream's later fix.
  const portrait = catalog['1080x1920'];
  if (portrait?.watermark?.width === 96 && portrait?.watermark?.height === 96) {
    portrait.position.x = 1080 - 96 - 128; // 856
    portrait.position.y = 1920 - 96 - 128; // 1696
  }

  const landscape = catalog['1920x1080'];
  if (landscape?.watermark?.width === 96 && landscape?.watermark?.height === 96) {
    landscape.position.x = 1920 - 96 - 128; // 1696
    landscape.position.y = 1080 - 96 - 128; // 856
  }

  window.__GW_VIDEO_PROFILE_PATCHED__ = true;
  window.__GW_VIDEO_PROFILE__ = {
    portrait: portrait ? { ...portrait.position } : null,
    landscape: landscape ? { ...landscape.position } : null,
  };
  return true;
}

let patched = false;
let lastError = null;
for (const url of ENGINE_URLS) {
  try {
    const engine = await import(url);
    if (patchCurrentGeminiVideoPositions(engine)) {
      patched = true;
      window.__GW_ENGINE_URL__ = url;
      break;
    }
  } catch (error) {
    lastError = error;
  }
}

if (!patched) {
  console.warn('Gemini video position patch could not be applied.', lastError);
}

export { patched };

(() => {
  const STYLE_ID = 'gw-slider-v1-style';

  function ensureStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .gw-view-switcher {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 8px;
        margin: 12px 0 16px;
      }
      .gw-view-btn {
        background: rgba(17, 19, 24, 0.05);
        color: #444;
        border: 1px solid rgba(0, 0, 0, 0.1);
        border-radius: 999px;
        padding: 6px 14px;
        font-size: 11px;
        font-weight: 700;
        cursor: pointer;
        transition: all .18s ease;
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }
      .gw-view-btn:hover {
        background: rgba(17, 19, 24, 0.1);
      }
      .gw-view-btn.active {
        background: #111318;
        color: #fff;
        border-color: #111318;
        box-shadow: 0 4px 12px rgba(0,0,0,.15);
      }

      .gw-split-slider-wrap {
        position: relative;
        width: 100%;
        max-width: 720px;
        margin: 0 auto 16px;
        aspect-ratio: 16 / 9;
        max-height: 480px;
        border-radius: 16px;
        overflow: hidden;
        user-select: none;
        -webkit-user-select: none;
        touch-action: pan-y;
        box-shadow: 0 12px 36px rgba(0,0,0,.12);
        background: #15171e;
      }
      .gw-split-slider-wrap img {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: contain;
        display: block;
        pointer-events: none;
      }
      .gw-split-before-layer {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        overflow: hidden;
      }
      .gw-split-before-layer img {
        width: 100%;
        height: 100%;
        object-fit: contain;
      }
      .gw-split-divider {
        position: absolute;
        top: 0;
        bottom: 0;
        width: 3px;
        background: #fff;
        box-shadow: 0 0 10px rgba(0,0,0,.5);
        cursor: ew-resize;
        z-index: 10;
        transform: translateX(-50%);
      }
      .gw-split-handle {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: #111318;
        color: #fff;
        border: 2px solid #fff;
        display: grid;
        place-items: center;
        box-shadow: 0 4px 14px rgba(0,0,0,.35);
        font-size: 13px;
        font-weight: 800;
        pointer-events: none;
      }
      .gw-split-label {
        position: absolute;
        top: 14px;
        padding: 5px 11px;
        border-radius: 8px;
        font-size: 10px;
        font-weight: 800;
        letter-spacing: .06em;
        text-transform: uppercase;
        z-index: 8;
        pointer-events: none;
        backdrop-filter: blur(8px);
      }
      .gw-split-label.before {
        left: 14px;
        background: rgba(0,0,0,.6);
        color: #ffb4b4;
        border: 1px solid rgba(255,255,255,.15);
      }
      .gw-split-label.after {
        right: 14px;
        background: rgba(16, 185, 129, 0.8);
        color: #fff;
        border: 1px solid rgba(255,255,255,.2);
      }
      .gw-split-hint {
        position: absolute;
        bottom: 12px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0,0,0,.65);
        color: #fff;
        padding: 4px 12px;
        border-radius: 999px;
        font-size: 10px;
        font-weight: 700;
        pointer-events: none;
        opacity: 0.85;
        transition: opacity .3s;
      }

      /* Homepage Showcase */
      .gw-showcase-section {
        margin: 40px auto;
        text-align: center;
      }
      .gw-showcase-card {
        margin: 20px auto 0;
        max-width: 820px;
        background: #fff;
        border: 1px solid #dedfd9;
        border-radius: 24px;
        padding: 20px;
        box-shadow: 0 16px 40px rgba(0,0,0,.06);
      }
      .gw-showcase-features {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 12px;
        margin-top: 18px;
        text-align: left;
      }
      .gw-showcase-feat {
        background: #f9f9f6;
        border: 1px solid #eaeae5;
        border-radius: 14px;
        padding: 12px 14px;
      }
      .gw-showcase-feat b {
        display: block;
        font-size: 12px;
        color: #111;
        margin-bottom: 2px;
      }
      .gw-showcase-feat span {
        font-size: 11px;
        color: #666;
        line-height: 1.4;
        display: block;
      }
      @media(max-width: 680px) {
        .gw-showcase-features {
          grid-template-columns: 1fr;
        }
      }
    `;
    document.head.appendChild(style);
  }

  // Create an interactive slider widget inside a target container
  function createSlider(container, beforeSrc, afterSrc, initialPct = 50) {
    container.innerHTML = `
      <div class="gw-split-slider-wrap" role="region" aria-label="Before and after comparison slider">
        <img class="gw-split-after-img" src="${afterSrc}" alt="Cleaned result">
        <div class="gw-split-before-layer" style="width: ${initialPct}%">
          <img class="gw-split-before-img" src="${beforeSrc}" alt="Original with watermark">
        </div>
        <div class="gw-split-divider" style="left: ${initialPct}%" tabindex="0" role="slider" aria-valuenow="${initialPct}" aria-valuemin="0" aria-valuemax="100" aria-label="Comparison divider">
          <div class="gw-split-handle">⇄</div>
        </div>
        <span class="gw-split-label before">Original (Watermark)</span>
        <span class="gw-split-label after">Cleaned ✨</span>
        <span class="gw-split-hint">‹ Drag left/right to compare ›</span>
      </div>
    `;

    const wrap = container.querySelector('.gw-split-slider-wrap');
    const layer = container.querySelector('.gw-split-before-layer');
    const divider = container.querySelector('.gw-split-divider');
    const hint = container.querySelector('.gw-split-hint');

    let dragging = false;

    function setPosition(x) {
      const rect = wrap.getBoundingClientRect();
      const clampedX = Math.max(0, Math.min(x - rect.left, rect.width));
      const pct = (clampedX / rect.width) * 100;
      layer.style.width = pct + '%';
      divider.style.left = pct + '%';
      divider.setAttribute('aria-valuenow', Math.round(pct));
      if (hint) hint.style.opacity = '0';
    }

    function onPointerDown(e) {
      dragging = true;
      setPosition(e.clientX || (e.touches && e.touches[0].clientX));
      wrap.setPointerCapture?.(e.pointerId);
    }

    function onPointerMove(e) {
      if (!dragging && e.type !== 'touchmove') return;
      const x = e.clientX || (e.touches && e.touches[0].clientX);
      if (x != null) setPosition(x);
    }

    function onPointerUp(e) {
      dragging = false;
      wrap.releasePointerCapture?.(e.pointerId);
    }

    wrap.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    // Keyboard navigation for accessibility
    divider.addEventListener('keydown', (e) => {
      let current = parseFloat(divider.style.left) || 50;
      if (e.key === 'ArrowLeft') current = Math.max(0, current - 5);
      else if (e.key === 'ArrowRight') current = Math.min(100, current + 5);
      else return;
      e.preventDefault();
      layer.style.width = current + '%';
      divider.style.left = current + '%';
      divider.setAttribute('aria-valuenow', Math.round(current));
    });
  }

  // Generate SVG demo images for landing page showcase
  function generateDemoImages() {
    const w = 960;
    const h = 540;
    const cleanSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#141824"/>
            <stop offset="50%" stop-color="#1b233a"/>
            <stop offset="100%" stop-color="#2d1e3d"/>
          </linearGradient>
          <linearGradient id="sphereGrad" x1="20%" y1="20%" x2="80%" y2="80%">
            <stop offset="0%" stop-color="#60a5fa"/>
            <stop offset="40%" stop-color="#a855f7"/>
            <stop offset="100%" stop-color="#ec4899"/>
          </linearGradient>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="30" result="blur"/>
            <feComposite in="SourceGraphic" in2="blur" operator="over"/>
          </filter>
        </defs>
        <rect width="${w}" height="${h}" fill="url(#bg)"/>
        <circle cx="480" cy="270" r="160" fill="url(#sphereGrad)" filter="url(#glow)" opacity="0.9"/>
        <circle cx="480" cy="270" r="130" fill="url(#sphereGrad)"/>
        <path d="M 300,380 Q 480,240 660,380" stroke="rgba(255,255,255,0.4)" stroke-width="2" fill="none"/>
        <text x="480" y="275" fill="#ffffff" font-family="-apple-system,BlinkMacSystemFont,sans-serif" font-size="28" font-weight="700" text-anchor="middle" letter-spacing="2">AI GENERATED SCENE</text>
        <text x="480" y="310" fill="rgba(255,255,255,0.7)" font-family="-apple-system,BlinkMacSystemFont,sans-serif" font-size="14" text-anchor="middle">Seamless visible watermark cleanup</text>
      </svg>
    `;

    const watermarkedSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#141824"/>
            <stop offset="50%" stop-color="#1b233a"/>
            <stop offset="100%" stop-color="#2d1e3d"/>
          </linearGradient>
          <linearGradient id="sphereGrad" x1="20%" y1="20%" x2="80%" y2="80%">
            <stop offset="0%" stop-color="#60a5fa"/>
            <stop offset="40%" stop-color="#a855f7"/>
            <stop offset="100%" stop-color="#ec4899"/>
          </linearGradient>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="30" result="blur"/>
            <feComposite in="SourceGraphic" in2="blur" operator="over"/>
          </filter>
        </defs>
        <rect width="${w}" height="${h}" fill="url(#bg)"/>
        <circle cx="480" cy="270" r="160" fill="url(#sphereGrad)" filter="url(#glow)" opacity="0.9"/>
        <circle cx="480" cy="270" r="130" fill="url(#sphereGrad)"/>
        <path d="M 300,380 Q 480,240 660,380" stroke="rgba(255,255,255,0.4)" stroke-width="2" fill="none"/>
        <text x="480" y="275" fill="#ffffff" font-family="-apple-system,BlinkMacSystemFont,sans-serif" font-size="28" font-weight="700" text-anchor="middle" letter-spacing="2">AI GENERATED SCENE</text>
        <text x="480" y="310" fill="rgba(255,255,255,0.7)" font-family="-apple-system,BlinkMacSystemFont,sans-serif" font-size="14" text-anchor="middle">Seamless visible watermark cleanup</text>
        
        <!-- Gemini Visible Watermark Diamond in bottom-right corner -->
        <g transform="translate(${w - 110}, ${h - 110})">
          <rect x="-10" y="-10" width="80" height="80" rx="14" fill="rgba(0,0,0,0.45)" backdrop-filter="blur(10px)"/>
          <path d="M30,8 C30,20 42,32 54,32 C42,32 30,44 30,56 C30,44 18,32 6,32 C18,32 30,20 30,8 Z" fill="#ffffff" opacity="0.95"/>
        </g>
      </svg>
    `;

    const cleanSrc = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(cleanSvg);
    const watermarkedSrc = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(watermarkedSvg);
    return { cleanSrc, watermarkedSrc };
  }

  // Inject workspace slider toggle
  function initWorkspaceSliderHook() {
    const workspace = document.getElementById('workspace');
    if (!workspace) return;

    const previews = workspace.querySelector('.previews');
    if (!previews) return;

    let switcher = document.getElementById('gwViewSwitcher');
    if (!switcher) {
      switcher = document.createElement('div');
      switcher.id = 'gwViewSwitcher';
      switcher.className = 'gw-view-switcher';
      switcher.innerHTML = `
        <button type="button" class="gw-view-btn active" id="gwSideBySideBtn">⧉ Side by side</button>
        <button type="button" class="gw-view-btn" id="gwSplitSliderBtn">☷ Split Slider</button>
      `;
      previews.parentNode.insertBefore(switcher, previews);
    }

    let sliderContainer = document.getElementById('gwWorkspaceSlider');
    if (!sliderContainer) {
      sliderContainer = document.createElement('div');
      sliderContainer.id = 'gwWorkspaceSlider';
      sliderContainer.style.display = 'none';
      previews.parentNode.insertBefore(sliderContainer, previews.nextSibling);
    }

    const sideBtn = document.getElementById('gwSideBySideBtn');
    const splitBtn = document.getElementById('gwSplitSliderBtn');

    function updateView(mode) {
      if (mode === 'split') {
        splitBtn.classList.add('active');
        sideBtn.classList.remove('active');
        previews.style.display = 'none';
        sliderContainer.style.display = 'block';

        const beforeImg = document.getElementById('beforeImg');
        const afterImg = document.getElementById('afterImg');
        if (beforeImg?.src && afterImg?.src) {
          createSlider(sliderContainer, beforeImg.src, afterImg.src);
        }
      } else {
        sideBtn.classList.add('active');
        splitBtn.classList.remove('active');
        previews.style.display = 'grid';
        sliderContainer.style.display = 'none';
      }
    }

    sideBtn.addEventListener('click', () => updateView('side'));
    splitBtn.addEventListener('click', () => updateView('split'));

    // Observe when image result is populated
    const afterImg = document.getElementById('afterImg');
    if (afterImg) {
      const observer = new MutationObserver(() => {
        if (splitBtn.classList.contains('active') && afterImg.src) {
          const beforeImg = document.getElementById('beforeImg');
          if (beforeImg?.src) createSlider(sliderContainer, beforeImg.src, afterImg.src);
        }
      });
      observer.observe(afterImg, { attributes: true, attributeFilter: ['src'] });
    }
  }

  // Inject homepage interactive demo showcase
  function initHomepageShowcase() {
    if (document.getElementById('showcase')) return;
    const howSection = document.getElementById('how');
    if (!howSection) return;

    const showcase = document.createElement('section');
    showcase.id = 'showcase';
    showcase.className = 'section wrap gw-showcase-section';
    showcase.innerHTML = `
      <small>INTERACTIVE COMPARISON</small>
      <h2>See the visible watermark disappear.</h2>
      <p class="sectionLead">Drag the slider horizontally to compare the raw Gemini export with the watermark-cleaned result.</p>
      <div class="gw-showcase-card">
        <div id="gwDemoSlider"></div>
        <div class="gw-showcase-features">
          <div class="gw-showcase-feat">
            <b>100% In-Browser</b>
            <span>Zero server uploads. Your media files are processed locally via Canvas & WebAssembly.</span>
          </div>
          <div class="gw-showcase-feat">
            <b>Edge Smoothing</b>
            <span>Reverse-alpha reconstruction removes the star/diamond watermark without ugly blur.</span>
          </div>
          <div class="gw-showcase-feat">
            <b>Original Quality</b>
            <span>Preserves exact resolution, aspect ratio, frame rate, and color fidelity.</span>
          </div>
        </div>
      </div>
    `;
    howSection.parentNode.insertBefore(showcase, howSection);

    const demoContainer = document.getElementById('gwDemoSlider');
    if (demoContainer) {
      const { cleanSrc, watermarkedSrc } = generateDemoImages();
      createSlider(demoContainer, watermarkedSrc, cleanSrc, 55);
    }
  }

  ensureStyles();
  initWorkspaceSliderHook();
  initHomepageShowcase();
})();

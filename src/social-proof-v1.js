(() => {
  const STYLE_ID = 'gw-social-proof-v2-style';
  const ROOT_ID = 'gwSocialProof';

  const ensureStyle = () => {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .gwSocialProof{max-width:1080px;margin:28px auto 0;padding:24px;border:1px solid #1e2235;border-radius:22px;background:#12141e;text-align:left;box-shadow:0 14px 34px rgba(0,0,0,.4);color:#fff}
      .gwProofHead{display:flex;align-items:flex-end;justify-content:space-between;gap:18px;margin-bottom:16px}
      .gwProofKicker{display:block;font-size:10px;letter-spacing:.14em;font-weight:800;color:#10b981;margin-bottom:6px}
      .gwProofHead h2{margin:0;font:700 clamp(23px,3vw,34px)/1.05 'Manrope',sans-serif;letter-spacing:-.035em;color:#fff}.gwProofHead h2 span{color:#00f2fe}
      .gwProofHead p{margin:0;max-width:330px;font-size:12px;line-height:1.55;color:#94a3b8}
      .gwProofStats{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
      .gwProofStat{padding:16px;border:1px solid #1e2235;background:#0d0f17;border-radius:15px}.gwProofStat strong{display:block;font-size:24px;line-height:1;color:#fff;letter-spacing:-.04em}.gwProofStat span{display:block;margin-top:6px;font-size:11px;line-height:1.4;color:#94a3b8}
      .gwFeedbackWrap{margin-top:20px;padding-top:20px;border-top:1px solid #1e2235}.gwFeedbackWrap h3{margin:0 0 12px;font-size:13px;color:#fff;font-weight:700}.gwFeedbackGrid{display:grid;grid-template-columns:repeat(5,1fr);gap:10px}
      .gwFeedbackCard{position:relative;margin:0;overflow:hidden;border:1px solid #1e2235;border-radius:14px;background:#0d0f17;aspect-ratio:3/4;padding:14px;display:flex;flex-direction:column;justify-content:space-between}
      .gwFeedbackCard img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
      .gwSampleTag{display:inline-flex;align-items:center;width:max-content;padding:4px 8px;border-radius:999px;background:#1e2235;color:#10b981;font-size:8px;font-weight:900;letter-spacing:.1em}
      .gwSampleAvatar{width:32px;height:32px;border-radius:50%;display:grid;place-items:center;background:rgba(16,185,129,0.15);color:#10b981;font-size:12px;font-weight:900;margin-top:8px}
      .gwSampleStars{font-size:11px;letter-spacing:1px;margin:8px 0 6px;color:#facc15}.gwSampleText{font-size:11px;line-height:1.5;color:#cbd5e1;margin:0}.gwSampleName{font-size:10px;color:#64748b;margin-top:8px}
      .gwProofNote{margin:11px 0 0!important;font-size:10px!important;line-height:1.45!important;color:#64748b!important}
      @media(max-width:760px){.gwSocialProof{padding:17px;border-radius:19px}.gwProofHead{display:block}.gwProofHead p{margin-top:8px;max-width:none}.gwProofStats{grid-template-columns:1fr}.gwFeedbackGrid{grid-template-columns:repeat(2,1fr)}}
    `;
    document.head.appendChild(style);
  };

  const sampleFeedback = [
    { initials:'AK', text:'Sample feedback: the upload-first flow is simple and easy to understand.', name:'Example creator review' },
    { initials:'RS', text:'Sample feedback: the video workflow feels fast and clear on mobile.', name:'Example creator review' },
    { initials:'MK', text:'Sample feedback: useful for keeping the original 9:16 frame without cropping.', name:'Example creator review' },
    { initials:'SP', text:'Sample feedback: pricing and 30-day access are explained clearly before checkout.', name:'Example creator review' },
    { initials:'NV', text:'Sample feedback: the browser-based process is straightforward for exported videos.', name:'Example creator review' },
  ];

  const addSamples = (grid) => {
    grid.innerHTML = '';
    sampleFeedback.forEach((item) => {
      const card = document.createElement('figure');
      card.className = 'gwFeedbackCard';
      card.innerHTML = `
        <div>
          <span class="gwSampleTag">SAMPLE</span>
          <div class="gwSampleAvatar">${item.initials}</div>
          <div class="gwSampleStars">★★★★★</div>
          <p class="gwSampleText">${item.text}</p>
        </div>
        <figcaption class="gwSampleName">${item.name}</figcaption>
      `;
      grid.appendChild(card);
    });
  };

  const mount = () => {
    if (document.getElementById(ROOT_ID)) return true;
    const hero = document.querySelector('.hero');
    const tool = document.getElementById('tool');
    if (!hero || !tool) return false;

    ensureStyle();

    const section = document.createElement('section');
    section.id = ROOT_ID;
    section.className = 'gwSocialProof';
    section.setAttribute('aria-label', 'GeminiWatermark creator social proof');
    section.innerHTML = `
      <div class="gwProofHead">
        <div>
          <span class="gwProofKicker">CREATOR PROOF</span>
          <h2>Chosen by <span>500+ creators.</span></h2>
        </div>
        <p>Creators are using geminiwatermark.space for supported visible Google Flow, Gemini and Veo watermark cleanup.</p>
      </div>
      <div class="gwProofStats">
        <div class="gwProofStat"><strong>500+</strong><span>creators have chosen GeminiWatermark</span></div>
        <div class="gwProofStat"><strong>Upload first</strong><span>confirm your video loads before paid processing</span></div>
        <div class="gwProofStat"><strong>30 days</strong><span>video access with no automatic renewal</span></div>
      </div>
      <div class="gwFeedbackWrap" id="gwFeedbackWrap">
        <h3>Creator feedback layout</h3>
        <div class="gwFeedbackGrid" id="gwFeedbackGrid"></div>
      </div>
      <p class="gwProofNote">The 500+ creator count is based on the business's reported real usage. Cards marked SAMPLE are illustrative placeholders, not customer quotes. Real screenshots automatically replace them when uploaded.</p>
    `;

    const privacy = hero.querySelector('.privacy');
    if (privacy) privacy.insertAdjacentElement('afterend', section);
    else tool.insertAdjacentElement('afterend', section);

    const feedbackGrid = section.querySelector('#gwFeedbackGrid');
    addSamples(feedbackGrid);

    const sources = [1,2,3,4,5].map((n) => `/assets/testimonials/feedback-${n}.webp`);
    const loadedImages = [];
    let finished = 0;

    sources.forEach((src, index) => {
      const img = new Image();
      img.alt = `Real GeminiWatermark customer feedback ${index + 1}`;
      img.loading = 'lazy';
      img.decoding = 'async';
      img.onload = () => {
        loadedImages.push(img);
        finished += 1;
        if (finished === sources.length && loadedImages.length) {
          feedbackGrid.innerHTML = '';
          loadedImages.forEach((loadedImg) => {
            const figure = document.createElement('figure');
            figure.className = 'gwFeedbackCard';
            figure.appendChild(loadedImg);
            feedbackGrid.appendChild(figure);
          });
          const title = section.querySelector('#gwFeedbackWrap h3');
          if (title) title.textContent = 'Real creator feedback';
        }
      };
      img.onerror = () => {
        finished += 1;
        if (finished === sources.length && loadedImages.length) {
          feedbackGrid.innerHTML = '';
          loadedImages.forEach((loadedImg) => {
            const figure = document.createElement('figure');
            figure.className = 'gwFeedbackCard';
            figure.appendChild(loadedImg);
            feedbackGrid.appendChild(figure);
          });
          const title = section.querySelector('#gwFeedbackWrap h3');
          if (title) title.textContent = 'Real creator feedback';
        }
      };
      img.src = src;
    });

    try {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ event: 'social_proof_view', creator_count: 500 });
    } catch {}

    return true;
  };

  let attempts = 0;
  const timer = setInterval(() => {
    attempts += 1;
    if (mount() || attempts > 30) clearInterval(timer);
  }, 100);
  mount();
})();
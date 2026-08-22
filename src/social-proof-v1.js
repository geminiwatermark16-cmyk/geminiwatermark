(() => {
  const STYLE_ID = 'gw-social-proof-v1-style';
  const ROOT_ID = 'gwSocialProof';

  const ensureStyle = () => {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .gwSocialProof{max-width:920px;margin:18px auto 0;padding:22px;border:1px solid #dedfd9;border-radius:22px;background:#fff;text-align:left;box-shadow:0 14px 34px rgba(17,19,24,.05)}
      .gwProofHead{display:flex;align-items:flex-end;justify-content:space-between;gap:18px;margin-bottom:16px}
      .gwProofKicker{display:block;font-size:10px;letter-spacing:.14em;font-weight:800;color:#777c84;margin-bottom:6px}
      .gwProofHead h2{margin:0;font:650 clamp(23px,3vw,34px)/1.05 'Manrope',sans-serif;letter-spacing:-.035em;color:#111318}.gwProofHead h2 span{color:#5d68d8}
      .gwProofHead p{margin:0;max-width:330px;font-size:11px;line-height:1.55;color:#6d7178}
      .gwProofStats{display:grid;grid-template-columns:repeat(3,1fr);gap:9px}
      .gwProofStat{padding:15px;border:1px solid #e3e4df;background:#f8f8f5;border-radius:15px}.gwProofStat strong{display:block;font-size:23px;line-height:1;color:#111318;letter-spacing:-.04em}.gwProofStat span{display:block;margin-top:6px;font-size:10px;line-height:1.4;color:#6b6f76}
      .gwFeedbackWrap{display:none;margin-top:18px;padding-top:18px;border-top:1px solid #e7e8e3}.gwFeedbackWrap.show{display:block}.gwFeedbackWrap h3{margin:0 0 10px;font-size:13px;color:#111318}.gwFeedbackGrid{display:grid;grid-template-columns:repeat(5,1fr);gap:8px}.gwFeedbackCard{margin:0;overflow:hidden;border:1px solid #e1e2dd;border-radius:14px;background:#f7f7f4;aspect-ratio:3/4}.gwFeedbackCard img{width:100%;height:100%;object-fit:cover;display:block}
      .gwProofNote{margin:11px 0 0!important;font-size:9px!important;line-height:1.45!important;color:#8a8e95!important}
      @media(max-width:760px){.gwSocialProof{padding:17px;border-radius:19px}.gwProofHead{display:block}.gwProofHead p{margin-top:8px;max-width:none}.gwProofStats{grid-template-columns:1fr}.gwFeedbackGrid{grid-template-columns:repeat(2,1fr)}}
    `;
    document.head.appendChild(style);
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
        <h3>Real creator feedback</h3>
        <div class="gwFeedbackGrid" id="gwFeedbackGrid"></div>
      </div>
      <p class="gwProofNote">Creator count is based on the business's reported real usage. Feedback images are shown only when real customer screenshots are provided.</p>
    `;

    const privacy = hero.querySelector('.privacy');
    if (privacy) privacy.insertAdjacentElement('afterend', section);
    else tool.insertAdjacentElement('afterend', section);

    const feedbackGrid = section.querySelector('#gwFeedbackGrid');
    const feedbackWrap = section.querySelector('#gwFeedbackWrap');
    const sources = [1,2,3,4,5].map((n) => `/assets/testimonials/feedback-${n}.webp`);
    let loaded = 0;

    sources.forEach((src, index) => {
      const img = new Image();
      img.alt = `Real GeminiWatermark customer feedback ${index + 1}`;
      img.loading = 'lazy';
      img.decoding = 'async';
      img.onload = () => {
        const figure = document.createElement('figure');
        figure.className = 'gwFeedbackCard';
        figure.appendChild(img);
        feedbackGrid?.appendChild(figure);
        loaded += 1;
        if (loaded > 0) feedbackWrap?.classList.add('show');
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
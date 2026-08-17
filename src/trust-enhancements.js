(() => {
  const mountTrust = () => {
    if (document.getElementById('trust') || !document.querySelector('.metrics')) return Boolean(document.getElementById('trust'));

    const metrics = document.querySelector('.metrics');
    const trust = document.createElement('section');
    trust.id = 'trust';
    trust.className = 'gwTrust';
    trust.innerHTML = `
      <div class="wrap">
        <div class="gwTrustIntro">
          <span>TRUST & PRIVACY</span>
          <h2>Your media stays yours.</h2>
          <p>GeminiWatermark is designed around browser-side processing for supported media. You can try the remover before paying, see the result first, and only upgrade when you need more video processing.</p>
        </div>

        <div class="gwTrustGrid">
          <article>
            <div class="gwTrustIcon">◉</div>
            <b>Processed in your browser</b>
            <p>Supported image and video cleanup runs on your device instead of sending your media to a media library on our servers.</p>
          </article>
          <article>
            <div class="gwTrustIcon">0</div>
            <b>No media files stored</b>
            <p>We do not build a cloud gallery or upload history of the media you process with the browser tool.</p>
          </article>
          <article>
            <div class="gwTrustIcon">₹</div>
            <b>Checkout handled by Cashfree</b>
            <p>When you upgrade, payment checkout is handled through Cashfree and plan access is unlocked only after server-side payment verification.</p>
          </article>
          <article>
            <div class="gwTrustIcon">30</div>
            <b>Clear plan terms</b>
            <p>The ₹99 video plan is valid for 30 days after successful payment and does not auto-renew.</p>
          </article>
        </div>

        <div class="gwProofBar" aria-label="Service trust highlights">
          <span>✓ Try before paying</span>
          <span>✓ No account needed for free image cleanup</span>
          <span>✓ Live support available</span>
          <span>✓ Privacy & refund policies published</span>
        </div>

        <div class="gwTransparency">
          <div>
            <span>TRANSPARENT BY DESIGN</span>
            <h3>Clear limits. No made-up trust numbers.</h3>
            <p>We would rather show you how the product works than claim fake review counts, fake customer totals or endorsements we do not have.</p>
          </div>
          <div class="gwTransparencyList">
            <div><b>Visible watermark tool</b><small>Targets supported visible Gemini/Veo watermark profiles only.</small></div>
            <div><b>SynthID stays intact</b><small>The tool does not claim to remove invisible provenance or SynthID.</small></div>
            <div><b>Independent utility</b><small>geminiwatermark.space is an independent tool and is not affiliated with or endorsed by Google.</small></div>
          </div>
        </div>

        <div class="gwSupportCard">
          <div>
            <span>NEED HELP?</span>
            <h3>Real support, before or after payment.</h3>
            <p>Use the live chat on this page or email <a href="mailto:geminiwatermark16@gmail.com">geminiwatermark16@gmail.com</a>. Plan, privacy and refund information is always available from the site footer.</p>
          </div>
          <a class="gwSupportCta" href="#tool">Try the remover</a>
        </div>
      </div>
    `;

    metrics.insertAdjacentElement('afterend', trust);

    const nav = document.querySelector('header.nav nav');
    if (nav && !nav.querySelector('a[href="#trust"]')) {
      const link = document.createElement('a');
      link.href = '#trust';
      link.textContent = 'Trust';
      const pricing = nav.querySelector('a[href="#pricing"]');
      nav.insertBefore(link, pricing || null);
    }

    const style = document.createElement('style');
    style.id = 'gw-trust-styles';
    style.textContent = `
      .gwTrust{background:#f5f5f2;color:#111;padding:96px 0;border-top:1px solid rgba(17,17,17,.08);border-bottom:1px solid rgba(17,17,17,.08)}
      .gwTrustIntro{max-width:820px;margin-bottom:36px}.gwTrustIntro>span,.gwTransparency>div>span,.gwSupportCard span{display:block;font-size:11px;font-weight:800;letter-spacing:.16em;margin-bottom:14px;opacity:.58}
      .gwTrustIntro h2{font-size:clamp(42px,6vw,76px);line-height:.96;letter-spacing:-.055em;margin:0 0 22px}.gwTrustIntro p{font-size:18px;line-height:1.65;max-width:760px;opacity:.7;margin:0}
      .gwTrustGrid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:38px}.gwTrustGrid article{background:#fff;border:1px solid rgba(17,17,17,.08);border-radius:22px;padding:24px;min-height:245px;display:flex;flex-direction:column;box-shadow:0 12px 34px rgba(0,0,0,.035)}
      .gwTrustIcon{width:48px;height:48px;border-radius:14px;display:grid;place-items:center;background:#111;color:#fff;font-size:14px;font-weight:800;margin-bottom:auto}.gwTrustGrid b{font-size:18px;margin:30px 0 8px}.gwTrustGrid p{font-size:14px;line-height:1.55;opacity:.64;margin:0}
      .gwProofBar{display:flex;flex-wrap:wrap;gap:8px;margin:14px 0 48px}.gwProofBar span{background:#111;color:#fff;border-radius:999px;padding:10px 14px;font-size:12px;font-weight:650}
      .gwTransparency{background:#111;color:#fff;border-radius:30px;padding:38px;display:grid;grid-template-columns:1fr 1fr;gap:50px;align-items:start}.gwTransparency h3,.gwSupportCard h3{font-size:clamp(30px,4vw,48px);line-height:1;letter-spacing:-.04em;margin:0 0 14px}.gwTransparency p{margin:0;opacity:.65;line-height:1.6;max-width:560px}.gwTransparencyList{display:grid;gap:10px}.gwTransparencyList>div{padding:17px 18px;border:1px solid rgba(255,255,255,.14);border-radius:16px}.gwTransparencyList b,.gwTransparencyList small{display:block}.gwTransparencyList b{font-size:14px;margin-bottom:5px}.gwTransparencyList small{font-size:12px;line-height:1.45;opacity:.6}
      .gwSupportCard{margin-top:14px;background:#fff;border:1px solid rgba(17,17,17,.08);border-radius:24px;padding:30px 32px;display:flex;align-items:center;justify-content:space-between;gap:30px}.gwSupportCard h3{font-size:30px}.gwSupportCard p{margin:0;max-width:700px;line-height:1.55;opacity:.65}.gwSupportCard p a{color:inherit;font-weight:700}.gwSupportCta{flex:none;background:#111;color:#fff!important;text-decoration:none;border-radius:999px;padding:14px 20px;font-weight:750}
      @media(max-width:1000px){.gwTrustGrid{grid-template-columns:repeat(2,1fr)}.gwTransparency{grid-template-columns:1fr;gap:26px}}
      @media(max-width:700px){.gwTrust{padding:68px 0}.gwTrustGrid{grid-template-columns:1fr}.gwTrustGrid article{min-height:205px}.gwTrustIntro h2{font-size:48px}.gwTransparency{padding:26px 20px;border-radius:22px}.gwSupportCard{align-items:flex-start;flex-direction:column;padding:24px 20px}.gwSupportCta{width:100%;text-align:center}.gwProofBar span{width:100%;text-align:center}}
    `;
    document.head.appendChild(style);
    return true;
  };

  if (!mountTrust()) {
    const app = document.getElementById('app');
    const observer = new MutationObserver(() => {
      if (mountTrust()) observer.disconnect();
    });
    if (app) observer.observe(app, { childList: true, subtree: true });
  }
})();

(() => {
  const formatNumber = (value) => new Intl.NumberFormat('en-US').format(Number(value || 0));

  async function loadPublicStats() {
    const visitorsEl = document.getElementById('gwVisitorCount');
    const pageviewsEl = document.getElementById('gwPageviewCount');
    const statusEl = document.getElementById('gwStatsStatus');
    if (!visitorsEl || !pageviewsEl) return;

    try {
      const response = await fetch('/api/public-stats', { cache: 'no-store' });
      const data = await response.json();
      if (!data.ok) throw new Error('stats unavailable');
      visitorsEl.textContent = formatNumber(data.visitors);
      pageviewsEl.textContent = formatNumber(data.pageviews);
      if (statusEl) statusEl.textContent = 'Real site activity · updated automatically';
    } catch {
      visitorsEl.textContent = 'Live';
      pageviewsEl.textContent = 'On';
      if (statusEl) statusEl.textContent = 'Real usage tracking is enabled';
    }
  }

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
          <h2>Private by default.<br>Clear from the start.</h2>
          <p>Try the remover before paying. Supported media is processed in your browser, checkout is handled through Cashfree, and the ₹99 video plan has clear 30-day terms with no automatic renewal.</p>
        </div>

        <div class="gwTrustGrid">
          <article>
            <div class="gwTrustIcon">◉</div>
            <b>Processed in your browser</b>
            <p>Supported image and video cleanup runs on your device instead of sending your media to a cloud media library.</p>
          </article>
          <article>
            <div class="gwTrustIcon">0</div>
            <b>No media files stored</b>
            <p>The site does not create a cloud gallery or upload-history library of the media you process.</p>
          </article>
          <article>
            <div class="gwTrustIcon">₹</div>
            <b>Cashfree checkout</b>
            <p>Payment checkout is handled through Cashfree and access unlocks only after server-side payment verification.</p>
          </article>
          <article>
            <div class="gwTrustIcon">30</div>
            <b>No auto-renewal</b>
            <p>The ₹99 video plan stays active for 30 days after successful payment and does not automatically renew.</p>
          </article>
        </div>

        <div class="gwLiveProof" aria-label="Real site activity">
          <div class="gwLiveProofIntro">
            <span>REAL SITE ACTIVITY</span>
            <h3>Usage you can actually verify.</h3>
            <p id="gwStatsStatus">Loading real site activity…</p>
          </div>
          <div class="gwStat"><b id="gwVisitorCount">—</b><small>Unique visitors recorded</small></div>
          <div class="gwStat"><b id="gwPageviewCount">—</b><small>Page views recorded</small></div>
        </div>

        <div class="gwProofBar" aria-label="Service trust highlights">
          <span>✓ Secure HTTPS connection</span>
          <span>✓ Checkout via Cashfree</span>
          <span>✓ Try before paying</span>
          <span>✓ No account needed for free image cleanup</span>
          <span>✓ Live support available</span>
          <span>✓ Privacy & refund policies published</span>
        </div>

        <div class="gwConfidence">
          <div class="gwConfidenceHead">
            <span>BUILT FOR CONFIDENCE</span>
            <h3>See what happens before you commit.</h3>
          </div>
          <div class="gwConfidenceGrid">
            <article><b>Preview first</b><p>Upload supported media, process it and inspect the result before deciding whether you need paid video access.</p></article>
            <article><b>Clear limits</b><p>The tool states supported formats, visible-watermark scope and plan limits directly on the page.</p></article>
            <article><b>Support is reachable</b><p>Live chat and the official support email stay available from the same site you use for processing and checkout.</p></article>
          </div>
        </div>

        <div class="gwTransparency">
          <div>
            <span>TRANSPARENT BY DESIGN</span>
            <h3>Simple terms. No hidden renewal.</h3>
            <p>The service focuses on supported visible Gemini/Veo watermark profiles and keeps invisible provenance such as SynthID outside its claims.</p>
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
            <h3>Support before or after payment.</h3>
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
      .gwTrustIntro{max-width:900px;margin-bottom:36px}.gwTrustIntro>span,.gwLiveProofIntro>span,.gwConfidenceHead>span,.gwTransparency>div>span,.gwSupportCard span{display:block;font-size:11px;font-weight:800;letter-spacing:.16em;margin-bottom:14px;opacity:.58}
      .gwTrustIntro h2{font-size:clamp(42px,6vw,76px);line-height:.96;letter-spacing:-.055em;margin:0 0 22px}.gwTrustIntro p{font-size:18px;line-height:1.65;max-width:780px;opacity:.7;margin:0}
      .gwTrustGrid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:38px}.gwTrustGrid article{background:#fff;border:1px solid rgba(17,17,17,.08);border-radius:22px;padding:24px;min-height:245px;display:flex;flex-direction:column;box-shadow:0 12px 34px rgba(0,0,0,.035)}
      .gwTrustIcon{width:48px;height:48px;border-radius:14px;display:grid;place-items:center;background:#111;color:#fff;font-size:14px;font-weight:800;margin-bottom:auto}.gwTrustGrid b{font-size:18px;margin:30px 0 8px}.gwTrustGrid p{font-size:14px;line-height:1.55;opacity:.64;margin:0}
      .gwLiveProof{margin-top:14px;background:#fff;border:1px solid rgba(17,17,17,.08);border-radius:24px;padding:28px 30px;display:grid;grid-template-columns:1.5fr .65fr .65fr;gap:16px;align-items:center}.gwLiveProofIntro h3{font-size:30px;letter-spacing:-.04em;margin:0 0 8px}.gwLiveProofIntro p{margin:0;opacity:.55;font-size:13px}.gwStat{border-left:1px solid rgba(17,17,17,.1);padding:8px 0 8px 24px}.gwStat b{display:block;font-size:36px;letter-spacing:-.05em}.gwStat small{display:block;opacity:.55;margin-top:4px}
      .gwProofBar{display:flex;flex-wrap:wrap;gap:8px;margin:14px 0 48px}.gwProofBar span{background:#111;color:#fff;border-radius:999px;padding:10px 14px;font-size:12px;font-weight:650}
      .gwConfidence{margin-bottom:14px}.gwConfidenceHead{max-width:720px;margin-bottom:18px}.gwConfidenceHead h3{font-size:clamp(30px,4vw,48px);line-height:1;letter-spacing:-.04em;margin:0}.gwConfidenceGrid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.gwConfidenceGrid article{background:#fff;border:1px solid rgba(17,17,17,.08);border-radius:20px;padding:24px}.gwConfidenceGrid b{font-size:18px}.gwConfidenceGrid p{margin:10px 0 0;line-height:1.55;font-size:14px;opacity:.62}
      .gwTransparency{background:#111;color:#fff;border-radius:30px;padding:38px;display:grid;grid-template-columns:1fr 1fr;gap:50px;align-items:start}.gwTransparency h3,.gwSupportCard h3{font-size:clamp(30px,4vw,48px);line-height:1;letter-spacing:-.04em;margin:0 0 14px}.gwTransparency p{margin:0;opacity:.65;line-height:1.6;max-width:560px}.gwTransparencyList{display:grid;gap:10px}.gwTransparencyList>div{padding:17px 18px;border:1px solid rgba(255,255,255,.14);border-radius:16px}.gwTransparencyList b,.gwTransparencyList small{display:block}.gwTransparencyList b{font-size:14px;margin-bottom:5px}.gwTransparencyList small{font-size:12px;line-height:1.45;opacity:.6}
      .gwSupportCard{margin-top:14px;background:#fff;border:1px solid rgba(17,17,17,.08);border-radius:24px;padding:30px 32px;display:flex;align-items:center;justify-content:space-between;gap:30px}.gwSupportCard h3{font-size:30px}.gwSupportCard p{margin:0;max-width:700px;line-height:1.55;opacity:.65}.gwSupportCard p a{color:inherit;font-weight:700}.gwSupportCta{flex:none;background:#111;color:#fff!important;text-decoration:none;border-radius:999px;padding:14px 20px;font-weight:750}
      @media(max-width:1000px){.gwTrustGrid{grid-template-columns:repeat(2,1fr)}.gwLiveProof{grid-template-columns:1fr 1fr}.gwLiveProofIntro{grid-column:1/-1}.gwStat:first-of-type{border-left:0;padding-left:0}.gwConfidenceGrid{grid-template-columns:1fr}.gwTransparency{grid-template-columns:1fr;gap:26px}}
      @media(max-width:700px){.gwTrust{padding:68px 0}.gwTrustGrid{grid-template-columns:1fr}.gwTrustGrid article{min-height:205px}.gwTrustIntro h2{font-size:48px}.gwLiveProof{grid-template-columns:1fr;padding:24px 20px}.gwStat{border-left:0;border-top:1px solid rgba(17,17,17,.1);padding:18px 0 0}.gwTransparency{padding:26px 20px;border-radius:22px}.gwSupportCard{align-items:flex-start;flex-direction:column;padding:24px 20px}.gwSupportCta{width:100%;text-align:center}.gwProofBar span{width:100%;text-align:center}}
    `;
    document.head.appendChild(style);
    loadPublicStats();
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

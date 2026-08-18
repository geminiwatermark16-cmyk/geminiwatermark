const ALLOWED_HOSTS = new Set([
  'instagram.com',
  'www.instagram.com',
  'm.instagram.com',
  'instagr.am',
  'www.instagr.am',
  'pinterest.com',
  'www.pinterest.com',
  'in.pinterest.com',
  'pin.it',
  'www.pin.it',
]);

function cleanHost(hostname = '') {
  return hostname.toLowerCase().replace(/\.$/, '');
}

function isAllowedPageUrl(value) {
  try {
    const u = new URL(value);
    return u.protocol === 'https:' && ALLOWED_HOSTS.has(cleanHost(u.hostname));
  } catch {
    return false;
  }
}

function platformFor(value) {
  try {
    const host = cleanHost(new URL(value).hostname);
    if (host.includes('instagram') || host.includes('instagr.am')) return 'instagram';
    if (host.includes('pinterest') || host === 'pin.it' || host === 'www.pin.it') return 'pinterest';
  } catch {}
  return null;
}

function decodeHtml(value = '') {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\\u0026/g, '&')
    .replace(/\\u003d/g, '=')
    .replace(/\\u002F/gi, '/')
    .replace(/\\\//g, '/');
}

function firstMeta(html, keys) {
  for (const key of keys) {
    const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const patterns = [
      new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']+)["'][^>]*>`, 'i'),
      new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${escaped}["'][^>]*>`, 'i'),
    ];
    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match?.[1]) return decodeHtml(match[1]);
    }
  }
  return null;
}

function collectVideoCandidates(html) {
  const out = [];
  const add = (value) => {
    if (!value) return;
    const cleaned = decodeHtml(value).replace(/\\\\/g, '');
    if (/^https:\/\//i.test(cleaned) && /\.(mp4|m4v)(?:\?|$)/i.test(cleaned)) out.push(cleaned);
  };

  add(firstMeta(html, ['og:video:secure_url', 'og:video', 'twitter:player:stream']));

  const regexes = [
    /"video_url"\s*:\s*"([^"]+)"/gi,
    /"contentUrl"\s*:\s*"([^"]+\.mp4[^"]*)"/gi,
    /"content_url"\s*:\s*"([^"]+\.mp4[^"]*)"/gi,
    /"url"\s*:\s*"(https:[^"]+\.mp4[^"]*)"/gi,
    /(https:\\?\/\\?\/[^"'<>\s]+\.mp4[^"'<>\s]*)/gi,
  ];

  for (const rx of regexes) {
    let match;
    let guard = 0;
    while ((match = rx.exec(html)) && guard++ < 80) add(match[1]);
  }

  return [...new Set(out)].sort((a, b) => {
    const score = (v) => (/1080|hd/i.test(v) ? 4 : 0) + (/720/i.test(v) ? 3 : 0) + (/640|540/i.test(v) ? 2 : 0) + v.length / 10000;
    return score(b) - score(a);
  });
}

async function fetchPage(startUrl) {
  let current = startUrl;
  for (let i = 0; i < 5; i++) {
    if (!isAllowedPageUrl(current)) throw new Error('UNSUPPORTED_URL');
    const response = await fetch(current, {
      redirect: 'manual',
      headers: {
        'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/151 Safari/537.36',
        'accept-language': 'en-US,en;q=0.9',
        accept: 'text/html,application/xhtml+xml',
      },
    });

    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get('location');
      if (!location) throw new Error('FETCH_FAILED');
      current = new URL(location, current).toString();
      continue;
    }

    if (!response.ok) throw new Error(response.status === 429 ? 'RATE_LIMITED' : 'FETCH_FAILED');
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html')) throw new Error('NOT_HTML');
    const html = await response.text();
    return { html, finalUrl: current };
  }
  throw new Error('TOO_MANY_REDIRECTS');
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'METHOD_NOT_ALLOWED' });

  const input = typeof req.body === 'string' ? (() => { try { return JSON.parse(req.body); } catch { return {}; } })() : (req.body || {});
  const url = String(input.url || '').trim();
  const platform = platformFor(url);

  if (!platform || !isAllowedPageUrl(url)) {
    return res.status(400).json({ ok: false, error: 'UNSUPPORTED_URL', message: 'Paste a public Instagram Reel/Post or Pinterest Pin URL.' });
  }

  try {
    const { html, finalUrl } = await fetchPage(url);
    const videos = collectVideoCandidates(html);
    const title = firstMeta(html, ['og:title', 'twitter:title']) || (platform === 'instagram' ? 'Instagram media' : 'Pinterest media');
    const thumbnail = firstMeta(html, ['og:image', 'twitter:image']);
    const description = firstMeta(html, ['og:description', 'description']);

    if (!videos.length) {
      return res.status(422).json({
        ok: false,
        error: 'VIDEO_NOT_FOUND',
        message: 'No downloadable public video was found. The post may be private, login-protected, image-only, or the platform may be blocking extraction.',
        platform,
        finalUrl,
        title,
        thumbnail,
      });
    }

    return res.status(200).json({
      ok: true,
      platform,
      finalUrl,
      title,
      description,
      thumbnail,
      videoUrl: videos[0],
      alternatives: videos.slice(1, 4),
    });
  } catch (error) {
    const code = error?.message || 'EXTRACT_FAILED';
    const messages = {
      RATE_LIMITED: 'The platform rate-limited this request. Try again in a little while.',
      FETCH_FAILED: 'Could not access that public post right now.',
      UNSUPPORTED_URL: 'Only Instagram and Pinterest public post URLs are supported.',
      NOT_HTML: 'That URL did not return a supported post page.',
      TOO_MANY_REDIRECTS: 'The shared link redirected too many times.',
    };
    console.error('social extract error', code);
    return res.status(502).json({ ok: false, error: code, message: messages[code] || 'Could not extract a video from that post.' });
  }
};

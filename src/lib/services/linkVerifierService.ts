type LinkItem = { label: string; url: string };

type VerificationResult = {
  url: string;
  ok: boolean;
  status?: number;
  finalUrl?: string;
  contentType?: string | null;
  confidence: number; // 0..1
};

// Simple in-memory cache with TTL
const cache = new Map<string, { result: VerificationResult; expires: number }>();
const DEFAULT_TTL_MS = 1000 * 60 * 30; // 30 minutes

async function tryFetch(url: string, method: 'HEAD' | 'GET', timeoutMs = 8000): Promise<Response> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method,
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'User-Agent': 'ResumeCraft-LinkVerifier/1.0' },
    } as RequestInit);
    return res;
  } finally {
    clearTimeout(t);
  }
}

export async function verifyLink(url: string): Promise<VerificationResult> {
  const now = Date.now();
  const cached = cache.get(url);
  if (cached && cached.expires > now) return cached.result;

  let res: Response | null = null;
  try {
    // First attempt HEAD (fast)
    res = await tryFetch(url, 'HEAD');
    if (res.status === 405 || res.status === 501) {
      // Some origins disallow HEAD
      res = await tryFetch(url, 'GET');
    }
  } catch {
    // Fallback to GET if HEAD failed due to CORS or block
    try {
      res = await tryFetch(url, 'GET');
    } catch {}
  }

  const result: VerificationResult = {
    url,
    ok: false,
    confidence: 0,
  };

  const lower = url.toLowerCase();
  if (res) {
    const ok = res.status >= 200 && res.status < 400;
    const contentType = res.headers.get('content-type');
    const ctOk = !!contentType && /text\/html|application\/pdf|video\//i.test(contentType);
    result.ok = ok && (ctOk || !contentType); // Some providers omit content-type on HEAD
    result.status = res.status;
    result.finalUrl = res.url;
    result.contentType = contentType;
    result.confidence = result.ok ? (ctOk ? 0.95 : 0.75) : 0.0;
  }

  // Special handling for YouTube videos: HEAD often returns 200 even if unavailable
  try {
    const isYouTubeVideo = /youtube\.com\/watch\?v=|youtu\.be\//.test(lower);
    if (isYouTubeVideo) {
      const htmlRes = await tryFetch(url, 'GET', 8000);
      const html = await htmlRes.text();
      // Heuristics for unavailable videos
      const unavailable = /Video unavailable|This video is private|account associated with this video has been terminated|not available|This video isn'?t available/i.test(html);
      // Avoid complex escaping in a single regex by testing multiple simple patterns
      const hasPlayer = (
        /<meta\s+property=\"og:video/i.test(html) ||
        /ytplayer/i.test(html) ||
        /\/s\/player\//i.test(html) ||
        /"player_response"/i.test(html)
      );
      if (unavailable || !hasPlayer) {
        result.ok = false;
        result.confidence = 0.0;
      } else {
        result.ok = true;
        result.confidence = 0.9;
      }
    }
  } catch {
    // If GET fails, leave previous decision
  }

  cache.set(url, { result, expires: now + DEFAULT_TTL_MS });
  return result;
}

export async function verifyLinks(links: LinkItem[]): Promise<Record<string, VerificationResult>> {
  const out: Record<string, VerificationResult> = {};
  await Promise.all(
    links.map(async (l) => {
      const r = await verifyLink(l.url);
      out[l.url] = r;
    })
  );
  return out;
}

import { NextRequest, NextResponse } from 'next/server';
import { verifyLinks } from '@/lib/services/linkVerifierService';
import { AICacheService } from '@/lib/services/aiCacheService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const links = Array.isArray(body?.links) ? body.links : [];
    const normalized = links
      .filter((l: any) => l && typeof l.url === 'string')
      .map((l: any) => ({ label: String(l.label || ''), url: String(l.url) }));
    if (normalized.length === 0) {
      return NextResponse.json({ success: true, results: {} });
    }
    // Cache key: urls sorted
    const urls = normalized.map((l: any) => l.url).sort();
    const cacheKeyPayload = { urls };
    const cached = await AICacheService.get('link_verifier', cacheKeyPayload);
    if (cached) {
      return NextResponse.json({ success: true, results: cached });
    }
    const results = await verifyLinks(normalized);
    await AICacheService.set('link_verifier', cacheKeyPayload, results, 60 * 60 * 12); // 12h TTL
    return NextResponse.json({ success: true, results });
  } catch (e) {
    return NextResponse.json({ success: false, error: (e as Error).message }, { status: 500 });
  }
}

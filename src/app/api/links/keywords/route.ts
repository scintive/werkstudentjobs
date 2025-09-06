import { NextRequest, NextResponse } from 'next/server';
import { llmService } from '@/lib/services/llmService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/*
POST /api/links/keywords
Body: { tasks: string[] }
Returns: { success: true, keywords: { [index: number]: string } }
Generates optimized short search phrases to surface high-signal crash courses.
*/
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const tasks = Array.isArray(body?.tasks) ? body.tasks.filter((t: any) => typeof t === 'string' && t.trim()) : [];
    if (!tasks.length) return NextResponse.json({ success: true, keywords: {} });

    const system = `You generate concise, precise search keywords for YouTube/Google to find crash courses.
Rules:
- Output 1 keyword phrase per task, 2–4 words, specific, technology- or domain-forward.
- Avoid generic words like "best practices", "official", "tutorial" (we add these later if needed).
- Prefer canonical product/tech names (e.g., "Salesforce Admin", "Google Analytics 4", "Event Planning", "Process Improvement", "Operations Management").
Return strict JSON: { items: string[] } where items[i] corresponds to tasks[i].`;

    const user = `TASKS (one per line):\n${tasks.map((t: string, i: number) => `${i+1}. ${t}`).join('\n')}`;

    const schema = {
      type: 'object',
      properties: { items: { type: 'array', items: { type: 'string' } } },
      required: ['items'],
      additionalProperties: false
    } as const;

    const result = await llmService.createJsonResponse<{ items: string[] }>({
      model: 'gpt-4o-mini',
      system,
      user,
      schema,
      temperature: 0.2,
      maxTokens: 500,
      retries: 2,
    });

    const out: Record<number, string> = {};
    (result.items || []).forEach((kw, idx) => {
      if (typeof kw === 'string' && kw.trim()) out[idx] = kw.trim();
    });
    return NextResponse.json({ success: true, keywords: out });
  } catch (e) {
    return NextResponse.json({ success: false, error: (e as Error).message }, { status: 500 });
  }
}


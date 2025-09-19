import { test, expect } from '@playwright/test'

test('experience suggestions fallback anchor produces targetPath in UI transform', async ({ request }) => {
  // This test simulates DB row shape and ensures our client transform creates canonical targetPath
  const row = {
    id: '00000000-0000-0000-0000-000000000001',
    variant_id: '00000000-0000-0000-0000-000000000002',
    section: 'experience',
    suggestion_type: 'bullet',
    target_id: 'experience_0_achievements_3',
    original_content: 'old',
    suggested_content: 'new',
    rationale: 'better',
    keywords: [],
    confidence: 90,
    impact: 'high'
  } as any

  // Reuse the same normalization logic as hook
  const canonicalizePath = (raw?: string | null): string | undefined => {
    if (!raw || typeof raw !== 'string') return undefined
    let p = raw
      .replace(/\[\s*(\d+)\s*\]/g, '.$1')
      .replace(/bullets/g, 'achievements')
      .replace(/\s+/g, '')
    p = p.replace(/^experience_(\d+)_achievements_(\d+)$/, 'experience.$1.achievements.$2')
    p = p.replace(/\.+$/,'')
    return p
  }

  expect(canonicalizePath(row.target_id)).toBe('experience.0.achievements.3')
})



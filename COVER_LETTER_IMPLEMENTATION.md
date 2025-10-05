# Cover Letter Auto-Generation & Regeneration Implementation

## Requirements
1. ✅ Auto-generate cover letter when job is tailored (first time)
2. ✅ Allow user to regenerate cover letter (max 2 times)
3. ✅ Custom instructions for regeneration
4. ✅ Enforce 250 words length

---

## Implementation Changes

### 1. Update Cover Letter API (`/api/jobs/cover-letter-student/route.ts` & `/api/jobs/cover-letter/route.ts`)

Add custom instructions parameter and enforce 250 words:

```typescript
// In the API route
const { job_id, user_profile_id, tone = 'confident', length = 'medium', strategy_context, custom_instructions } = body;

// Update the GPT prompt
const systemPrompt = `You are a professional cover letter writer. Generate a compelling cover letter EXACTLY 250 words long.

${custom_instructions ? `Additional instructions: ${custom_instructions}` : ''}

Tone: ${tone}
Structure:
- Opening paragraph (2-3 sentences)
- Body paragraphs (2-3 paragraphs)
- Closing paragraph (2 sentences)

CRITICAL: Output must be EXACTLY 250 words. Count carefully.`;
```

### 2. Track Regeneration Count in Variant

Add to resume_variants table:

```sql
ALTER TABLE resume_variants
ADD COLUMN cover_letter_regeneration_count INTEGER DEFAULT 0,
ADD COLUMN cover_letter_data JSONB;
```

### 3. Update `CoverLetterStudioTab` Component

```typescript
// Add state for regeneration tracking and custom instructions
const [regenerationCount, setRegenerationCount] = useState(0);
const [customInstructions, setCustomInstructions] = useState('');
const MAX_REGENERATIONS = 2;

// Auto-generate on first load
useEffect(() => {
  if (!coverLetter && !loading) {
    console.log('🎯 Auto-generating cover letter on first load');
    onGenerate('confident', 'medium', ''); // Auto-generate with default settings
  }
}, []);

// Update generate function signature
const handleRegenerate = () => {
  if (regenerationCount >= MAX_REGENERATIONS) {
    alert('Maximum 2 regenerations allowed');
    return;
  }

  onGenerate(selectedTone, '250words', customInstructions);
  setRegenerationCount(prev => prev + 1);
  setCustomInstructions(''); // Clear after use
};
```

### 4. Update `generateCoverLetter` Function in `page.tsx`

```typescript
const generateCoverLetter = async (
  tone: string,
  length: string,
  customInstructions?: string
) => {
  setLoading(prev => ({ ...prev, letter: true }));

  try {
    const { data: session } = await supabase.auth.getSession();
    const token = session.session?.access_token;
    if (!token) {
      console.warn('🔒 Cover letter generation blocked: user not signed in');
      setLoading(prev => ({ ...prev, letter: false }));
      return;
    }

    // ... existing profile loading code ...

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        job_id: jobId,
        user_profile_id: userProfileId,
        tone,
        length: '250words', // Fixed to 250 words
        strategy_context: studentStrategy || strategy,
        custom_instructions: customInstructions || '' // NEW
      })
    });

    const data = await response.json();

    if (data.success) {
      setCoverLetter(data.cover_letter);

      // Update variant with cover letter data and count
      if (currentVariantId) {
        await supabase
          .from('resume_variants')
          .update({
            cover_letter_data: data.cover_letter,
            cover_letter_regeneration_count: data.regeneration_count || 0
          })
          .eq('id', currentVariantId);
      }

      console.log('🎯 Cover letter generated');
    }
  } catch (error) {
    console.error('Cover letter generation failed:', error);
  } finally {
    setLoading(prev => ({ ...prev, letter: false }));
  }
};
```

### 5. Add Custom Instructions UI to CoverLetterStudioTab

```tsx
{/* Custom Instructions Section */}
<div className="card">
  <h3 className="text-heading-4 mb-3">Customize Letter</h3>
  <div className="space-y-4">
    <div>
      <label className="text-label mb-2 block">
        Custom Instructions (optional)
      </label>
      <textarea
        value={customInstructions}
        onChange={(e) => setCustomInstructions(e.target.value)}
        placeholder="E.g., 'Emphasize my Python skills' or 'Mention my interest in sustainability'"
        className="input w-full h-24 resize-none"
        disabled={regenerationCount >= MAX_REGENERATIONS}
      />
      <p className="text-caption text-gray-500 mt-2">
        Regenerations remaining: {MAX_REGENERATIONS - regenerationCount}
      </p>
    </div>

    <button
      onClick={handleRegenerate}
      disabled={loading || regenerationCount >= MAX_REGENERATIONS}
      className={cn(
        "btn w-full",
        regenerationCount >= MAX_REGENERATIONS
          ? "btn-secondary opacity-50 cursor-not-allowed"
          : "btn-primary"
      )}
    >
      <RefreshCw className="w-4 h-4" />
      {regenerationCount >= MAX_REGENERATIONS
        ? 'Maximum Regenerations Reached'
        : `Regenerate Letter (${MAX_REGENERATIONS - regenerationCount} left)`}
    </button>
  </div>
</div>
```

### 6. Auto-Generate in analyze-with-tailoring API

Add cover letter generation to the API response:

```typescript
// After line 2200 in analyze-with-tailoring/route.ts
// Auto-generate cover letter on first variant creation
let coverLetterData = null;
if (!existingSuggestions || existingSuggestions.length === 0) {
  try {
    console.log('🎯 Auto-generating cover letter for new variant');
    const coverLetterResp = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/jobs/cover-letter`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        job_id,
        user_profile_id: userId,
        tone: 'confident',
        length: '250words',
        strategy_context: analysisData.strategy
      })
    });

    if (coverLetterResp.ok) {
      const coverData = await coverLetterResp.json();
      coverLetterData = coverData.cover_letter;

      // Save to variant
      await db
        .from('resume_variants')
        .update({ cover_letter_data: coverLetterData })
        .eq('id', variant.id);
    }
  } catch (err) {
    console.warn('Cover letter auto-generation failed, continuing...', err);
  }
}

// Include in response
const response = {
  strategy: analysisData.strategy || {},
  tailored_resume: tailoredDataWithOriginalInfo,
  atomic_suggestions: analysisData.atomic_suggestions || [],
  skills_suggestions: analysisData.skills_suggestions || [],
  skills_category_plan: analysisData.skills_category_plan || null,
  cover_letter: coverLetterData, // NEW
  variant_id: variant.id,
  base_resume_id,
  job_id,
  fingerprint: currentFingerprint
};
```

---

## Testing Checklist

- [ ] First load auto-generates 250-word cover letter
- [ ] Regenerate button shows remaining count
- [ ] Custom instructions field works
- [ ] After 2 regenerations, button is disabled
- [ ] Cover letter is saved to variant
- [ ] Word count is enforced at 250 words
- [ ] Cover letter loads from variant on page reload

---

## Expected User Flow

1. **User navigates to Tailor page** → Cover letter auto-generates in background (250 words)
2. **User clicks "Letter Craft" tab** → Sees generated letter with custom instructions field
3. **User adds instructions** → E.g., "Emphasize leadership skills"
4. **User clicks Regenerate** → New 250-word letter with custom focus (1/2 regenerations used)
5. **User regenerates again** → (2/2 regenerations used)
6. **Button disabled** → User can still edit manually but cannot regenerate again

---

## Database Migration

```sql
-- Run this migration
ALTER TABLE resume_variants
ADD COLUMN IF NOT EXISTS cover_letter_data JSONB,
ADD COLUMN IF NOT EXISTS cover_letter_regeneration_count INTEGER DEFAULT 0;

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_variants_cover_letter
ON resume_variants(variant_id, cover_letter_regeneration_count);
```

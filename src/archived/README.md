# Archived Code

This directory contains code that has been archived during the codebase optimization. These files are kept for reference but are no longer used in the active codebase.

## Archived Files

### Matching Services (Archived: 2025-10-04)

**Why archived:** Consolidation of duplicate matching implementations. The codebase had 5 different matching services with overlapping functionality, creating maintenance burden.

**Current Solution:** `fastMatchingService.ts` is now the primary and only matching service, implementing TF-IDF with cosine similarity.

#### `matchingService.ts`
- **Original Purpose:** Weighted Jaccard similarity matching
- **Status:** NEVER imported in active code, only mentioned in documentation
- **Can be restored if:** Need for alternative matching algorithm arises

#### `jobMatchingService.ts`
- **Original Purpose:** Job matching logic
- **Status:** Only used in test-matching page (which was deleted)
- **Can be restored if:** Need to compare different matching algorithms

#### `semanticMatchingService.ts`
- **Original Purpose:** OpenAI embeddings with cosine similarity
- **Status:** NEVER imported anywhere, appears to be abandoned feature
- **Can be restored if:** Semantic matching using embeddings is needed
- **Note:** Would require OpenAI API calls for embeddings, adding cost

### Tailor Components (Archived: 2025-10-04)

**Why archived:** Dead code - never imported or used. PerfectStudio handles both base and tailor modes.

#### `TailorLayout.tsx`
- **Original Purpose:** Layout wrapper for tailor functionality
- **Status:** NEVER imported
- **Replacement:** Integrated into tailor page directly

#### `ResumeEditor.tsx`
- **Original Purpose:** Resume editing in tailor mode
- **Status:** NEVER imported
- **Replacement:** `TailorEnhancedRichText.tsx` and related components

#### `ResumePreview.tsx`
- **Original Purpose:** Resume preview in tailor mode
- **Status:** NEVER imported
- **Replacement:** `TailoredResumePreview.tsx`

### Studio Components (Archived: 2025-10-04)

**Why archived:** Complete dead code removal. Analysis showed these components are NEVER imported anywhere in the active codebase.

**Current Architecture:** The app uses a SINGLE component (`PerfectStudio.tsx`) for both base and tailor modes, controlled by a `mode` prop.

#### `TailorStudio.tsx` (2,068 lines)
- **Original Purpose:** Dedicated resume editor for tailor mode
- **Status:** ❌ NEVER imported or used anywhere
- **Analysis Date:** October 4, 2025
- **Findings:**
  - Zero imports in entire codebase
  - Never referenced in any component
  - Complete duplicate of functionality in PerfectStudio
- **Current Solution:** `PerfectStudio` with `mode="tailor"` prop
- **Usage:**
  ```typescript
  // Main page (base mode)
  <PerfectStudio mode="base" />

  // Tailor page (tailor mode) - src/app/jobs/[id]/tailor/page.tsx:1465
  <PerfectStudio mode="tailor" jobData={job} variantId={variantId} />
  ```
- **Can be restored if:** Need to compare different tailor implementations
- **Lines saved:** 2,068

#### `TailorPerfectStudio.tsx` (1,513 lines)
- **Original Purpose:** Alternative tailor studio implementation
- **Status:** ❌ NEVER imported or used anywhere
- **Analysis Date:** October 4, 2025
- **Findings:**
  - Zero imports in entire codebase
  - Appears to be an experimental/abandoned implementation
  - Complete duplicate of functionality
- **Current Solution:** `PerfectStudio` handles all tailor functionality
- **Can be restored if:** Need to reference alternative implementation approach
- **Lines saved:** 1,513

**Total Dead Code Removed:** 3,581 lines (58% of all studio code)

**Verification Commands:**
```bash
# Verify these files are never imported
grep -r "TailorStudio" --include="*.tsx" --include="*.ts" src/
grep -r "TailorPerfectStudio" --include="*.tsx" --include="*.ts" src/
# Should return no results (except archived README)
```

## How to Restore

If you need to restore any of these files:

1. Copy the file from `src/archived/` back to its original location
2. Update imports in consuming files
3. Add tests to ensure functionality
4. Document why the restoration was necessary

## Migration Notes

### From matchingService → fastMatchingService

```typescript
// OLD
import { matchingService } from '@/lib/services/matchingService'
const matches = await matchingService.calculateMatches(jobs, profile)

// NEW
import { fastMatchingService } from '@/lib/services/fastMatchingService'
const matches = await fastMatchingService.calculateBatchMatches(jobs, profile)
```

### From semanticMatchingService → fastMatchingService

```typescript
// OLD
import { semanticMatchingService } from '@/lib/services/semanticMatchingService'
const matches = await semanticMatchingService.calculateSemanticMatches(jobs, profile)

// NEW
import { fastMatchingService } from '@/lib/services/fastMatchingService'
const matches = await fastMatchingService.calculateBatchMatches(jobs, profile)
// Note: This uses TF-IDF instead of embeddings, but provides similar results without API calls
```

## Future Consolidation Candidates

### `geoEnhancedMatchingService.ts`
- **Current Status:** Still in use by `useGeoEnhancedJobs` hook
- **Future Action:** Could be consolidated into `fastMatchingService`
- **Reason:** fastMatchingService already handles location matching; geo service adds minimal value
- **Blocker:** Need to refactor `useGeoEnhancedJobs` hook first

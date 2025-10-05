# Studio Components Refactoring - Master Plan

**Created**: October 4, 2025
**Status**: 🚧 IN PROGRESS - DO NOT MARK COMPLETE UNTIL FULLY IMPLEMENTED
**Critical**: PRESERVE ALL GPT PIPELINES & SUPABASE REALTIME

---

## 🔍 Current Situation Analysis

### Studio Components Overview

| Component | Lines | Status | Usage |
|-----------|-------|--------|-------|
| **PerfectStudio.tsx** | 2,611 | ✅ ACTIVE | Main (`/`) + Tailor (`/jobs/[id]/tailor`) |
| **TailorStudio.tsx** | 2,068 | ❌ UNUSED | Never imported |
| **TailorPerfectStudio.tsx** | 1,513 | ❌ UNUSED | Never imported |
| **TOTAL** | 6,192 | - | **58% is dead code** |

### PerfectStudio Complexity (2,611 lines)

**React Hooks Usage**:
- `useState`: 12 instances
- `useEffect`: 6 instances
- `useRef`: 4 instances
- `useMemo`: 1 instance ⚠️ (optimization opportunity)
- `useCallback`: 0 instances ⚠️ (optimization opportunity)

**Key Integration Points**:
1. **Supabase Realtime**: Via `useSupabaseResumeContext` + `useSupabaseResumeActions`
2. **GPT Pipelines**: `/api/resume/preview`, `/api/resume/pdf-download`
3. **Photo Upload**: `supabase.storage` + direct DB updates
4. **Skills Management**: `EnhancedSkillsManager` + `TailorEnhancedSkillsManager`

**Sections Managed**:
- Personal Info (with photo upload)
- Professional Summary
- Experience (multiple entries with bullets)
- Projects (multiple entries)
- Skills (dynamic categories)
- Languages
- Certifications
- Education
- Custom Sections (9 templates)

---

## 🎯 Master Refactoring Plan

### Phase 1: Archive Dead Code ✅ SAFE (No Breaking Changes)

**Action**:
```bash
mv src/components/tailor-resume-editor/TailorStudio.tsx src/archived/
mv src/components/tailor-resume-editor/TailorPerfectStudio.tsx src/archived/
```

**Update** `src/archived/README.md`:
- Document why these were archived
- Note that PerfectStudio handles both modes

**Impact**:
- ✅ Remove 3,581 lines of unused code
- ✅ Reduce confusion
- ✅ No risk (never imported)

---

### Phase 2: Document GPT Pipelines & Supabase Flow ⚠️ CRITICAL

**Before ANY refactoring**, document:

#### A. GPT API Calls in PerfectStudio

**Location**: Lines 1182, 1304

1. **`/api/resume/preview`** (Line 1182)
   - **Purpose**: Generate HTML preview
   - **Trigger**: Template change, download
   - **Data Flow**: resumeData → API → HTML string
   - **⚠️ MUST PRESERVE**: Exact data format sent

2. **`/api/resume/pdf-download`** (Line 1304)
   - **Purpose**: Generate PDF
   - **Trigger**: User clicks download
   - **Data Flow**: resumeData + template → API → PDF blob
   - **⚠️ MUST PRESERVE**: Resume data structure

#### B. Supabase Realtime Flow

**Context Provider**: `SupabaseResumeProvider`
- **Auto-save**: 2-second debounce
- **Mode**: 'base' | 'tailor'
- **Variant ID**: For tailor mode

**Database Operations**:
1. `user_profiles` table:
   - Photo URL updates (lines 1283, 1459)

2. `resume_data` table:
   - Auto-save on every change (via context)

3. `supabase.storage`:
   - Photo uploads to 'user-photos' bucket (line 1265)

**⚠️ MUST PRESERVE**:
- Auto-save mechanism
- Debounce timing (2000ms)
- Mode awareness (base vs tailor)
- Variant ID handling

---

### Phase 3: Break Down PerfectStudio (Without Breaking Anything)

**Strategy**: Extract components incrementally, test after each extraction

#### Step 3.1: Extract UI Components (Pure, No Logic)

Create: `src/components/resume-editor/sections/`

**Files to Create**:

1. **`SectionCard.tsx`** (Lines 137-200)
   - Pure UI component
   - No state
   - ✅ Safe to extract

2. **`PersonalInfoHeader.tsx`** (Lines ~1400-1550)
   - Extract personal info section
   - Keep photo upload logic initially
   - Props: personalInfo, onUpdate, photoUrl, onPhotoUpload

3. **`SummarySection.tsx`** (Lines ~1600-1700)
   - Professional summary editing
   - Props: summary, onUpdate, enabled

4. **`ExperienceSection.tsx`** (Lines ~1750-1950)
   - Experience entries
   - Props: experience[], onUpdate

5. **`EducationSection.tsx`** (Lines ~2050-2150)
   - Education entries
   - Props: education[], onUpdate

6. **`CustomSectionsManager.tsx`** (Lines ~2300-2500)
   - Custom sections logic
   - Props: customSections[], onUpdate

**Testing After Step 3.1**:
```bash
npm run dev
# Test each section:
# - Edit personal info
# - Upload photo
# - Edit summary
# - Add/edit experience
# - Add/edit education
# - Add custom sections
# Verify: Auto-save still works, no console errors
```

---

#### Step 3.2: Extract Photo Upload Logic

Create: `src/components/resume-editor/hooks/usePhotoUpload.ts`

**Hook**:
```typescript
export function usePhotoUpload() {
  const uploadPhoto = async (file: File) => {
    // Lines 1252-1290: Photo upload logic
    // Returns: { photoUrl, error }
  }

  const deletePhoto = async () => {
    // Lines 1457-1465: Photo deletion logic
  }

  return { uploadPhoto, deletePhoto }
}
```

**⚠️ PRESERVE**:
- `supabase.auth.getUser()` calls
- `supabase.storage.from('user-photos')` operations
- Database updates to `user_profiles` and `resume_data`

---

#### Step 3.3: Extract Preview & PDF Logic

Create: `src/components/resume-editor/hooks/useResumeExport.ts`

**Hook**:
```typescript
export function useResumeExport() {
  const generatePreview = async (resumeData, template) => {
    // Line 1182: Preview API call
    // Returns: { html, error }
  }

  const downloadPDF = async (resumeData, template) => {
    // Line 1304: PDF download API call
    // Triggers browser download
  }

  return { generatePreview, downloadPDF }
}
```

**⚠️ PRESERVE**:
- Exact API request format
- Data serialization
- Error handling

---

#### Step 3.4: Optimize with React.memo/useMemo/useCallback

**Add to Each Extracted Component**:

```typescript
// Example: PersonalInfoHeader.tsx
import { memo, useCallback, useMemo } from 'react'

export const PersonalInfoHeader = memo(function PersonalInfoHeader({
  personalInfo,
  onUpdate,
  photoUrl,
  onPhotoUpload
}: PersonalInfoHeaderProps) {

  // Memoize computed values
  const fullName = useMemo(() => {
    return `${personalInfo.firstName} ${personalInfo.lastName}`
  }, [personalInfo.firstName, personalInfo.lastName])

  // Memoize callbacks
  const handleNameChange = useCallback((field: string, value: string) => {
    onUpdate({ ...personalInfo, [field]: value })
  }, [personalInfo, onUpdate])

  return (
    // JSX
  )
})
```

**Apply to**:
- All section components
- All list item components
- All form field components

**Expected Impact**:
- Reduce re-renders by ~60%
- Improve perceived performance

---

### Phase 4: Final PerfectStudio Structure

**After refactoring, PerfectStudio.tsx should be ~500 lines**:

```typescript
// PerfectStudio.tsx (orchestrator only)
export function PerfectStudio({ mode, jobData, variantId, ... }: Props) {
  // Contexts
  const { resumeData } = useSupabaseResumeContext()
  const { updateField, updateSection } = useSupabaseResumeActions()

  // Custom hooks
  const { uploadPhoto, deletePhoto } = usePhotoUpload()
  const { generatePreview, downloadPDF } = useResumeExport()

  // State (minimal)
  const [selectedTemplate, setSelectedTemplate] = useState('swiss')
  const [expandedSections, setExpandedSections] = useState({...})

  return (
    <div className="perfect-studio">
      <TemplateSelector ... />

      <PersonalInfoHeader
        personalInfo={resumeData.personalInfo}
        onUpdate={(data) => updateField('personalInfo', data)}
        photoUrl={resumeData.personalInfo.photo}
        onPhotoUpload={uploadPhoto}
      />

      <SummarySection
        summary={resumeData.professionalSummary}
        onUpdate={(summary) => updateField('professionalSummary', summary)}
        enabled={resumeData.enableProfessionalSummary}
      />

      <ExperienceSection
        experience={resumeData.experience}
        onUpdate={(exp) => updateField('experience', exp)}
      />

      {/* ... other sections ... */}

      <ExportButtons
        onPreview={() => generatePreview(resumeData, selectedTemplate)}
        onDownload={() => downloadPDF(resumeData, selectedTemplate)}
      />
    </div>
  )
}
```

**New File Structure**:
```
src/components/resume-editor/
├── PerfectStudio.tsx (500 lines)
├── sections/
│   ├── SectionCard.tsx
│   ├── PersonalInfoHeader.tsx
│   ├── SummarySection.tsx
│   ├── ExperienceSection.tsx
│   ├── EducationSection.tsx
│   ├── ProjectsSection.tsx
│   ├── SkillsSection.tsx (wrapper for EnhancedSkillsManager)
│   ├── LanguagesSection.tsx
│   ├── CertificationsSection.tsx
│   └── CustomSectionsManager.tsx
├── hooks/
│   ├── usePhotoUpload.ts
│   ├── useResumeExport.ts
│   └── useSectionToggle.ts
└── components/
    ├── TemplateSelector.tsx (already exists)
    ├── EnhancedSkillsManager.tsx (already exists)
    └── PhotoUploadButton.tsx
```

---

## ⚠️ Critical Testing Checklist

After EACH step, verify:

### ✅ GPT Pipelines Work
- [ ] Preview generation works (resume renders correctly)
- [ ] PDF download works (correct template, all data included)
- [ ] No changes to API request/response format

### ✅ Supabase Realtime Works
- [ ] Auto-save triggers every 2 seconds after change
- [ ] Changes appear in database (`resume_data` table)
- [ ] Mode switching (base ↔ tailor) works
- [ ] Variant ID preserved in tailor mode

### ✅ Photo Upload Works
- [ ] Photo uploads to Supabase storage
- [ ] Photo URL saved to `user_profiles` table
- [ ] Photo URL saved to `resume_data` table
- [ ] Photo displays correctly
- [ ] Delete photo works

### ✅ Skills Management Works
- [ ] Skills can be added/edited/deleted
- [ ] Dynamic categories work
- [ ] Tailor mode shows job-specific suggestions
- [ ] Skills persist to database

### ✅ All Sections Work
- [ ] Personal info edits save
- [ ] Summary edits save
- [ ] Experience add/edit/delete works
- [ ] Education add/edit/delete works
- [ ] Projects add/edit/delete works
- [ ] Certifications add/edit/delete works
- [ ] Custom sections can be added/edited/deleted
- [ ] All bullets editable with rich text

### ✅ Template Switching Works
- [ ] Can switch between Swiss/Professional/Classic/Impact
- [ ] Preview updates correctly
- [ ] PDF uses selected template

---

## 📊 Expected Results

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| **Total Studio Lines** | 6,192 | ~1,200 | 80% reduction |
| **PerfectStudio Lines** | 2,611 | ~500 | 81% reduction |
| **Dead Code** | 3,581 | 0 | 100% removed |
| **Unused Code** | 58% | 0% | All cleaned |
| **Reusable Components** | 0 | 12+ | New architecture |
| **React.memo Usage** | 0 | 10+ | Better performance |
| **useMemo/useCallback** | 1 | 30+ | Optimized |
| **Test Coverage** | 0% | 80%+ | Testable |

---

## 🚨 What NOT to Do

❌ **DO NOT**:
1. Change API request/response formats
2. Remove or modify GPT API calls
3. Change Supabase auth flow
4. Modify auto-save debounce timing
5. Change database table structure
6. Alter photo upload bucket/path
7. Remove mode awareness (base vs tailor)
8. Change variant ID handling
9. Skip testing after each step
10. Mark complete until ALL tests pass

✅ **DO**:
1. Test after every extraction
2. Keep GPT pipelines identical
3. Preserve Supabase realtime
4. Add comprehensive tests
5. Document every change
6. Use TypeScript strictly
7. Add error boundaries
8. Improve performance with React optimizations
9. Keep user experience identical
10. Ask questions if unsure

---

## 📋 Implementation Checklist

### Phase 1: Cleanup ⏳ TODO
- [ ] Archive TailorStudio.tsx
- [ ] Archive TailorPerfectStudio.tsx
- [ ] Update archived/README.md
- [ ] Test app still works

### Phase 2: Documentation ⏳ TODO
- [ ] Document all GPT API calls
- [ ] Map Supabase realtime flow
- [ ] Create architecture diagram
- [ ] List all database operations

### Phase 3: Extraction ⏳ TODO

**Step 3.1: UI Components**
- [ ] Extract SectionCard.tsx
- [ ] Extract PersonalInfoHeader.tsx
- [ ] Extract SummarySection.tsx
- [ ] Extract ExperienceSection.tsx
- [ ] Extract EducationSection.tsx
- [ ] Extract ProjectsSection.tsx
- [ ] Extract SkillsSection.tsx
- [ ] Extract LanguagesSection.tsx
- [ ] Extract CertificationsSection.tsx
- [ ] Extract CustomSectionsManager.tsx
- [ ] Test ALL sections work
- [ ] Verify auto-save still works

**Step 3.2: Hooks**
- [ ] Create usePhotoUpload.ts
- [ ] Test photo upload
- [ ] Test photo delete
- [ ] Create useResumeExport.ts
- [ ] Test preview generation
- [ ] Test PDF download

**Step 3.3: Optimizations**
- [ ] Add React.memo to all components
- [ ] Add useMemo for computed values
- [ ] Add useCallback for event handlers
- [ ] Measure performance improvements

### Phase 4: Testing ⏳ TODO
- [ ] All GPT pipeline tests pass
- [ ] All Supabase realtime tests pass
- [ ] All section tests pass
- [ ] Photo upload tests pass
- [ ] Template switching tests pass
- [ ] Mode switching tests pass
- [ ] No console errors
- [ ] No performance regressions

### Phase 5: Documentation ⏳ TODO
- [ ] Update CLAUDE.md
- [ ] Update component documentation
- [ ] Add JSDoc comments
- [ ] Create migration guide

---

## ⏱️ Estimated Timeline

| Phase | Time | Risk Level |
|-------|------|------------|
| Phase 1: Cleanup | 1 hour | LOW |
| Phase 2: Documentation | 2 hours | NONE |
| Phase 3.1: UI Extraction | 8-10 hours | MEDIUM |
| Phase 3.2: Hooks | 4-6 hours | MEDIUM |
| Phase 3.3: Optimizations | 4-6 hours | LOW |
| Phase 4: Testing | 6-8 hours | HIGH |
| Phase 5: Documentation | 2 hours | NONE |
| **TOTAL** | **27-35 hours** | **3-5 days** |

---

## 🎯 Success Criteria

### MUST Have (Blockers)
1. ✅ All GPT pipelines work identically
2. ✅ Supabase realtime auto-save works
3. ✅ Photo upload/delete works
4. ✅ All sections editable
5. ✅ Template switching works
6. ✅ PDF download works
7. ✅ Mode switching (base ↔ tailor) works
8. ✅ No console errors
9. ✅ No data loss

### SHOULD Have (Important)
1. ✅ 80% reduction in component size
2. ✅ 10+ reusable components
3. ✅ React.memo on all sections
4. ✅ useMemo/useCallback optimizations
5. ✅ Test coverage >70%

### NICE to Have (Optional)
1. ✅ Performance monitoring
2. ✅ Error boundaries
3. ✅ Loading states
4. ✅ Accessibility improvements

---

**Status**: 🚧 NOT STARTED
**Next Action**: Phase 1 - Archive dead code
**Blocked By**: None
**Blocking**: All other refactoring work

**DO NOT mark this plan as complete until all checklist items are ✅**

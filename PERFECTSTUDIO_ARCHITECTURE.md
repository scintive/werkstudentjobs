# PerfectStudio Architecture Documentation

**Purpose**: Critical documentation of ALL GPT pipelines, Supabase flows, and integration points in PerfectStudio.tsx

⚠️ **DO NOT MODIFY without understanding these flows** - Breaking changes will cause data loss or GPT failures.

---

## 🔄 Auto-Save Flow (Supabase Realtime)

### Configuration
- **Debounce Interval**: 2000ms (2 seconds)
- **Context**: `SupabaseResumeProvider`
- **Location**: `src/lib/contexts/SupabaseResumeContext.tsx`

### Flow Diagram

```
User edits field
     ↓
localData state updated (PerfectStudio)
     ↓
useEffect watches resumeData changes (line 285-290)
     ↓
scheduleAutoSave(resumeData) triggered
     ↓
Clear existing timeout
     ↓
Set new timeout (2000ms)
     ↓
saveToSupabase(data) called
     ↓
Mode check: 'base' or 'tailor'?
     ↓
┌─────────────────┴────────────────┐
│                                   │
▼                                   ▼
BASE MODE                      TAILOR MODE
     ↓                              ↓
Normalize languages              Has variantId?
     ↓                              ↓
resumeDataService               YES: resumeVariantService
.saveResumeData()              .updateVariant()
     ↓                              ↓
Update resume_data table        Update resume_variants table
     ↓                              ↓
setLastSaved(new Date())        setLastSaved(new Date())
```

### Critical Code Points

**Line 41** (`SupabaseResumeContext.tsx`):
```typescript
autoSaveInterval = 2000  // DO NOT CHANGE without testing
```

**Lines 207-215** (`SupabaseResumeContext.tsx`):
```typescript
const scheduleAutoSave = React.useCallback((data: ResumeData) => {
  if (autoSaveTimeoutRef.current) {
    clearTimeout(autoSaveTimeoutRef.current)  // Clear existing
  }

  autoSaveTimeoutRef.current = setTimeout(() => {
    saveToSupabase(data)
  }, autoSaveInterval)  // 2000ms debounce
}, [saveToSupabase, autoSaveInterval])
```

**Lines 162-204** (`SupabaseResumeContext.tsx` - saveToSupabase):
```typescript
if (mode === 'tailor') {
  if (variantId) {
    // Save to resume_variants table
    await resumeVariantService.updateVariant(variantId, normalized)
  } else {
    // CRITICAL: Don't save if no variantId (prevents base overwrite)
    console.warn('⚠️ Skipped saving: variantId not available')
  }
} else {
  // Save to resume_data table
  await resumeService.saveResumeData(normalized, template)
}
```

### Data Normalization (CRITICAL)

**Languages must be normalized before save**:

```typescript
// Top-level languages array → skills.languages string array
const topLangs = Array.isArray(normalized.languages) ? normalized.languages : []
const skillsLanguages = topLangs.map(l => {
  if (typeof l === 'string') return l
  const name = (l?.language ?? l?.name ?? '').trim()
  const level = (l?.proficiency ?? l?.level ?? '').trim()
  return name ? (level ? `${name} (${level})` : name) : ''
}).filter(Boolean)

normalized.skills = { ...normalized.skills, languages: skillsLanguages }
```

**⚠️ WHY**: Database `resume_data` table only has `skills` JSONB column, no top-level `languages` column.

---

## 🤖 GPT Pipeline #1: Preview Generation

### Endpoint
**POST** `/api/resume/preview`

### Location in PerfectStudio
**Lines 1180-1202**

### Trigger
- Template change (`activeTemplate` state)
- Resume data change (`localData` state)
- Skill level toggle (`showSkillLevelsInResume` state)
- **Debounced**: 800ms

### Request Format
```typescript
{
  resumeData: ResumeData,           // Complete resume object
  template: string,                 // 'swiss' | 'professional' | 'classic' | 'impact'
  userProfile: ResumeData,          // Same as resumeData (for languages)
  showSkillLevelsInResume: boolean  // Skill level visibility
}
```

### Response Format
```typescript
{
  html: string  // Rendered HTML template
}
```

### Data Flow
```
localData/activeTemplate/showSkillLevelsInResume change
     ↓
useEffect dependency trigger
     ↓
Clear existing debounce timer
     ↓
Set new timer (800ms)
     ↓
POST /api/resume/preview
     ↓
Receive HTML string
     ↓
setPreviewHtml(data.html)
     ↓
iframe src updated
     ↓
Scroll position restored
```

### Critical Code

**Lines 1180-1202** (`PerfectStudio.tsx`):
```typescript
useEffect(() => {
  setIsGeneratingPreview(true)

  // Debounce timer
  debounceTimer.current = setTimeout(async () => {
    // Update all fields first
    if (localData && updateField) {
      Object.keys(localData).forEach(key => {
        if (localData[key as keyof typeof localData] !== resumeData[key as keyof typeof resumeData]) {
          updateField(key as any, localData[key as keyof typeof localData])
        }
      })
    }

    // Generate preview
    try {
      const response = await fetch('/api/resume/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeData: localData,
          template: activeTemplate,
          userProfile: resumeData,
          showSkillLevelsInResume: showSkillLevelsInResume
        })
      })

      if (response.ok) {
        const data = await response.json()
        setPreviewHtml(data.html)  // Update iframe
      }
    } catch (error) {
      console.error('Preview generation failed:', error)
    } finally {
      setIsGeneratingPreview(false)
    }
  }, 800)  // 800ms debounce

  return () => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }
  }
}, [localData, activeTemplate, showSkillLevelsInResume])
```

**⚠️ DO NOT MODIFY**:
- Request body format
- Debounce timing (800ms optimized for UX)
- Dependencies array

---

## 🤖 GPT Pipeline #2: PDF Export

### Endpoint
**POST** `/api/resume/pdf-download`

### Location in PerfectStudio
**Lines 1302-1327**

### Trigger
- User clicks download button
- **No debounce** (immediate execution)

### Request Format
```typescript
{
  resumeData: ResumeData,           // Complete resume object
  template: string,                 // Selected template
  userProfile: ResumeData,          // Same as resumeData
  showSkillLevelsInResume: boolean  // Skill level visibility
}
```

### Response Format
```typescript
// Binary blob (PDF file)
Content-Type: application/pdf
```

### Data Flow
```
User clicks "Download PDF"
     ↓
exportToPDF() function
     ↓
POST /api/resume/pdf-download
     ↓
Receive PDF blob
     ↓
Create object URL
     ↓
Trigger browser download
     ↓
Revoke object URL (cleanup)
```

### Critical Code

**Lines 1302-1327** (`PerfectStudio.tsx`):
```typescript
const exportToPDF = async () => {
  try {
    const response = await fetch('/api/resume/pdf-download', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        resumeData: localData,
        template: activeTemplate,
        userProfile: resumeData,
        showSkillLevelsInResume: showSkillLevelsInResume
      })
    })

    if (response.ok) {
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${localData.personalInfo.name || 'resume'}.pdf`
      a.click()
      window.URL.revokeObjectURL(url)  // Cleanup
    }
  } catch (error) {
    console.error('PDF export failed:', error)
  }
}
```

**⚠️ DO NOT MODIFY**:
- Request body format (must match preview exactly)
- Blob handling
- Download filename logic
- URL cleanup

---

## 📸 Photo Upload Pipeline (Supabase Storage)

### Location in PerfectStudio
**Lines 1250-1299**

### Trigger
- User uploads/crops photo
- Image crop modal completes

### Flow Diagram

```
User selects photo
     ↓
ImageCropModal opens
     ↓
User crops image
     ↓
handleCroppedImage(blob) called
     ↓
supabase.auth.getUser()
     ↓
Compress image (max 1MB, 800px)
     ↓
Upload to Supabase Storage
  Bucket: 'profile-photos'
  Path: '{user.id}/profile.jpg'
  Options: { upsert: true }
     ↓
Get public URL + cache bust
     ↓
Update local state
     ↓
Update user_profiles table
     ↓
Update resume_data table
     ↓
Force immediate save (saveNow())
     ↓
Close modal
```

### Critical Code

**Lines 1250-1299** (`PerfectStudio.tsx`):
```typescript
const handleCroppedImage = async (croppedBlob: Blob) => {
  try {
    // 1. Get authenticated user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No user found')

    // 2. Compress image
    const compressedFile = await imageCompression(croppedBlob as File, {
      maxSizeMB: 1,
      maxWidthOrHeight: 800,
      useWebWorker: true,
    })

    // 3. Upload to Supabase Storage
    const fileName = `${user.id}/profile.jpg`

    const { error: uploadError } = await supabase.storage
      .from('profile-photos')  // ⚠️ BUCKET NAME
      .upload(fileName, compressedFile, {
        upsert: true,  // Overwrite existing
        contentType: 'image/jpeg'
      })

    if (uploadError) throw uploadError

    // 4. Get public URL with cache bust
    const { data: urlData } = supabase.storage
      .from('profile-photos')
      .getPublicUrl(fileName)

    const photoUrl = `${urlData.publicUrl}?t=${Date.now()}`  // Cache bust

    // 5. Update local state
    setLocalData({ ...localData, photoUrl } as any)
    updateField('photoUrl' as any, photoUrl)

    // 6. Update database tables
    await supabase.from('user_profiles')
      .update({ photo_url: photoUrl })
      .eq('user_id', user.id)

    await supabase.from('resume_data')
      .update({ photo_url: photoUrl })
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(1)

    // 7. Force immediate save (bypass debounce)
    await saveNow()

    // 8. Close modal
    setImageToCrop(null)
  } catch (error) {
    console.error('Photo upload failed:', error)
    alert('Failed to upload photo. Please try again.')
  }
}
```

### Database Updates

**Table 1**: `user_profiles`
```sql
UPDATE user_profiles
SET photo_url = ?
WHERE user_id = ?
```

**Table 2**: `resume_data`
```sql
UPDATE resume_data
SET photo_url = ?
WHERE user_id = ?
ORDER BY updated_at DESC
LIMIT 1
```

**⚠️ CRITICAL**:
- Both tables must be updated
- Order matters: user_profiles first, then resume_data
- Must call `saveNow()` to bypass debounce
- Cache busting with `?t=` timestamp

### Photo Delete Flow

**Lines 1457-1465** (`PerfectStudio.tsx`):
```typescript
// Delete photo
const { data: { user } } = await supabase.auth.getUser()
if (user) {
  await supabase.from('user_profiles')
    .update({ photo_url: null })
    .eq('user_id', user.id)

  await supabase.from('resume_data')
    .update({ photo_url: null })
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(1)
}
```

---

## 📊 State Management

### Local State (PerfectStudio Component)

```typescript
const [localData, setLocalData] = useState<ResumeData>(resumeData)
const [activeTemplate, setActiveTemplate] = useState('swiss')
const [previewHtml, setPreviewHtml] = useState<string>('')
const [isGeneratingPreview, setIsGeneratingPreview] = useState(false)
const [showSkillLevelsInResume, setShowSkillLevelsInResume] = useState(false)
const [imageToCrop, setImageToCrop] = useState<string | null>(null)
const [newSkillInput, setNewSkillInput] = useState({ ... })
const [selectedCustomSection, setSelectedCustomSection] = useState<string | null>(null)
const [expandedSections, setExpandedSections] = useState({ ... })

// Refs
const debounceTimer = useRef<NodeJS.Timeout | null>(null)
const iframeRef = useRef<HTMLIFrameElement>(null)
const lastScrollPosition = useRef(0)
```

### Context State (SupabaseResumeProvider)

```typescript
// From useSupabaseResumeContext()
const {
  resumeData,      // Global resume data (synced with DB)
  isLoading,       // Initial load state
  isSaving,        // Auto-save in progress
  lastSaved,       // Last save timestamp
  resumeId,        // Resume ID in DB
  saveError,       // Save error message
  mode,            // 'base' | 'tailor'
  variantId        // Variant ID (tailor mode only)
} = useSupabaseResumeContext()

// From useSupabaseResumeActions()
const {
  updateField,     // Update single field
  updateSection,   // Update entire section
  undo,            // Undo last change
  redo,            // Redo change
  canUndo,         // Can undo?
  canRedo,         // Can redo?
  saveNow          // Force immediate save (bypass debounce)
} = useSupabaseResumeActions()
```

### State Flow

```
User edits field
     ↓
setLocalData(newData)  // Local state
     ↓
[800ms debounce]
     ↓
updateField(key, value)  // Context action
     ↓
resumeData updated  // Context state
     ↓
useEffect watches resumeData change
     ↓
scheduleAutoSave(resumeData)  // 2000ms debounce
     ↓
saveToSupabase(resumeData)
     ↓
Database updated
```

---

## 🔗 Integration Points Summary

### API Endpoints Used
1. **`POST /api/resume/preview`**
   - Purpose: Generate HTML preview
   - Debounce: 800ms
   - Trigger: Data/template/settings change

2. **`POST /api/resume/pdf-download`**
   - Purpose: Generate PDF
   - Debounce: None (immediate)
   - Trigger: User action

### Supabase Operations

#### Storage
- **Bucket**: `profile-photos`
- **Operations**:
  - Upload (upsert: true)
  - Get public URL
  - No delete operation (just NULL in DB)

#### Database Tables

**`user_profiles`**:
- UPDATE photo_url
- WHERE user_id = auth.uid()

**`resume_data`** (base mode):
- UPDATE entire resume object
- WHERE user_id = auth.uid()
- ORDER BY updated_at DESC LIMIT 1

**`resume_variants`** (tailor mode):
- UPDATE entire resume object
- WHERE id = variantId

#### Auth
- `supabase.auth.getUser()` - Get current user
- Used for: Photo upload, DB updates

---

## ⚠️ Breaking Change Checklist

Before modifying PerfectStudio, verify:

### Auto-Save
- [ ] Debounce timing remains 2000ms
- [ ] Mode detection (base vs tailor) intact
- [ ] Language normalization preserved
- [ ] variantId check for tailor mode
- [ ] No save when variantId missing

### Preview Pipeline
- [ ] Request format unchanged
- [ ] Debounce timing remains 800ms
- [ ] All data fields included
- [ ] Error handling preserved

### PDF Pipeline
- [ ] Request format matches preview
- [ ] Blob handling intact
- [ ] Download trigger works
- [ ] URL cleanup happens

### Photo Upload
- [ ] Storage bucket name correct
- [ ] Compression settings preserved
- [ ] Both DB tables updated
- [ ] Cache busting works
- [ ] Force save called

### State Management
- [ ] Local state syncs with context
- [ ] useEffect dependencies correct
- [ ] No infinite loops
- [ ] Cleanup functions called

---

## 📝 Refactoring Guidelines

### Safe to Extract
✅ UI Components (pure, no side effects)
✅ Form fields (controlled inputs)
✅ Section cards (display only)

### Extract with Care
⚠️ Event handlers (keep debounce logic)
⚠️ State updaters (maintain sync)
⚠️ useEffect hooks (preserve dependencies)

### DO NOT Extract (Keep in PerfectStudio)
❌ Auto-save logic
❌ Preview generation logic
❌ PDF export logic
❌ Photo upload logic
❌ Mode switching logic
❌ Context integration

### Alternative: Create Custom Hooks

Instead of extracting to components, create hooks:

```typescript
// ✅ GOOD: Hook encapsulates logic
function usePhotoUpload() {
  const handleCroppedImage = async (blob: Blob) => {
    // All photo upload logic here
  }
  return { uploadPhoto: handleCroppedImage }
}

// ✅ GOOD: Hook encapsulates export
function useResumeExport() {
  const generatePreview = async (data, template) => {
    // Preview logic here
  }
  const downloadPDF = async (data, template) => {
    // PDF logic here
  }
  return { generatePreview, downloadPDF }
}

// Then in PerfectStudio:
const { uploadPhoto } = usePhotoUpload()
const { generatePreview, downloadPDF } = useResumeExport()
```

---

## 🧪 Testing Requirements

After ANY modification:

1. **Auto-Save Test**
   - [ ] Edit personal info → wait 2s → check DB
   - [ ] Edit in base mode → check resume_data
   - [ ] Edit in tailor mode → check resume_variants
   - [ ] Verify no save without variantId in tailor

2. **Preview Test**
   - [ ] Change template → preview updates
   - [ ] Edit data → preview updates (800ms)
   - [ ] Toggle skill levels → preview updates

3. **PDF Test**
   - [ ] Download PDF → opens correctly
   - [ ] All data visible in PDF
   - [ ] Template matches selection

4. **Photo Test**
   - [ ] Upload photo → appears immediately
   - [ ] Photo in user_profiles table
   - [ ] Photo in resume_data table
   - [ ] Cache busting works (no stale image)
   - [ ] Delete photo → removed from UI and DB

5. **Mode Switching**
   - [ ] Base mode → saves to resume_data
   - [ ] Tailor mode → saves to resume_variants
   - [ ] No cross-contamination

---

**Last Updated**: October 4, 2025
**Status**: Complete Documentation
**Next**: Phase 3 - Component Extraction

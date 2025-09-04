# GPT Pipeline - Complete Data Flow

## Core Pipeline
```
PDF → Text Extract → GPT Analysis → Structured Data → Templates → PDF
```

## Key Files & Flow

### 1. Profile Extraction
**File**: `/src/app/api/profile/extract/route.ts`
**Process**: 
- PDF → Puppeteer/PDF.js → Raw Text
- Text → GPT (`PROFILE_EXTRACTION` prompt) → UserProfile JSON
- **Generates**: `professional_title` + `professional_summary` + structured data

### 2. GPT Prompts
**File**: `/src/lib/config/prompts.ts`
- **`PROFILE_EXTRACTION`**: PDF text → UserProfile (with AI title/summary)
- **`JOB_PROFILE_ANALYSIS`**: Job matching + tailored resumes
- **Skills prompts**: Dynamic categorization

### 3. LLM Service
**File**: `/src/lib/services/llmService.ts`
**Key Methods**:
- `extractProfileFromText()` - Main PDF processing
- `organizeSkillsIntelligently()` - Dynamic skill categories  
- `generateCategorySkillSuggestions()` - Per-category suggestions

### 4. Data Conversion
**File**: `/src/app/page.tsx` (lines 103-104)
```typescript
professionalTitle: profile.professional_title || "Professional"
professionalSummary: profile.professional_summary || "fallback text"
```

### 5. Template Generation
**File**: `/src/app/api/resume/preview/route.ts`
- Formats UserProfile → Template data
- Handles dynamic skill categories
- Generates HTML for preview/PDF

## Professional Title & Summary Generation

### Enhanced Prompts (Fixed)
**PROFILE_EXTRACTION** now generates:
- **Title**: 2-3 words, domain-specific (e.g., "Senior Data Scientist")
- **Summary**: 2-4 sentences with metrics and value proposition

### Strategy
1. Analyze career level from experience duration
2. Identify strongest domain (tech/business/operations/etc.)
3. Combine seniority + expertise
4. Include quantified achievements in summary

## Skills Intelligence
**Triple Underscore Convention**: 
- GPT creates: `"client_relations___communication"`
- Display: `"Client Relations & Communication"`
- Maintains object key compatibility + rich names

## Template Integration
All templates automatically support:
- AI-generated professional titles/summaries
- Dynamic skill categories created by GPT
- Template-agnostic category processing

## Data Types
```typescript
interface UserProfile {
  personal_details: PersonalDetails
  professional_title?: string    // NEW: AI-generated
  professional_summary?: string  // NEW: AI-generated
  experience: Experience[]
  skills: Skills
  // ... rest
}
```

## What Happens on PDF Upload
1. **Text Extraction**: Puppeteer + PDF.js extract text
2. **GPT Processing**: `PROFILE_EXTRACTION` prompt analyzes text
3. **AI Generation**: Creates specific title (not "Professional") and impact summary
4. **Skills Organization**: Dynamic categories based on profile
5. **Data Conversion**: Converts to ResumeData format for editor
6. **Template Rendering**: Generates preview with AI-enhanced content

## Why It Wasn't Working Before
- `PROFILE_EXTRACTION` prompt didn't generate titles/summaries
- Hardcoded "Professional" + generic text in conversion code
- Enhanced wrong prompt (`JOB_PROFILE_ANALYSIS` instead of `PROFILE_EXTRACTION`)

## Now Fixed
- `PROFILE_EXTRACTION` generates professional positioning
- Conversion uses `profile.professional_title` from GPT
- All new PDF uploads get AI-enhanced titles and summaries
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI-powered job application system with Visual Web App built on Next.js (App Router, TypeScript strict mode). Features intelligent profile extraction from PDFs, job matching algorithms, tailored document generation, and a professional resume editor with live preview and PDF export.

## Essential Commands

### Development
```bash
# Start development server with Turbopack (port 3000)
npm run dev

# Start on custom port
PORT=3001 npm run dev

# Production build and start
npm run build
npm start

# Linting
npm run lint
```

### Testing
```bash
# Run all Playwright E2E tests
npx playwright test

# Run specific browser tests
npx playwright test --project=chromium

# Visual test runner UI
npx playwright test --ui

# CI mode with line reporter
npx playwright test --reporter=line --project=chromium
```

### Environment Setup
```bash
# Copy environment template
cp .env.example .env.local

# Required variables:
OPENAI_API_KEY=your_key_here
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url  
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Optional:
SUPABASE_SERVICE_ROLE_KEY=service_key  # For dev auto-confirm
PORT=3000  # Server port
```

## Architecture Overview

### Core Flow: Upload → Extract → Edit → Jobs → Strategy → Export

1. **Upload & Extraction** (`/` → `/api/profile/extract`)
   - PDF text extraction via pdf-parse
   - GPT-4 structured extraction with skills categorization
   - Converts to ResumeData format for editor

2. **Resume Editor** (`src/components/resume-editor/PerfectStudio.tsx`)
   - 60/40 split layout with live preview
   - Auto-saves to Supabase `resume_data` table
   - Dynamic skill categories with AI suggestions

3. **Job Browser** (`/jobs` → `src/components/jobs/JobBrowser.tsx`)
   - Split-pane LinkedIn-style interface
   - Three matching engines (Weighted Jaccard, TF-IDF, Semantic)
   - Company research integration

4. **Tailor Studio** (`/jobs/[id]/tailor`)
   - Inline Accept/Dismiss for AI suggestions
   - Section-specific tailoring (summary, experience bullets, skills)
   - Maintains scroll position during edits

5. **Export Pipeline** (`/api/resume/preview` → `/api/resume/pdf-download`)
   - Four templates (Swiss, Professional, Classic, Impact)
   - Server-side HTML generation with Puppeteer PDF conversion

### Data Architecture

**Supabase Tables** (migrations in `supabase_migrations/`):
- `resume_data`: Primary resume storage per session
- `user_profiles`: User profile with canonical skills/tools
- `jobs`: Job listings with normalized fields
- `companies`: Company research data
- `job_match_results`: Persisted matching scores
- `ai_cache`: LLM response cache (6h TTL)

**Session Management**:
- Cookie-based (`user_session`) with Supabase Auth integration
- Auto-save debounced at 2 seconds
- RLS policies with auth.uid() checks

### AI/LLM Integration (`src/lib/services/llmService.ts`)

**Key Methods**:
- `extractProfileFromText()`: PDF → structured profile
- `parseJobInfoOnly()`: Cost-optimized job parsing
- `organizeSkillsIntelligently()`: Dynamic skill categorization
- `smartCompanyResearch()`: Tavily search with cost guardrails

**Caching Strategy**:
- AICacheService with 6-hour TTL
- Job analysis cache with 7-day TTL
- Link verification cache with 12-hour TTL

### Matching Engines

1. **Weighted Jaccard** (Primary): Skills 55%, Tools 20%, Language 15%, Location 10%
2. **TF-IDF + Fuzzy**: Fast responsive matching with fuzzy string similarity
3. **Semantic**: OpenAI embeddings with cosine similarity

Server-first approach: chips always use `matchCalculation.skillsOverlap.matched`

## Critical Implementation Rules

### Authentication & Security
- Upload gated for anonymous users
- Bearer token auth for API routes
- Never commit service role keys
- Sanitize HTML in all user-facing content

### Skills System
- Triple underscore convention for dynamic categories: `client_relations___communication`
- GPT categories merged with legacy (technical, tools, soft_skills, languages)
- Deduplication by canonical keys (react/reactjs → React)
- Never show resume tokens as chips, only job phrases

### One-Pager Strategy Tab
- Single dense page, no scroll
- Max 6 tasks with meter, explainer, alignment
- Three evidence blocks (Experience, Projects, Certifications)
- No ATS keywords, interview prep, or coursework content

### Learning Links
- Never direct YouTube video links
- Keyworded search URLs only
- Verified provider links when available
- Server verification with caching

### Template System
- Single source of truth: TypeScript functions in `src/templates/`
- Dynamic category handling in `/api/resume/preview`
- A4 format with print-optimized CSS
- Scroll position preservation in preview iframe

## Performance Optimizations

- Template HTML generated server-side
- Single Puppeteer instance reused
- 800ms debounce on preview updates
- Batch state updates in React components
- Cost-optimized GPT calls (~$0.10-0.30 per suggestion)

## Testing Focus Areas

### High-Risk Paths
1. Auth flow: Login redirect, upload gating, session persistence
2. Tailor editor: Bullet synchronization, skills mapping
3. Preview API: Dynamic categories, template switching
4. Job parsing: GPT output integrity, DE→EN translation
5. Matching: Component weights, overlap calculations

### E2E Test Coverage
- `tests/auth.spec.ts`: Authentication flows
- `tests/gating.spec.ts`: Feature access control
- `tests/editor.spec.ts`: Resume editing operations
- `tests/jobs.spec.ts`: Job browser functionality
- `tests/preview-api.spec.ts`: API smoke tests

## Common Development Tasks

### Adding a New Template
1. Create template file in `src/templates/[name].ts`
2. Export function `generate[Name]ResumeHTML(data: any): string`
3. Add to template selector in `TemplateSelector.tsx`
4. Update preview/pdf routes to handle new template

### Modifying GPT Prompts
1. Edit prompts in `src/lib/config/prompts.ts`
2. Ensure JSON schema matches TypeScript interfaces
3. Test with mock data before production
4. Monitor costs via console logs

### Debugging Matching
1. Use `/api/debug/match?id=<jobId>` for single job analysis
2. Check normalized arrays in Supabase
3. Verify canonical deduplication logic
4. Review weight calculations in matching services

## Troubleshooting

### Common Issues

**Preview not updating**: Check scroll preservation logic, clear Next.js cache (`rm -rf .next`)

**Skills miscategorization**: Review `enhancedSkillsSystem.ts` mappings, verify GPT prompt

**PDF generation fails**: Check Puppeteer installation, validate HTML, review memory limits

**Session lost**: Verify cookies, check `/api/auth/ensure-session`, review RLS policies

**GPT calls expensive**: Implement debouncing, use targeted suggestions, cache responses

## Project Structure Quick Reference

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API endpoints
│   │   ├── profile/       # Profile extraction
│   │   ├── resume/        # Preview/PDF generation
│   │   ├── jobs/          # Job operations
│   │   └── skills/        # Skills management
│   └── (pages)/          # Route pages
├── components/
│   ├── resume-editor/     # Editor components
│   ├── jobs/             # Job browser
│   └── ui/               # Reusable UI
├── lib/
│   ├── services/         # Core services
│   ├── supabase/         # DB client/schema
│   └── config/           # App config/prompts
└── templates/            # Resume templates
```

## Important Notes

1. **Always use server-first matching** - chips from `matchCalculation.skillsOverlap.matched`
2. **Cost consciousness** - Debounce API calls, use targeted requests
3. **Professional design** - 50-tint backgrounds, 100-tint borders, 600-tint text
4. **State batching** - Update all related state atomically
5. **Error handling** - Graceful degradation for network/API failures
6. **TypeScript strict** - Maintain type safety throughout
7. **Template compatibility** - Handle both legacy and dynamic categories
8. **Session persistence** - Maintain user state across navigation
9. **Security first** - Sanitize HTML, validate inputs, use RLS
10. **Performance** - Optimize bundle size, minimize API calls
- whenever making any design edits, check DESIGN_SYSTEM.md for refernece and then find the correct reference and go there to make edits
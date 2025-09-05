# Codex: System Deep Dive (Visual App)

This document is a comprehensive, implementation-level overview of the project’s architecture, end‑to‑end flows, data model, prompts, and design system. It is intended as a single reference for developers and auditors.


## System Overview
- App: Next.js App Router (TypeScript, strict) with Tailwind UI.
- Data: Supabase (Postgres) with SQL migrations and typed client (`@supabase/supabase-js`).
- AI: OpenAI GPT-4/5 models via `src/lib/services/llmService.ts`; cost-optimized with structured outputs and caching.
- UX: LinkedIn‑style split‑pane job browser, visual resume editor, and AI strategy generation.
- Docs: Extensive in-repo documentation of GPT flows, matching, UI/UX, and status.

Recent Enhancements (Sept 2025)
- Auth: Traditional email/password via Supabase Auth; Upload is now gated for anonymous users. New Login, Register, Logout pages; header shows auth state.
- Session Bridge: `/api/auth/session` maps Supabase user.id → `user_session` httpOnly cookie for server routes that still rely on session_id.
- Security: RLS re-enabled with auth.uid() policies (plus a controlled session fallback for non-auth dev usage). New migration `06_enable_rls_auth_policies.sql`.
- API JWT: Server routes accept Authorization: Bearer <supabase_jwt> and use a server-side Supabase client with forwarded headers.
- Tailor Studio Parity: Editor’s left pane now matches Resume Studio UX (bullet-by-bullet experience, certifications, custom sections, languages under Skills) while preserving Tailor AI suggestion features.
- UI/UX: Global header with Dashboard/Jobs/Login/Register/Logout; new Dashboard; live Preview zoom; skeleton loaders; card hover and focus polish.

Matching + Strategy Overhaul (Sept 2025)
- Matching: server-first overlap used for chips; single‑label de‑duplication via canonical keys (react/react.js/reactjs → React; js/es6 → JavaScript, etc.). Fast TF‑IDF+fuzzy tightened (phrase‑level only), containment requires ratio ≥ 0.8, fuzzy ≥ 0.88; chips always show job phrases, never resume fragments. Strict relevance in evidence.
- One‑Pager Strategy: AI Strategy tab now renders a single, dense page (no ATS/Interview/Coursework blocks). xl 3‑column grid: two columns of tasks + one evidence column. Each task shows: meter + %, a task_explainer, organic user_alignment, and domain‑aware learn chips (quick wins, certifications, deepening). Evidence is visually grouped: Relevant Experience, Projects, Certifications (with hover micro‑interactions and tooltips). HTML in resume bullets is sanitized.
- GPT schema (student): job_task_analysis items include { task, task_explainer, compatibility_score, user_alignment, user_evidence, learning_paths: { quick_wins[], certifications[], deepening[] } }. Prompt enforces strict relevance (no unrelated mapping) and truthfully states gaps.


## High-Level Architecture
- Frontend (Next.js):
  - Pages: `src/app/**` (App Router). Core flows: upload → editor → jobs → strategy → finalize.
  - Components: `src/components/**` (UI, resume editor, job browser, onboarding, panels).
  - Styles: Tailwind + supplemental CSS in `src/styles/**`.
- API routes: `src/app/api/**/route.ts` (resume preview/pdf, profile extract/latest, jobs fetch/analyze/strategy, skills organize/suggest, auth helpers, supabase admin, location/geocode).
- Core libs: `src/lib/**`
  - `services/llmService.ts`: central AI pipeline (profile extraction, job parsing, skills org, company research, structured outputs, fallback logic).
  - `services/matchingService.ts`, `fastMatchingService.ts`, `semanticMatchingService.ts`: matching algorithms (weighted Jaccard; TF‑IDF + fuzzy; semantic embeddings).
  - `services/resumeDataService.ts`: session‑based persistence to Supabase with auto‑save and profile sync.
  - `services/aiCacheService.ts`: LLM response cache in `public.ai_cache`.
  - `supabase/*`: typed schema, client, SQL; migrations kept in `supabase_migrations/`.
- Supabase MCP server: `tools/mcp-supabase/server.js` (management API via access token, list/exec/apply migration).


## Data Model (Supabase)
Key tables (see `src/lib/supabase/schema.sql` and `supabase_migrations/`):
- `companies`:
  - Canonical company record + research data (website, industry, size, headquarters, values, leadership, reviews, news, research metadata).
- `jobs`:
  - Job metadata; links; location; work_mode; language; normalized skills/tools; arrays for responsibilities/nice_to_have/benefits/application_requirements; quality score; research and user interaction fields. Supports both multilingual extraction (“original”) and canonical fields for matching.
- `job_requirements`, `job_skills`:
  - Structured requirements and skills (with optional importance weight/category/canonical).
- `user_profiles`:
  - Session- or user‑id‑scoped JSON profile + canonical arrays (`skills_canonical`, `tools_canonical`), languages, location, preferences.
- `resume_data`:
  - Primary resume state storage per session: personal_info, professional title/summary, skills, experience, education, projects, certifications, custom sections, completeness, template hints.
- `job_match_results`:
  - Persistent matching results per user_profile/job with component scores, explanations, weights, and timestamps.
- `ai_cache`:
  - LLM cache: key/model/messages_hash/response_json/expires.
- `job_analysis_cache`:
  - Cached per-job strategy (e.g., student strategy), with profile hash and expiry.

Indexes, triggers, and RLS:
- Indices across foreign keys, text arrays (GIN), timestamps; `update_*_updated_at` triggers.
- RLS prepared on user-specific tables; `resume_data` is currently relaxed for development via `04_relax_resume_data_policies.sql`.
- Helper `set_session_context(session_id)` used by services to bind `app.session_id` in the backend session when RLS is enabled.


## Session & Persistence Model
- Client session ID: generated or read from cookies/localStorage via `ResumeDataService.getOrCreateSessionId()`; stored in cookie `user_session` when present.
- `SupabaseResumeProvider` bootstraps resume state by calling `/api/profile/latest` (uses cookies `user_session` | `user_email`) with fallback to service `getOrCreateResumeData()`.
- Auto‑save: debounced (default 2s) updates to `resume_data`. Manual save available.
- `ensure-session` API: attempts to repair cookies by finding an existing `resume_data` record; resets cookies accordingly.

Gating and Auth Flow
- Home Upload: Requires authentication; anonymous users see a clean Login/Register prompt.
- Login: Email/password via Supabase Auth; if already signed in, redirects to `/jobs`.
- Register: Creates Supabase user; in dev (optional) `/api/auth/admin/confirm` can auto‑confirm when `SUPABASE_SERVICE_ROLE_KEY` is set. Otherwise the normal email confirmation path applies.
- Tailor/Jobs: Tailor is behind `RequireAuth`. Jobs can be left open or gated depending on product decision.


## AI/LLM Subsystem
Central service: `src/lib/services/llmService.ts`.
- Client initialization: server‑only; falls back to mock responses if `OPENAI_API_KEY` missing and mock enabled.
- Structured outputs:
  - `createJsonResponse<T>` uses `chat.completions` with `response_format: json_schema` (strict) for GPT‑5 models; caches via `AICacheService` with `ai_cache` table.
  - Fallback `createJsonCompletion` with retry/delay, then JSON repair.
- JSON Schemas:
  - Job extraction, Profile extraction, Skills organization, Category suggestions.

Prompts (`src/lib/config/prompts.ts`):
- `JOB_EXTRACTION`:
  - System: strict JSON extractor.
  - User: parse raw job JSON; copy lists verbatim; detect language requirement DE/EN/both; bilingual handling with `original` and `english` fields where applicable; returns links, dates, company, work_mode, responsibilities/nice_to_have/benefits, named skills/tools, statements.
  - JSON repair prompt for malformed responses.
- `PROFILE_EXTRACTION`:
  - System: professional resume analyzer; extracts personal details; generates AI professional title (2–3 words) and summary (2–4 sentences, 60–80 words) with metrics; strict education dates (year + duration); custom sections; language proficiency with exact levels; certifications; projects; quantified results.
- Tailoring block (within prompts file):
  - Produces `fit_summary`, `cover_letter_markdown`, `resume_markdown`, and a `tailored_resume_data` object (title, summary, skills, experience, education, projects, certifications) with strict rules and explicit content requirements.
- `PROFILE_REVIEW`:
  - Outputs critique, improvement_plan, and a base_resume JSON.
- `EDUCATION_FORMATTING`:
  - Expands degree abbreviations to full names in normalized array output.
- `SKILL_ORGANIZATION`:
  - Creates 5–7 intelligent, profile‑specific categories; provides suggestions and reasoning; a category mapping for additional skills.

AI Flows (key methods):
- Profile extraction from PDF text: `extractProfileFromText()` (uses `PROFILE_EXTRACTION`), followed by education formatting via `formatEducationEntries()` and intelligent skill organization.
- Job parsing:
  - Cost‑efficient `parseJobInfoOnly()` with universal “English‑only” output rule, clean arrays, and strict skills extraction (skills, not platform names). Lower temperature, reduced tokens.
  - Rich `extractJobInfoWithResearch()` exists but is marked expensive; preferred approach is `parseJobInfoOnly()` + `smartCompanyResearch()`.
- Company research: `smartCompanyResearch()` uses Tavily Search (with cost guardrails and targeted queries), maps results into structured fields (website, careers, HQ, size, leadership, culture, products, funding, competitors, ratings, policies, news). Fallback `performTavilySearch()` retained for compatibility.
- Skills intelligence:
  - `organizeSkillsIntelligently()` uses strict schema, retries, and JSON repair; categorizes skills into tailored groups with suggestions and profile assessment; includes robust fallbacks.
  - Per‑category suggestion generator with safe JSON parse and fallbacks.

Caching:
- `AICacheService` hashes payload, caches JSON for TTL (default 6h) in `ai_cache`. Reads are gated by `isSupabaseConfigured()`.


## Job Ingestion & Processing
API: `src/app/api/jobs/fetch/route.ts`
- Source: Apify LinkedIn dataset (`JOB_FETCHING.DATASET_URL` via `src/lib/config/app.ts`).
- Flow:
  1) Fetch raw jobs (limit capped for cost/speed).
  2) Parse job info via `llmService.parseJobInfoOnly()`; fallback to full `extractJobInfo()`.
  3) Optional `smartCompanyResearch()` (only when company name known and valid) with cost tracking.
  4) Geocode city (skip for “remote”) via `locationService` APIs.
  5) Normalize and enrich fields; extract tools from skills; derive work_mode/location; set application link; compute quality score.
  6) Upsert `companies` with research metadata; upsert `jobs` with canonical arrays and normalized flags.

API returns jobs with joined companies and total counts. Supports `?refresh=true` to force re‑ingestion.


## Matching Engines
You have three strategies; each can be wired to UI/flows as needed.

1) Weighted Jaccard (primary): `src/lib/services/matchingService.ts`
- Weights: skills 55%, tools 20%, language 15%, location 10%.
- Normalization: DE→EN glossary, synonyms, optional GPT translation for German terms, lowercase/trim/dedupe.
- Jaccard overlap for skills/tools; language fit check (A1..C2/native) with B2 defaults; enhanced location fit (city match, remote/hybrid flags, German city mappings).
- Output: component overlaps (intersection/union; matched/missing), explanations; totalScore 0–100.

2) Fast TF‑IDF + fuzzy: `src/lib/services/fastMatchingService.ts`
- Weights: skills 50, tools 20, experience 15, language 10, location 5.
- Normalization with synonym expansion; importance weighting; Levenshtein similarity for fuzzy matches; coverage and critical missing identification.
- Good for responsive UX and broad matching.

3) Semantic (embeddings): `src/lib/services/semanticMatchingService.ts`
- Weights: skills 60, tools 15, language 15, location 10.
- OpenAI `text-embedding-3-small` for cosine similarity; enhanced string match fallback; fuzzy city mapping; language fit via string heuristics.
- Returns semantic match flag and detailed breakdown.

Persisted match scores: `src/lib/services/jobMatchingService.ts`
- Uses Supabase RPC `calculate_job_matches` + enrichment fetch of job details.
- Caches per user_profile ID in memory; filters (minScore, workMode, location, mustHaveSkills); can save results to `job_match_results` and subscribe to changes via realtime channels.


## Resume Pipeline (Upload → Editor → Preview/PDF)
1) Upload (Home `/` → Upload step):
- Component: `src/components/onboarding/resume-upload.tsx` posts PDF to `/api/profile/extract`.
- Extraction: `profile/extract` uses `pdf-parse` (fallback: Puppeteer + PDF.js CDN) to get text, then `llmService.extractProfileFromText()`.
- Enhancements: education normalization; intelligent skill organization (categories + suggestions; robust fallbacks).
- Returns `profile` and `organizedSkills` to the client.

2) Convert to editor format:
- In `src/app/page.tsx`, the `handleProfileExtracted` callback converts extracted profile to `ResumeData` shape and seeds the editor.
- `SupabaseResumeProvider` auto‑saves edits to `resume_data` and syncs to `user_profiles` for matching.

3) Preview & PDF:
- API: `/api/resume/preview` formats `ResumeData` to template input and returns HTML.
  - Handles dynamic GPT categories using the triple‑underscore convention (e.g., `client_relations___communication` → “Client Relations & Communication”).
  - Optional skill proficiency display governed by intelligent heuristics per category.
- API: `/api/resume/pdf-download` (not detailed here) renders HTML to PDF.
- Templates: `src/templates/{swiss,classic,professional,impact}.ts` generate HTML with consistent structure.

Tailor Studio Parity (New)
- Experience: Bullet-by-bullet editing (add/remove) in the editor; synced to both `achievements[]` and `description` (newline-joined) to keep Preview in sync.
- Skills & Languages: Uses `TailorEnhancedSkillsManager` with job-aware hints; languages editable (mapped to `skills.languages` as “Name (Level)”).
- Certifications: Add/edit name/issuer/date.
- Custom Sections: Add/rename sections such as Volunteer, Awards, Publications; four-field item editor; saves to `customSections` for preview rendering.


## Job Browser & Strategy
- Component: `src/components/jobs/JobBrowser.tsx` renders split‑pane UI; uses badges for EN/DE and intern/Werkstudent; integrates skills analysis and company intelligence panels.
- Strategy (Student): `/api/jobs/strategy-student` builds compact contexts from real job fields (`responsibilities_original`, `skills_original`, etc.) and the student profile, then invokes LLM to produce detailed job strategy artifacts. Caching via `job_analysis_cache` keyed by `job_id` + profile hash exists but is selectively bypassed for “real data” freshness.
- Other strategy routes: `strategy`, `strategy-enhanced`, and cover letter routes exist for non-student flows.

Authoring Rules (matching + strategy)
- Never mock data in UI; all verification via Supabase and live API routes.
- Matching chips must come from server overlap (matchCalculation.skillsOverlap.matched). Only fall back locally when server arrays are truly empty.
- Normalize once; de‑duplicate by canonical job phrase; never show resume tokens as chips.
- Strategy tab shows one‑pager only. No ATS keywords, interview lists, or coursework alignment on the one‑pager.
- Per‑task content: render { task, % meter, task_explainer, user_alignment (truthful), learn chips }. Do not add unrelated evidence.
- Evidence: show as three visual blocks (Experience, Projects, Certifications). Sanitize any HTML; clamp lines; add hover tooltips.
- Regeneration: if strategy cache exists, allow a UI refresh control or cache-buster to fetch the latest GPT schema.


## Skills Intelligence
- Prompts create 5–7 tailored categories with skills and suggestions; `llmService` enforces strict schema and JSON repairs.
- Resume preview merges legacy categories (technical/tools/soft_skills/languages) and dynamic GPT categories into clean display groups with optional proficiency chips for tool/technology‑oriented categories.
- Per‑category suggestions: generated via LLM with structured array output and de‑duplication against existing skills; robust fallback lists.


## Design System
- UI Components: `src/components/ui/*` (buttons, cards, tabs, inputs, dropdowns, badges, separators, progress, labels, Markdown renderer, file upload, inline editors, drag-drop list, step indicator). Shadcn-inspired composition, typed props, Tailwind classes.
- Feature Components: resume editors (`PerfectStudio`, rich text, skills managers), job panels (skills analysis, company intelligence), Werkstudent features (eligibility checker, comprehensive analysis).
- Styles: Tailwind, with supplementary polished CSS:
  - `src/styles/enhanced-ui.css`: visual polish and layout details.
  - `src/styles/resume-isolation.css`: print-friendly, A4 layout and isolation.
  - `src/styles/button-styles.css`: button variants.
- Templates: Single-source HTML generators with A4 measurements, print rules, typography, and spacing consistency.


## API Surface (selected)
- Auth/session helpers:
  - `GET /api/auth/ensure-session`: ensure cookies map to an existing `resume_data` session.
- Profile:
  - `POST /api/profile/extract`: PDF → text → GPT → structured profile (+ organized skills).
  - `GET /api/profile/latest`: returns newest `resume_data` for current session/email; fallback to `user_profiles`.
- Resume:
  - `POST /api/resume/preview`: returns rendered HTML for chosen template (handles dynamic skills).
  - `POST /api/resume/pdf-download`: create PDF from HTML.
- Auth:
  - `POST /api/auth/session`: set/clear httpOnly cookies for server compatibility (maps Supabase user.id → `user_session`).
  - `POST /api/auth/admin/confirm`: (dev) confirm a newly registered user when service role is configured.
- Jobs:
  - `GET /api/jobs/fetch?[refresh=true]`: ingest from Apify and return jobs (+companies).
  - `POST /api/jobs/strategy-student`: Werkstudent job strategy using real arrays — see Prompt Contracts for schema.
  - `POST /api/jobs/strategy-enhanced`: long‑form strategy (not rendered on one‑pager).
  - `POST /api/jobs/match-scores`: fast batch matching; returns `matchCalculation` with overlaps.
  - `GET /api/debug/match?id=<jobId>`: debug normalized arrays + overlaps for a single job.
  - Additional: `analyze`, `analyze-student`, `cover-letter`, `strategy`, `strategy-cache`.
- Skills:
  - `POST /api/skills/{organize,enhance,category-suggest,suggest}`: skill organization/intelligence.
- Location:
  - `GET /api/location/{geocode,direct-test,test}`: geocoding and diagnostics.
- Admin/Supabase:
  - `POST /api/supabase/{apply-schema,migrate}`; `GET /api/supabase/test`.
  - `GET /api/admin/{migrate,profiles}`; `POST /api/admin/clear-session`; `POST /api/admin/create-cache-table`.


## Configuration & Environment
- Env: `.env.local` uses `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_BASE_URL`. OpenAI via `OPENAI_API_KEY`.
- App config: `src/lib/config/app.ts` stores model names, feature flags (error handling, mock responses), dataset URL.
- Supabase MCP server: `tools/mcp-supabase/server.js` uses management API `POST /v1/projects/{ref}/database/query` with `SUPABASE_ACCESS_TOKEN` + `SUPABASE_PROJECT_REF` (+ optional `SUPABASE_DB_HOST`).


## Prompt Contracts (Strategy)

Student Strategy (`POST /api/jobs/strategy-student`)
- job_task_analysis[] item:
  - `task`: exact responsibility from posting (no paraphrase)
  - `task_explainer`: 1–2 sentence explainer of what doing this task means in this role/company
  - `compatibility_score`: 0–100, grounded by actual resume evidence
  - `user_alignment`: organic, specific alignment sentence; if none, say so explicitly
  - `user_evidence`: concrete project/experience names backing the alignment
  - `learning_paths`: `{ quick_wins: string[]; certifications: string[]; deepening: string[] }`

Rules (strict relevance)
- Never map unrelated evidence; only align when tech/domain/output truly overlap
- If no evidence exists, focus `learning_paths` on the fastest ways to close the gap

UI Consumption
- The one‑pager reads `task_explainer`, `user_alignment`, and `learning_paths` and merges learn chips with curated links (max 3).
- Chips on the Jobs list are server phrases only (no resume fragments), deduped by canonical keys.


## One‑Pager Strategy (Design/UX)

Principles
- One glance, no scroll; premium dashboard aesthetic (thin rules, subtle shadows)
- xl: 3 columns (two columns tasks + one evidence column)

Tasks
- Show `{task}` title, visual meter + `%`, `task_explainer` (line‑clamped), `user_alignment` or a single evidence line, and up to 3 learn chips.
- No per‑task CTAs; keep it clean.

Evidence
- Three premium blocks (Experience, Projects, Certifications); sanitized text; tooltips via `title` attribute.
- “relates: …” badges appear only for strong (>50%) overlap — never force a weak relation.

Hard Do/Don’t
- Do not render ATS keywords/interview/coursework on the one‑pager.
- Do not render resume tokens as skill chips; always show job phrases, deduped.
- Keep spacing/type scale consistent with global tokens.


## Supabase MCP (Operations)

Run: `node tools/mcp-supabase/server.js` with env `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF`.
- Tools: `list_tables`, `execute_sql`, `apply_migration`, `list_projects`.
- Diagnostics examples:
  - Latest resume structure (keys under `skills`), job skills counts, quick overlap probes; see `docs/dev-notes/matching-summary.md`.


## Acceptance Checklists

Matching
- Server-first overlap; chips are job phrases; canonical de‑duplication; no HTML in evidence strings.

One‑Pager
- Six tasks max with meters, `task_explainer`, organic `user_alignment`, and curated learn chips.
- Right column shows three blocks (Experience/Projects/Certifications) with hover micro‑interactions and strong‑only relations.
- No ATS/Interview/Coursework content appears on this page.

Auth & Security Settings
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (client)
- `SUPABASE_SERVICE_ROLE_KEY` (server-only, optional for dev auto-confirm)
- Recommend keeping email confirmation ON in production; use SMTP to deliver.


## Testing
- Playwright E2E in `tests/*.spec.ts`; uses configured dev port and starts app automatically.
- Test-data and prior test-results stored under `test-data/` and `test-results/`.

Coverage Focus (Risky Areas)
- Auth + Gating: Upload gating for anonymous users; redirect logic from `/login` on authenticated sessions; Tailor `RequireAuth` correctness.
- Tailor Editor Parity: Bullet synchronization (experience `achievements[]` ↔ `description`), Skills & Languages mapping; Certifications and Custom Sections serialization.
- Resume Preview API: Schema handling of dynamic skills categories; proficiency toggle; HTML generation per template.
- Job Fetching/Parsing: GPT prompt outputs integrity; clean arrays; translation rules (DE→EN enforcement); geocoding fallbacks.
- Matching Engines: Weighted components math; Jaccard/semantic/TF‑IDF logic; language/location rules.
- RLS Enforcement: Authenticated access to `resume_data`/`user_profiles`/results; session fallback behavior under RLS (only when intended).

Test Strategy and CI
- E2E (Playwright): exercise full flows as a user would.
  - Auth Flow: register (if dev auto-confirm enabled), login, logout; header reflects state; Upload gating visible only after login.
  - Resume Editor Flow: upload sample PDF, extract profile, edit bullets/skills/languages/certs/custom sections, generate preview, assert HTML snapshot.
  - Jobs Flow: fetch jobs, filter, open details, open Tailor; check badges and panels.
  - Tailor Flow: ensure Experience bullets render/edit line-by-line; Skills & Languages changes appear; AI suggestions bubble visible and functional.
  - API Smoke: `page.request.post` to `/api/resume/preview` with a small fixture payload; validate JSON shape and HTML length > threshold.
- Unit/Integration (optional layer with Vitest): pure functions (matchingService, semantic logic, utils) with deterministic fixtures; focus on weights/thresholds and translation helpers.
- Code Coverage: target 80%+ on core logic (matching services, prompt formatters, preview formatter) and smoke coverage on API endpoints via integration; rely on E2E coverage to validate cross-surface flows.
- CI (runner-agnostic): add npm scripts to run lint and Playwright; use environment-provided `NEXT_PUBLIC_*` and ephemeral test user credentials.
  - Suggested scripts:
    - `npm run test:e2e` → `playwright test --project=chromium`
    - `npm run test:ci` → `playwright test --reporter=line --project=chromium`
    - `npm run lint` → Next ESLint config
  - For hosted CI (e.g., GitHub Actions): install deps, cache playwright browsers, `npx playwright install --with-deps`, run tests headless.

Proposed E2E Specs
- `tests/auth.spec.ts`: login redirect if already authed; invalid creds messaging; logout clears session; (optional) register+auto-confirm path when service role is set.
- `tests/gating.spec.ts`: upload step gated for anonymous; unlocked after login; Tailor route redirects to login when not authed.
- `tests/editor.spec.ts`: simulate preloaded resumeData; edit experience bullets (add/remove), update skills/languages, add certs/custom section; preview reflects changes.
- `tests/jobs.spec.ts`: list renders cards; open details; open Tailor and ensure editor + preview visible.
- `tests/preview-api.spec.ts`: POST `/api/resume/preview` with small fixture; assert success JSON and HTML length.



## Security & RLS Notes
- Do not commit secrets. Keys are read from env; anon key is public but service role keys should never be committed.
- RLS is disabled for `resume_data` in development to avoid 406/500 during first-run; production should re-enable RLS and ensure `set_session_context()` is used before DML.
- AI cache and job analysis cache are permissive in development; add tighter policies for production.


## Known UX/Dev Conventions
- Dynamic GPT skill categories use the triple‑underscore key naming to map to human labels.
- German/English handling: universal translation to English for job content; language badges DE/EN; Werkstudent/Intern badges via title/type heuristics.
- Matching displays: show matched/missing, component scores, and explanations; weights surfaced via `weights` in calculation output.


## Operational Tips
- Dev server: `npm run dev` at `http://localhost:3000` (Playwright uses `3001`).
- Build/start: `npm run build` then `npm start`.
- Lint: `npm run lint`.
- Run MCP server call (example):
  - `SUPABASE_ACCESS_TOKEN=... SUPABASE_PROJECT_REF=... node tools/mcp-supabase/server.js <<<'{"id":1,"method":"list_tables"}'`


## Cross-References (in-repo docs)
- GPT Issues & Solutions: `GPT.md`
- GPT Pipeline Flow: `GPTFLOW.md`
- Job System: `JOBS_SYSTEM_DOCUMENTATION.md`
- Matching Plan: `JOB_MATCHING_PLAN.md`
- Skills Management: `SKILLS_MANAGEMENT.md`
- Templates: `TEMPLATE_DOCUMENTATION.md`
- Project Summary/Status: `PROJECT_SUMMARY.md`, `PROJECT_STATUS_REPORT.md`
- Agents & MCP: `AGENTS.md`, `.claude/*` and `tools/mcp-supabase/*`


## Summary
The system integrates a robust AI pipeline (structured prompts, schema‑validated outputs, caching, cost optimizations), a clear session‑based persistence model (resume_data + user_profiles), and multiple matching strategies. The UI/UX provides a professional, data‑dense experience with dynamic skill intelligence and comprehensive job/strategy content, backed by a typed Supabase schema and practical API boundaries for ingestion, analysis, and rendering.

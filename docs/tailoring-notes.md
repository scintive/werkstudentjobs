# Tailoring: Variants + Unified Analysis

This note documents the production implementation of the unified Strategy + Tailoring flow, database persistence, and how to verify it via MCP.

- Tables
  - Variants: `public.resume_variants`
    - Columns: `id uuid`, `base_resume_id uuid`, `job_id uuid`, `user_id uuid`, `session_id text`, `tailored_data jsonb`, `applied_suggestions text[]`, `ats_keywords text[]`, `match_score int`, `is_active bool`, `created_at`, `updated_at`
    - RLS: user policies and anonymous session via `app.session_id`
  - Suggestions: `public.resume_suggestions`
    - Atomic items linked to `variant_id` and `job_id` with acceptance/applied timestamps

- GPT Unification
  - Endpoint: `POST /api/jobs/analyze-with-tailoring`
  - Single call produces:
    - `strategy`: positioning, fit, gaps, talking points, ATS keywords
    - `tailored_resume`: complete resume JSON with all sections preserved
    - `atomic_suggestions`: reversible edits with rationale + ATS relevance
  - Saves suggestions to `resume_suggestions` and initializes/updates `resume_variants.tailored_data`

- Editor Flow
  - Tailored preview shows Baseline vs Tailored using real templates (`swiss`, `classic`, `professional`, `impact`) via `/api/resume/preview`.
  - Accept/Decline applies live and persists: updates `resume_suggestions.accepted` and `resume_variants.tailored_data`.
  - Open in Editor loads the tailored data into the single Resume Studio. Use the “Save Tailored Variant” button to persist editor changes back to `resume_variants.tailored_data` (baseline remains untouched).

- Feature Flag
  - `getConfig('FEATURES.ENABLE_TAILORING_UNIFIED')` (default: true). When set to false, the app renders the classic Resume Studio without the unified tailoring preview.

- MCP Verification
  - List tables: `node tools/supabase-admin.js list-tables`
  - Check variants: `select id, base_resume_id, job_id, session_id from public.resume_variants order by created_at desc limit 5`
  - Check suggestions: `select id, variant_id, section, suggestion_type, accepted from public.resume_suggestions order by created_at desc limit 10`

- Mapping Notes
  - `section` maps to resume block: `summary`, `experience`, `skills`, `education`, `projects`, `certifications`, `languages`
  - Experience `target_id` format: `exp_{index}_bullet_{index}`; applied to `experience[expIndex].achievements[bulIdx]`
  - Skills additions: category inferred from `target_id` or added to `Additional Skills`
  - Languages additions append to `languages`

- Migration
  - SQL file: `supabase/migrations/20250106_create_resume_variants.sql`
  - Apply via Supabase Management API (MCP):
    - `SUPABASE_ACCESS_TOKEN=... SUPABASE_PROJECT_REF=... node tools/supabase-admin.js apply-file supabase/migrations/20250106_create_resume_variants.sql`


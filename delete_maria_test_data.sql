-- Script to delete Maria's job analysis data and resume variants for testing
-- Run this in Supabase SQL Editor with write permissions

-- Maria's identifiers
-- User ID: 6162ad52-d991-4e0e-a023-af20a98ba289
-- Base Resume ID: 438c068e-e57e-48cf-9253-c94680a94e18

-- Step 1: Delete resume suggestions (must be first due to foreign key constraints)
DELETE FROM resume_suggestions
WHERE variant_id IN (
    SELECT id FROM resume_variants 
    WHERE base_resume_id = '438c068e-e57e-48cf-9253-c94680a94e18'
       OR user_id = '6162ad52-d991-4e0e-a023-af20a98ba289'
);

-- Step 2: Delete resume variants
DELETE FROM resume_variants
WHERE base_resume_id = '438c068e-e57e-48cf-9253-c94680a94e18'
   OR user_id = '6162ad52-d991-4e0e-a023-af20a98ba289';

-- Step 3: Delete job match results (if any)
DELETE FROM job_match_results
WHERE user_id = '6162ad52-d991-4e0e-a023-af20a98ba289';

-- Step 4: Delete AI cache entries related to Maria's analyses
DELETE FROM ai_cache
WHERE request_hash IN (
    SELECT request_hash FROM ai_cache
    WHERE request::text LIKE '%438c068e-e57e-48cf-9253-c94680a94e18%'
       OR request::text LIKE '%6162ad52-d991-4e0e-a023-af20a98ba289%'
       OR request::text LIKE '%sawicka.maria.2000@gmail.com%'
);

-- Verification: Check what was deleted
SELECT 
    'Data deletion complete for Maria Sawicka' as status,
    'User ID: 6162ad52-d991-4e0e-a023-af20a98ba289' as user_info,
    'Resume ID: 438c068e-e57e-48cf-9253-c94680a94e18' as resume_info;

-- To verify deletion, run these queries:
-- SELECT COUNT(*) as variant_count FROM resume_variants WHERE user_id = '6162ad52-d991-4e0e-a023-af20a98ba289';
-- SELECT COUNT(*) as suggestion_count FROM resume_suggestions WHERE variant_id IN (SELECT id FROM resume_variants WHERE user_id = '6162ad52-d991-4e0e-a023-af20a98ba289');
-- Migration 16: Add performance indexes for job search and filtering
-- Created: 2025-10-17
-- Purpose: Optimize search queries, filtering, and sorting performance

-- Jobs table indexes
CREATE INDEX IF NOT EXISTS idx_jobs_is_active ON jobs(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_jobs_created_at_desc ON jobs(created_at DESC) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_jobs_posted_at_desc ON jobs(posted_at DESC NULLS LAST) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_jobs_work_mode ON jobs(work_mode) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_jobs_city ON jobs(city) WHERE is_active = true AND city IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_jobs_country ON jobs(country) WHERE is_active = true AND country IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_jobs_is_werkstudent ON jobs(is_werkstudent) WHERE is_active = true AND is_werkstudent = true;
CREATE INDEX IF NOT EXISTS idx_jobs_german_required ON jobs(german_required) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_jobs_company_id ON jobs(company_id) WHERE is_active = true;

-- Text search indexes for faster ILIKE queries
CREATE INDEX IF NOT EXISTS idx_jobs_title_trgm ON jobs USING gin(title gin_trgm_ops) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_jobs_description_trgm ON jobs USING gin(description gin_trgm_ops) WHERE is_active = true;

-- Geospatial index for location-based queries
CREATE INDEX IF NOT EXISTS idx_jobs_location_geo ON jobs(latitude, longitude) WHERE is_active = true AND latitude IS NOT NULL AND longitude IS NOT NULL;

-- Companies table indexes
CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(name);
CREATE INDEX IF NOT EXISTS idx_companies_updated_at ON companies(updated_at DESC);

-- Resume variants indexes (for tailored jobs lookup)
CREATE INDEX IF NOT EXISTS idx_resume_variants_job_id ON resume_variants(job_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_resume_variants_user_id ON resume_variants(user_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_resume_variants_created_at ON resume_variants(created_at DESC) WHERE is_active = true;

-- Comment explaining the indexes
COMMENT ON INDEX idx_jobs_is_active IS 'Speeds up filtering for active jobs only';
COMMENT ON INDEX idx_jobs_created_at_desc IS 'Optimizes sorting by newest jobs first (default sort)';
COMMENT ON INDEX idx_jobs_posted_at_desc IS 'Optimizes sorting by posted date';
COMMENT ON INDEX idx_jobs_title_trgm IS 'Enables fast fuzzy text search on job titles using trigram matching';
COMMENT ON INDEX idx_jobs_description_trgm IS 'Enables fast fuzzy text search on descriptions using trigram matching';
COMMENT ON INDEX idx_jobs_location_geo IS 'Speeds up geospatial queries for distance-based job search';

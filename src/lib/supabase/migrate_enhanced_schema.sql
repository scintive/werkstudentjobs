-- Migration to add enhanced research fields to existing companies table
-- Add new columns to companies table
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS website_url TEXT,
ADD COLUMN IF NOT EXISTS founded_year INTEGER,
ADD COLUMN IF NOT EXISTS careers_page_url TEXT,
ADD COLUMN IF NOT EXISTS headquarters_location TEXT,
ADD COLUMN IF NOT EXISTS office_locations TEXT[],
ADD COLUMN IF NOT EXISTS industry_sector TEXT,
ADD COLUMN IF NOT EXISTS business_model TEXT,
ADD COLUMN IF NOT EXISTS key_products_services TEXT[],
ADD COLUMN IF NOT EXISTS company_size_category TEXT CHECK (company_size_category IN ('startup', 'small', 'medium', 'large', 'enterprise')),
ADD COLUMN IF NOT EXISTS funding_status TEXT,
ADD COLUMN IF NOT EXISTS notable_investors TEXT[],
ADD COLUMN IF NOT EXISTS leadership_team TEXT[],
ADD COLUMN IF NOT EXISTS company_values TEXT[],
ADD COLUMN IF NOT EXISTS culture_highlights TEXT[],
ADD COLUMN IF NOT EXISTS glassdoor_rating DECIMAL(2,1),
ADD COLUMN IF NOT EXISTS employee_reviews_summary TEXT,
ADD COLUMN IF NOT EXISTS competitors TEXT[],
ADD COLUMN IF NOT EXISTS remote_work_policy TEXT,
ADD COLUMN IF NOT EXISTS diversity_initiatives TEXT[],
ADD COLUMN IF NOT EXISTS awards_recognition TEXT[],
ADD COLUMN IF NOT EXISTS recent_news TEXT[],
ADD COLUMN IF NOT EXISTS research_last_updated TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS research_confidence TEXT CHECK (research_confidence IN ('high', 'medium', 'low')),
ADD COLUMN IF NOT EXISTS research_source TEXT DEFAULT 'gpt_analysis';

-- Rename website to website_url if needed (compatibility)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'website') THEN
        UPDATE companies SET website_url = website WHERE website IS NOT NULL AND website_url IS NULL;
    END IF;
END $$;

-- Add enhanced research fields to jobs table
ALTER TABLE jobs
ADD COLUMN IF NOT EXISTS hiring_manager TEXT,
ADD COLUMN IF NOT EXISTS job_market_analysis JSONB,
ADD COLUMN IF NOT EXISTS additional_insights TEXT[],
ADD COLUMN IF NOT EXISTS research_confidence TEXT CHECK (research_confidence IN ('high', 'medium', 'low')),
ADD COLUMN IF NOT EXISTS research_last_updated TIMESTAMP WITH TIME ZONE;

-- Add compatibility aliases for jobs
ALTER TABLE jobs 
ADD COLUMN IF NOT EXISTS application_link TEXT,
ADD COLUMN IF NOT EXISTS job_description_link TEXT,
ADD COLUMN IF NOT EXISTS portal_link TEXT,
ADD COLUMN IF NOT EXISTS portal TEXT,
ADD COLUMN IF NOT EXISTS salary_min INTEGER,
ADD COLUMN IF NOT EXISTS salary_max INTEGER,
ADD COLUMN IF NOT EXISTS werkstudent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS country TEXT,
ADD COLUMN IF NOT EXISTS location_raw TEXT,
ADD COLUMN IF NOT EXISTS is_remote BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS named_skills_tools TEXT[],
ADD COLUMN IF NOT EXISTS important_statements TEXT[],
ADD COLUMN IF NOT EXISTS user_saved BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS user_applied BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS user_notes TEXT,
ADD COLUMN IF NOT EXISTS match_score DECIMAL(3,2);

-- Update constraints
ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_german_required_check;
ALTER TABLE jobs ADD CONSTRAINT jobs_german_required_check 
  CHECK (german_required IN ('DE', 'EN', 'both', 'unknown'));

ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_work_mode_check;
ALTER TABLE jobs ADD CONSTRAINT jobs_work_mode_check 
  CHECK (work_mode IN ('Remote', 'Hybrid', 'Onsite', 'Unknown'));

-- Create unique index for company names
CREATE UNIQUE INDEX IF NOT EXISTS idx_companies_name_unique ON companies(name);

-- Add update trigger for companies
CREATE TRIGGER update_companies_updated_at 
BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
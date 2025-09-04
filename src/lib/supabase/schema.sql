-- =====================================================
-- MULTI-USER JOB MATCHING SYSTEM - DATABASE SCHEMA
-- Auth-Ready Architecture for Supabase
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- =====================================================
-- 1. COMPANIES TABLE (Global - shared across all users)
-- Enhanced with GPT Research Data
-- =====================================================
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  external_id TEXT UNIQUE, -- LinkedIn company ID, etc.
  name TEXT NOT NULL,
  logo_url TEXT,
  website_url TEXT,
  linkedin_url TEXT,
  description TEXT,
  slogan TEXT,
  employee_count INTEGER,
  industry TEXT,
  location TEXT,
  
  -- Enhanced Company Research Data
  founded_year INTEGER,
  careers_page_url TEXT,
  headquarters_location TEXT,
  office_locations TEXT[], -- Array of office locations
  industry_sector TEXT,
  business_model TEXT,
  key_products_services TEXT[], -- Array of main products/services
  company_size_category TEXT CHECK (company_size_category IN ('startup', 'small', 'medium', 'large', 'enterprise')),
  funding_status TEXT,
  notable_investors TEXT[],
  leadership_team TEXT[], -- Array of key leaders
  company_values TEXT[], -- Array of company values
  culture_highlights TEXT[], -- Array of culture points
  glassdoor_rating DECIMAL(2,1), -- e.g., 4.2
  employee_reviews_summary TEXT,
  competitors TEXT[],
  remote_work_policy TEXT,
  diversity_initiatives TEXT[],
  awards_recognition TEXT[],
  recent_news TEXT[], -- Array of recent news/updates
  
  -- Research Metadata
  research_last_updated TIMESTAMP WITH TIME ZONE,
  research_confidence TEXT CHECK (research_confidence IN ('high', 'medium', 'low')),
  research_source TEXT DEFAULT 'gpt_analysis',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. JOBS TABLE (Global - shared, but with user-specific analysis)
-- Enhanced with GPT Research Data
-- =====================================================
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  external_id TEXT UNIQUE, -- LinkedIn job ID, Apify job ID, etc.
  
  -- Basic Job Info
  title TEXT NOT NULL,
  description TEXT, -- Original job description text
  description_html TEXT,
  description_text TEXT,
  location_city TEXT,
  location_country TEXT,
  location_full TEXT,
  work_mode TEXT CHECK (work_mode IN ('Remote', 'Hybrid', 'Onsite', 'Unknown')) DEFAULT 'Unknown',
  employment_type TEXT,
  seniority_level TEXT,
  salary_info TEXT,
  salary_min INTEGER, -- Minimum salary
  salary_max INTEGER, -- Maximum salary
  posted_at TIMESTAMP WITH TIME ZONE,
  application_link TEXT, -- Direct application URL
  job_description_link TEXT, -- Link to full job description
  portal_link TEXT, -- Portal where job was found
  portal TEXT, -- Name of the portal (LinkedIn, Xing, etc.)
  linkedin_url TEXT,
  job_function TEXT,
  industries TEXT[],
  applicants_count INTEGER DEFAULT 0,
  is_werkstudent BOOLEAN DEFAULT FALSE,
  werkstudent BOOLEAN DEFAULT FALSE, -- Alias for compatibility
  
  -- Language Requirements (Updated constraints)
  german_required TEXT CHECK (german_required IN ('DE', 'EN', 'both', 'unknown')) DEFAULT 'unknown',
  language_required TEXT CHECK (language_required IN ('DE', 'EN', 'BOTH', 'UNKNOWN')) DEFAULT 'UNKNOWN',
  content_language TEXT CHECK (content_language IN ('DE', 'EN', 'unknown')) DEFAULT 'unknown',
  
  -- Location Preferences
  city TEXT, -- Normalized city name
  country TEXT, -- Normalized country name
  location_raw TEXT, -- Original location string
  is_remote BOOLEAN DEFAULT FALSE,
  remote_allowed BOOLEAN DEFAULT FALSE,
  hybrid_allowed BOOLEAN DEFAULT FALSE,
  onsite_required BOOLEAN DEFAULT FALSE,
  
  -- GPT Extracted Content (Multilingual)
  skills_original TEXT[], -- Skills as extracted from original language
  tools_original TEXT[], -- Tools as extracted from original language
  responsibilities_original TEXT[], -- Tasks/responsibilities from original language
  nice_to_have_original TEXT[], -- Nice-to-have from original language
  benefits_original TEXT[], -- Benefits from original language
  named_skills_tools TEXT[], -- Skills and tools identified by GPT
  important_statements TEXT[], -- Key statements from the job posting
  
  -- Canonical Fields (For Matching)
  skills_canonical TEXT[],
  tools_canonical TEXT[],
  responsibilities_canonical TEXT[],
  nice_to_have_canonical TEXT[],
  benefits_canonical TEXT[],
  application_requirements_original TEXT[], -- Application requirements from original language
  skills_canonical_flat TEXT[],
  tools_canonical_flat TEXT[],
  
  -- Enhanced Job Research Data
  hiring_manager TEXT, -- Hiring manager name if found
  job_market_analysis JSONB, -- Market analysis data
  additional_insights TEXT[], -- Additional insights from research
  
  -- Research and Quality Metadata
  research_confidence TEXT CHECK (research_confidence IN ('high', 'medium', 'low')),
  source_quality_score DECIMAL(3,2), -- Quality score 0.0-1.0
  research_last_updated TIMESTAMP WITH TIME ZONE,
  
  -- User Interaction Fields
  user_saved BOOLEAN DEFAULT FALSE,
  user_applied BOOLEAN DEFAULT FALSE,
  user_notes TEXT,
  match_score DECIMAL(3,2), -- User-specific match score
  
  -- Admin fields
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. USER PROFILES TABLE (User-specific data)
-- =====================================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- Will link to Supabase Auth later
  
  -- For now, we'll use session-based identification until auth is implemented
  session_id TEXT, -- Temporary identifier for non-authenticated users
  
  -- Profile Data (JSON for flexibility)
  profile_data JSONB NOT NULL,
  
  -- Normalized/Cached Fields for Matching Performance
  skills_canonical TEXT[],
  tools_canonical TEXT[],
  languages JSONB, -- [{"language": "German", "level": "B2"}, ...]
  city TEXT,
  willing_remote BOOLEAN DEFAULT TRUE,
  willing_hybrid BOOLEAN DEFAULT TRUE,
  education_level TEXT,
  years_experience INTEGER,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure we have either user_id OR session_id (but not both for now)
  CONSTRAINT user_or_session_check CHECK (
    (user_id IS NOT NULL AND session_id IS NULL) OR 
    (user_id IS NULL AND session_id IS NOT NULL)
  )
);

-- =====================================================
-- 4. JOB MATCH RESULTS (User-specific matching results)
-- =====================================================
CREATE TABLE IF NOT EXISTS job_match_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_profile_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  
  -- Match Scores (0-100)
  match_score INTEGER NOT NULL CHECK (match_score >= 0 AND match_score <= 100),
  skills_overlap_score NUMERIC(5,4) NOT NULL CHECK (skills_overlap_score >= 0 AND skills_overlap_score <= 1),
  tools_overlap_score NUMERIC(5,4) NOT NULL CHECK (tools_overlap_score >= 0 AND tools_overlap_score <= 1),
  language_fit_score NUMERIC(5,4) NOT NULL CHECK (language_fit_score >= 0 AND language_fit_score <= 1),
  location_fit_score NUMERIC(5,4) NOT NULL CHECK (location_fit_score >= 0 AND location_fit_score <= 1),
  
  -- Detailed Explanations
  skills_matched TEXT[],
  skills_missing TEXT[],
  tools_matched TEXT[],
  tools_missing TEXT[],
  language_explanation TEXT,
  location_explanation TEXT,
  overall_explanation TEXT,
  
  -- Algorithm Metadata
  calculation_weights JSONB, -- {"skills": 0.55, "tools": 0.20, ...}
  algorithm_version TEXT DEFAULT 'weighted-jaccard-v1',
  
  -- Performance tracking
  calculation_time_ms INTEGER,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique match result per user-job combination
  UNIQUE(user_profile_id, job_id)
);

-- =====================================================
-- 5. JOB REQUIREMENTS (Structured requirements)
-- =====================================================
CREATE TABLE IF NOT EXISTS job_requirements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  requirement_type TEXT CHECK (requirement_type IN ('must_have', 'nice_to_have', 'benefit')) NOT NULL,
  requirement_text TEXT NOT NULL,
  requirement_english TEXT, -- Translated version if original is German
  importance_weight NUMERIC(3,2) DEFAULT 1.0 CHECK (importance_weight >= 0 AND importance_weight <= 1),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 6. JOB SKILLS (Structured skills from jobs)
-- =====================================================
CREATE TABLE IF NOT EXISTS job_skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  skill_name TEXT NOT NULL,
  skill_category TEXT,
  skill_canonical TEXT, -- Normalized version for matching
  importance_level INTEGER DEFAULT 5 CHECK (importance_level >= 1 AND importance_level <= 10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 7. USER JOB INTERACTIONS (User behavior tracking)
-- =====================================================
CREATE TABLE IF NOT EXISTS user_job_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_profile_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  interaction_type TEXT CHECK (interaction_type IN ('viewed', 'saved', 'applied', 'rejected', 'shared')) NOT NULL,
  interaction_data JSONB, -- Additional context like time spent, source, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Companies
CREATE INDEX IF NOT EXISTS companies_external_id_idx ON companies(external_id);
CREATE INDEX IF NOT EXISTS companies_industry_idx ON companies(industry);
CREATE UNIQUE INDEX IF NOT EXISTS idx_companies_name_unique ON companies(name);

-- Jobs
CREATE INDEX IF NOT EXISTS jobs_external_id_idx ON jobs(external_id);
CREATE INDEX IF NOT EXISTS jobs_company_id_idx ON jobs(company_id);
CREATE INDEX IF NOT EXISTS jobs_location_city_idx ON jobs(location_city);
CREATE INDEX IF NOT EXISTS jobs_work_mode_idx ON jobs(work_mode);
CREATE INDEX IF NOT EXISTS jobs_is_werkstudent_idx ON jobs(is_werkstudent);
CREATE INDEX IF NOT EXISTS jobs_posted_at_idx ON jobs(posted_at DESC);
CREATE INDEX IF NOT EXISTS jobs_is_active_idx ON jobs(is_active);
CREATE INDEX IF NOT EXISTS jobs_skills_canonical_flat_idx ON jobs USING GIN(skills_canonical_flat);

-- User Profiles
CREATE INDEX IF NOT EXISTS user_profiles_user_id_idx ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS user_profiles_session_id_idx ON user_profiles(session_id);
CREATE INDEX IF NOT EXISTS user_profiles_city_idx ON user_profiles(city);
CREATE INDEX IF NOT EXISTS user_profiles_skills_idx ON user_profiles USING GIN(skills_canonical);

-- Job Match Results
CREATE INDEX IF NOT EXISTS job_match_results_user_profile_id_idx ON job_match_results(user_profile_id);
CREATE INDEX IF NOT EXISTS job_match_results_job_id_idx ON job_match_results(job_id);
CREATE INDEX IF NOT EXISTS job_match_results_match_score_idx ON job_match_results(match_score DESC);
CREATE INDEX IF NOT EXISTS job_match_results_created_at_idx ON job_match_results(created_at DESC);

-- Job Requirements
CREATE INDEX IF NOT EXISTS job_requirements_job_id_idx ON job_requirements(job_id);
CREATE INDEX IF NOT EXISTS job_requirements_type_idx ON job_requirements(requirement_type);

-- Job Skills
CREATE INDEX IF NOT EXISTS job_skills_job_id_idx ON job_skills(job_id);
CREATE INDEX IF NOT EXISTS job_skills_skill_name_idx ON job_skills(skill_name);
CREATE INDEX IF NOT EXISTS job_skills_canonical_idx ON job_skills(skill_canonical);

-- User Job Interactions
CREATE INDEX IF NOT EXISTS user_job_interactions_user_profile_id_idx ON user_job_interactions(user_profile_id);
CREATE INDEX IF NOT EXISTS user_job_interactions_job_id_idx ON user_job_interactions(job_id);
CREATE INDEX IF NOT EXISTS user_job_interactions_type_idx ON user_job_interactions(interaction_type);
CREATE INDEX IF NOT EXISTS user_job_interactions_created_at_idx ON user_job_interactions(created_at DESC);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Ready for authentication but disabled initially
-- =====================================================

-- Enable RLS on user-specific tables (but don't activate policies yet)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_match_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_job_interactions ENABLE ROW LEVEL SECURITY;

-- Companies and Jobs are global (no RLS needed initially)
-- We can add admin-only policies later if needed

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_job_match_results_updated_at BEFORE UPDATE ON job_match_results FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SAMPLE DATA TYPES FOR REFERENCE
-- =====================================================

-- Example user_profiles.profile_data structure:
-- {
--   "personal_details": {
--     "name": "John Doe",
--     "email": "john@example.com",
--     "phone": "+49123456789",
--     "city": "Berlin"
--   },
--   "skills": {
--     "technical": ["JavaScript", "React", "Python"],
--     "soft_skills": ["Communication", "Leadership"],
--     "tools": ["Git", "Docker", "AWS"]
--   },
--   "experience": [...],
--   "education": [...],
--   "languages": [
--     {"language": "German", "level": "B2"},
--     {"language": "English", "level": "C1"}
--   ]
-- }

-- Example job_match_results.calculation_weights:
-- {"skills": 0.55, "tools": 0.20, "language": 0.15, "location": 0.10}

-- =====================================================
-- READY FOR AUTH MIGRATION
-- =====================================================

-- When ready to add authentication:
-- 1. Update user_profiles to require user_id (remove session_id)
-- 2. Add RLS policies for user data access
-- 3. Add user management functions
-- 4. Update frontend to use auth context

-- Example future RLS policy:
-- CREATE POLICY "Users can only access their own profile data" 
--   ON user_profiles FOR ALL 
--   USING (auth.uid() = user_id);

COMMIT;
-- Create resume_variants table for storing job-specific tailored resumes
CREATE TABLE IF NOT EXISTS resume_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  base_resume_id UUID REFERENCES resume_data(id) ON DELETE CASCADE,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT,
  variant_name TEXT,
  tailored_data JSONB NOT NULL, -- Complete tailored resume JSON
  applied_suggestions TEXT[], -- Array of applied suggestion IDs
  ats_keywords TEXT[],
  match_score INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(base_resume_id, job_id) -- One variant per job per base resume
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_resume_variants_user ON resume_variants(user_id);
CREATE INDEX IF NOT EXISTS idx_resume_variants_session ON resume_variants(session_id);
CREATE INDEX IF NOT EXISTS idx_resume_variants_job ON resume_variants(job_id);
CREATE INDEX IF NOT EXISTS idx_resume_variants_base ON resume_variants(base_resume_id);

-- Create resume_suggestions table for atomic suggestions
CREATE TABLE IF NOT EXISTS resume_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id UUID REFERENCES resume_variants(id) ON DELETE CASCADE,
  job_id UUID REFERENCES jobs(id),
  section TEXT CHECK (section IN ('summary', 'experience', 'skills', 'education', 'projects', 'certifications', 'languages', 'custom')),
  suggestion_type TEXT CHECK (suggestion_type IN ('text', 'bullet', 'skill_addition', 'skill_removal', 'reorder', 'language_addition')),
  target_id TEXT, -- Identifies specific item (e.g., exp_0_bullet_1)
  original_content TEXT,
  suggested_content TEXT,
  rationale TEXT,
  ats_relevance TEXT,
  keywords TEXT[],
  confidence INTEGER CHECK (confidence >= 0 AND confidence <= 100),
  impact TEXT CHECK (impact IN ('high', 'medium', 'low')),
  accepted BOOLEAN DEFAULT NULL,
  applied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_resume_suggestions_variant ON resume_suggestions(variant_id);
CREATE INDEX IF NOT EXISTS idx_resume_suggestions_job ON resume_suggestions(job_id);
CREATE INDEX IF NOT EXISTS idx_resume_suggestions_accepted ON resume_suggestions(accepted);

-- Add RLS policies for resume_variants
ALTER TABLE resume_variants ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can manage their own resume variants" ON resume_variants;
DROP POLICY IF EXISTS "Session users can manage their resume variants" ON resume_variants;

-- Policy for users to manage their own variants
CREATE POLICY "Users can manage their own resume variants" ON resume_variants
  FOR ALL
  USING (
    auth.uid() = user_id OR
    session_id = current_setting('app.session_id', true)
  );

-- Policy for anonymous users with session
CREATE POLICY "Session users can manage their resume variants" ON resume_variants
  FOR ALL
  USING (
    session_id IS NOT NULL AND 
    session_id = current_setting('app.session_id', true)
  );

-- Add RLS for suggestions
ALTER TABLE resume_suggestions ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can manage suggestions for their variants" ON resume_suggestions;

-- Policy for suggestions access
CREATE POLICY "Users can manage suggestions for their variants" ON resume_suggestions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM resume_variants rv
      WHERE rv.id = resume_suggestions.variant_id
      AND (rv.user_id = auth.uid() OR rv.session_id = current_setting('app.session_id', true))
    )
  );

-- Add update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_resume_variants_updated_at
  BEFORE UPDATE ON resume_variants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
-- Add job_analysis field to resume_variants
-- This stores the full intelligent job analysis result from GPT-4o-mini

ALTER TABLE public.resume_variants
ADD COLUMN IF NOT EXISTS job_analysis jsonb;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_resume_variants_job_analysis
ON public.resume_variants USING gin(job_analysis);

-- Add comment explaining the column
COMMENT ON COLUMN public.resume_variants.job_analysis IS 'Intelligent job analysis from GPT-4o-mini, includes responsibility breakdown, experience relevance, skills analysis, and positioning strategy';

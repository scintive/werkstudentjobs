-- Add languages column to resume_data table
ALTER TABLE public.resume_data
ADD COLUMN IF NOT EXISTS languages jsonb DEFAULT '[]'::jsonb;

-- Update existing records to move languages from skills to the new column
UPDATE public.resume_data
SET languages = COALESCE(skills->'languages', '[]'::jsonb)
WHERE skills->'languages' IS NOT NULL;

-- Remove languages from skills object
UPDATE public.resume_data
SET skills = skills - 'languages'
WHERE skills ? 'languages';

-- Add comment for clarity
COMMENT ON COLUMN public.resume_data.languages IS 'Array of language objects with name/language and proficiency/level fields';
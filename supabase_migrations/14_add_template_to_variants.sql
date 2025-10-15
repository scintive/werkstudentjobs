-- Add template column to resume_variants to store the selected template
ALTER TABLE public.resume_variants
ADD COLUMN IF NOT EXISTS template TEXT DEFAULT 'swiss';

-- Create index for faster template lookups
CREATE INDEX IF NOT EXISTS idx_resume_variants_template
ON public.resume_variants(template);

-- Add comment explaining the column
COMMENT ON COLUMN public.resume_variants.template IS 'Template used for rendering this variant (swiss, classic, professional, impact)';


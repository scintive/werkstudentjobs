-- Migration: Create share_tokens table for public resume/cover letter sharing
-- This enables users to generate shareable public links for their documents

-- Create share_tokens table
CREATE TABLE IF NOT EXISTS public.share_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT UNIQUE NOT NULL,
  user_id UUID NOT NULL,

  -- What is being shared
  share_type TEXT NOT NULL CHECK (share_type IN ('resume', 'cover_letter')),

  -- Reference to the document
  resume_id UUID REFERENCES public.resume_data(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES public.resume_variants(id) ON DELETE CASCADE,

  -- Metadata
  template TEXT, -- Template to use for rendering
  expires_at TIMESTAMP WITH TIME ZONE,
  view_count INTEGER DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for fast token lookups (most common query)
CREATE INDEX IF NOT EXISTS idx_share_tokens_token ON public.share_tokens(token);

-- Create index for user lookups
CREATE INDEX IF NOT EXISTS idx_share_tokens_user_id ON public.share_tokens(user_id);

-- Enable RLS
ALTER TABLE public.share_tokens ENABLE ROW LEVEL SECURITY;

-- Policy: Users can create share tokens for their own documents
CREATE POLICY "Users can create their own share tokens"
  ON public.share_tokens
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can view their own share tokens
CREATE POLICY "Users can view their own share tokens"
  ON public.share_tokens
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can update their own share tokens
CREATE POLICY "Users can update their own share tokens"
  ON public.share_tokens
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own share tokens
CREATE POLICY "Users can delete their own share tokens"
  ON public.share_tokens
  FOR DELETE
  USING (auth.uid() = user_id);

-- Function to increment view count (bypasses RLS for public access)
CREATE OR REPLACE FUNCTION public.increment_share_view_count(p_token TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.share_tokens
  SET
    view_count = view_count + 1,
    updated_at = NOW()
  WHERE token = p_token
    AND (expires_at IS NULL OR expires_at > NOW());
END;
$$;

-- Function to get shared document data (bypasses RLS for public access)
CREATE OR REPLACE FUNCTION public.get_shared_document(p_token TEXT)
RETURNS TABLE (
  share_type TEXT,
  template TEXT,
  resume_data JSONB,
  variant_data JSONB,
  is_expired BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    st.share_type,
    st.template,
    CASE
      WHEN st.resume_id IS NOT NULL THEN row_to_json(rd.*)::jsonb
      ELSE NULL
    END as resume_data,
    CASE
      WHEN st.variant_id IS NOT NULL THEN row_to_json(rv.*)::jsonb
      ELSE NULL
    END as variant_data,
    (st.expires_at IS NOT NULL AND st.expires_at < NOW()) as is_expired
  FROM public.share_tokens st
  LEFT JOIN public.resume_data rd ON st.resume_id = rd.id
  LEFT JOIN public.resume_variants rv ON st.variant_id = rv.id
  WHERE st.token = p_token;
END;
$$;

-- Add comment
COMMENT ON TABLE public.share_tokens IS 'Stores shareable public links for resumes and cover letters';

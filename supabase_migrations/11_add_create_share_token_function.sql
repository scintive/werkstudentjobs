-- Migration: Add function to create share tokens (bypasses RLS)
-- This allows cookie-based authenticated users to create share tokens

CREATE OR REPLACE FUNCTION public.create_share_token(
  p_token TEXT,
  p_user_id UUID,
  p_share_type TEXT,
  p_resume_id UUID DEFAULT NULL,
  p_variant_id UUID DEFAULT NULL,
  p_template TEXT DEFAULT NULL,
  p_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  token TEXT,
  user_id UUID,
  share_type TEXT,
  resume_id UUID,
  variant_id UUID,
  template TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  view_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  INSERT INTO public.share_tokens (
    token,
    user_id,
    share_type,
    resume_id,
    variant_id,
    template,
    expires_at
  )
  VALUES (
    p_token,
    p_user_id,
    p_share_type,
    p_resume_id,
    p_variant_id,
    p_template,
    p_expires_at
  )
  RETURNING *;
END;
$$;

-- Add comment
COMMENT ON FUNCTION public.create_share_token IS 'Creates a share token for a user (bypasses RLS for cookie-based auth)';

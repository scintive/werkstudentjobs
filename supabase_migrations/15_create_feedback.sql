-- Create feedback table
CREATE TABLE IF NOT EXISTS public.feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT,
  name TEXT,
  type TEXT CHECK (type IN ('bug', 'feature', 'improvement', 'other')) DEFAULT 'other',
  message TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  page_url TEXT,
  user_agent TEXT,
  status TEXT CHECK (status IN ('new', 'in_progress', 'resolved', 'closed')) DEFAULT 'new',
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_feedback_user_id ON public.feedback(user_id);
CREATE INDEX idx_feedback_status ON public.feedback(status);
CREATE INDEX idx_feedback_created_at ON public.feedback(created_at DESC);
CREATE INDEX idx_feedback_type ON public.feedback(type);

-- Enable RLS
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert their own feedback (or anonymous)
CREATE POLICY "Users can submit feedback"
ON public.feedback
FOR INSERT
TO authenticated, anon
WITH CHECK (true);

-- Policy: Users can view their own feedback
CREATE POLICY "Users can view own feedback"
ON public.feedback
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy: Admin can view all feedback
CREATE POLICY "Admin can view all feedback"
ON public.feedback
FOR SELECT
TO authenticated
USING (
  auth.jwt() ->> 'email' = 'varunmisra@gmail.com'
);

-- Policy: Admin can update feedback
CREATE POLICY "Admin can update feedback"
ON public.feedback
FOR UPDATE
TO authenticated
USING (
  auth.jwt() ->> 'email' = 'varunmisra@gmail.com'
)
WITH CHECK (
  auth.jwt() ->> 'email' = 'varunmisra@gmail.com'
);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_feedback_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER feedback_updated_at
BEFORE UPDATE ON public.feedback
FOR EACH ROW
EXECUTE FUNCTION update_feedback_updated_at();

-- Add comment
COMMENT ON TABLE public.feedback IS 'User feedback and bug reports';


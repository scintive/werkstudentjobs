-- Add onboarding and photo fields to user_profiles table
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS photo_url TEXT,
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS hours_available INTEGER,
ADD COLUMN IF NOT EXISTS current_semester INTEGER,
ADD COLUMN IF NOT EXISTS start_preference TEXT, -- 'immediately', 'within_month', 'within_3_months', 'flexible'
ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMP WITH TIME ZONE;

-- Add photo_url to resume_data table for per-resume photos
ALTER TABLE resume_data
ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Create storage bucket for profile photos (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-photos', 'profile-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for profile photos
CREATE POLICY "Users can upload their own photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'profile-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'profile-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'profile-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Anyone can view profile photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-photos');

-- Add comment for documentation
COMMENT ON COLUMN user_profiles.photo_url IS 'URL to user profile photo stored in Supabase Storage';
COMMENT ON COLUMN user_profiles.hours_available IS 'Hours per week available for work';
COMMENT ON COLUMN user_profiles.current_semester IS 'Current semester number in their studies';
COMMENT ON COLUMN user_profiles.start_preference IS 'When they would like to start: immediately, within_month, within_3_months, flexible';
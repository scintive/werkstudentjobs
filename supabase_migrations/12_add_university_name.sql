-- Add university_name field to user_profiles table for onboarding
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS university_name TEXT;

-- Add comment for documentation
COMMENT ON COLUMN user_profiles.university_name IS 'Name of the university the user is enrolled in';

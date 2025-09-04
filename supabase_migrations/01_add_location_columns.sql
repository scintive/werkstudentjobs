-- Add geography columns for enhanced location matching
-- Run this in Supabase SQL Editor

-- 1. Enable PostGIS extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Add location columns to users table (assuming you have one)
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS location_coordinates geography(Point, 4326);
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS location_city TEXT;
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS location_display_name TEXT;
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS location_country_code TEXT;
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS geocoded_at TIMESTAMPTZ;

-- 3. Add location columns to jobs table
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS location_coordinates geography(Point, 4326);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS location_display_name TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS location_country_code TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS geocoded_at TIMESTAMPTZ;

-- 4. Create indexes for fast spatial queries
CREATE INDEX IF NOT EXISTS idx_users_location_coordinates ON auth.users USING GIST (location_coordinates);
CREATE INDEX IF NOT EXISTS idx_jobs_location_coordinates ON jobs USING GIST (location_coordinates);

-- 5. Create function to calculate distance in kilometers
CREATE OR REPLACE FUNCTION calculate_distance_km(point1 geography, point2 geography)
RETURNS DECIMAL(8,2)
LANGUAGE SQL
IMMUTABLE
AS $$
  SELECT ST_Distance(point1, point2) / 1000.0;
$$;

-- 6. Create function to find jobs within radius
CREATE OR REPLACE FUNCTION find_jobs_within_radius(
  user_location geography,
  radius_km INTEGER DEFAULT 50
)
RETURNS TABLE (
  job_id TEXT,
  distance_km DECIMAL(8,2)
)
LANGUAGE SQL
STABLE
AS $$
  SELECT 
    id::TEXT as job_id,
    calculate_distance_km(user_location, location_coordinates) as distance_km
  FROM jobs
  WHERE location_coordinates IS NOT NULL
    AND ST_DWithin(user_location, location_coordinates, radius_km * 1000)
  ORDER BY distance_km;
$$;

-- 7. Create function to get location compatibility score
CREATE OR REPLACE FUNCTION get_location_score(distance_km DECIMAL)
RETURNS DECIMAL(3,2)
LANGUAGE SQL
IMMUTABLE
AS $$
  SELECT 
    CASE 
      WHEN distance_km <= 5 THEN 1.0
      WHEN distance_km <= 20 THEN 0.9
      WHEN distance_km <= 50 THEN 0.7
      WHEN distance_km <= 100 THEN 0.5
      WHEN distance_km <= 200 THEN 0.3
      ELSE 0.1
    END;
$$;
-- Enable pg_trgm extension for fuzzy text search
-- This must be run before creating trigram indexes

CREATE EXTENSION IF NOT EXISTS pg_trgm;

COMMENT ON EXTENSION pg_trgm IS 'Enables trigram matching for fuzzy text search (ILIKE performance boost)';

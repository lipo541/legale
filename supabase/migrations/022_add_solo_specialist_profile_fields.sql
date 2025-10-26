-- Add comprehensive profile fields for SOLO_SPECIALIST users
-- These fields enable rich profile pages similar to company profiles

-- Add slug field (URL-friendly identifier)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- Add role/title field
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS role_title TEXT;

-- Add languages (JSON array)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS languages JSONB DEFAULT '[]'::jsonb;

-- Add bio field
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS bio TEXT;

-- Add philosophy field
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS philosophy TEXT;

-- Add focus areas (JSON array of strings)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS focus_areas JSONB DEFAULT '[]'::jsonb;

-- Add representative matters (JSON array of strings)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS representative_matters JSONB DEFAULT '[]'::jsonb;

-- Add teaching, writing & speaking
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS teaching_writing_speaking TEXT;

-- Add credentials & memberships (JSON array of strings)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS credentials_memberships JSONB DEFAULT '[]'::jsonb;

-- Add values & how we work (JSON object with key-value pairs)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS values_how_we_work JSONB DEFAULT '{}'::jsonb;

-- Create index on slug for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_slug ON profiles(slug);

-- Add comments for documentation
COMMENT ON COLUMN profiles.slug IS 'URL-friendly identifier for specialist profile pages';
COMMENT ON COLUMN profiles.role_title IS 'Professional role/title (e.g., "Senior Legal Counsel")';
COMMENT ON COLUMN profiles.languages IS 'JSON array of languages spoken (e.g., ["English", "Georgian", "Russian"])';
COMMENT ON COLUMN profiles.bio IS 'Brief professional biography';
COMMENT ON COLUMN profiles.philosophy IS 'Professional philosophy and approach';
COMMENT ON COLUMN profiles.focus_areas IS 'JSON array of practice focus areas';
COMMENT ON COLUMN profiles.representative_matters IS 'JSON array of notable case examples';
COMMENT ON COLUMN profiles.teaching_writing_speaking IS 'Teaching engagements, publications, speaking topics';
COMMENT ON COLUMN profiles.credentials_memberships IS 'JSON array of professional credentials and memberships';
COMMENT ON COLUMN profiles.values_how_we_work IS 'JSON object describing work values and approach';

-- Note: avatar_url field already exists and will be used for profile images
-- Note: company_slug already exists but will be NULL for SOLO_SPECIALIST users

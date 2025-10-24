-- Add company_slug column to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS company_slug TEXT;

-- Add unique constraint for company_slug (only for non-null values)
CREATE UNIQUE INDEX IF NOT EXISTS profiles_company_slug_unique 
ON profiles (company_slug) 
WHERE company_slug IS NOT NULL;

-- Add comment
COMMENT ON COLUMN profiles.company_slug IS 'URL-friendly slug for company profiles';

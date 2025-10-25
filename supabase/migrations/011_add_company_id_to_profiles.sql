-- Add company_id to profiles table for direct company-specialist relationship

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES profiles(id);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_company_id ON profiles(company_id);

-- Add comment
COMMENT ON COLUMN profiles.company_id IS 'Reference to company profile that this specialist belongs to';

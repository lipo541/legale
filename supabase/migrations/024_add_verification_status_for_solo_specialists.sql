-- Add verification status for SOLO_SPECIALIST profiles
-- This allows admins to verify solo specialists before they appear on the website

-- Add verification_status column
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'unverified'
  CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected'));

-- Add verification_requested_at timestamp
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS verification_requested_at TIMESTAMPTZ;

-- Add verification_reviewed_at timestamp
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS verification_reviewed_at TIMESTAMPTZ;

-- Add verification_reviewed_by (admin user ID)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS verification_reviewed_by UUID REFERENCES auth.users(id);

-- Add verification_notes (for admin comments)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS verification_notes TEXT;

-- Create index for faster queries on verification status
CREATE INDEX IF NOT EXISTS idx_profiles_verification_status 
ON profiles(verification_status) 
WHERE role = 'SOLO_SPECIALIST';

-- Create index for pending verifications
CREATE INDEX IF NOT EXISTS idx_profiles_pending_verification 
ON profiles(verification_requested_at) 
WHERE verification_status = 'pending';

-- Add comments for documentation
COMMENT ON COLUMN profiles.verification_status IS 'Verification status for SOLO_SPECIALIST: unverified, pending, verified, rejected';
COMMENT ON COLUMN profiles.verification_requested_at IS 'Timestamp when specialist requested verification';
COMMENT ON COLUMN profiles.verification_reviewed_at IS 'Timestamp when admin reviewed the verification request';
COMMENT ON COLUMN profiles.verification_reviewed_by IS 'Admin user ID who reviewed the verification';
COMMENT ON COLUMN profiles.verification_notes IS 'Admin notes about verification decision';

-- Update existing SOLO_SPECIALIST profiles to 'unverified' status
UPDATE profiles 
SET verification_status = 'unverified' 
WHERE role = 'SOLO_SPECIALIST' 
AND verification_status IS NULL;

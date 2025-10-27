-- Extend verification status support to SPECIALIST and COMPANY roles
-- Previously only SOLO_SPECIALIST had verification support

-- Create additional indexes for SPECIALIST role
CREATE INDEX IF NOT EXISTS idx_profiles_verification_status_specialist 
ON profiles(verification_status) 
WHERE role = 'SPECIALIST';

-- Create additional indexes for COMPANY role
CREATE INDEX IF NOT EXISTS idx_profiles_verification_status_company 
ON profiles(verification_status) 
WHERE role = 'COMPANY';

-- Create index for pending verifications for all roles
CREATE INDEX IF NOT EXISTS idx_profiles_pending_verification_all_roles 
ON profiles(verification_requested_at) 
WHERE verification_status = 'pending' AND role IN ('SOLO_SPECIALIST', 'SPECIALIST', 'COMPANY');

-- Update existing SPECIALIST profiles to 'unverified' status if null
UPDATE profiles 
SET verification_status = 'unverified' 
WHERE role = 'SPECIALIST' 
AND verification_status IS NULL;

-- Update existing COMPANY profiles to 'unverified' status if null
UPDATE profiles 
SET verification_status = 'unverified' 
WHERE role = 'COMPANY' 
AND verification_status IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN profiles.verification_status IS 'Verification status for SOLO_SPECIALIST, SPECIALIST, and COMPANY roles: unverified, pending, verified, rejected';

-- Drop existing restrictive policies for SUPER_ADMIN if they exist
DROP POLICY IF EXISTS "Super admins can view all verification requests" ON profiles;
DROP POLICY IF EXISTS "Super admins can update verification status for all roles" ON profiles;
DROP POLICY IF EXISTS "Super admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Super admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Super admins can delete profiles" ON profiles;

-- Create comprehensive SUPER_ADMIN policy - full access to everything
CREATE POLICY "Super admins have full access to all profiles" 
ON profiles 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'SUPER_ADMIN'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'SUPER_ADMIN'
  )
);

-- RLS Policies for verification requests by users

-- Policy: Users with SPECIALIST role can request verification
CREATE POLICY "Specialists can request verification" 
ON profiles 
FOR UPDATE 
USING (
  auth.uid() = id 
  AND role = 'SPECIALIST'
  AND verification_status IN ('unverified', 'rejected')
)
WITH CHECK (
  auth.uid() = id 
  AND role = 'SPECIALIST'
  AND verification_status = 'pending'
);

-- Policy: Users with COMPANY role can request verification
CREATE POLICY "Companies can request verification" 
ON profiles 
FOR UPDATE 
USING (
  auth.uid() = id 
  AND role = 'COMPANY'
  AND verification_status IN ('unverified', 'rejected')
)
WITH CHECK (
  auth.uid() = id 
  AND role = 'COMPANY'
  AND verification_status = 'pending'
);

-- Ensure SOLO_SPECIALIST can read their own profile
-- This policy should already exist from migration 001, but we verify it works for SOLO_SPECIALIST

-- Check if there are any blocking policies
-- The "Users can view their own profile" policy should cover SOLO_SPECIALIST too

-- Drop and recreate if needed
DROP POLICY IF EXISTS "SOLO_SPECIALIST can view own profile" ON profiles;

-- Add explicit policy for SOLO_SPECIALIST for clarity
CREATE POLICY "SOLO_SPECIALIST can view own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id 
    AND role = 'SOLO_SPECIALIST'
  );

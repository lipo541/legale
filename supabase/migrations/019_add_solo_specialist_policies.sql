-- Add RLS policies for SOLO_SPECIALIST role
-- SOLO_SPECIALIST users get the same permissions as SPECIALIST users
-- The difference is organizational: SOLO_SPECIALIST has no company_id

-- Allow SOLO_SPECIALIST to view their own profile
-- (This policy already exists for all users, but we document it here for clarity)
CREATE POLICY "Solo specialists can view own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id 
    AND role = 'SOLO_SPECIALIST'
  );

-- Allow SOLO_SPECIALIST to update their own profile
CREATE POLICY "Solo specialists can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = id 
    AND role = 'SOLO_SPECIALIST'
  );

-- Note: Additional policies for services, requests, etc. will be added as needed
-- SOLO_SPECIALIST should have access to create and manage their own:
-- - Services (when service tables are fully implemented)
-- - Client requests
-- - Availability calendar
-- - Reviews and ratings

COMMENT ON TABLE profiles IS 'User profiles with roles: USER, AUTHOR, SPECIALIST (company-affiliated), SOLO_SPECIALIST (independent), COMPANY, SUPER_ADMIN, MODERATOR';

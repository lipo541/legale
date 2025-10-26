-- Add SOLO_SPECIALIST role to profiles table
-- SOLO_SPECIALIST: Independent legal specialist not affiliated with any company
-- This role is automatically assigned when a specialist registers without selecting a company

-- Drop existing role constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Add new constraint with SOLO_SPECIALIST role
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('USER', 'AUTHOR', 'SPECIALIST', 'SOLO_SPECIALIST', 'COMPANY', 'SUPER_ADMIN', 'MODERATOR'));

-- Update comment to reflect the new role
COMMENT ON COLUMN profiles.role IS 'User role: USER (default), AUTHOR (content creator), SPECIALIST (company-affiliated specialist), SOLO_SPECIALIST (independent specialist), COMPANY (company account), SUPER_ADMIN (full access), MODERATOR (content moderation)';

-- Note: SOLO_SPECIALIST users will have the same permissions as SPECIALIST users in RLS policies
-- The distinction is organizational: SOLO_SPECIALIST has no company_id, while SPECIALIST has a company_id

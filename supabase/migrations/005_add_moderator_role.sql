-- Add MODERATOR role and remove ADMIN role from profiles table
-- This migration adds the MODERATOR role and removes the ADMIN role (SUPER_ADMIN is sufficient)

-- First, drop the existing constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Add the new constraint with MODERATOR role included and ADMIN role removed
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('USER', 'AUTHOR', 'SPECIALIST', 'COMPANY', 'SUPER_ADMIN', 'MODERATOR'));

-- Add a comment to document the change
COMMENT ON COLUMN profiles.role IS 'User role: USER, AUTHOR, SPECIALIST, COMPANY, SUPER_ADMIN, MODERATOR (ADMIN role removed - SUPER_ADMIN is sufficient)';


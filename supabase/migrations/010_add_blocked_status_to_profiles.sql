-- Add is_blocked field to profiles table for company to block/unblock specialists

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT false;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_is_blocked ON profiles(is_blocked);

-- Add comment
COMMENT ON COLUMN profiles.is_blocked IS 'Whether the user is blocked (cannot access platform)';

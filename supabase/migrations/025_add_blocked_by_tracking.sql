-- Add blocked_by field to track who blocked the user
-- This enables hierarchical blocking: SUPER_ADMIN blocks cannot be unblocked by companies

-- Add blocked_by field (stores ID of who blocked, or 'SUPER_ADMIN' for admin blocks)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS blocked_by UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- Add blocked_at timestamp
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS blocked_at TIMESTAMPTZ;

-- Add block_reason field
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS block_reason TEXT;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_blocked_by ON profiles(blocked_by);

-- Add comments
COMMENT ON COLUMN profiles.blocked_by IS 'ID of user who blocked this profile (NULL if not blocked)';
COMMENT ON COLUMN profiles.blocked_at IS 'Timestamp when the user was blocked';
COMMENT ON COLUMN profiles.block_reason IS 'Reason for blocking the user';

-- Migration: Copy existing is_blocked data to blocked_by
-- For existing blocked users, we don't know who blocked them, so we set to NULL
-- The is_blocked column will be kept for backward compatibility but deprecated

-- Note: is_blocked will still be used for quick checks, but blocked_by is the source of truth
-- Logic: is_blocked = (blocked_by IS NOT NULL)

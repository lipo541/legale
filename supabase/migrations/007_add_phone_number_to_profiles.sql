-- Add phone_number column to profiles table
-- This migration adds phone_number field for user contact information

-- Add phone_number column
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS phone_number TEXT;

-- Add index for phone number searches
CREATE INDEX IF NOT EXISTS idx_profiles_phone_number ON profiles(phone_number);

-- Add comment
COMMENT ON COLUMN profiles.phone_number IS 'User phone number for contact purposes';

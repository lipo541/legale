-- Add info_activate column to profiles table
-- This controls whether specialist's real contact info is shown or static placeholder info

-- Check if column exists before adding
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'info_activate'
    ) THEN
        ALTER TABLE profiles ADD COLUMN info_activate BOOLEAN NOT NULL DEFAULT false;
    END IF;
END $$;

-- Add comment
COMMENT ON COLUMN profiles.info_activate IS 'When true, show real contact info. When false, show static placeholder info.';

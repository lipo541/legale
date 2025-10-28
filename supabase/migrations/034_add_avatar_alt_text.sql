-- Add avatar alt text support for multilingual accessibility
-- Georgian alt text is stored in profiles table
-- English and Russian translations are stored in specialist_translations table

-- Add to profiles table (for Georgian/default language)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS avatar_alt_text TEXT;

-- Add to specialist_translations table (for English and Russian)
ALTER TABLE specialist_translations
ADD COLUMN IF NOT EXISTS avatar_alt_text TEXT;

-- Add comments
COMMENT ON COLUMN profiles.avatar_alt_text IS 'Profile image alt text for accessibility (Georgian/default language)';
COMMENT ON COLUMN specialist_translations.avatar_alt_text IS 'Profile image alt text for accessibility (translated)';

-- Add SEO and Social media fields to profiles table for companies (Georgian language)
-- These fields will store the Georgian/default language content

-- Add SEO fields if they don't exist
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS meta_title TEXT,
ADD COLUMN IF NOT EXISTS meta_description TEXT,
ADD COLUMN IF NOT EXISTS meta_keywords TEXT;

-- Add Social media fields if they don't exist
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS social_title TEXT,
ADD COLUMN IF NOT EXISTS social_description TEXT,
ADD COLUMN IF NOT EXISTS social_hashtags TEXT,
ADD COLUMN IF NOT EXISTS social_image_url TEXT;

-- Add avatar alt text if it doesn't exist (already added in migration 034, but safe to check)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS avatar_alt_text TEXT;

-- Add comments
COMMENT ON COLUMN profiles.meta_title IS 'SEO meta title (Georgian/default language)';
COMMENT ON COLUMN profiles.meta_description IS 'SEO meta description (Georgian/default language)';
COMMENT ON COLUMN profiles.meta_keywords IS 'SEO keywords (Georgian/default language)';
COMMENT ON COLUMN profiles.social_title IS 'Social media title (Georgian/default language)';
COMMENT ON COLUMN profiles.social_description IS 'Social media description (Georgian/default language)';
COMMENT ON COLUMN profiles.social_hashtags IS 'Social media hashtags (Georgian/default language)';
COMMENT ON COLUMN profiles.social_image_url IS 'Social media image URL (Georgian/default language)';

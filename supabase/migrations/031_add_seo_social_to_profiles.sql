-- Add SEO and Social Media fields to profiles table for Georgian language
-- These fields will store the Georgian (default language) SEO and social metadata
-- English and Russian translations are stored in specialist_translations table

-- Add SEO fields
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS seo_title TEXT,
ADD COLUMN IF NOT EXISTS seo_description TEXT,
ADD COLUMN IF NOT EXISTS seo_keywords TEXT;

-- Add Social Media fields
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS social_title TEXT,
ADD COLUMN IF NOT EXISTS social_description TEXT,
ADD COLUMN IF NOT EXISTS social_hashtags TEXT,
ADD COLUMN IF NOT EXISTS social_image_url TEXT;

-- Add comments for documentation
COMMENT ON COLUMN profiles.seo_title IS 'SEO meta title (Georgian/default language)';
COMMENT ON COLUMN profiles.seo_description IS 'SEO meta description (Georgian/default language)';
COMMENT ON COLUMN profiles.seo_keywords IS 'SEO keywords comma-separated (Georgian/default language)';
COMMENT ON COLUMN profiles.social_title IS 'Social media share title (Georgian/default language)';
COMMENT ON COLUMN profiles.social_description IS 'Social media share description (Georgian/default language)';
COMMENT ON COLUMN profiles.social_hashtags IS 'Social media hashtags (Georgian/default language)';
COMMENT ON COLUMN profiles.social_image_url IS 'Social media share image URL (Georgian/default language) - path in specialist-social-images bucket';

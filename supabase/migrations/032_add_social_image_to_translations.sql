-- Add social_image_url to specialist_translations table
-- This allows each language to have its own social media share image

ALTER TABLE specialist_translations
ADD COLUMN IF NOT EXISTS social_image_url TEXT;

-- Add comment
COMMENT ON COLUMN specialist_translations.social_image_url IS 'Social media share image URL for this language - path in specialist-social-images bucket';

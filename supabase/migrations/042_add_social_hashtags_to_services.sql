ALTER TABLE service_translations
ADD COLUMN social_hashtags TEXT;

COMMENT ON COLUMN service_translations.social_hashtags IS 'Social media hashtags for this language';

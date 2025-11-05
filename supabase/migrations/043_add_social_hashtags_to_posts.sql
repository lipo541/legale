ALTER TABLE post_translations
ADD COLUMN social_hashtags TEXT;

COMMENT ON COLUMN post_translations.social_hashtags IS 'Social media hashtags for this language';

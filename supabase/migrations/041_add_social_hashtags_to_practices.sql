ALTER TABLE practice_translations
ADD COLUMN social_hashtags TEXT;

COMMENT ON COLUMN practice_translations.social_hashtags IS 'Social media hashtags for this language';

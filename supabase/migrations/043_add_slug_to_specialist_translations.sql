-- Add slug field to specialist_translations table
-- This allows each language version to have its own URL-friendly slug

ALTER TABLE specialist_translations 
ADD COLUMN IF NOT EXISTS slug TEXT;

-- Create unique index to ensure slug is unique per language
CREATE UNIQUE INDEX IF NOT EXISTS idx_specialist_translations_slug_language 
ON specialist_translations(slug, language) 
WHERE slug IS NOT NULL;

-- Create index for faster slug lookups
CREATE INDEX IF NOT EXISTS idx_specialist_translations_slug 
ON specialist_translations(slug) 
WHERE slug IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN specialist_translations.slug IS 'URL-friendly identifier for specialist profile pages (per language)';

-- Note: After running this migration, you need to populate the slug values
-- for existing specialist translations through the admin panel or with a data migration

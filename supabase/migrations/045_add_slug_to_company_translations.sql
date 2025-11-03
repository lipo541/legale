-- Add slug field to company_translations table for multi-language URL support
-- Georgian slug is stored in profiles.company_slug
-- English and Russian slugs are stored here

ALTER TABLE company_translations 
ADD COLUMN IF NOT EXISTS slug TEXT;

-- Create unique index to ensure slug is unique per language
CREATE UNIQUE INDEX IF NOT EXISTS idx_company_translations_slug_language 
ON company_translations(slug, language) 
WHERE slug IS NOT NULL;

-- Create index for faster slug lookups
CREATE INDEX IF NOT EXISTS idx_company_translations_slug 
ON company_translations(slug) 
WHERE slug IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN company_translations.slug IS 'URL-friendly identifier for company pages (English and Russian only)';

-- Note: Georgian slug is stored in profiles.company_slug
-- This migration only adds slug support for en and ru languages

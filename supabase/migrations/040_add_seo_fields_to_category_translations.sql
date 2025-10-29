-- ============================================
-- ADD SEO FIELDS TO POST_CATEGORY_TRANSLATIONS
-- Migration to add SEO title and description for category pages
-- ============================================

-- Step 1: Add seo_title column
ALTER TABLE post_category_translations 
ADD COLUMN IF NOT EXISTS seo_title TEXT;

-- Step 2: Add seo_description column
ALTER TABLE post_category_translations 
ADD COLUMN IF NOT EXISTS seo_description TEXT;

-- Step 3: Add comments for clarity
COMMENT ON COLUMN post_category_translations.seo_title IS 'SEO optimized title for category page meta tags';
COMMENT ON COLUMN post_category_translations.seo_description IS 'SEO optimized description for category page meta tags';

-- ============================================
-- UPDATE EXISTING CATEGORIES WITH DEFAULT SEO
-- ============================================

-- Auto-populate seo_title from name if not set (optional)
UPDATE post_category_translations
SET seo_title = name || ' - Legale'
WHERE seo_title IS NULL OR seo_title = '';

-- Auto-populate seo_description from description if available (optional)
UPDATE post_category_translations
SET seo_description = description
WHERE seo_description IS NULL OR seo_description = ''
  AND description IS NOT NULL;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE 'Successfully added SEO fields to post_category_translations table';
  RAISE NOTICE 'Columns added: seo_title, seo_description';
END $$;
